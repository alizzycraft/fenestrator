import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppModeStore } from '../../core/config/app-mode.store';
import { ProviderStore } from '../../core/config/provider.store';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="settings-workspace">
      <h1 class="screen-title">Settings</h1>
      
      <div class="card">
        <div class="card-head">Application Mode</div>
        <div class="card-body">
          <div class="setting-row">
            <div class="setting-info">
              <div class="setting-label">Current Mode</div>
              <div class="setting-desc">Determines capabilities like Git and AI translation</div>
            </div>
            @if (appMode.mode() === 'desktop') {
              <span class="pill pill-green">desktop (full access)</span>
            } @else {
              <span class="pill pill-muted">web (read-only)</span>
            }
          </div>
          <p class="setting-note">
            @if (appMode.mode() === 'desktop') {
              Running in <strong>Desktop Mode</strong>. Connected to local API. AI providers and native Git operations are available.
            } @else {
              Running in <strong>Web Mode</strong>. The app is completely serverless. Translation runs and Git commits are disabled. 
              To get full functionality, clone the repo locally and run the desktop app.
            }
          </p>
        </div>
      </div>

      <div class="card" *ngIf="appMode.mode() === 'desktop'">
        <div class="card-head">Runtime Configuration</div>
        <div class="card-body">
          <div class="setting-row">
            <div class="setting-info">
              <div class="setting-label">Active Provider</div>
              <div class="setting-desc">Select which AI provider to use for translations</div>
            </div>
            <div class="setting-control">
              <select class="field-select" [(ngModel)]="selectedProviderId">
                @for (p of providerStore.providers(); track p.id) {
                  <option [value]="p.id" [disabled]="!p.isAvailable">
                    {{ p.name }} {{ p.isAvailable ? '' : '(Not Installed)' }}
                  </option>
                }
              </select>
            </div>
          </div>

          <div class="setting-row">
            <div class="setting-info">
              <div class="setting-label">Anthropic API Key</div>
              <div class="setting-desc">Required if using Anthropic API (Online). Stored in local .env</div>
            </div>
            <div class="setting-control">
              <input 
                type="password" 
                class="field-input" 
                placeholder="sk-ant-..." 
                [(ngModel)]="anthropicKey" 
              />
            </div>
          </div>
          
          <div class="setting-row" style="background: var(--surface-2); justify-content: flex-end;">
            <button 
              class="btn btn-primary" 
              (click)="saveConfig()" 
              [disabled]="providerStore.status() === 'saving'"
            >
              {{ providerStore.status() === 'saving' ? 'Saving...' : 'Save Configuration' }}
            </button>
          </div>
          
          @if (providerStore.error()) {
            <p class="setting-note error-text">
              Error saving: {{ providerStore.error() }}
            </p>
          }
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
    .setting-row { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-bottom: 1px solid var(--border); gap: 16px; }
    .setting-row:last-of-type { border-bottom: none; }
    .setting-info { flex: 1; }
    .setting-control { flex-shrink: 0; }
    .setting-label { font-weight: 600; font-size: 13px; margin-bottom: 2px; }
    .setting-desc { font-size: 12px; color: var(--subtle); }
    .setting-note { padding: 12px 16px 14px; font-size: 12px; color: var(--subtle); line-height: 1.6; border-top: 1px solid var(--border); }
    .error-text { color: var(--red); }
    .setting-note code { background: var(--surface-2); padding: 1px 6px; border-radius: 4px; color: var(--muted); }
    .btn { height: 32px; padding: 0 16px; border-radius: var(--radius-pill); font-size: 13px; font-weight: 600; cursor: pointer; border: none; }
    .btn-primary { background: var(--accent); color: oklch(15% 0 0); box-shadow: 0 3px 10px color-mix(in oklch, var(--accent) 25%, transparent); }
    .btn-primary:hover:not(:disabled) { filter: brightness(1.05); }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .field-select, .field-input {
      background: var(--bg); border: 1px solid var(--border);
      border-radius: var(--radius-sm); color: var(--fg); padding: 6px 10px;
      font-size: 13px; width: 220px; transition: border-color 0.15s;
    }
    .field-select:focus, .field-input:focus { border-color: var(--accent); outline: none; }
  `],
})
export class SettingsComponent {
  protected readonly appMode = inject(AppModeStore);
  protected readonly providerStore = inject(ProviderStore);

  protected selectedProviderId = 'anthropic-api';
  protected anthropicKey = '';

  constructor() {
    if (this.appMode.mode() === 'desktop') {
      this.providerStore.loadProviders().then(() => {
        this.selectedProviderId = this.providerStore.activeProviderId();
        this.anthropicKey = this.providerStore.hasAnthropicKey() ? '********' : '';
      });
    }
  }

  async saveConfig() {
    // Don't send mask if it wasn't changed
    const keyToSend = this.anthropicKey === '********' ? undefined : this.anthropicKey;
    await this.providerStore.saveConfiguration(this.selectedProviderId, keyToSend);
  }
}
