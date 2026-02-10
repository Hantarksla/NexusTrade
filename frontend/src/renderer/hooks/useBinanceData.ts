import { useState, useEffect, useCallback, useRef } from 'react';
import { CandlestickData } from 'lightweight-charts';

/**
 * useBinanceData Hook
 * 數據加載流程（專業看盤軟件標準）：
 * 1. 先通過 REST API 同步加載 500 根歷史 K 線
 * 2. 渲染完整圖表（無空白、無 0 值）
 * 3. 再啟動 WebSocket 訂閱實時更新
 * 4. 支持增量加載更多歷史數據（向左滾動時）
 */
export interface TickerData {
    symbol: string;
    price: number;
    priceChange: number;
    priceChangePercent: number;
    high24h: number;
    low24h: number;
    open24h: number;
    prevClose: number;
    volume24h: number;
    bidPrice: number;
    askPrice: number;
    // 當天統計數據（Trading Day）
    todayOpen?: number;
    todayHigh?: number;
    todayLow?: number;
    todayChange?: number;
    todayChangePercent?: number;
    todayVolume?: number;
}

export const useBinanceData = (symbol: string = 'BTCUSDT', interval: string = '1m') => {
    const [data, setData] = useState<CandlestickData[]>([]);
    const [ticker, setTicker] = useState<TickerData | null>(null);
    const [status, setStatus] = useState<'loading' | 'connected' | 'error'>('loading');
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimerRef = useRef<any>(null);

    const getBackendWsUrl = useCallback(() => {
        const envUrl = (import.meta as any).env?.VITE_BACKEND_WS_URL as string | undefined;
        if (envUrl) return envUrl;

        const hostname = typeof window !== 'undefined' && window.location?.hostname
            ? window.location.hostname
            : 'localhost';

        return `ws://${hostname}:8000/ws`;
    }, []);

    // 初始加載歷史數據
    const fetchHistory = useCallback(async (): Promise<boolean> => {
        try {
            console.log(`[useBinanceData] 📊 Step 1: Fetching 500 historical klines...`);
            const response = await fetch(`http://localhost:8000/api/binance/klines?symbol=${symbol}&interval=${interval}&limit=500`);
            const history = await response.json();

            if (Array.isArray(history) && history.length > 0) {
                console.log(`[useBinanceData] ✅ Loaded ${history.length} bars`);
                setData(history);
                setStatus('connected');
                return true;
            } else {
                console.error('[useBinanceData] ❌ Historical data is empty');
                setStatus('error');
                return false;
            }
        } catch (error) {
            console.error('[useBinanceData] ❌ Failed to fetch historical data:', error);
            setStatus('error');
            return false;
        }
    }, [symbol, interval]);

    // 增量加載更多歷史數據（向左滾動時調用）
    const loadMoreHistory = useCallback(async (): Promise<boolean> => {
        if (isLoadingMore || data.length === 0) {
            return false;
        }

        try {
            setIsLoadingMore(true);

            // 獲取最早的 K 線時間戳
            const earliestTime = typeof data[0].time === 'number'
                ? data[0].time
                : (data[0].time as any).timestamp;

            // 計算 endTime（最早時間 - 1 秒，轉換為毫秒）
            const endTime = (earliestTime - 1) * 1000;

            console.log(`[useBinanceData] 📊 Loading more history before ${new Date(earliestTime * 1000).toISOString()}...`);

            const response = await fetch(
                `http://localhost:8000/api/binance/klines?symbol=${symbol}&interval=${interval}&limit=200&endTime=${endTime}`
            );
            const moreHistory = await response.json();

            if (Array.isArray(moreHistory) && moreHistory.length > 0) {
                const olderHistory = moreHistory.filter((bar: CandlestickData) => {
                    const barTime = typeof bar.time === 'number'
                        ? bar.time
                        : (bar.time as any).timestamp;
                    return barTime < earliestTime;
                });

                if (olderHistory.length === 0) {
                    console.log('[useBinanceData] ℹ️ API returned no older bars (already at oldest or duplicate batch)');
                    setIsLoadingMore(false);
                    return false;
                }

                console.log(`[useBinanceData] ✅ Loaded ${olderHistory.length} older bars`);

                // 將新數據添加到現有數據的前面
                setData(prevData => [...olderHistory, ...prevData]);
                setIsLoadingMore(false);
                return true;
            } else {
                console.log('[useBinanceData] ℹ️ No more historical data available');
                setIsLoadingMore(false);
                return false;
            }
        } catch (error) {
            console.error('[useBinanceData] ❌ Failed to load more history:', error);
            setIsLoadingMore(false);
            return false;
        }
    }, [symbol, interval, data, isLoadingMore]);

    useEffect(() => {
        let isMounted = true;

        const initializeData = async () => {
            const historyLoaded = await fetchHistory();

            if (!historyLoaded || !isMounted) {
                console.error('[useBinanceData] ❌ Cannot proceed without historical data');
                return;
            }

            // Step 2.5: 獲取當天統計數據（UTC+0 時區）
            try {
                console.log('[useBinanceData] 📅 Step 2.5: Fetching Trading Day statistics...');
                const response = await fetch(`http://localhost:8000/api/binance/ticker/tradingDay?symbol=${symbol}&timeZone=0`);
                const tradingDayData = await response.json();

                if (tradingDayData) {
                    console.log('[useBinanceData] ✅ Trading Day data loaded');
                    setTicker(prev => ({
                        symbol: tradingDayData.symbol,
                        price: tradingDayData.lastPrice,
                        priceChange: prev?.priceChange || 0,
                        priceChangePercent: prev?.priceChangePercent || 0,
                        high24h: prev?.high24h || 0,
                        low24h: prev?.low24h || 0,
                        open24h: prev?.open24h || 0,
                        prevClose: prev?.prevClose || 0,
                        volume24h: prev?.volume24h || 0,
                        bidPrice: prev?.bidPrice || 0,
                        askPrice: prev?.askPrice || 0,
                        todayOpen: tradingDayData.openPrice,
                        todayHigh: tradingDayData.highPrice,
                        todayLow: tradingDayData.lowPrice,
                        todayChange: tradingDayData.priceChange,
                        todayChangePercent: tradingDayData.priceChangePercent,
                        todayVolume: tradingDayData.volume
                    }));
                }
            } catch (error) {
                console.error('[useBinanceData] ⚠️ Failed to fetch Trading Day data:', error);
            }

            console.log('[useBinanceData] 📡 Step 3: Starting WebSocket...');
            connectWS();
        };

        initializeData();

        const connectWS = () => {
            if (!isMounted) return;

            const ws = new WebSocket(getBackendWsUrl());
            wsRef.current = ws;

            ws.onopen = () => {
                console.log('✅ [useBinanceData] WS Connected');
                setStatus('connected');
            };

            ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);

                    if (message.type === 'LOG') return;

                    if (message.type === 'TICKER_UPDATE') {
                        // 保留當天統計數據，只更新 24h 數據和實時價格
                        setTicker(prev => ({
                            ...message.data,
                            todayOpen: prev?.todayOpen,
                            todayHigh: prev?.todayHigh,
                            todayLow: prev?.todayLow,
                            todayChange: prev?.todayChange,
                            todayChangePercent: prev?.todayChangePercent,
                            todayVolume: prev?.todayVolume
                        }));
                        return;
                    }

                    if (message.type === 'KLINE_UPDATE') {
                        const kline = message.data;

                        setData(prevData => {
                            if (prevData.length === 0) {
                                console.warn('[useBinanceData] ⚠️ Received kline before history');
                                return prevData;
                            }

                            const lastData = prevData[prevData.length - 1];
                            const lastTime = typeof lastData.time === 'number' ? lastData.time : (lastData.time as any).timestamp;

                            if (kline.time === lastTime) {
                                const newData = [...prevData];
                                newData[newData.length - 1] = kline;
                                return newData;
                            } else if (kline.time > lastTime) {
                                const timeDiff = kline.time - lastTime;
                                const intervalSec = 60;

                                if (timeDiff > intervalSec) {
                                    const missingBars = [];
                                    for (let t = lastTime + intervalSec; t < kline.time; t += intervalSec) {
                                        missingBars.push({
                                            time: t,
                                            open: lastData.close,
                                            high: lastData.close,
                                            low: lastData.close,
                                            close: lastData.close,
                                        });
                                    }
                                    return [...prevData, ...missingBars, kline];
                                }

                                return [...prevData, kline];
                            }

                            return prevData;
                        });
                    }
                } catch (error) {
                    console.error('[useBinanceData] ❌ WS message error:', error);
                }
            };

            ws.onerror = () => {
                console.warn('⚠️ [useBinanceData] WS connection error, will retry...');
                setStatus('error');
            };

            ws.onclose = () => {
                console.log('🔌 [useBinanceData] WS Disconnected, reconnecting...');
                reconnectTimerRef.current = setTimeout(() => {
                    connectWS();
                }, 3000);
            };
        };

        return () => {
            isMounted = false;
            if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
            if (wsRef.current) {
                wsRef.current.onclose = null;
                wsRef.current.close();
            }
        };
    }, [symbol, interval, fetchHistory, getBackendWsUrl]);

    return { data, ticker, status, loadMoreHistory, isLoadingMore };
};
