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
                'Returns errors and warnings shown in the VS Code Problems panel, optionally filtered to a specific file path or scoped to git-modified files. Hints and informational diagnostics are excluded.',
            inputSchema: {
                file: z.string().optional(),
                scope: z.enum(['git']).optional(),
            },
        },
        async ({ file, scope }) => ({
            content: [{ type: 'text' as const, text: await tools.getProblems(file, scope) }],
        }),
    );
}
