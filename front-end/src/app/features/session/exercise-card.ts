import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { SessionExercise } from '../../core/models';
import { guidanceFor } from '../../core/logic/progression';
import { HistoryService } from '../../core/services/history.service';
import { LibraryService } from '../../core/services/library.service';
import { SessionService } from '../../core/services/session.service';
import { SettingsService } from '../../core/services/settings.service';
import { ExerciseThumb } from '../../shared/exercise-thumb';
import { Icon } from '../../shared/icon';
import { SessionUi } from './session-ui';
import { SetRow, SetValues } from './set-row';

@Component({
  selector: 'app-exercise-card',
  imports: [Icon, ExerciseThumb, SetRow],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="head">
      <button type="button" class="head__toggle" (click)="ui.toggleCollapsed(item().id)"
        [attr.aria-expanded]="!collapsed()">
        <app-exercise-thumb [exercise]="exercise()" />
        <span class="head__text">
          <span class="head__name">
            @if (letter(); as l) { <span class="letter">{{ l }}</span> }
            {{ exercise().name }}
          </span>
          <span class="head__meta">
            <span>{{ exercise().repRange.min }}–{{ exercise().repRange.max }} reps</span>
            @if (prCount() > 0) {
              <span class="pr-badge"><app-icon name="trophy" [size]="13" [stroke]="2.5" />{{ prCount() }} PR</span>
            }
            @if (done()) {
              <span class="done-badge"><app-icon name="check" [size]="13" [stroke]="3" />Done</span>
            }
          </span>
        </span>
      </button>
      <button type="button" class="swap" (click)="ui.picker.set({ mode: 'swap', exId: item().id })"
        [attr.aria-label]="'Swap ' + exercise().name + ' for a similar ' + exercise().muscle.toLowerCase() + ' exercise'">
        <app-icon name="swap" [size]="17" /><span>Swap</span>
      </button>
      <button type="button" class="icon-btn" (click)="ui.menuFor.set(item().id)"
        [attr.aria-label]="'Options for ' + exercise().name">
        <app-icon name="more" [stroke]="3" />
      </button>
    </header>

    @if (!collapsed()) {
      <label class="notes">
        <app-icon name="note" [size]="16" />
        <input
          class="notes__input"
          placeholder="Add notes"
          [value]="item().notes"
          (change)="session.setNotes(item().id, $any($event.target).value)"
          [attr.aria-label]="'Notes for ' + exercise().name"
        />
      </label>

      <div class="table" role="table" [attr.aria-label]="exercise().name + ' sets'">
        <div class="cols" role="row">
          <span role="columnheader">Set</span>
          <span role="columnheader">Previous</span>
          <span role="columnheader">{{ settings.unitLabel() }}</span>
          <span role="columnheader">Reps</span>
          <span role="columnheader" class="visually-hidden">Effort</span>
        </div>
        @for (row of rows(); track row.set.id) {
          <app-set-row
            role="row"
            [set]="row.set"
            [label]="row.label"
            [exerciseName]="exercise().name"
            [prev]="row.prev"
            [guidance]="row.guidance"
            [isPr]="row.isPr"
            (changed)="session.updateSet(item().id, row.set.id, $event)"
            (complete)="onComplete(row.set.id, row.label, $event)"
            (reopen)="onReopen(row.set.id, row.label)"
            (remove)="session.removeSet(item().groupId, row.set.setNumber)"
          />
        }
      </div>
    }
  `,
  styleUrl: './exercise-card.scss',
})
export class ExerciseCard {
  protected readonly session = inject(SessionService);
  protected readonly settings = inject(SettingsService);
  protected readonly ui = inject(SessionUi);
  private readonly library = inject(LibraryService);
  private readonly history = inject(HistoryService);

  readonly item = input.required<SessionExercise>();

  protected readonly exercise = computed(() => this.library.exercise(this.item().exerciseId));
  protected readonly letter = computed(() => this.session.letterFor(this.item()));
  protected readonly collapsed = computed(() => this.ui.collapsed().has(this.item().id));
  protected readonly done = computed(() => this.session.isExerciseDone(this.item()));
  private readonly previous = computed(() => this.history.previousSets(this.item().exerciseId));

  protected readonly rows = computed(() => {
    const prs = this.session.livePrs();
    const range = this.exercise().repRange;
    const inc = this.settings.incrementKg();
    const prev = this.previous();
    const letter = this.letter() ?? '';
    return this.item().sets.map((set) => {
      const p = prev.find((x) => x.setNumber === set.setNumber) ?? null;
      const guidance =
        p && p.reps != null ? guidanceFor({ weightKg: p.weightKg ?? 0, reps: p.reps, effort: p.effort }, range, inc) : null;
      return {
        set,
        label: `${set.setNumber}${letter}`,
        prev: p,
        guidance: guidance && guidance.target !== 'hold' ? guidance : null,
        isPr: prs.has(set.id),
      };
    });
  });

  protected readonly prCount = computed(() => this.rows().filter((r) => r.isPr).length);

  protected onComplete(setId: string, label: string, v: SetValues): void {
    this.ui.effort.set({ exId: this.item().id, setId, label, weightKg: v.weightKg, reps: v.reps, editing: false });
  }

  protected onReopen(setId: string, label: string): void {
    const set = this.item().sets.find((s) => s.id === setId)!;
    this.ui.effort.set({
      exId: this.item().id, setId, label, weightKg: set.weightKg ?? 0, reps: set.reps ?? 0, editing: true,
    });
  }
}
