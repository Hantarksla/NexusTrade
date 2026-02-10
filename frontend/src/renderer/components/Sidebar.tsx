import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Network,
    BarChart3,
    Bot,
    Settings,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { cn } from '../../lib/utils'; // I'll create this utility

const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { id: 'node_editor', icon: Network, label: 'Node Strategy Editor', path: '/node_editor' },
    { id: 'chart', icon: BarChart3, label: 'Chart & Monitor', path: '/chart' },
    { id: 'ai', icon: Bot, label: 'AI Assistant', path: '/ai' },
];

const Sidebar: React.FC = () => {
    const [collapsed, setCollapsed] = React.useState(false);

    return (
        <aside
            className={cn(
                "flex flex-col bg-secondary border-r border-white/5 transition-all duration-300 h-screen",
                collapsed ? "w-20" : "w-64"
            )}
        >
            {/* Logo Area */}
            <div className="flex items-center h-20 px-6 gap-3 border-b border-white/5">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                    <Bot className="w-5 h-5 text-background" />
                </div>
                {!collapsed && (
                    <span className="text-lg font-bold tracking-tight text-primary">VNC-TRADER</span>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-6 px-3 space-y-1">
                {navItems.map((item) => (
                    <NavLink
                        key={item.id}
                        to={item.path}
                        className={({ isActive }) => cn(
                            "flex items-center gap-3 px-3 py-3 rounded-xl transition-all group",
                            isActive
                                ? "bg-primary/10 text-primary border border-primary/20"
                                : "text-subtext hover:bg-white/5 hover:text-text"
                        )}
                    >
                        {({ isActive }) => (
                            <>
                                <item.icon className={cn(
                                    "w-5 h-5 transition-transform group-hover:scale-110",
                                    collapsed ? "mx-auto" : ""
                                )} />
                                {!collapsed && (
                                    <span className="font-medium text-sm">{item.label}</span>
                                )}
                                {isActive && !collapsed && (
                                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(0,217,163,0.6)]" />
                                )}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* Footer / Settings */}
            <div className="p-3 border-t border-white/5 space-y-1">
                <NavLink
                    to="/settings"
                    className={({ isActive }) => cn(
                        "flex items-center gap-3 px-3 py-3 rounded-xl transition-all group",
                        isActive
                            ? "bg-primary/10 text-primary border border-primary/20"
                            : "text-subtext hover:bg-white/5 hover:text-text"
                    )}
                >
                    <Settings className={cn(
                        "w-5 h-5",
                        collapsed ? "mx-auto" : ""
                    )} />
                    {!collapsed && <span className="font-medium text-sm">Settings</span>}
                </NavLink>

                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-subtext hover:bg-white/5 hover:text-text transition-all"
                >
                    {collapsed ? (
                        <ChevronRight className="w-5 h-5 mx-auto" />
                    ) : (
                        <>
                            <ChevronLeft className="w-5 h-5" />
                            <span className="font-medium text-sm">Collapse Sidebar</span>
                        </>
                    )}
                </button>
            </div>

            {/* User Info Placeholder */}
            {!collapsed && (
                <div className="p-6 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-surface border border-white/10 flex items-center justify-center overflow-hidden">
                        <div className="w-full h-full bg-gradient-to-br from-primary/40 to-accent/40" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold text-white">Alpha User</span>
                        <span className="text-[10px] text-primary font-bold uppercase tracking-wider">Pro Member</span>
                    </div>
                </div>
            )}
        </aside>
    );
};

export default Sidebar;
