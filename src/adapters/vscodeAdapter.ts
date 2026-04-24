import * as vscode from 'vscode';
import type { Logger } from '../logger.js';

export interface DiagnosticItem {
    filePath: string;
    severity: string;
    line: number;
    character: number;
    message: string;
    source?: string;
}

export interface VscodeAdapter {
    getDiagnostics(): DiagnosticItem[];
    getGitModifiedFiles(): string[] | null;
    ensureFilesLoaded(paths: string[]): Promise<void>;
}

export class LiveVscodeAdapter implements VscodeAdapter {
    private static readonly severityLabel = ['Error', 'Warning', 'Information', 'Hint'];

    constructor(private readonly logger: Logger) {}

    getDiagnostics(): DiagnosticItem[] {
        const all = vscode.languages.getDiagnostics();
        this.logger.log(`[adapter] getDiagnostics: ${all.length} URIs with diagnostics`);
        const items: DiagnosticItem[] = [];
        for (const [uri, diags] of all) {
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
        this.logger.log(`[adapter] getDiagnostics: ${items.length} total diagnostic items`);
        return items;
    }

    getGitModifiedFiles(): string[] | null {
        const gitExt = vscode.extensions.getExtension('vscode.git');
        if (!gitExt) {
            this.logger.log('[adapter] getGitModifiedFiles: vscode.git extension not found');
            return null;
        }
        const api = gitExt.exports?.getAPI(1);
        if (!api) {
            this.logger.log('[adapter] getGitModifiedFiles: git API v1 not available');
            return null;
        }
        const repos: unknown[] = api.repositories ?? [];
        this.logger.log(`[adapter] getGitModifiedFiles: ${repos.length} repositories`);
        if (repos.length === 0) return null;
        const paths: string[] = [];
        for (const repo of repos) {
            const workingTree = (repo as { state: { workingTreeChanges: unknown[] } }).state.workingTreeChanges ?? [];
            const index = (repo as { state: { indexChanges: unknown[] } }).state.indexChanges ?? [];
            this.logger.log(`[adapter] getGitModifiedFiles: workingTree=${workingTree.length} index=${index.length}`);
            for (const change of [...workingTree, ...index]) {
                const fsPath = (change as { uri: vscode.Uri }).uri?.fsPath;
                if (fsPath) paths.push(fsPath);
            }
        }
        const unique = [...new Set(paths)];
        this.logger.log(`[adapter] getGitModifiedFiles: ${unique.length} unique modified files: ${unique.join(', ')}`);
        return unique.length > 0 ? unique : null;
    }

    async ensureFilesLoaded(paths: string[]): Promise<void> {
        this.logger.log(`[adapter] ensureFilesLoaded: opening ${paths.length} files to trigger diagnostics`);
        const promises = paths.map(async (p) => {
            const wasLoaded = vscode.workspace.textDocuments.some((doc) => doc.uri.fsPath === p);
            this.logger.log(`[adapter] ensureFilesLoaded: before open path=${p} loaded=${wasLoaded}`);
            try {
                const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(p));
                const isLoaded = vscode.workspace.textDocuments.some((loadedDoc) => loadedDoc.uri.fsPath === p);
                this.logger.log(
                    `[adapter] ensureFilesLoaded: opened path=${p} documentPath=${doc.uri.fsPath} language=${doc.languageId} version=${doc.version} loaded=${isLoaded}`,
                );
            } catch (err) {
                this.logger.error(`[adapter] ensureFilesLoaded: failed to open ${p}`, err);
            }
        });
        await Promise.all(promises);
        // Give language servers a moment to publish diagnostics for newly loaded files.
        await new Promise<void>((resolve) => setTimeout(resolve, 500));
        this.logger.log('[adapter] ensureFilesLoaded: settle wait done');
    }
}
