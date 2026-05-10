import { Component, inject } from '@angular/core';
import { NavStore, Screen } from '../../core/nav/nav.store';

interface NavItem { id: Screen; label: string; icon: string; title: string; }

@Component({
  selector: 'app-rail',
  standalone: true,
  template: `
    <aside class="rail">
      <nav class="nav" role="navigation" aria-label="Main navigation">
        @for (item of navItems; track item.id) {
          <button
            class="nav-btn"
            [class.active]="nav.activeScreen() === item.id"
            [title]="item.title"
            [attr.aria-label]="item.title"
            [attr.aria-current]="nav.activeScreen() === item.id ? 'page' : null"
            (click)="nav.screenActivated(item.id)"
          >
            {{ item.icon }}
          </button>
        }
      </nav>
      <div class="rail-bottom">
        <button
          class="icon-btn"
          title="Settings"
          aria-label="Settings"
          [class.active]="nav.activeScreen() === 'settings'"
          (click)="nav.screenActivated('settings')"
        >⚙</button>
        <button
          class="icon-btn"
          title="Toggle collapse"
          aria-label="Toggle pane collapse"
          (click)="toggleCollapse()"
        >◫</button>
      </div>
    </aside>
  `,
  styles: [`
    .rail {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 16px 0;
      background: var(--shell);
      border-right: 1px solid var(--border);
      gap: 0;
    }
    .nav {
      display: flex;
      flex-direction: column;
      gap: 8px;
      width: 100%;
      align-items: center;
    }
    .nav-btn {
      width: 48px; height: 48px;
      display: grid; place-items: center;
      border-radius: 14px;
      background: transparent;
      color: var(--muted);
      font-size: 15px;
      font-weight: 700;
      transition: background 0.15s, color 0.15s, box-shadow 0.15s;
    }
    .nav-btn:hover { background: var(--surface); color: var(--fg); }
    .nav-btn.active {
      background: var(--accent);
      color: white;
      box-shadow: 0 6px 16px color-mix(in oklch, var(--accent) 30%, transparent);
    }
    .rail-bottom {
      margin-top: auto;
      display: flex;
      flex-direction: column;
      gap: 8px;
      align-items: center;
    }
    .icon-btn {
      width: 40px; height: 40px;
      display: grid; place-items: center;
      border-radius: 12px;
      background: var(--surface);
      color: var(--muted);
      font-size: 16px;
      transition: background 0.15s, color 0.15s;
      border: 1px solid var(--border);
    }
    .icon-btn:hover { background: var(--surface-2); color: var(--fg); }
    .icon-btn.active { background: var(--accent); color: white; }
  `],
})
export class RailComponent {
  protected readonly nav = inject(NavStore);

  protected readonly navItems: NavItem[] = [
    { id: 'sandbox',     icon: 'S', label: 'Sandbox',     title: 'Sandbox' },
    { id: 'project',     icon: 'P', label: 'Project',     title: 'Project' },
    { id: 'terminology', icon: 'T', label: 'Terminology', title: 'Terminology' },
    { id: 'memory',      icon: 'M', label: 'Memory',      title: 'Translation Memory' },
    { id: 'git',         icon: 'G', label: 'Git',         title: 'Git Changes' },
  ];

  protected toggleCollapse(): void {
    const s = this.nav.sourcePaneCollapsed();
    if (s) {
      this.nav.expandAll();
    } else {
      this.nav.collapseAll();
    }
  }
}
