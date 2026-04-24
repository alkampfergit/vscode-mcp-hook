import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpTools } from '../core/mcpTools.js';

export const TOOL_NAME = 'list_workspace_folders' as const;

export function register(server: McpServer, tools: McpTools): void {
    server.registerTool(
        TOOL_NAME,
        {
            title: 'List workspace folders',
            description: 'Workspace folders open in this VSCode window.',
            inputSchema: {},
        },
        async () => ({ content: [{ type: 'text' as const, text: tools.listWorkspaceFolders() }] }),
    );
}
