import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import { writeCliMcpConfig } from '../../src/core/configWriter.js';

describe('writeCliMcpConfig', () => {
    let tmpDir: string;

    beforeEach(async () => {
        tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mcp-test-'));
    });

    afterEach(async () => {
        await fs.rm(tmpDir, { recursive: true, force: true });
    });

    it('creates .vscode directory', async () => {
        await writeCliMcpConfig(tmpDir);
        const stat = await fs.stat(path.join(tmpDir, '.vscode'));
        expect(stat.isDirectory()).toBe(true);
    });

    it('writes .vscode/mcp.json with correct server entry', async () => {
        await writeCliMcpConfig(tmpDir);
        const content = JSON.parse(await fs.readFile(path.join(tmpDir, '.vscode', 'mcp.json'), 'utf8'));
        expect(content.servers['vscode-mcp-hook']).toEqual({
            type: 'http',
            url: '${env:VSCODE_MCP_URL}',
        });
    });

    it('writes .mcp.json with correct mcpServers entry', async () => {
        await writeCliMcpConfig(tmpDir);
        const content = JSON.parse(await fs.readFile(path.join(tmpDir, '.mcp.json'), 'utf8'));
        expect(content.mcpServers['vscode-mcp-hook']).toEqual({
            type: 'http',
            url: '${VSCODE_MCP_URL}',
        });
    });

    it('is idempotent when called twice', async () => {
        await writeCliMcpConfig(tmpDir);
        await writeCliMcpConfig(tmpDir);
        const content = JSON.parse(await fs.readFile(path.join(tmpDir, '.mcp.json'), 'utf8'));
        expect(Object.keys(content.mcpServers)).toHaveLength(1);
    });
});
