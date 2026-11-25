import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GoalPace, GoalType } from '../../core/models';
import { HistoryService } from '../../core/services/history.service';
import { PlanService } from '../../core/services/plan.service';
import { SettingsService } from '../../core/services/settings.service';
import {
  BodyWeightService,
  GoalService,
  NutritionService,
  PhotosService,
  StepsService,
} from '../../core/services/tracking.service';
import { addDays, isoDate, relativeDay } from '../../core/util';
import { Icon } from '../../shared/icon';
import { LineChart } from '../../shared/line-chart';
import { Sheet } from '../../shared/sheet';

type Period = 30 | 90 | 3650;

@Component({
  selector: 'app-progress-page',
  imports: [RouterLink, Icon, LineChart, Sheet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './progress-page.html',
  styleUrl: './progress-page.scss',
})
export class ProgressPage {
  protected readonly settings = inject(SettingsService);
  protected readonly goals = inject(GoalService);
  protected readonly steps = inject(StepsService);
  protected readonly photos = inject(PhotosService);
  private readonly weights = inject(BodyWeightService);
  private readonly nutrition = inject(NutritionService);
  private readonly history = inject(HistoryService);
  private readonly plan = inject(PlanService);

  protected readonly GoalService = GoalService;
  protected readonly period = signal<Period>(30);
  protected readonly goalOpen = signal(false);
  protected readonly stepsOpen = signal(false);
  protected readonly photoError = signal('');

  // Goal editor draft.
  protected readonly draftType = signal<GoalType>('lose-fat');
  protected readonly draftPace = signal<GoalPace>('moderate');
  protected readonly draftCalories = signal(2250);

  protected readonly goalTypes: GoalType[] = ['lose-fat', 'maintain', 'build-muscle'];
  protected readonly paces: GoalPace[] = ['slow', 'moderate', 'fast'];

  protected readonly goalView = computed(() => {
    const g = this.goals.goal();
    const lb = GoalService.weeklyLb(g.type, g.pace);
    const rate =
      g.type === 'maintain'
        ? 'Hold your weight steady'
        : `${lb < 0 ? 'Lose' : 'Gain'} ${this.rateText(Math.abs(lb))} per week`;
    return {
      title: GoalService.label(g.type),
      pace: g.type === 'maintain' ? null : GoalService.paceLabel(g.pace),
      rate,
      started: `Started ${new Date(g.startDate + 'T12:00').toLocaleDateString(undefined, { month: 'long', day: 'numeric' })} at ${this.settings.formatWeight(g.startingWeightKg)} ${this.settings.unitLabel()}`,
    };
  });

  protected readonly weightView = computed(() => {
    const latest = this.weights.latest();
    const points = this.weights.since(this.period()).map((e) => ({ x: Date.parse(e.date), y: e.weightKg }));
    if (!latest) return null;
    const first = points[0]?.y ?? latest.weightKg;
    const change = (this.settings.toDisplay(latest.weightKg) ?? 0) - (this.settings.toDisplay(first) ?? 0);
    return {
      current: this.settings.formatWeight(latest.weightKg),
      when: relativeDay(latest.date),
      change: `${change > 0 ? '+' : change < 0 ? '−' : ''}${Math.abs(change).toFixed(1)} ${this.settings.unitLabel()}`,
      points: points.map((p) => ({ x: p.x, y: this.settings.toDisplay(p.y) ?? 0 })),
    };
  });

  protected readonly nutritionView = computed(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = addDays(new Date(), i - 6);
      return {
        date: isoDate(d),
        label: d.toLocaleDateString(undefined, { weekday: 'narrow' }),
        logged: this.nutrition.loggedDates().has(isoDate(d)),
      };
    });
    const eaten = this.nutrition.totals(isoDate()).calories;
    return {
      days,
      logged: days.filter((d) => d.logged).length,
      remaining: Math.max(0, this.goals.goal().dailyCalories - eaten),
    };
  });

  /** Workouts done vs planned, for each of the last 8 weeks (Monday start). */
  protected readonly workoutView = computed(() => {
    const dates = this.history.workoutDates();
    const today = new Date();
    const monday = addDays(today, -((today.getDay() + 6) % 7));
    const plannedPerWeek = Math.max(1, this.plan.trainingDaysPerWeek());
    const weeks = Array.from({ length: 8 }, (_, w) => {
      const start = addDays(monday, (w - 7) * 7);
      let done = 0;
      for (let i = 0; i < 7; i++) if (dates.has(isoDate(addDays(start, i)))) done++;
      return { start: isoDate(start), done, label: start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) };
    });
    // Consistency over the 4 full weeks before this one.
    const full = weeks.slice(3, 7);
    const consistency = Math.round((full.reduce((n, w) => n + Math.min(w.done, plannedPerWeek), 0) / (plannedPerWeek * 4)) * 100);
    const thisWeek = weeks[7];
    const weekSessions = this.history.sessions().filter((s) => isoDate(new Date(s.startedAt)) >= thisWeek.start);
    const prs = weekSessions.reduce((n, s) => n + this.history.prCountFor(s.id), 0);
    return { weeks, consistency, planned: plannedPerWeek, thisWeek: thisWeek.done, prs };
  });

  protected readonly draftRate = computed(() => {
    const lb = GoalService.weeklyLb(this.draftType(), this.draftPace());
    return `${lb > 0 ? 'Gain' : 'Lose'} ${this.rateText(Math.abs(lb))} per week`;
  });

  protected readonly stepsPct = computed(() => Math.min(100, (this.steps.today() / this.settings.stepGoal()) * 100));

  private rateText(lb: number): string {
    return this.settings.unit() === 'lb' ? `${lb} lb` : `${(lb / 2.20462).toFixed(2).replace(/0$/, '')} kg`;
  }

  protected openGoal(): void {
    const g = this.goals.goal();
    this.draftType.set(g.type);
    this.draftPace.set(g.pace);
    this.draftCalories.set(g.dailyCalories);
    this.goalOpen.set(true);
  }

  protected saveGoal(): void {
    this.goals.update(this.draftType(), this.draftPace(), this.draftCalories());
    this.goalOpen.set(false);
  }

  protected saveSteps(raw: string): void {
    const n = parseInt(raw, 10);
    if (Number.isFinite(n) && n >= 0) this.steps.set(n);
    this.stepsOpen.set(false);
  }

  protected async addPhoto(e: Event): Promise<void> {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    try {
      this.photoError.set('');
      await this.photos.add(file);
    } catch {
      this.photoError.set("That file couldn't be read as an image. Try a JPG or PNG.");
    }
  }

  protected barHeight(done: number): number {
    return Math.min(100, (done / this.workoutView().planned) * 100);
  }
}
