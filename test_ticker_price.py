"""
測試 Binance 實時 Ticker 價格 (24hr Price Change Statistics)
這是手機 App 顯示的實時價格
"""
import requests
import time

def test_ticker_price():
    """測試 Binance 24hr Ticker 價格 API"""
    
    print("="*70)
    print("  Binance 實時 Ticker 價格測試")
    print("  (這是您在手機 App 上看到的價格)")
    print("="*70)
    print()
    
    # API endpoints
    endpoints = {
        'US': 'https://api.binance.us/api/v3/ticker/24hr',
        'Global': 'https://api.binance.com/api/v3/ticker/24hr'
    }
    
    print("選擇 API:")
    print("1. Binance.COM (Global) - 推薦")
    print("2. Binance.US")
    choice = input("輸入序號 (預設 1): ").strip() or "1"
    
    endpoint_key = 'US' if choice == '2' else 'Global'
    url = endpoints[endpoint_key]
    
    print(f"\n使用 API: {url}")
    print(f"交易對: BTCUSDT")
    print("-"*70)
    print()
    
    params = {'symbol': 'BTCUSDT'}
    
    previous_price = None
    update_count = 0
    
    try:
        while True:
            try:
                start_time = time.time()
                response = requests.get(url, params=params, timeout=5, verify=False)
                latency = (time.time() - start_time) * 1000
                
                if response.status_code == 200:
                    ticker = response.json()
                    
                    # 解析 Ticker 數據
                    current_price = float(ticker['lastPrice'])
                    bid_price = float(ticker['bidPrice'])
                    ask_price = float(ticker['askPrice'])
                    volume_24h = float(ticker['volume'])
                    price_change_24h = float(ticker['priceChange'])
                    price_change_percent = float(ticker['priceChangePercent'])
                    high_24h = float(ticker['highPrice'])
                    low_24h = float(ticker['lowPrice'])
                    
                    update_count += 1
                    
                    # 檢查價格變化
                    if previous_price is not None:
                        price_change = current_price - previous_price
                        change_indicator = "📈" if price_change > 0 else "📉" if price_change < 0 else "➡️"
                    else:
                        price_change = 0
                        change_indicator = "🆕"
                    
                    # 格式化輸出
                    print(f"[{update_count:04d}] {change_indicator} "
                          f"最新價: \033[1;32m${current_price:,.2f}\033[0m | "
                          f"買價: ${bid_price:,.2f} | "
                          f"賣價: ${ask_price:,.2f} | "
                          f"24h漲跌: {price_change_percent:+.2f}% | "
                          f"24h成交量: {volume_24h:,.2f} BTC | "
                          f"變化: {price_change:+.2f} | "
                          f"延遲: {latency:.0f}ms")
                    
                    previous_price = current_price
                else:
                    print(f"❌ HTTP {response.status_code}: {response.text}")
                
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
    
    test_ticker_price()
