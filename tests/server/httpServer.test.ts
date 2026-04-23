import * as http from 'node:http';
import { isLoopbackAddress, createMcpHttpServer, startHttpServer, stopHttpServer } from '../../src/server/httpServer.js';

describe('isLoopbackAddress', () => {
    it.each(['127.0.0.1', '::1', '::ffff:127.0.0.1'])('returns true for %s', (addr) => {
        expect(isLoopbackAddress(addr)).toBe(true);
    });

    it.each(['192.168.1.1', '10.0.0.1', '8.8.8.8', ''])('returns false for %s', (addr) => {
        expect(isLoopbackAddress(addr)).toBe(false);
    });
});

describe('createMcpHttpServer + startHttpServer', () => {
    let server: http.Server;

    afterEach(async () => {
        if (server) await stopHttpServer(server);
    });

    it('starts and binds to a port', async () => {
        const handler = { handleRequest: jest.fn().mockResolvedValue(undefined) };
        server = createMcpHttpServer(handler);
        const port = await startHttpServer(server);
        expect(port).toBeGreaterThan(0);
    });

    it('routes GET requests to the handler', async () => {
        const handler = {
            handleRequest: jest.fn().mockImplementation((_req, res: http.ServerResponse) => {
                res.writeHead(200).end('ok');
                return Promise.resolve();
            }),
        };
        server = createMcpHttpServer(handler);
        const port = await startHttpServer(server);

        await new Promise<void>((resolve, reject) => {
            http.get(`http://127.0.0.1:${port}/`, (res) => {
                expect(res.statusCode).toBe(200);
                expect(handler.handleRequest).toHaveBeenCalledTimes(1);
                resolve();
            }).on('error', reject);
        });
    });
});
