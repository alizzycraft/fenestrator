import { Component, inject } from '@angular/core';
import { NavStore, Screen } from '../../core/nav/nav.store';

@Component({
  selector: 'app-workspace-tabs',
  standalone: true,
  template: `
    <div class="workspace-tabs" role="tablist">
      @for (tab of tabs; track tab.id) {
        <button
          class="tab"
          [class.active]="nav.activeScreen() === tab.id"
          role="tab"
          [attr.aria-selected]="nav.activeScreen() === tab.id"
          (click)="nav.screenActivated(tab.id)"
        >{{ tab.label }}</button>
      }
    </div>
  `,
  styles: [`
    .workspace-tabs {
      display: flex;
      padding: 10px 16px 0;
      gap: 4px;
      background: var(--shell);
      border-bottom: 1px solid var(--border);
      flex-shrink: 0;
    }
    .tab {
      padding: 8px 18px;
      border-radius: 10px 10px 0 0;
      background: transparent;
      color: var(--muted);
      font-weight: 500;
      font-size: 13px;
      transition: background 0.15s, color 0.15s;
    }
    .tab:hover { color: var(--fg); background: oklch(100% 0 0 / 0.03); }
    .tab.active { background: var(--bg); color: var(--fg); }
  `],
})
export class WorkspaceTabsComponent {
  protected readonly nav = inject(NavStore);
  protected readonly tabs: Array<{ id: Screen; label: string }> = [
    { id: 'sandbox',     label: 'Sandbox' },
    { id: 'project',     label: 'Project' },
    { id: 'terminology', label: 'Terminology' },
    { id: 'memory',      label: 'Memory' },
    { id: 'git',         label: 'Git' },
    { id: 'settings',    label: 'Settings' },
  ];
}
