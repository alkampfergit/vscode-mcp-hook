import { registerAllTools } from '../../src/tools/registry.js';
import { TOOL_NAME as GET_PROBLEMS } from '../../src/tools/getProblems.js';
import { makeMockServer, makeMockTools } from './_helpers.js';

describe('registerAllTools', () => {
    it('registers exactly 1 tool', () => {
        const { server, calls } = makeMockServer();
        registerAllTools(server, makeMockTools());
        expect(calls).toHaveLength(1);
    });

    it('registers all expected tool names', () => {
        const { server, calls } = makeMockServer();
        registerAllTools(server, makeMockTools());
        const names = calls.map((c) => c.name);
        expect(names).toContain(GET_PROBLEMS);
    });

    it('registers no duplicate tool names', () => {
        const { server, calls } = makeMockServer();
        registerAllTools(server, makeMockTools());
        const names = calls.map((c) => c.name);
        expect(new Set(names).size).toBe(names.length);
    });
});
