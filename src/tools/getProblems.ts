import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpTools } from '../core/mcpTools.js';

export const TOOL_NAME = 'get_problems' as const;

export function register(server: McpServer, tools: McpTools): void {
    server.registerTool(
        TOOL_NAME,
        {
            title: 'Get Problems',
            description:
                'Returns all diagnostics (errors, warnings, hints) shown in the VS Code Problems panel, optionally filtered to a specific file path.',
            inputSchema: { file: z.string().optional() },
        },
        async ({ file }) => ({ content: [{ type: 'text' as const, text: tools.getProblems(file) }] }),
    );
}
