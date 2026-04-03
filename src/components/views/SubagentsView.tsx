import React, { useState, useEffect } from 'react';

interface SubagentSection {
  title: string;
  level: number;
  content: string;
}

interface Subagent {
  id: string;
  name: string;
  category: string;
  description: string;
  is_dir: boolean;
}

interface SubagentData {
  content: string;
  structured: {
    metadata: Record<string, string>;
    sections: SubagentSection[];
  };
}

const API_BASE = `http://${window.location.hostname}:3008/api`;

const SubagentsView: React.FC = () => {
  const [subagents, setSubagents] = useState<Subagent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeAgent, setActiveAgent] = useState<Subagent | null>(null);
  const [agentData, setAgentData] = useState<SubagentData | null>(null);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'structured' | 'raw'>('structured');
  const [layoutMode, setLayoutMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    fetchSubagents();
  }, []);

  const fetchSubagents = () => {
    setLoading(true);
    fetch(`${API_BASE}/subagents`)
      .then(res => res.json())
      .then(data => {
        setSubagents(data.subagents || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  const handleAgentClick = (agent: Subagent) => {
    if (agent.is_dir) return;
    setActiveAgent(agent);
    fetch(`${API_BASE}/subagents/${agent.category}/${agent.name}`)
      .then(res => res.json())
      .then(data => {
        // Defensive check: ensure structured exists
        if (!data.structured) {
          data.structured = { metadata: {}, sections: [] };
        }
        if (!data.structured.sections) {
          data.structured.sections = [];
        }
        setAgentData(data);
        setViewMode('structured');
      })
      .catch(err => console.error(err));
  };

  const handleSave = () => {
    if (!activeAgent || !agentData) return;
    setSaving(true);
    
    // For now, always save the 'content' field which is the full markdown
    fetch(`${API_BASE}/subagents/${activeAgent.category}/${activeAgent.name}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: agentData.content })
    })
    .then(res => res.json())
    .then(() => {
      setSaving(false);
      alert('Neural logic updated.');
    })
    .catch(err => {
      setSaving(false);
      console.error(err);
    });
  };

  const updateSectionContent = (index: number, newContent: string) => {
    if (!agentData) return;
    const newSections = [...agentData.structured.sections];
    newSections[index].content = newContent;
    
    // Reconstruct full markdown content
    let fullContent = '---\n';
    Object.entries(agentData.structured.metadata).forEach(([k, v]) => {
      fullContent += `${k}: ${v}\n`;
    });
    fullContent += '---\n\n';
    
    newSections.forEach(s => {
      const prefix = s.level === 1 ? '# ' : s.level === 2 ? '## ' : '### ';
      fullContent += `${prefix}${s.title}\n${s.content}\n`;
    });

    setAgentData({
      ...agentData,
      content: fullContent,
      structured: { ...agentData.structured, sections: newSections }
    });
  };

  const categories = Array.from(new Set(subagents.map(s => s.category)));

  return (
    <div data-testid="subagents-view-container" className="flex-1 p-8 overflow-y-auto bg-[var(--bg-main)] relative">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h2 data-testid="subagent-orchestrator" className="text-3xl font-bold text-[var(--text-bright)] tracking-tighter uppercase">SUBAGENT ORCHESTRATOR</h2>
          <p className="text-[10px] text-[var(--text-muted)] mt-1 uppercase tracking-[0.4em]">Subagent Division & Logic Control</p>
        </div>
        <div className="flex bg-[var(--bg-surface)] p-1 rounded-lg border border-[var(--border-main)]">
          <button 
            onClick={() => setLayoutMode('grid')}
            className={`px-4 py-1.5 text-[10px] font-bold rounded transition-all ${layoutMode === 'grid' ? 'bg-[var(--accent)] text-[var(--bg-main)]' : 'text-[var(--text-muted)] hover:text-[var(--text-bright)]'}`}
            title="Card View"
          >
            GRID
          </button>
          <button 
            onClick={() => setLayoutMode('list')}
            className={`px-4 py-1.5 text-[10px] font-bold rounded transition-all ${layoutMode === 'list' ? 'bg-[var(--accent)] text-[var(--bg-main)]' : 'text-[var(--text-muted)] hover:text-[var(--text-bright)]'}`}
            title="List View"
          >
            LIST
          </button>
        </div>
      </div>

      {loading ? (
        <div data-testid="loading-indicator" className="py-20 text-center text-[var(--border-main)] animate-pulse font-bold tracking-widest uppercase">Indexing Agency Brain...</div>
      ) : (
        <div className="space-y-12">
          {categories.map(cat => (
            <div key={cat} className="space-y-4">
              <h3 className="text-[10px] font-bold text-[var(--accent)] tracking-[0.3em] uppercase border-b border-[var(--accent)]/20 pb-2">{cat} Division</h3>
              <div className={layoutMode === 'grid' ? "grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4" : "flex flex-col gap-3"}>
                {subagents.filter(s => s.category === cat).map(agent => (
                  <div 
                    key={agent.id}
                    data-testid={`agent-item-${agent.id}`}
                    onClick={() => handleAgentClick(agent)}
                    className={layoutMode === 'grid' 
                      ? "bg-[var(--bg-surface)] border border-[var(--border-main)] p-5 rounded-lg hover:border-[var(--accent)]/40 transition-all cursor-pointer group relative overflow-hidden" 
                      : "bg-[var(--bg-surface)] border border-[var(--border-main)] py-3 px-5 flex items-center gap-6 rounded-lg hover:border-[var(--accent)]/40 transition-all cursor-pointer group relative overflow-hidden"}
                  >
                    {layoutMode === 'grid' ? (
                      <>
                        <div className="flex justify-between items-start mb-4">
                          <div className="w-8 h-8 bg-[var(--bg-main)] rounded flex items-center justify-center text-[var(--text-muted)] font-bold text-xs group-hover:text-[var(--accent)] transition-colors">
                            {agent.is_dir ? '📁' : '🧠'}
                          </div>
                          <div className="text-[8px] text-[var(--text-muted)] font-mono">{agent.id}</div>
                        </div>
                        <h4 className="text-sm font-bold text-[var(--text-bright)] uppercase tracking-wider">{agent.name}</h4>
                        <p className="text-[10px] text-[var(--text-muted)] mt-2 leading-relaxed line-clamp-2">{agent.description}</p>
                      </>
                    ) : (
                      <>
                        <div className="w-8 h-8 bg-[var(--bg-main)] rounded flex items-center justify-center text-[var(--text-muted)] font-bold text-xs shrink-0 group-hover:text-[var(--accent)] transition-colors">
                          {agent.is_dir ? '📁' : '🧠'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-[var(--text-bright)] uppercase tracking-wider truncate">{agent.name}</h4>
                          <p className="text-[10px] text-[var(--text-muted)] leading-relaxed truncate">{agent.description || 'Neural Pathway Definition'}</p>
                        </div>
                        <div className="text-[8px] text-[var(--text-muted)] font-mono shrink-0">{agent.id}</div>
                      </>
                    )}
                    
                    <div className={layoutMode === 'grid' 
                      ? "absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[var(--accent)]/0 to-transparent group-hover:via-[var(--accent)]/40 transition-all" 
                      : "absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[var(--accent)]/0 to-transparent group-hover:via-[var(--accent)]/40 transition-all"}>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AGENT EDITOR MODAL */}
      {activeAgent && agentData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-main)]/95 backdrop-blur-md p-6">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] w-full max-w-6xl h-[90vh] flex flex-col rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden">
            <div className="h-16 border-b border-[var(--border-main)] flex items-center justify-between px-8 bg-[var(--bg-surface)]">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <div className="text-[var(--accent)]">🧠</div>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--text-bright)] uppercase tracking-widest">{activeAgent.name}</h3>
                    <div className="text-[9px] text-[var(--text-muted)] font-mono uppercase tracking-tighter">PATH: agency/{activeAgent.category}/{activeAgent.name}.md</div>
                  </div>
                </div>
                
                <nav className="flex bg-[var(--bg-main)] p-1 rounded-lg border border-[var(--border-main)]">
                  <button 
                    onClick={() => setViewMode('structured')}
                    className={`px-4 py-1.5 text-[10px] font-bold rounded transition-all ${viewMode === 'structured' ? 'bg-[var(--accent)] text-[var(--bg-main)]' : 'text-[var(--text-muted)] hover:text-[var(--text-muted)]'}`}
                  >
                    STRUCTURED
                  </button>
                  <button 
                    onClick={() => setViewMode('raw')}
                    className={`px-4 py-1.5 text-[10px] font-bold rounded transition-all ${viewMode === 'raw' ? 'bg-[var(--accent)] text-[var(--bg-main)]' : 'text-[var(--text-muted)] hover:text-[var(--text-muted)]'}`}
                  >
                    RAW_MARKDOWN
                  </button>
                </nav>
              </div>
              
              <div className="flex gap-4">
                <button 
                  onClick={() => setActiveAgent(null)}
                  className="flex items-center gap-2 text-[10px] font-bold text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors uppercase tracking-widest"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                  Back
                </button>
                <button 
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-[var(--accent)] text-[var(--bg-main)] px-8 py-2 text-xs font-bold rounded-sm hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,77,0,0.2)] uppercase tracking-widest"
                >
                  {saving ? 'SYNCHRONIZING...' : 'UPDATE NEURAL CORE'}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden">
              {viewMode === 'raw' ? (
                <textarea
                  value={agentData.content}
                  onChange={e => setAgentData({ ...agentData, content: e.target.value })}
                  className="w-full h-full bg-[var(--bg-main)] text-[var(--text-main)] p-10 font-mono text-sm outline-none resize-none focus:ring-0 selection:bg-[var(--accent)]/20"
                  spellCheck="false"
                />
              ) : (
                <div className="flex h-full">
                  {/* Sidebar sections list */}
                  <div className="w-64 border-r border-[var(--border-main)] bg-[var(--bg-surface)] flex flex-col p-4 gap-2 overflow-y-auto no-scrollbar">
                    <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2 px-2">Neural Segments</div>
                    {agentData.structured.sections.map((s, i) => (
                      <a 
                        key={i}
                        href={`#section-${i}`}
                        className="text-[10px] font-bold text-[var(--text-muted)] hover:text-[var(--accent)] py-2 px-3 rounded hover:bg-[var(--bg-surface)] transition-all truncate uppercase tracking-tighter"
                      >
                        {s.level > 1 && <span className="opacity-30 mr-1">↳</span>}
                        {s.title}
                      </a>
                    ))}
                  </div>
                  
                  {/* Structured content list */}
                  <div className="flex-1 overflow-y-auto p-10 space-y-12 bg-[radial-gradient(circle_at_top_right,var(--bg-sidebar),transparent)]">
                    {/* Metadata header */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-xl shadow-2xl">
                      {Object.entries(agentData.structured.metadata).map(([k, v]) => (
                        <div key={k}>
                          <label className="block text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">{k}</label>
                          <div className="text-[10px] text-[var(--accent)] font-bold uppercase">{v}</div>
                        </div>
                      ))}
                    </div>

                    {/* Section editors */}
                    {agentData.structured.sections.map((s, i) => (
                      <div key={i} id={`section-${i}`} className="space-y-4 group">
                        <div className="flex items-center gap-3">
                          <div className="h-[1px] flex-1 bg-[var(--border-main)]"></div>
                          <h4 className={`text-xs font-bold uppercase tracking-[0.3em] ${s.level === 1 ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`}>{s.title}</h4>
                          <div className="h-[1px] flex-1 bg-[var(--border-main)]"></div>
                        </div>
                        <textarea
                          value={s.content}
                          onChange={e => updateSectionContent(i, e.target.value)}
                          className="w-full bg-[var(--bg-surface)]/50 border border-[var(--border-main)] group-hover:border-[var(--border-bright)] p-6 text-[11px] text-[var(--text-main)] leading-relaxed font-mono outline-none focus:border-[var(--accent)] rounded-xl transition-all h-fit min-h-[100px]"
                          style={{ height: `${Math.max(100, (s.content.split('\n').length * 20) + 48)}px` }}
                          spellCheck="false"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubagentsView;
