import React, { useCallback, useEffect, useState, useRef } from 'react';
import { 
  ReactFlow, 
  MiniMap, 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState, 
  addEdge,
  Panel,
  ReactFlowProvider,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
  Handle,
  Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// --- CUSTOM NODES ---

const ConfigNode = ({ data, selected }: any) => (
  <div className={`px-4 py-3 rounded-lg bg-[var(--info)]/5 border-2 transition-all ${selected ? 'border-[var(--info)] shadow-[0_0_15px_rgba(0,122,255,0.4)]' : 'border-[var(--info)]/30'}`}>
    <div className="flex items-center gap-2 mb-1">
      <div className="w-2 h-2 bg-[var(--info)] rounded-full"></div>
      <span className="text-[10px] font-bold text-[var(--info)] uppercase tracking-widest">Configuration</span>
    </div>
    <div className="flex items-center gap-2">
      <span className="text-sm">{data.icon || '⚙️'}</span>
      <div className="text-xs font-bold text-[var(--text-bright)]">{data.label}</div>
    </div>
    <Handle type="source" position={Position.Bottom} className="w-2 h-2 !bg-[var(--info)] border-none" />
  </div>
);

const MemoryNode = ({ data, selected }: any) => (
  <div className={`px-4 py-3 rounded-lg bg-[var(--warning)]/5 border-2 transition-all ${selected ? 'border-[var(--warning)] shadow-[0_0_15px_rgba(255,138,0,0.4)]' : 'border-[var(--warning)]/30'}`}>
    <div className="flex items-center gap-2 mb-1">
      <div className="w-2 h-2 bg-[var(--warning)] rounded-sm"></div>
      <span className="text-[10px] font-bold text-[var(--warning)] uppercase tracking-widest">Memory Store</span>
    </div>
    <div className="flex items-center gap-2">
      <span className="text-sm">{data.icon || '💾'}</span>
      <div className="text-xs font-bold text-[var(--text-bright)]">{data.label}</div>
    </div>
    <Handle type="target" position={Position.Top} className="w-2 h-2 !bg-[var(--warning)] border-none" />
  </div>
);

const SkillNode = ({ data, selected }: any) => (
  <div className={`px-4 py-3 rounded-lg bg-[var(--success)]/5 border-2 transition-all ${selected ? 'border-[var(--success)] shadow-[0_0_15px_rgba(0,255,65,0.4)]' : 'border-[var(--success)]/30'}`}>
    <div className="flex items-center gap-2 mb-1">
      <div className="w-2 h-2 bg-[var(--success)] rounded-full"></div>
      <span className="text-[10px] font-bold text-[var(--success)] uppercase tracking-widest">Neural Skill</span>
    </div>
    <div className="flex items-center gap-2">
      <span className="text-sm">{data.icon || '🛠️'}</span>
      <div className="text-xs font-bold text-[var(--text-bright)]">{data.label}</div>
    </div>
    <Handle type="target" position={Position.Top} className="w-2 h-2 !bg-[var(--success)] border-none" />
  </div>
);

const SubagentNode = ({ data, selected }: any) => (
  <div className={`px-4 py-3 rounded-lg bg-[var(--accent)]/5 border-2 transition-all ${selected ? 'border-[var(--accent)] shadow-[0_0_15px_rgba(255,77,0,0.4)]' : 'border-[var(--accent)]/30'}`}>
    <div className="flex items-center gap-2 mb-1">
      <div className="w-2 h-2 bg-[var(--accent)] rounded-sm animate-pulse"></div>
      <span className="text-[10px] font-bold text-[var(--accent)] uppercase tracking-widest">Agency Division</span>
    </div>
    <div className="flex items-center gap-2">
      <span className="text-sm">{data.icon || '🧠'}</span>
      <div className="text-xs font-bold text-[var(--text-bright)]">{data.label}</div>
    </div>
    <Handle type="target" position={Position.Top} className="w-2 h-2 !bg-[var(--accent)] border-none" />
  </div>
);

const LoopNode = ({ data, selected }: any) => (
  <div className={`px-5 py-4 rounded-2xl bg-[var(--info)]/5 border-2 transition-all ${selected ? 'border-[var(--info)] shadow-[0_0_25px_rgba(0,122,255,0.3)]' : 'border-[var(--info)]/20'}`}>
    <div className="flex flex-col items-center text-center gap-2">
      <div className="w-10 h-10 rounded-full bg-[var(--info)]/10 flex items-center justify-center text-2xl animate-spin-slow">
        {data.icon || '🌀'}
      </div>
      <div>
        <div className="text-[10px] font-black text-[var(--info)] uppercase tracking-[0.2em]">NEURAL_LOOP</div>
        <div className="text-xs font-bold text-[var(--text-bright)] mt-0.5">{data.label}</div>
      </div>
    </div>
    <Handle type="target" position={Position.Top} className="w-2 h-2 !bg-[var(--info)] border-none" />
    <Handle type="source" position={Position.Bottom} className="w-2 h-2 !bg-[var(--info)] border-none" />
  </div>
);

const McpNode = ({ data, selected }: any) => (
  <div className={`px-4 py-3 rounded-lg bg-[var(--text-bright)]/5 border-2 transition-all ${selected ? 'border-[var(--text-bright)] shadow-[0_0_15px_rgba(255,255,255,0.2)]' : 'border-[var(--text-bright)]/20'}`}>
    <div className="flex items-center gap-2 mb-1">
      <div className="w-2 h-2 bg-[var(--text-bright)] rounded-full animate-pulse"></div>
      <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Protocol Link (MCP)</span>
    </div>
    <div className="flex items-center gap-2">
      <span className="text-sm">{data.icon || '🔌'}</span>
      <div className="text-xs font-bold text-[var(--text-bright)]">{data.label}</div>
    </div>
    <Handle type="target" position={Position.Top} className="w-2 h-2 !bg-[var(--text-bright)] border-none" />
  </div>
);

const CoreNode = () => (
  <div className="px-8 py-6 rounded-2xl bg-[var(--bg-surface)] border-4 border-[var(--accent)] shadow-[0_0_50px_rgba(255,77,0,0.3)]">
    <div className="flex flex-col items-center gap-3">
      <div className="w-12 h-12 bg-[var(--accent)] rounded-xl flex items-center justify-center text-[var(--bg-main)] font-black text-2xl">H</div>
      <div className="text-base font-black text-[var(--text-bright)] tracking-tighter uppercase">Hermes Core</div>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-[var(--success)] rounded-full animate-pulse"></div>
        <span className="text-[10px] font-bold text-[var(--success)] tracking-widest">NEURAL_HUB_ACTIVE</span>
      </div>
    </div>
    <Handle type="target" position={Position.Top} className="w-2 h-2 !bg-[var(--accent)] border-none" />
    <Handle type="target" position={Position.Left} className="w-2 h-2 !bg-[var(--accent)] border-none" />
    <Handle type="target" position={Position.Right} className="w-2 h-2 !bg-[var(--accent)] border-none" />
    <Handle type="source" position={Position.Bottom} className="w-2 h-2 !bg-[var(--accent)] border-none" />
  </div>
);

export const nodeTypes = {
  config: ConfigNode,
  memory: MemoryNode,
  skill: SkillNode,
  subagent: SubagentNode,
  loop: LoopNode,
  hermes: CoreNode,
  mcp: McpNode,
  action: ConfigNode,
  // Fallbacks for common names in JSON
  system: ConfigNode,
  db: MemoryNode,
  trigger: ConfigNode,
};

// --- MAIN COMPONENT ---

const GraphContent: React.FC = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const { screenToFlowPosition } = useReactFlow();
  const [loading, setLoading] = useState(true);
  const [selectedElement, setSelectedElement] = useState<any>(null);
  const [executionOutput, setExecutionOutput] = useState('');
  const [running, setRunning] = useState(false);
  const [memoryContent, setMemoryContent] = useState('');
  const [skillContent, setSkillContent] = useState('');
  const [agentContent, setAgentContent] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchGraph = () => {
    fetch('http://localhost:3008/api/graph')
      .then(res => res.json())
      .then(data => {
        setNodes(data.nodes || []);
        setEdges(data.edges || []);
        setLoading(false);
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchGraph();
  }, []);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#FF4D00' } }, eds)),
    [setEdges],
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow');
      const label = event.dataTransfer.getData('application/label');
      const icon = event.dataTransfer.getData('application/icon');
      if (typeof type === 'undefined' || !type) return;
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      const newNode: Node = {
        id: `${type}-${Math.random().toString(36).substr(2, 9)}`,
        type,
        position,
        data: { label: label || `New ${type}`, icon: icon || '🌀', values: {} },
      };
      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition, setNodes]
  );

  const handleAction = (cmd: string, args: string = '') => {
    setRunning(true);
    setExecutionOutput(`> hermes ${cmd} ${args} --yolo\nInitializing neural sequence...\n`);
    fetch('http://localhost:3008/api/commands/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: cmd, args })
    })
    .then(res => res.json())
    .then(data => {
      setExecutionOutput(prev => prev + (data.output || data.error || 'Sequence completed.'));
      setRunning(false);
    })
    .catch(err => {
      setExecutionOutput(prev => prev + `FATAL_ERROR: ${err.message}`);
      setRunning(false);
    });
  };

  const updateNodeLabel = (id: string, label: string) => {
    setNodes((nds) => nds.map(n => n.id === id ? { ...n, data: { ...n.data as any, label } } : n));
    if (selectedElement?.id === id) setSelectedElement({ ...selectedElement, data: { ...selectedElement.data as any, label } });
  };

  const fetchMemory = (file: string) => {
    fetch(`http://localhost:3008/api/config_file/${file}`)
      .then(res => res.json())
      .then(d => setMemoryContent(d.content || ''))
      .catch(err => console.error(err));
  };

  const fetchSkill = (relPath: string) => {
    fetch(`http://localhost:3008/api/skills/content?relPath=${encodeURIComponent(relPath)}`)
      .then(res => res.json())
      .then(d => setSkillContent(d.content || ''))
      .catch(err => console.error(err));
  };

  const fetchAgent = (category: string, name: string) => {
    fetch(`http://localhost:3008/api/subagents/${encodeURIComponent(category)}/${encodeURIComponent(name)}`)
      .then(res => res.json())
      .then(d => setAgentContent(d.content || ''))
      .catch(err => console.error(err));
  };

  const onNodeClick = (_: any, node: Node) => {
    setSelectedElement(node);
    setExecutionOutput('');
    setSkillContent('');
    setAgentContent('');
    setMemoryContent('');
    
    if (node.type === 'memory' || node.type === 'db' || node.type === 'config') {
      const file = (node.data as any).uri || (node.data as any).file || node.data.label;
      fetchMemory(file);
    } else if (node.type === 'skill') {
      fetchSkill(String((node.data as any).skillPath || node.data.label));
    } else if (node.type === 'subagent') {
      fetchAgent(String((node.data as any).category || 'general'), String((node.data as any).agentId || node.data.label));
    }
  };

  const handleSaveSkill = () => {
    if (!selectedElement) return;
    setSaving(true);
    fetch('http://localhost:3008/api/skills/content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ relPath: (selectedElement.data as any).skillPath || selectedElement.data.label.toLowerCase(), content: skillContent })
    })
    .then(() => { setSaving(false); alert('Skill protocol updated.'); })
    .catch(err => { setSaving(false); console.error(err); });
  };

  const handleSaveAgent = () => {
    if (!selectedElement) return;
    setSaving(true);
    fetch(`http://localhost:3008/api/subagents/${(selectedElement.data as any).category || 'general'}/${(selectedElement.data as any).agentId || selectedElement.data.label.toLowerCase()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: agentContent })
    })
    .then(() => { setSaving(false); alert('Agent logic synchronized.'); })
    .catch(err => { setSaving(false); console.error(err); });
  };

  if (loading) return <div data-testid="loading-indicator" className="flex-1 flex items-center justify-center text-[#FF4D00] animate-pulse uppercase tracking-[0.5em] font-black">Booting Neural Engine...</div>;

  return (
    <div data-testid="graph-view-container" className="flex-1 w-full h-full bg-[var(--bg-obsidian)] flex overflow-hidden">
      {/* SIDEBAR */}
      <div className="w-72 bg-[#0c0c0c] border-r border-[var(--border-main)] flex flex-col p-6 overflow-y-auto no-scrollbar">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-4 h-4 bg-[var(--accent-orange)] rounded rotate-45 shadow-[0_0_15px_#FF4D00]"></div>
          <h2 className="text-lg font-black text-[var(--text-bright)] tracking-tighter uppercase">Automation Engine</h2>
        </div>
        <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-[0.3em] mb-8 border-b border-[var(--border-main)] pb-4">Neural Architecture Toolset</p>

        <div className="space-y-8">
          <LibrarySection title="Cognitive Loops">
            <DraggableNode type="loop" label="Neural Loop" icon="🌀" />
          </LibrarySection>

          <LibrarySection title="Knowledge & Protocol">
            <DraggableNode type="memory" label="Memory Store" icon="💾" />
            <DraggableNode type="skill" label="Neural Skill" icon="🛠️" />
            <DraggableNode type="subagent" label="Agency Division" icon="🧠" />
          </LibrarySection>

          <LibrarySection title="Directives">
            <DraggableNode type="mcp" label="Protocol Link" icon="🔌" />
            <DraggableNode type="config" label="Inference Model" icon="🧠" />
          </LibrarySection>
        </div>

        <div className="mt-auto pt-8 border-t border-[var(--border-main)] space-y-4">
           <button onClick={() => fetch('http://localhost:3008/api/graph', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({nodes, edges}) }).then(() => alert('Architecture saved.'))} className="w-full bg-[var(--accent-orange)] text-[#080808] py-3 text-[10px] font-black rounded-lg hover:scale-[1.02] transition-all shadow-[0_0_20px_rgba(255,77,0,0.2)] uppercase tracking-widest">Commit Topology</button>
           <button onClick={fetchGraph} className="w-full bg-[#161616] text-[var(--text-main)] py-3 text-[10px] font-black rounded-lg border border-[var(--border-main)] hover:bg-[#222222] uppercase tracking-widest">Re-Index Layers</button>
        </div>
      </div>

      {/* CANVAS */}
      <div className="flex-1 relative" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeClick={onNodeClick}
          onPaneClick={() => setSelectedElement(null)}
          nodeTypes={nodeTypes}
          fitView
          colorMode="dark"
        >
          {selectedElement && (
            <Panel position="top-right" className="w-[450px] bg-[var(--panel-bg)]/95 border border-[var(--border-main)] p-0 rounded-2xl backdrop-blur-2xl max-h-[90%] overflow-hidden shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
              <div className="p-6 border-b border-[var(--border-main)] flex justify-between items-center bg-[#161616]/50">
                <div className="flex items-center gap-4">
                  <div className="text-2xl">{selectedElement.data?.icon}</div>
                  <div>
                    <h3 className="text-sm font-black text-[var(--text-bright)] uppercase tracking-widest">{selectedElement.data?.label}</h3>
                    <div className="text-[9px] text-[var(--text-muted)] font-mono uppercase mt-0.5">{selectedElement.type?.toUpperCase()} | {selectedElement.id}</div>
                  </div>
                </div>
                <button onClick={() => setSelectedElement(null)} className="text-[var(--text-muted)] hover:text-[var(--text-bright)] text-2xl">×</button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                <div className="space-y-4">
                   <div className="text-[10px] font-bold text-[#FF4D00] uppercase tracking-[0.3em] border-b border-[var(--accent-orange)]/20 pb-2">Neural Identity</div>
                   <div className="space-y-2">
                      <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Node Label</label>
                      <input 
                        value={selectedElement.data?.label || ''}
                        onChange={(e) => updateNodeLabel(selectedElement.id, e.target.value)}
                        className="w-full bg-[var(--bg-obsidian)] border border-[var(--border-main)] p-3 text-xs text-[var(--text-main)] font-mono rounded-xl outline-none focus:border-[var(--accent-orange)]"
                      />
                   </div>
                </div>

                {selectedElement.type === 'skill' && (
                  <div className="space-y-6">
                    <div className="text-[10px] font-bold text-[var(--success)] uppercase tracking-[0.3em] border-b border-[var(--success)]/20 pb-2">Skill Protocol (SKILL.md)</div>
                    <textarea 
                      value={skillContent}
                      onChange={e => setSkillContent(e.target.value)}
                      className="w-full bg-[var(--bg-obsidian)] border border-[var(--border-main)] p-4 rounded-xl h-[300px] text-[11px] text-[var(--text-main)] font-mono outline-none focus:border-[var(--success)] resize-none"
                    />
                    <button 
                      onClick={handleSaveSkill}
                      disabled={saving}
                      className="w-full bg-[var(--success)] text-[#080808] py-3 rounded-xl text-[10px] font-black uppercase tracking-widest"
                    >
                      {saving ? 'Synchronizing...' : 'Update Skill Protocol'}
                    </button>
                  </div>
                )}

                {selectedElement.type === 'subagent' && (
                  <div className="space-y-6">
                    <div className="text-[10px] font-bold text-[#FF4D00] uppercase tracking-[0.3em] border-b border-[var(--accent-orange)]/20 pb-2">Subagent Logic (DNA)</div>
                    <textarea 
                      value={agentContent}
                      onChange={e => setAgentContent(e.target.value)}
                      className="w-full bg-[var(--bg-obsidian)] border border-[var(--border-main)] p-4 rounded-xl h-[300px] text-[11px] text-[var(--text-main)] font-mono outline-none focus:border-[var(--accent-orange)] resize-none"
                    />
                    <button 
                      onClick={handleSaveAgent}
                      disabled={saving}
                      className="w-full bg-[var(--accent-orange)] text-[#080808] py-3 rounded-xl text-[10px] font-black uppercase tracking-widest"
                    >
                      {saving ? 'Synchronizing...' : 'Synchronize Agent Logic'}
                    </button>
                  </div>
                )}

                {(selectedElement.type === 'memory' || selectedElement.type === 'db' || selectedElement.type === 'config') && (
                  <div className="space-y-6">
                    <div className="text-[10px] font-bold text-[var(--warning)] uppercase tracking-[0.3em] border-b border-[var(--warning)]/20 pb-2">Core File Inspection</div>
                    <div className="bg-[var(--bg-obsidian)] border border-[var(--border-main)] p-4 rounded-xl max-h-[300px] overflow-y-auto">
                       <pre className="text-[10px] text-[var(--text-main)] font-mono whitespace-pre-wrap leading-relaxed">{memoryContent || 'Initializing read sequence...'}</pre>
                    </div>
                    <button className="w-full bg-[var(--warning)] text-[#080808] py-3 rounded-xl text-[10px] font-black uppercase tracking-widest">Commit File Change</button>
                  </div>
                )}

                {selectedElement.type === 'loop' && (
                  <div className="space-y-6">
                    <div className="text-[10px] font-bold text-[var(--info)] uppercase tracking-[0.3em] border-b border-[var(--info)]/20 pb-2">Loop Control</div>
                    <div className="p-4 bg-[var(--info)]/5 border border-[var(--info)]/20 rounded-xl text-[11px] text-[var(--text-main)] leading-relaxed italic">
                      {selectedElement.data?.description || 'Active feedback loop ensuring cognitive consistency and neural optimization.'}
                    </div>
                    <button 
                      onClick={() => handleAction('status')}
                      className="w-full bg-[var(--info)] text-white py-4 rounded-xl text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_20px_rgba(0,122,255,0.2)]"
                    >
                      Force Loop Sync
                    </button>
                  </div>
                )}

                {selectedElement.type === 'mcp' && (
                  <div className="space-y-6">
                    <div className="text-[10px] font-bold text-[#888888] uppercase tracking-[0.3em] border-b border-[#888888]/20 pb-2">Protocol Link Configuration</div>
                    <div className="bg-[var(--bg-obsidian)] border border-[var(--border-main)] p-4 rounded-xl space-y-4">
                       <div className="text-[10px] text-[#FF4D00] font-mono">STATUS: ONLINE</div>
                       <div className="text-[10px] text-[#555555] font-mono uppercase tracking-widest">Type: Remote (npx)</div>
                    </div>
                    <button 
                      onClick={() => handleAction('status')}
                      className="w-full bg-[#161616] border border-[var(--border-main)] text-[#888888] py-3 rounded-xl text-[10px] font-black uppercase tracking-widest"
                    >
                      Ping Health
                    </button>
                  </div>
                )}

                {executionOutput && (
                  <div className="space-y-3">
                    <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Neural Telemetry</div>
                    <pre className="bg-[var(--bg-obsidian)] border border-[var(--border-main)] p-6 rounded-2xl font-mono text-[11px] text-[var(--success)] leading-relaxed whitespace-pre-wrap overflow-x-auto selection:bg-[var(--success)]/20 shadow-inner">
                      {executionOutput}
                      {running && <span className="animate-pulse inline-block ml-1">_</span>}
                    </pre>
                  </div>
                )}
              </div>
              
              <div className="p-6 border-t border-[var(--border-main)] bg-[#0c0c0c] flex gap-4 shrink-0">
                 <button 
                   onClick={() => {
                     setNodes((nds) => nds.filter((n) => n.id !== selectedElement.id));
                     setSelectedElement(null);
                   }}
                   className="flex-1 border border-red-500/30 text-red-500/60 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
                 >
                   Purge Node
                 </button>
              </div>
            </Panel>
          )}

          <Controls className="bg-[var(--panel-bg)] border-[var(--border-main)] !fill-[#FF4D00]" />
          <MiniMap nodeStrokeColor="#FF4D00" nodeColor="#111" maskColor="#080808" style={{ backgroundColor: '#080808', border: '1px solid #222' }} />
          <Background color="#222" gap={20} size={1} />
        </ReactFlow>
      </div>
    </div>
  );
};

// --- HELPER COMPONENTS ---

const LibrarySection: React.FC<{title: string, children: React.ReactNode}> = ({title, children}) => (
  <div className="space-y-3">
    <h3 className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest pl-2">{title}</h3>
    <div className="grid grid-cols-1 gap-2">
      {children}
    </div>
  </div>
);

const DraggableNode: React.FC<{type: string, label: string, icon: string}> = ({type, label, icon}) => {
  const onDragStart = (event: React.DragEvent, nodeType: string, nodeLabel: string, nodeIcon: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('application/label', nodeLabel);
    event.dataTransfer.setData('application/icon', nodeIcon);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div 
      draggable 
      onDragStart={(event) => onDragStart(event, type, label, icon)}
      className="bg-[var(--panel-bg)] border border-[var(--border-main)] p-3 rounded-xl flex items-center gap-3 cursor-grab hover:border-[var(--accent-orange)]/40 hover:bg-[#161616] transition-all group active:cursor-grabbing shadow-lg"
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg ${
        type === 'config' ? 'bg-[var(--info)]/10 text-[var(--info)]' :
        type === 'action' ? 'bg-[var(--accent-orange)]/10 text-[#FF4D00]' :
        type === 'memory' ? 'bg-[var(--warning)]/10 text-[var(--warning)]' :
        type === 'skill' ? 'bg-[var(--success)]/10 text-[var(--success)]' :
        type === 'loop' ? 'bg-[var(--info)]/10 text-[var(--info)]' :
        type === 'mcp' ? 'bg-[#E0E0E0]/10 text-[var(--text-bright)]' :
        'bg-[var(--accent-orange)]/10 text-[#FF4D00]'
      }`}>
        {icon}
      </div>
      <span className="text-[11px] font-bold text-[#888888] group-hover:text-[var(--text-bright)] uppercase tracking-tighter">{label}</span>
    </div>
  );
};

const GraphView: React.FC = () => (
  <ReactFlowProvider>
    <GraphContent />
  </ReactFlowProvider>
);

export default GraphView;
