import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppModeStore } from '../../core/config/app-mode.store';
import { MemoryStore } from '../../core/memory/memory.store';

@Component({
  selector: 'app-memory',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="memory-workspace">
      <div class="memory-toolbar">
        <h1 class="screen-title">Translation Memory</h1>
        <div class="toolbar-actions">
          <input class="search-input" placeholder="Search memory…"
            [ngModel]="memory.filter()" (ngModelChange)="memory.filterChanged($event)" />
        </div>
      </div>
      @if (memory.pendingSuggestions().length > 0) {
        <div class="suggestions-banner">
          <strong>{{ memory.pendingSuggestions().length }} pending suggestion(s)</strong> from last run
        </div>
      }
      <div class="card">
        <div class="card-body tight">
          <table>
            <thead><tr><th>Source</th><th>Translation</th><th>Status</th><th>Origin</th><th>Action</th></tr></thead>
            <tbody>
              @for (s of memory.pendingSuggestions(); track s.id) {
                <tr class="suggestion-row">
                  <td>{{ s.sourceText }}</td><td>{{ s.translatedText }}</td>
                  <td><span class="pill pill-yellow">suggested</span></td>
                  <td><span class="pill pill-muted">{{ s.origin }}</span></td>
                  <td>
                    @if (appMode.mode() === 'desktop') {
                      <button class="action-btn-sm accept" (click)="memory.memorySuggestionAccepted(s.id)">✓</button>
                      <button class="action-btn-sm reject" (click)="memory.memorySuggestionRejected(s.id)">✕</button>
                    } @else {
                      <span class="pill pill-muted" title="Action requires Desktop Mode">disabled</span>
                    }
                  </td>
                </tr>
              }
              @for (r of memory.filteredRecords(); track r.id) {
                <tr>
                  <td>{{ r.sourceText }}</td><td>{{ r.translatedText }}</td>
                  <td><span class="pill" [class]="statusPill(r.status)">{{ r.status }}</span></td>
                  <td><span class="pill pill-muted">{{ r.origin }}</span></td>
                  <td>—</td>
                </tr>
              }
              @empty { <tr><td colspan="5" class="empty-cell">No memory records.</td></tr> }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .memory-workspace { padding: 20px; overflow: auto; height: 100%; display: flex; flex-direction: column; gap: 16px; }
    .memory-toolbar { display: flex; justify-content: space-between; align-items: center; }
    .screen-title { font-size: 18px; font-weight: 700; }
    .toolbar-actions { display: flex; gap: 10px; }
    .search-input { height: 34px; padding: 0 14px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-pill); color: var(--fg); font-size: 13px; width: 200px; }
    .search-input:focus { border-color: var(--accent); outline: none; }
    .suggestions-banner { padding: 10px 14px; background: oklch(84% 0.15 95 / 0.07); border: 1px solid oklch(84% 0.15 95 / 0.3); border-radius: var(--radius-sm); font-size: 13px; color: var(--yellow); }
    .card { background: var(--surface); border-radius: var(--radius); border: 1px solid var(--border); border-top: 2px solid var(--accent); flex: 1; overflow: hidden; }
    .card-body.tight { padding: 0; overflow: auto; height: 100%; }
    .suggestion-row { background: oklch(84% 0.15 95 / 0.03); }
    .action-btn-sm { width: 28px; height: 28px; display: grid; place-items: center; border-radius: 8px; font-size: 13px; font-weight: 700; margin-right: 4px; }
    .action-btn-sm.accept { background: oklch(76% 0.17 155 / 0.12); color: var(--green); }
    .action-btn-sm.reject { background: oklch(72% 0.19 28 / 0.1); color: var(--red); }
    .empty-cell { color: var(--subtle); text-align: center; padding: 24px; font-size: 13px; }
  `],
})
export class MemoryComponent {
  protected readonly appMode = inject(AppModeStore);
  protected readonly memory = inject(MemoryStore);
  protected statusPill(status: string): string {
    const map: Record<string, string> = { accepted: 'pill-green', suggested: 'pill-yellow', rejected: 'pill-red', superseded: 'pill-muted' };
    return map[status] ?? 'pill-muted';
  }
}
