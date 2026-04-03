import React, { useState, useEffect } from 'react';

interface MCPServer {
  id: string;
  name: string;
  command: string;
  args: string[];
  status: 'online' | 'offline' | 'error';
  type: 'local' | 'remote';
  origin?: 'hermes' | 'gemini';
}

const API_BASE = `http://${window.location.hostname}:3008/api`;

const MCPView: React.FC = () => {
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [editServer, setEditServer] = useState<{name: string, command: string, args: string, githubUrl: string, isNew: boolean} | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchServers = () => {
    setLoading(true);
    fetch(`${API_BASE}/mcp`)
      .then(res => res.json())
      .then(data => {
        setServers(data.servers || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchServers();
  }, []);

  const handleSaveServer = () => {
    if (!editServer?.name || (!editServer?.command && !editServer?.githubUrl)) return;
    
    let finalCommand = editServer.command || 'npx';
    let finalArgs = editServer.args.split(',').map(a => a.trim()).filter(Boolean);

    if (editServer.githubUrl) {
      finalArgs = ['-y', ...finalArgs, editServer.githubUrl];
    }

    const payload = {
      name: editServer.name,
      command: finalCommand,
      args: finalArgs,
      githubUrl: editServer.githubUrl
    };

    const method = editServer.isNew ? 'POST' : 'PUT';
    const url = editServer.isNew 
      ? `${API_BASE}/mcp` 
      : `${API_BASE}/mcp/${editServer.name}`;

    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(() => {
      setEditServer(null);
      fetchServers();
    })
    .catch(err => console.error(err));
  };

  const handleDelete = (name: string) => {
    const server = servers.find(s => s.name === name);
    if (server?.origin === 'gemini') {
      alert('Extension-based servers are managed via Gemini CLI and cannot be deleted here.');
      return;
    }
    if (!confirm(`Permanently sever link to ${name}?`)) return;
    fetch(`${API_BASE}/mcp/${name}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(() => fetchServers())
      .catch(err => console.error(err));
  };

  const handleTest = (name: string) => {
    setServers(prev => prev.map(s => s.name === name ? { ...s, status: 'error' } : s));
    fetch(`${API_BASE}/mcp/${name}/test`)
      .then(res => res.json())
      .then(data => {
        setServers(prev => prev.map(s => s.name === name ? { ...s, status: data.status } : s));
      })
      .catch(err => {
        console.error(err);
        setServers(prev => prev.map(s => s.name === name ? { ...s, status: 'error' } : s));
      });
  };

  return (
    <div data-testid="mcp-view-container" className="flex-1 p-10 overflow-y-auto bg-[var(--bg-main)] relative">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-4xl font-bold text-[var(--text-bright)] tracking-tighter">MCP PROTOCOL REGISTRY</h2>
            <p className="text-[10px] text-[var(--text-muted)] mt-2 uppercase tracking-[0.5em]">Model Context Protocol • Neural Bridge Control</p>
          </div>
          <button 
            onClick={() => setEditServer({ name: '', command: '', args: '', githubUrl: '', isNew: true })}
            className="bg-[var(--accent)] text-[var(--bg-main)] px-8 py-3 text-xs font-bold rounded-sm hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,77,0,0.2)] uppercase tracking-widest"
          >
            + REGISTER SERVER
          </button>
        </div>

        {loading ? (
          <div data-testid="loading-indicator" className="flex items-center justify-center py-40 text-[var(--border-main)] animate-pulse font-bold tracking-[1em]">SCANNING_LINK_LAYER...</div>
        ) : (
          <div className="space-y-12">
            <div>
              <h3 className="text-[10px] font-bold text-[var(--success)] tracking-[0.3em] uppercase border-b border-[var(--success)]/20 pb-2 mb-6">Active Bridges</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {servers.filter(s => s.status === 'online').map(server => (
                  <div key={server.id} data-testid={`mcp-server-item-${server.id}`} className="bg-[var(--bg-surface)] border border-[var(--border-main)] p-8 rounded-xl relative overflow-hidden group hover:border-[var(--accent)]/40 transition-all shadow-2xl">
                    <div className="flex justify-between items-start mb-8">
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-[var(--success)] shadow-[0_0_10px_var(--success)]"></div>
                        <span className="text-[10px] font-bold text-[var(--text-bright)] uppercase tracking-[0.2em]">{server.status}</span>
                         {server.origin && (
                           <span className={`text-[8px] px-2 py-0.5 rounded border ${
                             server.origin === 'hermes' ? 'border-[var(--accent)]/30 text-[var(--accent)]' : 
                             server.origin === 'gemini' ? 'border-[var(--gemini)]/30 text-[var(--gemini)]' :
                             'border-[var(--info)]/30 text-[var(--info)]'
                           } uppercase font-black`}>
                             {server.origin}
                           </span>
                         )}
                      </div>
                      <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-tighter bg-[var(--bg-main)] px-3 py-1 rounded-full border border-[var(--border-main)]">
                        {server.type}
                      </div>
                    </div>

                    <h3 className="text-2xl font-bold text-[var(--text-bright)] mb-4 tracking-tight">{server.name.toUpperCase()}</h3>
                    <div className="text-xs font-mono text-[var(--text-muted)] bg-[var(--bg-main)] p-4 rounded-lg mb-8 border border-[var(--border-main)] leading-relaxed break-all">
                      <span className="text-[var(--accent)] pr-2">$</span>
                      {server.command} {server.args.join(' ')}
                    </div>

                    <div className="flex gap-3">
                      <button 
                        onClick={() => handleTest(server.name)}
                        className="flex-1 bg-[var(--bg-surface)] border border-[var(--border-main)] text-[10px] font-bold text-[var(--text-muted)] py-3 rounded hover:text-[var(--success)] hover:border-[var(--success)]/30 transition-all uppercase tracking-widest"
                      >
                        Ping Health
                      </button>
                      <button 
                        onClick={() => setEditServer({ name: server.name, command: server.command, args: server.args.join(', '), githubUrl: '', isNew: false })}
                        className="flex-1 bg-[var(--bg-surface)] border border-[var(--border-main)] text-[10px] font-bold text-[var(--text-muted)] py-3 rounded hover:text-[var(--accent)] hover:border-[var(--accent)]/30 transition-all uppercase tracking-widest"
                      >
                        Edit Config
                      </button>
                      {server.origin !== 'gemini' && (
                        <button 
                          onClick={() => handleDelete(server.name)}
                          className="px-4 bg-[var(--bg-surface)] border border-[var(--border-main)] text-[var(--text-muted)] rounded hover:text-red-500 hover:border-red-500/30 transition-all"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-[10px] font-bold text-red-500 tracking-[0.3em] uppercase border-b border-red-500/20 pb-2 mb-6">Inactive / Error Bridges</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-70 hover:opacity-100 transition-opacity">
                {servers.filter(s => s.status !== 'online').map(server => (
                  <div key={server.id} data-testid={`mcp-server-item-${server.id}`} className="bg-[var(--bg-main)] border border-red-500/30 p-8 rounded-xl relative overflow-hidden group hover:border-red-500/80 transition-all shadow-2xl">
                    <div className="flex justify-between items-start mb-8">
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                        <span className="text-[10px] font-bold text-red-500 uppercase tracking-[0.2em]">{server.status}</span>
                         {server.origin && (
                           <span className={`text-[8px] px-2 py-0.5 rounded border ${
                             server.origin === 'hermes' ? 'border-[var(--accent)]/30 text-[var(--accent)]' : 
                             server.origin === 'gemini' ? 'border-[var(--gemini)]/30 text-[var(--gemini)]' :
                             'border-[var(--info)]/30 text-[var(--info)]'
                           } uppercase font-black`}>
                             {server.origin}
                           </span>
                         )}
                      </div>
                      <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-tighter bg-[var(--bg-main)] px-3 py-1 rounded-full border border-[var(--border-main)]">
                        {server.type}
                      </div>
                    </div>

                    <h3 className="text-2xl font-bold text-[var(--text-muted)] mb-4 tracking-tight">{server.name.toUpperCase()}</h3>
                    <div className="text-xs font-mono text-[var(--text-muted)] bg-[var(--bg-main)] p-4 rounded-lg mb-8 border border-[var(--border-main)] leading-relaxed break-all">
                      <span className="text-[var(--accent)] pr-2">$</span>
                      {server.command} {server.args.join(' ')}
                    </div>

                    <div className="flex gap-3">
                      <button 
                        onClick={() => handleTest(server.name)}
                        className="flex-1 bg-[var(--bg-surface)] border border-[var(--border-main)] text-[10px] font-bold text-[var(--text-muted)] py-3 rounded hover:text-[var(--success)] hover:border-[var(--success)]/30 transition-all uppercase tracking-widest"
                      >
                        Ping Health
                      </button>
                      <button 
                        onClick={() => setEditServer({ name: server.name, command: server.command, args: server.args.join(', '), githubUrl: '', isNew: false })}
                        className="flex-1 bg-[var(--bg-surface)] border border-[var(--border-main)] text-[10px] font-bold text-[var(--text-muted)] py-3 rounded hover:text-[var(--accent)] hover:border-[var(--accent)]/30 transition-all uppercase tracking-widest"
                      >
                        Edit Config
                      </button>
                      {server.origin !== 'gemini' && (
                        <button 
                          onClick={() => handleDelete(server.name)}
                          className="px-4 bg-[var(--bg-surface)] border border-[var(--border-main)] text-[var(--text-muted)] rounded hover:text-red-500 hover:border-red-500/30 transition-all"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {servers.filter(s => s.status !== 'online').length === 0 && (
                  <div className="col-span-full py-8 text-center text-[10px] font-bold text-[var(--text-muted)] tracking-widest uppercase">
                    No inactive bridges
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* EDIT/ADD MODAL */}
      {editServer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-main)]/95 backdrop-blur-md p-4">
          <div className="bg-[var(--bg-surface)] border border-[var(--accent)]/30 w-full max-w-lg p-10 rounded-2xl shadow-[0_0_50px_rgba(255,77,0,0.1)]">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-1 h-8 bg-[var(--accent)]"></div>
              <h3 className="text-2xl font-bold text-[var(--text-bright)] tracking-tighter uppercase">
                {editServer.isNew ? 'NEW PROTOCOL REGISTRATION' : 'Protocol Reconfiguration'}
              </h3>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-[var(--text-muted)] mb-2 uppercase tracking-widest">Protocol Identifier</label>
                <input 
                  type="text" 
                  value={editServer.name}
                  onChange={e => setEditServer({...editServer, name: e.target.value})}
                  disabled={!editServer.isNew}
                  className={`w-full bg-[var(--bg-main)] border border-[var(--border-main)] p-4 text-sm text-[var(--text-bright)] rounded-lg outline-none focus:border-[var(--accent)] font-mono ${!editServer.isNew ? 'opacity-50 cursor-not-allowed' : ''}`}
                  placeholder="e.g. github-mcp"
                />
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-[var(--border-main)]"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-[var(--bg-surface)] px-2 text-[10px] text-[var(--text-muted)] uppercase tracking-widest">Setup Method</span>
                </div>
              </div>

              <div className="bg-[var(--bg-main)] p-4 rounded-xl border border-[var(--border-main)]">
                <label className="block text-[10px] font-bold text-[var(--info)] mb-2 uppercase tracking-widest">Option A: GitHub Repository</label>
                <input 
                  type="text" 
                  value={editServer.githubUrl}
                  onChange={e => setEditServer({...editServer, githubUrl: e.target.value, command: '', args: ''})}
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-main)] p-4 text-sm text-[var(--text-bright)] rounded-lg outline-none focus:border-[var(--info)] font-mono"
                  placeholder="github:org/repo"
                />
                <p className="text-[9px] text-[var(--text-muted)] mt-2">Auto-populates npx execution command.</p>
              </div>

              <div className="bg-[var(--bg-main)] p-4 rounded-xl border border-[var(--border-main)]">
                <label className="block text-[10px] font-bold text-[var(--text-muted)] mb-2 uppercase tracking-widest">Option B: Manual Configuration</label>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--text-muted)] mb-2 uppercase tracking-widest">Command Entrypoint</label>
                    <input 
                      type="text" 
                      value={editServer.command}
                      onChange={e => setEditServer({...editServer, command: e.target.value, githubUrl: ''})}
                      className="w-full bg-[var(--bg-surface)] border border-[var(--border-main)] p-4 text-sm text-[var(--text-bright)] rounded-lg outline-none focus:border-[var(--accent)] font-mono"
                      placeholder="e.g. npx, node, uvx"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--text-muted)] mb-2 uppercase tracking-widest">Arguments (Comma Separated)</label>
                    <textarea 
                      rows={2}
                      value={editServer.args}
                      onChange={e => setEditServer({...editServer, args: e.target.value, githubUrl: ''})}
                      className="w-full bg-[var(--bg-surface)] border border-[var(--border-main)] p-4 text-sm text-[var(--text-bright)] rounded-lg outline-none focus:border-[var(--accent)] font-mono resize-none"
                      placeholder="-y, @org/server..."
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-12">
              <button 
                onClick={handleSaveServer}
                className="flex-1 bg-[var(--accent)] text-[var(--bg-main)] py-4 text-xs font-bold rounded-lg hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest"
              >
                INITIALIZE LINK
              </button>
              <button 
                onClick={() => setEditServer(null)}
                className="px-8 bg-[var(--bg-surface)] text-[var(--text-muted)] text-xs font-bold rounded-lg border border-[var(--border-main)] hover:bg-[var(--border-main)] transition-all uppercase tracking-widest"
              >
                Abort
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MCPView;
