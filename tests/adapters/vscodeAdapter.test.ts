jest.mock('vscode', () => ({}), { virtual: true });

import { LiveVscodeAdapter } from '../../src/adapters/vscodeAdapter.js';

describe('LiveVscodeAdapter.isRepoInWorkspace', () => {
    it('returns true when repo root matches a workspace root exactly', () => {
        const wsRoots = [LiveVscodeAdapter.normalizePathForCompare('a:\\Develop\\github\\my-project')];
        expect(LiveVscodeAdapter.isRepoInWorkspace('a:\\Develop\\github\\my-project', wsRoots)).toBe(true);
    });

    it('returns true when repo root is a subdirectory of a workspace root', () => {
        const wsRoots = [LiveVscodeAdapter.normalizePathForCompare('a:\\Develop\\github\\my-project')];
        expect(LiveVscodeAdapter.isRepoInWorkspace('a:\\Develop\\github\\my-project\\packages\\core', wsRoots)).toBe(true);
    });

    it('returns false when repo root is outside all workspace roots', () => {
        const wsRoots = [LiveVscodeAdapter.normalizePathForCompare('a:\\Develop\\github\\my-project')];
        expect(LiveVscodeAdapter.isRepoInWorkspace('a:\\Develop\\github\\other-project', wsRoots)).toBe(false);
    });

    it('returns false for a worktree of the same repo at a different path', () => {
        const wsRoots = [LiveVscodeAdapter.normalizePathForCompare('a:\\Develop\\github\\my-project')];
        expect(LiveVscodeAdapter.isRepoInWorkspace('a:\\worktrees\\my-project-feature', wsRoots)).toBe(false);
    });

    it('handles mixed slash styles on Windows', () => {
        const wsRoots = [LiveVscodeAdapter.normalizePathForCompare('A:\\Develop\\github\\my-project')];
        expect(LiveVscodeAdapter.isRepoInWorkspace('a:/Develop/github/my-project', wsRoots)).toBe(true);
    });

    it('handles case differences on Windows drive letters', () => {
        const wsRoots = [LiveVscodeAdapter.normalizePathForCompare('a:\\Develop\\github\\my-project')];
        expect(LiveVscodeAdapter.isRepoInWorkspace('A:\\Develop\\github\\my-project', wsRoots)).toBe(true);
    });

    it('matches against multiple workspace roots', () => {
        const wsRoots = [
            LiveVscodeAdapter.normalizePathForCompare('a:\\Develop\\project-a'),
            LiveVscodeAdapter.normalizePathForCompare('b:\\Work\\project-b'),
        ];
        expect(LiveVscodeAdapter.isRepoInWorkspace('b:\\Work\\project-b', wsRoots)).toBe(true);
        expect(LiveVscodeAdapter.isRepoInWorkspace('c:\\Other\\project-c', wsRoots)).toBe(false);
    });

    it('returns false when workspace roots list is empty', () => {
        expect(LiveVscodeAdapter.isRepoInWorkspace('a:\\Develop\\github\\my-project', [])).toBe(false);
    });

    it('handles Unix-style paths', () => {
        const wsRoots = [LiveVscodeAdapter.normalizePathForCompare('/home/user/project')];
        expect(LiveVscodeAdapter.isRepoInWorkspace('/home/user/project', wsRoots)).toBe(true);
        expect(LiveVscodeAdapter.isRepoInWorkspace('/home/user/other', wsRoots)).toBe(false);
    });
});

describe('LiveVscodeAdapter.normalizePathForCompare', () => {
    it('converts backslashes to forward slashes', () => {
        expect(LiveVscodeAdapter.normalizePathForCompare('a:\\foo\\bar')).toBe('a:/foo/bar');
    });

    it('lowercases Windows drive-letter paths', () => {
        expect(LiveVscodeAdapter.normalizePathForCompare('A:\\Foo\\Bar')).toBe('a:/foo/bar');
    });

    it('preserves case for Unix paths', () => {
        expect(LiveVscodeAdapter.normalizePathForCompare('/Home/User/Project')).toBe('/Home/User/Project');
    });
});
