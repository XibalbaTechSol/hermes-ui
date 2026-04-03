import React, { useState, useEffect } from 'react';

const ConfigView: React.FC = () => {
  const [activeFile, setActiveFile] = useState<string>('soul');
  const [content, setContent] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const fetchConfig = (file: string) => {
    fetch(`http://localhost:3008/api/config/${file}`)
      .then(res => res.json())
      .then(data => setContent(data.content || ''))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchConfig(activeFile);
  }, [activeFile]);

  const handleSave = () => {
    setSaving(true);
    fetch(`http://localhost:3008/api/config/${activeFile}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    })
    .then(res => res.json())
    .then(() => {
      setSaving(false);
      alert('Config saved successfully.');
    })
    .catch(err => {
      setSaving(false);
      console.error(err);
    });
  };

  return (
    <div data-testid="config-view-container" className="flex flex-1 overflow-hidden bg-[#080808]">
      {/* Sidebar */}
      <div className="w-64 border-r border-[#222222] bg-[#111111] flex flex-col">
        <div className="p-4 border-b border-[#222222]">
          <h3 className="text-xs font-bold text-[#888888] tracking-widest uppercase">Active Configuration Files</h3>
        </div>
        <div className="flex-1 overflow-y-auto">
          {['soul', 'memory', 'user', 'yaml'].map(file => (
            <button
              key={file}
              onClick={() => setActiveFile(file)}
              className={`w-full text-left px-4 py-3 text-sm font-mono transition-colors border-l-2 ${
                activeFile === file ? 'bg-[#161616] border-[#FF4D00] text-[#E0E0E0]' : 'border-transparent text-[#555555] hover:text-[#B0B0B0] hover:bg-[#161616]'
              }`}
            >
              {file.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col relative">
        <div className="h-12 border-b border-[#222222] flex items-center justify-between px-4 bg-[#111111]">
          <div className="text-sm font-bold text-[#E0E0E0] tracking-widest uppercase">
            EDITING: {activeFile}
          </div>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="bg-[#FF4D00] text-[#080808] px-4 py-1.5 text-xs font-bold rounded-sm hover:scale-105 transition-all"
          >
            {saving ? 'SAVING...' : 'SAVE CHANGES'}
          </button>
        </div>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          className="flex-1 w-full bg-[#080808] text-[#B0B0B0] p-6 font-mono text-sm outline-none resize-none focus:ring-1 focus:ring-[#FF4D00] inset-0"
          spellCheck="false"
        />
      </div>
    </div>
  );
};

export default ConfigView;
