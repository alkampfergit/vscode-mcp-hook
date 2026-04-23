import * as fs from 'node:fs/promises';
import * as path from 'node:path';

export async function writeCliMcpConfig(rootPath: string): Promise<void> {
    const vscodeDir = path.join(rootPath, '.vscode');
    await fs.mkdir(vscodeDir, { recursive: true });

    await fs.writeFile(
        path.join(vscodeDir, 'mcp.json'),
        JSON.stringify(
            { servers: { 'vscode-mcp-hook': { type: 'http', url: '${env:VSCODE_MCP_URL}' } } },
            null,
            2,
        ) + '\n',
        'utf8',
    );

    await fs.writeFile(
        path.join(rootPath, '.mcp.json'),
        JSON.stringify(
            { mcpServers: { 'vscode-mcp-hook': { type: 'http', url: '${VSCODE_MCP_URL}' } } },
            null,
            2,
        ) + '\n',
        'utf8',
    );
}
