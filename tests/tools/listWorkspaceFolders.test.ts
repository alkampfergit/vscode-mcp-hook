import { TOOL_NAME, register } from '../../src/tools/listWorkspaceFolders.js';
import { makeMockServer, makeMockTools } from './_helpers.js';

describe('listWorkspaceFolders tool', () => {
    it('registers a tool named list_workspace_folders', () => {
        const { server, calls } = makeMockServer();
        register(server, makeMockTools());
        expect(calls).toHaveLength(1);
        expect(calls[0].name).toBe(TOOL_NAME);
    });

    it('handler returns newline-joined folder paths', async () => {
        const { server, calls } = makeMockServer();
        const tools = makeMockTools({ listWorkspaceFolders: jest.fn(() => '/a\n/b\n/c') });
        register(server, tools);
        const result = await calls[0].handler({});
        expect(result.content[0].text).toBe('/a\n/b\n/c');
    });

    it('handler returns fallback string when workspace has no folders', async () => {
        const { server, calls } = makeMockServer();
        const tools = makeMockTools({ listWorkspaceFolders: jest.fn(() => '(no workspace folders)') });
        register(server, tools);
        const result = await calls[0].handler({});
        expect(result.content[0].text).toBe('(no workspace folders)');
    });

    it('handler result has text content type', async () => {
        const { server, calls } = makeMockServer();
        register(server, makeMockTools());
        const result = await calls[0].handler({});
        expect(result.content[0].type).toBe('text');
    });
});
