# Technical Specifications

## Platform constraints

- **VSCode engine:** `^1.116.0`
- **TypeScript:** `^5.3.3`, `module: Node16`, `target: ES2022`
- **MCP SDK:** `@modelcontextprotocol/sdk ^1.0.4`
- **Transport:** Streamable HTTP (`StreamableHTTPServerTransport`), loopback-only
- **Tests:** Jest with `ts-jest`, CommonJS transform, test files in `tests/`

## Architectural invariants

These are hard constraints enforced by the `mcp-tool` skill and definition of done.
Breaking any of these requires updating this document and `docs/harness.md`.

1. **One file per tool** — `src/tools/<camelCaseName>.ts`, exports only `TOOL_NAME` and `register`.
2. **One test file per tool** — `tests/tools/<camelCaseName>.test.ts`, uses `_helpers.ts`.
3. **One doc file per tool** — `docs/tools/<snake_case_name>.md`, linked from `README.md` and `docs/clients.md`.
4. **Registry is the only assembler** — `src/tools/registry.ts` is the only file that imports all tools.
5. **No VS Code imports in tests** — all VS Code access goes through `VscodeAdapter`.
6. **Zero-lint, zero-compile, zero-failing-tests** before any task is marked complete.

## Server identity

```json
{ "name": "vscode-mcp-hook", "version": "0.0.1" }
```

Bump `version` in `src/server/mcpServer.ts` and `package.json` together.

## Environment variable

`VSCODE_MCP_URL` is injected into every terminal opened in the window.
Format: `http://127.0.0.1:<port>/mcp`. The port is random per session (`envCol.persistent = false`).
