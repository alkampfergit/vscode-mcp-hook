import * as vscode from 'vscode';
import * as http from 'node:http';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { randomUUID } from 'node:crypto';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';

let httpServer: http.Server | undefined;
let serverUrl: string | undefined;
let lastActiveFile: string | undefined;

export async function activate(context: vscode.ExtensionContext) {
    // Track the last active editor — activeTextEditor is undefined when the
    // terminal has focus, so we remember the most recent non-undefined value.
    lastActiveFile = vscode.window.activeTextEditor?.document.uri.fsPath;
    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor((editor) => {
            if (editor) lastActiveFile = editor.document.uri.fsPath;
        })
    );

    const mcp = buildMcpServer();

    // One transport, one session generator — the HTTP handler below
    // routes every request through it. For heavier multi-session use you
    // can create a transport per sessionId, but one is fine to start.
    const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
    });
    await mcp.connect(transport);

    httpServer = http.createServer(async (req, res) => {
        // Hard-block anything that isn't loopback. The listen() call below
        // already binds to 127.0.0.1 so this is belt-and-braces.
        const remote = req.socket.remoteAddress ?? '';
        const isLoopback =
            remote === '127.0.0.1' ||
            remote === '::1' ||
            remote === '::ffff:127.0.0.1';
        if (!isLoopback) {
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
            await transport.handleRequest(req, res, body);
        } catch (err) {
            if (!res.headersSent) res.writeHead(500, { 'content-type': 'text/plain' });
            res.end(`MCP error: ${err instanceof Error ? err.message : String(err)}`);
        }
    });

    // Port 0 => OS-assigned free port. Each VSCode window gets its own.
    await new Promise<void>((resolve, reject) => {
        httpServer!.once('error', reject);
        httpServer!.listen(0, '127.0.0.1', () => resolve());
    });
    const addr = httpServer.address();
    if (!addr || typeof addr === 'string') throw new Error('Failed to bind MCP server');
    serverUrl = `http://127.0.0.1:${addr.port}/mcp`;

    // Inject the URL into every terminal spawned by THIS window.
    // persistent=false is critical: the port changes every session, and
    // we don't want a stale value restored after reload.
    const envCol = context.environmentVariableCollection;
    envCol.persistent = false;
    envCol.description = `MCP server URL for this VSCode window`;
    envCol.replace('VSCODE_MCP_URL', serverUrl);

    context.subscriptions.push(
        vscode.commands.registerCommand('vscodeMcpHost.showInfo', () => {
            vscode.window.showInformationMessage(`MCP server: ${serverUrl}`);
        }),
        vscode.commands.registerCommand('vscodeMcpHost.writeWorkspaceConfig', async () => {
            await writeWorkspaceMcpConfig();
        })
    );

    // Auto-write a .vscode/mcp.json if the workspace doesn't have one yet.
    // Uses ${VSCODE_MCP_URL} so the file is stable across sessions.
    await writeWorkspaceMcpConfig({ skipIfExists: true });

    console.log(`[vscode-mcp-host] listening on ${serverUrl}`);
}

function buildMcpServer(): McpServer {
    const server = new McpServer({
        name: 'vscode-mcp-host',
        version: '0.0.1',
    });

    // Example tool: return the file focused in THIS window.
    // This is the whole point — scoping context to the window the CLI is in.
    server.registerTool(
        'get_active_file',
        {
            title: 'Get active file',
            description: 'Path of the file currently focused in this VSCode window.',
            inputSchema: {},
        },
        async () => {
            // Prefer the live value; fall back to lastActiveFile when the
            // terminal has focus and activeTextEditor is undefined.
            const file =
                vscode.window.activeTextEditor?.document.uri.fsPath ??
                lastActiveFile ??
                '(no active editor)';
            return { content: [{ type: 'text', text: file }] };
        }
    );

    server.registerTool(
        'get_problems',
        {
            title: 'Get Problems',
            description:
                'Returns all diagnostics (errors, warnings, hints) shown in the VS Code Problems panel, optionally filtered to a specific file path.',
            inputSchema: { file: z.string().optional() },
        },
        async ({ file }) => {
            const severityLabel = ['Error', 'Warning', 'Information', 'Hint'];
            const all = vscode.languages.getDiagnostics();
            const lines: string[] = [];
            for (const [uri, diags] of all) {
                if (file && !uri.fsPath.includes(file)) continue;
                for (const d of diags) {
                    const sev = severityLabel[d.severity] ?? 'Unknown';
                    const loc = `${uri.fsPath}:${d.range.start.line + 1}:${d.range.start.character + 1}`;
                    lines.push(`[${sev}] ${loc} — ${d.message}${d.source ? ` (${d.source})` : ''}`);
                }
            }
            const text = lines.length ? lines.join('\n') : '(no problems)';
            return { content: [{ type: 'text', text }] };
        }
    );

    server.registerTool(
        'list_workspace_folders',
        {
            title: 'List workspace folders',
            description: 'Workspace folders open in this VSCode window.',
            inputSchema: {},
        },
        async () => {
            const folders = vscode.workspace.workspaceFolders ?? [];
            const text = folders.length
                ? folders.map((f) => f.uri.fsPath).join('\n')
                : '(no workspace folders)';
            return { content: [{ type: 'text', text }] };
        }
    );

    server.registerTool(
        'show_message',
        {
            title: 'Show a VSCode notification',
            description: 'Pops a notification in this VSCode window.',
            inputSchema: { message: z.string() },
        },
        async ({ message }) => {
            vscode.window.showInformationMessage(message);
            return { content: [{ type: 'text', text: 'ok' }] };
        }
    );

    return server;
}

async function writeWorkspaceMcpConfig(opts: { skipIfExists?: boolean } = {}) {
    const folder = vscode.workspace.workspaceFolders?.[0];
    if (!folder) return;
    const dir = path.join(folder.uri.fsPath, '.vscode');
    const file = path.join(dir, 'mcp.json');
    if (opts.skipIfExists) {
        try {
            await fs.access(file);
            return; // already exists, leave it alone
        } catch {
            /* fall through */
        }
    }
    await fs.mkdir(dir, { recursive: true });
    const config = {
        servers: {
            'vscode-window': {
                type: 'http',
                url: '${env:VSCODE_MCP_URL}',
            },
        },
    };
    await fs.writeFile(file, JSON.stringify(config, null, 2) + '\n', 'utf8');
}

export async function deactivate() {
    await new Promise<void>((resolve) => {
        if (!httpServer) return resolve();
        httpServer.close(() => resolve());
    });
    httpServer = undefined;
}
