# Extending

Tools live in `buildMcpServer()` in `src/extension.ts`. The included tools are
illustrative — useful additions for an IDE host:

- `open_file(path, line?)` → `vscode.window.showTextDocument`
- `get_selection()` → read current selection text + range
- `get_diagnostics(uri?)` → `vscode.languages.getDiagnostics`
- `run_task(name)` → trigger a VSCode task
- `search_workspace(query)` → `vscode.workspace.findFiles` + read

All of these work *per window* because `vscode.window.*` and
`vscode.workspace.*` are already scoped to the extension host making the call.
