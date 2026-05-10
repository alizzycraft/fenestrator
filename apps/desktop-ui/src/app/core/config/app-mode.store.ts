import { Injectable, signal, computed } from '@angular/core';

export type AppMode = 'web' | 'desktop';

@Injectable({ providedIn: 'root' })
export class AppModeStore {
  private readonly _mode = signal<AppMode>('web');
  
  readonly mode = computed(() => this._mode());

  constructor() {
    this.detectMode();
  }

  private async detectMode(): Promise<void> {
    try {
      const res = await fetch('http://127.0.0.1:3000/api/health', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'ok') {
          this._mode.set('desktop');
          console.log('App Mode: Desktop (Local API connected)');
          return;
        }
      }
    } catch (e) {
      // Fetch failed, assume web mode
    }
    console.log('App Mode: Web (Local API not found)');
    this._mode.set('web');
  }
}
