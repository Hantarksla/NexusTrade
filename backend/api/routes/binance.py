from fastapi import APIRouter, Query
from typing import Optional

router = APIRouter()

@router.get("/balance")
async def get_balance():
    return {"balance": 0.0, "currency": "USDT"}

@router.get("/klines")
async def get_klines(
    symbol: str = Query("BTCUSDT"),
    interval: str = Query("1m"),
    limit: int = Query(100),
    endTime: Optional[int] = Query(None)
):
    from main import binance_mgr
    data = await binance_mgr.get_historical_klines(symbol, interval, limit, endTime=endTime)
    return data
