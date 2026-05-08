# src/tools/ — Tool harness

> One file per MCP tool + a registry that assembles them all.

## Local invariants

1. **One file per tool** — `<camelCaseName>.ts`. Each exports exactly `TOOL_NAME` (const string) and `register(server, tools)`.
2. **Registry is the only assembler** — `registry.ts` imports every tool's `register` and calls it inside `registerAllTools`. No other file imports individual tools.
3. **Tool handlers delegate to McpTools** — the handler calls a method on `McpTools` and wraps the result in `{ content: [{ type: 'text', text }] }`. No business logic lives here.
4. **Matching test file** — `tests/tools/<camelCaseName>.test.ts` tests registration name + handler wiring, not business logic.
5. **Matching doc + wiki** — `docs/tools/<snake_case_name>.md` (technical reference) and `wiki/<snake_case_name>.md` (user-facing how-to).

## Modules

### registry.ts
- **Responsibility:** single assembler that imports all tool modules and registers them on the `McpServer`.
- **Tests:** `tests/tools/registry.test.ts`
- **Reference example:** `registry.ts` itself — add a new `register` import + call here when adding a tool.

### getProblems.ts (tool: `get_problems`)
- **Responsibility:** register the `get_problems` tool with its Zod schema and handler.
- **Tests:** `tests/tools/getProblems.test.ts`
- **Reference example:** copy this file's structure when adding a new tool.
- **Docs:** `docs/tools/get_problems.md`, `wiki/get_problems.md`

## Adding a tool

See `docs/extending.md` for the full checklist. The `/mcp-tool add <name>` skill automates it.
