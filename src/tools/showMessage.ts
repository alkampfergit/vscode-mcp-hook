import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpTools } from '../core/mcpTools.js';

export const TOOL_NAME = 'show_message' as const;

export function register(server: McpServer, tools: McpTools): void {
    server.registerTool(
        TOOL_NAME,
        {
            title: 'Show a VSCode notification',
            description: 'Pops a notification in this VSCode window.',
            inputSchema: { message: z.string() },
        },
        async ({ message }) => {
            tools.showMessage(message);
            return { content: [{ type: 'text' as const, text: 'ok' }] };
        },
    );
}
