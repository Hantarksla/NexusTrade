"""
驗證 Binance API 端點
比較不同 API 的返回數據
"""
import requests
import json

def verify_binance_apis():
    """驗證 Binance 各個 API 端點"""
    
    print("="*70)
    print("  Binance API 端點驗證")
    print("="*70)
    print()
    
    # 選擇 API
    print("選擇 API:")
    print("1. Binance.COM (Global)")
    print("2. Binance.US")
    choice = input("輸入序號 (預設 1): ").strip() or "1"
    
    if choice == '2':
        base_url = 'https://api.binance.us'
        ws_url = 'wss://stream.binance.us:9443'
    else:
        base_url = 'https://api.binance.com'
        ws_url = 'wss://stream.binance.com:9443'
    
    print(f"\n使用 API: {base_url}")
    print(f"WebSocket: {ws_url}")
    print("-"*70)
    print()
    
    # 測試 1: 24hr Ticker (實時價格)
    print("📊 測試 1: 24hr Ticker API (手機 App 顯示的價格)")
    print(f"URL: {base_url}/api/v3/ticker/24hr?symbol=BTCUSDT")
    try:
        response = requests.get(f"{base_url}/api/v3/ticker/24hr", 
                              params={'symbol': 'BTCUSDT'}, 
                              timeout=5, 
                              verify=False)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ 成功!")
            print(f"   最新價格: ${float(data['lastPrice']):,.2f}")
            print(f"   24h 漲跌: {float(data['priceChangePercent']):+.2f}%")
            print(f"   24h 成交量: {float(data['volume']):,.2f} BTC")
        else:
            print(f"❌ 失敗: HTTP {response.status_code}")
            print(f"   {response.text}")
    except Exception as e:
        print(f"❌ 錯誤: {e}")
    
    print()
    
    # 測試 2: K 線數據
    print("📈 測試 2: K 線 API (圖表數據)")
    print(f"URL: {base_url}/api/v3/klines?symbol=BTCUSDT&interval=1m&limit=1")
    try:
        response = requests.get(f"{base_url}/api/v3/klines", 
                              params={'symbol': 'BTCUSDT', 'interval': '1m', 'limit': 1}, 
                              timeout=5, 
                              verify=False)
        if response.status_code == 200:
            data = response.json()
            if data and len(data) > 0:
                kline = data[0]
                print(f"✅ 成功!")
                print(f"   開盤價: ${float(kline[1]):,.2f}")
                print(f"   最高價: ${float(kline[2]):,.2f}")
                print(f"   最低價: ${float(kline[3]):,.2f}")
                print(f"   收盤價: ${float(kline[4]):,.2f}")
                print(f"   成交量: {float(kline[5]):,.4f} BTC")
        else:
            print(f"❌ 失敗: HTTP {response.status_code}")
            print(f"   {response.text}")
    except Exception as e:
        print(f"❌ 錯誤: {e}")
    
    print()
    
    # 測試 3: 最新價格 (簡化版)
    print("💰 測試 3: 最新價格 API (最簡單)")
    print(f"URL: {base_url}/api/v3/ticker/price?symbol=BTCUSDT")
    try:
        response = requests.get(f"{base_url}/api/v3/ticker/price", 
                              params={'symbol': 'BTCUSDT'}, 
                              timeout=5, 
                              verify=False)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ 成功!")
            print(f"   價格: ${float(data['price']):,.2f}")
        else:
            print(f"❌ 失敗: HTTP {response.status_code}")
            print(f"   {response.text}")
    except Exception as e:
        print(f"❌ 錯誤: {e}")
    
    print()
    print("="*70)
    print("總結:")
    print("- 24hr Ticker: 手機 App 顯示的實時價格,包含 24h 統計")
    print("- K 線: 用於繪製圖表,每分鐘更新一次")
    print("- 最新價格: 最簡單的價格查詢")
    print("="*70)

if __name__ == "__main__":
    import urllib3
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
    
    verify_binance_apis()
