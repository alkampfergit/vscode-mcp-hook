# Extending — Adding MCP Tools

Tools are added through the harness pattern. Every tool is isolated in its own file and
must satisfy the same contract. Read `docs/harness.md` for the full architectural rationale.

## Quick reference

| Layer | File | Purpose |
|---|---|---|
| VS Code API | `src/adapters/vscodeAdapter.ts` | Raw VS Code API access, mocked in tests |
| Business logic | `src/core/mcpTools.ts` | Tool logic, independently testable |
| Tool registration | `src/tools/<camelCaseName>.ts` | Name + schema + handler wiring |
| Harness assembler | `src/tools/registry.ts` | Single place that lists all active tools |
| MCP server | `src/server/mcpServer.ts` | Unchanged when tools are added/removed |

## Use the skill

The `mcp-tool` skill automates the full workflow:

```
/mcp-tool add <snake_case_name>    # scaffold all files + update indexes
/mcp-tool remove <snake_case_name> # delete all files + update indexes
/mcp-tool modify <snake_case_name> # update implementation, tests, and docs
```

The skill enforces the definition of done — compile, tests, lint, and documentation
must all pass before a task is considered complete.

## Manual checklist (if not using the skill)

For each new tool, create these files:

1. `src/tools/<camelCaseName>.ts` — exports `TOOL_NAME` and `register(server, tools)`
2. `tests/tools/<camelCaseName>.test.ts` — tests registration name + handler wiring
3. `docs/tools/<snake_case_name>.md` — description, schema, return value, example

And update these shared files:

4. `src/tools/registry.ts` — add import + call inside `registerAllTools`
5. `tests/tools/registry.test.ts` — increment count, add `toContain` assertion
6. `docs/clients.md` — add linked tool entry
7. `README.md` — add row to tools table

## Potential tools to add

The VS Code API surface that maps naturally to MCP tools:

| Tool | VS Code API | Description |
|---|---|---|
| `open_file` | `vscode.window.showTextDocument` | Open a file at an optional line number |
| `get_selection` | `vscode.window.activeTextEditor.selection` | Current selection text and range |
| `run_task` | `vscode.tasks.executeTask` | Trigger a named VS Code task |
| `search_workspace` | `vscode.workspace.findFiles` | Find files matching a glob pattern |
| `read_file` | `vscode.workspace.fs.readFile` | Read file content by path |
| `get_git_status` | VS Code Git extension API | Current git status of the workspace |
