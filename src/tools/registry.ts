import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpTools } from '../core/mcpTools.js';
import { register as registerGetActiveFile } from './getActiveFile.js';
import { register as registerGetProblems } from './getProblems.js';
import { register as registerListWorkspaceFolders } from './listWorkspaceFolders.js';
import { register as registerShowMessage } from './showMessage.js';

export function registerAllTools(server: McpServer, tools: McpTools): void {
    registerGetActiveFile(server, tools);
    registerGetProblems(server, tools);
    registerListWorkspaceFolders(server, tools);
    registerShowMessage(server, tools);
}
