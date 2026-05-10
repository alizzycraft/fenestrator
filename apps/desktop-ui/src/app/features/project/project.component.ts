import { Component, inject } from '@angular/core';
import { ProjectStore } from '../../core/project/project.store';
import { GitStore } from '../../core/git/git.store';
import { ProfileStore } from '../../core/profile/profile.store';
import { MemoryStore } from '../../core/memory/memory.store';
import { SegmentStore } from '../../core/segment/segment.store';
import { RuntimeStore } from '../../core/runtime/runtime.store';

@Component({
  selector: 'app-project',
  standalone: true,
  template: `
    <div class="project-workspace">
      <div class="metric-grid">
        <div class="metric">
          <div class="metric-value" [class.green-text]="project.isLoaded()">
            {{ project.isLoaded() ? 'VALID' : 'NO PROJECT' }}
          </div>
          <div class="metric-label">Project Health</div>
        </div>
        <div class="metric">
          <div class="metric-value">{{ segments.segments().length }}</div>
          <div class="metric-label">Total Segments</div>
        </div>
        <div class="metric">
          <div class="metric-value yellow-text">{{ runtime.warningCount() }}</div>
          <div class="metric-label">Active Warnings</div>
        </div>
        <div class="metric">
          <div class="metric-value">{{ memory.records().length }}</div>
          <div class="metric-label">Memory Records</div>
        </div>
      </div>

      <div class="card-row">
        <div class="card">
          <div class="card-head">
            <span>Project Actions</span>
          </div>
          <div class="card-body action-body">
            <button class="action-btn" id="open-project-btn" (click)="openProject()">
              <span class="action-icon">📂</span>
              <div>
                <div class="action-label">Open Project</div>
                <div class="action-desc">Open an existing fenestrator project folder</div>
              </div>
            </button>
            <button class="action-btn" id="init-project-btn" (click)="showInit = !showInit">
              <span class="action-icon">✦</span>
              <div>
                <div class="action-label">Initialize New Project</div>
                <div class="action-desc">Create a new translation repository structure</div>
              </div>
            </button>
          </div>
        </div>

        <div class="card">
          <div class="card-head">
            <span>Project Manifest</span>
            @if (project.isLoaded()) {
              <span class="pill pill-green">loaded</span>
            } @else {
              <span class="pill pill-muted">no project</span>
            }
          </div>
          <div class="card-body">
            @if (project.isLoaded() && project.manifest()) {
              <div class="manifest-row">
                <span class="manifest-key">Project</span>
                <span>{{ project.manifest()!.projectName }}</span>
              </div>
              <div class="manifest-row">
                <span class="manifest-key">Root</span>
                <code class="mono">{{ project.projectRoot() }}</code>
              </div>
              <div class="manifest-row">
                <span class="manifest-key">Languages</span>
                <span>{{ project.manifest()!.sourceLanguage }} → {{ project.manifest()!.targetLanguage }}</span>
              </div>
              <div class="manifest-row">
                <span class="manifest-key">Profile</span>
                <code class="mono">{{ project.manifest()!.defaultProfile }}</code>
              </div>
              @if (project.manifest()!.authors.length > 0) {
                <div class="manifest-row">
                  <span class="manifest-key">Authors</span>
                  <span>{{ project.manifest()!.authors.map(a => a.email).join(', ') }}</span>
                </div>
              }
            } @else {
              <p class="empty-state">Open a project folder to see manifest details.</p>
            }
          </div>
        </div>

        <div class="card">
          <div class="card-head">
            <span>Git Status</span>
            <span class="pill" [class]="git.isDirty() ? 'pill-yellow' : 'pill-green'">
              {{ git.cleanStatus() }}
            </span>
          </div>
          <div class="card-body">
            <div class="manifest-row">
              <span class="manifest-key">Branch</span>
              <code class="mono">{{ git.branch() }}</code>
            </div>
            <div class="manifest-row">
              <span class="manifest-key">Changed</span>
              <span>{{ git.changedFiles().length }} files</span>
            </div>
          </div>
        </div>
      </div>

      @if (project.error()) {
        <div class="error-banner">
          <strong>Error:</strong> {{ project.error() }}
        </div>
      }
    </div>
  `,
  styles: [`
    .project-workspace {
      padding: 20px;
      overflow: auto;
      height: 100%;
    }
    .metric-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 12px;
      margin-bottom: 20px;
    }
    .metric {
      background: var(--surface);
      border-radius: var(--radius);
      padding: 18px;
      border: 1px solid var(--border);
    }
    .metric-value {
      font-size: 26px; font-weight: 800;
      font-family: var(--font-mono);
      color: var(--fg);
    }
    .metric-value.green-text { color: var(--green); }
    .metric-value.yellow-text { color: var(--yellow); }
    .metric-label {
      font-size: 11px; color: var(--muted);
      text-transform: uppercase; letter-spacing: 0.05em; margin-top: 4px;
    }
    .card-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
    .card {
      background: var(--surface);
      border-radius: var(--radius);
      border: 1px solid var(--border);
      border-top: 2px solid var(--accent);
      overflow: hidden;
    }
    .card-head {
      padding: 14px 16px;
      border-bottom: 1px solid var(--border);
      font-weight: 700; font-size: 13px;
      display: flex; justify-content: space-between; align-items: center;
    }
    .card-body { padding: 16px; }
    .action-body { display: flex; flex-direction: column; gap: 8px; }
    .action-btn {
      display: flex; align-items: center; gap: 14px;
      padding: 14px;
      border-radius: 10px;
      background: var(--bg);
      border: 1px solid var(--border);
      text-align: left;
      width: 100%;
      transition: border-color 0.15s, background 0.15s;
    }
    .action-btn:hover { border-color: var(--accent); background: color-mix(in oklch, var(--accent) 4%, transparent); }
    .action-icon { font-size: 22px; }
    .action-label { font-weight: 600; font-size: 13px; color: var(--fg); margin-bottom: 2px; }
    .action-desc { font-size: 12px; color: var(--subtle); }
    .manifest-row {
      display: flex; gap: 12px; align-items: baseline;
      padding: 7px 0; border-bottom: 1px solid var(--border);
      font-size: 13px;
    }
    .manifest-row:last-child { border-bottom: none; }
    .manifest-key { color: var(--subtle); font-size: 11px; width: 70px; flex-shrink: 0; }
    .empty-state { color: var(--subtle); font-size: 13px; }
    .error-banner {
      margin-top: 16px; padding: 12px 16px;
      background: oklch(72% 0.19 28 / 0.1); border: 1px solid var(--red);
      border-radius: var(--radius-sm); color: var(--red); font-size: 13px;
    }
  `],
})
export class ProjectComponent {
  protected readonly project = inject(ProjectStore);
  protected readonly git = inject(GitStore);
  protected readonly profile = inject(ProfileStore);
  protected readonly memory = inject(MemoryStore);
  protected readonly segments = inject(SegmentStore);
  protected readonly runtime = inject(RuntimeStore);
  protected showInit = false;

  async openProject(): Promise<void> {
    await this.project.openProjectRequested();
  }
}
