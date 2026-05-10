import { Component, inject, OnInit } from '@angular/core';
import { TopbarComponent } from './shared/layout/topbar.component';
import { RailComponent } from './shared/layout/rail.component';
import { StatusbarComponent } from './shared/layout/statusbar.component';
import { WorkspaceTabsComponent } from './shared/layout/workspace-tabs.component';
import { SandboxComponent } from './features/sandbox/sandbox.component';
import { ProjectComponent } from './features/project/project.component';
import { TerminologyEditorComponent } from './features/terminology/terminology-editor.component';
import { MemoryComponent } from './features/memory/memory.component';
import { GitComponent } from './features/git/git.component';
import { SettingsComponent } from './features/settings/settings.component';
import { NavStore } from './core/nav/nav.store';
import { ProfileStore } from './core/profile/profile.store';
import { GitStore } from './core/git/git.store';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    TopbarComponent,
    RailComponent,
    StatusbarComponent,
    WorkspaceTabsComponent,
    SandboxComponent,
    ProjectComponent,
    TerminologyEditorComponent,
    MemoryComponent,
    GitComponent,
    SettingsComponent,
  ],
  template: `
    <div class="app-shell" [class]="'theme-' + nav.activeScreen()">
      <app-topbar />
      <app-rail />
      <main class="shell">
        <app-workspace-tabs />
        <div class="workspace-content">
          @if (nav.activeScreen() === 'sandbox') {
            <app-sandbox />
          } @else if (nav.activeScreen() === 'project') {
            <app-project />
          } @else if (nav.activeScreen() === 'terminology') {
            <app-terminology-editor />
          } @else if (nav.activeScreen() === 'memory') {
            <app-memory />
          } @else if (nav.activeScreen() === 'git') {
            <app-git />
          } @else if (nav.activeScreen() === 'settings') {
            <app-settings />
          }
        </div>
      </main>
      <app-statusbar />
    </div>
  `,
  styles: [`
    .app-shell {
      height: 100vh;
      display: grid;
      grid-template-columns: 80px minmax(0, 1fr);
      grid-template-rows: 64px minmax(0, 1fr) 32px;
      background: var(--bg);
      overflow: hidden;
    }
    .shell {
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: var(--bg);
      grid-column: 2;
      grid-row: 2;
    }
    .workspace-content {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    app-topbar { grid-column: 1 / -1; grid-row: 1; }
    app-rail { grid-column: 1; grid-row: 2; }
    app-statusbar { grid-column: 1 / -1; grid-row: 3; }
  `],
})
export class App implements OnInit {
  protected readonly nav = inject(NavStore);
  private readonly profile = inject(ProfileStore);
  private readonly git = inject(GitStore);

  ngOnInit(): void {
    // Bootstrap stub data for Phase 1
    this.profile.loadStubProfiles();
    this.git.loadStubStatus();
  }
}
