import asyncio
import time
from typing import Callable, Optional
from binance import AsyncClient, BinanceSocketManager
from .binance_service import BinanceManager
from utils.logger import logger

class MarketDataProvider:
    """
    智慧型市場數據提供者 (Smart Market Data Provider)
    
    核心功能：
    1. 統一數據接口：對外只暴露 start_stream()，內部自動處理連線源。
    2. 多層級備援 (Failover)：
       - Level 1: WebSocket (優先，延遲最低)
       - Level 2: REST Polling (兜底，1秒/次，穩定性最高)
    3. 自動癒合 (Self-Healing)：
       - 在 REST 模式下，會定期嘗試重連 WebSocket。
    """
    
    def __init__(self, tld: str = 'us'):
        self.tld = tld
        self.symbol = "BTCUSDT"
        self.interval = "1m"
        self.callback: Optional[Callable] = None
        self.is_running = False
        self.current_mode = "INIT"  # "WSS", "REST", "INIT"
        
        # 依賴服務
        self.binance_mgr = BinanceManager(tld=self.tld)
        self.wss_manager: Optional[BinanceSocketManager] = None
        self.wss_conn = None
        
        # REST 輪詢設定
        self.rest_interval = 1.0  # 秒
        self.last_kline_time = 0
        
        # 狀態控制
        self.wss_failure_count = 0
        self.max_wss_retries = 1 # 失敗一次直接切換，不浪費時間
        self.retry_delay = 5  # 秒

    async def initialize(self):
        """初始化底層 BinanceManager"""
        await self.binance_mgr.initialize()

    async def start_stream(self, callback: Callable):
        """啟動數據流 (非阻塞)"""
        if self.is_running:
            logger.warning("MarketDataProvider is already running.")
            return

        self.callback = callback
        self.is_running = True
        
        # 啟動主循環任務
        asyncio.create_task(self._main_loop())
        logger.info(f"MarketDataProvider started for {self.symbol} ({self.tld.upper()})")

    async def stop(self):
        """停止數據流"""
        self.is_running = False
        if self.binance_mgr.client:
            await self.binance_mgr.close()
        logger.info("MarketDataProvider stopped.")

    async def _main_loop(self):
        """
        核心循環：決定使用 WSS 還是 REST
        """
        while self.is_running:
            try:
                # 嘗試使用 WebSocket
                if self.wss_failure_count < self.max_wss_retries:
                    self.current_mode = "WSS"
                    logger.info(f">>> [Mode Switch] 嘗試啟動 WebSocket 連線 (由 {self.tld} 提供)...")
                    success = await self._run_websocket()
                    
                    if not success:
                        self.wss_failure_count += 1
                        logger.warning(f"WebSocket 連線失敗或中斷 ({self.wss_failure_count}/{self.max_wss_retries})")
                        await asyncio.sleep(1) # 短暫冷卻
                    else:
                        # 如果成功運行並正常結束 (例如被用戶停止)，重置計數
                        self.wss_failure_count = 0
                else:
                    # WebSocket 嘗試次數過多，切換到 REST 模式
                    if self.current_mode != "REST":
                        self.current_mode = "REST"
                        logger.warning(">>> [Mode Switch] WSS 不穩定，切換至 REST API 高頻輪詢模式 (Fallback)")
                    else:
                        logger.debug(f"REST 模式繼續運行... (failure_count={self.wss_failure_count})")
                    
                    await self._run_rest_polling()
                    
                    # 運行一陣子 REST 後，嘗試重置計數器以重試 WSS (Self-Healing)
                    # 這裡簡單設定：每跑 60 秒 REST，就給 WSS 一次機會
                    # 實際應用可根據需求調整
                    await asyncio.sleep(10) 
                    # 恢復一次嘗試機會
                    # self.wss_failure_count = 0 
                    # 目前為了穩定，先不自動切回 WSS，除非重啟。
                    # 若要自動切回，可取消註解上面那行。
                    
            except UnicodeError as ue:
                 # 特殊處理 SSL 相關編碼錯誤，通常發生在網路攔截
                 logger.error(f"SSL/Network Environment Error: {ue}")
                 self.wss_failure_count = self.max_wss_retries # 直接判死刑，切 REST
            except Exception as e:
                logger.error(f"Main Loop Error: {e}")
                await asyncio.sleep(5)

    async def _run_websocket(self) -> bool:
        """
        執行 WebSocket 連線 (使用 Multiplex Stream 同時訂閱 Ticker 和 Kline)
        Returns: True (正常結束), False (異常中斷)
        """
        try:
            # 確保 client 初始化
            if not self.binance_mgr.client:
                await self.binance_mgr.initialize()

            # 建立 Socket Manager
            self.wss_manager = BinanceSocketManager(self.binance_mgr.client)
            
            # 使用 Multiplex Stream 訂閱多個數據流
            streams = [
                f"{self.symbol.lower()}@ticker",      # 實時價格與 24h 統計
                f"{self.symbol.lower()}@kline_{self.interval}"  # 圖表數據
            ]
            ts = self.wss_manager.multiplex_socket(streams=streams)

            # [關鍵修復] 為連線建立過程加上強制超時
            try:
                tscm = await asyncio.wait_for(ts.__aenter__(), timeout=5.0)
            except asyncio.TimeoutError:
                logger.error("WebSocket 連線建立超時 (5s)，切換備援。")
                return False
            
            try:
                logger.info(f"WebSocket 複合流握手成功 ({', '.join(streams)})，等待數據...")
                
                while self.is_running:
                    try:
                        # 複合流回傳格式: {'stream': '...', 'data': {...}}
                        res = await asyncio.wait_for(tscm.recv(), timeout=10.0)
                        
                        if res:
                            self._process_message_data(res)
                        
                    except asyncio.TimeoutError:
                        logger.error("WebSocket 數據超時 (10s 無數據)，判定為連線假死。")
                        return False 
                    except Exception as inner_e:
                        logger.error(f"WebSocket 接收錯誤: {inner_e}")
                        return False
            finally:
                # 確保退出時關閉 socket
                try:
                    await ts.__aexit__(None, None, None)
                except:
                    pass

            return True

        except Exception as e:
            logger.error(f"WebSocket 啟動失敗: {e}")
            return False

    async def _run_rest_polling(self):
        """
        執行 REST 輪詢 (Fallback 模式)
        同時模擬 Ticker 和 Kline 數據
        """
        logger.info(f">>> REST Polling 啟動: symbol={self.symbol}, interval={self.rest_interval}s")
        while self.is_running and self.wss_failure_count >= self.max_wss_retries:
            try:
                start_time = time.time()
                
                # 1. 獲取最新 Kline 數據
                kline = await self.binance_mgr.get_latest_kline(self.symbol, self.interval)
                
                if kline:
                    # 模擬 Kline Stream 格式
                    kline_payload = {
                        'stream': f"{self.symbol.lower()}@kline_{self.interval}",
                        'data': {
                            'e': 'kline',
                            's': self.symbol,
                            'k': {
                                't': kline['time'] * 1000,
                                'o': str(kline['open']),
                                'h': str(kline['high']),
                                'l': str(kline['low']),
                                'c': str(kline['close']),
                                'v': str(kline['volume']),
                                'x': False
                            }
                        }
                    }
                    self._process_message_data(kline_payload)

                    # 2. 模擬 Ticker Stream 格式 (嘗試獲取完整 24h 統計)
                    try:
                        ticker_data = await self.binance_mgr.client.get_ticker(symbol=self.symbol)
                        ticker_payload = {
                            'stream': f"{self.symbol.lower()}@ticker",
                            'data': {
                                'e': '24hrTicker',
                                's': self.symbol,
                                'c': ticker_data['lastPrice'],
                                'p': ticker_data['priceChange'],
                                'P': ticker_data['priceChangePercent'],
                                'o': ticker_data['openPrice'],
                                'h': ticker_data['highPrice'],
                                'l': ticker_data['lowPrice'],
                                'v': ticker_data['volume'],
                                'x': ticker_data['prevClosePrice'],
                                'b': ticker_data['bidPrice'],
                                'a': ticker_data['askPrice']
                            }
                        }
                    except Exception:
                        # Fallback to basic if full ticker fails
                        ticker_payload = {
                            'stream': f"{self.symbol.lower()}@ticker",
                            'data': {
                                'e': '24hrTicker',
                                's': self.symbol,
                                'c': str(kline['close']),
                                'p': '0.00',
                                'P': '0.00',
                                'o': str(kline['open']),
                                'h': str(kline['high']),
                                'l': str(kline['low']),
                                'v': str(kline['volume']),
                                'x': '0.00'
                            }
                        }
                    self._process_message_data(ticker_payload)
                
                # 計算剩餘時間
                elapsed = time.time() - start_time
                sleep_time = max(0.1, self.rest_interval - elapsed)
                await asyncio.sleep(sleep_time)
                
            except Exception as e:
                logger.error(f"REST Polling Error: {e}")
                await asyncio.sleep(self.rest_interval)

    def _process_message_data(self, res):
        """處理複合流訊息並回調"""
        if self.callback:
            # 直接將原始訊息丟回 callback，由 main.py 判斷類型與分發
            asyncio.create_task(self.callback(res))
