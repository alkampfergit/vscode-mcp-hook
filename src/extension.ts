import * as vscode from 'vscode';
import { LiveVscodeAdapter } from './adapters/vscodeAdapter.js';
import { McpTools } from './core/mcpTools.js';
import {
    readConfiguredMcpServerUrl,
    readPortFromMcpServerUrl,
    writeCliMcpConfig,
} from './core/configWriter.js';
import { createMcpHttpServer, startHttpServer, stopHttpServer } from './server/httpServer.js';
import { createStatelessRequestHandler } from './server/mcpServer.js';
import type { Logger } from './logger.js';

let _httpServer: ReturnType<typeof createMcpHttpServer> | undefined;
let serverUrl: string | undefined;

function getFirstWorkspaceRoot(): string | undefined {
    return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
}

function errorDetail(err: unknown): string {
    if (err instanceof Error) return `${err.message}\n${err.stack ?? ''}`;
    if (typeof err === 'string') return err;
    try { return JSON.stringify(err); } catch { return String(err); }
}

function makeLogger(channel: vscode.OutputChannel): Logger {
    return {
        log(message: string) {
            const line = `[${new Date().toISOString()}] ${message}`;
            channel.appendLine(line);
            console.log(line);
        },
        error(message: string, err?: unknown) {
            const detail = errorDetail(err ?? '');
            const line = `[${new Date().toISOString()}] ERROR ${message}${detail ? ': ' + detail : ''}`;
            channel.appendLine(line);
            console.error(line);
        },
    };
}

export async function activate(context: vscode.ExtensionContext) {
    const channel = vscode.window.createOutputChannel('MCP Hook');
    context.subscriptions.push(channel);
    channel.show(true); // reveal on activation so logs are visible immediately

    const logger = makeLogger(channel);
    logger.log(`[extension] ===== ACTIVATION START =====`);
    logger.log(`[extension] VS Code version: ${vscode.version}`);
    logger.log(`[extension] Extension version: ${context.extension.packageJSON.version ?? 'unknown'}`);
    logger.log(`[extension] Extension mode: ${context.extensionMode}`);
    logger.log(`[extension] vscode.lm available: ${typeof vscode.lm}`);
    logger.log(`[extension] vscode.lm.registerMcpServerDefinitionProvider available: ${typeof vscode.lm?.registerMcpServerDefinitionProvider}`);
    logger.log(`[extension] vscode.McpHttpServerDefinition available: ${typeof (vscode as unknown as Record<string, unknown>)['McpHttpServerDefinition']}`);

    try {
        logger.log('[extension] creating adapter and tools');
        const adapter = new LiveVscodeAdapter(logger);
        const tools = new McpTools(adapter, logger);
        logger.log('[extension] adapter and tools created');

        logger.log('[extension] building stateless MCP request handler');
        const mcpHandler = createStatelessRequestHandler(tools, logger);
        logger.log('[extension] MCP request handler ready (per-request server+transport)');

        const workspaceRoot = getFirstWorkspaceRoot();
        logger.log(`[extension] workspace root: ${workspaceRoot ?? '(none)'}`);
        logger.log(`[extension] workspace folders: ${JSON.stringify(vscode.workspace.workspaceFolders?.map(f => f.uri.toString()) ?? [])}`);

        const configuredUrl = workspaceRoot ? await readConfiguredMcpServerUrl(workspaceRoot) : undefined;
        logger.log(`[extension] configured URL from workspace: ${configuredUrl ?? '(none)'}`);
        const configuredPort = configuredUrl ? readPortFromMcpServerUrl(configuredUrl) : undefined;
        logger.log(`[extension] preferred port: ${configuredPort ?? '(none, will pick random)'}`);

        logger.log('[extension] creating HTTP server');
        _httpServer = createMcpHttpServer(mcpHandler);
        logger.log('[extension] starting HTTP server');
        const port = await startHttpServer(_httpServer, configuredPort);
        serverUrl = `http://127.0.0.1:${port}/mcp`;
        logger.log(`[extension] HTTP server listening on ${serverUrl}`);

        process.env['VSCODE_MCP_URL'] = serverUrl;
        logger.log(`[extension] set process.env.VSCODE_MCP_URL = ${serverUrl}`);

        const envCol = context.environmentVariableCollection;
        envCol.persistent = false;
        envCol.description = 'MCP server URL for this VSCode window';
        envCol.replace('VSCODE_MCP_URL', serverUrl);
        logger.log('[extension] environment variable collection updated');

        const emitter = new vscode.EventEmitter<void>();
        context.subscriptions.push(emitter);

        // registerMcpServerDefinitionProvider was added in VS Code 1.116; guard so
        // the extension still activates (and commands still work) on older builds.
        if (typeof vscode.lm?.registerMcpServerDefinitionProvider === 'function') {
            logger.log('[extension] registering MCP server definition provider');
            try {
                context.subscriptions.push(
                    vscode.lm.registerMcpServerDefinitionProvider('vscode-mcp-hook.server', {
                        onDidChangeMcpServerDefinitions: emitter.event,
                        provideMcpServerDefinitions() {
                            logger.log('[extension] provideMcpServerDefinitions called');
                            return [new vscode.McpHttpServerDefinition('vscode-mcp-hook', vscode.Uri.parse(serverUrl!))];
                        },
                    }),
                );
                logger.log('[extension] MCP server definition provider registered');
            } catch (err) {
                logger.error('[extension] failed to register MCP server definition provider', err);
            }
        } else {
            logger.log('[extension] vscode.lm.registerMcpServerDefinitionProvider not available — skipping (VS Code too old)');
        }

        logger.log('[extension] registering commands');
        context.subscriptions.push(
            vscode.commands.registerCommand('vscodeMcpHook.showInfo', () => {
                logger.log('[command] showInfo invoked');
                channel.show();
                vscode.window.showInformationMessage(`MCP server: ${serverUrl}`);
            }),
            vscode.commands.registerCommand('vscodeMcpHook.writeWorkspaceConfig', async () => {
                logger.log('[command] writeWorkspaceConfig invoked');
                const root = getFirstWorkspaceRoot();
                logger.log(`[command] workspace root: ${root ?? '(none)'}`);
                if (root) {
                    try {
                        await writeCliMcpConfig(root, serverUrl!);
                        logger.log(`[extension] wrote MCP config to ${root}`);
                    } catch (err) {
                        logger.error('[command] writeCliMcpConfig failed', err);
                        vscode.window.showErrorMessage(`Failed to write MCP config: ${errorDetail(err)}`);
                        return;
                    }
                }
                vscode.window.showInformationMessage('MCP config files written.');
            }),
        );
        logger.log('[extension] commands registered');

        emitter.fire();
        logger.log('[extension] ===== ACTIVATION COMPLETE =====');
    } catch (err) {
        logger.error('[extension] ===== ACTIVATION FAILED =====', err);
        // Re-throw so VS Code marks the extension as failed
        throw err;
    }
}

export async function deactivate() {
    delete process.env['VSCODE_MCP_URL'];
    if (_httpServer) {
        await stopHttpServer(_httpServer);
        _httpServer = undefined;
    }
}
