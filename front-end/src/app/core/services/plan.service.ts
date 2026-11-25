import { computed, inject, Injectable, signal } from '@angular/core';
import { ApiService, NotifyService } from '../api/api.service';
import { Routine } from '../models';
import { WEEK_PLAN } from '../content/routines';
import { LibraryService } from './library.service';

/** The user's weekly training plan: one routine (or a rest day) per weekday. */
@Injectable({ providedIn: 'root' })
export class PlanService {
  private readonly library = inject(LibraryService);
  private readonly api = inject(ApiService);
  private readonly notify = inject(NotifyService);

  /** Indexed by weekday, Sunday = 0. Null is a rest day. */
  readonly week = signal<(string | null)[]>([...WEEK_PLAN]);

  hydrate(week: (string | null)[]): void {
    this.week.set(week);
  }

  readonly trainingDaysPerWeek = computed(() => this.week().filter(Boolean).length);

  routineForWeekday(weekday: number): Routine | null {
    const id = this.week()[weekday];
    return id ? (this.library.routine(id) ?? null) : null;
  }

  plannedFor(date: Date): Routine | null {
    return this.routineForWeekday(date.getDay());
  }

  setWeekday(weekday: number, routineId: string | null): void {
    const before = this.week();
    const next = before.map((id, i) => (i === weekday ? routineId : id));
    this.week.set(next);
    this.api.put('/me/plan', { week: next }).catch((err) => {
      this.week.set(before);
      this.notify.saveFailed(err, 'your plan');
    });
  }
}
