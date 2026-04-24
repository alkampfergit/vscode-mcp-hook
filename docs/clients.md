# Wiring up clients

## Claude Code VS Code extension

No configuration needed. The extension registers itself with VS Code via
`vscode.lm.registerMcpServerDefinitionProvider`, so VS Code discovers it
automatically on activation.

Tools appear as `mcp__vscode-mcp-hook__<tool>`:
- [`mcp__vscode-mcp-hook__get_active_file`](tools/get_active_file.md)
- [`mcp__vscode-mcp-hook__get_problems`](tools/get_problems.md)
- [`mcp__vscode-mcp-hook__list_workspace_folders`](tools/list_workspace_folders.md)
- [`mcp__vscode-mcp-hook__show_message`](tools/show_message.md)

## Claude Code CLI (terminal)

The terminal already has `VSCODE_MCP_URL` injected via `EnvironmentVariableCollection`,
but the CLI also needs a config file to know where to look.

Run the command once per workspace:

> **MCP Hook: Write MCP config files for CLI clients** (Command Palette)

This writes two files using `${env:VSCODE_MCP_URL}` as the URL, so they stay
valid across sessions even when the port changes:

`.vscode/mcp.json` (Claude Code VS Code extension fallback / other tools):
```json
{
  "servers": {
    "vscode-mcp-hook": { "type": "http", "url": "${env:VSCODE_MCP_URL}" }
  }
}
```

`.mcp.json` (Claude Code CLI):
```json
{
  "mcpServers": {
    "vscode-mcp-hook": { "type": "http", "url": "${VSCODE_MCP_URL}" }
  }
}
```

Both files should be added to `.gitignore`.

## Codex CLI

Codex's config lives in `~/.codex/config.toml`. Configure an HTTP MCP server
whose URL points at `${VSCODE_MCP_URL}` (exact syntax depends on your Codex
version; check `codex mcp --help`).

## Anything else

Any MCP client that speaks Streamable HTTP can point at `$VSCODE_MCP_URL`.
