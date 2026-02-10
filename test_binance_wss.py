"""
NexusTrade AI - Binance 連線與自動切換測試
測試 MarketDataProvider 的多層次備援機制
"""
import asyncio
import json
import sys
import time
from typing import Optional, Callable

try:
    from binance import AsyncClient, BinanceSocketManager
    import requests
except ImportError:
    print(">>> [錯誤] 找不到必要的庫。")
    print(">>> 請確保您已進入後端虛擬環境並安裝依賴:")
    print("    source backend/venv/bin/activate")
    print("    pip install python-binance requests")
    sys.exit(1)


class TestMarketDataProvider:
    """
    測試版的 MarketDataProvider
    實現多層次備援: Global WSS -> US WSS -> REST Polling
    """
    def __init__(self, tld: str = 'us'):
        self.tld = tld
        self.symbol = "BTCUSDT"
        self.interval = "1m"
        self.is_running = False
        self.current_mode = "INIT"
        
        # WebSocket 相關
        self.client: Optional[AsyncClient] = None
        self.wss_manager: Optional[BinanceSocketManager] = None
        
        # REST 輪詢設定
        self.rest_interval = 1.0  # 秒
        
        # 狀態控制
        self.wss_failure_count = 0
        self.max_wss_retries = 1  # 失敗一次直接切換
        self.update_count = 0
        
    async def start(self):
        """啟動數據流"""
        self.is_running = True
        print(f"\n{'='*70}")
        print(f"  NexusTrade AI - 市場數據提供者測試")
        print(f"{'='*70}")
        print(f">>> 交易對: {self.symbol}")
        print(f">>> 時間間隔: {self.interval}")
        print(f">>> 初始 TLD: {self.tld}")
        print(f"{'-'*70}\n")
        
        await self._main_loop()
    
    async def _main_loop(self):
        """核心循環:決定使用 WSS 還是 REST"""
        while self.is_running:
            try:
                # 嘗試使用 WebSocket
                if self.wss_failure_count < self.max_wss_retries:
                    self.current_mode = "WSS"
                    print(f"\n🔄 [模式切換] 嘗試啟動 WebSocket 連線 (TLD: {self.tld})...")
                    success = await self._run_websocket()
                    
                    if not success:
                        self.wss_failure_count += 1
                        print(f"⚠️  WebSocket 連線失敗或中斷 ({self.wss_failure_count}/{self.max_wss_retries})")
                        
                        # 如果是 US 失敗,嘗試切換到 Global
                        if self.tld == 'us' and self.wss_failure_count < self.max_wss_retries:
                            print(f"\n🌐 [備援策略] 切換到 Binance Global (COM)...")
                            self.tld = 'com'
                            self.wss_failure_count = 0  # 重置計數器給 Global 一次機會
                        
                        await asyncio.sleep(1)
                    else:
                        self.wss_failure_count = 0
                else:
                    # WebSocket 嘗試次數過多,切換到 REST 模式
                    if self.current_mode != "REST":
                        self.current_mode = "REST"
                        print(f"\n🔴 [模式切換] WSS 不穩定，切換至 REST API 高頻輪詢模式 (Fallback)")
                    
                    await self._run_rest_polling()
                    
            except KeyboardInterrupt:
                print("\n\n>>> 用戶中斷測試")
                self.is_running = False
                break
            except Exception as e:
                print(f"❌ Main Loop Error: {e}")
                await asyncio.sleep(5)
    
    async def _run_websocket(self) -> bool:
        """執行 WebSocket 連線"""
        try:
            # 初始化 client - 使用正確的 session_params 配置
            import aiohttp
            connector = aiohttp.TCPConnector(ssl=False)
            
            self.client = await AsyncClient.create(
                tld=self.tld,
                session_params={'connector': connector}
            )
            
            # 建立 Socket Manager
            self.wss_manager = BinanceSocketManager(self.client)
            ts = self.wss_manager.kline_socket(symbol=self.symbol, interval=self.interval)
            
            # 設定連線超時
            try:
                tscm = await asyncio.wait_for(ts.__aenter__(), timeout=5.0)
            except asyncio.TimeoutError:
                print("❌ WebSocket 連線建立超時 (5s)")
                await self.client.close_connection()
                return False
            
            try:
                print(f"✅ WebSocket 握手成功 (wss://stream.binance.{self.tld})")
                print(f"⏳ 等待數據推送...\n")
                
                while self.is_running:
                    try:
                        # 設定數據接收超時 (8秒)
                        res = await asyncio.wait_for(tscm.recv(), timeout=8.0)
                        
                        if res:
                            self._process_kline_data(res)
                        
                    except asyncio.TimeoutError:
                        print("❌ WebSocket 數據超時 (8s 無數據)，判定為連線假死")
                        return False
                    except Exception as inner_e:
                        print(f"❌ WebSocket 接收錯誤: {inner_e}")
                        return False
            finally:
                await ts.__aexit__(None, None, None)
                await self.client.close_connection()

            return True

        except Exception as e:
            print(f"❌ WebSocket 啟動失敗: {e}")
            if self.client:
                await self.client.close_connection()
            return False
    
    async def _run_rest_polling(self):
        """執行 REST 輪詢 (Fallback 模式)"""
        url = f"https://api.binance.{self.tld}/api/v3/klines"
        params = {
            'symbol': self.symbol,
            'interval': self.interval,
            'limit': 1
        }
        
        print(f"📡 REST API: {url}")
        print(f"🔄 輪詢間隔: {self.rest_interval}s\n")
        
        while self.is_running and self.wss_failure_count >= self.max_wss_retries:
            try:
                start_time = time.time()
                
                response = requests.get(url, params=params, timeout=5, verify=False)
                latency = (time.time() - start_time) * 1000
                
                if response.status_code == 200:
                    klines = response.json()
                    if klines and len(klines) > 0:
                        kline = klines[0]
                        self.update_count += 1
                        
                        # 格式化輸出
                        close_price = float(kline[4])
                        volume = float(kline[5])
                        print(f"[{self.update_count:04d}] 💰 價格: \033[1;32m{close_price:,.2f}\033[0m USDT | "
                              f"📊 成交量: {volume:.4f} | ⚡ 延遲: {latency:.0f}ms")
                else:
                    print(f"❌ HTTP {response.status_code}")
                
                # 保持穩定的輪詢間隔
                elapsed = time.time() - start_time
                sleep_time = max(0.1, self.rest_interval - elapsed)
                await asyncio.sleep(sleep_time)
                
            except KeyboardInterrupt:
                raise
            except Exception as e:
                print(f"❌ REST Polling Error: {e}")
                await asyncio.sleep(self.rest_interval)
    
    def _process_kline_data(self, msg):
        """處理 K 線數據"""
        if msg.get('e') == 'kline':
            k = msg['k']
            self.update_count += 1
            
            close_price = float(k['c'])
            volume = float(k['v'])
            is_closed = k['x']
            
            status = "🔒 已結束" if is_closed else "🔄 更新中"
            
            print(f"[{self.update_count:04d}] 💰 價格: \033[1;32m{close_price:,.2f}\033[0m USDT | "
                  f"📊 成交量: {volume:.4f} | {status}")


async def main():
    """主測試函數"""
    print("\n請選擇初始線路:")
    print("1. Binance.US (美國)")
    print("2. Binance.COM (全球)")
    choice = input("輸入序號 (預設 1): ").strip() or "1"
    
    tld = 'com' if choice == '2' else 'us'
    
    provider = TestMarketDataProvider(tld=tld)
    
    try:
        await provider.start()
    except KeyboardInterrupt:
        print("\n\n>>> 測試結束")
        provider.is_running = False


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
