import { computed, inject, Injectable, signal } from '@angular/core';

export type GitCleanStatus = 'clean' | 'dirty' | 'unknown';

interface ChangedFile {
  area: 'profile' | 'source' | 'memory' | 'drafts' | 'reviews' | 'config' | 'exports' | 'root' | 'app' | string;
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

import { AppModeStore } from '../config/app-mode.store';

@Injectable({ providedIn: 'root' })
export class GitStore {
  private readonly appMode = inject(AppModeStore);

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
        { area: 'profile', path: 'profiles/stirner-modernist/terminology.json', state: 'modified' },
        { area: 'memory', path: 'memory/translation-memory.jsonl', state: 'modified' },
      ],
      error: null,
    });
  }

  async refreshStatus(): Promise<void> {
    if (this.appMode.mode() === 'web') {
      this.loadStubStatus();
      return;
    }
    this._state.update((s) => ({ ...s, status: 'loading', error: null }));
    try {
      const res = await fetch('http://127.0.0.1:3000/api/git/status');
      if (!res.ok) throw new Error('Failed to fetch git status');
      const data = await res.json();
      this._state.set({
        status: 'loaded',
        branch: data.branch,
        cleanStatus: data.isDirty ? 'dirty' : 'clean',
        changedFiles: data.changedFiles,
        error: null,
      });
    } catch (e: any) {
      this._state.update((s) => ({ ...s, status: 'error', error: e.message }));
    }
  }

  async commitChanges(message: string): Promise<void> {
    if (this.appMode.mode() === 'web') return;
    try {
      const res = await fetch('http://127.0.0.1:3000/api/git/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      if (!res.ok) throw new Error('Commit failed');
      await this.refreshStatus();
    } catch (e: any) {
      console.error('Commit failed', e);
      this._state.update((s) => ({ ...s, error: e.message }));
    }
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
