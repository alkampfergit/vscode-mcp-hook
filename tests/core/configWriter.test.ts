import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import {
    readConfiguredMcpServerUrl,
    readPortFromMcpServerUrl,
    writeCliMcpConfig,
    writeVscodeMcpConfig,
} from '../../src/core/configWriter.js';

const serverUrl = 'http://127.0.0.1:31337/mcp';

describe('writeVscodeMcpConfig', () => {
    let tmpDir: string;

    beforeEach(async () => {
        tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mcp-test-'));
    });

    afterEach(async () => {
        await fs.rm(tmpDir, { recursive: true, force: true });
    });

    it('writes .vscode/mcp.json with the env variable reference and current URL comment', async () => {
        await writeVscodeMcpConfig(tmpDir, serverUrl);
        const content = JSON.parse(await fs.readFile(path.join(tmpDir, '.vscode', 'mcp.json'), 'utf8'));
        expect(content.servers['vscode-mcp-hook']).toMatchObject({
            type: 'http',
            url: '${env:VSCODE_MCP_URL}',
        });
        expect(content.servers['vscode-mcp-hook']._comment).toContain(`Current URL: ${serverUrl}.`);
    });

    it('is idempotent when called twice', async () => {
        await writeVscodeMcpConfig(tmpDir, serverUrl);
        await writeVscodeMcpConfig(tmpDir, serverUrl);
        const content = JSON.parse(await fs.readFile(path.join(tmpDir, '.vscode', 'mcp.json'), 'utf8'));
        expect(Object.keys(content.servers)).toHaveLength(1);
    });

    it('keeps the env reference and updates the current URL comment', async () => {
        await writeVscodeMcpConfig(tmpDir, 'http://127.0.0.1:11111/mcp');
        await writeVscodeMcpConfig(tmpDir, serverUrl);

        const content = JSON.parse(await fs.readFile(path.join(tmpDir, '.vscode', 'mcp.json'), 'utf8'));
        expect(content.servers['vscode-mcp-hook'].url).toBe('${env:VSCODE_MCP_URL}');
        expect(content.servers['vscode-mcp-hook']._comment).toContain(`Current URL: ${serverUrl}.`);
    });

    it('preserves unrelated servers when writing .vscode/mcp.json', async () => {
        await fs.mkdir(path.join(tmpDir, '.vscode'), { recursive: true });
        await fs.writeFile(
            path.join(tmpDir, '.vscode', 'mcp.json'),
            JSON.stringify({ servers: { existing: { type: 'http', url: 'http://127.0.0.1:1/mcp' } } }),
            'utf8',
        );

        await writeVscodeMcpConfig(tmpDir, serverUrl);

        const content = JSON.parse(await fs.readFile(path.join(tmpDir, '.vscode', 'mcp.json'), 'utf8'));
        expect(content.servers.existing).toEqual({ type: 'http', url: 'http://127.0.0.1:1/mcp' });
        expect(content.servers['vscode-mcp-hook'].url).toBe('${env:VSCODE_MCP_URL}');
    });
});

describe('writeCliMcpConfig', () => {
    let tmpDir: string;

    beforeEach(async () => {
        tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mcp-test-'));
    });

    afterEach(async () => {
        await fs.rm(tmpDir, { recursive: true, force: true });
    });

    it('creates .vscode directory', async () => {
        await writeCliMcpConfig(tmpDir, serverUrl);
        const stat = await fs.stat(path.join(tmpDir, '.vscode'));
        expect(stat.isDirectory()).toBe(true);
    });

    it('writes .vscode/mcp.json with correct server entry', async () => {
        await writeCliMcpConfig(tmpDir, serverUrl);
        const content = JSON.parse(await fs.readFile(path.join(tmpDir, '.vscode', 'mcp.json'), 'utf8'));
        expect(content.servers['vscode-mcp-hook']).toMatchObject({
            type: 'http',
            url: '${env:VSCODE_MCP_URL}',
        });
        expect(content.servers['vscode-mcp-hook']._comment).toContain(`Current URL: ${serverUrl}.`);
    });

    it('writes .mcp.json with correct mcpServers entry', async () => {
        await writeCliMcpConfig(tmpDir, serverUrl);
        const content = JSON.parse(await fs.readFile(path.join(tmpDir, '.mcp.json'), 'utf8'));
        expect(content.mcpServers['vscode-mcp-hook']).toMatchObject({
            type: 'http',
            url: '${VSCODE_MCP_URL}',
        });
        expect(content.mcpServers['vscode-mcp-hook']._comment).toContain(`Current URL: ${serverUrl}.`);
    });

    it('is idempotent when called twice', async () => {
        await writeCliMcpConfig(tmpDir, serverUrl);
        await writeCliMcpConfig(tmpDir, serverUrl);
        const content = JSON.parse(await fs.readFile(path.join(tmpDir, '.mcp.json'), 'utf8'));
        expect(Object.keys(content.mcpServers)).toHaveLength(1);
    });
});

describe('readConfiguredMcpServerUrl', () => {
    let tmpDir: string;

    beforeEach(async () => {
        tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mcp-test-'));
    });

    afterEach(async () => {
        await fs.rm(tmpDir, { recursive: true, force: true });
    });

    it('returns a literal URL from .vscode/mcp.json', async () => {
        await fs.mkdir(path.join(tmpDir, '.vscode'), { recursive: true });
        await fs.writeFile(
            path.join(tmpDir, '.vscode', 'mcp.json'),
            JSON.stringify({ servers: { 'vscode-mcp-hook': { type: 'http', url: serverUrl } } }),
            'utf8',
        );

        await expect(readConfiguredMcpServerUrl(tmpDir)).resolves.toBe(serverUrl);
    });

    it('ignores env variable references', async () => {
        await fs.mkdir(path.join(tmpDir, '.vscode'), { recursive: true });
        await fs.writeFile(
            path.join(tmpDir, '.vscode', 'mcp.json'),
            JSON.stringify({ servers: { 'vscode-mcp-hook': { type: 'http', url: '${env:VSCODE_MCP_URL}' } } }),
            'utf8',
        );

        await expect(readConfiguredMcpServerUrl(tmpDir)).resolves.toBeUndefined();
    });

    it('falls back to .mcp.json when .vscode/mcp.json has no literal URL', async () => {
        await fs.writeFile(
            path.join(tmpDir, '.mcp.json'),
            JSON.stringify({ mcpServers: { 'vscode-mcp-hook': { type: 'http', url: serverUrl } } }),
            'utf8',
        );

        await expect(readConfiguredMcpServerUrl(tmpDir)).resolves.toBe(serverUrl);
    });

    it('throws when .vscode/mcp.json and .mcp.json contain different literal ports', async () => {
        await fs.mkdir(path.join(tmpDir, '.vscode'), { recursive: true });
        await fs.writeFile(
            path.join(tmpDir, '.vscode', 'mcp.json'),
            JSON.stringify({ servers: { 'vscode-mcp-hook': { type: 'http', url: serverUrl } } }),
            'utf8',
        );
        await fs.writeFile(
            path.join(tmpDir, '.mcp.json'),
            JSON.stringify({
                mcpServers: { 'vscode-mcp-hook': { type: 'http', url: 'http://127.0.0.1:31338/mcp' } },
            }),
            'utf8',
        );

        await expect(readConfiguredMcpServerUrl(tmpDir)).rejects.toThrow(
            'Conflicting vscode-mcp-hook ports found in .vscode/mcp.json and .mcp.json',
        );
    });
});

describe('readPortFromMcpServerUrl', () => {
    it('returns the port for a loopback URL', () => {
        expect(readPortFromMcpServerUrl(serverUrl)).toBe(31337);
    });

    it('rejects non-loopback URLs', () => {
        expect(readPortFromMcpServerUrl('http://192.168.1.1:31337/mcp')).toBeUndefined();
    });
});
