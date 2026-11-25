import { computed, effect, inject, Injectable } from '@angular/core';
import { persistedSignal } from '../util';
import { ClockService } from './clock.service';

interface RestState {
  groupId: string;
  label: string;
  durationS: number;
  endsAt: number;
}

@Injectable({ providedIn: 'root' })
export class RestTimerService {
  private readonly clock = inject(ClockService);
  private readonly state = persistedSignal<RestState | null>('rest-timer', () => null);

  readonly active = computed(() => this.state() !== null && this.remaining() > 0);
  readonly label = computed(() => this.state()?.label ?? '');
  readonly groupId = computed(() => this.state()?.groupId ?? null);
  readonly duration = computed(() => this.state()?.durationS ?? 0);
  readonly remaining = computed(() => {
    const s = this.state();
    return s ? Math.max(0, (s.endsAt - this.clock.now()) / 1000) : 0;
  });
  readonly fraction = computed(() => (this.duration() ? this.remaining() / this.duration() : 0));

  constructor() {
    // When the countdown hits zero, buzz and clear.
    effect(() => {
      const s = this.state();
      if (s && this.clock.now() >= s.endsAt) {
        if ('vibrate' in navigator) navigator.vibrate?.([200, 100, 200]);
        this.state.set(null);
      }
    });
  }

  start(groupId: string, label: string, seconds: number): void {
    this.state.set({ groupId, label, durationS: seconds, endsAt: Date.now() + seconds * 1000 });
  }

  adjust(deltaSeconds: number): void {
    this.state.update((s) => {
      if (!s) return s;
      const endsAt = Math.max(Date.now() + 1000, s.endsAt + deltaSeconds * 1000);
      return { ...s, endsAt, durationS: Math.max(s.durationS + deltaSeconds, 1) };
    });
  }

  skip(): void {
    this.state.set(null);
  }
}
