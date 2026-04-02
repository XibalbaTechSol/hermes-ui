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
const CONFIG_PATH = path.join(HERMES_DIR, 'config.yaml');
const GRAPH_DATA_PATH = path.join(HERMES_DIR, 'ui_graph_data.json');

// --- HELPERS ---
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

const parseMarkdown = (content) => {
  const sections = [];
  const metadata = {};
  let currentContent = content;

  // Frontmatter
  if (content.startsWith('---')) {
    const end = content.indexOf('---', 3);
    if (end !== -1) {
      const yamlContent = content.substring(3, end);
      try {
        const parsed = yaml.load(yamlContent);
        Object.assign(metadata, parsed);
      } catch (e) {}
      currentContent = content.substring(end + 3);
    }
  }

  // Sections
  const lines = currentContent.split('\n');
  let currentSection = { title: 'General', level: 1, content: '' };
  
  lines.forEach(line => {
    const match = line.match(/^(#{1,3})\s+(.*)$/);
    if (match) {
      if (currentSection.content.trim() || currentSection.title !== 'General') {
        sections.push({ ...currentSection, content: currentSection.content.trim() });
      }
      currentSection = { title: match[2], level: match[1].length, content: '' };
    } else {
      currentSection.content += line + '\n';
    }
  });
  sections.push({ ...currentSection, content: currentSection.content.trim() });

  return { metadata, sections };
};

// --- TELEMETRY ---
app.get('/api/usage', (req, res) => {
  try {
    const sessionsPath = path.join(HERMES_DIR, 'sessions');
    if (!fs.existsSync(sessionsPath)) return res.json({ total_tokens: 0, total_cost: 0, sessions: [] });
    const files = fs.readdirSync(sessionsPath).filter(f => f.startsWith('session_') && f.endsWith('.json'));
    let totalTokens = 0; let totalCost = 0;
    const sessionUsage = [];

    files.forEach(file => {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(sessionsPath, file), 'utf-8'));
        let sessionTokens = 0;
        let sessionCost = 0;

        if (data.usage) { 
          sessionTokens = data.usage.total_tokens || 0; 
          sessionCost = data.usage.total_cost || 0; 
        } else if (data.messages) { 
          data.messages.forEach(m => { 
            if (m.usage) { 
              sessionTokens += m.usage.total_tokens || 0; 
              sessionCost += m.usage.total_cost || 0; 
            } 
          }); 
        }

        totalTokens += sessionTokens;
        totalCost += sessionCost;

        if (sessionTokens > 0) {
          sessionUsage.push({
            id: data.session_id,
            title: data.title || `Session ${data.session_id.substring(0, 8)}`,
            tokens: sessionTokens,
            cost: sessionCost.toFixed(4),
            time: new Date(data.last_updated || data.session_start).toLocaleTimeString()
          });
        }
      } catch (e) {}
    });

    // Sort by most active/recent
    sessionUsage.sort((a, b) => b.tokens - a.tokens);

    res.json({ 
      total_tokens: totalTokens, 
      total_cost: totalCost.toFixed(4), 
      currency: 'USD',
      sessions: sessionUsage.slice(0, 5) 
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/system', (req, res) => {
  res.json({ memory: { total: (os.totalmem() / 1e9).toFixed(1), used: ((os.totalmem() - os.freemem()) / 1e9).toFixed(1) }, cpu: (os.loadavg()[0] * 100 / os.cpus().length).toFixed(1), uptime: os.uptime() });
});

// --- LOGS ---
app.get('/api/logs', (req, res) => {
  const logPath = path.join(HERMES_DIR, 'logs', 'gateway.log');
  if (!fs.existsSync(logPath)) return res.json({ logs: [] });
  try {
    const content = fs.readFileSync(logPath, 'utf-8');
    const logs = content.split('\n').filter(l => l.trim()).map((line, idx) => {
      const match = line.match(/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2},\d{3}) (\w+) ([^:]+): (.*)$/);
      return match ? { id: idx, time: match[1], level: match[2].toLowerCase(), service: match[3], msg: match[4] } : { id: idx, time: '', level: 'info', service: 'system', msg: line };
    }).reverse().slice(0, 100);
    res.json({ logs });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- SKILLS ---
app.get('/api/skills', (req, res) => {
  const skillsPath = path.join(HERMES_DIR, 'skills');
  const getSkills = (dir, prefix = '') => {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    fs.readdirSync(dir, { withFileTypes: true }).forEach(file => {
      if (file.name.startsWith('.')) return;
      const fullPath = path.join(dir, file.name); const relPath = path.join(prefix, file.name);
      if (file.isDirectory()) {
        const isSkill = fs.existsSync(path.join(fullPath, 'SKILL.md'));
        const subSkills = getSkills(fullPath, relPath);
        if (isSkill) results.push({ id: relPath.replace(/\//g, '-'), name: file.name, path: relPath, is_skill: true, has_subskills: subSkills.length > 0, subskills: subSkills.length > 0 ? subSkills : undefined });
        else if (subSkills.length > 0) results.push({ id: relPath.replace(/\//g, '-'), name: file.name, path: relPath, is_skill: false, subskills: subSkills });
      }
    });
    return results;
  };
  try { res.json({ skills: getSkills(skillsPath) }); } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/skills/content', (req, res) => {
  try {
    const fullPath = path.join(HERMES_DIR, 'skills', req.query.relPath, 'SKILL.md');
    res.json({ content: fs.readFileSync(fullPath, 'utf-8') });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/skills/content', (req, res) => {
  try {
    fs.writeFileSync(path.join(HERMES_DIR, 'skills', req.body.relPath, 'SKILL.md'), req.body.content);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- SUBAGENTS ---
app.get('/api/subagents', (req, res) => {
  try {
    const getAgents = (dir, cat = 'General') => {
      let r = [];
      if (!fs.existsSync(dir)) return r;
      fs.readdirSync(dir, { withFileTypes: true }).forEach(f => {
        if (f.name.startsWith('.')) return;
        if (f.isDirectory()) r = [...r, ...getAgents(path.join(dir, f.name), f.name.toUpperCase())];
        else if (f.name.endsWith('.md')) r.push({ id: f.name.replace('.md', ''), name: f.name.replace('.md', ''), category: cat });
      });
      return r;
    };
    res.json({ subagents: getAgents(AGENCY_DIR) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/subagents/:category/:name', (req, res) => {
  try {
    const filePath = path.join(AGENCY_DIR, req.params.category.toLowerCase(), `${req.params.name}.md`);
    if (!fs.existsSync(filePath)) return res.status(404).send('Agent not found');
    const content = fs.readFileSync(filePath, 'utf-8');
    res.json({ content, structured: parseMarkdown(content) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/subagents/:category/:name', (req, res) => {
  try {
    const filePath = path.join(AGENCY_DIR, req.params.category.toLowerCase(), `${req.params.name}.md`);
    fs.writeFileSync(filePath, req.body.content, 'utf-8');
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

app.get('/api/config/:file', (req, res) => {
  const map = { 'soul': path.join(HERMES_DIR, 'SOUL.md'), 'memory': path.join(HERMES_DIR, 'memories', 'MEMORY.md'), 'user': path.join(HERMES_DIR, 'memories', 'USER.md'), 'yaml': CONFIG_PATH };
  try { res.json({ content: fs.readFileSync(map[req.params.file], 'utf-8') }); } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- CHAT ---
app.get('/api/chat/sessions', (req, res) => {
  try {
    const sessionsPath = path.join(HERMES_DIR, 'sessions');
    const sessions = fs.readdirSync(sessionsPath).filter(f => f.startsWith('session_') && f.endsWith('.json')).map(file => {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(sessionsPath, file), 'utf-8'));
        const first = data.messages?.find(m => m.role === 'user')?.content || '';
        return { id: data.session_id, name: data.title || (first ? (first.substring(0, 37) + '...') : data.session_id), lastMsg: data.messages?.[data.messages.length - 1]?.content || 'No messages', time: new Date(data.last_updated || data.session_start).toLocaleTimeString(), timestamp: new Date(data.last_updated || data.session_start).getTime() };
      } catch (e) { return null; }
    }).filter(Boolean).sort((a, b) => b.timestamp - a.timestamp);
    res.json({ sessions });
  } catch (err) { 
    console.error('GET /api/chat/sessions error:', err);
    res.status(500).json({ error: err.message }); 
  }
});

app.get('/api/chat/sessions/:id', (req, res) => {
  try { 
    res.json(JSON.parse(fs.readFileSync(path.join(HERMES_DIR, 'sessions', `session_${req.params.id}.json`), 'utf-8'))); 
  } catch (err) { 
    console.error(`GET /api/chat/sessions/${req.params.id} error:`, err);
    res.status(500).json({ error: err.message }); 
  }
});

const stripAnsi = (str) => {
  const pattern = [
    '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*|[a-zA-Z\\d\\/#&.:=?%@~_]*)[\\u0007\\u001B\\u009C])',
    '(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))'
  ].join('|');
  return str.replace(new RegExp(pattern, 'g'), '');
};

app.post('/api/chat/sessions/:id/messages', async (req, res) => {
  const fullSessionId = req.params.id;
  const userMessage = req.body.message;
  
  // Strip 'session_' prefix for CLI if present
  const cliSessionId = fullSessionId.startsWith('session_') ? fullSessionId.replace('session_', '') : fullSessionId;
  
  console.log(`[CHAT] Session ${fullSessionId} (CLI ID: ${cliSessionId}): Processing...`);

  try {
    const hermesProcess = spawn('/home/xibalba/.local/bin/hermes', [
      'chat',
      '--resume', cliSessionId,
      '-q', userMessage,
      '--yolo'
    ]);

    let stdout = '';
    let stderr = '';

    hermesProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    hermesProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    const exitCode = await new Promise((resolve) => {
      hermesProcess.on('close', resolve);
    });

    if (exitCode !== 0) {
      console.error(`[CHAT] Hermes CLI failed (code ${exitCode}): ${stderr}`);
      return res.status(500).json({ error: `Hermes CLI failed: ${stripAnsi(stderr) || 'Unknown error'}` });
    }

    // Read the updated session file - try both prefixed and non-prefixed
    const sessionsDir = path.join(HERMES_DIR, 'sessions');
    let sessionPath = path.join(sessionsDir, `session_${fullSessionId}.json`);
    
    if (!fs.existsSync(sessionPath)) {
      // If fullSessionId already includes 'session_', this avoids 'session_session_'
      sessionPath = path.join(sessionsDir, fullSessionId.startsWith('session_') ? `${fullSessionId}.json` : `session_${fullSessionId}.json`);
    }
    
    if (!fs.existsSync(sessionPath)) {
      sessionPath = path.join(sessionsDir, `${fullSessionId}.json`);
    }

    console.log(`[CHAT] Reading session from: ${sessionPath}`);
    
    if (!fs.existsSync(sessionPath)) {
      return res.status(404).json({ error: `Session file not found: ${sessionPath}` });
    }

    const sessionData = JSON.parse(fs.readFileSync(sessionPath, 'utf-8'));
    res.json({ response: stripAnsi(stdout), session: sessionData });
    
    console.log(`[CHAT] Session ${sessionId}: Completed. Messages: ${sessionData.messages?.length || 0}`);
  } catch (err) { 
    console.error(`[CHAT] Error processing message for session ${sessionId}:`, err);
    res.status(500).json({ error: err.message }); 
  }
});

app.post('/api/chat/sessions', async (req, res) => {
  const rawId = `${Date.now()}`;
  console.log(`[CHAT] Creating new session: ${rawId}`);
  try {
    const sessionsDir = path.join(HERMES_DIR, 'sessions');
    const sessionPath = path.join(sessionsDir, `session_${rawId}.json`);
    
    if (!fs.existsSync(sessionsDir)) {
      fs.mkdirSync(sessionsDir, { recursive: true });
    }

    const emptySession = {
      session_id: rawId,
      session_start: new Date().toISOString(),
      messages: []
    };

    fs.writeFileSync(sessionPath, JSON.stringify(emptySession, null, 2));
    
    const sessionId = `session_${rawId}`;
    console.log(`[CHAT] Created session file: ${sessionPath}`);
    res.json({ session_id: sessionId });
  } catch (err) { 
    console.error('[CHAT] Error in POST /api/chat/sessions:', err);
    res.status(500).json({ error: err.message }); 
  }
});

app.delete('/api/chat/sessions/:id', (req, res) => {
  try { const p1 = path.join(HERMES_DIR, 'sessions', `session_${req.params.id}.json`), p2 = path.join(HERMES_DIR, 'sessions', `${req.params.id}.jsonl`); if (fs.existsSync(p1)) fs.unlinkSync(p1); if (fs.existsSync(p2)) fs.unlinkSync(p2); res.json({ success: true }); } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- MCP ---
app.get('/api/mcp', (req, res) => {
  try {
    const config = yaml.load(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    const formatted = Object.keys(config.mcp_servers || {}).map(name => ({ id: name, name, command: config.mcp_servers[name].command, args: config.mcp_servers[name].args, status: 'online', type: config.mcp_servers[name].command === 'npx' ? 'remote' : 'local' }));
    res.json({ servers: formatted });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/mcp/:name/test', async (req, res) => {
  try {
    const config = yaml.load(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    const server = config.mcp_servers?.[req.params.name];
    if (!server) return res.status(404).send('Not found');
    try { await execAsync(`${server.command} ${server.args.join(' ')} --help`, { timeout: 5000 }); res.json({ status: 'online' }); } catch (e) { res.json({ status: 'offline', details: e.message }); }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- COMMANDS ---
app.post('/api/commands/run', async (req, res) => {
  try { const { stdout, stderr } = await execAsync(`/home/xibalba/.local/bin/hermes ${req.body.command} ${req.body.args || ''} --yolo`); res.json({ output: stdout, error: stderr }); } catch (err) { res.status(500).json({ error: err.message, stderr: err.stderr }); }
});

// --- GRAPH ---
app.get('/api/graph', (req, res) => {
  try {
    const stored = fs.existsSync(GRAPH_DATA_PATH) ? JSON.parse(fs.readFileSync(GRAPH_DATA_PATH, 'utf-8')) : { nodes: [], edges: [] };
    const config = yaml.load(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    const nodes = []; const edges = [];
    const getPos = (id, def) => stored.nodes.find(n => n.id === id)?.position || def;

    nodes.push({ id: 'hermes-core', type: 'hermes', position: getPos('hermes-core', { x: 400, y: 300 }), data: { label: 'Hermes Core', status: 'online' } });
    nodes.push({ id: 'loop-memory', type: 'loop', position: getPos('loop-memory', { x: 650, y: 150 }), data: { label: 'Memory Manager', icon: '🧠', description: 'Fact extraction and persistence.' } });
    nodes.push({ id: 'loop-learning', type: 'loop', position: getPos('loop-learning', { x: 150, y: 150 }), data: { label: 'Learning Loop', icon: '🌀', description: 'Trait and logic refinement.' } });
    nodes.push({ id: 'loop-sync', type: 'loop', position: getPos('loop-sync', { x: 150, y: 450 }), data: { label: 'Skill Sync', icon: '♻️' } });

    edges.push({ id: 'e-core-mem', source: 'hermes-core', target: 'loop-memory', animated: true, label: 'COGNITION' });
    edges.push({ id: 'e-core-learn', source: 'hermes-core', target: 'loop-learning', animated: true, label: 'FEEDBACK' });
    edges.push({ id: 'e-core-sync', source: 'hermes-core', target: 'loop-sync', animated: true, label: 'SKILLS' });

    const skillsPath = path.join(HERMES_DIR, 'skills');
    if (fs.existsSync(skillsPath)) {
      fs.readdirSync(skillsPath).filter(f => fs.statSync(path.join(skillsPath, f)).isDirectory() && !f.startsWith('.')).forEach((s, i) => {
        const id = `skill-${s}`;
        nodes.push({ id, type: 'skill', position: getPos(id, { x: 50, y: 200 + i * 80 }), data: { label: `SKILL: ${s.toUpperCase()}` } });
        edges.push({ id: `e-sync-${id}`, source: 'loop-sync', target: id });
      });
    }

    if (fs.existsSync(AGENCY_DIR)) {
      const getAgents = (dir, cat = 'General') => {
        let r = [];
        fs.readdirSync(dir, { withFileTypes: true }).forEach(f => {
          if (f.name.startsWith('.')) return;
          if (f.isDirectory()) r = [...r, ...getAgents(path.join(dir, f.name), f.name.toUpperCase())];
          else if (f.name.endsWith('.md')) r.push({ id: f.name.replace('.md', ''), name: f.name.replace('.md', ''), category: cat });
        });
        return r;
      };
      getAgents(AGENCY_DIR).forEach((a, i) => {
        const id = `agent-${a.id}`;
        nodes.push({ id, type: 'subagent', position: getPos(id, { x: 750, y: 200 + i * 80 }), data: { label: a.name.toUpperCase(), category: a.category } });
        edges.push({ id: `e-core-${id}`, source: 'hermes-core', target: id });
      });
    }

    Object.keys(config.mcp_servers || {}).forEach((m, i) => {
      const id = `mcp-${m}`;
      nodes.push({ id, type: 'mcp', position: getPos(id, { x: 400, y: 600 + i * 80 }), data: { label: `MCP: ${m.toUpperCase()}` } });
      edges.push({ id: `e-core-${id}`, source: 'hermes-core', target: id });
    });

    res.json({ nodes, edges });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/graph', (req, res) => {
  try { fs.writeFileSync(GRAPH_DATA_PATH, JSON.stringify(req.body, null, 2)); res.json({ success: true }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

const PORT = 3008;
app.listen(PORT, () => console.log(`Hermes Backend running on port ${PORT}`));
