import { computed, inject, Injectable, signal } from '@angular/core';
import {
  BodyWeightEntry,
  FoodEntry,
  Goal,
  GoalPace,
  GoalType,
  Meal,
  NutritionCheckIn,
  ProgressPhoto,
  StepEntry,
} from '../models';
import { ApiService, NotifyService } from '../api/api.service';
import { isoDate, LB_PER_KG, uid } from '../util';

/** Weekly rate in lb by goal and pace; converted to kg when stored. */
const PACE_LB: Record<GoalType, Record<GoalPace, number>> = {
  'lose-fat': { slow: -0.5, moderate: -1, fast: -1.5 },
  maintain: { slow: 0, moderate: 0, fast: 0 },
  'build-muscle': { slow: 0.25, moderate: 0.5, fast: 0.75 },
};

const DEFAULT_GOAL: Goal = {
  type: 'maintain',
  pace: 'moderate',
  weeklyRateKg: 0,
  startDate: isoDate(),
  startingWeightKg: 180 / LB_PER_KG,
  dailyCalories: 2200,
};

@Injectable({ providedIn: 'root' })
export class BodyWeightService {
  private readonly api = inject(ApiService);
  private readonly notify = inject(NotifyService);

  /** Newest first. One entry per day; the id is the date. */
  readonly entries = signal<BodyWeightEntry[]>([]);
  readonly latest = computed(() => this.entries()[0] ?? null);
  readonly loggedToday = computed(() => this.latest()?.date === isoDate());

  hydrate(entries: BodyWeightEntry[]): void {
    this.entries.set(entries);
  }

  log(weightKg: number, date = isoDate()): void {
    const before = this.entries();
    this.entries.set(
      [{ id: date, date, weightKg }, ...before.filter((e) => e.date !== date)].sort((a, b) => b.date.localeCompare(a.date)),
    );
    this.api.put(`/body-weight/${date}`, { weightKg }).catch((err) => {
      this.entries.set(before);
      this.notify.saveFailed(err, 'your weight');
    });
  }

  remove(id: string): void {
    const before = this.entries();
    this.entries.set(before.filter((e) => e.id !== id));
    this.api.delete(`/body-weight/${id}`).catch((err) => {
      this.entries.set(before);
      this.notify.saveFailed(err, 'that change');
    });
  }

  /** Entries within the last `days` days, oldest first, for charts. */
  since(days: number): BodyWeightEntry[] {
    const from = isoDate(new Date(Date.now() - days * 86_400_000));
    return this.entries().filter((e) => e.date >= from).reverse();
  }
}

@Injectable({ providedIn: 'root' })
export class GoalService {
  private readonly api = inject(ApiService);
  private readonly notify = inject(NotifyService);

  readonly goal = signal<Goal>(DEFAULT_GOAL);

  hydrate(goal: Goal): void {
    this.goal.set(goal);
  }

  update(type: GoalType, pace: GoalPace, dailyCalories: number): void {
    this.save({ ...this.goal(), type, pace, dailyCalories, weeklyRateKg: PACE_LB[type][pace] / LB_PER_KG });
  }

  restart(startingWeightKg: number): void {
    this.save({ ...this.goal(), startDate: isoDate(), startingWeightKg });
  }

  private save(next: Goal): void {
    const before = this.goal();
    this.goal.set(next);
    this.api.put('/me/goal', next).catch((err) => {
      this.goal.set(before);
      this.notify.saveFailed(err, 'your goal');
    });
  }

  static label(type: GoalType): string {
    return { 'lose-fat': 'Lose fat', maintain: 'Maintain weight', 'build-muscle': 'Build muscle' }[type];
  }

  static paceLabel(pace: GoalPace): string {
    return { slow: 'Slow pace', moderate: 'Moderate pace', fast: 'Fast pace' }[pace];
  }

  static weeklyLb(type: GoalType, pace: GoalPace): number {
    return PACE_LB[type][pace];
  }
}

@Injectable({ providedIn: 'root' })
export class NutritionService {
  private readonly api = inject(ApiService);
  private readonly notify = inject(NotifyService);

  readonly foods = signal<FoodEntry[]>([]);
  readonly checkIns = signal<NutritionCheckIn[]>([]);

  readonly checkedInToday = computed(() => this.checkIns().some((c) => c.date === isoDate()));
  readonly loggedDates = computed(() => new Set(this.foods().map((f) => f.date)));

  hydrate(foods: FoodEntry[], checkIns: NutritionCheckIn[]): void {
    this.foods.set(foods);
    this.checkIns.set(checkIns);
  }

  forDate(date: string): FoodEntry[] {
    return this.foods().filter((f) => f.date === date);
  }

  totals(date: string): { calories: number; proteinG: number } {
    return this.forDate(date).reduce(
      (t, f) => ({ calories: t.calories + f.calories, proteinG: t.proteinG + f.proteinG }),
      { calories: 0, proteinG: 0 },
    );
  }

  add(date: string, meal: Meal, name: string, calories: number, proteinG: number): void {
    const tempId = uid('tmp');
    const body = { date, meal, name, calories, proteinG };
    this.foods.update((list) => [...list, { id: tempId, ...body }]);
    this.api
      .post<{ entry: FoodEntry }>('/foods', body)
      .then(({ entry }) => this.foods.update((list) => list.map((f) => (f.id === tempId ? entry : f))))
      .catch((err) => {
        this.foods.update((list) => list.filter((f) => f.id !== tempId));
        this.notify.saveFailed(err, name);
      });
  }

  remove(id: string): void {
    const before = this.foods();
    this.foods.set(before.filter((f) => f.id !== id));
    if (id.startsWith('tmp_')) return; // not saved yet
    this.api.delete(`/foods/${id}`).catch((err) => {
      this.foods.set(before);
      this.notify.saveFailed(err, 'that change');
    });
  }

  checkIn(entry: NutritionCheckIn): void {
    const before = this.checkIns();
    this.checkIns.set([entry, ...before.filter((c) => c.date !== entry.date)]);
    const { date, ...body } = entry;
    this.api.put(`/check-ins/${date}`, body).catch((err) => {
      this.checkIns.set(before);
      this.notify.saveFailed(err, 'your check-in');
    });
  }

  /** Days with any food logged in the 7 days ending today. */
  daysLoggedLastWeek(): number {
    let n = 0;
    for (let i = 0; i < 7; i++) {
      if (this.loggedDates().has(isoDate(new Date(Date.now() - i * 86_400_000)))) n++;
    }
    return n;
  }
}

@Injectable({ providedIn: 'root' })
export class StepsService {
  private readonly api = inject(ApiService);
  private readonly notify = inject(NotifyService);

  readonly entries = signal<StepEntry[]>([]);
  readonly today = computed(() => this.entries().find((e) => e.date === isoDate())?.steps ?? 0);

  hydrate(entries: StepEntry[]): void {
    this.entries.set(entries);
  }

  set(steps: number, date = isoDate()): void {
    const before = this.entries();
    this.entries.set([{ date, steps }, ...before.filter((e) => e.date !== date)]);
    this.api.put(`/steps/${date}`, { steps }).catch((err) => {
      this.entries.set(before);
      this.notify.saveFailed(err, 'your steps');
    });
  }
}

@Injectable({ providedIn: 'root' })
export class PhotosService {
  private readonly api = inject(ApiService);
  private readonly notify = inject(NotifyService);

  readonly photos = signal<ProgressPhoto[]>([]);

  hydrate(photos: ProgressPhoto[]): void {
    this.photos.set(photos);
  }

  /** Downscales the image so it stays small, then uploads it. */
  async add(file: File): Promise<void> {
    const dataUrl = await downscale(file, 720);
    try {
      const { photo } = await this.api.post<{ photo: ProgressPhoto }>('/photos', { date: isoDate(), dataUrl });
      this.photos.update((list) => [photo, ...list]);
    } catch (err) {
      this.notify.saveFailed(err, 'the photo');
    }
  }

  remove(id: string): void {
    const before = this.photos();
    this.photos.set(before.filter((p) => p.id !== id));
    this.api.delete(`/photos/${id}`).catch((err) => {
      this.photos.set(before);
      this.notify.saveFailed(err, 'that change');
    });
  }
}

function downscale(file: File, maxSide: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(img.src);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

@Injectable({ providedIn: 'root' })
export class LessonProgressService {
  private readonly api = inject(ApiService);
  private readonly notify = inject(NotifyService);

  readonly completed = signal<string[]>([]);

  hydrate(ids: string[]): void {
    this.completed.set(ids);
  }

  isDone(id: string): boolean {
    return this.completed().includes(id);
  }

  toggle(id: string): void {
    const before = this.completed();
    const next = before.includes(id) ? before.filter((x) => x !== id) : [...before, id];
    this.completed.set(next);
    this.api.put('/me/lessons', { completed: next }).catch((err) => {
      this.completed.set(before);
      this.notify.saveFailed(err, 'your lesson progress');
    });
  }
}
