import React, { useState, useEffect } from 'react';

interface Command {
  id: string;
  label: string;
  desc: string;
  defaultArgs: string;
}

const CommandsView: React.FC = () => {
  const [commands, setCommands] = useState<Command[]>([]);
  const [activeCommand, setActiveCommand] = useState<Command | null>(null);
  const [args, setArgs] = useState('');
  const [output, setOutput] = useState('');
  const [running, setRunning] = useState(false);

  useEffect(() => {
    fetch('http://localhost:3008/api/commands')
      .then(res => res.json())
      .then(data => setCommands(data.commands || []))
      .catch(err => console.error(err));
  }, []);

  const handleRun = () => {
    if (!activeCommand) return;
    setRunning(true);
    setOutput(`> Initializing ${activeCommand.label} execution sequence...\n`);
    
    fetch('http://localhost:3008/api/commands/run', {
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
    <div className="flex-1 flex flex-col bg-[#080808] overflow-hidden">
      <div className="h-16 border-b border-[#222222] flex items-center px-8 bg-[#111111]/50 backdrop-blur-md">
        <h2 className="text-sm font-bold text-[#E0E0E0] tracking-widest uppercase">Hermes Tools</h2>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* COMMAND LIST */}
        <div className="w-80 border-r border-[#222222] bg-[#111111] flex flex-col">
          <div className="p-4 border-b border-[#222222]">
            <span className="text-[10px] font-bold text-[#444444] tracking-widest uppercase">Available Directives</span>
          </div>
          <div className="flex-1 overflow-y-auto py-2 no-scrollbar">
            {commands.map(cmd => (
              <button
                key={cmd.id}
                onClick={() => {
                  setActiveCommand(cmd);
                  setArgs(cmd.defaultArgs);
                  setOutput('');
                }}
                className={`w-full text-left px-6 py-4 transition-all border-l-2 ${activeCommand?.id === cmd.id ? 'bg-[#161616] border-[#FF4D00] text-[#E0E0E0]' : 'border-transparent text-[#555555] hover:text-[#B0B0B0] hover:bg-[#111111]'}`}
              >
                <div className="text-xs font-bold uppercase tracking-wider mb-1">{cmd.label}</div>
                <div className="text-[10px] text-[#444444] line-clamp-1">{cmd.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* EXECUTION AREA */}
        <div className="flex-1 flex flex-col bg-[radial-gradient(circle_at_top_right,#111111,transparent)]">
          {activeCommand ? (
            <div className="flex-1 flex flex-col p-10 space-y-8 overflow-hidden">
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <h3 data-testid="command-title" className="text-2xl font-bold text-[#E0E0E0] tracking-tight uppercase">{activeCommand.label.toUpperCase()}</h3>
                  <div className="text-[10px] font-mono text-[#444444]">CMD_PATH: /usr/local/bin/hermes {activeCommand.id}</div>
                </div>
                <p className="text-sm text-[#888888]">{activeCommand.desc}</p>
              </div>

              <div className="bg-[#111111] border border-[#222222] p-6 rounded-xl space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-[#FF4D00] uppercase tracking-widest">Execution Parameters</label>
                  <div className="relative">
                    <span data-testid="command-preview" className="absolute left-4 top-1/2 -translate-y-1/2 text-[#444444] font-mono text-xs">hermes {activeCommand.id}</span>
                    <input 
                      value={args}
                      onChange={e => setArgs(e.target.value)}
                      placeholder="Enter arguments..."
                      className="w-full bg-[#080808] border border-[#222222] pl-32 pr-4 py-4 text-xs text-[#B0B0B0] font-mono rounded-lg outline-none focus:border-[#FF4D00] transition-colors"
                    />
                  </div>
                </div>
                <button 
                  onClick={handleRun}
                  disabled={running}
                  className="w-full bg-[#FF4D00] text-[#080808] py-4 text-xs font-bold rounded-lg hover:scale-[1.01] active:scale-95 transition-all shadow-[0_0_20px_rgba(255,77,0,0.15)] uppercase tracking-widest"
                >
                  {running ? 'Executing Directive...' : 'EXECUTE'}
                </button>
              </div>

              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex justify-between items-center mb-2 px-2">
                  <span className="text-[10px] font-bold text-[#444444] uppercase tracking-widest">Telemetry Output</span>
                  <button onClick={() => setOutput('')} className="text-[9px] text-[#444444] hover:text-[#888888] uppercase underline">Clear Terminal</button>
                </div>
                <pre className="flex-1 bg-[#0c0c0c] border border-[#222222] rounded-xl p-6 font-mono text-[11px] text-[#00FF41] overflow-y-auto whitespace-pre-wrap selection:bg-[#00FF41]/20">
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
