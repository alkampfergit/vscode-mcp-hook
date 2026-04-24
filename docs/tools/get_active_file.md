# get_active_file

## Description

Returns the absolute filesystem path of the file currently focused in this VSCode window's editor. If no editor is focused but a file was previously active in this session, that path is returned instead. Falls back to a sentinel string if no file has ever been active.

## Input schema

This tool accepts no parameters.

| Parameter | Type | Required | Description |
|---|---|---|---|
| (none) | — | — | — |

## Return value

Plain text. One of:
- An absolute path (e.g. `/home/user/project/src/main.ts`)
- `(no active editor)` — when no file has been focused in this window

## Example

Request:
```json
{ "name": "get_active_file", "arguments": {} }
```

Response:
```
/home/user/project/src/extension.ts
```

## Notes

- The path is the OS-native `fsPath`, not a URI — on Windows it will use backslashes.
- The extension tracks the last-focused file via `onDidChangeActiveTextEditor` so closing an editor still returns the most recently active path.
- This tool is window-scoped: it only sees files in the VSCode window that hosts the MCP server.
