import React from 'react';
import {
    TrendingUp,
    RefreshCw,
    Search,
    Clock,
    BarChart3,
    ArrowUpRight
} from 'lucide-react';
import PriceHeader from '../components/PriceHeader';
import TradingViewChart from '../components/TradingViewChart';
import { useBinanceData } from '../hooks/useBinanceData';

// Helper for class names
function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ');
}

const ChartMonitor: React.FC = () => {
    const { data, ticker, status, loadMoreHistory } = useBinanceData('BTCUSDT', '1m');

    return (
        <div className="flex flex-col h-full bg-background relative overflow-hidden">
            {/* Real-time Price Header */}
            <PriceHeader ticker={ticker} />

            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-surface/5">
                <div className="flex items-center gap-4">
                    <div className="flex gap-1">
                        {['1m', '5m', '15m', '1H', '4H', 'D'].map((tf) => (
                            <button
                                key={tf}
                                className={cn(
                                    "px-3 py-1 rounded text-[10px] font-bold tracking-wider transition-all",
                                    tf === '1m' ? "bg-primary text-black" : "text-subtext hover:bg-white/5"
                                )}
                            >
                                {tf}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-subtext" size={12} />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="bg-surface/50 border border-white/5 rounded-lg pl-8 pr-4 py-1 text-[10px] text-white placeholder:text-subtext/40 focus:outline-none focus:border-primary/50 transition-colors w-32"
                        />
                    </div>
                    <button className="p-1.5 text-subtext hover:text-white transition-colors bg-white/5 rounded-lg">
                        <RefreshCw size={14} className={status === 'loading' ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex min-h-0">
                {/* Chart View */}
                <div className="flex-1 p-4 flex flex-col min-w-0">
                    <div className="flex-1 bg-surface/10 rounded-xl overflow-hidden border border-white/5 relative min-h-[500px]">
                        {status === 'loading' && (
                            <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-20">
                                <div className="flex flex-col items-center gap-3">
                                    <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                                    <span className="text-[10px] font-bold text-primary tracking-[0.2em]">CONNECTING LIVE DATA...</span>
                                </div>
                            </div>
                        )}
                        <TradingViewChart
                            data={data}
                            containerClassName="w-full h-full"
                            onLoadMore={loadMoreHistory}
                        />

                        {/* Overlay Info */}
                        <div className="absolute top-4 left-4 flex gap-4 pointer-events-none z-10">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-subtext uppercase tracking-tighter">Connection Status</span>
                                <span className={cn(
                                    "text-[10px] font-bold",
                                    status === 'connected' ? "text-primary" : "text-red-500"
                                )}>
                                    {status.toUpperCase()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Info Panels */}
                <div className="w-80 h-full border-l border-white/5 p-4 space-y-4">
                    <div className="bg-surface/20 rounded-xl p-4 border border-white/5">
                        <h3 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
                            <Clock size={14} className="text-primary" />
                            Market Info
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center bg-background/50 p-2 rounded-lg border border-white/5">
                                <span className="text-[10px] text-subtext">Symbol</span>
                                <span className="text-[10px] text-white font-bold">BTCUSDT</span>
                            </div>
                            <div className="flex justify-between items-center bg-background/50 p-2 rounded-lg border border-white/5">
                                <span className="text-[10px] text-subtext">Source</span>
                                <span className="text-[10px] text-accent font-bold">Binance Live</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-surface/20 rounded-xl p-4 border border-white/5">
                        <h3 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
                            <BarChart3 size={14} className="text-primary" />
                            Statistics
                        </h3>
                        <div className="space-y-2 text-[10px] text-subtext leading-relaxed">
                            <p>Real-time kline data is being streamed from the Python backend via WebSocket.</p>
                            <p className="opacity-50">Data includes Open, High, Low, Close, and Volume for the current 1m interval.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChartMonitor;
