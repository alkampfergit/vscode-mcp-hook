import * as http from 'node:http';
import { createMcpHttpServer, startHttpServer, stopHttpServer } from '../../src/server/httpServer.js';
import {
    buildMcpServer,
    createStatelessRequestHandler,
    createTransport,
} from '../../src/server/mcpServer.js';
import { makeMockTools } from '../tools/_helpers.js';

describe('createTransport', () => {
    it('produces a transport with no session id (stateless mode)', () => {
        const transport = createTransport();
        // In stateless mode the SDK exposes sessionId as undefined.
        expect(transport.sessionId).toBeUndefined();
    });
});

describe('buildMcpServer', () => {
    it('returns an McpServer instance', () => {
        const server = buildMcpServer(makeMockTools());
        expect(server).toBeDefined();
        // Smoke check: McpServer exposes a `connect` method.
        expect(typeof (server as unknown as { connect: unknown }).connect).toBe('function');
    });
});

describe('createStatelessRequestHandler', () => {
    let httpServer: http.Server;
    let baseUrl: string;

    beforeEach(async () => {
        const handler = createStatelessRequestHandler(makeMockTools());
        httpServer = createMcpHttpServer(handler);
        const port = await startHttpServer(httpServer);
        baseUrl = `http://127.0.0.1:${port}/mcp`;
    });

    afterEach(async () => {
        if (httpServer) await stopHttpServer(httpServer);
    });

    function postInitialize(): Promise<{ status: number; body: string }> {
        const payload = JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'initialize',
            params: {
                protocolVersion: '2025-03-26',
                capabilities: {},
                clientInfo: { name: 'test-client', version: '0.0.1' },
            },
        });
        return new Promise((resolve, reject) => {
            const req = http.request(
                baseUrl,
                {
                    method: 'POST',
                    headers: {
                        'content-type': 'application/json',
                        'content-length': Buffer.byteLength(payload).toString(),
                        accept: 'application/json, text/event-stream',
                    },
                },
                (res) => {
                    const chunks: Buffer[] = [];
                    res.on('data', (c) => chunks.push(c as Buffer));
                    res.on('end', () =>
                        resolve({ status: res.statusCode ?? 0, body: Buffer.concat(chunks).toString('utf8') }),
                    );
                },
            );
            req.on('error', reject);
            req.end(payload);
        });
    }

    it('handles two consecutive initialize requests without "Server already initialized"', async () => {
        const first = await postInitialize();
        const second = await postInitialize();

        // Regression: the bug surfaced as JSON-RPC error -32600 with that exact message.
        expect(first.body).not.toMatch(/Server already initialized/i);
        expect(second.body).not.toMatch(/Server already initialized/i);
        expect(first.status).toBeLessThan(500);
        expect(second.status).toBeLessThan(500);
    });

    it('rejects non-POST requests with 405', async () => {
        const status: number = await new Promise((resolve, reject) => {
            http.get(baseUrl, (res) => {
                res.resume();
                resolve(res.statusCode ?? 0);
            }).on('error', reject);
        });
        expect(status).toBe(405);
    });
});
