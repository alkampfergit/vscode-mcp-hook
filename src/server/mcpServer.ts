import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { McpTools } from '../core/mcpTools.js';

export function createTransport(): StreamableHTTPServerTransport {
    return new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
    });
}

export function buildMcpServer(tools: McpTools): McpServer {
    const server = new McpServer({ name: 'vscode-mcp-hook', version: '0.0.1' });

    server.registerTool(
        'get_active_file',
        {
            title: 'Get active file',
            description: 'Path of the file currently focused in this VSCode window.',
            inputSchema: {},
        },
        async () => ({ content: [{ type: 'text', text: tools.getActiveFile() }] }),
    );

    server.registerTool(
        'get_problems',
        {
            title: 'Get Problems',
            description:
                'Returns all diagnostics (errors, warnings, hints) shown in the VS Code Problems panel, optionally filtered to a specific file path.',
            inputSchema: { file: z.string().optional() },
        },
        async ({ file }) => ({ content: [{ type: 'text', text: tools.getProblems(file) }] }),
    );

    server.registerTool(
        'list_workspace_folders',
        {
            title: 'List workspace folders',
            description: 'Workspace folders open in this VSCode window.',
            inputSchema: {},
        },
        async () => ({ content: [{ type: 'text', text: tools.listWorkspaceFolders() }] }),
    );

    server.registerTool(
        'show_message',
        {
            title: 'Show a VSCode notification',
            description: 'Pops a notification in this VSCode window.',
            inputSchema: { message: z.string() },
        },
        async ({ message }) => {
            tools.showMessage(message);
            return { content: [{ type: 'text', text: 'ok' }] };
        },
    );

    return server;
}
