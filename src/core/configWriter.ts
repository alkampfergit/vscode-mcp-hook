import * as fs from 'node:fs/promises';
import * as path from 'node:path';

export const SERVER_NAME = 'vscode-mcp-hook';

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

function upsertServer(config: JsonObject, serverKey: ConfigLocation['serverKey'], serverUrl: string): JsonObject {
    const existingServers = isJsonObject(config[serverKey]) ? config[serverKey] : {};
    const existingServer = isJsonObject(existingServers[SERVER_NAME]) ? existingServers[SERVER_NAME] : {};

    return {
        ...config,
        [serverKey]: {
            ...existingServers,
            [SERVER_NAME]: {
                ...existingServer,
                type: 'http',
                url: serverUrl,
            },
        },
    };
}

async function writeMcpConfigFile(location: ConfigLocation, serverUrl: string): Promise<void> {
    const config = await readJsonObject(location.filePath);
    await fs.writeFile(
        location.filePath,
        JSON.stringify(upsertServer(config, location.serverKey, serverUrl), null, 2) + '\n',
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
    for (const location of getConfigLocations(rootPath)) {
        const config = await readExistingJsonObject(location.filePath);
        if (!config) continue;

        const url = readServerUrl(config, location.serverKey);
        if (url && isLiteralUrl(url)) return url;
    }

    return undefined;
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

export async function writeVscodeMcpConfig(rootPath: string, serverUrl: string): Promise<void> {
    const vscodeDir = path.join(rootPath, '.vscode');
    await fs.mkdir(vscodeDir, { recursive: true });
    await writeMcpConfigFile({ filePath: path.join(vscodeDir, 'mcp.json'), serverKey: 'servers' }, serverUrl);
}

export async function writeCliMcpConfig(rootPath: string, serverUrl: string): Promise<void> {
    const vscodeDir = path.join(rootPath, '.vscode');
    await fs.mkdir(vscodeDir, { recursive: true });

    await writeMcpConfigFile({ filePath: path.join(vscodeDir, 'mcp.json'), serverKey: 'servers' }, serverUrl);
    await writeMcpConfigFile({ filePath: path.join(rootPath, '.mcp.json'), serverKey: 'mcpServers' }, serverUrl);
}
