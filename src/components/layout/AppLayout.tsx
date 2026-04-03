import React, { useEffect, useState } from 'react';

type NavItem = 'chat' | 'mcp' | 'logs' | 'dashboard' | 'subagents' | 'settings' | 'graph' | 'commands' | 'gateway' | 'skills';

interface LayoutProps {
  activeView: NavItem;
  setActiveView: (view: NavItem) => void;
  children: React.ReactNode;
}

const AppLayout: React.FC<LayoutProps> = ({ activeView, setActiveView, children }) => {
  const [theme, setTheme] = useState(localStorage.getItem('hermes_theme') || 'default');

  useEffect(() => {
    // Initial sync from server
    fetch('http://localhost:3008/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data?.config?.display?.skin) {
          const serverTheme = data.config.display.skin;
          if (!localStorage.getItem('hermes_theme')) {
            setTheme(serverTheme);
            localStorage.setItem('hermes_theme', serverTheme);
          }
        }
      })
      .catch(err => console.error('Failed to fetch theme:', err));

    // Listen for storage events (cross-tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'hermes_theme' && e.newValue) {
        setTheme(e.newValue);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    
    // Polling for same-window updates
    const interval = setInterval(() => {
      const current = localStorage.getItem('hermes_theme');
      if (current && current !== theme) {
        setTheme(current);
      }
    }, 300);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [theme]);

  // Apply class to body for global variable scope
  useEffect(() => {
    const themes = ['default', 'ares', 'mono', 'slate', 'cyberpunk'];
    themes.forEach(t => document.body.classList.remove(`theme-${t}`));
    document.body.classList.add(`theme-${theme}`);
  }, [theme]);

  return (
    <div className="flex h-screen w-full bg-[var(--bg-main)] text-[var(--text-main)] overflow-hidden font-mono">
      {/* LEFT RAIL NAVIGATION */}
      <div className="w-[72px] bg-[var(--bg-sidebar)] border-r border-[var(--border-main)] flex flex-col items-center py-6 gap-8">
        <div className="w-10 h-10 bg-[var(--accent)] flex items-center justify-center rounded-sm font-bold text-[var(--bg-main)] text-xl tracking-tighter shadow-[0_0_15px_var(--accent-shadow)]">
          H
        </div>
        
        <div className="flex flex-col gap-6 items-center flex-1 pt-4 overflow-y-auto no-scrollbar">
          <NavIcon 
            active={activeView === 'chat'} 
            onClick={() => setActiveView('chat')}
            label="CHAT"
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>}
          />
          <NavIcon 
            active={activeView === 'skills'} 
            onClick={() => setActiveView('skills')}
            label="SKILLS"
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>}
          />
          <NavIcon 
            active={activeView === 'dashboard'} 
            onClick={() => setActiveView('dashboard')}
            label="DASHBOARD"
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>}
          />
          <NavIcon 
            active={activeView === 'subagents'} 
            onClick={() => setActiveView('subagents')}
            label="SUBAGENTS"
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
          />
          <NavIcon 
            active={activeView === 'commands'} 
            onClick={() => setActiveView('commands')}
            label="COMMANDS"
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 17l6-6-6-6M12 19h8"/></svg>}
          />
          <NavIcon 
            active={activeView === 'graph'} 
            onClick={() => setActiveView('graph')}
            label="AUTOMATION"
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>}
          />
          <NavIcon 
            active={activeView === 'gateway'} 
            onClick={() => setActiveView('gateway')}
            label="GATEWAY"
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>}
          />
          <NavIcon 
            active={activeView === 'settings'} 
            onClick={() => setActiveView('settings')}
            label="SETTINGS"
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>}
          />
          <NavIcon 
            active={activeView === 'mcp'} 
            onClick={() => setActiveView('mcp')}
            label="MCP"
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 7h10"/><path d="M7 12h10"/><path d="M7 17h10"/></svg>}
          />
          <NavIcon 
            active={activeView === 'logs'} 
            onClick={() => setActiveView('logs')}
            label="LOGS"
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>}
          />
        </div>

        <div className="mt-auto flex flex-col gap-4 items-center opacity-40 hover:opacity-100 transition-opacity">
           <div className="w-1.5 h-1.5 bg-[#00FF41] rounded-full animate-pulse"></div>
           <div className="text-[10px] tracking-tighter transform -rotate-90 origin-center whitespace-nowrap">STATUS: ONLINE</div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col relative">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[var(--accent)]/20 to-transparent pointer-events-none"></div>
        {children}
      </div>
    </div>
  );
};

const NavIcon: React.FC<{active: boolean, onClick: () => void, icon: React.ReactNode, label: string}> = ({active, onClick, icon, label}) => (
  <button 
    onClick={onClick}
    data-testid={`nav-link-${label.toLowerCase()}`}
    className={`group relative flex items-center justify-center p-3 rounded-md transition-all duration-200 ${active ? 'bg-[var(--accent)]/10 text-[var(--accent)]' : 'text-[var(--text-muted)] hover:text-[var(--text-bright)] hover:bg-[var(--border-main)]'}`}
  >
    {icon}
    <div className={`absolute left-16 px-2 py-1 bg-[var(--bg-sidebar)] text-[var(--text-bright)] text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap border border-[var(--border-main)]`}>
      {label}
    </div>
    {active && <div className="absolute left-[-2px] w-[2px] h-8 bg-[var(--accent)] rounded-r-full"></div>}
  </button>
);

export default AppLayout;
