import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Routine, WorkoutSession } from '../../core/models';
import { HistoryService } from '../../core/services/history.service';
import { LibraryService } from '../../core/services/library.service';
import { PlanService } from '../../core/services/plan.service';
import { SessionService } from '../../core/services/session.service';
import { SettingsService } from '../../core/services/settings.service';
import { formatWorkoutLength, relativeDay } from '../../core/util';
import { ExerciseThumb } from '../../shared/exercise-thumb';
import { Icon } from '../../shared/icon';
import { DiscardSheet } from './discard-sheet';

@Component({
  selector: 'app-workout-page',
  imports: [RouterLink, Icon, ExerciseThumb, DiscardSheet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <h1 class="page-title">Workout</h1>

      @if (session.active(); as s) {
        <section class="today panel">
          <p class="today__when">In progress</p>
          <h2 class="today__name">{{ s.name }}</h2>
          <p class="muted">{{ session.doneExercises() }} of {{ session.totalExercises() }} exercises done</p>
          <a routerLink="/session" class="btn btn--primary btn--lg btn--block"><app-icon name="play" />Resume workout</a>
          <div class="today__more">
            <a class="btn btn--ghost" routerLink="/workout/routines/current/warmup"><app-icon name="flame" [size]="18" />Warm-up</a>
            <button type="button" class="btn btn--ghost discard" (click)="discardOpen.set(true)"><app-icon name="trash" [size]="18" />Discard</button>
          </div>
        </section>
      } @else if (today(); as r) {
        <section class="today panel">
          <p class="today__when">Today's plan</p>
          <h2 class="today__name">{{ r.name }}</h2>
          <p class="muted">{{ r.focus }}, about {{ r.estimatedMinutes }} min</p>
          <ul class="today__list">
            @for (ex of exercisesOf(r); track ex.id) {
              <li><app-exercise-thumb [exercise]="ex" />{{ ex.name }}</li>
            }
          </ul>
          <button type="button" class="btn btn--primary btn--lg btn--block" (click)="start(r.id)">
            <app-icon name="play" />Start {{ r.name }}
          </button>
          <div class="today__more">
            <a class="btn btn--ghost" [routerLink]="['/workout/routines', r.id]"><app-icon name="clipboard" [size]="18" />Preview</a>
            <a class="btn btn--ghost" [routerLink]="['/workout/routines', r.id, 'warmup']"><app-icon name="flame" [size]="18" />Warm-up</a>
          </div>
        </section>
      } @else {
        <section class="today panel">
          <p class="today__when">Today</p>
          <h2 class="today__name">Rest day</h2>
          <p class="muted">Nothing is planned. Pick a routine below if you want to train anyway.</p>
        </section>
      }

      <section>
        <h2 class="section-title">Routines</h2>
        <div class="panel panel--flush">
          @for (r of library.routines(); track r.id) {
            <div class="list-row">
              <a class="list-row__main routine-link" [routerLink]="['/workout/routines', r.id]"
                [attr.aria-label]="'Preview ' + r.name">
                <div class="list-row__title">{{ r.name }}</div>
                <div class="list-row__sub">{{ r.focus }}, {{ countOf(r) }} exercises, about {{ r.estimatedMinutes }} min</div>
              </a>
              <button type="button" class="btn" [disabled]="!!session.active()" (click)="start(r.id)">Start</button>
            </div>
          }
          <div class="list-row">
            <div class="list-row__main">
              <div class="list-row__title">Empty workout</div>
              <div class="list-row__sub">Add exercises as you go</div>
            </div>
            <button type="button" class="btn" [disabled]="!!session.active()" (click)="startEmpty()">Start</button>
          </div>
        </div>
        @if (session.active()) {
          <p class="faint note">Finish or discard the current workout to start another.</p>
        }
      </section>

      <section>
        <h2 class="section-title">Recent workouts</h2>
        <div class="panel panel--flush">
          @for (s of recent(); track s.id) {
            <a class="list-row" [routerLink]="['/workout/sessions', s.id]">
              <div class="list-row__main">
                <div class="list-row__title">{{ s.name }}</div>
                <div class="list-row__sub">{{ when(s) }}, {{ duration(s) }}, {{ volume(s) }}</div>
              </div>
              @if (history.prCountFor(s.id); as prs) {
                <span class="pr"><app-icon name="trophy" [size]="14" />{{ prs }}</span>
              }
              <app-icon name="chevron-right" class="faint" />
            </a>
          } @empty {
            <p class="list-row muted">Your finished workouts will show up here.</p>
          }
        </div>
      </section>
    </div>
    <app-discard-sheet [open]="discardOpen()" (closed)="discardOpen.set(false)" />
  `,
  styles: `
    .today { display: flex; flex-direction: column; gap: 6px; padding: 20px; }
    .today__when { font-weight: 600; color: var(--blue); }
    .today__name { font-size: 48px; line-height: 0.95; }
    .today__list {
      list-style: none; margin: 10px 0 14px; padding: 0;
      display: flex; flex-direction: column; gap: 8px; --thumb: 30px;
    }
    .today__list li { display: flex; align-items: center; gap: 10px; font-weight: 500; }
    .note { margin-top: 8px; font-size: 14px; }
    .today__more { display: flex; justify-content: center; gap: 8px; margin-top: 4px; }
    .discard { color: var(--red); }
    .routine-link { text-decoration: none; color: inherit; }
    .pr {
      display: inline-flex; align-items: center; gap: 3px; color: var(--gold);
      font-weight: 700; font-size: 14px;
    }
  `,
})
export class WorkoutPage {
  protected readonly session = inject(SessionService);
  protected readonly library = inject(LibraryService);
  private readonly plan = inject(PlanService);
  protected readonly history = inject(HistoryService);
  private readonly settings = inject(SettingsService);
  private readonly router = inject(Router);

  protected readonly today = computed(() => this.plan.plannedFor(new Date()));
  protected readonly discardOpen = signal(false);
  protected readonly recent = computed(() => this.history.sessions().slice(0, 8));

  protected exercisesOf(r: Routine) {
    return r.blocks.flatMap((b) => b.exercises.map((e) => this.library.exercise(e.exerciseId)));
  }

  protected countOf(r: Routine): number {
    return r.blocks.reduce((n, b) => n + b.exercises.length, 0);
  }

  protected start(routineId: string): void {
    this.session.start(routineId);
    this.router.navigateByUrl('/session');
  }

  protected startEmpty(): void {
    this.session.startEmpty();
    this.router.navigateByUrl('/session');
  }

  protected when(s: WorkoutSession): string {
    const r = relativeDay(s.startedAt);
    return r.charAt(0).toUpperCase() + r.slice(1);
  }

  protected duration(s: WorkoutSession): string {
    return s.endedAt ? formatWorkoutLength((Date.parse(s.endedAt) - Date.parse(s.startedAt)) / 1000) : '';
  }

  protected volume(s: WorkoutSession): string {
    const kg = s.exercises.reduce((t, e) => t + e.sets.reduce((u, x) => u + (x.weightKg ?? 0) * (x.reps ?? 0), 0), 0);
    return `${Math.round(this.settings.toDisplay(kg) ?? 0).toLocaleString()} ${this.settings.unitLabel()} lifted`;
  }
}
