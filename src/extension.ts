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

export async function activate(context: vscode.ExtensionContext) {
    const adapter = new LiveVscodeAdapter();
    const tools = new McpTools(adapter, adapter.getActiveFilePath());

    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor((editor) => {
            if (editor) tools.updateLastActiveFile(editor.document.uri.fsPath);
        }),
    );

    const transport = createTransport();
    const mcp = buildMcpServer(tools);
    await mcp.connect(transport);

    const workspaceRoot = adapter.getFirstWorkspaceRoot();
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
            const root = adapter.getFirstWorkspaceRoot();
            if (root) await writeCliMcpConfig(root, serverUrl!);
            vscode.window.showInformationMessage('MCP config files written.');
        }),
    );

    // Signal VS Code that MCP definitions are ready. Without this, extensions
    // that started before us (e.g. Claude Code) won't re-query our provider
    // and the server won't appear until the window is reloaded.
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
