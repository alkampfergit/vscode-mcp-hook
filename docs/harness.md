# Harness Engineering — Architecture & Decisions

This document is the system of record for architectural decisions in the MCP tool layer.
Every non-obvious decision is recorded here so future agents and engineers can reason about
the codebase without needing context that lives outside the repository.

---

## Core principle: one file per tool

**Decision:** Each MCP tool lives in its own file under `src/tools/<camelCaseName>.ts`.

**Why:** A monolithic `mcpServer.ts` that registers all tools in one place becomes a
merge conflict magnet, is hard to test in isolation, and obscures the boundary between
tools. Isolating each tool means:

- A change to `get_problems` touches exactly one tool file, one test file, one doc file.
- Tests for each tool's registration logic are independent and don't share state.
- Adding a tool is additive only — no existing file needs modification except `registry.ts`
  and the doc/client indexes.

---

## Registry as the harness assembler

**Decision:** `src/tools/registry.ts` is the only file that imports all tools.
`src/server/mcpServer.ts` calls only `registerAllTools` and knows nothing about
individual tools.

**Why:** The registry is the single place where the set of active tools is declared.
This makes it trivial to audit "what tools exist?" by reading one file. It also means
`mcpServer.ts` is stable — it never changes when tools are added or removed.

Each tool exports `register(server, tools)` rather than a named function like
`registerGetActiveFile`. This gives consistent shape to every tool file (always import
as `register`, alias in registry) and makes the `mcp-tool` skill templates uniform.

---

## VscodeAdapter + McpTools as the two-layer abstraction

**Decision:** Business logic lives in `McpTools`. Raw VS Code API access lives in
`LiveVscodeAdapter`, behind the `VscodeAdapter` interface.

**Why:** VS Code APIs cannot be imported in Node.js test environments. The adapter
interface makes it possible to test all business logic with plain objects — no VS Code
process required, no Extension Development Host needed. `McpTools` methods are the
unit under test; tool handler files test only the registration contract (name, handler
wiring), not the business logic itself.

This is the same boundary enforcement described in the OpenAI harness engineering post:
_"parse data shapes at the boundary"_ — `LiveVscodeAdapter` is that boundary.

---

## Tool handler tests test the registration contract, not the logic

**Decision:** `tests/tools/*.test.ts` mock both `McpServer` and `McpTools`. They do
not test diagnostic formatting, path fallbacks, or other business logic — those belong
in `tests/core/mcpTools.test.ts`.

**Why:** Each layer should test what it owns. The tool files own exactly two things:
(1) the tool name constant, and (2) the handler wiring (which `McpTools` method is called,
with which arguments, and in which format the result is returned). Everything else is
tested elsewhere.

---

## `TOOL_NAME` exported as a const

**Decision:** Every tool file exports `export const TOOL_NAME = '...' as const`.

**Why:** This gives tests and the registry a typed, refactor-safe reference to the tool
name string. Renaming a tool is a one-file change (`TOOL_NAME` in the tool file) that
propagates automatically to all imports — no string hunting across test files.

---

## Documentation is mandatory, enforced by the skill

**Decision:** No tool may be added, modified, or removed without updating:
- `docs/tools/<snake_case_name>.md`
- `docs/clients.md`
- `README.md`

**Why:** From the harness engineering principle: _"what Codex can't see in-context
effectively doesn't exist."_ If tool documentation only exists in code comments or
developer memory, future agents will hallucinate behavior or miss edge cases. Docs are
a first-class artifact, not an afterthought.

The `mcp-tool` skill enforces this mechanically — it will not mark a task done until
all three files have been updated.

---

## Plans and tasks are checked into the repository

**Decision:** Execution plans and feature tasks live in `backlog/Features/`.

**Why:** Plans that live in chat history, issue trackers, or people's heads are invisible
to agents. Checking plans into the repository means any agent can read the full task
history, understand why decisions were made, and pick up work mid-stream without losing
context.

---

## Adding a new tool — the canonical flow

1. Read `docs/harness.md` (this file) to understand constraints.
2. If new VS Code API access is needed: add to `VscodeAdapter` → `LiveVscodeAdapter` → `McpTools`.
3. Create `src/tools/<camelCaseName>.ts` following the template in `.claude/skills/mcp-tool.md`.
4. Create `tests/tools/<camelCaseName>.test.ts`.
5. Create `docs/tools/<snake_case_name>.md`.
6. Add `register` import + call to `src/tools/registry.ts`.
7. Update `docs/clients.md` tool list.
8. Update `README.md` tool table.
9. Run DoD: `npx tsc && npx jest && npx eslint src tests --ext .ts`.
