import { computed, inject, Injectable, signal } from '@angular/core';
import { ApiService, NotifyService } from '../api/api.service';
import { Unit } from '../models';
import { incrementKgFor } from '../logic/progression';
import { LB_PER_KG } from '../util';

export interface Settings {
  name: string;
  unit: Unit;
  stepGoal: number;
}

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly api = inject(ApiService);
  private readonly notify = inject(NotifyService);

  private readonly state = signal<Settings>({ name: '', unit: 'lb', stepGoal: 10000 });

  readonly name = computed(() => this.state().name);
  readonly unit = computed(() => this.state().unit);
  readonly stepGoal = computed(() => this.state().stepGoal);
  readonly unitLabel = computed(() => (this.unit() === 'lb' ? 'lbs' : 'kg'));
  readonly incrementKg = computed(() => incrementKgFor(this.unit()));

  hydrate(settings: Settings): void {
    this.state.set({ name: settings.name, unit: settings.unit, stepGoal: settings.stepGoal });
  }

  update(patch: Partial<Settings>): void {
    const before = this.state();
    this.state.set({ ...before, ...patch });
    this.api.patch('/me', patch).catch((err) => {
      this.state.set(before);
      this.notify.saveFailed(err, 'your settings');
    });
  }

  /** kg → number in the user's unit, rounded to the nearest 0.5. */
  toDisplay(kg: number | null | undefined): number | null {
    if (kg == null) return null;
    const v = this.unit() === 'lb' ? kg * LB_PER_KG : kg;
    return Math.round(v * 2) / 2;
  }

  fromDisplay(value: number): number {
    return this.unit() === 'lb' ? value / LB_PER_KG : value;
  }

  /** "90" or "92.5"; "BW" for bodyweight-only sets. */
  formatWeight(kg: number | null | undefined): string {
    const v = this.toDisplay(kg);
    if (v == null) return '–';
    if (v === 0) return 'BW';
    return Number.isInteger(v) ? String(v) : v.toFixed(1);
  }
}
