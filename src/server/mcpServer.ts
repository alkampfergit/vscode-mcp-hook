import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import * as http from 'node:http';
import { McpTools } from '../core/mcpTools.js';
import { nullLogger, type Logger } from '../logger.js';
import { registerAllTools } from '../tools/registry.js';
import type { RequestHandler } from './httpServer.js';

export function createTransport(): StreamableHTTPServerTransport {
    // Stateless: each call produces a fresh transport, so concurrent clients
    // (terminal Claude, extension Claude, Copilot CLI) never share session
    // state and the SDK's "Server already initialized" guard never trips.
    return new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
    });
}

export function buildMcpServer(tools: McpTools): McpServer {
    const server = new McpServer({ name: 'vscode-mcp-hook', version: '0.0.1' });
    registerAllTools(server, tools);
    return server;
}

export function createStatelessRequestHandler(
    tools: McpTools,
    logger: Logger = nullLogger,
): RequestHandler {
    return {
        async handleRequest(req: http.IncomingMessage, res: http.ServerResponse, body: unknown) {
            if (req.method !== 'POST') {
                res.writeHead(405, { 'content-type': 'application/json' }).end(
                    JSON.stringify({
                        jsonrpc: '2.0',
                        error: { code: -32000, message: 'Method not allowed.' },
                        id: null,
                    }),
                );
                return;
            }
            const server = buildMcpServer(tools);
            const transport = createTransport();
            res.on('close', () => {
                void transport.close().catch((err) =>
                    logger.error('[mcpServer] transport close failed', err),
                );
                void server.close().catch((err) =>
                    logger.error('[mcpServer] server close failed', err),
                );
            });
            await server.connect(transport);
            await transport.handleRequest(req, res, body);
        },
    };
}
