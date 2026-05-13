import { Injectable, computed, signal } from '@angular/core';

export interface Provider {
  id: string;
  name: string;
  type: 'cli' | 'online';
  isAvailable: boolean;
}

interface ProviderState {
  providers: Provider[];
  activeProviderId: string;
  hasAnthropicKey: boolean;
  status: 'idle' | 'loading' | 'saving' | 'error';
  error: string | null;
}

@Injectable({ providedIn: 'root' })
export class ProviderStore {
  private readonly _state = signal<ProviderState>({
    providers: [],
    activeProviderId: 'anthropic-api',
    hasAnthropicKey: false,
    status: 'idle',
    error: null,
  });

  readonly providers = computed(() => this._state().providers);
  readonly activeProviderId = computed(() => this._state().activeProviderId);
  readonly hasAnthropicKey = computed(() => this._state().hasAnthropicKey);
  readonly status = computed(() => this._state().status);
  readonly error = computed(() => this._state().error);

  async loadProviders(): Promise<void> {
    this._state.update((s) => ({ ...s, status: 'loading', error: null }));
    try {
      const res = await fetch('http://127.0.0.1:3000/api/settings/providers');
      if (!res.ok) throw new Error('Failed to load providers');
      const data = await res.json();
      this._state.update((s) => ({
        ...s,
        providers: data.providers,
        activeProviderId: data.activeProviderId || 'anthropic-api',
        hasAnthropicKey: data.hasAnthropicKey,
        status: 'idle',
      }));
    } catch (e: any) {
      this._state.update((s) => ({ ...s, status: 'error', error: e.message }));
    }
  }

  async saveConfiguration(activeProviderId: string, anthropicKey?: string): Promise<void> {
    this._state.update((s) => ({ ...s, status: 'saving', error: null }));
    try {
      const res = await fetch('http://127.0.0.1:3000/api/settings/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activeProviderId, anthropicKey }),
      });
      if (!res.ok) throw new Error('Failed to save configuration');
      await this.loadProviders(); // Refresh state
    } catch (e: any) {
      this._state.update((s) => ({ ...s, status: 'error', error: e.message }));
    }
  }
}
