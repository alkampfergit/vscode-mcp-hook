# list_workspace_folders

## Description

Returns the absolute filesystem paths of all workspace folders currently open in this VSCode window. In a multi-root workspace each folder appears on its own line.

## Input schema

This tool accepts no parameters.

| Parameter | Type | Required | Description |
|---|---|---|---|
| (none) | — | — | — |

## Return value

Plain text. One absolute path per line, in the order they appear in the workspace.

Returns `(no workspace folders)` when no folders are open (e.g. a floating untitled file window).

## Example — single root

Request:
```json
{ "name": "list_workspace_folders", "arguments": {} }
```

Response:
```
/home/user/myproject
```

## Example — multi-root workspace

Request:
```json
{ "name": "list_workspace_folders", "arguments": {} }
```

Response:
```
/home/user/frontend
/home/user/backend
/home/user/shared
```

## Notes

- Folder order matches the order in the `.code-workspace` file or the order folders were added in the session.
- Paths are OS-native `fsPath` values — backslashes on Windows.
