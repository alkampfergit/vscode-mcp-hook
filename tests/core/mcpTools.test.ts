import { McpTools, formatDiagnostics } from '../../src/core/mcpTools.js';
import { type VscodeAdapter, type DiagnosticItem } from '../../src/adapters/vscodeAdapter.js';

function makeAdapter(overrides: Partial<VscodeAdapter> = {}): VscodeAdapter {
    return {
        getDiagnostics: () => [],
        ...overrides,
    };
}

describe('McpTools.getProblems', () => {
    const diags: DiagnosticItem[] = [
        { filePath: '/foo/bar.ts', severity: 'Error', line: 10, character: 5, message: 'Cannot find name', source: 'ts' },
        { filePath: '/foo/baz.ts', severity: 'Warning', line: 3, character: 1, message: 'Unused variable' },
        { filePath: '/foo/qux.ts', severity: 'Information', line: 1, character: 1, message: 'Info message' },
        { filePath: '/foo/quux.ts', severity: 'Hint', line: 2, character: 2, message: 'Hint message' },
    ];

    it('returns errors and warnings when no filter', () => {
        const tools = new McpTools(makeAdapter({ getDiagnostics: () => diags }));
        const result = tools.getProblems();
        expect(result).toContain('[Error] /foo/bar.ts:10:5');
        expect(result).toContain('[Warning] /foo/baz.ts:3:1');
    });

    it('excludes Information and Hint diagnostics', () => {
        const tools = new McpTools(makeAdapter({ getDiagnostics: () => diags }));
        const result = tools.getProblems();
        expect(result).not.toContain('Information');
        expect(result).not.toContain('Hint');
    });

    it('filters by file path substring', () => {
        const tools = new McpTools(makeAdapter({ getDiagnostics: () => diags }));
        const result = tools.getProblems('bar.ts');
        expect(result).toContain('bar.ts');
        expect(result).not.toContain('baz.ts');
    });

    it('returns no problems when filter matches nothing', () => {
        const tools = new McpTools(makeAdapter({ getDiagnostics: () => diags }));
        expect(tools.getProblems('nonexistent.ts')).toBe('(no problems)');
    });

    it('returns no problems when all diagnostics are below Error/Warning', () => {
        const infoOnly: DiagnosticItem[] = [
            { filePath: '/foo/a.ts', severity: 'Information', line: 1, character: 1, message: 'info' },
            { filePath: '/foo/b.ts', severity: 'Hint', line: 1, character: 1, message: 'hint' },
        ];
        const tools = new McpTools(makeAdapter({ getDiagnostics: () => infoOnly }));
        expect(tools.getProblems()).toBe('(no problems)');
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
