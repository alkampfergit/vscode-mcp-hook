import { TOOL_NAME, register } from '../../src/tools/getProblems.js';
import { makeMockServer, makeMockTools } from './_helpers.js';

describe('getProblems tool', () => {
    it('registers a tool named get_problems', () => {
        const { server, calls } = makeMockServer();
        register(server, makeMockTools());
        expect(calls).toHaveLength(1);
        expect(calls[0].name).toBe(TOOL_NAME);
    });

    it('handler passes no file filter when argument is absent', async () => {
        const { server, calls } = makeMockServer();
        const getProblems = jest.fn(() => Promise.resolve('[Error] /a.ts:1:1 — msg'));
        register(server, makeMockTools({ getProblems }));
        await calls[0].handler({});
        expect(getProblems).toHaveBeenCalledWith(undefined, undefined);
    });

    it('handler passes file filter to McpTools', async () => {
        const { server, calls } = makeMockServer();
        const getProblems = jest.fn(() => Promise.resolve('(no problems)'));
        register(server, makeMockTools({ getProblems }));
        await calls[0].handler({ file: 'src/foo.ts' });
        expect(getProblems).toHaveBeenCalledWith('src/foo.ts', undefined);
    });

    it('handler passes scope=git to McpTools', async () => {
        const { server, calls } = makeMockServer();
        const getProblems = jest.fn(() => Promise.resolve('[Error] /a.ts:1:1 — msg'));
        register(server, makeMockTools({ getProblems }));
        await calls[0].handler({ scope: 'git' });
        expect(getProblems).toHaveBeenCalledWith(undefined, 'git');
    });

    it('handler passes both file and scope to McpTools', async () => {
        const { server, calls } = makeMockServer();
        const getProblems = jest.fn(() => Promise.resolve('(no problems)'));
        register(server, makeMockTools({ getProblems }));
        await calls[0].handler({ file: 'src/foo.ts', scope: 'git' });
        expect(getProblems).toHaveBeenCalledWith('src/foo.ts', 'git');
    });

    it('handler returns the formatted diagnostics string', async () => {
        const { server, calls } = makeMockServer();
        const output = '[Error] /a.ts:1:1 — Cannot find name (ts)';
        register(server, makeMockTools({ getProblems: jest.fn(() => Promise.resolve(output)) }));
        const result = await calls[0].handler({});
        expect(result.content[0].text).toBe(output);
    });

    it('handler result has text content type', async () => {
        const { server, calls } = makeMockServer();
        register(server, makeMockTools());
        const result = await calls[0].handler({});
        expect(result.content[0].type).toBe('text');
    });
});
