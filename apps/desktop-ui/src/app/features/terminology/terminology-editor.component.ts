import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppModeStore } from '../../core/config/app-mode.store';
import { ProfileStore } from '../../core/profile/profile.store';

@Component({
  selector: 'app-terminology-editor',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="term-workspace">
      <div class="term-toolbar">
        <h1 class="screen-title">Terminology Editor</h1>
        <div class="toolbar-actions">
          <input
            class="search-input"
            placeholder="Search terms…"
            [ngModel]="searchQuery()"
            (ngModelChange)="searchQuery.set($event)"
            aria-label="Search terminology"
          />
          <button class="btn btn-primary" id="add-term-btn" [disabled]="appMode.mode() === 'web'" (click)="addTerm()">+ Add Term</button>
        </div>
      </div>

      <div class="card">
        <div class="card-body tight">
          <table>
            <thead>
              <tr>
                <th>Source Term</th>
                <th>Preferred</th>
                <th>Avoid</th>
                <th>Notes</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              @for (entry of filteredEntries(); track entry.source) {
                <tr
                  class="term-row"
                  [class.active]="selectedTerm() === entry.source"
                  (click)="selectedTerm.set(entry.source)"
                  role="button"
                  tabindex="0"
                >
                  <td class="mono term-source">{{ entry.source }}</td>
                  <td class="preferred-cell">{{ entry.preferred }}</td>
                  <td>
                    @for (a of entry.avoid; track $index) {
                      <span class="avoid-tag">{{ a }}</span>
                    }
                  </td>
                  <td class="notes-cell">{{ entry.notes ?? '—' }}</td>
                  <td>
                    <span class="pill" [class]="entry.inherited ? 'pill-muted' : 'pill-accent'">
                      {{ entry.inherited ? 'inherited' : 'local' }}
                    </span>
                  </td>
                </tr>
              }
              @empty {
                <tr><td colspan="5" class="empty-cell">No terminology entries. Add a term to begin.</td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      @if (selectedEntry()) {
        <div class="detail-panel">
          <div class="detail-head">
            <span class="mono detail-term">{{ selectedTerm() }}</span>
            <button class="icon-btn-sm" (click)="selectedTerm.set(null)" aria-label="Close detail">✕</button>
          </div>
          <div class="detail-fields">
            <div class="field">
              <label>Preferred Translation</label>
              <input
                class="field-input"
                [disabled]="appMode.mode() === 'web'"
                [ngModel]="selectedEntry()!.preferred"
                (ngModelChange)="profile.terminologyEntryUpdated(selectedTerm()!, 'preferred', $event)"
              />
            </div>
            <div class="field">
              <label>Notes</label>
              <textarea
                class="field-textarea"
                [disabled]="appMode.mode() === 'web'"
                [ngModel]="selectedEntry()!.notes ?? ''"
                (ngModelChange)="profile.terminologyEntryUpdated(selectedTerm()!, 'notes', $event)"
              ></textarea>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .term-workspace { padding: 20px; overflow: auto; height: 100%; display: flex; flex-direction: column; gap: 16px; }
    .term-toolbar {
      display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;
    }
    .screen-title { font-size: 18px; font-weight: 700; color: var(--fg); }
    .toolbar-actions { display: flex; gap: 10px; align-items: center; }
    .search-input {
      height: 34px; padding: 0 14px;
      background: var(--surface); border: 1px solid var(--border);
      border-radius: var(--radius-pill); color: var(--fg); font-size: 13px; width: 220px;
    }
    .search-input:focus { border-color: var(--accent); outline: none; }
    .btn { height: 34px; padding: 0 16px; border-radius: var(--radius-pill); font-weight: 600; font-size: 13px; display: inline-flex; align-items: center; gap: 6px; }
    .btn-primary { background: var(--accent); color: oklch(15% 0 0); box-shadow: 0 3px 10px color-mix(in oklch, var(--accent) 25%, transparent); }
    .btn-primary:hover { filter: brightness(1.05); }
    .card { background: var(--surface); border-radius: var(--radius); border: 1px solid var(--border); border-top: 2px solid var(--accent); flex: 1; overflow: hidden; }
    .card-body.tight { padding: 0; overflow: auto; height: 100%; }
    .term-row { cursor: pointer; }
    .term-row.active { background: color-mix(in oklch, var(--accent) 7%, transparent); }
    .term-source { font-size: 13px; font-weight: 600; }
    .preferred-cell { color: var(--accent); font-weight: 500; }
    .notes-cell { color: var(--subtle); font-size: 12px; max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .avoid-tag {
      display: inline-block; padding: 2px 8px; margin: 2px;
      background: oklch(72% 0.19 28 / 0.1); color: var(--red);
      border-radius: 6px; font-size: 11px;
    }
    .empty-cell { color: var(--subtle); text-align: center; padding: 24px; font-size: 13px; }
    .detail-panel {
      background: var(--surface); border: 1px solid var(--border); border-top: 2px solid var(--accent);
      border-radius: var(--radius); padding: 16px; flex-shrink: 0;
    }
    .detail-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
    .detail-term { font-size: 16px; font-weight: 700; color: var(--fg); }
    .icon-btn-sm {
      width: 28px; height: 28px; display: grid; place-items: center;
      border-radius: 8px; background: var(--surface-2); color: var(--muted);
    }
    .icon-btn-sm:hover { color: var(--fg); }
    .detail-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .field { display: flex; flex-direction: column; gap: 6px; }
    label { font-size: 11px; color: var(--subtle); text-transform: uppercase; letter-spacing: 0.05em; }
    .field-input, .field-textarea {
      background: var(--bg); border: 1px solid var(--border);
      border-radius: var(--radius-sm); color: var(--fg); padding: 8px 10px;
      font-size: 13px; transition: border-color 0.15s;
    }
    .field-input:focus, .field-textarea:focus { border-color: var(--accent); outline: none; }
    .field-textarea { resize: vertical; min-height: 70px; font-family: inherit; }
  `],
})
export class TerminologyEditorComponent {
  protected readonly appMode = inject(AppModeStore);
  protected readonly profile = inject(ProfileStore);
  protected readonly searchQuery = signal('');
  protected readonly selectedTerm = signal<string | null>(null);

  protected readonly filteredEntries = () => {
    const q = this.searchQuery().toLowerCase();
    return this.profile.terminologyEntries().filter(
      (e) => !q || e.source.toLowerCase().includes(q) || e.preferred.toLowerCase().includes(q),
    );
  };

  protected readonly selectedEntry = () => {
    const term = this.selectedTerm();
    if (!term) return null;
    const entries = this.profile.terminologyEntries();
    return entries.find((e) => e.source === term) ?? null;
  };

  addTerm(): void {
    const term = prompt('Source term:');
    if (term?.trim()) {
      this.profile.terminologyEntryAdded(term.trim());
      this.selectedTerm.set(term.trim());
    }
  }
}
