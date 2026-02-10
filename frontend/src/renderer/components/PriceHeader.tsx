import React, { useState, useEffect } from 'react';
import { TickerData } from '../hooks/useBinanceData';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface PriceHeaderProps {
    ticker: TickerData | null;
}

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

const PriceHeader: React.FC<PriceHeaderProps> = ({ ticker }) => {
    const [priceFlash, setPriceFlash] = useState<'up' | 'down' | null>(null);
    const [prevPrice, setPrevPrice] = useState<number | null>(null);

    useEffect(() => {
        if (ticker && prevPrice !== null && ticker.price !== prevPrice) {
            setPriceFlash(ticker.price > prevPrice ? 'up' : 'down');
            const timer = setTimeout(() => setPriceFlash(null), 500);
            return () => clearTimeout(timer);
        }
        if (ticker) setPrevPrice(ticker.price);
    }, [ticker?.price]);

    if (!ticker) {
        return (
            <div className="animate-pulse flex gap-8 p-4 bg-surface/20 border-b border-white/5 items-center">
                <div className="h-8 w-32 bg-white/10 rounded"></div>
                <div className="h-6 w-24 bg-white/5 rounded"></div>
                <div className="h-6 w-24 bg-white/5 rounded"></div>
            </div>
        );
    }

    const isPositive = ticker.priceChangePercent >= 0;

    // 優先使用當天數據，如果沒有則回退到 24h 數據
    const openPrice = ticker.todayOpen ?? ticker.open24h;
    const highPrice = ticker.todayHigh ?? ticker.high24h;
    const lowPrice = ticker.todayLow ?? ticker.low24h;
    const priceChangePercent = ticker.todayChangePercent ?? ticker.priceChangePercent;
    const volume = ticker.todayVolume ?? ticker.volume24h;

    const openDiff = ticker.price - openPrice;
    const isOpenDiffPositive = openDiff >= 0;

    return (
        <div className="flex flex-wrap items-center gap-x-8 gap-y-2 p-4 border-b border-white/5 bg-surface/20 sticky top-0 z-10 transition-colors">
            {/* Symbol & Price Section - 固定寬度以防止 scale 動畫影響佈局 */}
            <div className="flex items-center gap-4 min-w-[380px]">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                        <TrendingUp size={16} />
                    </div>
                    <span className="text-lg font-black tracking-tighter text-white">
                        {ticker.symbol.replace('USDT', '')}<span className="text-subtext">/USDT</span>
                    </span>
                </div>

                {/* 價格容器 - 使用固定寬度和相對定位 */}
                <div className="flex flex-col relative min-w-[140px]">
                    <div className={cn(
                        "text-2xl font-bold transition-all duration-300",
                        priceFlash === 'up' ? "text-primary scale-105" :
                            priceFlash === 'down' ? "text-red-500 scale-105" : "text-white"
                    )}>
                        {ticker.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                </div>

                <div className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold",
                    isPositive ? "bg-primary/10 text-primary" : "bg-red-500/10 text-red-500"
                )}>
                    {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {priceChangePercent.toFixed(2)}%
                </div>
            </div>

            {/* Market Stats Grid - 統一數字格式以防止跳動 */}
            <div className="flex items-center gap-6 border-l border-white/10 pl-6 h-10 overflow-x-auto no-scrollbar">
                <StatItem
                    label="Open Diff"
                    value={`${isOpenDiffPositive ? '+' : ''}${openDiff.toFixed(2)}`}
                    color={isOpenDiffPositive ? 'text-primary' : 'text-red-500'}
                />
                <StatItem
                    label="Open"
                    value={openPrice.toFixed(2)}
                />
                <StatItem
                    label="High"
                    value={highPrice.toFixed(2)}
                />
                <StatItem
                    label="Low"
                    value={lowPrice.toFixed(2)}
                />
                <StatItem
                    label="Vol"
                    value={`${volume.toFixed(0)} BTC`}
                />
                <div className="hidden lg:flex gap-6">
                    <StatItem label="Bid" value={ticker.bidPrice.toFixed(2)} />
                    <StatItem label="Ask" value={ticker.askPrice.toFixed(2)} />
                </div>
            </div>
        </div>
    );
};

const StatItem = ({ label, value, color = "text-white" }: { label: string; value: string; color?: string }) => (
    <div className="flex flex-col min-w-max w-[80px]">
        <span className="text-[10px] text-subtext uppercase tracking-widest font-bold">{label}</span>
        <span className={cn("text-xs font-medium tabular-nums", color)}>{value}</span>
    </div>
);

export default PriceHeader;
