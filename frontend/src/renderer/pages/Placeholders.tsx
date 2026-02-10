import React from 'react';

const PagePlaceholder: React.FC<{ name: string }> = ({ name }) => (
    <div className="p-8">
        <h1 className="text-3xl font-bold text-white mb-2">{name}</h1>
        <p className="text-subtext">This feature is currently under development.</p>
        <div className="mt-12 bg-surface border border-white/5 rounded-2xl p-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-primary/20 animate-pulse" />
            </div>
            <p className="text-subtext italic">The {name} interface is being optimized for the best trading experience.</p>
        </div>
    </div>
);

export const NodeEditor = () => <PagePlaceholder name="Node Strategy Editor" />;
export const ChartMonitor = () => <PagePlaceholder name="Chart & Monitor" />;
export const AIAssistant = () => <PagePlaceholder name="AI Assistant" />;
