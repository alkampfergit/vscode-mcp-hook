import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpTools } from '../../src/core/mcpTools.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Handler = (args: Record<string, any>) => Promise<{ content: Array<{ type: string; text: string }> }>;

export interface ToolCall {
    name: string;
    config: unknown;
    handler: Handler;
}

export function makeMockServer(): { server: McpServer; calls: ToolCall[] } {
    const calls: ToolCall[] = [];
    const server = {
        registerTool(name: string, config: unknown, handler: Handler) {
            calls.push({ name, config, handler });
        },
    } as unknown as McpServer;
    return { server, calls };
}

export function makeMockTools(overrides: Partial<McpTools> = {}): McpTools {
    return {
        getActiveFile: jest.fn(() => '/path/to/file.ts'),
        getProblems: jest.fn((_file?: string) => '(no problems)'),
        listWorkspaceFolders: jest.fn(() => '(no workspace folders)'),
        showMessage: jest.fn(),
        updateLastActiveFile: jest.fn(),
        ...overrides,
    } as unknown as McpTools;
}
