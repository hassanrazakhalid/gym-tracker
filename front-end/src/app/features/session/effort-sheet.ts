import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Effort } from '../../core/models';
import { SessionService } from '../../core/services/session.service';
import { SettingsService } from '../../core/services/settings.service';
import { Sheet } from '../../shared/sheet';
import { SessionUi } from './session-ui';

interface Level {
  value: Effort;
  name: string;
  detail: string;
}

@Component({
  selector: 'app-effort-sheet',
  imports: [Sheet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-sheet [open]="!!ui.effort()" title="Rate effort level" (closed)="ui.effort.set(null)">
      @if (ui.effort(); as t) {
        <p class="muted lead">
          Set {{ t.label }}: <span class="num">{{ settings.formatWeight(t.weightKg) }} {{ settings.unitLabel() }} × {{ t.reps }}</span>.
          How many more reps could you have done?
        </p>
        <div class="levels">
          @for (l of levels; track l.value) {
            <button type="button" class="level" [class]="'level level--' + l.value" (click)="choose(l.value)">
              <span class="level__swatch" aria-hidden="true"></span>
              <span class="level__text">
                <strong>{{ l.name }}</strong>
                <span>{{ l.detail }}</span>
              </span>
            </button>
          }
        </div>
        @if (t.editing) {
          <button type="button" class="btn btn--ghost btn--block undo" (click)="undo()">Mark set as not done</button>
        }
      }
    </app-sheet>
  `,
  styles: `
    .lead { margin-bottom: 16px; }
    .levels { display: flex; flex-direction: column; gap: 10px; }
    .level {
      display: flex; align-items: center; gap: 14px;
      min-height: 68px; padding: 10px 14px;
      border-radius: var(--r-m); border: 2px solid var(--line); background: var(--surface);
      text-align: left;
    }
    .level:hover { border-color: var(--ink-3); }
    .level__swatch { width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0; }
    .level--easy .level__swatch { background: var(--green); }
    .level--ideal .level__swatch { background: var(--yellow); }
    .level--max .level__swatch { background: var(--red); }
    .level__text { display: flex; flex-direction: column; }
    .level__text strong { font-family: var(--font-display); font-size: 22px; line-height: 1.1; }
    .level__text span { color: var(--ink-2); font-size: 15px; }
    .undo { margin-top: 12px; }
  `,
})
export class EffortSheet {
  protected readonly ui = inject(SessionUi);
  protected readonly settings = inject(SettingsService);
  private readonly session = inject(SessionService);

  protected readonly levels: Level[] = [
    { value: 'easy', name: 'Easy', detail: 'Could have done 3 or more reps' },
    { value: 'ideal', name: 'Ideal', detail: 'Could have done 1–3 more reps' },
    { value: 'max', name: 'Max effort', detail: 'No more reps with good form' },
  ];

  protected choose(effort: Effort): void {
    const t = this.ui.effort();
    if (!t) return;
    if (t.editing) this.session.setEffort(t.exId, t.setId, effort);
    else this.session.completeSet(t.exId, t.setId, t.weightKg, t.reps, effort);
    this.ui.effort.set(null);
  }

  protected undo(): void {
    const t = this.ui.effort();
    if (t) this.session.uncompleteSet(t.exId, t.setId);
    this.ui.effort.set(null);
  }
}
