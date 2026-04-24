import { TOOL_NAME, register } from '../../src/tools/getActiveFile.js';
import { makeMockServer, makeMockTools } from './_helpers.js';

describe('getActiveFile tool', () => {
    it('registers a tool named get_active_file', () => {
        const { server, calls } = makeMockServer();
        register(server, makeMockTools());
        expect(calls).toHaveLength(1);
        expect(calls[0].name).toBe(TOOL_NAME);
    });

    it('handler returns the active file path from McpTools', async () => {
        const { server, calls } = makeMockServer();
        const tools = makeMockTools({ getActiveFile: jest.fn(() => '/workspace/foo.ts') });
        register(server, tools);
        const result = await calls[0].handler({});
        expect(result.content[0].text).toBe('/workspace/foo.ts');
    });

    it('handler returns fallback string when no file is active', async () => {
        const { server, calls } = makeMockServer();
        const tools = makeMockTools({ getActiveFile: jest.fn(() => '(no active editor)') });
        register(server, tools);
        const result = await calls[0].handler({});
        expect(result.content[0].text).toBe('(no active editor)');
    });

    it('handler result has text content type', async () => {
        const { server, calls } = makeMockServer();
        register(server, makeMockTools());
        const result = await calls[0].handler({});
        expect(result.content[0].type).toBe('text');
    });
});
