import { type DiagnosticItem, type VscodeAdapter } from '../adapters/vscodeAdapter.js';

const INCLUDED_SEVERITIES = new Set(['Error', 'Warning']);

export class McpTools {
    constructor(private readonly vscode: VscodeAdapter) {}

    getProblems(file?: string): string {
        const items = this.vscode.getDiagnostics();
        const filtered = items
            .filter((d) => INCLUDED_SEVERITIES.has(d.severity))
            .filter((d) => (file ? d.filePath.includes(file) : true));
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
