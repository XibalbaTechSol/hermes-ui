import React, { useState, useEffect } from 'react';
import { 
  ReactFlow, 
  Background, 
  useNodesState, 
  useEdgesState,
  type Node,
  type Edge
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const API_BASE = `http://${window.location.hostname}:3008/api`;

const DashboardView: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [usage, setUsage] = useState<any>(null);
  const [customizing, setCustomizing] = useState(false);
  const [nodes, setNodes] = useNodesState<Node>([]);
  const [edges, setEdges] = useEdgesState<Edge>([]);

  useEffect(() => {
    // Fetch system stats
    fetch(`${API_BASE}/system`)
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error(err));

    // Fetch token usage
    fetch(`${API_BASE}/usage`)
      .then(res => res.json())
      .then(data => setUsage(data))
      .catch(err => console.error(err));

    // Fetch graph for preview
    fetch(`${API_BASE}/graph`)
      .then(res => res.json())
      .then(data => {
        setNodes(data.nodes || []);
        setEdges(data.edges || []);
      })
      .catch(err => {
        console.error(err);
      });
  }, []);

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-[var(--bg-main)]" data-testid="dashboard-view-container">
      <div className="max-w-7xl mx-auto space-y-10">
        <header className="flex justify-between items-end border-b border-[var(--border-main)] pb-8">
          <div>
            <h2 className="text-4xl font-bold text-[var(--text-bright)] tracking-tighter">HERMES_CORE_DASHBOARD</h2>
            <p className="text-[10px] text-[var(--text-muted)] mt-2 uppercase tracking-[0.5em]">Real-time Neural Telemetry & Topology</p>
          </div>
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setCustomizing(!customizing)}
              data-testid="customize-dashboard-btn"
              className={`px-4 py-2 border text-[10px] font-bold tracking-widest transition-all ${
                customizing 
                ? 'bg-[var(--accent)] border-[var(--accent)] text-[var(--bg-main)]' 
                : 'border-[var(--border-bright)] text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
              }`}
            >
              {customizing ? 'SAVE LAYOUT' : 'CUSTOMIZE DASHBOARD'}
            </button>
            <div className="text-right">
              <div className="text-[#00FF41] text-[10px] font-bold tracking-widest uppercase">Status: Online</div>
              <div className="text-[var(--text-muted)] text-[9px] font-mono mt-1 uppercase">Link established via local_node</div>
            </div>
          </div>
        </header>

        {/* SYSTEM STATS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4" data-testid="system-stats-grid">
          <StatCard label="Memory Load" value={`${stats?.memory?.used || 0}GB`} subValue={`of ${stats?.memory?.total || 0}GB`} color="var(--accent)" customizing={customizing} testId="stat-memory" />
          <StatCard label="CPU Utilization" value={`${stats?.cpu || 0}%`} subValue="Neural tick rate" color="#00FF41" customizing={customizing} testId="stat-cpu" />
          <StatCard label="System Uptime" value={`${Math.floor((stats?.uptime || 0) / 3600)}h`} subValue={`${Math.floor(((stats?.uptime || 0) % 3600) / 60)}m active`} color="#007AFF" customizing={customizing} testId="stat-uptime" />
          <StatCard label="Neural Token Usage" value={usage?.total_tokens?.toLocaleString() || "0"} subValue={`Est. Cost: $${usage?.total_cost || "0.00"} USD`} color="var(--text-bright)" customizing={customizing} testId="stat-tokens" />
        </div>

        {/* TOPOLOGY PREVIEW & FEED & TOKEN STATS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-xl overflow-hidden h-[500px] relative group" data-testid="topology-preview">
            <div className="absolute top-6 left-6 z-10">
              <h3 className="text-xs font-bold text-[var(--text-bright)] tracking-widest uppercase mb-1">Architecture Topology</h3>
              <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-widest">Interactive neural mapping</div>
            </div>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              fitView
              colorMode="dark"
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable={false}
              panOnDrag={true}
              zoomOnScroll={false}
            >
              <Background color="var(--border-main)" gap={20} size={1} />
            </ReactFlow>
            <div className="absolute bottom-6 right-6 flex gap-2">
               <div className="px-3 py-1 bg-[var(--bg-main)]/80 border border-[var(--border-main)] rounded-full text-[8px] font-bold text-[var(--accent)] uppercase tracking-widest">Live View</div>
            </div>
          </div>

          <div className="flex flex-col gap-8">
            {/* TOKEN INTELLIGENCE WIDGET */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-xl flex flex-col overflow-hidden shrink-0">
              <div className="p-6 border-b border-[var(--border-main)]">
                <h3 className="text-xs font-bold text-[var(--text-bright)] tracking-widest uppercase">Token Intelligence</h3>
                <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-widest mt-1">Resource allocation metrics</div>
              </div>
              <div className="p-6 space-y-4">
                {usage?.sessions?.length > 0 ? (
                  usage.sessions.map((s: any) => (
                    <div key={s.id} className="flex justify-between items-center group">
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] font-bold text-[var(--text-muted)] truncate group-hover:text-[var(--text-bright)] transition-colors">{s.title}</div>
                        <div className="text-[8px] text-[var(--text-muted)] uppercase tracking-tighter">{s.time}</div>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-[10px] font-mono text-[var(--accent)]">{s.tokens.toLocaleString()}</div>
                        <div className="text-[8px] text-[var(--text-muted)]">${s.cost}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-[10px] text-[var(--text-muted)] text-center py-4 uppercase tracking-widest font-bold opacity-50">No recent neural activity</div>
                )}
              </div>
            </div>

            {/* TELEMETRY FEED */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-xl flex-1 flex flex-col overflow-hidden min-h-[200px]" data-testid="terminal-feed">
              <div className="p-6 border-b border-[var(--border-main)]">
                <h3 className="text-xs font-bold text-[var(--text-bright)] tracking-widest uppercase">Terminal Feed</h3>
                <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-widest mt-1">Global System Logs</div>
              </div>
              <div className="flex-1 bg-[var(--bg-input)] p-6 font-mono text-[10px] text-[var(--text-muted)] overflow-y-auto space-y-3">
                 <div className="text-[#00FF41]/60 leading-relaxed"><span className="text-[var(--text-muted)] mr-2">04:20:01</span> [CORE] Neural pathways initialized.</div>
                 <div className="text-[#007AFF]/60 leading-relaxed"><span className="text-[var(--text-muted)] mr-2">04:20:05</span> [GATEWAY] Telegram bridge active.</div>
                 <div className="text-[var(--accent)]/60 leading-relaxed"><span className="text-[var(--text-muted)] mr-2">04:21:12</span> [MEMORY] Flush sequence completed.</div>
                 <div className="leading-relaxed"><span className="text-[var(--text-muted)] mr-2">04:22:45</span> [MCP] Registered github-mcp server.</div>
                 <div className="leading-relaxed"><span className="text-[var(--text-muted)] mr-2">04:25:30</span> [AGENT] Resumed session 20260325.</div>
                 <div className="text-[#00FF41]/60 leading-relaxed"><span className="text-[var(--text-muted)] mr-2">04:30:01</span> [CORE] Heartbeat signal sent.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{label: string, value: string, subValue: string, color: string, customizing?: boolean, testId?: string}> = ({label, value, subValue, color, customizing, testId}) => (
  <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] p-6 rounded-xl hover:border-[var(--border-bright)] transition-all group relative overflow-hidden" data-testid={testId}>
    <div className="absolute top-0 left-0 w-full h-[2px]" style={{ backgroundColor: `${color.startsWith('var') ? `var(--accent-soft)` : `${color}20`}` }}></div>
    <div className="absolute top-0 left-0 w-1/3 h-[2px]" style={{ backgroundColor: color }}></div>
    <div className="flex justify-between items-start mb-4">
      <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest group-hover:text-[var(--text-muted)] transition-colors">{label}</div>
      {customizing && <div className="text-[var(--accent)] text-xs font-bold animate-pulse">↓</div>}
    </div>
    <div className="text-3xl font-bold text-[var(--text-bright)] tracking-tighter mb-1">{value}</div>
    <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest">{subValue}</div>
  </div>
);

export default DashboardView;
