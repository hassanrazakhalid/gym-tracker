import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ActivityService } from '../../core/services/activity.service';
import { HistoryService } from '../../core/services/history.service';
import { LibraryService } from '../../core/services/library.service';
import { PlanService } from '../../core/services/plan.service';
import { SessionService } from '../../core/services/session.service';
import { formatWorkoutLength, isoDate, parseIsoDate } from '../../core/util';
import { Icon } from '../../shared/icon';
import { Sheet } from '../../shared/sheet';
import { DiscardSheet } from '../workout/discard-sheet';

/**
 * One day from the week strip: what got done that day, and what the user trains
 * on that weekday. Changing the plan applies to the same weekday every week.
 */
@Component({
  selector: 'app-day-sheet',
  imports: [Sheet, Icon, RouterLink, DiscardSheet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-sheet [open]="!!date()" [title]="title()" [tall]="true" (closed)="closed.emit()">
      @if (view(); as v) {
        @if (!v.isFuture) {
          <section class="block">
            <h3 class="block__title">{{ v.isToday ? 'Today so far' : 'What you did' }}</h3>
            <ul class="done-list">
              @for (item of v.checklist; track item.label) {
                <li [class.is-done]="item.done">
                  <span class="tick">@if (item.done) { <app-icon name="check" [size]="13" [stroke]="3" /> }</span>
                  {{ item.label }}
                </li>
              }
            </ul>
            @for (s of v.sessions; track s.id) {
              <a class="session" [routerLink]="['/workout/sessions', s.id]" (click)="closed.emit()">
                <app-icon name="dumbbell" [size]="18" />
                <span class="session__text"><strong>{{ s.name }}</strong> {{ s.length }}</span>
                <app-icon name="chevron-right" [size]="18" class="faint" />
              </a>
            }
          </section>
        }

        <section class="block">
          <h3 class="block__title">Training plan for {{ v.weekdayPlural }}</h3>
          <p class="faint block__hint">Applies every week. You can still pick any routine on the day.</p>
          <div class="options" role="radiogroup" [attr.aria-label]="'Plan for ' + v.weekdayPlural">
            @for (r of library.routines(); track r.id) {
              <button type="button" role="radio" class="option" [attr.aria-checked]="v.plannedId === r.id"
                (click)="plan.setWeekday(v.weekday, r.id)">
                <span class="radio" aria-hidden="true"></span>
                <span class="option__text">
                  <strong>{{ r.name }}</strong>
                  <span>{{ r.focus }}</span>
                </span>
              </button>
            }
            <button type="button" role="radio" class="option" [attr.aria-checked]="v.plannedId === null"
              (click)="plan.setWeekday(v.weekday, null)">
              <span class="radio" aria-hidden="true"></span>
              <span class="option__text">
                <strong>Rest day</strong>
                <span>Recover, walk, stretch</span>
              </span>
            </button>
          </div>
        </section>

        <div class="stack actions">
          @if (v.isToday && v.active) {
            <p class="in-progress"><span class="live"></span>{{ v.active }} is in progress.</p>
            <a class="btn btn--primary btn--block btn--lg" routerLink="/session" (click)="closed.emit()"><app-icon name="play" />Resume</a>
            <button type="button" class="btn btn--danger btn--block" (click)="discardOpen.set(true)">Discard today's workout</button>
          } @else if (v.canStart) {
            <button type="button" class="btn btn--primary btn--block btn--lg" (click)="start(v.plannedId!)">
              <app-icon name="play" />Start {{ v.plannedName }}
            </button>
          }
          @if (v.plannedId) {
            <div class="row">
              <a class="btn btn--block" [routerLink]="['/workout/routines', v.plannedId]" (click)="closed.emit()">
                <app-icon name="clipboard" [size]="18" />Preview {{ v.plannedName }}
              </a>
              <a class="btn btn--block" [routerLink]="['/workout/routines', v.plannedId, 'warmup']" (click)="closed.emit()">
                <app-icon name="flame" [size]="18" />Warm-up
              </a>
            </div>
          }
        </div>
      }
    </app-sheet>
    <app-discard-sheet [open]="discardOpen()" (closed)="discardOpen.set(false)" />
  `,
  styles: `
    .block { margin-bottom: 22px; }
    .block__title { font-size: 20px; margin-bottom: 8px; }
    .block__hint { font-size: 14px; margin: -4px 0 10px; }
    .done-list { list-style: none; margin: 0 0 8px; padding: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .done-list li { display: flex; align-items: center; gap: 8px; font-size: 15px; color: var(--ink-3); }
    .done-list li.is-done { color: var(--ink); }
    .tick {
      width: 20px; height: 20px; border-radius: 50%; flex-shrink: 0;
      border: 2px solid var(--line); display: grid; place-items: center; color: #fff;
    }
    .is-done .tick { background: var(--green); border-color: var(--green); }
    .session {
      display: flex; align-items: center; gap: 10px; margin-top: 8px;
      padding: 12px; border-radius: var(--r-s); background: var(--surface-2); text-decoration: none;
    }
    .session__text { flex: 1; }
    .session__text strong { margin-right: 6px; }
    .options { display: flex; flex-direction: column; gap: 8px; }
    .option {
      display: flex; align-items: center; gap: 12px; text-align: left;
      min-height: 60px; padding: 10px 14px;
      border-radius: var(--r-m); border: 2px solid var(--line); background: var(--surface);
    }
    .option[aria-checked='true'] { border-color: var(--blue); background: var(--blue-soft); }
    .radio {
      width: 20px; height: 20px; border-radius: 50%; flex-shrink: 0;
      border: 2px solid var(--ink-3); background: var(--surface);
    }
    .option[aria-checked='true'] .radio { border: 6px solid var(--blue); }
    .option__text { display: flex; flex-direction: column; }
    .option__text strong { font-family: var(--font-display); font-size: 20px; line-height: 1.1; }
    .option__text span { font-size: 14px; color: var(--ink-2); }
    .actions { margin-top: 4px; }
    .in-progress { display: flex; align-items: center; gap: 8px; font-weight: 600; }
    .live { width: 9px; height: 9px; border-radius: 50%; background: var(--green); box-shadow: 0 0 0 4px rgba(46, 154, 90, 0.25); }
  `,
})
export class DaySheet {
  protected readonly library = inject(LibraryService);
  protected readonly plan = inject(PlanService);
  private readonly activity = inject(ActivityService);
  private readonly history = inject(HistoryService);
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);

  /** yyyy-mm-dd, or null when closed. */
  readonly date = input<string | null>(null);
  readonly closed = output<void>();

  protected readonly discardOpen = signal(false);

  protected readonly title = computed(() => {
    const d = this.date();
    return d ? parseIsoDate(d).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) : '';
  });

  protected readonly view = computed(() => {
    const date = this.date();
    if (!date) return null;
    const d = parseIsoDate(date);
    const today = isoDate();
    const weekday = d.getDay();
    const planned = this.plan.routineForWeekday(weekday);
    const a = this.activity.day(date);
    const sessions = this.history.sessionsOn(date).map((s) => ({
      id: s.id,
      name: s.name,
      length: s.endedAt ? formatWorkoutLength((Date.parse(s.endedAt) - Date.parse(s.startedAt)) / 1000) : '',
    }));
    return {
      weekday,
      weekdayPlural: d.toLocaleDateString(undefined, { weekday: 'long' }) + 's',
      isToday: date === today,
      isFuture: date > today,
      plannedId: planned?.id ?? null,
      plannedName: planned?.name ?? '',
      canStart: date === today && !!planned && !a.workout && !this.session.active(),
      active: this.session.active()?.name ?? null,
      sessions,
      checklist: [
        { label: 'Check-in', done: a.checkIn },
        { label: 'Weight', done: a.weight },
        { label: 'Food log', done: a.food },
        { label: 'Workout', done: a.workout },
      ],
    };
  });

  protected start(routineId: string): void {
    this.session.start(routineId);
    this.closed.emit();
    this.router.navigateByUrl('/session');
  }
}
