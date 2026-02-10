import React, { useState } from 'react';
import {
    Shield,
    Key,
    Cpu,
    Activity,
    Globe,
    Lock,
    Eye,
    EyeOff,
    CheckCircle2,
    RefreshCcw,
    Smartphone,
    Network,
    ChevronLeft
} from 'lucide-react';
import { cn } from '../../lib/utils';

const Settings: React.FC = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [showKey, setShowKey] = useState(false);
    const [apiKey, setApiKey] = useState('');
    const [apiSecret, setApiSecret] = useState('');
    const [isConnecting, setIsConnecting] = useState(false);

    const handleTestConnection = async () => {
        setIsConnecting(true);
        // Simulate API call
        setTimeout(() => {
            setIsConnecting(false);
            setIsConnected(true);
        }, 1500);
    };

    const renderDisconnected = () => (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">System Configuration</h1>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border border-primary/20">
                            v1.0.4-STABLE
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-subtext uppercase tracking-widest">API Status</span>
                    <div className="bg-red-500/10 text-red-500 text-[10px] font-bold px-3 py-1 rounded uppercase border border-red-500/20">
                        Disconnected
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: API Config */}
                <div className="lg:col-span-2 space-y-8">
                    <section className="bg-surface border border-white/5 rounded-2xl p-8 space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Key className="w-5 h-5 text-primary" />
                            </div>
                            <h2 className="text-xl font-bold text-white">API Configuration</h2>
                            <div className="ml-auto flex items-center gap-2">
                                <span className="text-[10px] font-bold text-subtext uppercase tracking-widest">Status:</span>
                                <span className="text-[10px] font-bold text-red-500 uppercase">Offline</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-subtext uppercase tracking-widest">Binance API Key</label>
                                <div className="relative">
                                    <input
                                        type={showKey ? "text" : "password"}
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
                                        placeholder="38f29d84-7e2a-4c12-9f3a-82d1b0c8e4f1"
                                        className="w-full bg-background border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-primary/50 focus:ring-4 focus:ring-primary/5 outline-none transition-all pr-12"
                                    />
                                    <button
                                        onClick={() => setShowKey(!showKey)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-subtext hover:text-white transition-colors"
                                    >
                                        {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-subtext uppercase tracking-widest">Binance API Secret</label>
                                <input
                                    type="password"
                                    value={apiSecret}
                                    onChange={(e) => setApiSecret(e.target.value)}
                                    placeholder="••••••••••••••••••••••••••••••••••••"
                                    className="w-full bg-background border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-primary/50 focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                                />
                            </div>

                            <button
                                onClick={handleTestConnection}
                                disabled={isConnecting}
                                className="w-full bg-primary hover:bg-accent text-background font-bold py-4 rounded-xl transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isConnecting ? (
                                    <RefreshCcw className="w-5 h-5 animate-spin" />
                                ) : "TEST CONNECTION"}
                            </button>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h3 className="text-[10px] font-bold text-subtext uppercase tracking-widest px-1">Feature Capabilities</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { icon: Cpu, label: "Fetch Balance" },
                                { icon: Activity, label: "Real-time Ticker" },
                                { icon: Globe, label: "K-Line Streams" },
                                { icon: Network, label: "Websocket" }
                            ].map((feature, i) => (
                                <div key={i} className="bg-surface border border-white/5 rounded-xl p-4 flex flex-col items-center gap-3 group hover:border-primary/20 transition-colors">
                                    <feature.icon className="w-6 h-6 text-subtext group-hover:text-primary transition-colors" />
                                    <span className="text-[10px] font-bold text-subtext uppercase text-center">{feature.label}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Right: Security Settings */}
                <div className="space-y-6">
                    <section className="bg-surface border border-white/5 rounded-2xl p-8 space-y-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Shield className="w-5 h-5 text-primary" />
                            </div>
                            <h2 className="text-xl font-bold text-white">Security Settings</h2>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-sm font-semibold text-white">2FA Authentication</h4>
                                    <p className="text-[10px] text-subtext mt-1">Required for API modifications</p>
                                </div>
                                <div className="w-10 h-5 bg-primary rounded-full relative">
                                    <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm" />
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-sm font-semibold text-white">IP Whitelisting</h4>
                                    <p className="text-[10px] text-subtext mt-1">Restrict access to specific IPs</p>
                                </div>
                                <div className="w-10 h-5 bg-white/10 rounded-full relative">
                                    <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm opacity-50" />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-white/5">
                                <h4 className="text-sm font-semibold text-white">Withdrawal Access</h4>
                                <div className="flex items-center gap-2 mt-2">
                                    <Lock className="w-4 h-4 text-red-500" />
                                    <span className="text-[10px] font-bold text-red-500 uppercase">Disabled</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    <button className="w-full bg-primary text-background font-bold py-4 rounded-xl shadow-lg shadow-primary/10 hover:bg-accent transition-all uppercase tracking-wider text-sm">
                        Save Configuration
                    </button>
                </div>
            </div>
        </div>
    );

    const renderConnected = () => (
        <div className="animate-in fade-in zoom-in-95 duration-500">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <button onClick={() => setIsConnected(false)} className="text-subtext hover:text-white transition-colors">
                        <ChevronLeft size={20} />
                    </button>
                    <h1 className="text-sm font-bold text-subtext uppercase tracking-widest">API Configuration / <span className="text-primary italic">Validation Detail</span></h1>
                </div>
                <div className="bg-primary/10 text-primary text-[10px] font-bold px-3 py-1 rounded-full border border-primary/20 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    ENGINE ONLINE
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Status Card */}
                    <section className="bg-surface border border-primary/30 rounded-3xl p-10 relative overflow-hidden group">
                        <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all" />
                        <div className="relative flex flex-col md:flex-row items-center gap-10">
                            <div className="relative">
                                <div className="w-32 h-32 rounded-full border-4 border-primary/20 flex items-center justify-center p-2">
                                    <div className="w-full h-full rounded-full bg-primary/10 flex items-center justify-center border-4 border-primary">
                                        <CheckCircle2 className="w-12 h-12 text-primary" />
                                    </div>
                                </div>
                                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-surface border border-primary/30 px-3 py-1 rounded-lg text-[10px] font-bold text-primary">
                                    VERIFIED
                                </div>
                            </div>

                            <div className="flex-1 space-y-4">
                                <div className="flex items-center gap-3">
                                    <h2 className="text-3xl font-bold text-white">Connection Stable</h2>
                                    <span className="bg-primary text-background text-[10px] font-black px-2 py-0.5 rounded uppercase">API-OK</span>
                                </div>
                                <p className="text-sm text-subtext leading-relaxed max-w-lg">
                                    Your API credentials have been successfully validated. Live market data and trading execution endpoints are responsive.
                                </p>

                                <div className="flex flex-wrap gap-4 pt-4">
                                    <div className="bg-background/50 border border-white/5 rounded-xl px-4 py-3 flex flex-col">
                                        <span className="text-[10px] font-bold text-subtext uppercase tracking-tighter">API Key</span>
                                        <span className="text-sm font-mono text-white mt-1">VM82********K9X2</span>
                                    </div>
                                    <div className="bg-background/50 border border-white/5 rounded-xl px-4 py-3 flex flex-col min-w-[140px]">
                                        <span className="text-[10px] font-bold text-subtext uppercase tracking-tighter">Permission Scope</span>
                                        <div className="flex gap-2 mt-2">
                                            {['READ', 'TRADE', 'FUTURES'].map(p => (
                                                <span key={p} className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded uppercase border border-primary/20">{p}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Technical Details */}
                        <section className="bg-surface border border-white/5 rounded-2xl p-6 space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                                    <Activity size={16} className="text-subtext" />
                                </div>
                                <h3 className="text-xs font-bold text-white uppercase tracking-widest">Technical Details</h3>
                            </div>

                            <div className="space-y-4">
                                {[
                                    { label: "Library", value: "python-binance", color: "text-primary" },
                                    { label: "Status", value: "v1.0.16", color: "text-subtext" },
                                    { label: "Latency", value: "12.42ms", color: "text-primary", dot: true },
                                    { label: "Server Region", value: "Tokyo (ap-northeast-1)", color: "text-subtext" },
                                    { label: "Protocol", value: "WSS / REST v3", color: "text-subtext" }
                                ].map((item, i) => (
                                    <div key={i} className="flex justify-between items-center text-xs">
                                        <span className="text-subtext">{item.label}</span>
                                        <div className="flex items-center gap-1.5">
                                            <span className={cn("font-semibold", item.color)}>{item.value}</span>
                                            {item.dot && <div className="w-1 h-1 rounded-full bg-primary" />}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Validation Log */}
                        <section className="bg-surface border border-white/5 rounded-2xl p-6 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-xs font-bold text-subtext uppercase tracking-widest">Validation Log</h3>
                                </div>
                                <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-sm" />
                            </div>

                            <div className="space-y-3 font-mono text-[10px] text-subtext">
                                <div className="flex gap-2"><span className="text-primary">[14:20:01]</span> <span className="text-white">INIT:</span> Handshake started...</div>
                                <div className="flex gap-2"><span className="text-primary">[14:20:01]</span> <span className="text-white">AUTH:</span> Credentials masked and verified.</div>
                                <div className="flex gap-2"><span className="text-primary">[14:20:02]</span> <span className="text-white">PING:</span> Round-trip 12ms.</div>
                                <div className="flex gap-2"><span className="text-primary">[14:20:02]</span> <span className="text-white">DONE:</span> Connection confirmed active.</div>
                            </div>
                        </section>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Balance Snapshot */}
                    <section className="bg-surface border border-white/5 rounded-3xl p-8 space-y-6 relative overflow-hidden group">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold text-subtext uppercase tracking-widest">Balance Snapshot</h3>
                            <RefreshCcw size={14} className="text-subtext hover:text-primary cursor-pointer transition-colors" />
                        </div>

                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-subtext uppercase tracking-tight">Total Available Margin</span>
                            <div className="text-4xl font-bold text-white tracking-tight">$128,450.00</div>
                            <span className="text-[10px] font-bold text-primary uppercase">USDT <span className="text-subtext font-medium">LIVE DATA</span></span>
                        </div>

                        <div className="space-y-6 pt-4 border-t border-white/5">
                            {[
                                { asset: "BTC Assets", amount: "1.4281 BTC", progress: 75 },
                                { asset: "ETH Assets", amount: "12.050 ETH", progress: 45 }
                            ].map((row, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="flex justify-between items-center text-xs font-medium">
                                        <span className="text-white">{row.asset}</span>
                                        <span className="text-subtext">{row.amount}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-background rounded-full overflow-hidden">
                                        <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${row.progress}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-2xl transition-all text-xs border border-white/5 mt-4">
                            REFRESH SNAPSHOT
                        </button>
                    </section>

                    {/* Security Advisory */}
                    <section className="bg-surface border border-white/5 rounded-2xl p-6 space-y-4">
                        <h3 className="text-xs font-bold text-subtext uppercase tracking-widest">Security Advisory</h3>
                        <p className="text-[11px] text-subtext leading-relaxed">
                            "Your secret keys are encrypted locally using AES-256. VNC-Trader never transmits your raw secret keys to external servers beyond the designated exchange endpoint."
                        </p>
                        <div className="flex items-center gap-2 pt-2 text-primary">
                            <Shield size={14} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Secure Storage Active</span>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen p-10 max-w-[1600px] mx-auto">
            {isConnected ? renderConnected() : renderDisconnected()}
        </div>
    );
};

export default Settings;
