import { Injectable, signal } from '@angular/core';

export interface EffortTarget {
  exId: string;
  setId: string;
  label: string;
  weightKg: number;
  reps: number;
  /** True when changing the rating of a set that's already complete. */
  editing: boolean;
}

/** Which sheet is open on the session screen. Provided by SessionPage only. */
@Injectable()
export class SessionUi {
  readonly effort = signal<EffortTarget | null>(null);
  readonly menuFor = signal<string | null>(null);
  readonly picker = signal<{ mode: 'swap'; exId: string } | { mode: 'add' } | null>(null);
  readonly formGuideFor = signal<string | null>(null);
  readonly restFor = signal<string | null>(null);
  readonly reorderOpen = signal(false);
  readonly finishOpen = signal(false);
  readonly optionsOpen = signal(false);
  readonly discardOpen = signal(false);
  readonly collapsed = signal<ReadonlySet<string>>(new Set());

  toggleCollapsed(id: string): void {
    this.collapsed.update((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
}
