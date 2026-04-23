# vscode-mcp-host

A VSCode extension that runs an **MCP server per window**, reachable only from
terminals spawned inside that same window. This lets Claude Code, Codex, or any
MCP client running in the integrated terminal get context (active file,
workspace, etc.) from the exact window they're running in — not some other
window you happen to have open.

## Architecture

```
┌── VSCode window A ───────────────────────┐   ┌── VSCode window B ────┐
│  extension host                          │   │  extension host       │
│    └─ MCP server @ 127.0.0.1:51834       │   │    └─ MCP server @    │
│                                          │   │       127.0.0.1:62117 │
│  integrated terminal                     │   │                       │
│    env: VSCODE_MCP_URL=…:51834/mcp       │   │  integrated terminal  │
│    └─ claude / codex ──▶ connects to 51834│   │    env: …:62117/mcp   │
└──────────────────────────────────────────┘   └───────────────────────┘
```

Each window's extension host starts its own HTTP MCP server on a random
loopback port. VSCode's `EnvironmentVariableCollection` injects `VSCODE_MCP_URL`
into *that window's* terminals — this is the mechanism that scopes discovery
correctly. No cross-window leakage.

## Build & run

```bash
npm install
npm run compile
```

Open the folder in VSCode and press **F5** to launch an Extension Development
Host. In that dev host, open a terminal and check:

```bash
echo $VSCODE_MCP_URL
# http://127.0.0.1:51834/mcp
curl -s -X POST "$VSCODE_MCP_URL" \
  -H 'content-type: application/json' \
  -H 'accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"curl","version":"0"}}}'
```

## Wiring up clients

### Claude Code

The extension auto-creates `.vscode/mcp.json` in the workspace (skips if
present). Claude Code reads workspace MCP config and will connect using the
env-var-expanded URL:

```json
{
  "servers": {
    "vscode-window": {
      "type": "http",
      "url": "${env:VSCODE_MCP_URL}"
    }
  }
}
```

If Claude Code's version expects `.mcp.json` at the workspace root instead,
drop a symlink or adjust the write path in `extension.ts`.

### Codex CLI

Codex's config lives in `~/.codex/config.toml`. For per-window URLs the
cleanest path is to have Codex read the env var directly — configure it with
an HTTP MCP server whose URL points at `${VSCODE_MCP_URL}` (exact syntax
depends on your Codex version; check `codex mcp --help`).

### Anything else

Any MCP client that speaks Streamable HTTP and can expand env vars will work.
Point it at `$VSCODE_MCP_URL`.

## Extending

Tools live in `buildMcpServer()` in `src/extension.ts`. The three included
tools are illustrative — the interesting ones for an IDE host are things like:

- `open_file(path, line?)` → `vscode.window.showTextDocument`
- `get_selection()` → read current selection text + range
- `get_diagnostics(uri?)` → `vscode.languages.getDiagnostics`
- `run_task(name)` → trigger a VSCode task
- `search_workspace(query)` → `vscode.workspace.findFiles` + read

All of these work *per window* because `vscode.window.*` and
`vscode.workspace.*` are already scoped to the extension host making the call.

## Notes & gotchas

- **Env var timing**: `EnvironmentVariableCollection` only affects terminals
  *created after* the extension activates. Terminals restored from a previous
  session before activation completes won't have `VSCODE_MCP_URL`. Close and
  reopen the terminal if this happens. `onStartupFinished` activation minimizes
  the window for this race.
- **Persistence**: `envCol.persistent = false` is deliberate. The port changes
  every session; we don't want VSCode restoring yesterday's dead URL.
- **Security**: server binds to `127.0.0.1` only, and the request handler
  double-checks `remoteAddress`. Don't change the bind address. If you need
  auth on top, add a random token to the URL path and check it in the handler.
- **Multiple workspace folders**: `writeWorkspaceMcpConfig` only writes to the
  first folder. Extend if you need multi-root.
