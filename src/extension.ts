import * as vscode from 'vscode';
import { LiveVscodeAdapter } from './adapters/vscodeAdapter.js';
import { McpTools } from './core/mcpTools.js';
import {
    readConfiguredMcpServerUrl,
    readPortFromMcpServerUrl,
    writeCliMcpConfig,
} from './core/configWriter.js';
import { createMcpHttpServer, startHttpServer, stopHttpServer } from './server/httpServer.js';
import { buildMcpServer, createTransport } from './server/mcpServer.js';
import type { Logger } from './logger.js';

let _httpServer: ReturnType<typeof createMcpHttpServer> | undefined;
let serverUrl: string | undefined;

function getFirstWorkspaceRoot(): string | undefined {
    return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
}

function errorDetail(err: unknown): string {
    if (err instanceof Error) return err.message;
    if (typeof err === 'string') return err;
    return '';
}

function makeLogger(channel: vscode.OutputChannel): Logger {
    return {
        log(message: string) {
            const line = `[${new Date().toISOString()}] ${message}`;
            channel.appendLine(line);
            console.log(line);
        },
        error(message: string, err?: unknown) {
            const detail = errorDetail(err);
            const line = `[${new Date().toISOString()}] ERROR ${message}${detail ? ': ' + detail : ''}`;
            channel.appendLine(line);
            console.error(line);
        },
    };
}

export async function activate(context: vscode.ExtensionContext) {
    const channel = vscode.window.createOutputChannel('MCP Hook');
    context.subscriptions.push(channel);

    const logger = makeLogger(channel);
    logger.log('[extension] activating');

    const adapter = new LiveVscodeAdapter(logger);
    const tools = new McpTools(adapter, logger);

    const transport = createTransport();
    const mcp = buildMcpServer(tools);
    await mcp.connect(transport);
    logger.log('[extension] MCP server connected to transport');

    const workspaceRoot = getFirstWorkspaceRoot();
    logger.log(`[extension] workspace root: ${workspaceRoot ?? '(none)'}`);
    const configuredUrl = workspaceRoot ? await readConfiguredMcpServerUrl(workspaceRoot) : undefined;
    const configuredPort = configuredUrl ? readPortFromMcpServerUrl(configuredUrl) : undefined;

    _httpServer = createMcpHttpServer(transport);
    const port = await startHttpServer(_httpServer, configuredPort);
    serverUrl = `http://127.0.0.1:${port}/mcp`;
    logger.log(`[extension] HTTP server listening on ${serverUrl}`);

    process.env['VSCODE_MCP_URL'] = serverUrl;

    const envCol = context.environmentVariableCollection;
    envCol.persistent = false;
    envCol.description = 'MCP server URL for this VSCode window';
    envCol.replace('VSCODE_MCP_URL', serverUrl);

    const emitter = new vscode.EventEmitter<void>();
    context.subscriptions.push(
        emitter,
        vscode.lm.registerMcpServerDefinitionProvider('vscode-mcp-hook.server', {
            onDidChangeMcpServerDefinitions: emitter.event,
            provideMcpServerDefinitions() {
                return [new vscode.McpHttpServerDefinition('vscode-mcp-hook', vscode.Uri.parse(serverUrl!))];
            },
        }),
        vscode.commands.registerCommand('vscodeMcpHook.showInfo', () => {
            channel.show();
            vscode.window.showInformationMessage(`MCP server: ${serverUrl}`);
        }),
        vscode.commands.registerCommand('vscodeMcpHook.writeWorkspaceConfig', async () => {
            const root = getFirstWorkspaceRoot();
            if (root) {
                await writeCliMcpConfig(root, serverUrl!);
                logger.log(`[extension] wrote MCP config to ${root}`);
            }
            vscode.window.showInformationMessage('MCP config files written.');
        }),
    );

    emitter.fire();
    logger.log('[extension] activation complete');
}

export async function deactivate() {
    delete process.env['VSCODE_MCP_URL'];
    if (_httpServer) {
        await stopHttpServer(_httpServer);
        _httpServer = undefined;
    }
}
