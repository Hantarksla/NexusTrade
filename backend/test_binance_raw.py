import asyncio
import os
from binance import AsyncClient, BinanceSocketManager

async def main():
    print("Testing RAW Binance.US Connectivity...")
    client = await AsyncClient.create(tld='us', requests_params={'ssl': False})
    bm = BinanceSocketManager(client)
    ts = bm.kline_socket(symbol='BTCUSDT', interval='1m')
    
    async with ts as tscm:
        print("Waiting for first kline...")
        for _ in range(5):
            res = await tscm.recv()
            print(f"RECEIVED: {res['k']['c']}")
            
    await client.close_connection()

if __name__ == "__main__":
    asyncio.run(main())
