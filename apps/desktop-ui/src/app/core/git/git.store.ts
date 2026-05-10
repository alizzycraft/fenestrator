import { computed, Injectable, signal } from '@angular/core';

export type GitCleanStatus = 'clean' | 'dirty' | 'unknown';

interface ChangedFile {
  area: 'profiles' | 'source' | 'memory' | 'drafts' | 'reviews' | 'config' | 'exports';
  path: string;
  state: 'modified' | 'added' | 'deleted' | 'untracked';
}

interface GitState {
  status: 'idle' | 'loading' | 'loaded' | 'error';
  branch: string;
  cleanStatus: GitCleanStatus;
  changedFiles: ChangedFile[];
  error: string | null;
}

@Injectable({ providedIn: 'root' })
export class GitStore {
  private readonly _state = signal<GitState>({
    status: 'idle',
    branch: 'main',
    cleanStatus: 'unknown',
    changedFiles: [],
    error: null,
  });

  readonly branch = computed(() => this._state().branch);
  readonly cleanStatus = computed(() => this._state().cleanStatus);
  readonly isDirty = computed(() => this._state().cleanStatus === 'dirty');
  readonly changedFiles = computed(() => this._state().changedFiles);
  readonly status = computed(() => this._state().status);

  readonly filesByArea = computed(() => {
    const files = this._state().changedFiles;
    const areas: Record<string, ChangedFile[]> = {};
    for (const f of files) {
      if (!areas[f.area]) areas[f.area] = [];
      areas[f.area].push(f);
    }
    return areas;
  });

  loadStubStatus(): void {
    this._state.set({
      status: 'loaded',
      branch: 'main',
      cleanStatus: 'dirty',
      changedFiles: [
        { area: 'profiles', path: 'profiles/stirner-modernist/terminology.json', state: 'modified' },
        { area: 'memory', path: 'memory/translation-memory.jsonl', state: 'modified' },
      ],
      error: null,
    });
  }

  markDirty(area: ChangedFile['area'], path: string): void {
    this._state.update((s) => {
      const existing = s.changedFiles.find((f) => f.path === path);
      if (existing) return s;
      return {
        ...s,
        cleanStatus: 'dirty',
        changedFiles: [...s.changedFiles, { area, path, state: 'modified' }],
      };
    });
  }
}
