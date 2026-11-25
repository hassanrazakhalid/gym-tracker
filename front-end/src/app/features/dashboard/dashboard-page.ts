import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LESSONS } from '../../core/content/lessons';
import { NotifyService, describeError } from '../../core/api/api.service';
import { ActivityService } from '../../core/services/activity.service';
import { DataService } from '../../core/services/data.service';
import { HistoryService } from '../../core/services/history.service';
import { LibraryService } from '../../core/services/library.service';
import { PlanService } from '../../core/services/plan.service';
import { SessionService } from '../../core/services/session.service';
import { SettingsService } from '../../core/services/settings.service';
import {
  BodyWeightService,
  GoalService,
  LessonProgressService,
  NutritionService,
} from '../../core/services/tracking.service';
import { isoDate, relativeDay } from '../../core/util';
import { Icon } from '../../shared/icon';
import { CheckInSheet } from '../tracking/check-in-sheet';
import { LogWeightSheet } from '../tracking/log-weight-sheet';
import { DaySheet } from './day-sheet';

const RING_R = 15;
const RING_C = 2 * Math.PI * RING_R;

@Component({
  selector: 'app-dashboard-page',
  imports: [RouterLink, Icon, LogWeightSheet, CheckInSheet, DaySheet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss',
})
export class DashboardPage {
  protected readonly activity = inject(ActivityService);
  protected readonly settings = inject(SettingsService);
  protected readonly session = inject(SessionService);
  private readonly history = inject(HistoryService);
  private readonly library = inject(LibraryService);
  private readonly plan = inject(PlanService);
  private readonly weights = inject(BodyWeightService);
  private readonly nutrition = inject(NutritionService);
  private readonly goals = inject(GoalService);
  private readonly lessons = inject(LessonProgressService);
  private readonly data = inject(DataService);
  private readonly notify = inject(NotifyService);

  /** A new account with nothing logged yet. */
  protected readonly isNew = computed(
    () => this.history.sessions().length === 0 && !this.session.active() && !this.weights.latest(),
  );
  protected readonly loadingSample = signal(false);

  protected async loadSample(): Promise<void> {
    this.loadingSample.set(true);
    try {
      await this.data.loadSampleData();
    } catch (err) {
      this.notify.show(describeError(err, "Couldn't load sample data."));
    } finally {
      this.loadingSample.set(false);
    }
  }

  protected readonly ringC = RING_C;
  protected readonly ringR = RING_R;
  protected readonly weightOpen = signal(false);
  protected readonly checkInOpen = signal(false);
  /** Date (yyyy-mm-dd) whose day sheet is open. */
  protected readonly selectedDay = signal<string | null>(null);

  protected readonly greeting = computed(() => {
    const h = new Date().getHours();
    const part = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
    return `${part}, ${this.settings.name()}`;
  });

  protected readonly dateLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  protected readonly planned = computed(() => this.plan.plannedFor(new Date()));

  protected readonly weightSub = computed(() => {
    const l = this.weights.latest();
    if (!l) return 'No weigh-ins yet';
    return `Last: ${this.settings.formatWeight(l.weightKg)} ${this.settings.unitLabel()}, ${relativeDay(l.date)}`;
  });

  protected readonly foodSub = computed(() => {
    const t = this.nutrition.totals(isoDate());
    return `${t.calories.toLocaleString()} of ${this.goals.goal().dailyCalories.toLocaleString()} kcal logged`;
  });

  protected readonly workoutSub = computed(() => {
    if (this.activity.today().workout) return 'Done for today';
    const active = this.session.active();
    if (active) return `${active.name} in progress`;
    const p = this.planned();
    return p ? `${p.name}, about ${p.estimatedMinutes} min` : 'Rest day, nothing planned';
  });

  /** The lift with the biggest weight gain over the last ~4 weeks. */
  protected readonly insight = computed(() => {
    const cutoff = Date.now() - 28 * 86_400_000;
    let best: { name: string; gainKg: number; since: string } | null = null;
    for (const ex of this.library.exercises) {
      const h = this.history.historyFor(ex.id);
      if (h.length < 2) continue;
      const latest = Math.max(...h[0].sets.map((s) => s.weightKg ?? 0));
      const old = h.find((x) => Date.parse(x.date) <= cutoff);
      if (!old) continue;
      const before = Math.max(...old.sets.map((s) => s.weightKg ?? 0));
      const gain = latest - before;
      if (gain > 0 && (!best || gain > best.gainKg)) best = { name: ex.name, gainKg: gain, since: old.date };
    }
    if (!best) return null;
    return {
      title: `Your ${best.name} is up ${this.settings.formatWeight(best.gainKg)} ${this.settings.unitLabel()}`,
      body: `That's since ${new Date(best.since).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}. Keep adding reps and the weight will follow.`,
    };
  });

  protected readonly nextLesson = computed(() => LESSONS.find((l) => !this.lessons.completed().includes(l.id)) ?? null);

  protected planLabel(weekday: number): string {
    return this.plan.routineForWeekday(weekday)?.name ?? 'Rest';
  }

  protected dayLabel(date: string, weekday: number, count: number): string {
    const name = new Date(date + 'T12:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
    return `${name}: ${this.planLabel(weekday)}, ${count} of 4 done. Open day`;
  }

  protected ringOffset(count: number): number {
    return RING_C * (1 - count / 4);
  }
}
