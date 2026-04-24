import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpTools } from '../core/mcpTools.js';

export const TOOL_NAME = 'get_active_file' as const;

export function register(server: McpServer, tools: McpTools): void {
    server.registerTool(
        TOOL_NAME,
        {
            title: 'Get active file',
            description: 'Path of the file currently focused in this VSCode window.',
            inputSchema: {},
        },
        async () => ({ content: [{ type: 'text' as const, text: tools.getActiveFile() }] }),
    );
}
