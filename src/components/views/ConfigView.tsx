import React, { useState, useEffect } from 'react';

const ConfigView: React.FC = () => {
  const [activeFile, setActiveFile] = useState<string>('config.yaml');
  const [content, setContent] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [configFiles, setConfigFiles] = useState<string[]>(['config.yaml']);

  useEffect(() => {
    fetch('http://localhost:3008/api/config_list')
      .then(res => res.json())
      .then(data => {
        if (data.files) setConfigFiles(data.files);
      })
      .catch(err => console.error(err));
  }, []);

  const fetchConfig = (file: string) => {
    fetch(`http://localhost:3008/api/config_file/${file}`)
      .then(res => res.json())
      .then(data => setContent(data.content || ''))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchConfig(activeFile);
  }, [activeFile]);

  const handleSave = () => {
    setSaving(true);
    fetch(`http://localhost:3008/api/config_file/${activeFile}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    })
    .then(res => res.json())
    .then(() => {
      setSaving(false);
      // Optional: Add a subtle toast or visual confirmation instead of an alert
    })
    .catch(err => {
      setSaving(false);
      console.error(err);
    });
  };

  return (
    <div data-testid="config-view-container" className="flex flex-1 overflow-hidden bg-[var(--bg-main)]">
      {/* Sidebar */}
      <div className="w-72 border-r border-[var(--border-main)] bg-[var(--bg-sidebar)] flex flex-col relative overflow-hidden">
        <div className="p-6 border-b border-[var(--border-main)] relative z-10">
          <h3 className="text-[10px] font-bold text-[var(--text-muted)] tracking-[0.3em] uppercase">System Configuration</h3>
        </div>
        <div className="flex-1 overflow-y-auto py-4 z-10">
          {configFiles.map(file => {
            const ext = file.split('.').pop();
            const icon = ext === 'md' ? '📄' : '⚙️';
            const isActive = activeFile === file;
            return (
              <button
                key={file}
                onClick={() => setActiveFile(file)}
                className={`w-full flex items-center gap-3 px-6 py-3 text-sm font-mono transition-all border-l-2 ${
                  isActive 
                    ? 'bg-[var(--bg-surface)] border-[var(--accent)] text-[var(--text-bright)] shadow-[inset_4px_0_0_0_var(--accent)]' 
                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-bright)] hover:bg-[var(--bg-surface)]/50'
                }`}
              >
                <span className="text-[10px] opacity-70">{icon}</span>
                {file.toUpperCase()}
              </button>
            )
          })}
        </div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-[var(--accent)]/5 rounded-full blur-[50px] pointer-events-none"></div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col relative bg-[radial-gradient(ellipse_at_top_right,var(--bg-surface),transparent)]">
        <div className="h-16 border-b border-[var(--border-main)] flex items-center justify-between px-8 bg-[var(--bg-sidebar)]/30 backdrop-blur-md relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-2 h-2 bg-[var(--accent)] rounded-full animate-pulse shadow-[0_0_8px_var(--accent)]"></div>
            <div className="text-xs font-bold text-[var(--text-bright)] tracking-widest uppercase">
              EDITING: {activeFile}
            </div>
          </div>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="bg-[var(--accent)] text-[var(--bg-main)] px-8 py-2 text-[10px] font-black rounded hover:scale-105 active:scale-95 transition-all shadow-[0_0_15px_rgba(255,77,0,0.3)] tracking-[0.2em] uppercase"
          >
            {saving ? 'SYNCHRONIZING...' : 'SAVE CHANGES'}
          </button>
        </div>
        <div className="flex-1 relative">
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            className="absolute inset-0 w-full h-full bg-transparent text-[var(--text-main)] p-10 font-mono text-sm leading-relaxed outline-none resize-none focus:ring-0 selection:bg-[var(--accent)]/20"
            spellCheck="false"
          />
        </div>
      </div>
    </div>
  );
};

export default ConfigView;
