# show_message

## Description

Pops an information notification in the VSCode window. The message appears in the bottom-right corner as a VS Code information toast.

## Input schema

| Parameter | Type | Required | Description |
|---|---|---|---|
| `message` | `string` | required | Text to display in the notification. |

## Return value

Plain text. Returns `ok` on success (the notification was queued; VS Code shows it asynchronously).

## Example

Request:
```json
{ "name": "show_message", "arguments": { "message": "Build succeeded!" } }
```

Response:
```
ok
```

## Notes

- Uses `vscode.window.showInformationMessage` — this is an information-level notification only. There is no API for warning or error level toasts from this tool.
- The `ok` response confirms the call was dispatched, not that the user dismissed the notification.
- Long messages are truncated by VS Code's notification UI, not by this tool.
