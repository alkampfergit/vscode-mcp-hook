import { McpTools, formatDiagnostics } from '../../src/core/mcpTools.js';
import { type VscodeAdapter, type DiagnosticItem } from '../../src/adapters/vscodeAdapter.js';

function makeAdapter(overrides: Partial<VscodeAdapter> = {}): VscodeAdapter {
    return {
        getActiveFilePath: () => undefined,
        getDiagnostics: () => [],
        getWorkspaceFolderPaths: () => [],
        showInformationMessage: () => undefined,
        getFirstWorkspaceRoot: () => undefined,
        ...overrides,
    };
}

describe('McpTools.getActiveFile', () => {
    it('returns the current active file from the adapter', () => {
        const tools = new McpTools(makeAdapter({ getActiveFilePath: () => '/path/to/file.ts' }), undefined);
        expect(tools.getActiveFile()).toBe('/path/to/file.ts');
    });

    it('falls back to lastActiveFile when adapter returns undefined', () => {
        const tools = new McpTools(makeAdapter(), '/last/active.ts');
        expect(tools.getActiveFile()).toBe('/last/active.ts');
    });

    it('returns fallback string when no file is known', () => {
        const tools = new McpTools(makeAdapter(), undefined);
        expect(tools.getActiveFile()).toBe('(no active editor)');
    });

    it('updates lastActiveFile via updateLastActiveFile', () => {
        const tools = new McpTools(makeAdapter(), undefined);
        tools.updateLastActiveFile('/new/file.ts');
        expect(tools.getActiveFile()).toBe('/new/file.ts');
    });
});

describe('McpTools.getProblems', () => {
    const diags: DiagnosticItem[] = [
        { filePath: '/foo/bar.ts', severity: 'Error', line: 10, character: 5, message: 'Cannot find name', source: 'ts' },
        { filePath: '/foo/baz.ts', severity: 'Warning', line: 3, character: 1, message: 'Unused variable' },
    ];

    it('returns all problems when no filter', () => {
        const tools = new McpTools(makeAdapter({ getDiagnostics: () => diags }), undefined);
        const result = tools.getProblems();
        expect(result).toContain('[Error] /foo/bar.ts:10:5');
        expect(result).toContain('[Warning] /foo/baz.ts:3:1');
    });

    it('filters by file path substring', () => {
        const tools = new McpTools(makeAdapter({ getDiagnostics: () => diags }), undefined);
        const result = tools.getProblems('bar.ts');
        expect(result).toContain('bar.ts');
        expect(result).not.toContain('baz.ts');
    });

    it('returns no problems when filter matches nothing', () => {
        const tools = new McpTools(makeAdapter({ getDiagnostics: () => diags }), undefined);
        expect(tools.getProblems('nonexistent.ts')).toBe('(no problems)');
    });
});

describe('McpTools.listWorkspaceFolders', () => {
    it('returns joined paths', () => {
        const tools = new McpTools(makeAdapter({ getWorkspaceFolderPaths: () => ['/a', '/b'] }), undefined);
        expect(tools.listWorkspaceFolders()).toBe('/a\n/b');
    });

    it('returns fallback when no folders', () => {
        const tools = new McpTools(makeAdapter(), undefined);
        expect(tools.listWorkspaceFolders()).toBe('(no workspace folders)');
    });
});

describe('McpTools.showMessage', () => {
    it('delegates to the adapter', () => {
        const showInformationMessage = jest.fn();
        const tools = new McpTools(makeAdapter({ showInformationMessage }), undefined);
        tools.showMessage('hello');
        expect(showInformationMessage).toHaveBeenCalledWith('hello');
    });
});

describe('formatDiagnostics', () => {
    it('returns no problems for empty array', () => {
        expect(formatDiagnostics([])).toBe('(no problems)');
    });

    it('includes source when present', () => {
        const result = formatDiagnostics([
            { filePath: '/f.ts', severity: 'Error', line: 1, character: 1, message: 'msg', source: 'ts' },
        ]);
        expect(result).toBe('[Error] /f.ts:1:1 — msg (ts)');
    });

    it('omits source when absent', () => {
        const result = formatDiagnostics([
            { filePath: '/f.ts', severity: 'Warning', line: 2, character: 3, message: 'warn' },
        ]);
        expect(result).toBe('[Warning] /f.ts:2:3 — warn');
    });
});
