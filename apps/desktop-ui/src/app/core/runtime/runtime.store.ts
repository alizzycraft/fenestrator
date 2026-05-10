import { computed, Injectable, signal } from '@angular/core';
import type {
  TranslationRequest,
  TranslationResponse,
  TranslationOutput,
  TranslationExplanation,
  Diagnostic,
  MemoryRecord,
} from '@fenestrator/schemas';

export type RunStatus = 'idle' | 'running' | 'completed' | 'failed' | 'cancelled';
export type VariantKind = 'modernized' | 'literal' | 'opinionated' | 'alternative';

interface RuntimeState {
  status: RunStatus;
  activeRunId: string | null;
  lastRequest: TranslationRequest | null;
  outputs: TranslationOutput[];
  explanations: TranslationExplanation[];
  diagnostics: Diagnostic[];
  memorySuggestions: MemoryRecord[];
  selectedVariant: VariantKind;
  error: string | null;
  runCount: number;
  lastRunDurationMs: number | null;
}

@Injectable({ providedIn: 'root' })
export class RuntimeStore {
  private readonly _state = signal<RuntimeState>({
    status: 'idle',
    activeRunId: null,
    lastRequest: null,
    outputs: [],
    explanations: [],
    diagnostics: [],
    memorySuggestions: [],
    selectedVariant: 'modernized',
    error: null,
    runCount: 0,
    lastRunDurationMs: null,
  });

  readonly status = computed(() => this._state().status);
  readonly isRunning = computed(() => this._state().status === 'running');
  readonly canRun = computed(() => this._state().status !== 'running');
  readonly outputs = computed(() => this._state().outputs);
  readonly explanations = computed(() => this._state().explanations);
  readonly diagnostics = computed(() => this._state().diagnostics);
  readonly memorySuggestions = computed(() => this._state().memorySuggestions);
  readonly selectedVariant = computed(() => this._state().selectedVariant);
  readonly activeRunId = computed(() => this._state().activeRunId);
  readonly runCount = computed(() => this._state().runCount);
  readonly lastRunDurationMs = computed(() => this._state().lastRunDurationMs);
  readonly error = computed(() => this._state().error);

  readonly selectedOutput = computed(() => {
    const variant = this._state().selectedVariant;
    return this._state().outputs.find((o) => o.kind === variant) ?? this._state().outputs[0] ?? null;
  });

  readonly warningCount = computed(
    () => this._state().diagnostics.filter((d) => d.severity === 'warning').length,
  );

  readonly errorCount = computed(
    () => this._state().diagnostics.filter((d) => d.severity === 'error').length,
  );

  readonly statusLabel = computed(() => {
    const s = this._state();
    switch (s.status) {
      case 'idle':
        return 'Idle';
      case 'running':
        return 'Running…';
      case 'completed':
        return `Last run ${s.activeRunId} · ${s.lastRunDurationMs}ms · ${s.diagnostics.filter((d) => d.severity === 'warning').length} warnings`;
      case 'failed':
        return `Failed: ${s.error}`;
      case 'cancelled':
        return 'Cancelled';
    }
  });

  // ORCHESTRATION
  translationRequested(request: TranslationRequest): void {
    const runId = `run_${String(this._state().runCount + 1).padStart(6, '0')}`;
    this._state.update((s) => ({
      ...s,
      status: 'running',
      activeRunId: runId,
      lastRequest: request,
      error: null,
    }));
  }

  translationCompleted(response: TranslationResponse): void {
    this._state.update((s) => ({
      ...s,
      status: 'completed',
      outputs: response.outputs,
      explanations: response.explanations,
      diagnostics: response.diagnostics as Diagnostic[],
      memorySuggestions: response.memorySuggestions as MemoryRecord[],
      runCount: s.runCount + 1,
      lastRunDurationMs: Math.floor(Math.random() * 3000) + 1000, // Stub timing
    }));
  }

  translationFailed(error: string): void {
    this._state.update((s) => ({ ...s, status: 'failed', error, runCount: s.runCount + 1 }));
  }

  variantSelected(variant: VariantKind): void {
    this._state.update((s) => ({ ...s, selectedVariant: variant }));
  }

  // EFFECT: Stub translator — simulates an AI translation response
  async runStubTranslation(sourceText: string, profileId: string): Promise<void> {
    const request: TranslationRequest = {
      contractVersion: 1,
      projectRoot: '',
      profileId,
      sourceText,
      mode: 'sandbox',
      options: { variantCount: 2, includeDiagnostics: true, persistMemorySuggestions: false },
    };

    this.translationRequested(request);

    // Simulate async delay
    await new Promise((r) => setTimeout(r, 800 + Math.random() * 1200));

    const hasEigenheit = sourceText.toLowerCase().includes('eigenheit');
    const hasEigentum = sourceText.toLowerCase().includes('eigentum');

    const response: TranslationResponse = {
      contractVersion: 1,
      runId: this._state().activeRunId!,
      profileId,
      outputs: [
        {
          kind: 'modernized',
          text: hasEigenheit
            ? 'Ownness, in a word, is the property of the one who is their own. No one can take it from me without treating what is mine as theirs.'
            : `[Modernized] ${sourceText}`,
          score: null,
        },
        {
          kind: 'literal',
          text: hasEigenheit
            ? 'Peculiarity is in a word the property of the owner, and no one can take it from me without thereby appropriating my property.'
            : `[Literal] ${sourceText}`,
          score: null,
        },
      ],
      diagnostics: [
        ...(hasEigenheit
          ? []
          : [
              {
                code: 'no_terminology_match',
                severity: 'info' as const,
                message: 'No active terminology rules matched this source text.',
              },
            ]),
        {
          code: 'valid',
          severity: 'info' as const,
          message: 'Modernized output satisfies profile constraints.',
        },
      ],
      memorySuggestions: [
        ...(hasEigenheit
          ? [
              {
                id: `mem_${Date.now()}_1`,
                sourceText: 'Eigenheit',
                translatedText: 'ownness',
                profileId,
                status: 'suggested' as const,
                origin: 'ai-generated' as const,
                createdAt: new Date().toISOString(),
              },
            ]
          : []),
        ...(hasEigentum
          ? [
              {
                id: `mem_${Date.now()}_2`,
                sourceText: 'Eigentum',
                translatedText: 'property',
                profileId,
                status: 'suggested' as const,
                origin: 'ai-generated' as const,
                createdAt: new Date().toISOString(),
              },
            ]
          : []),
      ],
      explanations: [
        ...(hasEigenheit
          ? [
              {
                category: 'terminology' as const,
                sourceTerm: 'Eigenheit',
                appliedRule: 'preferred: ownness',
                description: 'Terminology rule applied: Eigenheit → ownness.',
                profileRule: 'profiles/stirner-modernist/terminology.json',
              },
            ]
          : []),
        ...(hasEigentum
          ? [
              {
                category: 'memory' as const,
                sourceTerm: 'Eigentum',
                description: 'Human-approved memory record reused.',
                memoryRef: 'memory/translation-memory.jsonl:25',
              },
            ]
          : []),
        {
          category: 'style' as const,
          description: 'sentenceLength: moderate applied. Rhetorical intensity preserved.',
          profileRule: 'profiles/stirner-modernist/style-rules.yaml',
        },
      ],
    };

    this.translationCompleted(response);
  }
}
