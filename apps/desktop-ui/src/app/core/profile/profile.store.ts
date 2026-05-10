import { computed, Injectable, signal } from '@angular/core';
import type { ProfileMeta, TerminologyMap } from '@fenestrator/schemas';
import { mergeTerminology } from '@fenestrator/core-domain';

export interface LoadedProfile {
  meta: ProfileMeta;
  terminology: TerminologyMap;
  framingMd: string;
}

export type ProfileLoadStatus = 'idle' | 'loading' | 'loaded' | 'error';

interface ProfileState {
  status: ProfileLoadStatus;
  profiles: ProfileMeta[];
  activeProfileId: string | null;
  loadedProfiles: Record<string, LoadedProfile>;
  effectiveTerminology: TerminologyMap;
  error: string | null;
}

@Injectable({ providedIn: 'root' })
export class ProfileStore {
  private readonly _state = signal<ProfileState>({
    status: 'idle',
    profiles: [],
    activeProfileId: null,
    loadedProfiles: {},
    effectiveTerminology: {},
    error: null,
  });

  readonly status = computed(() => this._state().status);
  readonly profiles = computed(() => this._state().profiles);
  readonly activeProfileId = computed(() => this._state().activeProfileId);
  readonly activeProfile = computed(() => {
    const id = this._state().activeProfileId;
    return id ? this._state().loadedProfiles[id] ?? null : null;
  });
  readonly effectiveTerminology = computed(() => this._state().effectiveTerminology);
  readonly terminologyEntries = computed(() =>
    Object.entries(this._state().effectiveTerminology).map(([source, entry]) => ({
      source,
      ...entry,
    })),
  );

  // ORCHESTRATION: Profiles loaded from project files
  profilesLoaded(profiles: ProfileMeta[]): void {
    this._state.update((s) => ({ ...s, profiles, status: 'loaded' }));
  }

  // ORCHESTRATION: User selects active profile
  activeProfileSelected(profileId: string): void {
    this._state.update((s) => {
      const loaded = s.loadedProfiles[profileId];
      const effective = loaded?.terminology ?? {};
      return { ...s, activeProfileId: profileId, effectiveTerminology: effective };
    });
  }

  // ORCHESTRATION: Profile data loaded from files
  profileDataLoaded(profileId: string, data: LoadedProfile): void {
    this._state.update((s) => {
      const loaded = { ...s.loadedProfiles, [profileId]: data };
      // If this is the active profile, update effective terminology
      const effective =
        s.activeProfileId === profileId ? data.terminology : s.effectiveTerminology;
      return { ...s, loadedProfiles: loaded, effectiveTerminology: effective };
    });
  }

  // ORCHESTRATION: Load stub profiles for Phase 1 demo
  loadStubProfiles(): void {
    const stubMeta: ProfileMeta = {
      schemaVersion: 1,
      id: 'stirner-modernist',
      name: 'Stirner Modernist',
      version: '0.3.1',
      description: 'Modernized interpretive profile for Stirner-related texts.',
      inheritsFrom: null,
    };

    const stubTerminology: TerminologyMap = {
      Eigenheit: {
        preferred: 'ownness',
        alternatives: ['uniqueness', 'selfhood'],
        avoid: ['individualism', 'peculiarity'],
        notes: 'Preserve the philosophical sense rather than reducing it to liberal individualism.',
        inherited: false,
      },
      Eigentum: {
        preferred: 'property',
        alternatives: [],
        avoid: ['possession'],
        notes: 'Distinguish from mere possession — this is about self-owned property.',
        inherited: true,
        profileId: 'base-profile',
      },
      Einzige: {
        preferred: 'unique one',
        alternatives: ['the individual', 'the sole one'],
        avoid: ['ego', 'egoist'],
        notes: 'Der Einzige und sein Eigentum — preserve the active self-ownership sense.',
        inherited: false,
      },
    };

    this.profilesLoaded([stubMeta]);
    this.profileDataLoaded('stirner-modernist', {
      meta: stubMeta,
      terminology: stubTerminology,
      framingMd: '# Stirner Modernist\n\nInterpretive framing for modernizing Stirner.',
    });
    this.activeProfileSelected('stirner-modernist');
  }

  // ORCHESTRATION: Edit a terminology entry
  terminologyEntryUpdated(source: string, field: string, value: string): void {
    this._state.update((s) => {
      const entry = s.effectiveTerminology[source];
      if (!entry) return s;
      const updated = { ...s.effectiveTerminology, [source]: { ...entry, [field]: value } };
      const activeId = s.activeProfileId;
      if (!activeId) return { ...s, effectiveTerminology: updated };
      const loadedProfile = s.loadedProfiles[activeId];
      const updatedProfiles = {
        ...s.loadedProfiles,
        [activeId]: { ...loadedProfile, terminology: updated },
      };
      return { ...s, effectiveTerminology: updated, loadedProfiles: updatedProfiles };
    });
  }

  // ORCHESTRATION: Add a new terminology entry
  terminologyEntryAdded(source: string): void {
    this._state.update((s) => {
      if (s.effectiveTerminology[source]) return s;
      const updated = {
        ...s.effectiveTerminology,
        [source]: { preferred: '', alternatives: [], avoid: [], inherited: false },
      };
      return { ...s, effectiveTerminology: updated };
    });
  }
}
