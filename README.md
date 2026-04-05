# Hermes UI

![Hermes UI Logo](https://raw.githubusercontent.com/XibalbaTechSol/hermes-ui/main/src/assets/logo.png)

**Hermes UI** is a premium, integrated sovereign agent interface designed for the modern AI engineer. It provides a centralized command center for managing neural loops, specialized sub-agents, and Model Context Protocol (MCP) servers with a focus on high-fidelity aesthetics and functional depth.

## 🚀 Core Features

- **Neural Chat Interface**: A polished, OpenAI-inspired chat experience with full Markdown support, syntax highlighting, and persistent session management.
- **Visual Automation Graph**: Design complex automation logic and neural loops using an interactive flow editor powered by `@xyflow/react`. Supports node editing, deletion, and **Trigger (Cron Job) management** with backend persistence.
- **MCP Protocol Registry**: A dedicated interface to register, monitor, and configure Model Context Protocol servers.
- **Telemetry Dashboard**: Real-time monitoring of system vitals (CPU, Memory, Uptime) and neural token usage/cost metrics.
- **Sub-agent Orchestration**: Manage a fleet of specialized sub-agents (Backend, Frontend, Designer, etc.) with custom personalities and offloading policies.
- **Neural Skills Hub**: A recursive UI for managing and deploying neural skills across your agent network.
- **Messaging Gateway**: Seamless integration with Telegram, Slack, and Discord via a unified bridge.
- **Free Reasoning Bridge**: Dedicated Node.js MCP server that act as a proxy between Hermes and the local `gemini` CLI for zero-cost agentic tasks.
- **Global Configuration**: Advanced settings for model selection (Gemini, OpenAI, etc.), Voice (STT/TTS), and multi-layer security (Secret redaction, PII shield).

## 🟣 Free Reasoning Mode

Hermes UI is optimized for cost-efficient development. It leverages a custom **Gemini CLI MCP Bridge** that routes inference through your existing `gemini` CLI (OAuth-based), bypassing traditional API costs.

- **Bridge Script**: `~/.hermes/scripts/gemini_mcp_bridge.cjs`
- **Configuration**: Integrated into `~/.hermes/config.yaml`
- **Documentation**: See [MCP_BRIDGE.md](./MCP_BRIDGE.md) for details.

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, TypeScript
- **Styling**: Tailwind CSS (Neural Dark Aesthetic)
- **State & Flow**: `@xyflow/react` (React Flow)
- **Icons**: Lucide React
- **Markdown**: React-Markdown, Prism Syntax Highlighter
- **API**: Integration with Hermes Backend (Express/Node.js)

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/XibalbaTechSol/hermes-ui.git

# Navigate to the project directory
cd hermes-ui

# Install dependencies
npm install

# Start the development server
npm run dev
```

## 🌐 Architecture

Hermes UI acts as the visual layer for the Hermes ecosystem. It communicates with a local/remote backend (defaulting to `localhost:3008`) to execute commands, manage sessions, and monitor system performance.

- **Frontend Port**: 3006 (Vite default)
- **API Port**: 3008 (Hermes Backend)

## 🧪 Automated QA Pipeline

Hermes UI features an end-to-end Automated QA and Visual Audit pipeline that ensures UI regressions and aesthetic drift are caught before deployment.

- **Playwright Test Suite**: Automates interaction with every major view in the application, capturing high-fidelity screenshots (`tests/visual_audit.spec.ts`).
- **Neural Visual Audit**: Leverages a local Gemini CLI instance (authenticated via OAuth to avoid API costs) to act as a world-class UI/UX designer, analyzing screenshots against "perfection" baselines and generating a markdown quality report (`QA_Visual_Report.md`).
- **Master Orchestration**: The `test_master.sh` script spins up both frontend and backend servers, executes the Playwright interaction suite, runs the visual audit, and automatically shuts everything down.

**Running the QA Pipeline:**
```bash
./test_master.sh
```
*Note: Ensure your local `gemini` CLI is set up and authenticated before running the visual audit.*

## 🛡️ Security

Built with privacy in mind, Hermes UI includes:
- **Tirith Guard**: Policy-based execution monitoring.
- **Secret Redaction**: Automatic masking of sensitive keys in logs and UI.
- **Local-First**: Prioritizes local tool execution and private infrastructure.

---

Developed with ❤️ by **Xibalba Tech Solutions**.
