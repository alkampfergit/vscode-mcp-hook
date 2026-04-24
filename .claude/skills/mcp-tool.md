---
name: mcp-tool
description: Add, modify, or remove MCP tools in the vscode-mcp-hook extension following the harness engineering pattern. Use when the user asks to add a new MCP tool, remove an existing one, or modify a tool's schema, handler, or documentation.
---

# mcp-tool

Add, modify, or remove MCP tools in the vscode-mcp-hook extension following the harness engineering pattern.

## Usage

```
/mcp-tool add <snake_case_name>
/mcp-tool remove <snake_case_name>
/mcp-tool modify <snake_case_name>
```

**Before starting any action:** read `docs/harness.md` to understand the architectural constraints.

---

## Harness contract

Every MCP tool MUST have exactly these artifacts. No exceptions:

| Artifact | Path |
|---|---|
| Implementation | `src/tools/<camelCaseName>.ts` |
| Tests | `tests/tools/<camelCaseName>.test.ts` |
| Documentation | `docs/tools/<snake_case_name>.md` |

These shared files MUST always be kept in sync:

| File | What changes |
|---|---|
| `src/tools/registry.ts` | Import and call the tool's `register` function |
| `docs/clients.md` | Add or remove the tool from the tool list |
| `README.md` | Add or remove the tool from the tools table |

## Definition of done

A task is NOT complete until ALL three pass with zero errors:

```powershell
npx tsc
npx jest
npx eslint src tests --ext .ts
```

---

## ADD — step-by-step

### Step 1: Decide if you need new VS Code API access

If the tool needs data not yet available in `McpTools`, add it in this order:

1. Add the method signature to the `VscodeAdapter` interface in `src/adapters/vscodeAdapter.ts`
2. Implement it in `LiveVscodeAdapter` in the same file
3. Add the business logic method to `McpTools` in `src/core/mcpTools.ts`
4. Add tests for the new `McpTools` method in `tests/core/mcpTools.test.ts`

### Step 2: Create the tool file

`src/tools/<camelCaseName>.ts`

**Template — no inputs:**
```typescript
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpTools } from '../core/mcpTools.js';

export const TOOL_NAME = '<snake_case_name>' as const;

export function register(server: McpServer, tools: McpTools): void {
    server.registerTool(
        TOOL_NAME,
        {
            title: '<Human Readable Title>',
            description: '<What this tool does in plain language. One sentence.>',
            inputSchema: {},
        },
        async () => ({ content: [{ type: 'text' as const, text: tools.<methodName>() }] }),
    );
}
```

**Template — with inputs (add Zod imports and schema):**
```typescript
import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpTools } from '../core/mcpTools.js';

export const TOOL_NAME = '<snake_case_name>' as const;

export function register(server: McpServer, tools: McpTools): void {
    server.registerTool(
        TOOL_NAME,
        {
            title: '<Human Readable Title>',
            description: '<What this tool does in plain language.>',
            inputSchema: { param: z.string() },
        },
        async ({ param }) => ({ content: [{ type: 'text' as const, text: tools.<methodName>(param) }] }),
    );
}
```

### Step 3: Create the test file

`tests/tools/<camelCaseName>.test.ts`

Import helpers from `./_helpers.ts`. Every test file MUST cover:
- ✅ Correct tool name (`TOOL_NAME` constant matches registration)
- ✅ Handler calls the right `McpTools` method with the right arguments
- ✅ Handler returns expected text content
- ✅ Handler result has `type: 'text'`
- ✅ Edge cases (empty results, missing optional args, etc.)

**Template:**
```typescript
import { TOOL_NAME, register } from '../../src/tools/<camelCaseName>.js';
import { makeMockServer, makeMockTools } from './_helpers.js';

describe('<camelCaseName> tool', () => {
    it('registers a tool named <snake_case_name>', () => {
        const { server, calls } = makeMockServer();
        register(server, makeMockTools());
        expect(calls).toHaveLength(1);
        expect(calls[0].name).toBe(TOOL_NAME);
    });

    it('handler delegates to McpTools.<methodName>', async () => {
        const { server, calls } = makeMockServer();
        const <methodName> = jest.fn(() => '<mock output>');
        register(server, makeMockTools({ <methodName> }));
        const result = await calls[0].handler({});
        expect(<methodName>).toHaveBeenCalled();
        expect(result.content[0].text).toBe('<mock output>');
    });

    it('handler result has text content type', async () => {
        const { server, calls } = makeMockServer();
        register(server, makeMockTools());
        const result = await calls[0].handler({});
        expect(result.content[0].type).toBe('text');
    });

    // Add edge-case tests here
});
```

### Step 4: Create the documentation file

`docs/tools/<snake_case_name>.md`

**Template:**
```markdown
# <snake_case_name>

## Description

<What the tool does. 2-3 sentences covering the happy path and the most important edge case.>

## Input schema

| Parameter | Type | Required | Description |
|---|---|---|---|
| (none) | — | — | — |

## Return value

Plain text. <What is returned and in what format. Include the sentinel/fallback value.>

## Example

Request:
\`\`\`json
{ "name": "<snake_case_name>", "arguments": {} }
\`\`\`

Response:
\`\`\`
<concrete example output>
\`\`\`

## Notes

<Behavioral quirks, edge cases, or known limitations. Delete section if none.>
```

### Step 5: Update the registry

`src/tools/registry.ts` — add the import and call:

```typescript
import { register as register<CamelCaseName> } from './<camelCaseName>.js';
// inside registerAllTools:
register<CamelCaseName>(server, tools);
```

Also update the registry test (`tests/tools/registry.test.ts`):
- Increment the `toHaveLength` count
- Add the new `TOOL_NAME` import and include it in the `toContain` assertions

### Step 6: Update `docs/clients.md`

Under "Claude Code VS Code extension" and "Claude Code CLI" sections, add:
```
- `mcp__vscode-mcp-hook__<snake_case_name>`
```

### Step 7: Update `README.md`

Add a row to the tools table. If no table exists yet, create one.

### Step 8: Update `docs/harness.md` if you made an architectural decision

If your implementation required a decision not covered by the existing sections in
`docs/harness.md`, add a new section documenting: the decision, the reason, and the
consequences.

### Step 9: Run DoD

```powershell
npx tsc && npx jest && npx eslint src tests --ext .ts
```

All must pass before reporting the task complete.

---

## REMOVE — checklist

Work through this list in order. Do not skip steps.

1. Remove import and call from `src/tools/registry.ts`
2. Remove the `TOOL_NAME` import and `toContain` assertion from `tests/tools/registry.test.ts`; decrement `toHaveLength`
3. Delete `src/tools/<camelCaseName>.ts`
4. Delete `tests/tools/<camelCaseName>.test.ts`
5. Delete `docs/tools/<snake_case_name>.md`
6. Remove tool entry from `docs/clients.md`
7. Remove tool row from `README.md` tools table
8. If the corresponding `McpTools` method is used by no other tool, remove it from `src/core/mcpTools.ts` and its test from `tests/core/mcpTools.test.ts`
9. If the corresponding `VscodeAdapter` method is used by no other `McpTools` method, remove it from the interface and `LiveVscodeAdapter`
10. Run DoD

---

## MODIFY — checklist

1. Update `src/tools/<camelCaseName>.ts` — description, schema, handler logic
2. Update `tests/tools/<camelCaseName>.test.ts` — reflect new behavior and any new edge cases
3. Update `docs/tools/<snake_case_name>.md` — reflect new schema, examples, notes
4. If `McpTools` method signature changed: update `tests/core/mcpTools.test.ts`
5. If `VscodeAdapter` interface changed: update `LiveVscodeAdapter`
6. If you made an architectural decision: add it to `docs/harness.md`
7. Run DoD

---

## Golden rules (never break these)

- Every tool file has exactly one `TOOL_NAME` constant and one `register` function. Nothing else.
- `register` is always the function name — the registry aliases it on import.
- Tests never import from `vscode` — all VS Code interaction is mocked via `VscodeAdapter`.
- Docs are written for agents, not humans: include exact formats, sentinel values, and edge cases.
- When in doubt, read `docs/harness.md` first.
