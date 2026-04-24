import { TOOL_NAME, register } from '../../src/tools/showMessage.js';
import { makeMockServer, makeMockTools } from './_helpers.js';

describe('showMessage tool', () => {
    it('registers a tool named show_message', () => {
        const { server, calls } = makeMockServer();
        register(server, makeMockTools());
        expect(calls).toHaveLength(1);
        expect(calls[0].name).toBe(TOOL_NAME);
    });

    it('handler delegates message to McpTools.showMessage', async () => {
        const { server, calls } = makeMockServer();
        const showMessage = jest.fn();
        register(server, makeMockTools({ showMessage }));
        await calls[0].handler({ message: 'hello world' });
        expect(showMessage).toHaveBeenCalledWith('hello world');
    });

    it('handler returns "ok" on success', async () => {
        const { server, calls } = makeMockServer();
        register(server, makeMockTools());
        const result = await calls[0].handler({ message: 'test' });
        expect(result.content[0].text).toBe('ok');
    });

    it('handler result has text content type', async () => {
        const { server, calls } = makeMockServer();
        register(server, makeMockTools());
        const result = await calls[0].handler({ message: 'test' });
        expect(result.content[0].type).toBe('text');
    });
});
