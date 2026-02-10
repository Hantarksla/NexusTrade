import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import LogConsole from './components/LogConsole';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import ChartMonitor from './pages/ChartMonitor';
import NodeStrategyEditor from './pages/NodeStrategyEditor';
import { AIAssistant } from './pages/Placeholders';

const App: React.FC = () => {
    return (
        <Router>
            <div className="flex h-screen bg-background text-text overflow-hidden font-sans">
                <Sidebar />
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    <main className="flex-1 overflow-y-auto">
                        <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/node_editor" element={<NodeStrategyEditor />} />
                            <Route path="/chart" element={<ChartMonitor />} />
                            <Route path="/ai" element={<AIAssistant />} />
                            <Route path="/settings" element={<Settings />} />
                        </Routes>
                    </main>
                    <LogConsole />
                </div>
            </div>
        </Router>
    );
};

export default App;
