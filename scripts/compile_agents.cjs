const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const HERMES_DIR = path.join(require('os').homedir(), '.hermes');
const AGENCY_DIR = path.join(HERMES_DIR, 'agency');
const AGENTS_DIR = path.join(HERMES_DIR, 'agents');

console.log('🤖 Hermes Agent Compiler Initiated...');
console.log(`Scan Path: ${AGENCY_DIR}`);
console.log(`Dest Path: ${AGENTS_DIR}`);

if (!fs.existsSync(AGENTS_DIR)) fs.mkdirSync(AGENTS_DIR, { recursive: true });

function getMarkdownFiles() {
  const files = [];
  if (!fs.existsSync(AGENCY_DIR)) return files;
  
  const categories = fs.readdirSync(AGENCY_DIR, { withFileTypes: true });
  for (const cat of categories) {
    if (cat.isDirectory() && !cat.name.startsWith('.')) {
      const catPath = path.join(AGENCY_DIR, cat.name);
      const items = fs.readdirSync(catPath, { withFileTypes: true });
      for (const item of items) {
        if (item.isFile() && item.name.endsWith('.md')) {
          files.push({
            category: cat.name,
            name: item.name.replace('.md', ''),
            path: path.join(catPath, item.name)
          });
        }
      }
    }
  }
  return files;
}

const systemPrompt = `You are the Hermes Core Architect. You have been given the raw Markdown spec for a specific agent persona from our agency catalog.
Your task is to extract its context and responsibilities to generate the standard 3 core files required to initialize a Hermes Subagent framework.

You MUST wrap the content for each file inside XML blocks like so:
<soul>
(content for SOUL.md - defining personality, tone, rules)
</soul>

<memory>
(content for memory.md - defining functional capabilities, mission constraints, data instructions)
</memory>

<config>
(content for config.yaml - defining toolsets, thresholds, LLM params)
</config>

Generate ONLY the XML blocks. Zero introduction or explanation. Ensure config.yaml is functionally valid YAML.`;

const targets = getMarkdownFiles();
console.log(`Discovered ${targets.length} agency specs. Identifying models...`);

for (const target of targets) {
  const targetDir = path.join(AGENTS_DIR, target.name);
  if (fs.existsSync(targetDir)) {
    console.log(`[SKIP] Agent ${target.name} already compiled into neural matrix.`);
    continue;
  }

  console.log(`\n⚙️  Compiling Agent: ${target.name} [${target.category}]`);
  const rawContent = fs.readFileSync(target.path, 'utf-8');
  
  // Prompt chunking if too large
  const contentPreamble = `AGENT SPECIFICATION: \n\n${rawContent.slice(0, 15000)}`;
  
  console.log(`-> Sending payload to local Gemini MCP interface...`);
  
  const geminiCmd = spawnSync('gemini', ['ask', systemPrompt + '\n' + contentPreamble], { encoding: 'utf-8', env: process.env });
  
  if (geminiCmd.error || geminiCmd.status !== 0) {
    console.error(`❌ MCP Failure on ${target.name}. Error: ${geminiCmd.error ? geminiCmd.error.message : geminiCmd.stderr}`);
    continue;
  }
  
  const output = geminiCmd.stdout || '';
  
  const soulMatch = output.match(/<soul>([\s\S]*?)<\/soul>/i);
  const memoryMatch = output.match(/<memory>([\s\S]*?)<\/memory>/i);
  const configMatch = output.match(/<config>([\s\S]*?)<\/config>/i);
  
  if (soulMatch && memoryMatch && configMatch) {
    fs.mkdirSync(targetDir, { recursive: true });
    fs.writeFileSync(path.join(targetDir, 'SOUL.md'), soulMatch[1].trim());
    fs.writeFileSync(path.join(targetDir, 'memory.md'), memoryMatch[1].trim());
    fs.writeFileSync(path.join(targetDir, 'config.yaml'), configMatch[1].trim());
    console.log(`✅ Extracted 3 critical matrices. Bootstrapped ${target.name} successfully.`);
  } else {
    console.error(`⚠️  Parsing failure: LLM did not return proper XML nodes for ${target.name}.`);
  }
}

console.log('\nCompilation sequence complete.');
