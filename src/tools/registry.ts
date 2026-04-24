import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpTools } from '../core/mcpTools.js';
import { register as registerGetProblems } from './getProblems.js';

export function registerAllTools(server: McpServer, tools: McpTools): void {
    registerGetProblems(server, tools);
}
