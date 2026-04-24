import * as fs from 'node:fs/promises';
import * as path from 'node:path';

// Writes the actual server URL so Claude Code's file-watcher picks it up
// without a window reload. Called automatically on every activation.
export async function writeVscodeMcpConfig(rootPath: string, serverUrl: string): Promise<void> {
    const vscodeDir = path.join(rootPath, '.vscode');
    await fs.mkdir(vscodeDir, { recursive: true });
    await fs.writeFile(
        path.join(vscodeDir, 'mcp.json'),
        JSON.stringify(
            { servers: { 'vscode-mcp-hook': { type: 'http', url: serverUrl } } },
            null,
            2,
        ) + '\n',
        'utf8',
    );
}

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
