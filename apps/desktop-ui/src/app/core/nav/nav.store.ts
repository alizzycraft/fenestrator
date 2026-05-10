import { computed, Injectable, signal } from '@angular/core';

export type Screen = 'sandbox' | 'project' | 'terminology' | 'memory' | 'git' | 'settings';
export type ReviewTab = 'memory' | 'diagnostics' | 'git';

interface NavState {
  activeScreen: Screen;
  reviewTab: ReviewTab;
  sourcePaneCollapsed: boolean;
  inspectorPaneCollapsed: boolean;
  reviewRailCollapsed: boolean;
}

@Injectable({ providedIn: 'root' })
export class NavStore {
  private readonly _state = signal<NavState>({
    activeScreen: 'sandbox',
    reviewTab: 'memory',
    sourcePaneCollapsed: false,
    inspectorPaneCollapsed: true,
    reviewRailCollapsed: true,
  });

  readonly activeScreen = computed(() => this._state().activeScreen);
  readonly reviewTab = computed(() => this._state().reviewTab);
  readonly sourcePaneCollapsed = computed(() => this._state().sourcePaneCollapsed);
  readonly inspectorPaneCollapsed = computed(() => this._state().inspectorPaneCollapsed);
  readonly reviewRailCollapsed = computed(() => this._state().reviewRailCollapsed);

  readonly workbenchClass = computed(() => {
    const s = this._state();
    const classes = ['workbench'];
    if (s.sourcePaneCollapsed) classes.push('source-collapsed');
    if (s.inspectorPaneCollapsed) classes.push('inspector-collapsed');
    if (s.reviewRailCollapsed) classes.push('review-collapsed');
    return classes.join(' ');
  });

  screenActivated(screen: Screen): void {
    this._state.update((s) => ({ ...s, activeScreen: screen }));
  }

  reviewTabActivated(tab: ReviewTab): void {
    this._state.update((s) => ({ ...s, reviewTab: tab }));
  }

  toggleSourcePane(): void {
    this._state.update((s) => ({ ...s, sourcePaneCollapsed: !s.sourcePaneCollapsed }));
  }

  toggleInspectorPane(): void {
    this._state.update((s) => ({ ...s, inspectorPaneCollapsed: !s.inspectorPaneCollapsed }));
  }

  toggleReviewRail(): void {
    this._state.update((s) => ({ ...s, reviewRailCollapsed: !s.reviewRailCollapsed }));
  }

  collapseAll(): void {
    this._state.update((s) => ({
      ...s,
      sourcePaneCollapsed: true,
      inspectorPaneCollapsed: true,
      reviewRailCollapsed: true,
    }));
  }

  expandAll(): void {
    this._state.update((s) => ({
      ...s,
      sourcePaneCollapsed: false,
      inspectorPaneCollapsed: false,
      reviewRailCollapsed: false,
    }));
  }
}
