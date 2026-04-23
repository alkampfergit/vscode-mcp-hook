import * as vscode from 'vscode';

export interface DiagnosticItem {
    filePath: string;
    severity: string;
    line: number;
    character: number;
    message: string;
    source?: string;
}

export interface VscodeAdapter {
    getActiveFilePath(): string | undefined;
    getDiagnostics(): DiagnosticItem[];
    getWorkspaceFolderPaths(): string[];
    showInformationMessage(message: string): void;
    getFirstWorkspaceRoot(): string | undefined;
}

export class LiveVscodeAdapter implements VscodeAdapter {
    private static readonly severityLabel = ['Error', 'Warning', 'Information', 'Hint'];

    getActiveFilePath(): string | undefined {
        return vscode.window.activeTextEditor?.document.uri.fsPath;
    }

    getDiagnostics(): DiagnosticItem[] {
        const items: DiagnosticItem[] = [];
        for (const [uri, diags] of vscode.languages.getDiagnostics()) {
            for (const d of diags) {
                items.push({
                    filePath: uri.fsPath,
                    severity: LiveVscodeAdapter.severityLabel[d.severity] ?? 'Unknown',
                    line: d.range.start.line + 1,
                    character: d.range.start.character + 1,
                    message: d.message,
                    source: d.source,
                });
            }
        }
        return items;
    }

    getWorkspaceFolderPaths(): string[] {
        return (vscode.workspace.workspaceFolders ?? []).map((f) => f.uri.fsPath);
    }

    showInformationMessage(message: string): void {
        vscode.window.showInformationMessage(message);
    }

    getFirstWorkspaceRoot(): string | undefined {
        return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    }
}
