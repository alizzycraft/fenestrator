import { Component, inject } from '@angular/core';
import { AppModeStore } from '../../core/config/app-mode.store';
import { NavStore } from '../../core/nav/nav.store';
import { ProfileStore } from '../../core/profile/profile.store';
import { ProjectStore } from '../../core/project/project.store';
import { GitStore } from '../../core/git/git.store';
import { RuntimeStore } from '../../core/runtime/runtime.store';

@Component({
  selector: 'app-topbar',
  standalone: true,
  template: `
    <header class="topbar">
      <div class="mark">F</div>
      <div class="context">
        <div class="context-chip">
          <strong>fenestrator</strong>
          @if (appMode.mode() === 'web') {
            <span class="pill pill-muted">web demo</span>
          } @else {
            <span class="pill pill-green">desktop</span>
          }
        </div>
        @if (project.isLoaded()) {
          <div class="context-chip">
            <span>Project</span>
            <strong>{{ project.projectName() }}</strong>
          </div>
          <div class="context-chip">
            <span class="mono path">{{ project.projectRoot() }}</span>
          </div>
        } @else {
          <div class="context-chip muted-chip">
            <span>No project open</span>
          </div>
        }
        <div class="context-chip">
          <span>Branch</span>
          <strong class="mono">{{ git.branch() }}</strong>
          @if (git.isDirty()) {
            <span class="pill pill-yellow">dirty</span>
          } @else {
            <span class="pill pill-green">clean</span>
          }
        </div>
        @if (profile.activeProfile()) {
          <div class="context-chip">
            <span>Profile</span>
            <strong>{{ profile.activeProfile()!.meta.id }}</strong>
            <span class="pill pill-muted">v{{ profile.activeProfile()!.meta.version }}</span>
          </div>
        }
        <div class="context-chip">
          @if (runtime.isRunning()) {
            <span class="dot dot-yellow"></span>
            <strong>running…</strong>
          } @else {
            <span class="dot dot-green"></span>
            <strong>runtime idle</strong>
          }
        </div>
      </div>
      <div class="top-actions">
        <input
          class="search"
          placeholder="Search source, terms, memory…"
          aria-label="Global search"
        />
        <button
          class="btn btn-primary"
          id="topbar-run-btn"
          [disabled]="appMode.mode() === 'web' || !runtime.canRun()"
          (click)="onRun()"
        >
          ▶ Run Translation
        </button>
      </div>
    </header>
  `,
  styles: [`
    .topbar {
      display: flex;
      align-items: center;
      padding: 0 20px;
      background: var(--shell);
      border-bottom: 1px solid var(--border);
      gap: 16px;
    }
    .mark {
      width: 40px; height: 40px;
      display: grid; place-items: center;
      background: linear-gradient(135deg, var(--accent), oklch(60% 0.2 290));
      border-radius: 12px;
      color: white; font-weight: 800; font-size: 20px;
      box-shadow: 0 4px 12px oklch(60% 0.2 260 / 0.3);
      flex-shrink: 0;
    }
    .context {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 8px;
      overflow: hidden;
      min-width: 0;
    }
    .context-chip {
      height: 34px;
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 0 12px;
      color: var(--muted);
      background: var(--surface);
      border-radius: var(--radius-pill);
      font-size: 12px;
      white-space: nowrap;
      border: 1px solid var(--border);
    }
    .context-chip strong { color: var(--fg); }
    .context-chip.muted-chip { opacity: 0.6; }
    .path { opacity: 0.7; font-size: 11px; }
    .top-actions {
      display: flex; align-items: center; gap: 10px; flex-shrink: 0;
    }
    .search {
      width: 240px; height: 36px;
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: var(--radius-pill);
      color: var(--fg);
      padding: 0 14px;
      font-size: 13px;
      transition: border-color 0.2s, background 0.2s;
    }
    .search:focus { border-color: var(--accent); background: var(--surface); outline: none; }
    .btn { 
      height: 36px; padding: 0 18px;
      border-radius: var(--radius-pill);
      font-weight: 600; font-size: 13px;
      display: inline-flex; align-items: center; gap: 6px;
      transition: transform 0.1s, box-shadow 0.1s;
    }
    .btn-primary {
      background: var(--green); color: oklch(15% 0.05 155);
      box-shadow: 0 4px 12px oklch(76% 0.17 155 / 0.25);
    }
    .btn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 16px oklch(76% 0.17 155 / 0.35); }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
  `],
})
export class TopbarComponent {
  protected readonly appMode = inject(AppModeStore);
  protected readonly nav = inject(NavStore);
  protected readonly project = inject(ProjectStore);
  protected readonly git = inject(GitStore);
  protected readonly profile = inject(ProfileStore);
  protected readonly runtime = inject(RuntimeStore);

  onRun(): void {
    this.nav.screenActivated('sandbox');
  }
}
