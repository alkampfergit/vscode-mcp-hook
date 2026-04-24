# get_problems

## Description

Returns all errors and warnings currently shown in the VS Code Problems panel. Before reading diagnostics, the tool opens git-modified files as editor tabs so language servers can publish problems for changed files that were not already active. Hints and informational diagnostics are excluded. Optionally narrows the result to a specific file by providing a path substring filter.

## Input schema

| Parameter | Type | Required | Description |
|---|---|---|---|
| `file` | `string` | optional | Substring matched against each diagnostic's file path. When provided, only diagnostics whose `filePath` contains this string are returned. |
| `scope` | `"git"` | optional | When set to `"git"`, restricts results to files that have been modified in the current git repository (staged or unstaged). Returns `(git integration not available)` if the VS Code git extension is absent or no repository is open. |

## Return value

Plain text. One diagnostic per line, formatted as:

```
[Severity] /absolute/path/to/file.ts:line:character — message (source)
```

The `(source)` segment is omitted when the diagnostic has no source.

Returns `(no problems)` when there are no errors or warnings (or none match the filter).

Severity values returned: `Error`, `Warning` only.

## Example — all problems

Request:
```json
{ "name": "get_problems", "arguments": {} }
```

Response:
```
[Error] /project/src/main.ts:12:5 — Cannot find name 'foo' (ts)
[Warning] /project/src/utils.ts:3:1 — 'x' is declared but never used (ts)
```

## Example — filtered by file

Request:
```json
{ "name": "get_problems", "arguments": { "file": "main.ts" } }
```

Response:
```
[Error] /project/src/main.ts:12:5 — Cannot find name 'foo' (ts)
```

## Example — git-modified files only

Request:
```json
{ "name": "get_problems", "arguments": { "scope": "git" } }
```

Response (only files touched in the working tree or index):
```
[Error] /project/src/main.ts:12:5 — Cannot find name 'foo' (ts)
```

Response when git is unavailable:
```
(git integration not available)
```

## Notes

- The `file` filter is a **substring match**, not a glob or regex. Pass a partial path like `src/` to match all files under that directory.
- `scope: "git"` and `file` can be combined: both filters are applied simultaneously.
- All calls try to activate the VS Code built-in git extension (extension ID `vscode.git`) and open modified files in editor tabs before diagnostics are read. If git is unavailable and `scope` is omitted, the tool continues with the diagnostics already known to VS Code.
- After preloading git-modified files, the extension waits briefly for diagnostics from the opened files. If diagnostics are delayed beyond the timeout, the response reflects the diagnostics VS Code has published so far.
- `scope: "git"` covers all open repositories, both staged and unstaged changes. Returns the sentinel `(git integration not available)` if the extension is disabled, not installed, or no repository is open.
- Git-scoped path comparisons normalize path separators and Windows drive-letter casing, so diagnostics are not dropped when VS Code and git report the same file with different casing.
- Git preloading logs each git-modified path, whether VS Code loaded it via `openTextDocument`, whether it was visible in an editor tab, whether diagnostics were later present for that exact path, and each diagnostic filter decision. These logs are diagnostic-only and are not included in the MCP response.
- `Information` and `Hint` severity diagnostics are always excluded.
- Line and character numbers are 1-based.
