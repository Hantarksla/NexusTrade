import React, { useState, useEffect, useRef } from 'react';
import { cn } from '../../lib/utils';
import {
    Terminal,
    ChevronUp,
    ChevronDown,
    Send,
    Bot,
    User,
    Sparkles
} from 'lucide-react';

// --- Types ---

interface LogEntry {
    timestamp: string;
    level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS' | 'DEBUG';
    message: string;
}

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}

// --- Sub-Components ---

/**
 * System Logs View
 * 負責顯示系統運行狀態與後端日誌
 */
const SystemLogsView: React.FC<{ logs: LogEntry[] }> = ({ logs }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    return (
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 text-[13px] space-y-2 bg-background/50">
            {logs.length === 0 ? (
                <div className="flex items-center justify-center h-full text-subtext/30 text-[11px]">
                    等待後端日誌...
                </div>
            ) : (
                logs.map((log, i) => (
                    <div key={i} className={cn(
                        "flex gap-3 leading-relaxed animate-in fade-in slide-in-from-left-1 duration-300",
                        log.level === 'ERROR' && "text-red-400",
                        log.level === 'WARN' && "text-yellow-400"
                    )}>
                        <span className={cn(
                            "font-medium",
                            log.level === 'ERROR' && "text-red-300",
                            log.level === 'WARN' && "text-yellow-300",
                            !['ERROR', 'WARN'].includes(log.level) && "text-white/50"
                        )}>[{log.timestamp}]</span>

                        <span className={cn(
                            "font-bold uppercase",
                            log.level === 'INFO' && "text-cyan-400",
                            log.level === 'DEBUG' && "text-blue-400",
                            log.level === 'SUCCESS' && "text-green-400",
                            log.level === 'WARN' && "text-yellow-500",
                            log.level === 'ERROR' && "text-red-500"
                        )}>
                            {log.level}:
                        </span>

                        {/* 訊息內容 */}
                        <span className="text-white/80 flex-1 font-normal">{log.message}</span>
                    </div>
                ))
            )}
        </div>
    );
};

/**
 * AI Assistant Chat View (ASChat)
 * 負責與 AI 進行策略對話
 */
const AIAssistantView: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { id: '1', role: 'assistant', content: '您好！我是您的交易助手。您可以問我關於策略建議、行情分析或是幫您優化目前的交易節點。', timestamp: '17:25:01' }
    ]);
    const [input, setInput] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    const handleSend = () => {
        if (!input.trim()) return;
        const newMsg: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
        };
        setMessages([...messages, newMsg]);
        setInput('');

        // Mock AI Response
        setTimeout(() => {
            const aiMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `我收到了您的指令：「${input}」。這是一個有趣的策略方向，我正在分析相關數據... (目前為演示模式)`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
            };
            setMessages(prev => [...prev, aiMsg]);
        }, 1000);
    };

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-background/30">
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                    <div key={msg.id} className={cn(
                        "flex gap-3 max-w-[90%]",
                        msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                    )}>
                        <div className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center shrink-0",
                            msg.role === 'assistant' ? "bg-primary/20 text-primary" : "bg-white/10 text-white"
                        )}>
                            {msg.role === 'assistant' ? <Sparkles size={12} /> : <User size={12} />}
                        </div>
                        <div className={cn(
                            "p-3 rounded-2xl text-[11px] leading-relaxed relative",
                            msg.role === 'assistant' ? "bg-surface/50 text-white border border-white/5 rounded-tl-none" : "bg-primary text-black font-medium rounded-tr-none"
                        )}>
                            {msg.content}
                            <div className={cn(
                                "text-[8px] mt-1.5 opacity-40",
                                msg.role === 'user' ? "text-right" : ""
                            )}>
                                {msg.timestamp}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {/* Chat Input */}
            <div className="p-3 border-t border-white/5 bg-surface/20 flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask AI for strategy suggestions..."
                    className="flex-1 bg-background/50 border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder:text-subtext/30 focus:outline-none focus:border-primary/50 transition-colors"
                />
                <button
                    onClick={handleSend}
                    className="bg-primary text-black p-2 rounded-xl hover:bg-primary/80 transition-colors shrink-0"
                >
                    <Send size={16} />
                </button>
            </div>
        </div>
    );
};

// --- Main Container ---

const LogConsole: React.FC = () => {
    const [activeTab, setActiveTab] = useState('SYSTEM CONSOLE');
    const [isExpanded, setIsExpanded] = useState(true);
    const [height, setHeight] = useState(280);
    const isResizing = useRef(false);

    // 真實的後端日誌 (通過 WebSocket 接收)
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const wsRef = useRef<WebSocket | null>(null);

    // 連接到後端 WebSocket 接收日誌
    useEffect(() => {
        const connectWebSocket = () => {
            const ws = new WebSocket('ws://localhost:8000/ws');
            wsRef.current = ws;

            ws.onopen = () => {
                console.log('[LogConsole] WebSocket connected for system logs');
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    // 檢查是否為日誌訊息 (從 backend logger 發送的格式)
                    // 我們需要在後端廣播日誌時使用特定格式,例如:
                    // { type: 'LOG', timestamp: '22:44:18', level: 'INFO', message: '...' }
                    if (data.type === 'LOG') {
                        const newLog: LogEntry = {
                            timestamp: data.timestamp,
                            level: data.level,
                            message: data.message
                        };
                        setLogs(prev => [...prev, newLog]);
                    }
                } catch (e) {
                    // 忽略非 JSON 訊息
                }
            };

            ws.onerror = (error) => {
                console.error('[LogConsole] WebSocket error:', error);
            };

            ws.onclose = () => {
                console.log('[LogConsole] WebSocket closed, reconnecting...');
                // 5 秒後重連
                setTimeout(connectWebSocket, 5000);
            };
        };

        connectWebSocket();

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, []);

    const tabs = [
        { id: 'SYSTEM CONSOLE', label: 'SYSTEM CONSOLE', icon: <Terminal size={12} /> },
        { id: 'AI ASSISTANT', label: 'AI ASSISTANT', icon: <Sparkles size={12} /> },
        { id: 'ACTIVE TRADES', label: 'ACTIVE TRADES', icon: null },
    ];

    const startResizing = React.useCallback(() => {
        isResizing.current = true;
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', stopResizing);
        document.body.style.cursor = 'row-resize';
        document.body.style.userSelect = 'none';
    }, []);

    const stopResizing = React.useCallback(() => {
        isResizing.current = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', stopResizing);
        document.body.style.cursor = 'default';
        document.body.style.userSelect = 'auto';
    }, []);

    const handleMouseMove = React.useCallback((e: MouseEvent) => {
        if (!isResizing.current) return;
        const newHeight = window.innerHeight - e.clientY;
        if (newHeight > 120 && newHeight < window.innerHeight * 0.8) {
            setHeight(newHeight);
            if (!isExpanded) setIsExpanded(true);
        }
    }, [isExpanded]);

    return (
        <div
            className={cn(
                "flex flex-col bg-background border-t border-white/10 relative overflow-hidden",
                !isExpanded && "!h-10"
            )}
            style={isExpanded ? { height: `${height}px` } : {}}
        >
            {/* Resize Handle */}
            {isExpanded && (
                <div
                    onMouseDown={startResizing}
                    className="absolute top-0 left-0 right-0 h-1 cursor-row-resize hover:bg-primary/30 transition-colors z-50"
                />
            )}

            {/* Console Header */}
            <div className="flex items-center h-10 px-4 bg-surface border-b border-white/5 shrink-0 select-none">
                <div className="flex gap-1 h-full">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "relative flex items-center gap-2 px-4 text-[10px] font-bold tracking-widest transition-all",
                                activeTab === tab.id
                                    ? "text-primary bg-primary/5 border-b-2 border-primary"
                                    : "text-subtext hover:text-white"
                            )}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="ml-auto flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold text-subtext uppercase tracking-widest">Latency:</span>
                        <span className="text-[9px] font-bold text-primary">12ms</span>
                    </div>
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="text-subtext hover:text-white transition-colors p-1"
                    >
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                    </button>
                </div>
            </div>

            {/* Content Area Render Logic */}
            {isExpanded && (
                <div className="flex-1 flex flex-col min-h-0 bg-background/20">
                    {activeTab === 'SYSTEM CONSOLE' && <SystemLogsView logs={logs} />}
                    {activeTab === 'AI ASSISTANT' && <AIAssistantView />}
                    {activeTab === 'ACTIVE TRADES' && (
                        <div className="flex-1 flex items-center justify-center text-[10px] text-subtext/30 uppercase tracking-[0.2em]">
                            No active trades tracked in this session
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default LogConsole;
