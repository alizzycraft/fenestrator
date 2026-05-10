import { computed, Injectable, signal } from '@angular/core';
import type { ProjectManifest } from '@fenestrator/schemas';

export type ProjectLoadStatus = 'idle' | 'loading' | 'loaded' | 'error';

export interface ProjectState {
  status: ProjectLoadStatus;
  manifest: ProjectManifest | null;
  projectRoot: string | null;
  directoryHandle: FileSystemDirectoryHandle | null;
  error: string | null;
  validationDiagnostics: string[];
}

@Injectable({ providedIn: 'root' })
export class ProjectStore {
  // STATE
  private readonly _state = signal<ProjectState>({
    status: 'idle',
    manifest: null,
    projectRoot: null,
    directoryHandle: null,
    error: null,
    validationDiagnostics: [],
  });

  // Public read signals
  readonly status = computed(() => this._state().status);
  readonly manifest = computed(() => this._state().manifest);
  readonly projectRoot = computed(() => this._state().projectRoot);
  readonly directoryHandle = computed(() => this._state().directoryHandle);
  readonly error = computed(() => this._state().error);
  readonly validationDiagnostics = computed(() => this._state().validationDiagnostics);
  readonly isLoaded = computed(() => this._state().status === 'loaded');
  readonly projectName = computed(() => this._state().manifest?.projectName ?? null);
  readonly authors = computed(() => this._state().manifest?.authors ?? []);
  readonly defaultProfile = computed(() => this._state().manifest?.defaultProfile ?? 'default');

  // ORCHESTRATION: Open project folder via File System Access API
  async openProjectRequested(): Promise<void> {
    try {
      const dirHandle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
      this._state.update((s) => ({ ...s, status: 'loading', error: null }));

      const manifest = await this._readManifest(dirHandle);
      const path = dirHandle.name;

      this._state.update((s) => ({
        ...s,
        status: 'loaded',
        manifest,
        projectRoot: path,
        directoryHandle: dirHandle,
        validationDiagnostics: [],
      }));
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return; // User cancelled
      const message = err instanceof Error ? err.message : String(err);
      this._state.update((s) => ({ ...s, status: 'error', error: message }));
    }
  }

  // ORCHESTRATION: Initialize a new project
  async initializeProjectRequested(options: {
    projectName: string;
    sourceLanguage: string;
    targetLanguage: string;
    authorEmail: string;
    authorName: string;
  }): Promise<void> {
    try {
      const dirHandle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
      this._state.update((s) => ({ ...s, status: 'loading', error: null }));

      const manifest: ProjectManifest = {
        schemaVersion: 1,
        projectName: options.projectName,
        sourceLanguage: options.sourceLanguage,
        targetLanguage: options.targetLanguage,
        defaultProfile: 'default',
        createdWith: 'fenestrator',
        profileSchemaVersion: 1,
        authors: [{ email: options.authorEmail, name: options.authorName, role: 'owner' }],
        createdAt: new Date().toISOString(),
      };

      await this._writeManifest(dirHandle, manifest);
      await this._createProjectStructure(dirHandle);

      this._state.update((s) => ({
        ...s,
        status: 'loaded',
        manifest,
        projectRoot: dirHandle.name,
        directoryHandle: dirHandle,
        validationDiagnostics: [],
      }));
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      const message = err instanceof Error ? err.message : String(err);
      this._state.update((s) => ({ ...s, status: 'error', error: message }));
    }
  }

  // EFFECT: Read manifest from directory handle
  private async _readManifest(dir: FileSystemDirectoryHandle): Promise<ProjectManifest> {
    const fileHandle = await dir.getFileHandle('fenestrator.project.json');
    const file = await fileHandle.getFile();
    const text = await file.text();
    return JSON.parse(text) as ProjectManifest;
  }

  // EFFECT: Write manifest to directory handle
  private async _writeManifest(dir: FileSystemDirectoryHandle, manifest: ProjectManifest): Promise<void> {
    const fileHandle = await dir.getFileHandle('fenestrator.project.json', { create: true });
    const writable = await (fileHandle as any).createWritable();
    await writable.write(JSON.stringify(manifest, null, 2));
    await writable.close();
  }

  // EFFECT: Create standard project folder structure
  private async _createProjectStructure(dir: FileSystemDirectoryHandle): Promise<void> {
    const folders = [
      'source/texts/original',
      'source/texts/normalized',
      'source/segments',
      'profiles/default',
      'drafts/default',
      'memory',
      'reviews/diagnostics',
      'reviews/notes',
      'config',
      'exports',
    ];
    for (const path of folders) {
      const parts = path.split('/');
      let current = dir;
      for (const part of parts) {
        current = await current.getDirectoryHandle(part, { create: true });
      }
    }
    // Write .gitignore for secrets
    const gitignoreHandle = await dir.getFileHandle('.gitignore', { create: true });
    const writable = await (gitignoreHandle as any).createWritable();
    await writable.write('config/providers.local.json\n*.local.json\n.fenestrator-cache/\n');
    await writable.close();
  }
}
