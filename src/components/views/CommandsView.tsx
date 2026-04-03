import React, { useState, useEffect } from 'react';

interface Command {
  id: string;
  label: string;
  desc: string;
  defaultArgs: string;
}

const API_BASE = `http://${window.location.hostname}:3008/api`;

const CommandsView: React.FC = () => {
  const [commands, setCommands] = useState<Command[]>([]);
  const [activeCommand, setActiveCommand] = useState<Command | null>(null);
  const [args, setArgs] = useState('');
  const [output, setOutput] = useState('');
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/commands`)
      .then(res => res.json())
      .then(data => {
        setCommands(data.commands || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleRun = () => {
    if (!activeCommand) return;
    setRunning(true);
    setOutput(`> Initializing ${activeCommand.label} execution sequence...\n`);
    
    fetch(`${API_BASE}/commands/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: activeCommand.id, args })
    })
    .then(res => res.json())
    .then(data => {
      setRunning(false);
      setOutput(data.output || data.error || 'Execution completed with no return signals.');
    })
    .catch(err => {
      setRunning(false);
      setOutput(`FATAL_ERROR: ${err.message}`);
    });
  };

  return (
    <div data-testid="commands-view-container" className="flex-1 flex flex-col bg-[var(--bg-main)] overflow-hidden">
      <div className="h-16 border-b border-[var(--border-main)] flex items-center px-8 bg-[var(--bg-sidebar)]/50 backdrop-blur-md">
        <h2 className="text-sm font-bold text-[var(--text-bright)] tracking-widest uppercase">Hermes Tools</h2>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* COMMAND LIST */}
        <div className="w-80 border-r border-[var(--border-main)] bg-[var(--bg-sidebar)] flex flex-col">
          <div className="p-4 border-b border-[var(--border-main)]">
            <span className="text-[10px] font-bold text-[var(--text-muted)] tracking-widest uppercase">Available Directives</span>
          </div>
          <div className="flex-1 overflow-y-auto py-2 no-scrollbar">
            {loading ? (
              <div data-testid="loading-indicator" className="p-6 text-[10px] text-[var(--border-main)] animate-pulse font-bold tracking-widest uppercase text-center">Fetching Tools...</div>
            ) : (
              commands.map(cmd => (
                <button
                  key={cmd.id}
                  onClick={() => {
                    setActiveCommand(cmd);
                    setArgs(cmd.defaultArgs);
                    setOutput('');
                  }}
                  className={`w-full text-left px-6 py-4 transition-all border-l-2 ${activeCommand?.id === cmd.id ? 'bg-[#161616] border-[var(--accent)] text-[var(--text-bright)]' : 'border-transparent text-[#555555] hover:text-[var(--text-main)] hover:bg-[var(--bg-sidebar)]'}`}
                >
                  <div className="text-xs font-bold uppercase tracking-wider mb-1">{cmd.label}</div>
                  <div className="text-[10px] text-[var(--text-muted)] line-clamp-1">{cmd.desc}</div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* EXECUTION AREA */}
        <div className="flex-1 flex flex-col bg-[radial-gradient(circle_at_top_right,var(--bg-sidebar),transparent)]">
          {activeCommand ? (
            <div className="flex-1 flex flex-col p-10 space-y-8 overflow-hidden">
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <h3 data-testid="command-title" className="text-2xl font-bold text-[var(--text-bright)] tracking-tight uppercase">{activeCommand.label.toUpperCase()}</h3>
                  <div className="text-[10px] font-mono text-[var(--text-muted)]">CMD_PATH: /usr/local/bin/hermes {activeCommand.id}</div>
                </div>
                <p className="text-sm text-[#888888]">{activeCommand.desc}</p>
              </div>

              <div className="bg-[var(--bg-sidebar)] border border-[var(--border-main)] p-6 rounded-xl space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-[#FF4D00] uppercase tracking-widest">Execution Parameters</label>
                  <div className="relative">
                    <span data-testid="command-preview" className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] font-mono text-xs">hermes {activeCommand.id}</span>
                    <input 
                      data-testid="command-input"
                      value={args}
                      onChange={e => setArgs(e.target.value)}
                      placeholder="Enter arguments..."
                      className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] pl-32 pr-4 py-4 text-xs text-[var(--text-main)] font-mono rounded-lg outline-none focus:border-[var(--accent)] transition-colors"
                    />
                  </div>
                </div>
                <button 
                  onClick={handleRun}
                  disabled={running}
                  className="w-full bg-[var(--accent)] text-[#080808] py-4 text-xs font-bold rounded-lg hover:scale-[1.01] active:scale-95 transition-all shadow-[0_0_20px_rgba(255,77,0,0.15)] uppercase tracking-widest"
                >
                  {running ? 'Executing Directive...' : 'EXECUTE'}
                </button>
              </div>

              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex justify-between items-center mb-2 px-2">
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Telemetry Output</span>
                  <button onClick={() => setOutput('')} className="text-[9px] text-[var(--text-muted)] hover:text-[#888888] uppercase underline">Clear Terminal</button>
                </div>
                <pre className="flex-1 bg-[var(--bg-input)] border border-[var(--border-main)] rounded-xl p-6 font-mono text-[11px] text-[#00FF41] overflow-y-auto whitespace-pre-wrap selection:bg-[#00FF41]/20">
                  {output || 'Awaiting execution...'}
                  {running && <div className="animate-pulse inline-block ml-1">_</div>}
                </pre>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-[#222222]">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="opacity-20 mb-4"><path d="M4 17l6-6-6-6M12 19h8"/></svg>
              <div className="text-sm font-bold tracking-[0.4em] uppercase opacity-40">Select a directive to initialize</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommandsView;
