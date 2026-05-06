# get_problems — Wiki

## What it does

`get_problems` fetches the current errors and warnings from the VS Code Problems
panel. Before reading diagnostics it opens any git-modified files as editor tabs
so language servers have a chance to publish problems for files that were not
already open. Hints and informational messages are always excluded.

## Tool identifier

```
mcp__vscode-mcp-hook__get_problems
```

## Parameters

| Parameter | Type     | Required | Purpose |
|-----------|----------|----------|---------|
| `file`    | `string` | optional | Substring filter on the file path. Only diagnostics whose path contains this string are returned. |
| `scope`   | `"git"`  | optional | When `"git"`, restricts results to files modified in the current git working tree (staged + unstaged). |

Both parameters are optional and can be combined.

## How to invoke

### From Claude Code (inside a VS Code terminal)

The tool is discovered automatically via the `VSCODE_MCP_URL` environment
variable injected by the extension. Just ask Claude to use it:

> "Check the Problems panel for any TypeScript errors in `src/`."
> "Show me all warnings in git-modified files."

Claude will call `mcp__vscode-mcp-hook__get_problems` with the appropriate
arguments.

### Direct MCP call (curl / raw HTTP)

```bash
# All problems
curl -s -X POST "$VSCODE_MCP_URL" \
  -H 'content-type: application/json' \
  -H 'accept: application/json, text/event-stream' \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "get_problems",
      "arguments": {}
    }
  }'

# Filter to a specific file (substring match)
curl -s -X POST "$VSCODE_MCP_URL" \
  -H 'content-type: application/json' \
  -H 'accept: application/json, text/event-stream' \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "get_problems",
      "arguments": { "file": "src/main.ts" }
    }
  }'

# Git-modified files only
curl -s -X POST "$VSCODE_MCP_URL" \
  -H 'content-type: application/json' \
  -H 'accept: application/json, text/event-stream' \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "get_problems",
      "arguments": { "scope": "git" }
    }
  }'

# Combine both filters
curl -s -X POST "$VSCODE_MCP_URL" \
  -H 'content-type: application/json' \
  -H 'accept: application/json, text/event-stream' \
  -d '{
    "jsonrpc": "2.0",
    "id": 4,
    "method": "tools/call",
    "params": {
      "name": "get_problems",
      "arguments": { "file": "src/", "scope": "git" }
    }
  }'
```

### From any MCP SDK client

```typescript
const result = await client.callTool("get_problems", {});
// or with filters:
const result = await client.callTool("get_problems", { scope: "git" });
const result = await client.callTool("get_problems", { file: "main.ts" });
```

## Response format

Plain text, one diagnostic per line:

```
[Error] /absolute/path/to/file.ts:12:5 — Cannot find name 'foo' (ts)
[Warning] /absolute/path/to/utils.ts:3:1 — 'x' is declared but never used (ts)
```

Returns `(no problems)` when nothing matches.  
Returns `(git integration not available)` when `scope: "git"` is used but VS
Code's git extension is absent or no repository is open.

## Tips

- `file` is a **substring match**, not a glob. Pass `"src/"` to match everything
  under that directory.
- Combine `file` + `scope` to see only errors in your changed files under a
  specific subdirectory.
- Line and character numbers are **1-based**.

## Technical reference

Full technical detail (schema, edge cases, implementation notes):
[docs/tools/get_problems.md](../docs/tools/get_problems.md)
