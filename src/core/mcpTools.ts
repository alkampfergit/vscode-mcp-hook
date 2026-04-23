import { type DiagnosticItem, type VscodeAdapter } from '../adapters/vscodeAdapter.js';

export class McpTools {
    constructor(
        private readonly vscode: VscodeAdapter,
        private lastActiveFile: string | undefined,
    ) {}

    updateLastActiveFile(filePath: string): void {
        this.lastActiveFile = filePath;
    }

    getActiveFile(): string {
        const file = this.vscode.getActiveFilePath() ?? this.lastActiveFile;
        return file ?? '(no active editor)';
    }

    getProblems(file?: string): string {
        const items = this.vscode.getDiagnostics();
        const filtered = file ? items.filter((d) => d.filePath.includes(file)) : items;
        return formatDiagnostics(filtered);
    }

    listWorkspaceFolders(): string {
        const paths = this.vscode.getWorkspaceFolderPaths();
        return paths.length ? paths.join('\n') : '(no workspace folders)';
    }

    showMessage(message: string): void {
        this.vscode.showInformationMessage(message);
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
