import React, { useState, useEffect, useRef } from 'react';

interface SettingsData {
  config: any;
  env: Record<string, string>;
}

const SettingsView: React.FC = () => {
  const [data, setData] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionOutput, setActionOutput] = useState('');
  const [runningAction, setRunningAction] = useState(false);
  
  const scrollRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const fetchSettings = () => {
    setLoading(true);
    fetch('http://localhost:3008/api/settings')
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = () => {
    if (!data) return;
    setSaving(true);
    fetch('http://localhost:3008/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(() => {
      setSaving(false);
      alert('Neural configuration committed.');
    })
    .catch(err => {
      setSaving(false);
      console.error(err);
    });
  };

  const handleRunAction = (cmd: string, args: string = '') => {
    setRunningAction(true);
    setActionOutput(`> hermes ${cmd} ${args} --yolo\nInitializing sequence...\n`);
    fetch('http://localhost:3008/api/commands/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: cmd, args })
    })
    .then(res => res.json())
    .then(d => {
      setActionOutput(prev => prev + (d.output || d.error || 'Done.'));
      setRunningAction(false);
    })
    .catch(err => {
      setActionOutput(prev => prev + `ERROR: ${err.message}`);
      setRunningAction(false);
    });
  };

  const updateConfig = (path: string, value: any) => {
    if (!data) return;
    // Use deep clone to ensure React detects changes in nested objects
    const newData = JSON.parse(JSON.stringify(data));
    
    const parts = path.split('.');
    let current: any = newData.config || (newData.config = {});
    
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]] || typeof current[parts[i]] !== 'object') current[parts[i]] = {};
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
    setData(newData);

    // Immediate theme application for UI feedback
    if (path === 'display.skin') {
      localStorage.setItem('hermes_theme', value);
      // Forced DOM application for instant results
      const themes = ['default', 'ares', 'mono', 'slate', 'cyberpunk'];
      themes.forEach(t => document.body.classList.remove(`theme-${t}`));
      document.body.classList.add(`theme-${value}`);
    }
  };

  const updateEnv = (key: string, value: string) => {
    if (!data) return;
    setData({ ...data, env: { ...data.env, [key]: value } });
  };

  const scrollToSection = (id: string) => {
    scrollRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (loading) return <div data-testid="loading-indicator" className="flex-1 flex items-center justify-center text-[var(--accent)] animate-pulse font-black uppercase tracking-[0.5em]">Neural Sync Active...</div>;

  const navItems = [
    { id: 'model', label: 'Model & Identity', icon: '🧠' },
    { id: 'behavior', label: 'Agent Behavior', icon: '🤖' },
    { id: 'voice', label: 'Voice (STT/TTS)', icon: '🎙️' },
    { id: 'display', label: 'Visual Interface', icon: '🎨' },
    { id: 'execution', label: 'Execution Layers', icon: '🖥️' },
    { id: 'memory', label: 'Memory & Profile', icon: '💾' },
    { id: 'security', label: 'Neural Security', icon: '🛡️' },
    { id: 'gateway', label: 'Messaging Hub', icon: '🌐' },
    { id: 'ops', label: 'System Directives', icon: '⚡' },
  ];

  return (
    <div data-testid="settings-view-container" className="flex flex-1 overflow-hidden bg-[var(--bg-main)]">
      {/* SIDEBAR NAV */}
      <div className="w-64 border-r border-[var(--border-main)] bg-[var(--bg-sidebar)] flex flex-col shrink-0">
        <div className="p-6 border-b border-[var(--border-main)]">
          <h2 className="text-sm font-black text-[var(--text-bright)] tracking-widest uppercase">System Settings</h2>
          <p className="text-[9px] text-[var(--text-muted)] uppercase mt-1">Global Config Center</p>
        </div>
        <div className="flex-1 overflow-y-auto py-2 no-scrollbar">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className="w-full flex items-center gap-3 px-6 py-3.5 text-left transition-all text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--bg-surface)] group"
            >
              <span className="text-base grayscale group-hover:grayscale-0">{item.icon}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
            </button>
          ))}
        </div>
        <div className="p-6 border-t border-[var(--border-main)] space-y-3">
          <button 
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-[var(--accent)] text-[var(--bg-main)] py-3 text-[10px] font-black rounded-lg hover:scale-[1.02] transition-all shadow-[0_0_20px_rgba(255,77,0,0.2)] uppercase"
          >
            {saving ? 'Saving...' : 'Sync Config'}
          </button>
        </div>
      </div>

      {/* MAIN SCROLL AREA */}
      <div className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top_right,var(--bg-sidebar),transparent)] scroll-smooth px-12 pt-12 pb-40 no-scrollbar">
        <div className="max-w-4xl mx-auto space-y-24">
          
          <Section id="model" title="Neural Model & Identity" icon="🧠" ref={el => scrollRefs.current['model'] = el}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Field label="Inference Model">
                <input value={data?.model?.default || ''} onChange={e => updateConfig('model.default', e.target.value)} className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] p-3 text-xs text-[var(--text-main)] font-mono rounded-xl outline-none focus:border-[var(--accent)]" />
              </Field>
              <Field label="Provider">
                <input value={data?.model?.provider || ''} onChange={e => updateConfig('model.provider', e.target.value)} className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] p-3 text-xs text-[var(--text-main)] font-mono rounded-xl outline-none focus:border-[var(--accent)]" />
              </Field>
              <Field label="API mode">
                <select value={data?.model?.api_mode || 'chat_completions'} onChange={e => updateConfig('model.api_mode', e.target.value)} className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] p-3 text-xs text-[var(--text-main)] font-mono rounded-xl outline-none focus:border-[var(--accent)]">
                  <option value="chat_completions">Chat Completions</option>
                  <option value="codex_responses">Codex Responses</option>
                </select>
              </Field>
              <Field label="OpenRouter Key (.env)">
                <input type="password" value={data?.env?.OPENROUTER_API_KEY || ''} onChange={e => updateEnv('OPENROUTER_API_KEY', e.target.value)} className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] p-3 text-xs text-[var(--text-main)] font-mono rounded-xl outline-none focus:border-[var(--accent)]" />
              </Field>
            </div>
          </Section>

          <Section id="behavior" title="Agent Cognition & Behavior" icon="🤖" ref={el => scrollRefs.current['behavior'] = el}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Field label="Max Turns (Autonomy)">
                <input type="number" value={data?.agent?.max_turns || 30} onChange={e => updateConfig('agent.max_turns', parseInt(e.target.value))} className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] p-3 text-xs text-[var(--text-main)] font-mono rounded-xl outline-none focus:border-[var(--accent)]" />
              </Field>
              <Field label="Reasoning Effort">
                <select value={data?.agent?.reasoning_effort || 'high'} onChange={e => updateConfig('agent.reasoning_effort', e.target.value)} className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] p-3 text-xs text-[var(--text-main)] font-mono rounded-xl outline-none focus:border-[var(--accent)]">
                  {['xhigh', 'high', 'medium', 'low', 'minimal', 'none'].map(v => <option key={v} value={v}>{v.toUpperCase()}</option>)}
                </select>
              </Field>
              <Toggle label="Context Compression" checked={data?.compression?.enabled !== false} onChange={v => updateConfig('compression.enabled', v)} />
              <Toggle label="Smart Model Routing" checked={data?.smart_model_routing?.enabled !== false} onChange={v => updateConfig('smart_model_routing.enabled', v)} />
            </div>
          </Section>

          <Section id="voice" title="Neural Sonic Interface" icon="🎙️" ref={el => scrollRefs.current['voice'] = el}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Field label="STT Provider">
                <select value={data?.stt?.provider || 'local'} onChange={e => updateConfig('stt.provider', e.target.value)} className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] p-3 text-xs text-[var(--text-main)] font-mono rounded-xl outline-none focus:border-[var(--accent)]">
                  <option value="local">Local (faster-whisper)</option>
                  <option value="groq">Groq</option>
                  <option value="openai">OpenAI</option>
                </select>
              </Field>
              <Field label="TTS Provider">
                <select value={data?.tts?.provider || 'edge'} onChange={e => updateConfig('tts.provider', e.target.value)} className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] p-3 text-xs text-[var(--text-main)] font-mono rounded-xl outline-none focus:border-[var(--accent)]">
                  <option value="edge">Edge (Free)</option>
                  <option value="elevenlabs">ElevenLabs</option>
                  <option value="openai">OpenAI</option>
                </select>
              </Field>
              <Field label="ElevenLabs Key (.env)">
                <input type="password" value={data?.env?.ELEVENLABS_API_KEY || ''} onChange={e => updateEnv('ELEVENLABS_API_KEY', e.target.value)} className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] p-3 text-xs text-[var(--text-main)] font-mono rounded-xl outline-none focus:border-[var(--accent)]" />
              </Field>
            </div>
          </Section>

          <Section id="display" title="Interface & Visuals" icon="🎨" ref={el => scrollRefs.current['display'] = el}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Field label="UI Skin">
                <select value={data?.config?.display?.skin || 'default'} onChange={e => updateConfig('display.skin', e.target.value)} className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] p-3 text-xs text-[var(--text-main)] font-mono rounded-xl outline-none focus:border-[var(--accent)]">
                  <option value="default">Neural (Default)</option>
                  <option value="ares">Ares (War)</option>
                  <option value="mono">Mono (CLI)</option>
                  <option value="slate">Slate (Pro)</option>
                  <option value="cyberpunk">Cyberpunk (Neon)</option>
                </select>
              </Field>
              <Toggle label="Streaming Mode" checked={data?.config?.display?.streaming !== false} onChange={v => updateConfig('display.streaming', v)} />
              <Toggle label="Show Token Cost" checked={data?.config?.display?.show_cost !== false} onChange={v => updateConfig('display.show_cost', v)} />
            </div>
          </Section>

          <Section id="execution" title="Execution Layers" icon="🖥️" ref={el => scrollRefs.current['execution'] = el}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Field label="Terminal Backend">
                <select value={data?.terminal?.backend || 'local'} onChange={e => updateConfig('terminal.backend', e.target.value)} className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] p-3 text-xs text-[var(--text-main)] font-mono rounded-xl outline-none focus:border-[var(--accent)]">
                  <option value="local">Local OS</option>
                  <option value="docker">Docker</option>
                </select>
              </Field>
              <Field label="Working Directory">
                <input value={data?.terminal?.cwd || '~/'} onChange={e => updateConfig('terminal.cwd', e.target.value)} className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] p-3 text-xs text-[var(--text-main)] font-mono rounded-xl outline-none focus:border-[var(--accent)]" />
              </Field>
              <Toggle label="Headless Browser" checked={data?.browser?.headless !== false} onChange={v => updateConfig('browser.headless', v)} />
            </div>
          </Section>

          <Section id="memory" title="Memory & Profile" icon="💾" ref={el => scrollRefs.current['memory'] = el}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Toggle label="Long-term Memory" checked={data?.memory?.memory_enabled !== false} onChange={v => updateConfig('memory.memory_enabled', v)} />
              <Toggle label="User Persona Profile" checked={data?.memory?.user_profile_enabled !== false} onChange={v => updateConfig('memory.user_profile_enabled', v)} />
              <Field label="Nudge Turn Interval">
                <input type="number" value={data?.memory?.nudge_interval || 10} onChange={e => updateConfig('memory.nudge_interval', parseInt(e.target.value))} className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] p-3 text-xs text-[var(--text-main)] font-mono rounded-xl outline-none focus:border-[var(--accent)]" />
              </Field>
            </div>
          </Section>

          <Section id="security" title="Neural Security" icon="🛡️" ref={el => scrollRefs.current['security'] = el}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Toggle label="Secret Redaction" checked={data?.security?.redact_secrets !== false} onChange={v => updateConfig('security.redact_secrets', v)} />
              <Toggle label="Tirith Guard" checked={data?.security?.tirith_enabled !== false} onChange={v => updateConfig('security.tirith_enabled', v)} />
              <Toggle label="PII Shield" checked={data?.privacy?.redact_pii || false} onChange={v => updateConfig('privacy.redact_pii', v)} />
            </div>
          </Section>

          <Section id="gateway" title="Messaging Gateway" icon="🌐" ref={el => scrollRefs.current['gateway'] = el}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Field label="Telegram Bot Token (.env)">
                <input type="password" value={data?.env?.TELEGRAM_BOT_TOKEN || ''} onChange={e => updateEnv('TELEGRAM_BOT_TOKEN', e.target.value)} className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] p-3 text-xs text-[var(--text-main)] font-mono rounded-xl outline-none focus:border-[var(--accent)]" />
              </Field>
              <Field label="Telegram Home Channel (.env)">
                <input value={data?.env?.TELEGRAM_HOME_CHANNEL || ''} onChange={e => updateEnv('TELEGRAM_HOME_CHANNEL', e.target.value)} className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] p-3 text-xs text-[var(--text-main)] font-mono rounded-xl outline-none focus:border-[var(--accent)]" />
              </Field>
              <Toggle label="Neural Isolation (Groups)" checked={data?.group_sessions_per_user !== false} onChange={v => updateConfig('group_sessions_per_user', v)} />
            </div>
          </Section>

          <Section id="ops" title="System Management" icon="⚡" ref={el => scrollRefs.current['ops'] = el}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ActionButton label="Setup Wizard" cmd="setup" onRun={handleRunAction} />
              <ActionButton label="System Doctor" cmd="doctor" onRun={handleRunAction} />
              <ActionButton label="Skill Sync" cmd="skills sync" onRun={handleRunAction} />
              <ActionButton label="Neural Update" cmd="update" onRun={handleRunAction} />
            </div>
            {actionOutput && (
              <pre className="mt-8 bg-[var(--bg-main)] border border-[var(--border-main)] p-6 rounded-2xl font-mono text-[11px] text-[#00FF41] leading-relaxed whitespace-pre-wrap max-h-[400px] overflow-y-auto">
                {actionOutput}
                {runningAction && <span className="animate-pulse">_</span>}
              </pre>
            )}
          </Section>

        </div>
      </div>
    </div>
  );
};

const Section = React.forwardRef<HTMLDivElement, { id: string, title: string, icon: string, children: React.ReactNode }>(({ title, icon, children }, ref) => (
  <div ref={ref} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] flex items-center justify-center text-xl shadow-xl">{icon}</div>
      <h3 className="text-sm font-black text-[var(--text-bright)] uppercase tracking-[0.2em]">{title}</h3>
      <div className="h-[1px] flex-1 bg-gradient-to-r from-[var(--border-main)] to-transparent"></div>
    </div>
    <div className="bg-[var(--bg-surface)]/40 backdrop-blur-md border border-[var(--border-main)] p-8 rounded-3xl shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[var(--accent)]/10 to-transparent"></div>
      {children}
    </div>
  </div>
));

const Field: React.FC<{label: string, children: React.ReactNode}> = ({label, children}) => (
  <div className="space-y-2">
    <label className="block text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest px-1">{label}</label>
    {children}
  </div>
);

const Toggle: React.FC<{label: string, checked: boolean, onChange: (v: boolean) => void}> = ({label, checked, onChange}) => (
  <div className="flex items-center justify-between p-4 bg-[var(--bg-main)]/50 border border-[var(--border-main)] rounded-xl">
    <span className="text-[10px] text-[var(--text-main)] font-bold uppercase tracking-widest">{label}</span>
    <label className="relative inline-flex items-center cursor-pointer shrink-0">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="peer opacity-0 absolute w-11 h-6 cursor-pointer z-10" />
      <div className="w-10 h-5 bg-[var(--border-main)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[var(--text-muted)] after:border-[var(--border-bright)] after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--accent)] peer-checked:after:bg-[var(--bg-main)]"></div>
    </label>
  </div>
);

const ActionButton: React.FC<{label: string, cmd: string, onRun: (cmd: string) => void}> = ({label, cmd, onRun}) => (
  <button onClick={() => onRun(cmd)} className="bg-[var(--bg-surface)] border border-[var(--border-main)] text-[var(--text-muted)] py-3 text-[9px] font-bold uppercase rounded-lg hover:bg-[var(--accent)] hover:text-[var(--bg-main)] hover:border-[var(--accent)] transition-all">
    {label}
  </button>
);

export default SettingsView;
