import { type DiagnosticItem, type VscodeAdapter } from '../adapters/vscodeAdapter.js';
import { type Logger, nullLogger } from '../logger.js';

const INCLUDED_SEVERITIES = new Set(['Error', 'Warning']);

export class McpTools {
    constructor(
        private readonly vscode: VscodeAdapter,
        private readonly logger: Logger = nullLogger,
    ) {}

    async getProblems(file?: string, scope?: 'git'): Promise<string> {
        const fileLabel = file ?? '(none)';
        const scopeLabel = scope ?? '(none)';
        this.logger.log(`[mcpTools] getProblems called — file=${fileLabel} scope=${scopeLabel}`);

        let gitPaths: Set<string> | null = null;
        const modified = await this.vscode.getGitModifiedFiles();
        if (modified === null) {
            this.logger.log('[mcpTools] getProblems: git modified files unavailable');
            if (scope === 'git') {
                this.logger.log('[mcpTools] getProblems: git not available, returning sentinel');
                return '(git integration not available)';
            }
        } else {
            this.logger.log(
                `[mcpTools] getProblems: loading ${modified.length} git-modified files before reading diagnostics`,
            );
            for (const [index, path] of modified.entries()) {
                this.logger.log(`[mcpTools] getProblems: git file[${index}]=${path}`);
            }
            await this.vscode.ensureFilesLoaded(modified);
            this.logger.log('[mcpTools] getProblems: git-modified file loading completed');
            if (scope === 'git') {
                gitPaths = new Set(modified.map((path) => normalizePathForCompare(path)));
            } else {
                this.logger.log('[mcpTools] getProblems: scope is not git, using git files only to trigger diagnostics');
            }
        }

        const items = this.vscode.getDiagnostics();
        this.logger.log(`[mcpTools] getProblems: ${items.length} raw diagnostic items`);
        for (const [index, item] of items.entries()) {
            this.logger.log(`[mcpTools] getProblems: raw diagnostic[${index}] ${formatDiagnosticForLog(item)}`);
        }

        const diagnosticPaths = new Set(items.map((diagnostic) => normalizePathForCompare(diagnostic.filePath)));
        if (gitPaths) {
            for (const path of gitPaths) {
                this.logger.log(
                    `[mcpTools] getProblems: git file diagnostic presence path=${path} hasDiagnostics=${diagnosticPaths.has(path)}`,
                );
            }
        }

        const filtered: DiagnosticItem[] = [];
        for (const item of items) {
            const severityIncluded = INCLUDED_SEVERITIES.has(item.severity);
            const normalizedItemPath = normalizePathForCompare(item.filePath);
            const fileMatches = file
                ? normalizedItemPath.includes(normalizePathForCompare(file, isWindowsLikePath(normalizedItemPath)))
                : true;
            const gitMatches = gitPaths ? gitPaths.has(normalizedItemPath) : true;
            const keep = severityIncluded && fileMatches && gitMatches;
            this.logger.log(
                `[mcpTools] getProblems: filter decision keep=${keep} severityIncluded=${severityIncluded} fileMatches=${fileMatches} gitMatches=${gitMatches} ${formatDiagnosticForLog(item)}`,
            );
            if (keep) {
                filtered.push(item);
            }
        }

        this.logger.log(`[mcpTools] getProblems: ${filtered.length} items after filtering`);
        return formatDiagnostics(filtered);
    }
}

export function formatDiagnostics(items: DiagnosticItem[]): string {
    if (!items.length) return '(no problems)';
    return items
        .map(
            (d) =>
                `[${d.severity}] ${d.filePath}:${d.line}:${d.character} — ${d.message}${d.source ? ` (${d.source})` : ''}`,
        )
        .join('\n');
}

function formatDiagnosticForLog(item: DiagnosticItem): string {
    const source = item.source ? ` source=${item.source}` : '';
    return `severity=${item.severity} path=${item.filePath}:${item.line}:${item.character}${source} message=${item.message}`;
}

function normalizePathForCompare(value: string, forceCaseInsensitive = false): string {
    const normalized = value.replace(/\\/g, '/');
    return forceCaseInsensitive || isWindowsLikePath(normalized) ? normalized.toLocaleLowerCase() : normalized;
}

function isWindowsLikePath(value: string): boolean {
    return /^[a-z]:\//i.test(value);
}
