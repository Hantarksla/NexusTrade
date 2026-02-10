import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, CandlestickData, CandlestickSeries } from 'lightweight-charts';

interface TradingViewChartProps {
    data: CandlestickData[];
    containerClassName?: string;
    onLoadMore?: () => Promise<boolean>;  // 增量加載回調函數
}

const TradingViewChart: React.FC<TradingViewChartProps> = ({ data, containerClassName, onLoadMore }) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<any>(null);
    const seriesRef = useRef<any>(null);
    const isLoadingRef = useRef(false);  // 防止重複加載
    const onLoadMoreRef = useRef(onLoadMore);
    const prevRangeRef = useRef<any>(null);

    useEffect(() => {
        onLoadMoreRef.current = onLoadMore;
    }, [onLoadMore]);

    useEffect(() => {
        if (!chartContainerRef.current) return;

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: 'transparent' },
                textColor: '#9CA3AF',
            },
            grid: {
                vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
                horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
            },
            crosshair: {
                mode: 0,
                vertLine: {
                    color: '#00F0FF',
                    labelBackgroundColor: '#00F0FF',
                },
                horzLine: {
                    color: '#00F0FF',
                    labelBackgroundColor: '#00F0FF',
                },
            },
            timeScale: {
                borderColor: 'rgba(255, 255, 255, 0.1)',
                timeVisible: true,
                secondsVisible: false,
            },
            rightPriceScale: {
                borderColor: 'rgba(255, 255, 255, 0.1)',
            },
            handleScroll: true,
            handleScale: true,
        });

        // In Lightweight Charts v5+, we use addSeries with the series type constant
        const candlestickSeries = chart.addSeries(CandlestickSeries, {
            upColor: '#10B981',
            downColor: '#EF4444',
            borderVisible: false,
            wickUpColor: '#10B981',
            wickDownColor: '#EF4444',
        });

        if (data && data.length > 0) {
            candlestickSeries.setData(data);
        }

        chartRef.current = chart;
        seriesRef.current = candlestickSeries;

        // 監聽可見範圍變化 - 僅用於增量加載
        const timeScale = chart.timeScale();
        timeScale.subscribeVisibleLogicalRangeChange(async () => {
            const logicalRange = timeScale.getVisibleLogicalRange();
            if (logicalRange === null) return;

            // 增量加載邏輯：當用戶滾動到左側邊緣時加載更多數據
            if (onLoadMoreRef.current && !isLoadingRef.current && logicalRange.from < 10) {
                console.log('[TradingViewChart] 📊 User scrolled to left edge, loading more history...');
                isLoadingRef.current = true;

                try {
                    const success = await onLoadMoreRef.current();
                    if (success) {
                        console.log('[TradingViewChart] ✅ More history loaded successfully');
                    }
                } catch (error) {
                    console.error('[TradingViewChart] ❌ Failed to load more history:', error);
                } finally {
                    isLoadingRef.current = false;
                }
            }
        });

        const resizeObserver = new ResizeObserver(entries => {
            if (entries.length === 0 || !entries[0].contentRect) return;
            const { width, height } = entries[0].contentRect;
            chart.resize(width, height);
        });

        if (chartContainerRef.current) {
            resizeObserver.observe(chartContainerRef.current);
        }

        return () => {
            resizeObserver.disconnect();
            chart.remove();
        };
    }, []);

    // 實時更新處理 - 永不自動滾動，讓用戶自己決定何時查看最新數據
    useEffect(() => {
        if (!seriesRef.current || !chartRef.current || !data || data.length === 0) return;

        const timeScale = chartRef.current.timeScale();
        const previousData = seriesRef.current.currentData as CandlestickData[] | undefined;
        const previousLength = previousData?.length ?? 0;

        const latestBar = data[data.length - 1];
        const firstBar = data[0];

        if (previousData && previousLength > 0) {
            const prevFirstTime = Number(previousData[0].time);
            const nextFirstTime = Number(firstBar.time);

            // 僅在「左側增量加載」時保存當前視圖，避免視角跳動
            if (data.length > previousLength && nextFirstTime < prevFirstTime) {
                prevRangeRef.current = timeScale.getVisibleLogicalRange();
            } else {
                prevRangeRef.current = null;
            }
        }

        // 初始化或左側增量加載時才 setData，避免頻繁重置時間軸
        if (previousLength === 0 || (prevRangeRef.current && data.length > previousLength)) {
            seriesRef.current.setData(data);
            seriesRef.current.currentData = data;

            if (prevRangeRef.current) {
                timeScale.setVisibleLogicalRange(prevRangeRef.current);
                prevRangeRef.current = null;
            }
        } else {
            // 實時更新最後一根或追加新 K 線（不會自動滾動到最新）
            seriesRef.current.update(latestBar);
            seriesRef.current.currentData = data;
        }
    }, [data]);

    return <div ref={chartContainerRef} className={containerClassName} />;
};

export default TradingViewChart;
