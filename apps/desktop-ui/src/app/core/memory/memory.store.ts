import { computed, Injectable, signal } from '@angular/core';
import type { MemoryRecord } from '@fenestrator/schemas';

interface MemoryState {
  records: MemoryRecord[];
  pendingSuggestions: MemoryRecord[];
  filter: string;
  statusFilter: string;
}

@Injectable({ providedIn: 'root' })
export class MemoryStore {
  private readonly _state = signal<MemoryState>({
    records: [
      {
        id: 'mem_000001',
        sourceText: 'Eigenheit',
        translatedText: 'ownness',
        profileId: 'stirner-modernist',
        status: 'accepted',
        origin: 'human-approved',
        createdAt: '2026-05-01T00:00:00Z',
        notes: 'Accepted as the profile default.',
      },
      {
        id: 'mem_000002',
        sourceText: 'Eigentum',
        translatedText: 'property',
        profileId: 'stirner-modernist',
        status: 'accepted',
        origin: 'human-approved',
        createdAt: '2026-05-02T00:00:00Z',
      },
    ],
    pendingSuggestions: [],
    filter: '',
    statusFilter: 'all',
  });

  readonly records = computed(() => this._state().records);
  readonly pendingSuggestions = computed(() => this._state().pendingSuggestions);
  readonly filter = computed(() => this._state().filter);

  readonly filteredRecords = computed(() => {
    const f = this._state().filter.toLowerCase();
    const sf = this._state().statusFilter;
    return this._state().records.filter(
      (r) =>
        (!f || r.sourceText.toLowerCase().includes(f) || r.translatedText.toLowerCase().includes(f)) &&
        (sf === 'all' || r.status === sf),
    );
  });

  readonly allMemory = computed(() => [
    ...this._state().records,
    ...this._state().pendingSuggestions,
  ]);

  // ORCHESTRATION
  memorySuggestionsReceived(suggestions: MemoryRecord[]): void {
    this._state.update((s) => ({
      ...s,
      pendingSuggestions: [
        ...s.pendingSuggestions.filter((p) => !suggestions.find((ns) => ns.id === p.id)),
        ...suggestions,
      ],
    }));
  }

  memorySuggestionAccepted(id: string): void {
    this._state.update((s) => {
      const suggestion = s.pendingSuggestions.find((p) => p.id === id);
      if (!suggestion) return s;
      const accepted: MemoryRecord = {
        ...suggestion,
        status: 'accepted',
        origin: 'human-approved',
      };
      return {
        ...s,
        records: [...s.records, accepted],
        pendingSuggestions: s.pendingSuggestions.filter((p) => p.id !== id),
      };
    });
  }

  memorySuggestionRejected(id: string): void {
    this._state.update((s) => ({
      ...s,
      pendingSuggestions: s.pendingSuggestions.filter((p) => p.id !== id),
    }));
  }

  filterChanged(value: string): void {
    this._state.update((s) => ({ ...s, filter: value }));
  }

  statusFilterChanged(value: string): void {
    this._state.update((s) => ({ ...s, statusFilter: value }));
  }
}
