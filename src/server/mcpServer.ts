import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { randomUUID } from 'node:crypto';
import { McpTools } from '../core/mcpTools.js';
import { registerAllTools } from '../tools/registry.js';

export function createTransport(): StreamableHTTPServerTransport {
    return new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
    });
}

export function buildMcpServer(tools: McpTools): McpServer {
    const server = new McpServer({ name: 'vscode-mcp-hook', version: '0.0.1' });
    registerAllTools(server, tools);
    return server;
}
