import asyncio
import json
import ssl
from datetime import datetime
from binance import AsyncClient, BinanceSocketManager
from utils.logger import logger

# Bypass SSL verify for macOS developer environments
try:
    ssl._create_default_https_context = ssl._create_unverified_context
    logger.warning("SSL verification disabled for Binance connection (Development Mode)")
except Exception as e:
    logger.error(f"Failed to disable SSL verification: {e}")

class BinanceManager:
    """
    幣安數據管理器 (Binance Manager)
    負責管理與 Binance.US / Binance.com 的連接，拉取歷史 K 線並訂閱實時數據流。
    """
    def __init__(self, tld='us'):
        self.tld = tld
        self.client = None
        self.bm = None
        self.socket = None
        self._is_running = False
        self._on_kline_received = None

    async def initialize(self):
        """
        初始化異步客戶端
        """
        try:
            # aiohttp 需要使用 session_params 來配置 connector
            import aiohttp
            connector = aiohttp.TCPConnector(ssl=False)
            
            self.client = await AsyncClient.create(
                tld=self.tld,
                session_params={'connector': connector}
            )
            self.bm = BinanceSocketManager(self.client)
            logger.info(f"BinanceManager initialized with tld={self.tld} and ssl=False")
        except Exception as e:
            logger.error(f"Failed to initialize Binance Client: {e}")
            raise

    async def get_historical_klines(self, symbol: str, interval: str, limit: int = 100, endTime: int = None):
        """
        獲取歷史 K 線數據
        
        參數：
        - symbol: 交易對
        - interval: K 線間隔
        - limit: 返回的 K 線數量
        - endTime: 結束時間（毫秒時間戳），用於獲取指定時間之前的數據
        """
        if not self.client:
            await self.initialize()
            
        try:
            # 構建請求參數
            params = {
                'symbol': symbol,
                'interval': interval,
                'limit': limit
            }
            
            # 如果提供了 endTime，添加到參數中
            if endTime is not None:
                params['endTime'] = endTime
            
            # 獲取原始數據
            klines = await self.client.get_klines(**params)
            
            # 轉換為前端圖表所需的格式
            # Binance format: [Open time, Open, High, Low, Close, Volume, Close time, ...]
            formatted_klines = []
            for k in klines:
                formatted_klines.append({
                    "time": int(k[0] / 1000), # 轉為秒 (seconds)
                    "open": float(k[1]),
                    "high": float(k[2]),
                    "low": float(k[3]),
                    "close": float(k[4]),
                })
            return formatted_klines
        except Exception as e:
            logger.error(f"Error fetching historical klines: {e}")
            return []

    async def get_latest_kline(self, symbol: str, interval: str):
        """
        獲取最新的一根 K 線 (REST 輪詢備援用)
        """
        if not self.client:
            await self.initialize()
            
        try:
            klines = await self.client.get_klines(symbol=symbol, interval=interval, limit=1)
            if klines:
                k = klines[0]
                return {
                    "time": int(k[0] / 1000),
                    "open": float(k[1]),
                    "high": float(k[2]),
                    "low": float(k[3]),
                    "close": float(k[4]),
                    "volume": float(k[5]),
                    "isClosed": False # 輪詢時我們假定它還在變動
                }
        except Exception as e:
            logger.error(f"Error polling latest kline: {e}")
        return None

    async def start_kline_stream(self, symbol: str, interval: str, callback):
        """
        啟動實時 K 線數據流
        """
        if not self.client:
            await self.initialize()

        self._on_kline_received = callback
        self._is_running = True
        
        # 幣安 stream 名稱通常是小寫，例如 btcusdt@kline_1m
        stream_name = f"{symbol.lower()}@kline_{interval}"
        self.socket = self.bm.kline_socket(symbol=symbol, interval=interval)
        
        logger.info(f"Starting kline stream for {stream_name}")
        
        async with self.socket as stream:
            while self._is_running:
                try:
                    res = await stream.recv()
                    print(f">>> RAW WS MESSAGE: {str(res)[:100]}...") # Log first 100 chars
                    if res:
                        if 'k' in res:
                            kline = res['k']
                            data = {
                                "time": int(kline['t'] / 1000),
                                "open": float(kline['o']),
                                "high": float(kline['h']),
                                "low": float(kline['l']),
                                "close": float(kline['c']),
                                "isClosed": kline['x']
                            }
                            logger.info(f">>> Received kline from Binance for {symbol}: {data['close']}")
                            await self._on_kline_received(data)
                        else:
                            logger.warning(f"Unexpected message format from Binance: {res}")
                    else:
                        logger.warning("Received empty message from Binance stream")
                except Exception as e:
                    logger.error(f"Binance Stream Loop Error: {e}")
                    await asyncio.sleep(5) # 發生錯誤時稍等再重試

    async def stop(self):
        """
        停止所有連接
        """
        self._is_running = False
        if self.client:
            await self.client.close_connection()
            logger.info("Binance client connection closed.")
