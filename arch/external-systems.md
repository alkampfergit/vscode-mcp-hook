# External systems

> Third-party services, SDKs, and the adapter directories that wrap them.

| System | Used for | Adapter / entry point |
|---|---|---|
| VS Code Diagnostics API (`vscode.languages.getDiagnostics`) | Reading errors/warnings from the Problems panel | `src/adapters/vscodeAdapter.ts` → `getDiagnostics()` |
| VS Code Git extension (`vscode.git`) | Listing modified files (staged + unstaged) | `src/adapters/vscodeAdapter.ts` → `getGitModifiedFiles()` |
| @modelcontextprotocol/sdk | MCP protocol: `McpServer`, `StreamableHTTPServerTransport` | `src/server/mcpServer.ts` |
