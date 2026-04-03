import React, { useState, useEffect } from 'react';

interface PlatformConfig {
  enabled: boolean;
  token?: string;
  api_key?: string;
  reply_to_mode?: string;
  extra?: Record<string, any>;
}

interface GatewaySettings {
  platforms: Record<string, PlatformConfig>;
  stt_enabled: boolean;
  group_sessions_per_user: boolean;
  unauthorized_dm_behavior: string;
}

const API_BASE = `http://${window.location.hostname}:3008/api`;

const GatewayView: React.FC = () => {
  const [settings, setSettings] = useState<GatewaySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activePlatform, setActivePlatform] = useState<string>('telegram');

  const fetchSettings = () => {
    setLoading(true);
    fetch(`${API_BASE}/gateway/config`)
      .then(res => res.json())
      .then(data => {
        setSettings(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Fetch gateway settings failed:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = () => {
    if (!settings) return;
    setSaving(true);
    fetch(`${API_BASE}/gateway/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    })
    .then(res => res.json())
    .then(() => {
      setSaving(false);
      alert('Gateway settings saved successfully.');
    })
    .catch(err => {
      setSaving(false);
      console.error('Save gateway settings failed:', err);
    });
  };

  const updatePlatform = (platform: string, updates: Partial<PlatformConfig>) => {
    if (!settings) return;
    setSettings({
      ...settings,
      platforms: {
        ...settings.platforms,
        [platform]: {
          ...settings.platforms[platform],
          ...updates
        }
      }
    });
  };

  if (loading) {
    return (
      <div data-testid="loading-indicator" className="flex-1 flex items-center justify-center bg-[#0d0d0d]">
        <div className="text-[#FF4D00] text-sm animate-pulse tracking-widest uppercase">Initializing Gateway Interface...</div>
      </div>
    );
  }

  const platforms = ['telegram', 'slack', 'whatsapp', 'discord', 'signal'];

  return (
    <div data-testid="gateway-view-container" className="flex-1 flex flex-col bg-[#0d0d0d] overflow-hidden">
      <div className="h-16 border-b border-[#222222] flex items-center justify-between px-8 bg-[#111111]/50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#FF4D00]/10 rounded flex items-center justify-center text-[#FF4D00]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          </div>
          <h2 className="text-sm font-bold text-[#E0E0E0] tracking-widest uppercase">Messaging Gateway</h2>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          data-testid="gateway-save-btn"
          className="bg-[#FF4D00] text-[#080808] px-6 py-2 text-xs font-bold rounded-sm hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,77,0,0.2)]"
        >
          {saving ? 'SYNCING...' : 'SAVE CONFIGURATION'}
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* PLATFORM LIST */}
        <div className="w-64 border-r border-[#222222] bg-[#111111] flex flex-col">
          <div className="p-4 border-b border-[#222222]">
            <span className="text-[10px] font-bold text-[#444444] tracking-widest uppercase">Neural Channels</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {platforms.map(p => (
              <button
                key={p}
                onClick={() => setActivePlatform(p)}
                data-testid={`platform-tab-${p}`}
                className={`w-full flex items-center justify-between px-4 py-4 text-left border-l-2 transition-all ${
                  activePlatform === p 
                    ? 'bg-[#1a1a1a] border-[#FF4D00] text-[#ffffff]' 
                    : 'border-transparent text-[#888888] hover:text-[#ececec] hover:bg-[#111111]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <PlatformIcon platform={p} size={18} />
                  <span className="text-xs font-bold uppercase tracking-wider">{p}</span>
                </div>
                {settings?.platforms[p]?.enabled && (
                  <div className="w-1.5 h-1.5 bg-[#00FF41] rounded-full shadow-[0_0_5px_#00FF41]"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* CONFIG AREA */}
        <div className="flex-1 overflow-y-auto p-10 bg-[#080808]">
          <div className="max-w-2xl mx-auto space-y-10">
            <div className="flex items-center justify-between p-6 bg-[#111111] border border-[#222222] rounded-xl shadow-2xl">
              <div>
                <h3 className="text-lg font-bold text-[#E0E0E0] uppercase tracking-tighter flex items-center gap-2">
                  {activePlatform}
                  {settings?.platforms[activePlatform]?.enabled ? 
                    <span className="text-[10px] bg-[#00FF41]/10 text-[#00FF41] px-2 py-0.5 rounded-full border border-[#00FF41]/20">ACTIVE</span> :
                    <span className="text-[10px] bg-[#444444]/10 text-[#444444] px-2 py-0.5 rounded-full border border-[#444444]/20">OFFLINE</span>
                  }
                </h3>
                <p className="text-xs text-[#888888] mt-1">Configure bridge parameters for {activePlatform} neural link.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={settings?.platforms[activePlatform]?.enabled || false}
                  onChange={e => updatePlatform(activePlatform, { enabled: e.target.checked })}
                  data-testid="platform-enable-toggle"
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-[#222222] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#444444] after:border-[#333333] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF4D00] peer-checked:after:bg-[#080808]"></div>
              </label>
            </div>

            <div className={`space-y-6 transition-opacity ${settings?.platforms[activePlatform]?.enabled ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
              {(activePlatform === 'telegram' || activePlatform === 'discord' || activePlatform === 'slack') && (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#444444] uppercase tracking-widest">Bot Token / API Secret</label>
                  <div className="relative">
                    <input 
                      type="password"
                      value={settings?.platforms[activePlatform]?.token || ''}
                      onChange={e => updatePlatform(activePlatform, { token: e.target.value })}
                      placeholder={`Enter ${activePlatform} access token...`}
                      className="w-full bg-[#111111] border border-[#222222] px-4 py-3 text-sm text-[#ffffff] focus:border-[#FF4D00] outline-none transition-all rounded-lg"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#444444]">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                    </div>
                  </div>
                </div>
              )}

              {activePlatform === 'whatsapp' && (
                <div className="p-6 bg-[#00FF41]/5 border border-[#00FF41]/10 rounded-xl space-y-4">
                  <div className="flex gap-4">
                    <div className="p-3 bg-[#00FF41]/10 text-[#00FF41] rounded-lg h-fit">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#E0E0E0] uppercase">WhatsApp Pairing</h4>
                      <p className="text-xs text-[#888888] mt-1 leading-relaxed">
                        WhatsApp uses a multi-device bridge. Once enabled, you'll need to run <code className="text-[#FF4D00] bg-[#FF4D00]/5 px-1 rounded">hermes whatsapp</code> in the terminal to scan the QR code and pair your account.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activePlatform === 'telegram' && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#444444] uppercase tracking-widest">Home Channel / Chat ID</label>
                    <input 
                      type="text"
                      value={settings?.platforms.telegram?.extra?.home_channel || ''}
                      onChange={e => updatePlatform('telegram', { extra: { ...settings?.platforms.telegram?.extra, home_channel: e.target.value } })}
                      placeholder="e.g. 8056909526"
                      className="w-full bg-[#111111] border border-[#222222] px-4 py-3 text-sm text-[#ffffff] focus:border-[#FF4D00] outline-none transition-all rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#444444] uppercase tracking-widest">Allowed Users (Comma separated)</label>
                    <input 
                      type="text"
                      value={settings?.platforms.telegram?.extra?.allowed_users || ''}
                      onChange={e => updatePlatform('telegram', { extra: { ...settings?.platforms.telegram?.extra, allowed_users: e.target.value } })}
                      placeholder="e.g. 8056909526, 12345678"
                      className="w-full bg-[#111111] border border-[#222222] px-4 py-3 text-sm text-[#ffffff] focus:border-[#FF4D00] outline-none transition-all rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#444444] uppercase tracking-widest">Reply Mode</label>
                    <select 
                      value={settings?.platforms[activePlatform]?.reply_to_mode || 'first'}
                      onChange={e => updatePlatform(activePlatform, { reply_to_mode: e.target.value })}
                      className="w-full bg-[#111111] border border-[#222222] px-4 py-3 text-sm text-[#ffffff] focus:border-[#FF4D00] outline-none transition-all rounded-lg appearance-none"
                    >
                      <option value="off">Off (Standard replies)</option>
                      <option value="first">First (Threaded to original message)</option>
                      <option value="all">All (All message chunks threaded)</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="p-6 bg-[#111111] border border-[#222222] rounded-xl space-y-6">
                <h4 className="text-xs font-bold text-[#E0E0E0] uppercase tracking-widest border-b border-[#222222] pb-3">Global Gateway Protocols</h4>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-[#ececec]">STT AUTO-TRANSCRIBE</div>
                    <div className="text-[10px] text-[#888888] mt-0.5">Automatically transcribe inbound voice messages</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={settings?.stt_enabled || false}
                      onChange={e => setSettings({ ...settings!, stt_enabled: e.target.checked })}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-[#222222] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#444444] after:border-[#333333] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF4D00] peer-checked:after:bg-[#080808]"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-[#ececec]">NEURAL ISOLATION</div>
                    <div className="text-[10px] text-[#888888] mt-0.5">Isolate group sessions per participant</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={settings?.group_sessions_per_user || false}
                      onChange={e => setSettings({ ...settings!, group_sessions_per_user: e.target.checked })}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-[#222222] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#444444] after:border-[#333333] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF4D00] peer-checked:after:bg-[#080808]"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PlatformIcon: React.FC<{platform: string, size?: number}> = ({platform, size = 20}) => {
  switch (platform) {
    case 'telegram':
      return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>;
    case 'slack':
      return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="8" x="13" y="13" rx="2"/><rect width="8" height="8" x="3" y="3" rx="2"/><rect width="8" height="8" x="13" y="3" rx="2"/><rect width="8" height="8" x="3" y="13" rx="2"/></svg>;
    case 'whatsapp':
      return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
    case 'discord':
      return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><path d="M9.9 4.2c5 .5 7 2.4 7.4 7.5.1 1 .3 3 2.8 5.3.3.3 0 .7-.4.8-1.7.3-3 .9-4.8.9h-.1c-2 0-4-1-6.3-1-4.4 0-8-3.1-8-7 0-4 3.6-7 8-7.5Z"/></svg>;
    case 'signal':
      return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/></svg>;
    default:
      return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/></svg>;
  }
};

export default GatewayView;
