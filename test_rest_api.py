"""
簡單的 REST API 測試腳本
直接調用 Binance REST API 獲取最新價格,驗證數據是否正確變化
"""
import requests
import time
import json

def test_binance_rest_api():
    """測試 Binance REST API 是否返回正確的實時數據"""
    
    print("="*70)
    print("  Binance REST API 測試 - 驗證價格數據")
    print("="*70)
    print()
    
    # 測試兩個不同的 API endpoint
    endpoints = {
        'US': 'https://api.binance.us/api/v3/klines',
        'Global': 'https://api.binance.com/api/v3/klines'
    }
    
    # 選擇 endpoint
    print("選擇 API:")
    print("1. Binance.COM (Global) - 推薦,交易量大")
    print("2. Binance.US")
    choice = input("輸入序號 (預設 1): ").strip() or "1"
    
    endpoint_key = 'US' if choice == '2' else 'Global'
    url = endpoints[endpoint_key]
    
    print(f"\n使用 API: {url}")
    print(f"交易對: BTCUSDT")
    print(f"時間間隔: 1m")
    print(f"獲取數量: 最新 1 根 K 線")
    print("-"*70)
    print()
    
    params = {
        'symbol': 'BTCUSDT',
        'interval': '1m',
        'limit': 1
    }
    
    previous_close = None
    update_count = 0
    
    try:
        while True:
            try:
                # 發送請求
                start_time = time.time()
                response = requests.get(url, params=params, timeout=5, verify=False)
                latency = (time.time() - start_time) * 1000
                
                if response.status_code == 200:
                    klines = response.json()
                    
                    if klines and len(klines) > 0:
                        kline = klines[0]
                        
                        # 解析 K 線數據
                        # [0] = 開盤時間, [1] = 開盤價, [2] = 最高價, [3] = 最低價, 
                        # [4] = 收盤價, [5] = 成交量
                        open_time = kline[0]
                        open_price = float(kline[1])
                        high_price = float(kline[2])
                        low_price = float(kline[3])
                        close_price = float(kline[4])
                        volume = float(kline[5])
                        
                        update_count += 1
                        
                        # 檢查價格是否變化
                        if previous_close is not None:
                            price_change = close_price - previous_close
                            change_indicator = "📈" if price_change > 0 else "📉" if price_change < 0 else "➡️"
                        else:
                            price_change = 0
                            change_indicator = "🆕"
                        
                        # 格式化輸出
                        print(f"[{update_count:04d}] {change_indicator} "
                              f"收盤價: \033[1;32m${close_price:,.2f}\033[0m | "
                              f"開盤: ${open_price:,.2f} | "
                              f"最高: ${high_price:,.2f} | "
                              f"最低: ${low_price:,.2f} | "
                              f"成交量: {volume:.4f} | "
                              f"變化: {price_change:+.2f} | "
                              f"延遲: {latency:.0f}ms")
                        
                        previous_close = close_price
                else:
                    print(f"❌ HTTP {response.status_code}")
                
            except requests.exceptions.RequestException as e:
                print(f"❌ 請求失敗: {e}")
            
            # 等待 1 秒
            time.sleep(1)
            
    except KeyboardInterrupt:
        print("\n\n>>> 測試結束")
        print(f"總共獲取了 {update_count} 次更新")

if __name__ == "__main__":
    # 禁用 SSL 警告
    import urllib3
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
    
    test_binance_rest_api()
