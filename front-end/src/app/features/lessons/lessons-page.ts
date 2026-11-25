import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LESSONS } from '../../core/content/lessons';
import { LessonProgressService } from '../../core/services/tracking.service';
import { Icon } from '../../shared/icon';

@Component({
  selector: 'app-lessons-page',
  imports: [RouterLink, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <div>
        <h1 class="page-title">Lessons</h1>
        <p class="muted">Short reads on training, food and recovery. {{ doneCount() }} of {{ total }} finished.</p>
      </div>

      @for (c of courses(); track c.name) {
        <section>
          <div class="spread">
            <h2 class="section-title">{{ c.name }}</h2>
            <span class="faint num">{{ c.done }}/{{ c.lessons.length }}</span>
          </div>
          <ol class="panel panel--flush course">
            @for (l of c.lessons; track l.id; let i = $index) {
              <li>
                <a class="list-row" [routerLink]="['/lessons', l.id]">
                  <span class="step" [class.step--done]="l.done">
                    @if (l.done) { <app-icon name="check" [size]="15" [stroke]="3" /> } @else { {{ i + 1 }} }
                  </span>
                  <span class="list-row__main">
                    <span class="list-row__title">{{ l.title }}</span>
                    <span class="list-row__sub">{{ l.minutes }} min read</span>
                  </span>
                  <app-icon name="chevron-right" class="faint" />
                </a>
              </li>
            }
          </ol>
        </section>
      }
    </div>
  `,
  styles: `
    .course { list-style: none; margin: 0; }
    .course li + li .list-row { border-top: 1px solid var(--line); }
    .course .list-row { border-top: 0; }
    .step {
      width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
      display: grid; place-items: center;
      border: 2px solid var(--line);
      font-family: var(--font-display); font-weight: 700; color: var(--ink-2);
    }
    .step--done { background: var(--green); border-color: var(--green); color: #fff; }
  `,
})
export class LessonsPage {
  private readonly progress = inject(LessonProgressService);
  protected readonly total = LESSONS.length;
  protected readonly doneCount = computed(() => LESSONS.filter((l) => this.progress.completed().includes(l.id)).length);

  /** Lessons within a course are a sequence, so they're numbered. */
  protected readonly courses = computed(() => {
    const done = new Set(this.progress.completed());
    const names = [...new Set(LESSONS.map((l) => l.course))];
    return names.map((name) => {
      const lessons = LESSONS.filter((l) => l.course === name).map((l) => ({ ...l, done: done.has(l.id) }));
      return { name, lessons, done: lessons.filter((l) => l.done).length };
    });
  });
}
