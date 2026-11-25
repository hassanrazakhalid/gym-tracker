import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ClockService } from '../../core/services/clock.service';
import { LibraryService } from '../../core/services/library.service';
import { ExerciseGroupView, SessionService } from '../../core/services/session.service';
import { SettingsService } from '../../core/services/settings.service';
import { formatClock, formatDuration } from '../../core/util';
import { ExerciseThumb } from '../../shared/exercise-thumb';
import { Icon } from '../../shared/icon';
import { Sheet } from '../../shared/sheet';
import { DiscardSheet } from '../workout/discard-sheet';
import { EffortSheet } from './effort-sheet';
import { ExerciseCard } from './exercise-card';
import { ExercisePicker } from '../../shared/exercise-picker';
import { RestBar } from './rest-bar';
import { SessionUi } from './session-ui';

const REST_PRESETS = [60, 90, 120, 150, 180, 240];

@Component({
  selector: 'app-session-page',
  imports: [RouterLink, Icon, ExerciseThumb, Sheet, ExerciseCard, EffortSheet, ExercisePicker, RestBar, DiscardSheet],
  providers: [SessionUi],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './session-page.html',
  styleUrl: './session-page.scss',
})
export class SessionPage {
  protected readonly session = inject(SessionService);
  protected readonly ui = inject(SessionUi);
  protected readonly settings = inject(SettingsService);
  private readonly library = inject(LibraryService);
  private readonly clock = inject(ClockService);
  private readonly router = inject(Router);

  protected readonly restPresets = REST_PRESETS;
  protected readonly formatClock = formatClock;

  protected readonly elapsed = computed(() => {
    const s = this.session.active();
    return s ? formatDuration((this.clock.now() - Date.parse(s.startedAt)) / 1000) : '';
  });

  protected readonly progress = computed(() => {
    const total = this.session.totalExercises();
    return total ? (this.session.doneExercises() / total) * 100 : 0;
  });

  protected readonly initials = computed(() => this.settings.name().slice(0, 1).toUpperCase());

  protected readonly menuExercise = computed(() => {
    const id = this.ui.menuFor();
    const ex = this.session.active()?.exercises.find((e) => e.id === id);
    if (!ex) return null;
    const view = this.session.groups().find((g) => g.group.id === ex.groupId)!;
    const isLast = view.index === this.session.groups().length - 1;
    return { item: ex, exercise: this.library.exercise(ex.exerciseId), view, isLast };
  });

  /** Exercise being swapped out, when the picker is in swap mode. */
  protected readonly pickerCurrentId = computed(() => {
    const p = this.ui.picker();
    if (p?.mode !== 'swap') return null;
    return this.session.active()?.exercises.find((e) => e.id === p.exId)?.exerciseId ?? null;
  });

  protected readonly inWorkout = computed(() => this.session.active()?.exercises.map((e) => e.exerciseId) ?? []);

  protected onPicked(exerciseId: string): void {
    const p = this.ui.picker();
    if (p?.mode === 'swap') this.session.swapExercise(p.exId, exerciseId);
    else if (p) this.session.addExercise(exerciseId);
    this.ui.picker.set(null);
  }

  protected readonly guideExercise = computed(() => {
    const id = this.ui.formGuideFor();
    return id ? this.library.exercise(id) : null;
  });

  protected readonly restGroup = computed(() => {
    const id = this.ui.restFor();
    return this.session.groups().find((g) => g.group.id === id) ?? null;
  });

  protected groupName(view: ExerciseGroupView): string {
    return view.exercises.map((e) => this.library.exercise(e.exerciseId).name).join(' + ');
  }

  protected menuAction(action: 'guide' | 'split' | 'join' | 'reorder' | 'history' | 'remove'): void {
    const m = this.menuExercise();
    if (!m) return;
    this.ui.menuFor.set(null);
    switch (action) {
      case 'guide':
        this.ui.formGuideFor.set(m.item.exerciseId);
        break;
      case 'split':
        this.session.splitSuperset(m.item.groupId);
        break;
      case 'join':
        this.session.joinWithNext(m.item.groupId);
        break;
      case 'reorder':
        this.ui.reorderOpen.set(true);
        break;
      case 'history':
        this.router.navigate(['/exercise', m.item.exerciseId]);
        break;
      case 'remove':
        this.session.removeExercise(m.item.id);
        break;
    }
  }

  protected finish(): void {
    this.ui.finishOpen.set(false);
    const result = this.session.finish();
    const saved = result && result.session.exercises.length > 0;
    this.router.navigate(saved ? ['/workout/summary', result.session.id] : ['/workout']);
  }

  /** Swap one sheet for another without both being open at once. */
  protected openDiscard(): void {
    this.ui.finishOpen.set(false);
    this.ui.optionsOpen.set(false);
    this.ui.discardOpen.set(true);
  }

  protected openReorder(): void {
    this.ui.optionsOpen.set(false);
    this.ui.reorderOpen.set(true);
  }
}
