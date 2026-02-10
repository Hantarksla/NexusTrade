"""
NexusTrade AI - Python Backend
Powered by FastAPI
"""

import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import json
import asyncio
from typing import List

from api.routes import binance, settings, strategy
from utils.logger import logger
from core.binance_service import BinanceManager
from core.market_data_provider import MarketDataProvider

app = FastAPI(title="NexusTrade AI API")

# Global Binance Manager
binance_mgr = BinanceManager(tld='com')  # 使用 Binance.COM 以支持 Trading Day API（需要 VPN）

# Enable CORS for Electron communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(settings.router, prefix="/api/settings", tags=["settings"])
app.include_router(binance.router, prefix="/api/binance", tags=["binance"])
app.include_router(strategy.router, prefix="/api/strategy", tags=["strategy"])

# WebSocket Manager for real-time data
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.debug(f"WebSocket client connected. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.debug(f"WebSocket client disconnected. Total: {len(self.active_connections)}")

    async def broadcast(self, message: str):
        stale_connections = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.debug(f"Broadcast failed for a connection: {e}")
                stale_connections.append(connection)
        
        # Cleanup stale connections
        for conn in stale_connections:
            if conn in self.active_connections:
                self.active_connections.remove(conn)

manager = ConnectionManager()
market_provider = MarketDataProvider(tld='com')  # 使用 Binance.COM (全球) 獲得更高交易量

async def binance_data_pusher():
    """
    後台任務：啟動市場數據提供者，將數據轉發給前端
    """
    print(">>> Starting MarketDataProvider...")
    
    # 定義回調函數
    async def on_market_data(msg):
        """
        處理來自 MarketDataProvider 的複合流數據
        支援 Ticker 和 Kline 兩種類型
        """
        # 複合流格式: {'stream': '...', 'data': {...}}
        if not isinstance(msg, dict) or 'data' not in msg:
            return

        data = msg['data']
        event_type = data.get('e')
        
        frontend_msg = None
        
        # 1. 處理 K 線更新
        if event_type == 'kline' and 'k' in data:
            k = data['k']
            frontend_msg = {
                'type': 'KLINE_UPDATE',
                'data': {
                    'time': int(k['t']) // 1000,
                    'open': float(k['o']),
                    'high': float(k['h']),
                    'low': float(k['l']),
                    'close': float(k['c']),
                    'volume': float(k['v']),
                    'isClosed': k['x']
                }
            }
            
            # 每 10 次 K 線更新打印一次
            if not hasattr(on_market_data, 'k_counter'):
                on_market_data.k_counter = 0
            on_market_data.k_counter += 1
            if on_market_data.k_counter % 10 == 0:
                print(f"📈 [Kline] #{on_market_data.k_counter}: {k['c']} (Vol: {k['v']})")

        # 2. 處理 Ticker 更新 (實時價格)
        elif event_type == '24hrTicker':
            frontend_msg = {
                'type': 'TICKER_UPDATE',
                'data': {
                    'symbol': data['s'],
                    'price': float(data['c']),
                    'priceChange': float(data.get('p', 0)),
                    'priceChangePercent': float(data.get('P', 0)),
                    'high24h': float(data.get('h', 0)),
                    'low24h': float(data.get('l', 0)),
                    'open24h': float(data.get('o', 0)),
                    'prevClose': float(data.get('x', 0)),
                    'volume24h': float(data.get('v', 0)),
                    'bidPrice': float(data.get('b', 0)),
                    'askPrice': float(data.get('a', 0))
                }
            }
            
            # 每 10 次 Ticker 更新打印一次
            if not hasattr(on_market_data, 't_counter'):
                on_market_data.t_counter = 0
            on_market_data.t_counter += 1
            if on_market_data.t_counter % 10 == 0:
                print(f"💰 [Ticker] #{on_market_data.t_counter}: {data['c']} ({data.get('P', '0')}% )")

        # 3. 廣播給所有前端
        if frontend_msg:
            try:
                await manager.broadcast(json.dumps(frontend_msg))
            except Exception as e:
                logger.error(f"Failed to broadcast market data: {e}")

    # 啟動數據流
    await market_provider.start_stream(callback=on_market_data)
    
    # 保持任務運行 (Provider 內部已有 Loop，但在這裡我們需要掛起避免 Task 結束)
    while True:
        await asyncio.sleep(1)
        # 未來可以在這裡監控 Provider 狀態

@app.on_event("startup")
async def startup_event():
    # 設定 logger 的 WebSocket 廣播
    logger.set_broadcast_callback(manager.broadcast)
    
    print(">>> FASTAPI STARTUP: Triggering background tasks...")
    # Run everything as a background task to avoid blocking startup
    asyncio.create_task(binance_data_pusher())
    print(">>> FASTAPI STARTUP: Tasks scheduled successfully.")

@app.on_event("shutdown")
async def shutdown_event():
    await binance_mgr.stop()
    logger.info("FastAPI Shutdown Sequence Complete.")

@app.get("/api/binance/klines")
async def get_klines(
    symbol: str = "BTCUSDT", 
    interval: str = "1m", 
    limit: int = 500,
    endTime: int = None  # 新增：結束時間（毫秒時間戳），用於獲取指定時間之前的數據
):
    """
    獲取歷史 K 線數據
    
    參數：
    - symbol: 交易對，例如 BTCUSDT
    - interval: K 線間隔，例如 1m, 5m, 1h
    - limit: 返回的 K 線數量，最大 1000
    - endTime: 結束時間（毫秒時間戳），用於獲取指定時間之前的數據
    """
    try:
        klines = await binance_mgr.get_historical_klines(symbol, interval, limit, endTime)
        return klines
    except Exception as e:
        logger.error(f"Failed to fetch klines: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/binance/ticker/tradingDay")
async def get_trading_day_ticker(symbol: str = "BTCUSDT", timeZone: str = "0"):
    """
    獲取當天統計數據 (Trading Day Ticker)
    使用 UTC+0 時區（格林威治時間）
    
    返回當天的：
    - openPrice: 當天開盤價
    - highPrice: 當天最高價
    - lowPrice: 當天最低價
    - lastPrice: 當前價格（當天收盤價）
    - priceChange: 當天價格變動
    - priceChangePercent: 當天漲跌幅 %
    """
    import aiohttp
    
    try:
        # 直接調用 Binance API
        base_url = f"https://api.binance.{'us' if binance_mgr.tld == 'us' else 'com'}"
        url = f"{base_url}/api/v3/ticker/tradingDay"
        params = {
            'symbol': symbol,
            'timeZone': timeZone
        }
        
        logger.info(f"Fetching Trading Day data from: {url} with params: {params}")
        
        async with aiohttp.ClientSession(connector=aiohttp.TCPConnector(ssl=False)) as session:
            async with session.get(url, params=params, timeout=aiohttp.ClientTimeout(total=10)) as response:
                if response.status == 200:
                    data = await response.json()
                    logger.info(f"Successfully fetched Trading Day data for {symbol}")
                    return {
                        'symbol': data['symbol'],
                        'openPrice': float(data['openPrice']),
                        'highPrice': float(data['highPrice']),
                        'lowPrice': float(data['lowPrice']),
                        'lastPrice': float(data['lastPrice']),
                        'priceChange': float(data['priceChange']),
                        'priceChangePercent': float(data['priceChangePercent']),
                        'openTime': int(data['openTime']),
                        'closeTime': int(data['closeTime']),
                        'volume': float(data['volume']),
                        'quoteVolume': float(data['quoteVolume'])
                    }
                else:
                    error_text = await response.text()
                    logger.error(f"Binance API returned status {response.status}: {error_text}")
                    # 如果是地區限制錯誤，回退到 24h ticker
                    if response.status == 451 or 'restricted location' in error_text.lower():
                        logger.warning("⚠️ Binance.COM access restricted. Falling back to 24h ticker data.")
                        return await get_fallback_trading_day_data(symbol)
                    raise HTTPException(status_code=response.status, detail=f"Binance API error: {error_text}")
                    
    except aiohttp.ClientError as e:
        logger.error(f"Network error fetching trading day ticker: {e}")
        logger.warning("⚠️ Network error. Falling back to 24h ticker data.")
        return await get_fallback_trading_day_data(symbol)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error fetching trading day ticker: {e}")
        logger.warning("⚠️ Unexpected error. Falling back to 24h ticker data.")
        return await get_fallback_trading_day_data(symbol)

async def get_fallback_trading_day_data(symbol: str):
    """
    當無法訪問 Trading Day API 時的回退方案
    使用 24h ticker 數據作為臨時替代
    """
    try:
        if not binance_mgr.client:
            await binance_mgr.initialize()
        
        ticker = await binance_mgr.client.get_ticker(symbol=symbol)
        
        logger.info(f"Using 24h ticker data as fallback for {symbol}")
        
        return {
            'symbol': ticker['symbol'],
            'openPrice': float(ticker['openPrice']),
            'highPrice': float(ticker['highPrice']),
            'lowPrice': float(ticker['lowPrice']),
            'lastPrice': float(ticker['lastPrice']),
            'priceChange': float(ticker['priceChange']),
            'priceChangePercent': float(ticker['priceChangePercent']),
            'openTime': int(ticker['openTime']),
            'closeTime': int(ticker['closeTime']),
            'volume': float(ticker['volume']),
            'quoteVolume': float(ticker['quoteVolume'])
        }
    except Exception as e:
        logger.error(f"Fallback also failed: {e}")
        raise HTTPException(status_code=503, detail="Unable to fetch ticker data. Please check your network connection or VPN.")

@app.get("/")
async def root():
    return {"status": "online", "message": "NexusTrade AI Backend is running"}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Send initial success message with error handling
        try:
            await websocket.send_text(json.dumps({
                "type": "STATUS", 
                "message": "Connected to NexusTrade AI WebSocket",
                "source": "Binance.US"
            }))
        except Exception:
            # If we can't even send the status, client probably closed immediately
            manager.disconnect(websocket)
            return
        
        while True:
            # Keep alive and handle potential commands from frontend
            # This will raise WebSocketDisconnect when client closes
            data = await websocket.receive_text()
            # Optional: handle commands here
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket Runtime Error: {e}")
        manager.disconnect(websocket)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
