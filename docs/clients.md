# Wiring up clients

No manual configuration is needed. When the extension activates it automatically
creates the right config file for each client (skips if the file already exists).

## Claude Code VS Code extension

Reads `.vscode/mcp.json`. The extension writes this file automatically:

```json
{
  "servers": {
    "vscode-mcp-hook": {
      "type": "http",
      "url": "${env:VSCODE_MCP_URL}"
    }
  }
}
```

`${env:VSCODE_MCP_URL}` is resolved from `process.env` inside the extension host,
which vscode-mcp-hook populates on activation.

Tools appear as `mcp__vscode-mcp-hook__<tool>` — for example:
- `mcp__vscode-mcp-hook__get_active_file`
- `mcp__vscode-mcp-hook__get_problems`
- `mcp__vscode-mcp-hook__list_workspace_folders`
- `mcp__vscode-mcp-hook__show_message`

## Claude Code CLI (terminal)

Reads `.mcp.json` at the workspace root. The extension writes this file automatically:

```json
{
  "mcpServers": {
    "vscode-mcp-hook": {
      "type": "http",
      "url": "${env:VSCODE_MCP_URL}"
    }
  }
}
```

`${env:VSCODE_MCP_URL}` is resolved from the terminal environment, which
vscode-mcp-hook injects via `EnvironmentVariableCollection` on activation.

## Codex CLI

Codex's config lives in `~/.codex/config.toml`. Configure an HTTP MCP server
whose URL points at `${VSCODE_MCP_URL}` (exact syntax depends on your Codex
version; check `codex mcp --help`).

## Anything else

Any MCP client that speaks Streamable HTTP and can expand env vars will work.
Point it at `$VSCODE_MCP_URL`.
