import { McpTools, formatDiagnostics } from '../../src/core/mcpTools.js';
import { type VscodeAdapter, type DiagnosticItem } from '../../src/adapters/vscodeAdapter.js';

function makeAdapter(overrides: Partial<VscodeAdapter> = {}): VscodeAdapter {
    return {
        getDiagnostics: () => [],
        getGitModifiedFiles: () => null,
        ensureFilesLoaded: async () => undefined,
        ...overrides,
    };
}

function makeLogger(): { log: jest.Mock<void, [string]>; error: jest.Mock<void, [string, unknown?]> } {
    return {
        log: jest.fn<void, [string]>(),
        error: jest.fn<void, [string, unknown?]>(),
    };
}

describe('McpTools.getProblems', () => {
    const diags: DiagnosticItem[] = [
        { filePath: '/foo/bar.ts', severity: 'Error', line: 10, character: 5, message: 'Cannot find name', source: 'ts' },
        { filePath: '/foo/baz.ts', severity: 'Warning', line: 3, character: 1, message: 'Unused variable' },
        { filePath: '/foo/qux.ts', severity: 'Information', line: 1, character: 1, message: 'Info message' },
        { filePath: '/foo/quux.ts', severity: 'Hint', line: 2, character: 2, message: 'Hint message' },
    ];

    it('returns errors and warnings when no filter', async () => {
        const tools = new McpTools(makeAdapter({ getDiagnostics: () => diags }));
        const result = await tools.getProblems();
        expect(result).toContain('[Error] /foo/bar.ts:10:5');
        expect(result).toContain('[Warning] /foo/baz.ts:3:1');
    });

    it('excludes Information and Hint diagnostics', async () => {
        const tools = new McpTools(makeAdapter({ getDiagnostics: () => diags }));
        const result = await tools.getProblems();
        expect(result).not.toContain('Information');
        expect(result).not.toContain('Hint');
    });

    it('filters by file path substring', async () => {
        const tools = new McpTools(makeAdapter({ getDiagnostics: () => diags }));
        const result = await tools.getProblems('bar.ts');
        expect(result).toContain('bar.ts');
        expect(result).not.toContain('baz.ts');
    });

    it('returns no problems when filter matches nothing', async () => {
        const tools = new McpTools(makeAdapter({ getDiagnostics: () => diags }));
        expect(await tools.getProblems('nonexistent.ts')).toBe('(no problems)');
    });

    it('returns no problems when all diagnostics are below Error/Warning', async () => {
        const infoOnly: DiagnosticItem[] = [
            { filePath: '/foo/a.ts', severity: 'Information', line: 1, character: 1, message: 'info' },
            { filePath: '/foo/b.ts', severity: 'Hint', line: 1, character: 1, message: 'hint' },
        ];
        const tools = new McpTools(makeAdapter({ getDiagnostics: () => infoOnly }));
        expect(await tools.getProblems()).toBe('(no problems)');
    });

    it('returns git-unavailable sentinel when scope=git and no git integration', async () => {
        const tools = new McpTools(makeAdapter({ getDiagnostics: () => diags, getGitModifiedFiles: () => null }));
        expect(await tools.getProblems(undefined, 'git')).toBe('(git integration not available)');
    });

    it('filters to only git-modified files when scope=git', async () => {
        const tools = new McpTools(
            makeAdapter({
                getDiagnostics: () => diags,
                getGitModifiedFiles: () => ['/foo/bar.ts'],
            }),
        );
        const result = await tools.getProblems(undefined, 'git');
        expect(result).toContain('bar.ts');
        expect(result).not.toContain('baz.ts');
    });

    it('combines file filter and git scope', async () => {
        const tools = new McpTools(
            makeAdapter({
                getDiagnostics: () => diags,
                getGitModifiedFiles: () => ['/foo/bar.ts', '/foo/baz.ts'],
            }),
        );
        const result = await tools.getProblems('bar.ts', 'git');
        expect(result).toContain('bar.ts');
        expect(result).not.toContain('baz.ts');
    });

    it('returns no problems when git-modified set is empty', async () => {
        const tools = new McpTools(
            makeAdapter({
                getDiagnostics: () => diags,
                getGitModifiedFiles: () => null,
            }),
        );
        expect(await tools.getProblems(undefined, 'git')).toBe('(git integration not available)');
    });

    it('logs git path loading, diagnostic presence, and filter decisions', async () => {
        const logger = makeLogger();
        const tools = new McpTools(
            makeAdapter({
                getDiagnostics: () => diags,
                getGitModifiedFiles: () => ['/foo/bar.ts', '/foo/missing.ts'],
            }),
            logger,
        );

        await tools.getProblems(undefined, 'git');

        const messages = logger.log.mock.calls.map(([message]) => message);
        expect(messages).toContain('[mcpTools] getProblems: git file[0]=/foo/bar.ts');
        expect(messages).toContain('[mcpTools] getProblems: git file[1]=/foo/missing.ts');
        expect(messages).toContain('[mcpTools] getProblems: git-modified file loading completed');
        expect(messages).toContain(
            '[mcpTools] getProblems: git file diagnostic presence path=/foo/bar.ts hasDiagnostics=true',
        );
        expect(messages).toContain(
            '[mcpTools] getProblems: git file diagnostic presence path=/foo/missing.ts hasDiagnostics=false',
        );
        expect(messages).toEqual(
            expect.arrayContaining([
                expect.stringContaining(
                    'filter decision keep=true severityIncluded=true fileMatches=true gitMatches=true severity=Error path=/foo/bar.ts:10:5',
                ),
                expect.stringContaining(
                    'filter decision keep=false severityIncluded=true fileMatches=true gitMatches=false severity=Warning path=/foo/baz.ts:3:1',
                ),
            ]),
        );
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
