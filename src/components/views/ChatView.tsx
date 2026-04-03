import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { 
  Plus, 
  Trash2, 
  Send, 
  MessageSquare, 
  Bot, 
  User, 
  Cpu, 
  Search,
  RefreshCw,
  Terminal,
  Brain,
  History
} from 'lucide-react';

const API_BASE = `http://${window.location.hostname}:3008/api`;
(window as any).API_BASE = API_BASE;

const ChatView: React.FC = () => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'inherit';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 200)}px`;
    }
  }, [input]);

  const fetchSessions = () => {
    setLoading(true);
    fetch(`${API_BASE}/chat/sessions`)
      .then(res => res.json())
      .then(data => {
        setSessions(data.sessions || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Fetch sessions failed:', err);
        setLoading(false);
      });
  };

  const fetchMessages = (sessionId: string) => {
    fetch(`${API_BASE}/chat/sessions/${sessionId}`)
      .then(res => res.json())
      .then(data => {
        if (data.messages) {
          setMessages(data.messages);
        }
      })
      .catch(err => console.error('Fetch messages failed:', err));
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    if (activeSessionId) {
      fetchMessages(activeSessionId);
    } else {
      setMessages([]);
    }
  }, [activeSessionId]);

  const handleSendMessage = () => {
    if (!input.trim() || !activeSessionId || sending) return;

    const userMsg = input;
    setSending(true);
    setInput('');
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'inherit';
    }

    const tempMsg = { 
      role: 'user', 
      content: userMsg, 
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    };
    
    setMessages(prev => [...prev, tempMsg]);

    fetch(`${API_BASE}/chat/sessions/${activeSessionId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userMsg })
    })
    .then(async res => {
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server returned ${res.status}`);
      }
      return res.json();
    })
    .then(data => {
      setSending(false);
      if (data.session && data.session.messages) {
        setMessages(data.session.messages);
      }
      fetchSessions();
    })
    .catch(err => {
      setSending(false);
      setInput(userMsg);
      console.error('Failed to send message:', err);
      
      const errMsg = {
        role: 'system',
        content: `Error: ${err.message}. Connection interrupted.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errMsg]);
    });
  };

  const handleSuggestion = (text: string) => {
    if (activeSessionId) {
      setInput(text);
      setTimeout(() => {
        if (textareaRef.current) textareaRef.current.focus();
      }, 50);
    } else {
      setLoading(true);
      fetch(`${API_BASE}/chat/sessions`, { method: 'POST' })
        .then(res => res.json())
        .then(data => {
          setMessages([]);
          setActiveSessionId(data.session_id);
          setInput(text);
          fetchSessions();
          setLoading(false);
          setTimeout(() => {
            if (textareaRef.current) textareaRef.current.focus();
          }, 100);
        })
        .catch(err => {
          setLoading(false);
          console.error('Suggestion creation failed:', err);
          alert(`Neural Link failed: ${err.message}`);
        });
    }
  };

  const handleNewSession = () => {
    setLoading(true);
    fetch(`${API_BASE}/chat/sessions`, { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        setMessages([]);
        setActiveSessionId(data.session_id);
        setInput('');
        fetchSessions();
        setLoading(false);
      })
      .catch(err => {
        setLoading(false);
        console.error('New session failed:', err);
        alert('Failed to create new neural session.');
      });
  };

  const handleDeleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this conversation?')) return;
    
    fetch(`${API_BASE}/chat/sessions/${id}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(() => {
        if (activeSessionId === id) {
          setActiveSessionId(null);
          setMessages([]);
        }
        fetchSessions();
      })
      .catch(err => console.error('Delete session failed:', err));
  };

  const filteredSessions = sessions.filter(s => 
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div 
      className="flex h-full w-full overflow-hidden bg-[var(--bg-main)] text-[var(--text-main)]" 
      data-testid="chat-view-container"
      data-active-session={activeSessionId || ''}
    >
      {/* SIDEBAR */}
      <div className="w-[260px] bg-[var(--bg-sidebar)] border-r border-[var(--border-main)] flex flex-col transition-all duration-300" data-testid="chat-sidebar">
        <div className="p-3">
          <button 
            onClick={handleNewSession}
            title="New Session"
            data-testid="sidebar-new-convo-btn"
            className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg border border-[var(--border-main)] hover:bg-[var(--bg-surface)] transition-colors group"
          >
            <Plus className="w-4 h-4 text-[var(--accent)] group-hover:scale-110 transition-transform" />
            <span>New Conversation</span>
          </button>
        </div>

        <div className="px-3 mb-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" />
            <input 
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search conversations..."
              data-testid="session-search-input"
              className="w-full bg-[var(--bg-input)] border border-[var(--border-main)] pl-8 pr-3 py-1.5 text-[11px] rounded-md outline-none focus:border-[var(--accent)]/50 transition-colors"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar py-2" data-testid="session-list">
          <div className="px-4 py-2 text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
            <History className="w-3 h-3" />
            Conversation History
          </div>
          
          {loading && sessions.length === 0 && (
            <div className="px-4 py-8 text-center animate-pulse" data-testid="loading-indicator">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[var(--accent)]/40 mb-2" />
              <div className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest">Neural Link Syncing</div>
            </div>
          )}

          {filteredSessions.map(s => (
            <SessionItem 
              key={s.id}
              id={s.id}
              active={activeSessionId === s.id} 
              name={s.name || `Session ${s.id.substring(0, 8)}`} 
              time={s.time}
              onClick={() => setActiveSessionId(s.id)}
              onDelete={(e) => handleDeleteSession(e, s.id)}
            />
          ))}
        </div>

        <div className="p-4 border-t border-[var(--border-main)] bg-[var(--bg-main)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent)] to-[#FF8A00] flex items-center justify-center text-[var(--bg-main)] font-bold text-xs shadow-lg">
              OP
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="text-[11px] font-bold truncate">Operator v1.0</div>
              <div className="text-[9px] text-[#00FF41] font-mono tracking-tighter uppercase animate-pulse">System Live</div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CHAT AREA */}
      <div className="flex-1 flex flex-col relative bg-[var(--bg-main)]" data-testid="chat-main-area">
        <div className="h-14 border-b border-[var(--border-main)]/50 flex items-center px-6 justify-between bg-[var(--bg-main)]/80 backdrop-blur-md z-20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[var(--bg-surface)] rounded flex items-center justify-center text-[var(--accent)] border border-[var(--accent)]/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight">HERMES CORE</div>
              <div className="text-[9px] text-[#00FF41] font-mono uppercase tracking-widest" data-testid="connection-status">
                {activeSessionId ? 'Neural Connection established' : 'Awaiting initialization'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
             <button 
               onClick={fetchSessions}
               data-testid="refresh-sessions-btn"
               className="p-2 text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors rounded-lg"
               title="Refresh Neural Stream"
             >
               <RefreshCw className="w-4 h-4" />
             </button>
          </div>
        </div>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth" data-testid="message-feed">
          {!activeSessionId ? (
            <div className="h-full flex flex-col items-center justify-center p-10 max-w-2xl mx-auto text-center space-y-10 animate-in fade-in duration-700" data-testid="dashboard-suggestions">
              <div className="w-20 h-20 bg-gradient-to-b from-[var(--bg-surface)] to-[#000000] border border-[var(--border-bright)] rounded-[2rem] flex items-center justify-center text-4xl font-black text-[var(--accent)] shadow-[0_20px_50px_rgba(255,77,0,0.1)] mb-4 ring-1 ring-[var(--accent)]/20">
                H
              </div>
              <div className="space-y-3">
                <h1 className="text-4xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-[var(--text-bright)] to-[var(--text-muted)]">HERMES_TERMINAL_V2</h1>
                <p className="text-xs text-[var(--text-muted)] font-bold leading-relaxed uppercase tracking-[0.4em]">Integrated Sovereign Agent Interface</p>
              </div>
              <div className="grid grid-cols-2 gap-4 w-full">
                <HeroAction 
                  label="Run Neural Diagnostic" 
                  icon={<Cpu className="w-4 h-4" />} 
                  data-testid="suggestion-diagnostic"
                  onClick={() => handleSuggestion("Run a neural diagnostic on the system and check for any anomalies or pending tasks.")}
                />
                <HeroAction 
                  label="Sync Agency Logic" 
                  icon={<Brain className="w-4 h-4" />} 
                  data-testid="suggestion-sync"
                  onClick={() => handleSuggestion("Synchronize agency logic across all sub-agents and update the SOUL.md if necessary.")}
                />
                <HeroAction 
                  label="Execute Protocol Link" 
                  icon={<Terminal className="w-4 h-4" />} 
                  data-testid="suggestion-protocol"
                  onClick={() => handleSuggestion("Establish a new protocol link via MCP and list available tools.")}
                />
                <HeroAction 
                  label="New Conversation" 
                  onClick={handleNewSession} 
                  icon={<Plus className="w-4 h-4" />} 
                  data-testid="dashboard-new-convo-btn" 
                />
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto w-full pt-10 pb-48 px-6">
              {messages.length === 0 && (
                <div className="text-center py-20 opacity-20" data-testid="empty-state">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4" />
                  <div className="text-xs font-bold uppercase tracking-[0.3em]">Channel Cleared • Trace Ready</div>
                </div>
              )}
              {messages.map((m, idx) => (
                <ChatMessage key={idx} role={m.role} content={m.content} time={m.time} index={idx} />
              ))}
              {sending && (
                <div className="flex gap-6 py-8 animate-in fade-in slide-in-from-bottom-2 duration-300" data-testid="sending-indicator">
                  <div className="w-8 h-8 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-bright)] flex items-center justify-center text-[var(--accent)] shrink-0 shadow-lg ring-1 ring-[var(--accent)]/10">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="flex-1 pt-2">
                    <div className="flex gap-1.5">
                      <div className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full animate-bounce [animation-duration:800ms]"></div>
                      <div className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full animate-bounce [animation-duration:800ms] [animation-delay:200ms]"></div>
                      <div className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full animate-bounce [animation-duration:800ms] [animation-delay:400ms]"></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Floating Input Area */}
        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-[var(--bg-main)] via-[var(--bg-main)] to-transparent pt-20 pb-8 px-6 z-30 pointer-events-none">
          <div className="max-w-3xl mx-auto w-full pointer-events-auto">
            <div className="bg-[var(--bg-surface)] border border-[var(--border-bright)] rounded-2xl p-2 shadow-[0_10px_40px_rgba(0,0,0,0.5)] focus-within:border-[var(--accent)]/40 transition-all ring-1 ring-[var(--accent)]/5" data-testid="input-container">
              <div className="flex flex-col">
                <textarea 
                  ref={textareaRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={activeSessionId ? "Awaiting commands..." : "Select or create a session..."}
                  disabled={!activeSessionId || sending}
                  data-testid="chat-input"
                  rows={1}
                  className="w-full bg-transparent text-[14px] text-[var(--text-main)] outline-none py-3 px-4 resize-none leading-relaxed placeholder:text-[var(--text-muted)] no-scrollbar"
                />
                <div className="flex justify-between items-center px-2 py-1.5">
                  <div className="flex items-center gap-1">
                    <button className="p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] rounded-xl transition-colors">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={handleSendMessage}
                      disabled={!activeSessionId || sending || !input.trim()}
                      data-testid="send-message-btn"
                      className={`p-2 rounded-xl transition-all ${!input.trim() ? 'text-[var(--border-bright)]' : 'bg-[var(--accent)] text-[var(--bg-main)] hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,77,0,0.3)]'}`}
                    >
                      <Send className="w-4 h-4" strokeWidth={3} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-[9px] text-[var(--text-muted)] text-center mt-4 tracking-[0.2em] uppercase font-bold">Neural Verification Protocol • Hermes_AI v2.4</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- SUB-COMPONENTS ---

const ChatMessage: React.FC<{role: string, content: any, time?: string, index: number}> = ({role, content, time, index}) => {
  const isUser = role === 'user';
  
  return (
    <div 
      className={`flex gap-6 py-8 group animate-in fade-in duration-500 border-b border-[var(--border-main)]/30 last:border-0`}
      data-testid={`chat-message-${index}`}
      data-role={role}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 shadow-lg ${
        isUser 
          ? 'bg-gradient-to-br from-[var(--border-bright)] to-[var(--bg-sidebar)] border border-[var(--text-muted)] text-[var(--text-main)]' 
          : 'bg-[var(--bg-surface)] border border-[var(--accent)]/20 text-[var(--accent)] ring-1 ring-[var(--accent)]/5'
      }`}>
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>
      <div className="space-y-2 flex-1 overflow-hidden pt-1">
        <div className="flex items-center justify-between mb-1">
          <span className={`text-[10px] font-bold uppercase tracking-widest ${isUser ? 'text-[var(--text-muted)]' : 'text-[var(--accent)]'}`}>
            {isUser ? 'Operator' : 'Hermes_Core'}
          </span>
          <span className="text-[9px] text-[var(--text-muted)] font-mono">{time}</span>
        </div>
        <div className="prose prose-invert prose-sm max-w-none text-[14.5px] leading-relaxed text-[#d1d1d1]" data-testid="message-content">
          {typeof content === 'string' ? (
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                code({node, className, children, ...props}: any) {
                  const match = /language-(\w+)/.exec(className || '');
                  return match ? (
                    <div className="my-4 rounded-xl overflow-hidden border border-[var(--border-bright)] shadow-2xl">
                      <div className="bg-[var(--bg-surface)] px-4 py-2 flex justify-between items-center border-b border-[var(--border-main)]">
                        <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest font-mono">{match[1]}</span>
                        <button 
                          onClick={() => navigator.clipboard.writeText(String(children))}
                          className="text-[9px] text-[var(--text-muted)] hover:text-[var(--text-main)] uppercase font-bold transition-colors"
                        >
                          Copy Code
                        </button>
                      </div>
                      <SyntaxHighlighter
                        language={match[1]}
                        style={vscDarkPlus}
                        PreTag="div"
                        customStyle={{
                          margin: 0,
                          padding: '1.5rem',
                          background: 'var(--bg-main)',
                          fontSize: '13px',
                          lineHeight: '1.6'
                        }}
                        {...props}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    </div>
                  ) : (
                    <code className="bg-[var(--bg-surface)] px-1.5 py-0.5 rounded text-[var(--accent)] font-mono text-[13px]" {...props}>
                      {children}
                    </code>
                  );
                },
                p: ({children}) => <p className="mb-4 last:mb-0">{children}</p>,
                ul: ({children}) => <ul className="list-disc pl-6 mb-4 space-y-2">{children}</ul>,
                ol: ({children}) => <ol className="list-decimal pl-6 mb-4 space-y-2">{children}</ol>,
                li: ({children}) => <li className="pl-1">{children}</li>,
                h1: ({children}) => <h1 className="text-xl font-bold mb-4 mt-6 text-white">{children}</h1>,
                h2: ({children}) => <h2 className="text-lg font-bold mb-3 mt-5 text-white">{children}</h2>,
                h3: ({children}) => <h3 className="text-base font-bold mb-2 mt-4 text-white">{children}</h3>,
                blockquote: ({children}) => <blockquote className="border-l-2 border-[var(--accent)]/40 pl-4 italic text-[var(--text-muted)] my-4">{children}</blockquote>
              }}
            >
              {content}
            </ReactMarkdown>
          ) : (
            <pre className="bg-[var(--bg-main)] p-4 rounded-xl border border-[var(--border-main)] text-[12px] overflow-x-auto text-[var(--accent)]/80 font-mono leading-relaxed">
              {JSON.stringify(content, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};

const SessionItem: React.FC<{id: string, name: string, time?: string, active?: boolean, onClick: () => void, onDelete: (e: React.MouseEvent) => void}> = ({id, name, time, active, onClick, onDelete}) => (
  <div 
    onClick={onClick}
    data-testid={`session-item-${id}`}
    data-active={active}
    className={`mx-2 my-0.5 px-3 py-2.5 cursor-pointer rounded-lg transition-all group relative flex items-center gap-3 ${
      active 
        ? 'bg-[var(--bg-surface)] text-[var(--text-bright)] shadow-lg ring-1 ring-[#ffffff]/5' 
        : 'text-[var(--text-muted)] hover:bg-[var(--bg-sidebar)] hover:text-[var(--text-main)]'
    }`}
  >
    <MessageSquare className={`w-4 h-4 shrink-0 ${active ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`} />
    <div className="flex-1 overflow-hidden min-w-0">
      <div className={`text-[12px] font-medium truncate ${active ? '' : 'group-hover:text-[var(--text-main)]'}`} title={name}>
        {name}
      </div>
      <div className="text-[9px] text-[var(--text-muted)] font-mono mt-0.5">{time}</div>
    </div>
    
    <button 
      onClick={onDelete}
      data-testid="delete-session-btn"
      className={`p-1.5 rounded-md hover:bg-[var(--border-main)] hover:text-red-500 transition-all opacity-0 group-hover:opacity-100 ${active ? 'text-[var(--text-muted)]' : 'text-[var(--text-muted)]'}`}
      title="Delete Session"
    >
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  </div>
);

const HeroAction: React.FC<{label: string, icon: React.ReactNode, onClick?: () => void, 'data-testid'?: string}> = ({label, icon, onClick, 'data-testid': testId}) => (
  <button 
    onClick={onClick}
    data-testid={testId}
    className="flex items-center gap-3 p-4 bg-[var(--bg-sidebar)] border border-[var(--border-main)] rounded-2xl hover:border-[var(--accent)]/40 transition-all text-left hover:bg-[var(--bg-surface)] group"
  >
    <div className="w-10 h-10 rounded-xl bg-[var(--bg-main)] flex items-center justify-center text-[var(--accent)] group-hover:scale-110 transition-transform shadow-inner">
      {icon}
    </div>
    <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest group-hover:text-[var(--text-main)] transition-colors">{label}</span>
  </button>
);

export default ChatView;
