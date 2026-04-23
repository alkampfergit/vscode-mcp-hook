import * as http from 'node:http';

export interface RequestHandler {
    handleRequest(req: http.IncomingMessage, res: http.ServerResponse, body: unknown): Promise<void>;
}

export function isLoopbackAddress(addr: string): boolean {
    return addr === '127.0.0.1' || addr === '::1' || addr === '::ffff:127.0.0.1';
}

export function createMcpHttpServer(handler: RequestHandler): http.Server {
    return http.createServer(async (req, res) => {
        const remote = req.socket.remoteAddress ?? '';
        if (!isLoopbackAddress(remote)) {
            res.writeHead(403).end();
            return;
        }
        try {
            let body: unknown = undefined;
            if (req.method === 'POST') {
                const chunks: Buffer[] = [];
                for await (const chunk of req) chunks.push(chunk as Buffer);
                const raw = Buffer.concat(chunks).toString('utf8');
                body = raw.length ? JSON.parse(raw) : undefined;
            }
            await handler.handleRequest(req, res, body);
        } catch (err) {
            if (!res.headersSent) res.writeHead(500, { 'content-type': 'text/plain' });
            res.end(`MCP error: ${err instanceof Error ? err.message : String(err)}`);
        }
    });
}

export function startHttpServer(server: http.Server): Promise<number> {
    return new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(0, '127.0.0.1', () => {
            const addr = server.address();
            if (!addr || typeof addr === 'string') {
                reject(new Error('Failed to bind MCP server'));
                return;
            }
            resolve(addr.port);
        });
    });
}

export function stopHttpServer(server: http.Server): Promise<void> {
    return new Promise((resolve) => server.close(() => resolve()));
}
