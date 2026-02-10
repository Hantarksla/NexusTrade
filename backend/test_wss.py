import asyncio
import os
import json
import ssl
from binance import AsyncClient, BinanceSocketManager

async def test_connectivity():
    print(">>> [TEST] Starting Raw Binance.US WSS Test...")
    # 這裡我們明確測試兩種連線方式
    try:
        client = await AsyncClient.create(tld='us', requests_params={'ssl': False})
        bm = BinanceSocketManager(client)
        # 訂閱 K 線
        ts = bm.kline_socket(symbol='BTCUSDT', interval='1m')
        
        print(">>> [TEST] Handshake initiated, waiting for data (timeout 30s)...")
        async with ts as tscm:
            # 嘗試接收 3 筆數據來證明穩定性
            count = 0
            while count < 3:
                try:
                    res = await asyncio.wait_for(tscm.recv(), timeout=10.0)
                    if res:
                        count += 1
                        print(f">>> [SUCCESS] Received #{count} Price: {res['k']['c']}")
                except asyncio.TimeoutError:
                    print(">>> [FAILURE] Timeout: No data received for 10s.")
                    break
        
        await client.close_connection()
    except Exception as e:
        print(f">>> [CRITICAL ERROR] Connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_connectivity())
