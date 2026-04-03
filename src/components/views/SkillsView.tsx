import React, { useState, useEffect } from 'react';

interface Skill {
  id: string;
  name: string;
  path: string;
  is_skill: boolean;
  enabled?: boolean;
  subskills?: Skill[];
  has_subskills?: boolean;
}

const API_BASE = `http://${window.location.hostname}:3008/api`;

const SkillsView: React.FC = () => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [activeSkill, setActiveSkill] = useState<Skill | null>(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());

  const fetchSkills = () => {
    setLoading(true);
    fetch(`${API_BASE}/skills`)
      .then(res => res.json())
      .then(data => {
        setSkills(data.skills || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  const fetchContent = (relPath: string) => {
    fetch(`${API_BASE}/skills/content?relPath=${encodeURIComponent(relPath)}`)
      .then(res => res.json())
      .then(data => setContent(data.content || ''))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchSkills();
  }, []);

  const handleSkillSelect = (skill: Skill) => {
    if (skill.is_skill) {
      setActiveSkill(skill);
      fetchContent(skill.path);
    }
    toggleExpand(skill.path);
  };

  const toggleExpand = (path: string) => {
    const newExpanded = new Set(expandedPaths);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedPaths(newExpanded);
  };

  const handleSave = () => {
    if (!activeSkill) return;
    setSaving(true);
    fetch(`${API_BASE}/skills/content`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ relPath: activeSkill.path, content })
    })
    .then(res => res.json())
    .then(() => {
      setSaving(false);
      // Optional toast
    })
    .catch(err => {
      setSaving(false);
      console.error(err);
    });
  };

  const handleToggle = () => {
    if (!activeSkill) return;
    const newEnabledState = !activeSkill.enabled;
    fetch(`${API_BASE}/skills/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ relPath: activeSkill.path, enabled: newEnabledState })
    })
    .then(res => res.json())
    .then(() => {
      fetchSkills(); // refresh to update UI state
      setActiveSkill({ ...activeSkill, enabled: newEnabledState });
    })
    .catch(err => console.error(err));
  };

  const renderSkillItem = (skill: Skill, depth = 0) => {
    const isExpanded = expandedPaths.has(skill.path);
    const hasChildren = (skill.subskills && skill.subskills.length > 0) || skill.has_subskills;

    return (
      <div key={skill.id} data-testid={`skill-item-${skill.id}`} className="select-none">
        <div 
          className={`flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-[var(--bg-surface)] transition-colors border-l-2 ${activeSkill?.id === skill.id ? 'bg-[var(--bg-surface)] border-[var(--accent)] text-[var(--text-bright)]' : 'border-transparent text-[var(--text-muted)]'} ${skill.is_skill && !skill.enabled ? 'opacity-50' : ''}`}
          style={{ paddingLeft: `${(depth * 12) + 16}px` }}
          onClick={() => {
             // Avoid toggle expand if clicking direct skill, handled below if needed
             handleSkillSelect(skill);
          }}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            {hasChildren ? (
              <span className="text-[10px] w-3 shrink-0">{isExpanded ? '▼' : '▶'}</span>
            ) : (
              <span className="w-3 shrink-0"></span>
            )}
            <span className={`text-xs font-mono truncate ${skill.is_skill ? 'font-bold' : ''} ${skill.is_skill && !skill.enabled ? 'line-through decoration-[var(--border-main)]' : ''}`}>
              {skill.is_skill ? '📄' : '📁'} {skill.name.toUpperCase()}
            </span>
          </div>
          {skill.is_skill && (
            <div className={`w-2 h-2 rounded-full shrink-0 ${skill.enabled ? 'bg-[var(--success)] shadow-[0_0_5px_var(--success)]' : 'bg-[var(--border-main)]'}`}></div>
          )}
        </div>
        {isExpanded && skill.subskills && (
          <div>
            {skill.subskills.map(sub => renderSkillItem(sub, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div data-testid="skills-view-container" className="flex flex-1 overflow-hidden bg-[var(--bg-main)]">
      {/* Sidebar */}
      <div className="w-72 border-r border-[var(--border-main)] bg-[var(--bg-sidebar)] flex flex-col">
        <div className="p-4 border-b border-[var(--border-main)] flex justify-between items-center">
          <h3 className="text-[10px] font-bold text-[var(--text-muted)] tracking-[0.3em] uppercase">Neural Skillsets</h3>
          <button onClick={fetchSkills} className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-2 no-scrollbar">
          {loading ? (
            <div data-testid="loading-indicator" className="p-6 text-[10px] text-[var(--border-main)] animate-pulse font-bold tracking-widest uppercase text-center">Indexing Skills...</div>
          ) : (
            skills.map(skill => renderSkillItem(skill))
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col relative bg-[radial-gradient(circle_at_center,var(--bg-sidebar),transparent)]">
        {activeSkill ? (
          <>
            <div className="h-14 border-b border-[var(--border-main)] flex items-center justify-between px-8 bg-[var(--bg-sidebar)]/50 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className={`w-2 h-2 rounded-full ${activeSkill.enabled ? 'bg-[var(--success)] shadow-[0_0_8px_var(--success)] animate-pulse' : 'bg-[var(--border-main)]'}`}></div>
                <h2 className={`text-xs font-bold tracking-widest uppercase ${activeSkill.enabled ? 'text-[var(--text-bright)]' : 'text-[var(--text-muted)] line-through'}`}>
                  Skill: {activeSkill.path.replace(/\//g, ' > ')}
                </h2>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={handleToggle}
                  className={`px-4 py-2 text-[10px] font-bold rounded-sm transition-all tracking-[0.2em] uppercase border ${activeSkill.enabled ? 'bg-[var(--bg-surface)] text-[var(--text-muted)] border-[var(--border-main)] hover:text-red-500 hover:border-red-500/50' : 'bg-[var(--success)] text-[var(--bg-main)] border-transparent hover:scale-105 shadow-[0_0_15px_rgba(0,255,0,0.2)]'}`}
                >
                  {activeSkill.enabled ? 'DISABLE SKILL' : 'ENABLE SKILL'}
                </button>
                <button 
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-[var(--accent)] text-[var(--bg-main)] px-8 py-2 text-[10px] font-black rounded hover:scale-105 active:scale-95 transition-all shadow-[0_0_15px_rgba(255,77,0,0.3)] tracking-[0.2em] uppercase"
                >
                  {saving ? 'SYNCHRONIZING...' : 'UPDATE NEURAL SKILL'}
                </button>
              </div>
            </div>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              className="flex-1 w-full bg-transparent text-[var(--text-main)] p-10 font-mono text-sm outline-none resize-none focus:ring-0 selection:bg-[var(--accent)]/20"
              spellCheck="false"
              placeholder="# Neural Skill Definition..."
            />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-[var(--border-main)] space-y-4">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="opacity-20"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            <div className="text-sm font-bold tracking-[0.4em] uppercase opacity-40">Select a neural skillset to reconfigure</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SkillsView;
