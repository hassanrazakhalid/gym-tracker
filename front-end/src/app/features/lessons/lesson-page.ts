import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LESSONS } from '../../core/content/lessons';
import { LessonProgressService } from '../../core/services/tracking.service';
import { Icon } from '../../shared/icon';

@Component({
  selector: 'app-lesson-page',
  imports: [RouterLink, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="page">
      <a routerLink="/lessons" class="btn btn--ghost back"><app-icon name="chevron-left" />Lessons</a>
      @if (lesson(); as l) {
        <header>
          <p class="course">{{ l.course }}, {{ l.minutes }} min read</p>
          <h1 class="title">{{ l.title }}</h1>
          <p class="summary">{{ l.summary }}</p>
        </header>
        <div class="body">
          @for (p of l.body; track $index) { <p>{{ p }}</p> }
        </div>
        @if (progress.isDone(l.id)) {
          <div class="stack">
            <p class="done"><app-icon name="check" [size]="18" [stroke]="3" />You've finished this lesson.</p>
            @if (next(); as n) {
              <a class="btn btn--dark btn--block btn--lg" [routerLink]="['/lessons', n.id]">Next: {{ n.title }}</a>
            }
            <button type="button" class="btn btn--ghost" (click)="progress.toggle(l.id)">Mark as unread</button>
          </div>
        } @else {
          <button type="button" class="btn btn--primary btn--block btn--lg" (click)="finish(l.id)">Mark as finished</button>
        }
      } @else {
        <p class="muted">This lesson doesn't exist. Pick one from the list.</p>
      }
    </article>
  `,
  styles: `
    .back { align-self: flex-start; margin-left: -10px; }
    .course { font-weight: 600; color: var(--blue); margin-bottom: 6px; }
    .title { font-size: 40px; line-height: 1; max-width: 20ch; }
    .summary { font-size: 19px; color: var(--ink-2); margin-top: 12px; max-width: 46ch; }
    .body { display: flex; flex-direction: column; gap: 16px; font-size: 18px; line-height: 1.6; max-width: 62ch; }
    .done { display: flex; align-items: center; gap: 8px; color: var(--green); font-weight: 600; }
  `,
})
export class LessonPage {
  protected readonly progress = inject(LessonProgressService);
  private readonly router = inject(Router);

  readonly id = input.required<string>();

  protected readonly lesson = computed(() => LESSONS.find((l) => l.id === this.id()) ?? null);
  protected readonly next = computed(() => {
    const i = LESSONS.findIndex((l) => l.id === this.id());
    return LESSONS.slice(i + 1).find((l) => !this.progress.isDone(l.id)) ?? null;
  });

  protected finish(id: string): void {
    if (!this.progress.isDone(id)) this.progress.toggle(id);
  }
}
