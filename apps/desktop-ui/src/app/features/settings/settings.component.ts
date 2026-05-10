import { Component } from '@angular/core';

@Component({
  selector: 'app-settings',
  standalone: true,
  template: `
    <div class="settings-workspace">
      <h1 class="screen-title">Settings</h1>
      <div class="card">
        <div class="card-head">Runtime Configuration</div>
        <div class="card-body">
          <div class="setting-row">
            <div class="setting-info">
              <div class="setting-label">Runtime Mode</div>
              <div class="setting-desc">How translation requests are executed</div>
            </div>
            <span class="pill pill-muted">stub (Phase 1)</span>
          </div>
          <div class="setting-row">
            <div class="setting-info">
              <div class="setting-label">Streaming</div>
              <div class="setting-desc">Stream partial output during translation</div>
            </div>
            <span class="pill pill-muted">not available</span>
          </div>
          <div class="setting-row">
            <div class="setting-info">
              <div class="setting-label">Provider</div>
              <div class="setting-desc">AI model provider for translation runs</div>
            </div>
            <span class="pill pill-muted">not configured</span>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-head">Identity & Authentication</div>
        <div class="card-body">
          <div class="setting-row">
            <div class="setting-info">
              <div class="setting-label">GitHub OAuth</div>
              <div class="setting-desc">Authenticate to match your email against project authors for edit permissions</div>
            </div>
            <button class="btn btn-secondary" disabled>Coming in Phase 2</button>
          </div>
          <p class="setting-note">
            When authenticated, your verified email is matched against the <code>authors[]</code> field in
            <code>fenestrator.project.json</code>. If it matches, you get full edit permissions.
            This makes the app work as a static-hosted site — clone your repo on any machine, authenticate, and resume editing.
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .settings-workspace { padding: 20px; overflow: auto; height: 100%; display: flex; flex-direction: column; gap: 16px; }
    .screen-title { font-size: 18px; font-weight: 700; }
    .card { background: var(--surface); border-radius: var(--radius); border: 1px solid var(--border); border-top: 2px solid var(--accent); overflow: hidden; }
    .card-head { padding: 14px 16px; border-bottom: 1px solid var(--border); font-weight: 700; font-size: 13px; }
    .card-body { padding: 0; }
    .setting-row { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-bottom: 1px solid var(--border); }
    .setting-row:last-of-type { border-bottom: none; }
    .setting-label { font-weight: 600; font-size: 13px; margin-bottom: 2px; }
    .setting-desc { font-size: 12px; color: var(--subtle); }
    .setting-note { padding: 12px 16px 14px; font-size: 12px; color: var(--subtle); line-height: 1.6; border-top: 1px solid var(--border); }
    .setting-note code { background: var(--surface-2); padding: 1px 6px; border-radius: 4px; color: var(--muted); }
    .btn { height: 32px; padding: 0 14px; border-radius: var(--radius-pill); font-size: 12px; font-weight: 600; }
    .btn-secondary { background: var(--surface-2); color: var(--subtle); border: 1px solid var(--border); cursor: not-allowed; }
  `],
})
export class SettingsComponent {}
