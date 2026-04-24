import { registerAllTools } from '../../src/tools/registry.js';
import { TOOL_NAME as GET_ACTIVE_FILE } from '../../src/tools/getActiveFile.js';
import { TOOL_NAME as GET_PROBLEMS } from '../../src/tools/getProblems.js';
import { TOOL_NAME as LIST_WORKSPACE_FOLDERS } from '../../src/tools/listWorkspaceFolders.js';
import { TOOL_NAME as SHOW_MESSAGE } from '../../src/tools/showMessage.js';
import { makeMockServer, makeMockTools } from './_helpers.js';

describe('registerAllTools', () => {
    it('registers exactly 4 tools', () => {
        const { server, calls } = makeMockServer();
        registerAllTools(server, makeMockTools());
        expect(calls).toHaveLength(4);
    });

    it('registers all expected tool names', () => {
        const { server, calls } = makeMockServer();
        registerAllTools(server, makeMockTools());
        const names = calls.map((c) => c.name);
        expect(names).toContain(GET_ACTIVE_FILE);
        expect(names).toContain(GET_PROBLEMS);
        expect(names).toContain(LIST_WORKSPACE_FOLDERS);
        expect(names).toContain(SHOW_MESSAGE);
    });

    it('registers no duplicate tool names', () => {
        const { server, calls } = makeMockServer();
        registerAllTools(server, makeMockTools());
        const names = calls.map((c) => c.name);
        expect(new Set(names).size).toBe(names.length);
    });
});
