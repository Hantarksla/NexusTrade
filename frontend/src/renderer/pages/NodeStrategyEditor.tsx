import React, { useState, useCallback } from 'react';
import ReactFlow, {
    addEdge,
    Background,
    Controls,
    Connection,
    Edge,
    Node,
    applyNodeChanges,
    applyEdgeChanges,
    NodeChange,
    EdgeChange
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Save, Play, Trash2, Plus } from 'lucide-react';

const initialNodes: Node[] = [
    {
        id: '1',
        type: 'input',
        data: { label: 'Price Stream (BTC/USDT)' },
        position: { x: 50, y: 150 },
        style: { background: '#1F2937', color: '#fff', border: '1px solid #10B981', borderRadius: '8px' },
    },
    {
        id: '2',
        data: { label: 'RSI Indicator (14)' },
        position: { x: 300, y: 100 },
        style: { background: '#1F2937', color: '#fff', border: '1px solid #3B82F6', borderRadius: '8px' },
    },
    {
        id: '3',
        data: { label: 'Greater Than (70)' },
        position: { x: 550, y: 100 },
        style: { background: '#1F2937', color: '#fff', border: '1px solid #F59E0B', borderRadius: '8px' },
    },
    {
        id: '4',
        type: 'output',
        data: { label: 'Action: SELL' },
        position: { x: 800, y: 150 },
        style: { background: '#1F2937', color: '#fff', border: '1px solid #EF4444', borderRadius: '8px' },
    },
];

const initialEdges: Edge[] = [
    { id: 'e1-2', source: '1', target: '2', animated: true },
    { id: 'e2-3', source: '2', target: '3' },
    { id: 'e3-4', source: '3', target: '4' },
];

const NodeStrategyEditor: React.FC = () => {
    const [nodes, setNodes] = useState<Node[]>(initialNodes);
    const [edges, setEdges] = useState<Edge[]>(initialEdges);

    const onNodesChange = useCallback(
        (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
        [setNodes]
    );
    const onEdgesChange = useCallback(
        (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
        [setEdges]
    );
    const onConnect = useCallback(
        (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
        [setEdges]
    );

    return (
        <div className="flex flex-col h-full bg-background relative overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-3 border-b border-white/5 bg-surface/20">
                <div className="flex items-center gap-4">
                    <h2 className="text-sm font-bold text-white px-2">Untitled Strategy</h2>
                    <div className="h-4 w-px bg-white/10" />
                    <div className="flex gap-2">
                        <button className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-[10px] font-bold text-white rounded-lg transition-colors">
                            <Plus size={14} className="text-primary" />
                            ADD NODE
                        </button>
                        <button className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-[10px] font-bold text-white rounded-lg transition-colors">
                            <Save size={14} className="text-blue-400" />
                            SAVE
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 px-4 py-1.5 bg-primary text-black text-[10px] font-bold rounded-lg hover:bg-primary/90 transition-colors">
                        <Play size={14} />
                        DEPLOY STRATEGY
                    </button>
                    <button className="p-2 text-subtext hover:text-red-500 transition-colors bg-white/5 rounded-lg">
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            {/* Editor Area */}
            <div className="flex-1 relative">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    fitView
                    style={{ background: '#0A0E12' }}
                >
                    <Background color="#1F2937" gap={20} />
                    <Controls />
                </ReactFlow>

                {/* Node Library Overlay (Simplified for now) */}
                <div className="absolute top-4 left-4 w-48 bg-surface/80 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-2xl pointer-events-auto">
                    <span className="text-[10px] font-bold text-subtext uppercase tracking-widest mb-3 block">Node Library</span>
                    <div className="space-y-2">
                        {['Indicator', 'Logic', 'Operator', 'Action'].map(cat => (
                            <div key={cat} className="p-2 bg-white/5 rounded-lg border border-white/5 hover:border-primary/50 cursor-pointer transition-all">
                                <span className="text-[10px] font-medium text-white">{cat}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NodeStrategyEditor;
