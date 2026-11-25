import { computed, inject, Injectable } from '@angular/core';
import { addDays, isoDate } from '../util';
import { HistoryService } from './history.service';
import { BodyWeightService, NutritionService } from './tracking.service';

export interface DayActivity {
  date: string;
  checkIn: boolean;
  weight: boolean;
  food: boolean;
  workout: boolean;
  /** 0–4 checklist items done. */
  count: number;
}

/** The four daily checklist items, per day, and the streak built from them. */
@Injectable({ providedIn: 'root' })
export class ActivityService {
  private readonly history = inject(HistoryService);
  private readonly weight = inject(BodyWeightService);
  private readonly nutrition = inject(NutritionService);

  private readonly weightDates = computed(() => new Set(this.weight.entries().map((e) => e.date)));
  private readonly checkInDates = computed(() => new Set(this.nutrition.checkIns().map((c) => c.date)));

  day(date: string): DayActivity {
    const checkIn = this.checkInDates().has(date);
    const weight = this.weightDates().has(date);
    const food = this.nutrition.loggedDates().has(date);
    const workout = this.history.workoutDates().has(date);
    return { date, checkIn, weight, food, workout, count: [checkIn, weight, food, workout].filter(Boolean).length };
  }

  readonly today = computed(() => this.day(isoDate()));

  /** Days in a row with at least one checklist item done. Today counts once anything is done. */
  readonly streak = computed(() => {
    let d = new Date();
    if (this.day(isoDate(d)).count === 0) d = addDays(d, -1);
    let n = 0;
    while (this.day(isoDate(d)).count > 0 && n < 365) {
      n++;
      d = addDays(d, -1);
    }
    return n;
  });

  /** Monday-to-Sunday week containing today. */
  readonly week = computed(() => {
    const today = new Date();
    const monday = addDays(today, -((today.getDay() + 6) % 7));
    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(monday, i);
      const date = isoDate(d);
      return {
        ...this.day(date),
        weekday: d.toLocaleDateString(undefined, { weekday: 'narrow' }),
        weekdayIndex: d.getDay(),
        dayOfMonth: d.getDate(),
        isToday: date === isoDate(today),
        isFuture: d > today && date !== isoDate(today),
      };
    });
  });
}
