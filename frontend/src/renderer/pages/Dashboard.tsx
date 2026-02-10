import React from 'react';

const Dashboard: React.FC = () => {
    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
            <p className="text-subtext">Welcome to NexusTrade AI. Overview of your strategies and account.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
                <div className="bg-surface border border-white/5 rounded-2xl p-6 h-48 flex items-center justify-center text-subtext italic">
                    Market Overview Coming Soon
                </div>
                <div className="bg-surface border border-white/5 rounded-2xl p-6 h-48 flex items-center justify-center text-subtext italic">
                    Active Strategies Coming Soon
                </div>
                <div className="bg-surface border border-white/5 rounded-2xl p-6 h-48 flex items-center justify-center text-subtext italic">
                    Quick Actions Coming Soon
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
