import * as fs from 'node:fs/promises';
import * as path from 'node:path';

export const SERVER_NAME = 'vscode-mcp-hook';
const VSCODE_ENV_URL = '${env:VSCODE_MCP_URL}';
const CLI_ENV_URL = '${VSCODE_MCP_URL}';

type JsonObject = Record<string, unknown>;

interface ConfigLocation {
    filePath: string;
    serverKey: 'servers' | 'mcpServers';
}

function isJsonObject(value: unknown): value is JsonObject {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function readJsonObject(filePath: string): Promise<JsonObject> {
    try {
        const content = await fs.readFile(filePath, 'utf8');
        const parsed: unknown = JSON.parse(content);
        return isJsonObject(parsed) ? parsed : {};
    } catch (err) {
        if ((err as NodeJS.ErrnoException).code === 'ENOENT') return {};
        throw err;
    }
}

async function readExistingJsonObject(filePath: string): Promise<JsonObject | undefined> {
    try {
        const content = await fs.readFile(filePath, 'utf8');
        const parsed: unknown = JSON.parse(content);
        return isJsonObject(parsed) ? parsed : undefined;
    } catch {
        return undefined;
    }
}

function buildCurrentUrlComment(currentServerUrl: string): string {
    return [
        `Current URL: ${currentServerUrl}.`,
        'Keep the url field as the environment variable for the current VS Code window.',
        'To pin the server port, replace url with this literal URL in both .vscode/mcp.json and .mcp.json.',
    ].join(' ');
}

function upsertServer(
    config: JsonObject,
    serverKey: ConfigLocation['serverKey'],
    configUrl: string,
    currentServerUrl: string,
): JsonObject {
    const existingServers = isJsonObject(config[serverKey]) ? config[serverKey] : {};
    const existingServer = isJsonObject(existingServers[SERVER_NAME]) ? existingServers[SERVER_NAME] : {};

    return {
        ...config,
        [serverKey]: {
            ...existingServers,
            [SERVER_NAME]: {
                ...existingServer,
                type: 'http',
                url: configUrl,
                _comment: buildCurrentUrlComment(currentServerUrl),
            },
        },
    };
}

async function writeMcpConfigFile(location: ConfigLocation, configUrl: string, currentServerUrl: string): Promise<void> {
    const config = await readJsonObject(location.filePath);
    await fs.writeFile(
        location.filePath,
        JSON.stringify(upsertServer(config, location.serverKey, configUrl, currentServerUrl), null, 2) + '\n',
        'utf8',
    );
}

function readServerUrl(config: JsonObject, serverKey: ConfigLocation['serverKey']): string | undefined {
    const servers = config[serverKey];
    if (!isJsonObject(servers)) return undefined;

    const server = servers[SERVER_NAME];
    if (!isJsonObject(server)) return undefined;

    const url = server.url;
    return typeof url === 'string' ? url : undefined;
}

function isLiteralUrl(url: string): boolean {
    return !url.includes('${');
}

function getConfigLocations(rootPath: string): ConfigLocation[] {
    return [
        { filePath: path.join(rootPath, '.vscode', 'mcp.json'), serverKey: 'servers' },
        { filePath: path.join(rootPath, '.mcp.json'), serverKey: 'mcpServers' },
    ];
}

export async function readConfiguredMcpServerUrl(rootPath: string): Promise<string | undefined> {
    const literalUrls: string[] = [];

    for (const location of getConfigLocations(rootPath)) {
        const config = await readExistingJsonObject(location.filePath);
        if (!config) continue;

        const url = readServerUrl(config, location.serverKey);
        if (url && isLiteralUrl(url)) literalUrls.push(url);
    }

    const ports = new Set(literalUrls.map(readPortFromMcpServerUrl).filter((port): port is number => port !== undefined));
    if (ports.size > 1) {
        throw new Error('Conflicting vscode-mcp-hook ports found in .vscode/mcp.json and .mcp.json');
    }

    return literalUrls[0];
}

export function readPortFromMcpServerUrl(serverUrl: string): number | undefined {
    try {
        const url = new URL(serverUrl);
        if (url.hostname !== '127.0.0.1' && url.hostname !== 'localhost') return undefined;
        const port = Number.parseInt(url.port, 10);
        return Number.isInteger(port) && port > 0 && port <= 65535 ? port : undefined;
    } catch {
        return undefined;
    }
}

export async function writeVscodeMcpConfig(rootPath: string, currentServerUrl: string): Promise<void> {
    const vscodeDir = path.join(rootPath, '.vscode');
    await fs.mkdir(vscodeDir, { recursive: true });
    await writeMcpConfigFile(
        { filePath: path.join(vscodeDir, 'mcp.json'), serverKey: 'servers' },
        VSCODE_ENV_URL,
        currentServerUrl,
    );
}

export async function writeCliMcpConfig(rootPath: string, currentServerUrl: string): Promise<void> {
    const vscodeDir = path.join(rootPath, '.vscode');
    await fs.mkdir(vscodeDir, { recursive: true });

    await writeMcpConfigFile(
        { filePath: path.join(vscodeDir, 'mcp.json'), serverKey: 'servers' },
        VSCODE_ENV_URL,
        currentServerUrl,
    );
    await writeMcpConfigFile(
        { filePath: path.join(rootPath, '.mcp.json'), serverKey: 'mcpServers' },
        CLI_ENV_URL,
        currentServerUrl,
    );
}
