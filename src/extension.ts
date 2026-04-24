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

let _httpServer: ReturnType<typeof createMcpHttpServer> | undefined;
let serverUrl: string | undefined;

function getFirstWorkspaceRoot(): string | undefined {
    return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
}

export async function activate(context: vscode.ExtensionContext) {
    const adapter = new LiveVscodeAdapter();
    const tools = new McpTools(adapter);

    const transport = createTransport();
    const mcp = buildMcpServer(tools);
    await mcp.connect(transport);

    const workspaceRoot = getFirstWorkspaceRoot();
    const configuredUrl = workspaceRoot ? await readConfiguredMcpServerUrl(workspaceRoot) : undefined;
    const configuredPort = configuredUrl ? readPortFromMcpServerUrl(configuredUrl) : undefined;

    _httpServer = createMcpHttpServer(transport);
    const port = await startHttpServer(_httpServer, configuredPort);
    serverUrl = `http://127.0.0.1:${port}/mcp`;

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
            vscode.window.showInformationMessage(`MCP server: ${serverUrl}`);
        }),
        vscode.commands.registerCommand('vscodeMcpHook.writeWorkspaceConfig', async () => {
            const root = getFirstWorkspaceRoot();
            if (root) await writeCliMcpConfig(root, serverUrl!);
            vscode.window.showInformationMessage('MCP config files written.');
        }),
    );

    emitter.fire();

    console.log(`[vscode-mcp-hook] listening on ${serverUrl}`);
}

export async function deactivate() {
    delete process.env['VSCODE_MCP_URL'];
    if (_httpServer) {
        await stopHttpServer(_httpServer);
        _httpServer = undefined;
    }
}
