import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppModeStore } from '../../core/config/app-mode.store';
import { GitStore } from '../../core/git/git.store';

@Component({
  selector: 'app-git',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="git-workspace">
      <div class="git-toolbar">
        <h1 class="screen-title">Git Changes</h1>
        <div class="git-status-chip">
          Branch: <strong class="mono">{{ git.branch() }}</strong>
          <span class="pill" [class]="git.isDirty() ? 'pill-yellow' : 'pill-green'">
            {{ git.cleanStatus() }}
          </span>
        </div>
      </div>
      <div class="card">
        <div class="card-head">Changed Project Files</div>
        <div class="card-body tight">
          <table>
            <thead><tr><th>Area</th><th>File</th><th>State</th></tr></thead>
            <tbody>
              @for (f of git.changedFiles(); track f.path) {
                <tr>
                  <td><span class="pill pill-accent">{{ f.area }}</span></td>
                  <td class="mono file-path">{{ f.path }}</td>
                  <td><span class="pill pill-yellow">{{ f.state }}</span></td>
                </tr>
              }
              @empty {
                <tr><td colspan="3" class="empty-cell">Working tree is clean.</td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>
      <div class="commit-hint">
        <strong>Tip:</strong> Commit related changes together. Example:
        <code>profile: refine Stirner terminology</code> or
        <code>memory: accept Eigenheit decisions</code>
      </div>
      @if (appMode.mode() === 'desktop') {
        <div class="commit-box">
          <input class="commit-input" placeholder="Enter commit message…" [ngModel]="commitMessage()" (ngModelChange)="commitMessage.set($event)" (keyup.enter)="onCommit()" />
          <button class="btn btn-primary" [disabled]="!git.isDirty() || !commitMessage()" (click)="onCommit()">Commit</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .git-workspace { padding: 20px; overflow: auto; height: 100%; display: flex; flex-direction: column; gap: 16px; }
    .git-toolbar { display: flex; justify-content: space-between; align-items: center; }
    .screen-title { font-size: 18px; font-weight: 700; }
    .git-status-chip { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--muted); padding: 6px 14px; background: var(--surface); border-radius: var(--radius-pill); border: 1px solid var(--border); }
    .card { background: var(--surface); border-radius: var(--radius); border: 1px solid var(--border); border-top: 2px solid var(--accent); overflow: hidden; }
    .card-head { padding: 14px 16px; border-bottom: 1px solid var(--border); font-weight: 700; font-size: 13px; }
    .card-body.tight { padding: 0; }
    .file-path { font-size: 12px; color: var(--muted); }
    .empty-cell { color: var(--subtle); text-align: center; padding: 24px; font-size: 13px; }
    .commit-hint { padding: 12px 16px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 13px; color: var(--subtle); }
    .commit-hint code { background: var(--surface-2); padding: 2px 8px; border-radius: 5px; color: var(--muted); margin: 0 4px; }
    .commit-box { display: flex; gap: 10px; margin-top: auto; }
    .commit-input { flex: 1; height: 36px; padding: 0 14px; background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius-pill); color: var(--fg); font-size: 13px; }
    .commit-input:focus { border-color: var(--accent); outline: none; }
    .btn { height: 36px; padding: 0 18px; border-radius: var(--radius-pill); font-weight: 600; font-size: 13px; }
    .btn-primary { background: var(--accent); color: oklch(15% 0 0); box-shadow: 0 3px 10px color-mix(in oklch, var(--accent) 25%, transparent); }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
  `],
})
export class GitComponent {
  protected readonly appMode = inject(AppModeStore);
  protected readonly git = inject(GitStore);
  protected readonly commitMessage = signal('');

  constructor() {
    this.git.refreshStatus();
  }

  async onCommit() {
    if (!this.commitMessage()) return;
    await this.git.commitChanges(this.commitMessage());
    this.commitMessage.set('');
  }
}
