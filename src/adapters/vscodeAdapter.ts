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
    getGitModifiedFiles(): Promise<string[] | null>;
    ensureFilesLoaded(paths: string[]): Promise<void>;
}

export class LiveVscodeAdapter implements VscodeAdapter {
    private static readonly severityLabel = ['Error', 'Warning', 'Information', 'Hint'];
    private static readonly diagnosticsWaitMs = 2000;
    private static readonly diagnosticsPollMs = 100;

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

    async getGitModifiedFiles(): Promise<string[] | null> {
        const gitExt = vscode.extensions.getExtension('vscode.git');
        if (!gitExt) {
            this.logger.log('[adapter] getGitModifiedFiles: vscode.git extension not found');
            return null;
        }
        this.logger.log(`[adapter] getGitModifiedFiles: vscode.git active=${gitExt.isActive}`);
        if (!gitExt.isActive) {
            this.logger.log('[adapter] getGitModifiedFiles: activating vscode.git extension');
            await gitExt.activate();
            this.logger.log(`[adapter] getGitModifiedFiles: vscode.git active after activate=${gitExt.isActive}`);
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
        this.logger.log(`[adapter] ensureFilesLoaded: opening ${paths.length} files in editor tabs to trigger diagnostics`);
        for (const p of paths) {
            const wasLoaded = vscode.workspace.textDocuments.some((doc) => doc.uri.fsPath === p);
            const wasVisible = vscode.window.visibleTextEditors.some((editor) => editor.document.uri.fsPath === p);
            this.logger.log(`[adapter] ensureFilesLoaded: before open path=${p} loaded=${wasLoaded} visible=${wasVisible}`);
            try {
                const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(p));
                await vscode.window.showTextDocument(doc, { preview: false, preserveFocus: true });
                const isLoaded = vscode.workspace.textDocuments.some((loadedDoc) => loadedDoc.uri.fsPath === p);
                const isVisible = vscode.window.visibleTextEditors.some((editor) => editor.document.uri.fsPath === p);
                this.logger.log(
                    `[adapter] ensureFilesLoaded: opened editor path=${p} documentPath=${doc.uri.fsPath} language=${doc.languageId} version=${doc.version} loaded=${isLoaded} visible=${isVisible}`,
                );
            } catch (err) {
                this.logger.error(`[adapter] ensureFilesLoaded: failed to open ${p}`, err);
            }
        }
        await this.waitForDiagnostics(paths);
    }

    private async waitForDiagnostics(paths: string[]): Promise<void> {
        const targetPaths = new Set(paths.map((p) => LiveVscodeAdapter.normalizePathForCompare(p)));
        if (targetPaths.size === 0) return;

        const hasTargetDiagnostics = (): boolean =>
            vscode.languages
                .getDiagnostics()
                .some(([uri, diagnostics]) => targetPaths.has(LiveVscodeAdapter.normalizePathForCompare(uri.fsPath)) && diagnostics.length > 0);

        if (hasTargetDiagnostics()) {
            this.logger.log('[adapter] ensureFilesLoaded: diagnostics already available for at least one target file');
            return;
        }

        await new Promise<void>((resolve) => {
            const startedAt = Date.now();
            let finished = false;
            let disposable: vscode.Disposable | undefined;
            let interval: ReturnType<typeof setInterval> | undefined;
            let timeout: ReturnType<typeof setTimeout> | undefined;
            const finish = (reason: string): void => {
                if (finished) return;
                finished = true;
                if (timeout) clearTimeout(timeout);
                if (interval) clearInterval(interval);
                disposable?.dispose();
                this.logger.log(
                    `[adapter] ensureFilesLoaded: diagnostics wait done reason=${reason} elapsedMs=${Date.now() - startedAt}`,
                );
                resolve();
            };

            const checkForDiagnostics = (reason: string): void => {
                if (hasTargetDiagnostics()) finish(reason);
            };

            disposable = vscode.languages.onDidChangeDiagnostics((event) => {
                const relevantChange = event.uris.some((uri) =>
                    targetPaths.has(LiveVscodeAdapter.normalizePathForCompare(uri.fsPath)),
                );
                if (relevantChange) checkForDiagnostics('diagnostics-event');
            });
            interval = setInterval(() => checkForDiagnostics('poll'), LiveVscodeAdapter.diagnosticsPollMs);
            timeout = setTimeout(() => finish('timeout'), LiveVscodeAdapter.diagnosticsWaitMs);
        });
    }

    private static normalizePathForCompare(value: string): string {
        const normalized = value.replace(/\\/g, '/');
        return /^[a-z]:\//i.test(normalized) ? normalized.toLocaleLowerCase() : normalized;
    }
}
