import React, { useState, useEffect } from 'react';

const LogView: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [level, setLevel] = useState('');
  const [service, setService] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchLogs = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (level) params.append('level', level);
    if (service) params.append('service', service);
    if (search) params.append('search', search);

    fetch(`http://localhost:3008/api/logs?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        setLogs(data.logs || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, [level, service, search]);

  return (
    <div className="flex-1 flex flex-col bg-[var(--bg-main)] p-6 h-full overflow-hidden" data-testid="log-view-container">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-bright)] tracking-tight">REAL-TIME LOG CONSOLE</h2>
          <p className="text-[10px] text-[#555555] uppercase tracking-[0.2em] mt-1">Global System Event Stream</p>
        </div>
        
        <div className="flex gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[8px] text-[#444444] font-bold uppercase">Filter Level</label>
            <select 
              value={level} 
              onChange={e => setLevel(e.target.value)}
              className="bg-[var(--bg-sidebar)] border border-[var(--border-main)] text-[10px] text-[#B0B0B0] px-2 py-1 outline-none focus:border-[#FF4D00]"
            >
              <option value="">ALL LEVELS</option>
              <option value="info">INFO</option>
              <option value="warn">WARN</option>
              <option value="error">ERROR</option>
              <option value="success">SUCCESS</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[8px] text-[#444444] font-bold uppercase">Division</label>
            <input 
              type="text"
              value={service}
              onChange={e => setService(e.target.value)}
              placeholder="e.g. GATEWAY"
              className="bg-[var(--bg-sidebar)] border border-[var(--border-main)] text-[10px] text-[#B0B0B0] px-2 py-1 outline-none focus:border-[#FF4D00] w-24"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[8px] text-[#444444] font-bold uppercase">Search Content</label>
            <input 
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Query..."
              className="bg-[var(--bg-sidebar)] border border-[var(--border-main)] text-[10px] text-[#B0B0B0] px-2 py-1 outline-none focus:border-[#FF4D00] w-48"
            />
          </div>
          <button onClick={fetchLogs} className="bg-[#FF4D00] text-[#080808] px-4 py-1 text-[10px] font-bold self-end hover:scale-105 transition-all">RELOAD</button>
        </div>
      </div>

      <div className="flex-1 bg-[var(--bg-main)] border border-[var(--border-main)] rounded-sm flex flex-col overflow-hidden">
        <div className="grid grid-cols-[160px_80px_100px_1fr] px-4 py-2 bg-[var(--bg-sidebar)] border-b border-[var(--border-main)] text-[10px] font-bold text-[#444444] tracking-widest uppercase">
          <div>Timestamp</div>
          <div>Level</div>
          <div>Service</div>
          <div>Message</div>
        </div>
        <div className="flex-1 overflow-y-auto font-mono text-xs">
          {loading && logs.length === 0 ? (
            <div data-testid="loading-indicator" className="p-8 text-center text-[#222222] animate-pulse">STREAMING DATA...</div>
          ) : (
            logs.map(log => (
              <div key={log.id} className="grid grid-cols-[160px_80px_100px_1fr] px-4 py-2 border-b border-[#161616] hover:bg-[#161616]/50 transition-colors group">
                <div className="text-[#333333] group-hover:text-[#555555]">{log.time}</div>
                <div className={`font-bold ${
                  log.level === 'success' ? 'text-green-500/60' : 
                  log.level === 'error' ? 'text-red-500/60' : 
                  log.level === 'warn' ? 'text-amber-500/60' : 'text-blue-500/60'
                } uppercase text-[10px]`}>{log.level}</div>
                <div className="text-[#555555] font-bold">{log.service}</div>
                <div className="text-[#B0B0B0] whitespace-pre-wrap truncate" title={log.msg}>{log.msg}</div>
              </div>
            ))
          )}
          {!loading && logs.length === 0 && (
            <div className="p-8 text-center text-[#444444]">No logs match your filter criteria.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LogView;
