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
            if (onLoadMore && !isLoadingRef.current && logicalRange.from < 10) {
                console.log('[TradingViewChart] 📊 User scrolled to left edge, loading more history...');
                isLoadingRef.current = true;

                try {
                    const success = await onLoadMore();
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
    }, [onLoadMore]);

    // 實時更新處理 - 永不自動滾動，讓用戶自己決定何時查看最新數據
    useEffect(() => {
        if (!seriesRef.current || !data || data.length === 0) return;

        const latestBar = data[data.length - 1];

        // 如果數據長度發生變化,或者數據為新,則重新設置整個數據
        // 但不會自動滾動，保持用戶當前的查看位置
        if (data.length !== (seriesRef.current.dataCount || 0)) {
            seriesRef.current.setData(data);
            seriesRef.current.dataCount = data.length;
            // 移除自動滾動邏輯，讓用戶自己決定何時查看最新數據
        } else {
            // 更新最後一根 K 線（不會觸發滾動）
            seriesRef.current.update(latestBar);
        }
    }, [data]);

    return <div ref={chartContainerRef} className={containerClassName} />;
};

export default TradingViewChart;
