# Change guide

> "If you change X, also touch Y." One rule per bullet.

If you change…

- **A tool's schema or behavior** → update `docs/tools/<name>.md`, `wiki/<name>.md`, `docs/clients.md`, and the `README.md` tools table.
- **Add a tool** → create `src/tools/<camelCase>.ts`, `tests/tools/<camelCase>.test.ts`, `docs/tools/<snake_case>.md`, `wiki/<snake_case>.md`. Add import + call in `src/tools/registry.ts`. Add row to `README.md` tools table and `docs/clients.md`.
- **Remove a tool** → delete all files listed above, remove from `registry.ts`, `README.md`, and `docs/clients.md`.
- **The VscodeAdapter interface** → update `LiveVscodeAdapter` in `src/adapters/vscodeAdapter.ts`, all consumers in `src/core/mcpTools.ts`, and all test mocks in `tests/core/mcpTools.test.ts`.
- **HTTP server binding or security** → review `docs/notes.md` security notes, update `tests/server/httpServer.test.ts`.
- **Config file format** → update `src/core/configWriter.ts`, `tests/core/configWriter.test.ts`, and `docs/clients.md`.
- **package.json version** → also bump `version` in `src/server/mcpServer.ts` `buildMcpServer()`.
- **A folder name or top-level structure** → update `ARCHITECTURE.md` hub and any affected co-located `ARCHITECTURE.md` in the same commit.
