import { computed, Injectable, signal } from '@angular/core';
import type { Segment } from '@fenestrator/schemas';

interface SegmentState {
  segments: Segment[];
  activeSegmentId: string | null;
  scratchText: string;
  useScratch: boolean;
}

@Injectable({ providedIn: 'root' })
export class SegmentStore {
  private readonly _state = signal<SegmentState>({
    segments: [
      {
        id: 'ch01.s001',
        sourcePath: 'source/segments/chapter-01',
        position: 1,
        text: 'Der Staat heißt der kälteste aller kalten Ungeheuer. Kalt lügt es auch; und diese Lüge kriecht aus seinem Munde: "Ich, der Staat, bin das Volk."',
        metadata: { chapter: 'chapter-01', paragraph: 1 },
        status: 'reviewed',
      },
      {
        id: 'ch01.s002',
        sourcePath: 'source/segments/chapter-01',
        position: 2,
        text: 'Die Eigenheit ist mit einem Worte das Eigentum des Eigners, und niemand kann sie mir nehmen, ohne damit mein Eigentum anzueignen.',
        metadata: { chapter: 'chapter-01', paragraph: 2 },
        status: 'warning',
      },
      {
        id: 'ch01.s003',
        sourcePath: 'source/segments/chapter-01',
        position: 3,
        text: 'Ich bin Eigentümer meiner Macht, und ich bin es dann, wenn ich mich als Einzigen weiß.',
        metadata: { chapter: 'chapter-01', paragraph: 3 },
        status: 'draft',
      },
      {
        id: 'ch01.s004',
        sourcePath: 'source/segments/chapter-01',
        position: 4,
        text: 'Was ich bin und tue ist durch mich entschieden, und kein Fremdes kann daran richten.',
        metadata: { chapter: 'chapter-01', paragraph: 4 },
        status: 'new',
      },
    ],
    activeSegmentId: 'ch01.s002',
    scratchText: '',
    useScratch: false,
  });

  readonly segments = computed(() => this._state().segments);
  readonly activeSegmentId = computed(() => this._state().activeSegmentId);
  readonly scratchText = computed(() => this._state().scratchText);
  readonly useScratch = computed(() => this._state().useScratch);

  readonly activeSegment = computed(() => {
    const id = this._state().activeSegmentId;
    return this._state().segments.find((s) => s.id === id) ?? null;
  });

  readonly activeText = computed(() => {
    const s = this._state();
    if (s.useScratch) return s.scratchText;
    return s.segments.find((seg) => seg.id === s.activeSegmentId)?.text ?? '';
  });

  segmentSelected(id: string): void {
    this._state.update((s) => ({ ...s, activeSegmentId: id, useScratch: false }));
  }

  scratchTextChanged(text: string): void {
    this._state.update((s) => ({ ...s, scratchText: text, useScratch: true }));
  }

  activeTextChanged(text: string): void {
    this._state.update((s) => {
      if (s.useScratch) return { ...s, scratchText: text };
      const segments = s.segments.map((seg) =>
        seg.id === s.activeSegmentId ? { ...seg, text } : seg,
      );
      return { ...s, segments };
    });
  }
}
