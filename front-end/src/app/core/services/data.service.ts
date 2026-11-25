import { effect, inject, Injectable, signal, untracked } from '@angular/core';
import { ApiService, describeError } from '../api/api.service';
import { AuthService } from '../api/auth.service';
import { ROUTINES, WEEK_PLAN } from '../content/routines';
import {
  BodyWeightEntry,
  FoodEntry,
  Goal,
  NutritionCheckIn,
  ProgressPhoto,
  Routine,
  StepEntry,
  Unit,
  WorkoutSession,
} from '../models';
import { isoDate, LB_PER_KG } from '../util';
import { HistoryService } from './history.service';
import { LibraryService } from './library.service';
import { PlanService } from './plan.service';
import { RestTimerService } from './rest-timer.service';
import { SessionService } from './session.service';
import { SettingsService } from './settings.service';
import {
  BodyWeightService,
  GoalService,
  LessonProgressService,
  NutritionService,
  PhotosService,
  StepsService,
} from './tracking.service';

interface MeResponse {
  uid: string;
  email: string | null;
  name: string;
  unit: Unit;
  stepGoal: number;
  weekPlan: (string | null)[];
  goal: Goal;
  lessonsDone: string[];
}

export type LoadStatus = 'signed-out' | 'loading' | 'ready' | 'error';

/**
 * Loads everything for the signed-in user from the API into the app's services,
 * and clears it all on sign-out. Screens read the services as before.
 */
@Injectable({ providedIn: 'root' })
export class DataService {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly settings = inject(SettingsService);
  private readonly plan = inject(PlanService);
  private readonly goals = inject(GoalService);
  private readonly lessons = inject(LessonProgressService);
  private readonly library = inject(LibraryService);
  private readonly history = inject(HistoryService);
  private readonly session = inject(SessionService);
  private readonly rest = inject(RestTimerService);
  private readonly weights = inject(BodyWeightService);
  private readonly nutrition = inject(NutritionService);
  private readonly steps = inject(StepsService);
  private readonly photos = inject(PhotosService);

  readonly status = signal<LoadStatus>('signed-out');
  readonly error = signal<string | null>(null);
  readonly email = signal<string | null>(null);

  private loading: Promise<void> | null = null;
  private loadingFor: string | null = null;
  private loadedFor: string | null = null;

  constructor() {
    // Follow the signed-in user: load their data, or clear it on sign-out.
    effect(() => {
      const user = this.auth.user();
      untracked(() => {
        if (user === undefined) return;
        if (user === null) this.clear();
        else if (this.loadedFor !== user.uid) this.load().catch(() => undefined);
      });
    });
  }

  /** Waits until the signed-in user's data is loaded (used by route guards). */
  async ensureLoaded(): Promise<void> {
    await this.auth.whenReady();
    const uid = this.auth.user()?.uid;
    if (!uid) return;
    if (this.loadedFor === uid && this.status() === 'ready') return;
    await this.load();
  }

  /** Loads the signed-in user's data. Concurrent calls for the same user share one load. */
  load(): Promise<void> {
    const uid = this.auth.user()?.uid ?? null;
    if (this.loading && this.loadingFor === uid) return this.loading;
    this.loadingFor = uid;
    this.loading = this.doLoad().finally(() => {
      this.loading = null;
      this.loadingFor = null;
    });
    return this.loading;
  }

  private async doLoad(): Promise<void> {
    this.status.set('loading');
    this.error.set(null);
    try {
      const [me, routines, sessions, active, weights, foods, checkIns, steps, photos] = await Promise.all([
        this.api.get<MeResponse>('/me'),
        this.api.get<{ routines: Routine[] }>('/routines'),
        this.api.get<{ sessions: WorkoutSession[] }>('/sessions'),
        this.api.get<{ session: WorkoutSession | null }>('/sessions/active'),
        this.api.get<{ entries: BodyWeightEntry[] }>('/body-weight'),
        this.api.get<{ entries: FoodEntry[] }>('/foods'),
        this.api.get<{ entries: NutritionCheckIn[] }>('/check-ins'),
        this.api.get<{ entries: StepEntry[] }>('/steps'),
        this.api.get<{ photos: ProgressPhoto[] }>('/photos'),
      ]);
      this.email.set(me.email);
      this.settings.hydrate(me);
      this.plan.hydrate(me.weekPlan);
      this.goals.hydrate(me.goal);
      this.lessons.hydrate(me.lessonsDone);
      this.library.hydrate(routines.routines);
      this.history.hydrate(sessions.sessions);
      this.session.hydrate(active.session);
      this.weights.hydrate(weights.entries);
      this.nutrition.hydrate(foods.entries, checkIns.entries);
      this.steps.hydrate(steps.entries);
      this.photos.hydrate(photos.photos);
      this.loadedFor = me.uid;
      this.status.set('ready');
    } catch (err) {
      this.status.set('error');
      this.error.set(describeError(err, "Couldn't load your data."));
      throw err;
    }
  }

  /** Replaces this account's data with sample history, then reloads. */
  async loadSampleData(): Promise<void> {
    await this.api.post('/me/demo-data', { today: isoDate() });
    await this.load();
  }

  /** Deletes everything stored for this account, then reloads (a fresh, empty profile). */
  async deleteAllData(): Promise<void> {
    await this.api.delete('/me/data');
    this.rest.skip();
    await this.load();
  }

  private clear(): void {
    this.loadedFor = null;
    this.email.set(null);
    this.status.set('signed-out');
    this.settings.hydrate({ name: '', unit: 'lb', stepGoal: 10000 });
    this.plan.hydrate([...WEEK_PLAN]);
    this.goals.hydrate({
      type: 'maintain', pace: 'moderate', weeklyRateKg: 0, startDate: isoDate(),
      startingWeightKg: 180 / LB_PER_KG, dailyCalories: 2200,
    });
    this.lessons.hydrate([]);
    this.library.hydrate(structuredClone(ROUTINES));
    this.history.hydrate([]);
    this.session.hydrate(null);
    this.rest.skip();
    this.weights.hydrate([]);
    this.nutrition.hydrate([], []);
    this.steps.hydrate([]);
    this.photos.hydrate([]);
  }
}
