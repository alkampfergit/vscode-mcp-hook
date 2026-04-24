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
        if (scope === 'git') {
            const modified = this.vscode.getGitModifiedFiles();
            if (modified === null) {
                this.logger.log('[mcpTools] getProblems: git not available, returning sentinel');
                return '(git integration not available)';
            }
            this.logger.log(`[mcpTools] getProblems: loading ${modified.length} git-modified files`);
            for (const [index, path] of modified.entries()) {
                this.logger.log(`[mcpTools] getProblems: git file[${index}]=${path}`);
            }
            await this.vscode.ensureFilesLoaded(modified);
            this.logger.log('[mcpTools] getProblems: git-modified file loading completed');
            gitPaths = new Set(modified);
        }

        const items = this.vscode.getDiagnostics();
        this.logger.log(`[mcpTools] getProblems: ${items.length} raw diagnostic items`);
        for (const [index, item] of items.entries()) {
            this.logger.log(`[mcpTools] getProblems: raw diagnostic[${index}] ${formatDiagnosticForLog(item)}`);
        }

        const diagnosticPaths = new Set(items.map((d) => d.filePath));
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
            const fileMatches = file ? item.filePath.includes(file) : true;
            const gitMatches = gitPaths ? gitPaths.has(item.filePath) : true;
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
