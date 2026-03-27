import React, { useState, useEffect } from 'react';

interface Skill {
  id: string;
  name: string;
  path: string;
  is_skill: boolean;
  subskills?: Skill[];
  has_subskills?: boolean;
}

const SkillsView: React.FC = () => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [activeSkill, setActiveSkill] = useState<Skill | null>(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());

  const fetchSkills = () => {
    setLoading(true);
    fetch('http://localhost:3008/api/skills')
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
    fetch(`http://localhost:3008/api/skills/content?relPath=${encodeURIComponent(relPath)}`)
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
    fetch('http://localhost:3008/api/skills/content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ relPath: activeSkill.path, content })
    })
    .then(res => res.json())
    .then(() => {
      setSaving(false);
      alert('Skill updated successfully.');
    })
    .catch(err => {
      setSaving(false);
      console.error(err);
    });
  };

  const renderSkillItem = (skill: Skill, depth = 0) => {
    const isExpanded = expandedPaths.has(skill.path);
    const hasChildren = (skill.subskills && skill.subskills.length > 0) || skill.has_subskills;

    return (
      <div key={skill.id} className="select-none">
        <div 
          className={`flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-[#161616] transition-colors border-l-2 ${activeSkill?.id === skill.id ? 'bg-[#161616] border-[#FF4D00] text-[#E0E0E0]' : 'border-transparent text-[#555555]'}`}
          style={{ paddingLeft: `${(depth * 12) + 16}px` }}
          onClick={() => handleSkillSelect(skill)}
        >
          {hasChildren ? (
            <span className="text-[10px] w-3">{isExpanded ? '▼' : '▶'}</span>
          ) : (
            <span className="w-3"></span>
          )}
          <span className={`text-xs font-mono truncate ${skill.is_skill ? 'font-bold' : ''}`}>
            {skill.is_skill ? '📄' : '📁'} {skill.name.toUpperCase()}
          </span>
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
    <div className="flex flex-1 overflow-hidden bg-[#080808]">
      {/* Sidebar */}
      <div className="w-72 border-r border-[#222222] bg-[#111111] flex flex-col">
        <div className="p-4 border-b border-[#222222] flex justify-between items-center">
          <h3 className="text-[10px] font-bold text-[#444444] tracking-[0.3em] uppercase">Neural Skillsets</h3>
          <button onClick={fetchSkills} className="text-[#444444] hover:text-[#FF4D00] transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-2 no-scrollbar">
          {loading ? (
            <div className="p-6 text-[10px] text-[#222222] animate-pulse font-bold tracking-widest uppercase text-center">Indexing Skills...</div>
          ) : (
            skills.map(skill => renderSkillItem(skill))
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col relative bg-[radial-gradient(circle_at_center,#111111,transparent)]">
        {activeSkill ? (
          <>
            <div className="h-14 border-b border-[#222222] flex items-center justify-between px-8 bg-[#111111]/50 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className="w-2 h-2 bg-[#FF4D00] rounded-full animate-pulse"></div>
                <h2 className="text-xs font-bold text-[#E0E0E0] tracking-widest uppercase">
                  Skill: {activeSkill.path.replace(/\//g, ' > ')}
                </h2>
              </div>
              <button 
                onClick={handleSave}
                disabled={saving}
                className="bg-[#FF4D00] text-[#080808] px-6 py-2 text-xs font-bold rounded-sm hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,77,0,0.2)]"
              >
                {saving ? 'SYNCHRONIZING...' : 'UPDATE NEURAL SKILL'}
              </button>
            </div>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              className="flex-1 w-full bg-transparent text-[#B0B0B0] p-10 font-mono text-sm outline-none resize-none focus:ring-0 selection:bg-[#FF4D00]/20"
              spellCheck="false"
              placeholder="# Neural Skill Definition..."
            />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-[#222222] space-y-4">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="opacity-20"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            <div className="text-sm font-bold tracking-[0.4em] uppercase opacity-40">Select a neural skillset to reconfigure</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SkillsView;
