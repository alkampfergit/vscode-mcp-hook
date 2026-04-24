# get_problems

## Description

Returns all diagnostics (errors, warnings, hints, informational messages) currently shown in the VS Code Problems panel. Optionally narrows the result to a specific file by providing a path substring filter.

## Input schema

| Parameter | Type | Required | Description |
|---|---|---|---|
| `file` | `string` | optional | Substring matched against each diagnostic's file path. When provided, only diagnostics whose `filePath` contains this string are returned. |

## Return value

Plain text. One diagnostic per line, formatted as:

```
[Severity] /absolute/path/to/file.ts:line:character — message (source)
```

The `(source)` segment is omitted when the diagnostic has no source.

Returns `(no problems)` when there are no diagnostics (or none match the filter).

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

## Notes

- The `file` filter is a **substring match**, not a glob or regex. Pass a partial path like `src/` to match all files under that directory.
- Diagnostics from all languages and all open files are included unless filtered.
- Line and character numbers are 1-based.
- Severity labels: `Error`, `Warning`, `Information`, `Hint`.
