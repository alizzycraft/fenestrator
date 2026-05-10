import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass, TitleCasePipe } from '@angular/common';
import { NavStore } from '../../core/nav/nav.store';
import { SegmentStore } from '../../core/segment/segment.store';
import { RuntimeStore, VariantKind } from '../../core/runtime/runtime.store';
import { MemoryStore } from '../../core/memory/memory.store';
import { ProfileStore } from '../../core/profile/profile.store';

@Component({
  selector: 'app-sandbox',
  standalone: true,
  imports: [FormsModule, NgClass, TitleCasePipe],
  template: `
    <section class="sandbox-screen" [ngClass]="nav.workbenchClass()" id="sandbox">

      <!-- SOURCE PANE -->
      <aside class="pane source-pane">
        <div class="collapsed-label" (click)="nav.toggleSourcePane()" role="button" tabindex="0">Source</div>
        <div class="pane-head">
          <div>
            <div class="pane-title">Source Segments</div>
            <div class="pane-subtle mono">source/segments/chapter-01</div>
          </div>
          <button class="icon-btn" (click)="nav.toggleSourcePane()" title="Collapse source pane" aria-label="Collapse source pane">←</button>
        </div>
        <div class="pane-body">
          <div class="source-list">
            @for (seg of segments.segments(); track seg.id) {
              <div
                class="source-row"
                [class.active]="segments.activeSegmentId() === seg.id"
                role="button"
                tabindex="0"
                (click)="segments.segmentSelected(seg.id)"
                (keydown.enter)="segments.segmentSelected(seg.id)"
              >
                <span class="mono seg-id">{{ seg.id }}</span>
                <span class="pill" [ngClass]="statusPill(seg.status)">{{ seg.status }}</span>
              </div>
            }
          </div>
          @if (segments.activeSegment()) {
            <div class="source-text">
              {{ segments.activeSegment()!.text }}
            </div>
          }
        </div>
      </aside>

      <!-- CENTER PANE -->
      <section class="pane center-pane">
        <div class="runbar">
          <div class="segmented" role="group" aria-label="Output variant">
            @for (v of variants; track v.id) {
              <button
                [class.active]="runtime.selectedVariant() === v.id"
                (click)="runtime.variantSelected(v.id)"
              >{{ v.label }}</button>
            }
          </div>
          <div class="run-state">{{ runtime.statusLabel() }}</div>
          <div class="run-actions">
            <button class="btn btn-secondary" (click)="nav.toggleReviewRail()">Review Rail</button>
            <button
              class="btn btn-primary"
              id="sandbox-run-btn"
              [disabled]="!runtime.canRun()"
              (click)="onRun()"
            >▶ Run</button>
          </div>
        </div>

        <div class="editor-grid">
          <div class="editor-column">
            <div class="column-head">
              <span>Selected Source</span>
              <span class="mono">{{ segments.activeSegmentId() }}</span>
            </div>
            <div class="column-body">
              <textarea
                spellcheck="false"
                placeholder="Enter or select source text…"
                [ngModel]="segments.activeText()"
                (ngModelChange)="segments.activeTextChanged($event)"
                aria-label="Source text input"
              ></textarea>
            </div>
          </div>

          <div class="editor-column">
            <div class="column-head">
              <span>Runtime Output</span>
              @if (runtime.status() === 'running') {
                <span class="pill pill-yellow">running…</span>
              } @else if (runtime.status() === 'completed') {
                <span class="pill pill-green">ready</span>
              }
            </div>
            <div class="column-body output-column-body">
              @if (runtime.status() === 'running') {
                <div class="run-placeholder">
                  <div class="spinner"></div>
                  <span>Translating…</span>
                </div>
              } @else if (runtime.outputs().length > 0) {
                @for (output of runtime.outputs(); track output.kind) {
                  <article
                    class="output-card"
                    [class.selected]="runtime.selectedVariant() === output.kind"
                    role="button"
                    tabindex="0"
                    (click)="runtime.variantSelected(output.kind)"
                    (keydown.enter)="runtime.variantSelected(output.kind)"
                  >
                    <div class="output-head">
                      <span class="output-name">{{ output.kind | titlecase }}</span>
                      <span class="mono subtle">
                        warnings {{ warningsForVariant(output.kind) }} · memory {{ memoriesForVariant(output.kind) }}
                      </span>
                    </div>
                    <div class="output-text">{{ output.text }}</div>
                  </article>
                }
              } @else {
                <div class="run-placeholder muted">
                  <span>Run a translation to see output here</span>
                </div>
              }
            </div>
          </div>
        </div>
      </section>

      <!-- INSPECTOR PANE -->
      <aside class="pane inspector-pane">
        <div class="collapsed-label" (click)="nav.toggleInspectorPane()" role="button" tabindex="0">Inspector</div>
        <div class="pane-head">
          <div>
            <div class="pane-title">Explanation Inspector</div>
            <div class="pane-subtle">Rules & Validation</div>
          </div>
          <button class="icon-btn" (click)="nav.toggleInspectorPane()" title="Collapse inspector" aria-label="Collapse inspector">→</button>
        </div>
        <div class="pane-body">
          @if (runtime.explanations().length === 0 && runtime.diagnostics().length === 0) {
            <p class="empty-state">Run a translation to see explanation decisions here.</p>
          }
          @for (exp of runtime.explanations(); track $index) {
            <div class="decision">
              <div class="decision-top">
                <span>{{ explanationTitle(exp) }}</span>
                <span class="pill" [ngClass]="categoryPill(exp.category)">{{ exp.category }}</span>
              </div>
              <small>{{ exp.description }}</small>
              @if (exp.profileRule) {
                <code class="rule-ref">{{ exp.profileRule }}</code>
              }
            </div>
          }
          @for (diag of runtime.diagnostics(); track $index) {
            <div class="decision">
              <div class="decision-top">
                <span class="mono">{{ diag.code }}</span>
                <span class="pill" [ngClass]="severityPill(diag.severity)">{{ diag.severity }}</span>
              </div>
              <small>{{ diag.message }}</small>
            </div>
          }
        </div>
      </aside>

      <!-- REVIEW RAIL -->
      <section class="pane review-pane">
        <div class="pane-head review-head"
             [class.clickable]="nav.reviewRailCollapsed()"
             (click)="nav.reviewRailCollapsed() && nav.toggleReviewRail()">
          <div class="segmented" role="tablist">
            @for (tab of reviewTabs; track tab.id) {
              <button
                [class.active]="nav.reviewTab() === tab.id"
                role="tab"
                [attr.aria-selected]="nav.reviewTab() === tab.id"
                (click)="nav.reviewTabActivated(tab.id)"
              >{{ tab.label }}</button>
            }
          </div>
          <button class="icon-btn" (click)="nav.toggleReviewRail(); $event.stopPropagation()" title="Toggle review rail" aria-label="Toggle review rail">
            {{ nav.reviewRailCollapsed() ? '↑' : '↓' }}
          </button>
        </div>

        <div class="pane-body tight">
          @if (nav.reviewTab() === 'memory') {
            <table>
              <thead><tr><th>Term</th><th>Suggestion</th><th>Origin</th><th>Action</th></tr></thead>
              <tbody>
                @for (s of memory.pendingSuggestions(); track s.id) {
                  <tr>
                    <td>{{ s.sourceText }}</td>
                    <td>{{ s.translatedText }}</td>
                    <td><span class="pill pill-yellow">generated</span></td>
                    <td>
                      <button class="icon-btn sm" (click)="memory.memorySuggestionAccepted(s.id)" title="Accept" aria-label="Accept suggestion">✓</button>
                      <button class="icon-btn sm" (click)="memory.memorySuggestionRejected(s.id)" title="Reject" aria-label="Reject suggestion">✕</button>
                    </td>
                  </tr>
                }
                @for (r of memory.records(); track r.id) {
                  <tr>
                    <td>{{ r.sourceText }}</td>
                    <td>{{ r.translatedText }}</td>
                    <td><span class="pill pill-green">{{ r.origin }}</span></td>
                    <td><span class="pill pill-green">kept</span></td>
                  </tr>
                }
                @empty {
                  <tr><td colspan="4" class="empty-cell">No memory records yet.</td></tr>
                }
              </tbody>
            </table>
          }

          @if (nav.reviewTab() === 'diagnostics') {
            <table>
              <thead><tr><th>Severity</th><th>Code</th><th>Message</th></tr></thead>
              <tbody>
                @for (d of runtime.diagnostics(); track $index) {
                  <tr>
                    <td><span class="pill" [ngClass]="severityPill(d.severity)">{{ d.severity }}</span></td>
                    <td class="mono">{{ d.code }}</td>
                    <td>{{ d.message }}</td>
                  </tr>
                }
                @empty {
                  <tr><td colspan="3" class="empty-cell">No diagnostics yet.</td></tr>
                }
              </tbody>
            </table>
          }

          @if (nav.reviewTab() === 'git') {
            <table>
              <thead><tr><th>Area</th><th>File</th><th>State</th></tr></thead>
              <tbody>
                @for (entry of gitEntries(); track $index) {
                  <tr>
                    <td>{{ entry.area }}</td>
                    <td class="mono">{{ entry.path }}</td>
                    <td><span class="pill pill-yellow">{{ entry.state }}</span></td>
                  </tr>
                }
                @empty {
                  <tr><td colspan="3" class="empty-cell">No changed files.</td></tr>
                }
              </tbody>
            </table>
          }
        </div>
      </section>
    </section>
  `,
  styles: [`
    :host { display: contents; }

    .sandbox-screen {
      --source-width: 320px;
      --inspector-width: 360px;
      --review-height: 240px;

      flex: 1;
      display: grid;
      grid-template-columns: var(--source-width) minmax(0, 1fr) var(--inspector-width);
      grid-template-rows: minmax(0, 1fr) var(--review-height);
      gap: 10px;
      padding: 10px;
      background: var(--bg);
      overflow: hidden;
      transition: grid-template-columns 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                  grid-template-rows 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .sandbox-screen.source-collapsed { --source-width: 48px; }
    .sandbox-screen.inspector-collapsed { --inspector-width: 48px; }
    .sandbox-screen.review-collapsed { --review-height: 48px; }

    .pane {
      background: var(--surface);
      border-radius: var(--radius);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      border: 1px solid var(--border);
      border-top: 2px solid var(--accent);
      box-shadow: var(--shadow);
    }
    .pane-head {
      height: 50px;
      padding: 0 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--border);
      background: oklch(100% 0 0 / 0.015);
      flex-shrink: 0;
    }
    .pane-title { font-weight: 600; font-size: 13px; }
    .pane-subtle { color: var(--subtle); font-size: 11px; margin-top: 1px; }
    .pane-body { flex: 1; overflow: auto; padding: 12px; }
    .pane-body.tight { padding: 0; }

    .collapsed-label {
      display: none;
      align-items: center;
      justify-content: center;
      writing-mode: vertical-rl;
      transform: rotate(180deg);
      color: var(--muted);
      font-weight: 700;
      font-size: 10px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      cursor: pointer;
      height: 100%;
    }
    .source-collapsed .source-pane .pane-head,
    .source-collapsed .source-pane .pane-body { display: none; }
    .source-collapsed .source-pane .collapsed-label { display: flex; }
    .inspector-collapsed .inspector-pane .pane-head,
    .inspector-collapsed .inspector-pane .pane-body { display: none; }
    .inspector-collapsed .inspector-pane .collapsed-label { display: flex; }

    /* Center pane is transparent */
    .center-pane { background: transparent; border: none; box-shadow: none; }

    /* Review pane spans columns 1-3 */
    .review-pane { grid-column: 1 / -1; }
    .review-collapsed .review-pane .pane-body { display: none; }
    .review-head { padding: 0 8px; }
    .review-head.clickable { cursor: pointer; }
    .review-head.clickable:hover { background: oklch(100% 0 0 / 0.02); }

    /* Runbar */
    .runbar {
      height: 56px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 14px;
      background: var(--surface);
      border-radius: var(--radius);
      margin-bottom: 10px;
      border: 1px solid var(--border);
      flex-shrink: 0;
    }
    .run-state { font-size: 12px; color: var(--subtle); flex: 1; text-align: center; }
    .run-actions { display: flex; gap: 8px; }

    .segmented {
      display: flex;
      background: var(--bg);
      padding: 4px;
      border-radius: var(--radius-pill);
      gap: 2px;
    }
    .segmented button {
      padding: 5px 14px;
      border-radius: var(--radius-pill);
      background: transparent;
      color: var(--muted);
      font-size: 12px;
      font-weight: 500;
      transition: background 0.15s, color 0.15s;
    }
    .segmented button.active { background: var(--surface-3); color: var(--fg); }
    .segmented button:hover:not(.active) { color: var(--fg); }

    /* Buttons */
    .btn {
      height: 34px; padding: 0 16px;
      border-radius: var(--radius-pill);
      font-weight: 600; font-size: 12px;
      display: inline-flex; align-items: center; gap: 6px;
      transition: transform 0.1s, box-shadow 0.1s;
    }
    .btn-primary { background: var(--accent); color: oklch(15% 0 0); box-shadow: 0 3px 10px color-mix(in oklch, var(--accent) 25%, transparent); }
    .btn-primary:hover:not(:disabled) { transform: translateY(-1px); }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-secondary { background: var(--surface-2); color: var(--muted); border: 1px solid var(--border); }
    .btn-secondary:hover { color: var(--fg); }

    /* Icon button */
    .icon-btn {
      width: 36px; height: 36px;
      display: grid; place-items: center;
      border-radius: 10px;
      background: var(--surface-2);
      color: var(--muted);
      transition: background 0.15s, color 0.15s;
      border: 1px solid var(--border);
    }
    .icon-btn:hover { background: var(--surface-3); color: var(--fg); }
    .icon-btn.sm { width: 28px; height: 28px; font-size: 12px; margin-right: 4px; }

    /* Editor grid */
    .editor-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      flex: 1;
      min-height: 0;
    }
    .editor-column {
      display: flex;
      flex-direction: column;
      background: var(--surface);
      border-radius: var(--radius);
      border: 1px solid var(--border);
      overflow: hidden;
    }
    .column-head {
      padding: 10px 14px;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 11px;
      color: var(--muted);
      background: oklch(100% 0 0 / 0.01);
      flex-shrink: 0;
    }
    .column-body { flex: 1; padding: 14px; overflow: auto; position: relative; }
    .output-column-body { padding: 12px; }

    textarea {
      width: 100%; height: 100%;
      background: transparent;
      border: none;
      color: var(--fg);
      resize: none;
      font-family: var(--font-mono);
      font-size: 14px;
      line-height: 1.65;
    }
    textarea:focus { outline: none; }

    /* Output cards */
    .output-card {
      background: var(--bg);
      border-radius: 12px;
      padding: 14px;
      border: 2px solid transparent;
      margin-bottom: 10px;
      cursor: pointer;
      transition: border-color 0.15s, background 0.15s;
    }
    .output-card.selected {
      border-color: var(--accent);
      background: color-mix(in oklch, var(--accent) 4%, transparent);
    }
    .output-card:hover:not(.selected) { border-color: var(--border-strong); }
    .output-head {
      display: flex; justify-content: space-between;
      margin-bottom: 8px; font-size: 11px; color: var(--muted);
    }
    .output-name { font-weight: 700; color: var(--fg); font-size: 12px; }
    .output-text { font-size: 14px; line-height: 1.65; }
    .subtle { color: var(--subtle); }

    /* Source list */
    .source-list { margin-bottom: 12px; }
    .source-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 9px 10px;
      border-radius: 9px;
      margin-bottom: 3px;
      cursor: pointer;
      transition: background 0.15s;
    }
    .source-row:hover { background: var(--surface-2); }
    .source-row.active { background: var(--surface-3); }
    .seg-id { font-size: 12px; }
    .source-text {
      margin-top: 12px;
      padding: 14px;
      background: var(--bg);
      border-radius: 10px;
      font-size: 13px;
      color: var(--muted);
      line-height: 1.6;
      border: 1px solid var(--border);
    }

    /* Decision / explanation cards */
    .decision {
      background: var(--bg);
      border-radius: 10px;
      padding: 11px 12px;
      margin-bottom: 8px;
      border: 1px solid var(--border);
    }
    .decision-top {
      display: flex; justify-content: space-between;
      font-weight: 600; margin-bottom: 4px; font-size: 12px;
    }
    .decision small { display: block; color: var(--subtle); font-size: 12px; line-height: 1.5; }
    .rule-ref {
      display: block; margin-top: 6px;
      font-size: 11px; color: var(--subtle);
      background: var(--surface-2); padding: 3px 8px; border-radius: 5px;
    }

    /* Run placeholder */
    .run-placeholder {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: 12px; height: 120px;
      color: var(--subtle); font-size: 13px;
    }
    .spinner {
      width: 28px; height: 28px;
      border: 3px solid var(--border);
      border-top-color: var(--accent);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .empty-state { color: var(--subtle); font-size: 13px; text-align: center; padding: 24px; }
    .empty-cell { color: var(--subtle); font-size: 12px; text-align: center; padding: 16px; }
  `],
})
export class SandboxComponent {
  protected readonly nav = inject(NavStore);
  protected readonly segments = inject(SegmentStore);
  protected readonly runtime = inject(RuntimeStore);
  protected readonly memory = inject(MemoryStore);
  protected readonly profile = inject(ProfileStore);

  protected readonly variants = [
    { id: 'modernized' as VariantKind, label: 'Modernized' },
    { id: 'literal'    as VariantKind, label: 'Literal' },
    { id: 'opinionated' as VariantKind, label: 'Opinionated' },
  ];

  protected readonly reviewTabs = [
    { id: 'memory'      as const, label: 'Memory' },
    { id: 'diagnostics' as const, label: 'Diagnostics' },
    { id: 'git'         as const, label: 'Git' },
  ];

  protected statusPill(status: string): string {
    const map: Record<string, string> = {
      reviewed: 'pill-green', warning: 'pill-yellow', draft: 'pill-muted',
      new: 'pill-muted', accepted: 'pill-green',
    };
    return map[status] ?? 'pill-muted';
  }

  protected categoryPill(cat: string): string {
    const map: Record<string, string> = {
      terminology: 'pill-green', memory: 'pill-green',
      style: 'pill-accent', framing: 'pill-accent',
      conflict: 'pill-orange', validation: 'pill-yellow',
    };
    return map[cat] ?? 'pill-muted';
  }

  protected severityPill(sev: string): string {
    const map: Record<string, string> = {
      error: 'pill-red', warning: 'pill-yellow', info: 'pill-green',
    };
    return map[sev] ?? 'pill-muted';
  }

  protected explanationTitle(exp: { sourceTerm?: string; category: string }): string {
    return exp.sourceTerm ? `${exp.sourceTerm}` : exp.category;
  }

  protected warningsForVariant(_kind: string): number {
    return this.runtime.warningCount();
  }

  protected memoriesForVariant(_kind: string): number {
    return this.memory.records().length;
  }

  protected gitEntries(): Array<{ area: string; path: string; state: string }> {
    return [
      { area: 'Profiles', path: 'profiles/stirner-modernist/terminology.json', state: 'modified' },
      { area: 'Memory',   path: 'memory/translation-memory.jsonl',              state: 'appended' },
    ];
  }

  async onRun(): Promise<void> {
    const text = this.segments.activeText();
    const profileId = this.profile.activeProfileId() ?? 'stirner-modernist';
    if (!text.trim()) return;
    await this.runtime.runStubTranslation(text, profileId);
    // Push memory suggestions into MemoryStore
    const suggestions = this.runtime.memorySuggestions();
    if (suggestions.length > 0) {
      this.memory.memorySuggestionsReceived(suggestions);
    }
  }
}
