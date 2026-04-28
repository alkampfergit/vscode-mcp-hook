# vscode-mcp-hook

A VSCode extension that runs an **MCP server per window**, reachable only from
terminals spawned inside that same window. This lets Claude Code, Codex, or any
MCP client running in the integrated terminal get context (active file,
workspace, etc.) from the exact window they're running in.

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
loopback port. `EnvironmentVariableCollection` injects `VSCODE_MCP_URL` into
*that window's* terminals, scoping discovery correctly. No cross-window leakage.

## Tools

| Tool | Description | Docs |
|---|---|---|
| `get_problems` | Errors and warnings from the VS Code Problems panel, preloading git-modified files before reading diagnostics | [→](docs/tools/get_problems.md) |

## Build & run

```bash
npm install
npm run compile
```

Press **F5** in VSCode to launch an Extension Development Host. The extension
registers itself with VS Code automatically — no config files needed for the
Claude Code VS Code extension. For CLI clients, run **MCP Hook: Write MCP config
files for CLI clients** once from the Command Palette.

Verify the server is running:

```bash
echo $VSCODE_MCP_URL
# http://127.0.0.1:51834/mcp
curl -s -X POST "$VSCODE_MCP_URL" \
  -H 'content-type: application/json' \
  -H 'accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"curl","version":"0"}}}'
```

## Packaging a local `.vsix`

To produce a `.vsix` file you can install directly in any VS Code instance:

```bash
# Install dependencies (once)
npm install

# Lint + compile + package in one step — output goes to dist/
npm run package:local
```

The script (`scripts/build-package.ps1`) runs lint, compiles TypeScript, then
calls `vsce package` and writes the `.vsix` into the `dist/` folder.

Alternatively, run the steps individually:

```bash
npm run lint        # ESLint
npm run compile     # tsc
npx vsce package    # produces vscode-mcp-hook-<version>.vsix
```

Install the resulting file:

```bash
code --install-extension dist/vscode-mcp-hook-*.vsix
```

Or via the VS Code UI: **Extensions → ··· → Install from VSIX…**

## Adding or modifying tools

Use the `mcp-tool` skill — it enforces the harness pattern, generates all required
files, and runs the definition of done checks:

```
/mcp-tool add <snake_case_name>
/mcp-tool remove <snake_case_name>
/mcp-tool modify <snake_case_name>
```

## Further reading

- [Wiring up clients](docs/clients.md) — Claude Code, Codex CLI, and generic MCP clients
- [Extending](docs/extending.md) — adding new tools and the harness layer map
- [Harness engineering](docs/harness.md) — architectural decisions and rationale
- [Notes & gotchas](docs/notes.md) — env var timing, security, multi-root
