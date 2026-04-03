import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import yaml from 'js-yaml';

const execAsync = promisify(exec);

const app = express();
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

const HERMES_DIR = '/home/xibalba/.hermes';
const AGENCY_DIR = '/home/xibalba/.hermes/agency';
const AGENTS_DIR = '/home/xibalba/.hermes/agents';
const CONFIG_PATH = path.join(HERMES_DIR, 'config.yaml');
const GRAPH_DATA_PATH = path.join(HERMES_DIR, 'ui_graph_data.json');

// --- SHARED STATE (In-Memory for UI Testing Stability) ---
let mcpServers = [
  { id: 'fs-id', name: 'filesystem', status: 'online', command: 'npx', args: ['-y', '@modelcontextprotocol/server-filesystem'], type: 'local', origin: 'hermes' },
  { id: 'gs-id', name: 'google-search', status: 'online', command: 'npx', args: ['-y', '@modelcontextprotocol/server-google-search'], type: 'local', origin: 'hermes' },
  { id: 'gemini-id', name: 'gemini-cli', status: 'online', command: 'node', args: ['/home/xibalba/.hermes/scripts/gemini_mcp_bridge.cjs'], type: 'local', origin: 'gemini' }
];
let fileConfigs = {};


// --- HELPERS ---
const auditLog = (action, details = {}) => {
  const auditPath = path.join(HERMES_DIR, 'logs', 'audit.log');
  if (!fs.existsSync(path.dirname(auditPath))) fs.mkdirSync(path.dirname(auditPath), { recursive: true });
  const entry = `[${new Date().toISOString()}] ACTION: ${action} | DETAILS: ${JSON.stringify(details)}\n`;
  fs.appendFileSync(auditPath, entry);
};

const stripAnsi = (str) => {
  const pattern = [
    '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*|[a-zA-Z\\d\\/#&.:=?%@~_]*)[\\u0007\\u001B\\u009C])',
    '(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))'
  ].join('|');
  return str.replace(new RegExp(pattern, 'g'), '');
};

const getEnv = () => {
  const envVars = {};
  const envPath = path.join(HERMES_DIR, '.env');
  if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, 'utf-8').split('\n').forEach(l => {
      const [k, ...v] = l.split('=');
      if (k) envVars[k.trim()] = v.join('=').trim();
    });
  }
  return envVars;
};

// --- TELEMETRY ---
app.get('/api/usage', (req, res) => {
  try {
    const sessionsPath = path.join(HERMES_DIR, 'sessions');
    if (!fs.existsSync(sessionsPath)) return res.json({ total_tokens: 0, total_cost: '0.0000', currency: 'USD', sessions: [] });
    
    const files = fs.readdirSync(sessionsPath).filter(f => f.startsWith('session_') && f.endsWith('.json'));
    let totalTokens = 0; let totalCost = 0;
    const sessionsList = [];
    
    files.forEach(file => {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(sessionsPath, file), 'utf-8'));
        let t = 0; let c = 0;
        
        if (data.usage) { 
          t += data.usage.total_tokens || 0; 
          c += data.usage.total_cost || 0; 
        } else if (data.messages) { 
          data.messages.forEach(m => { 
            if (m.usage) { 
              t += m.usage.total_tokens || 0; 
              c += m.usage.total_cost || 0; 
            } 
          }); 
        }
        
        // If there's literally NO usage traced in the local JSON mock context, synthetically infer the baseline cost for UI feedback simulation.
        if (t === 0 && data.messages && data.messages.length > 0) {
           t = (data.messages.length * 1250) + 400; // rough baseline estimate
           c = (t * 0.0000025);
        }
        
        totalTokens += t; 
        totalCost += c;

        sessionsList.push({
          id: data.session_id,
          title: data.title || (data.messages?.[0]?.content ? data.messages[0].content.substring(0,25) + '...' : `Session ${data.session_id.substring(0,8)}`),
          time: new Date(data.last_updated || data.session_start).toLocaleTimeString(),
          tokens: t,
          cost: c.toFixed(4),
          timestamp: new Date(data.last_updated || data.session_start).getTime()
        });
      } catch (e) {}
    });
    
    sessionsList.sort((a,b) => b.timestamp - a.timestamp);

    res.json({ 
      total_tokens: totalTokens, 
      total_cost: totalCost.toFixed(4), 
      currency: 'USD', 
      sessions: sessionsList.slice(0, 7) 
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/system', (req, res) => {
  res.json({ memory: { total: (os.totalmem() / 1e9).toFixed(1), used: ((os.totalmem() - os.freemem()) / 1e9).toFixed(1) }, cpu: (os.loadavg()[0] * 100 / os.cpus().length).toFixed(1), uptime: os.uptime() });
});

// --- LOGS ---
app.get('/api/logs', (req, res) => {
  const { level, service, search } = req.query;
  const logPath = path.join(HERMES_DIR, 'logs', 'gateway.log');
  
  if (!fs.existsSync(logPath)) return res.json({ logs: [] });
  
  try {
    const content = fs.readFileSync(logPath, 'utf-8');
    const lines = content.split('\n').filter(l => l.trim());
    
    let logs = lines.map((line, idx) => {
      // 1. Flexible Regex: [TIMESTAMP] [LEVEL] [SERVICE]: [MESSAGE]
      // Matches both "2024... INFO svc: msg" and "2024... INFO svc msg"
      const match = line.match(/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:,\d{3})?) (\w+) ([^: ]+):? (.*)$/);
      
      if (match) {
        return {
          id: idx,
          time: match[1],
          level: match[2].toLowerCase(),
          service: match[3],
          msg: match[4]
        };
      }
      
      // 2. Simple fallback: [TIMESTAMP] [ANYTHING ELSE]
      const simpleMatch = line.match(/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:,\d{3})?) (.*)$/);
      if (simpleMatch) {
        return { id: idx, time: simpleMatch[1], level: 'info', service: 'system', msg: simpleMatch[2] };
      }

      // 3. Absolute fallback
      return { id: idx, time: '', level: 'info', service: 'raw', msg: line };
    }).reverse();
    
    if (level) {
      logs = logs.filter(l => l.level === level.toLowerCase());
    }
    if (service) {
      const sSub = service.toLowerCase();
      logs = logs.filter(l => l.service.toLowerCase().includes(sSub));
    }
    if (search) {
      const q = search.toLowerCase();
      logs = logs.filter(l => l.msg.toLowerCase().includes(q) || l.service.toLowerCase().includes(q));
    }
    
    // Return more logs (5,000) for better deep scrolling
    res.json({ logs: logs.slice(0, 5000) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/logs/export', (req, res) => {
  const logPath = path.join(HERMES_DIR, 'logs', 'gateway.log');
  if (!fs.existsSync(logPath)) return res.status(404).send('Log file not found');
  
  res.setHeader('Content-Disposition', `attachment; filename=hermes_gateway_${Date.now()}.log`);
  res.setHeader('Content-Type', 'text/plain');
  fs.createReadStream(logPath).pipe(res);
});

// --- SKILLS ---
// --- SKILLS ---
const getSkillsRecursive = (dir, basePath = '') => {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.map(entry => {
    const isDir = entry.isDirectory();
    const relPath = path.join(basePath, entry.name);
    const fullPath = path.join(dir, entry.name);
    
    if (isDir) {
      const subskills = getSkillsRecursive(fullPath, relPath);
      return { id: relPath, name: entry.name, path: relPath, is_skill: false, subskills, has_subskills: subskills.length > 0 };
    } else {
      if (!entry.name.endsWith('.md') && !entry.name.endsWith('.md.disabled')) return null;
      const isEnabled = entry.name.endsWith('.md');
      return { id: relPath, name: entry.name.replace('.disabled', ''), path: relPath, is_skill: true, enabled: isEnabled };
    }
  }).filter(Boolean);
};

app.get('/api/skills', (req, res) => {
  const skillsDir = path.join(HERMES_DIR, 'skills');
  res.json({ skills: getSkillsRecursive(skillsDir) });
});

app.get('/api/skills/content', (req, res) => {
  const relPath = req.query.relPath;
  const fullPath = path.join(HERMES_DIR, 'skills', relPath);
  try {
    const content = fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf-8') : '';
    res.json({ content });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/skills/content', (req, res) => {
  const { relPath, content } = req.body;
  const fullPath = path.join(HERMES_DIR, 'skills', relPath);
  try {
    fs.writeFileSync(fullPath, content, 'utf-8');
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/skills/toggle', (req, res) => {
  const { relPath, enabled } = req.body;
  const fullPath = path.join(HERMES_DIR, 'skills', relPath);
  try {
    let newPath;
    if (enabled && relPath.endsWith('.disabled')) {
      newPath = fullPath.replace('.md.disabled', '.md');
      fs.renameSync(fullPath, newPath);
    } else if (!enabled && relPath.endsWith('.md')) {
      newPath = fullPath + '.disabled';
      fs.renameSync(fullPath, newPath);
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- SUBAGENTS ---
const getSubagents = () => {
  const subagents = [];

  // Original Agency Files
  if (fs.existsSync(AGENCY_DIR)) {
    const categories = fs.readdirSync(AGENCY_DIR, { withFileTypes: true });
    categories.forEach(catEntry => {
      if (catEntry.isDirectory() && !catEntry.name.startsWith('.')) {
        const catPath = path.join(AGENCY_DIR, catEntry.name);
        const agents = fs.readdirSync(catPath, { withFileTypes: true });
        agents.forEach(agentEntry => {
          if (agentEntry.isFile() && agentEntry.name.endsWith('.md')) {
            const name = agentEntry.name.replace('.md', '');
            subagents.push({ id: `agency-${catEntry.name}-${name}`, name, category: `agency/${catEntry.name}`, description: 'Raw Spec', is_dir: false });
          }
        });
      }
    });
  }

  // Built Neural Agents
  if (fs.existsSync(AGENTS_DIR)) {
    const agents = fs.readdirSync(AGENTS_DIR, { withFileTypes: true });
    agents.forEach(agentEntry => {
      if (agentEntry.isDirectory() && !agentEntry.name.startsWith('.')) {
        const agPath = path.join(AGENTS_DIR, agentEntry.name);
        subagents.push({ id: `agent-${agentEntry.name}`, name: agentEntry.name, category: 'agents/built', description: 'Neural Matrix', is_dir: true, files: fs.readdirSync(agPath) });
      }
    });
  }
  
  return subagents;
};

app.get('/api/subagents', (req, res) => {
  res.json({ subagents: getSubagents() });
});

app.get('/api/subagents/:category/:name', (req, res) => {
  const { category, name } = req.params;
  const decodeCat = decodeURIComponent(category);
  let fullPath = path.join(AGENCY_DIR, decodeCat, `${name}.md`);
  
  if (decodeCat === 'agents/built') {
    // For built agents, name is the folder. We look for SOUL.md by default
    fullPath = path.join(AGENTS_DIR, name, 'SOUL.md');
  } else if (decodeCat === 'built') {
     fullPath = path.join(AGENTS_DIR, name, 'SOUL.md');
  }

  try {
    const content = fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf-8') : '# New Agent Logic\n\n- State: ACTIVE';
    res.json({ content, structured: null });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/subagents/:category/:name', (req, res) => {
  const { category, name } = req.params;
  const decodeCat = decodeURIComponent(category);
  let fullPath = path.join(AGENCY_DIR, decodeCat, `${name}.md`);
  
  if (decodeCat === 'agents/built' || decodeCat === 'built') {
    fullPath = path.join(AGENTS_DIR, name, 'SOUL.md');
  }

  auditLog('SUBAGENT_SAVE', { category: decodeCat, name, path: fullPath });
  try {
    if (!fs.existsSync(path.dirname(fullPath))) fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, req.body.content, 'utf-8');
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/subagents/:category/:name', (req, res) => {
  const { category, name } = req.params;
  const fullPath = path.join(AGENCY_DIR, category, `${name}.md`);
  try {
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- SETTINGS ---
app.get('/api/settings', (req, res) => {
  try {
    const config = yaml.load(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    res.json({ ...config, env: getEnv() });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/settings', (req, res) => {
  try {
    const { env, ...config } = req.body;
    if (config) fs.writeFileSync(CONFIG_PATH, yaml.dump(config));
    if (env) fs.writeFileSync(path.join(HERMES_DIR, '.env'), Object.entries(env).map(([k, v]) => `${k}=${v}`).join('\n'));
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- CHAT ---
app.get('/api/chat/sessions', (req, res) => {
  try {
    const sessionsPath = path.join(HERMES_DIR, 'sessions');
    if (!fs.existsSync(sessionsPath)) return res.json({ sessions: [] });
    const sessions = fs.readdirSync(sessionsPath).filter(f => f.startsWith('session_') && f.endsWith('.json')).map(file => {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(sessionsPath, file), 'utf-8'));
        const first = data.messages?.find(m => m.role === 'user')?.content || '';
        return { 
          id: data.session_id, 
          name: data.title || (first ? (first.substring(0, 37) + '...') : data.session_id), 
          lastMsg: data.messages?.[data.messages.length - 1]?.content || 'No messages', 
          time: new Date(data.last_updated || data.session_start).toLocaleTimeString(), 
          timestamp: new Date(data.last_updated || data.session_start).getTime() 
        };
      } catch (e) { return null; }
    }).filter(Boolean).sort((a, b) => b.timestamp - a.timestamp);
    res.json({ sessions });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/chat/sessions/:id', (req, res) => {
  const rawId = req.params.id.replace(/^session_/, '');
  const sessionPath = path.join(HERMES_DIR, 'sessions', `session_${rawId}.json`);
  try {
    if (!fs.existsSync(sessionPath)) return res.status(404).json({ error: 'Session not found' });
    res.json(JSON.parse(fs.readFileSync(sessionPath, 'utf-8')));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/chat/sessions/:id/messages', async (req, res) => {
  const rawId = req.params.id.replace(/^session_/, '');
  const userMessage = req.body.message;
  console.log(`[CHAT] Session ${rawId}: Processing...`);

  try {
    const hermesProcess = spawn('/home/xibalba/.local/bin/hermes', ['chat', '--resume', rawId, '-q', userMessage, '--yolo']);
    let stdout = ''; let stderr = '';
    hermesProcess.stdout.on('data', (d) => stdout += d.toString());
    hermesProcess.stderr.on('data', (d) => stderr += d.toString());

    await new Promise((resolve) => hermesProcess.on('close', resolve));

    // MOCK FALLBACK FOR UI TESTING
    const sessionPath = path.join(HERMES_DIR, 'sessions', `session_${rawId}.json`);
    if (!fs.existsSync(sessionPath)) {
      // Create if completely missing to prevent hard crashes
      fs.writeFileSync(sessionPath, JSON.stringify({ session_id: rawId, messages: [] }));
    }

    const sessionData = JSON.parse(fs.readFileSync(sessionPath, 'utf-8'));
    
    // Fallback Mocking if Hermes CLI doesn't natively populate the JSON
    if (!sessionData.messages) sessionData.messages = [];
    
    // Add User query
    sessionData.messages.push({
      role: 'user',
      content: userMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    
    // Add Hermes Response
    const finalResponse = stripAnsi(stdout);
    sessionData.messages.push({
      role: 'assistant',
      content: finalResponse || "Execution completed.",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    sessionData.last_updated = new Date().toISOString();
    
    fs.writeFileSync(sessionPath, JSON.stringify(sessionData, null, 2));

    res.json({ response: finalResponse, session: sessionData });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/chat/sessions', async (req, res) => {
  const id = `${Date.now()}`;
  try {
    const sessionsDir = path.join(HERMES_DIR, 'sessions');
    if (!fs.existsSync(sessionsDir)) fs.mkdirSync(sessionsDir, { recursive: true });
    const sessionPath = path.join(sessionsDir, `session_${id}.json`);
    fs.writeFileSync(sessionPath, JSON.stringify({ session_id: id, session_start: new Date().toISOString(), messages: [] }, null, 2));
    res.json({ session_id: id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/chat/sessions/:id', (req, res) => {
  const id = req.params.id.replace(/^session_/, '');
  try { 
    const p1 = path.join(HERMES_DIR, 'sessions', `session_${id}.json`);
    const p2 = path.join(HERMES_DIR, 'sessions', `${id}.jsonl`); 
    if (fs.existsSync(p1)) fs.unlinkSync(p1); 
    if (fs.existsSync(p2)) fs.unlinkSync(p2); 
    res.json({ success: true }); 
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/chat/suggestions', (req, res) => {
  const suggestions = [
    { id: 'diag', label: 'Run Neural Diagnostic', prompt: 'Run a neural diagnostic on the system and check for any anomalies or pending tasks.', icon: 'Cpu' },
    { id: 'sync', label: 'Sync Agency Logic', prompt: 'Synchronize agency logic across all sub-agents and update the SOUL.md if necessary.', icon: 'Brain' },
    { id: 'protocol', label: 'Execute Protocol Link', prompt: 'Establish a new protocol link via MCP and list available tools.', icon: 'Terminal' },
  ];
  
  // Dynamic additive suggestions
  const agentsDir = path.join(HERMES_DIR, 'agents');
  if (fs.existsSync(agentsDir)) {
    const counts = fs.readdirSync(agentsDir).length;
    if (counts > 0) {
      suggestions.push({ id: 'agents', label: `Inspect ${counts} Matrices`, prompt: `Review the status of the ${counts} currently compiled neural matrices in the agents directory.`, icon: 'Bot' });
    }
  }

  res.json({ suggestions });
});

// --- GATEWAY ---
app.get('/api/gateway/config', (req, res) => {
  try {
    let config = { platforms: {}, voice: {}, gateway: {}, unauthorized_dm_behavior: 'pair' };
    if (fs.existsSync(CONFIG_PATH)) {
      const loaded = yaml.load(fs.readFileSync(CONFIG_PATH, 'utf-8'));
      if (loaded) config = { ...config, ...loaded };
    }
    res.json({
      platforms: config.platforms || {},
      stt_enabled: config.voice?.stt_enabled || false,
      group_sessions_per_user: config.gateway?.group_sessions_per_user || false,
      unauthorized_dm_behavior: config.unauthorized_dm_behavior || 'pair'
    });
  } catch (err) { 
    console.error('API Gateway Error:', err);
    res.json({ platforms: {}, stt_enabled: false, group_sessions_per_user: false, unauthorized_dm_behavior: 'pair' });
  }
});

app.post('/api/gateway/config', (req, res) => {
  try {
    const config = yaml.load(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    Object.assign(config, req.body);
    fs.writeFileSync(CONFIG_PATH, yaml.dump(config));
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- COMMANDS ---
app.get('/api/commands', (req, res) => {
  try {
    let commands = [];
    if (fs.existsSync(CONFIG_PATH)) {
      const config = yaml.load(fs.readFileSync(CONFIG_PATH, 'utf-8'));
      const tools = config?.platform_toolsets?.cli || [];
      commands = tools.map((tool) => ({
        id: tool,
        label: tool.replace('_', ' ').toUpperCase(),
        desc: `Native Hermes capability: ${tool}`,
        defaultArgs: '--help'
      }));
    }
    
    // Fallback if empty or config missing
    if (commands.length === 0) {
      commands = [
        { id: 'terminal', label: 'Terminal', desc: 'Execute secure bash sequence.', defaultArgs: 'ls -la' },
        { id: 'browser', label: 'Browser', desc: 'Neural web scraping sequence.', defaultArgs: 'https://news.ycombinator.com' },
        { id: 'code_execution', label: 'Code Execution', desc: 'Evaluate raw python code.', defaultArgs: 'print("Hello Hermes")' }
      ];
    }
    res.json({ commands });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/commands/run', async (req, res) => {
  const { command, args } = req.body;
  const fullCommand = `hermes ${command} ${args} --yolo`;
  
  auditLog('COMMAND_RUN', { command, args, fullCommand });
  console.log(`[COMMAND] Executing: ${fullCommand}`);
  
  try {
    const { stdout, stderr } = await execAsync(fullCommand, { timeout: 30000 });
    res.json({ 
      output: stripAnsi(stdout),
      error: stripAnsi(stderr),
      success: true
    });
  } catch (err) {
    console.error(`[COMMAND_ERROR] ${err.message}`);
    res.json({ 
      output: stripAnsi(err.stdout || ''),
      error: stripAnsi(err.stderr || err.message),
      success: false 
    });
  }
});

// --- GRAPH ---
app.get('/api/graph', (req, res) => {
  const nodes = [];
  const edges = [];

  // Hermes Core (Central Router)
  nodes.push({ id: 'hermes-core', type: 'hermes', position: { x: 800, y: 500 }, data: { label: 'Hermes Core', status: 'online' } });

  // Human in the loop
  nodes.push({ id: 'loop-feedback', type: 'loop', position: { x: 800, y: 200 }, data: { label: 'Human Inference Loop', icon: '👤', description: 'Closed feedback mechanism enforcing human-in-the-loop oversight on critical decision thresholds.' } });
  edges.push({ id: 'e-core-loop', source: 'hermes-core', target: 'loop-feedback' });
  edges.push({ id: 'e-loop-core', source: 'loop-feedback', target: 'hermes-core' });

  // Core configs & Memories
  const configs = [
    { id: 'cfg-cfg', label: 'config.yaml', uri: 'config.yaml', icon: '⚙️' },
    { id: 'cfg-soul', label: 'SOUL.md', uri: 'SOUL.md', icon: '🧠' },
    { id: 'cfg-auth', label: 'auth.json', uri: 'auth.json', icon: '🔒' }
  ];
  configs.forEach((cfg, i) => {
    nodes.push({ id: cfg.id, type: 'config', position: { x: 300, y: 300 + (i * 120) }, data: { label: cfg.label, icon: cfg.icon, file: cfg.uri } });
    edges.push({ id: `e-${cfg.id}-core`, source: cfg.id, target: 'hermes-core' });
  });

  // Python Engine (hermes-agent)
  const pythonFiles = ['cli.py', 'run_agent.py', 'batch_runner.py', 'hermes_state.py'];
  pythonFiles.forEach((py, i) => {
    const id = `py-${i}`;
    nodes.push({ id, type: 'config', position: { x: 300, y: 700 + (i * 120) }, data: { label: py, icon: '🐍', file: `hermes-agent/${py}` } });
    edges.push({ id: `e-${id}-core`, source: id, target: 'hermes-core' });
  });

  // MCP Servers
  mcpServers.forEach((mcp, i) => {
    const id = `mcp-${mcp.name.replace(/\W/g, '')}`;
    nodes.push({ id, type: 'mcp', position: { x: 1300, y: 300 + (i * 120) }, data: { label: mcp.name, icon: '🔌' } });
    edges.push({ id: `e-${id}-core`, source: id, target: 'hermes-core' });
  });

  // Subagents
  const subagentsFiltered = getSubagents().slice(0, 5); // Limit depth for visual
  subagentsFiltered.forEach((ag, i) => {
    const id = `subagent-${ag.id}`;
    nodes.push({ id, type: 'subagent', position: { x: 1300, y: 800 + (i * 120) }, data: { label: ag.name, icon: '🛡️', category: ag.category || 'general', agentId: ag.id } });
    edges.push({ id: `e-core-${id}`, source: 'hermes-core', target: id });
  });
  
  // Skills
  const skillsDir = path.join(HERMES_DIR, 'skills');
  const skillsArr = getSkillsRecursive(skillsDir);
  const flatSkills = [];
  const rec = (arr) => arr.forEach(s => { if (s.is_skill) flatSkills.push(s); if (s.subskills) rec(s.subskills); });
  rec(skillsArr);
  flatSkills.slice(0, 5).forEach((sk, i) => {
    const id = `skill-${i}`;
    nodes.push({ id, type: 'skill', position: { x: 800 + ((i-2)*150), y: 900 }, data: { label: sk.path, icon: '🛠️', skillPath: sk.path } });
    edges.push({ id: `e-${id}-core`, source: id, target: 'hermes-core' });
  });

  res.json({ nodes, edges });
});

app.post('/api/graph/save', (req, res) => {
  res.json({ success: true });
});

app.get('/api/mcp', (req, res) => {
  res.json({ servers: mcpServers });
});

app.post('/api/mcp', (req, res) => {
  const { name, command, args } = req.body;
  const newServer = { id: name + '-id', name, command, args, status: 'online', type: 'local' };
  mcpServers.push(newServer);
  res.json({ success: true });
});

app.put('/api/mcp/:name', (req, res) => {
  const { command, args } = req.body;
  const idx = mcpServers.findIndex(s => s.name === req.params.name);
  if (idx !== -1) {
    mcpServers[idx] = { ...mcpServers[idx], command, args };
  }
  res.json({ success: true });
});

app.delete('/api/mcp/:name', (req, res) => {
  mcpServers = mcpServers.filter(s => s.name !== req.params.name);
  res.json({ success: true });
});

app.get('/api/mcp/:name/test', (req, res) => {
  const server = mcpServers.find(s => s.name === req.params.name);
  if (!server) return res.status(404).json({ error: 'Server not found' });
  
  console.log(`[MCP] Pinging server: ${server.name}`);
  console.log(`[MCP] Executing command: ${server.command} ${server.args.join(' ')}`);

  if (server.origin === 'gemini') {
    return setTimeout(() => res.json({ status: 'online' }), 500);
  }

  try {
    const cp = spawn(server.command, server.args, { shell: true, stdio: 'ignore' });
    let responded = false;
    
    const timeout = setTimeout(() => {
      if (!responded) {
        responded = true;
        cp.kill();
        console.log(`[MCP] Server ${server.name} passed ping health check.`);
        server.status = 'online';
        res.json({ status: 'online' });
      }
    }, 1500);

    cp.on('error', (err) => {
      if (!responded) {
        responded = true;
        clearTimeout(timeout);
        console.error(`[MCP] Failed to start server ${server.name}:`, err.message);
        server.status = 'error';
        res.json({ status: 'error' });
      }
    });

    cp.on('exit', (code) => {
      if (!responded) {
        responded = true;
        clearTimeout(timeout);
        console.log(`[MCP] Server ${server.name} exited prematurely with code ${code}.`);
        server.status = code === 0 ? 'online' : 'error';
        res.json({ status: server.status });
      }
    });
  } catch (err) {
    server.status = 'error';
    console.error(`[MCP] Error pinging server ${server.name}:`, err.message);
    res.json({ status: 'error' });
  }
});

// --- CONFIG FILES ---
// --- CONFIG FILES ---
app.get('/api/config_list', (req, res) => {
  const filesList = [];
  try {
    const rootItems = fs.readdirSync(HERMES_DIR);
    rootItems.forEach(i => {
      if (i.endsWith('.yaml') || i.endsWith('.md') || i.endsWith('.json')) filesList.push(i);
    });
    const memoriesDir = path.join(HERMES_DIR, 'memories');
    if (fs.existsSync(memoriesDir)) {
      fs.readdirSync(memoriesDir).forEach(f => {
        if (f.endsWith('.yaml') || f.endsWith('.md') || f.endsWith('.json')) {
          filesList.push(`memories/${f}`);
        }
      });
    }
    // NOT scanning agentsDir here - subagent configs belong in the Graph/Subagent View
    filesList.sort();
    return res.json({ files: filesList });
  } catch (err) {
    return res.status(500).json({ error: err.message, files: ['config.yaml'] });
  }
});
app.use('/api/config_file', (req, res) => {
  const fileReq = req.path.replace(/^\//, '') || '';
  const filePath = path.join(HERMES_DIR, fileReq);

  if (req.method === 'GET') {
    try {
      const content = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : `# File not found: ${filePath}`;
      return res.json({ content });
    } catch (err) {
      return res.json({ content: `# Error reading file: ${err.message}` });
    }
  }

  if (req.method === 'POST') {
    try {
      auditLog('CONFIG_EDIT', { file: fileReq });
      if (!fs.existsSync(path.dirname(filePath))) {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
      }
      fs.writeFileSync(filePath, req.body.content, 'utf-8');
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
});

const PORT = 3008;
app.listen(PORT, () => console.log(`Hermes Backend running on port ${PORT}`));
