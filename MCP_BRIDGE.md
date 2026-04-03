# 🟣 Gemini CLI MCP Bridge

This bridge enables **Hermes** to use the local `gemini` CLI as a free reasoning engine via the Model Context Protocol (MCP).

## 🚀 Overview

The bridge acts as a proxy between the Hermes Agent (Python) or UI (Node.js) and the `@google/gemini-cli` binary. It allows you to leverage your **OAuth-based Google Gemini** session (free tier or Code Assist) for complex agentic tasks without incurring API costs.

- **Type**: STDIO MCP Server
- **Bridge Script**: `~/.hermes/scripts/gemini_mcp_bridge.cjs`
- **Main Tool**: `ask_gemini`

## 🛠️ Configuration

The bridge is automatically registered in your `~/.hermes/config.yaml`:

```yaml
mcp_servers:
  gemini-cli:
    command: node
    args:
      - /home/xibalba/.hermes/scripts/gemini_mcp_bridge.cjs
```

## 🔋 Free Reasoning Mode

Hermes is configured to use this bridge as its primary inference provider:

```yaml
api_mode: gemini_cli_mcp
provider: gemini-cli
```

In this mode, whenever Hermes needs to think or respond, it calls the `ask_gemini` tool on the bridge, which in turn executes:
`gemini -p "<PROMPT>" --accept-raw-output-risk`

---
*Created by Antigravity for Xibalba Tech Solutions.*
