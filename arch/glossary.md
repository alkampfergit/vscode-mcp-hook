# Glossary

> Domain terms, acronyms, bounded contexts. One line each.

- **MCP** — Model Context Protocol; the JSON-RPC-based protocol AI clients use to discover and call tools.
- **Streamable HTTP** — MCP transport variant using standard HTTP POST with optional SSE streaming (vs. stdio).
- **Stateless session** — each HTTP request creates a fresh `McpServer` + transport; no session ID tracked across requests.
- **Harness** — the repeatable file-per-tool pattern (tool file, test, doc, wiki, registry entry) enforced by the `mcp-tool` skill.
- **VscodeAdapter** — the interface boundary between testable business logic and the real VS Code API.
- **VSCODE_MCP_URL** — env var injected into window terminals; format `http://127.0.0.1:<port>/mcp`.
- **DiagnosticItem** — plain data object representing one VS Code diagnostic, defined in `src/adapters/vscodeAdapter.ts`.
- **DoD** — Definition of Done: `npx tsc` + `npx jest` + `npx eslint src tests --ext .ts` must all pass.
- **Registry** — `src/tools/registry.ts`; the single file that imports all tools and wires them onto the MCP server.
