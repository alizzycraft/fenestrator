import { Component, inject } from '@angular/core';
import { NavStore } from '../../core/nav/nav.store';
import { SegmentStore } from '../../core/segment/segment.store';
import { ProfileStore } from '../../core/profile/profile.store';
import { RuntimeStore } from '../../core/runtime/runtime.store';

@Component({
  selector: 'app-statusbar',
  standalone: true,
  template: `
    <footer class="statusbar">
      <div class="status-left">
        @if (segment.activeSegment()) {
          Active: <strong class="mono green-text">{{ segment.activeSegmentId() }}</strong>
        }
        @if (profile.activeProfile()) {
          &nbsp;· Profile: <strong>{{ profile.activeProfile()!.meta.id }}</strong>
        }
      </div>
      <div class="status-right mono">
        @if (runtime.activeRunId()) {
          {{ runtime.activeRunId() }}
          @if (runtime.lastRunDurationMs()) {
            · {{ runtime.lastRunDurationMs() }}ms
          }
          ·
        }
        branch {{ 'main' }}
      </div>
    </footer>
  `,
  styles: [`
    .statusbar {
      background: var(--shell);
      border-top: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px;
      font-size: 12px;
      color: var(--subtle);
      grid-column: 1 / -1;
    }
    .green-text { color: var(--green); }
    .status-right { font-size: 11px; }
  `],
})
export class StatusbarComponent {
  protected readonly nav = inject(NavStore);
  protected readonly segment = inject(SegmentStore);
  protected readonly profile = inject(ProfileStore);
  protected readonly runtime = inject(RuntimeStore);
}
