import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { Exercise, MuscleGroup } from '../core/models';
import { LibraryService, MUSCLE_GROUPS } from '../core/services/library.service';
import { ExerciseThumb } from './exercise-thumb';
import { Icon } from './icon';
import { Sheet } from './sheet';

type Tab = 'all' | 'muscle' | 'health';

interface Section {
  title: string;
  items: Exercise[];
}

@Component({
  selector: 'app-exercise-picker',
  imports: [Sheet, Icon, ExerciseThumb],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-sheet [open]="open()" [title]="title()" [tall]="true" (closed)="closed.emit()">
      <div class="controls">
        <label class="search">
          <app-icon name="search" [size]="18" />
          <input
            type="search"
            placeholder="Search exercises"
            aria-label="Search exercises"
            [value]="query()"
            (input)="query.set($any($event.target).value)"
          />
        </label>
        <div class="segmented" role="group" aria-label="Filter">
          <button type="button" [attr.aria-pressed]="tab() === 'all'" (click)="tab.set('all')">All</button>
          <button type="button" [attr.aria-pressed]="tab() === 'muscle'" (click)="tab.set('muscle')">Muscle</button>
          <button type="button" [attr.aria-pressed]="tab() === 'health'" (click)="tab.set('health')">Health</button>
        </div>
        @if (tab() === 'muscle') {
          <div class="chip-row" role="group" aria-label="Muscle group">
            @for (m of muscles; track m) {
              <button type="button" class="chip" [attr.aria-pressed]="muscle() === m" (click)="muscle.set(m)">{{ m }}</button>
            }
          </div>
        }
        @if (tab() === 'health') {
          <p class="hint">Exercises that are easier on the joints: machines, cables and supported positions.</p>
        }
      </div>

      @for (section of sections(); track section.title) {
        <section class="section">
          <h3 class="section__title">{{ section.title }}</h3>
          <div class="panel panel--flush">
            @for (ex of section.items; track ex.id) {
              <button type="button" class="list-row" (click)="pick(ex.id)">
                <app-exercise-thumb [exercise]="ex" />
                <span class="list-row__main">
                  <span class="list-row__title">{{ ex.name }}</span>
                  <span class="list-row__sub">{{ ex.muscle }}, {{ ex.equipment.toLowerCase() }}, {{ ex.repRange.min }}–{{ ex.repRange.max }} reps</span>
                </span>
              </button>
            }
          </div>
        </section>
      } @empty {
        <p class="empty">No exercises match "{{ query() }}". Try a shorter name or another filter.</p>
      }
    </app-sheet>
  `,
  styles: `
    .controls { display: flex; flex-direction: column; gap: 10px; position: sticky; top: 0; background: var(--surface); padding-bottom: 10px; z-index: 1; }
    .search {
      display: flex; align-items: center; gap: 8px; padding: 0 12px;
      border-radius: var(--r-s); background: var(--surface-2); color: var(--ink-3);
    }
    .search input { flex: 1; min-height: 44px; border: 0; background: none; font-size: 16px; color: var(--ink); }
    .search input:focus { outline: none; }
    .search:focus-within { box-shadow: inset 0 0 0 2px var(--blue); }
    .hint { font-size: 14px; color: var(--ink-2); }
    .section { margin-top: 10px; }
    .section__title { font-size: 18px; margin-bottom: 6px; }
    .section .panel { background: var(--surface-2); }
    .section .list-row { --thumb: 38px; }
    .empty { padding: 24px 4px; color: var(--ink-2); }
  `,
})
/**
 * Browse the exercise library. With `currentId` it's a swap picker that leads
 * with alternatives for the same muscle; without it, a plain "add" picker.
 */
export class ExercisePicker {
  private readonly library = inject(LibraryService);

  readonly open = input(false);
  /** Exercise being swapped out; null when adding. */
  readonly currentId = input<string | null>(null);
  /** Exercises to leave out (e.g. ones already in the workout). */
  readonly exclude = input<string[]>([]);
  readonly picked = output<string>();
  readonly closed = output<void>();

  protected readonly muscles = MUSCLE_GROUPS;
  protected readonly query = signal('');
  protected readonly tab = signal<Tab>('all');
  protected readonly muscle = signal<MuscleGroup>('Chest');

  /** The exercise being swapped out, if any. */
  private readonly current = computed(() => {
    const id = this.currentId();
    return id ? this.library.exercise(id) : null;
  });

  protected readonly title = computed(() => (this.current() ? `Swap ${this.current()!.name}` : 'Add exercise'));

  constructor() {
    // Reset filters each time the picker opens.
    effect(() => {
      if (!this.open()) return;
      untracked(() => {
        this.query.set('');
        this.tab.set('all');
        this.muscle.set(this.current()?.muscle ?? 'Chest');
      });
    });
  }

  protected readonly sections = computed<Section[]>(() => {
    const q = this.query().trim().toLowerCase();
    const cur = this.current();
    const tab = this.tab();
    const skip = new Set(this.exclude());
    const pool = this.library.exercises.filter((e) => e.id !== cur?.id && !skip.has(e.id));

    if (!q && tab === 'all' && cur) {
      const { recommended, other } = this.library.alternativesFor(cur.id);
      return [
        { title: `Recommended alternatives for ${cur.muscle.toLowerCase()}`, items: recommended.filter((e) => !skip.has(e.id)) },
        { title: `Other ${cur.muscle.toLowerCase()} exercises`, items: other.filter((e) => !skip.has(e.id)) },
      ].filter((s) => s.items.length);
    }

    let items = pool.filter((e) => !q || e.name.toLowerCase().includes(q) || e.muscle.toLowerCase().includes(q));
    if (tab === 'muscle') items = items.filter((e) => e.muscle === this.muscle());
    if (tab === 'health') {
      items = items.filter((e) => e.jointFriendly && (!cur || q || e.muscle === cur.muscle));
    }
    if (!items.length) return [];
    if (tab === 'muscle' || (tab === 'health' && cur && !q)) return [{ title: `${items[0].muscle}`, items }];

    // Group by muscle for browsing.
    return MUSCLE_GROUPS.map((m) => ({ title: m, items: items.filter((e) => e.muscle === m) })).filter(
      (s) => s.items.length,
    );
  });

  protected pick(exerciseId: string): void {
    this.picked.emit(exerciseId);
  }
}
