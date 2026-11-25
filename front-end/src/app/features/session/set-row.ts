import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { SetEntry } from '../../core/models';
import { Guidance } from '../../core/logic/progression';
import { SettingsService } from '../../core/services/settings.service';
import { Icon } from '../../shared/icon';

export interface SetValues {
  weightKg: number;
  reps: number;
}

@Component({
  selector: 'app-set-row',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.is-done]': 'set().completed',
    '[class.is-pr]': 'isPr()',
    '[class.is-open]': 'open()',
    '(focusin)': 'open.set(true)',
    '(focusout)': 'onFocusOut($event)',
  },
  template: `
    <div class="cells">
      <div class="c-set">
        @if (isPr()) {
          <span class="trophy" title="Personal record"><app-icon name="trophy" [size]="18" /></span>
          <span class="visually-hidden">Set {{ label() }}, personal record</span>
        } @else {
          {{ label() }}
        }
      </div>

      <div class="c-prev">
        @if (prev(); as p) {
          <span class="pip" [class]="'pip pip--' + p.effort"></span>
          <span>{{ settings.formatWeight(p.weightKg) }} × {{ p.reps }}</span>
        } @else {
          <span class="faint">–</span>
        }
      </div>

      <div class="c-input">
        <input
          #weightInput
          class="cell-input"
          inputmode="decimal"
          [attr.aria-label]="exerciseName() + ' set ' + label() + ' weight in ' + settings.unitLabel()"
          [value]="weightDisplay()"
          [placeholder]="weightPlaceholder()"
          [readOnly]="set().completed"
          (change)="onWeight($any($event.target).value)"
        />
        @if (guidance(); as g) {
          @if (g.target === 'weight' && !set().completed) {
            <button type="button" class="cue" [class.cue--down]="g.direction === 'down'"
              [attr.aria-label]="g.reason + ' Apply suggestion.'" (click)="applyGuidance()">
              <app-icon [name]="g.direction === 'up' ? 'arrow-up' : 'arrow-down'" [size]="13" [stroke]="3" />
            </button>
          }
        }
      </div>

      <div class="c-input">
        <input
          class="cell-input"
          inputmode="numeric"
          [attr.aria-label]="exerciseName() + ' set ' + label() + ' reps'"
          [value]="set().reps ?? ''"
          [placeholder]="prev()?.reps ?? ''"
          [readOnly]="set().completed"
          (change)="onReps($any($event.target).value)"
        />
        @if (guidance(); as g) {
          @if (g.target === 'reps' && !set().completed) {
            <button type="button" class="cue" [attr.aria-label]="g.reason + ' Apply suggestion.'" (click)="applyGuidance()">
              <app-icon name="arrow-up" [size]="13" [stroke]="3" />
            </button>
          }
        }
      </div>

      <div class="c-effort">
        <button
          type="button"
          class="effort"
          [class]="'effort' + (set().effort ? ' effort--' + set().effort : '')"
          [attr.aria-label]="(set().completed ? 'Change effort for ' : 'Complete ') + exerciseName() + ' set ' + label()"
          (click)="onEffortTap()"
        >
          @if (set().completed) {
            <app-icon name="check" [size]="16" [stroke]="3" />
          }
        </button>
      </div>
    </div>

    @if (open() && !set().completed) {
      <!-- mousedown is cancelled so taps keep focus in the input and the strip stays open. -->
      <div class="nudge" (mousedown)="$event.preventDefault()">
        <div class="nudge__group" role="group" [attr.aria-label]="'Adjust weight for set ' + label()">
          <button type="button" (click)="nudgeWeight(-1)" aria-label="Less weight"><app-icon name="minus" [size]="16" /></button>
          <span>{{ settings.unitLabel() }}</span>
          <button type="button" (click)="nudgeWeight(1)" aria-label="More weight"><app-icon name="plus" [size]="16" /></button>
        </div>
        <div class="nudge__group" role="group" [attr.aria-label]="'Adjust reps for set ' + label()">
          <button type="button" (click)="nudgeReps(-1)" aria-label="Fewer reps"><app-icon name="minus" [size]="16" /></button>
          <span>reps</span>
          <button type="button" (click)="nudgeReps(1)" aria-label="More reps"><app-icon name="plus" [size]="16" /></button>
        </div>
        <button type="button" class="nudge__remove" (click)="remove.emit()" [attr.aria-label]="'Remove set ' + label()">
          <app-icon name="trash" [size]="16" />
        </button>
        @if (guidance(); as g) {
          <p class="nudge__hint">{{ g.reason }}</p>
        }
      </div>
    }

    @if (missing()) {
      <p class="missing" role="alert">Enter a weight and reps first.</p>
    }
  `,
  styleUrl: './set-row.scss',
})
export class SetRow {
  protected readonly settings = inject(SettingsService);

  readonly set = input.required<SetEntry>();
  readonly label = input.required<string>();
  /** For screen-reader labels, so 1B of two exercises can be told apart. */
  readonly exerciseName = input('');
  readonly prev = input<SetEntry | null>(null);
  readonly guidance = input<Guidance | null>(null);
  readonly isPr = input(false);

  readonly changed = output<{ weightKg?: number | null; reps?: number | null }>();
  readonly complete = output<SetValues>();
  readonly reopen = output<void>();
  readonly remove = output<void>();

  protected readonly open = signal(false);
  protected readonly missing = signal(false);
  private readonly weightInput = viewChild<ElementRef<HTMLInputElement>>('weightInput');

  protected readonly weightDisplay = computed(() => {
    const v = this.settings.toDisplay(this.set().weightKg);
    return v == null ? '' : String(v);
  });

  protected readonly weightPlaceholder = computed(() => {
    const p = this.prev();
    return p ? String(this.settings.toDisplay(p.weightKg) ?? '') : '';
  });

  /** Typed value, else last time's value. */
  private effective(): { weightKg: number | null; reps: number | null } {
    const s = this.set();
    const p = this.prev();
    return { weightKg: s.weightKg ?? p?.weightKg ?? null, reps: s.reps ?? p?.reps ?? null };
  }

  protected onFocusOut(e: FocusEvent): void {
    const host = (e.currentTarget as HTMLElement) ?? null;
    if (!host || !host.contains(e.relatedTarget as Node | null)) this.open.set(false);
  }

  protected onWeight(raw: string): void {
    const n = parseFloat(raw.replace(',', '.'));
    this.missing.set(false);
    this.changed.emit({ weightKg: Number.isFinite(n) && n >= 0 ? this.settings.fromDisplay(n) : null });
  }

  protected onReps(raw: string): void {
    const n = parseInt(raw, 10);
    this.missing.set(false);
    this.changed.emit({ reps: Number.isFinite(n) && n >= 0 ? n : null });
  }

  protected nudgeWeight(dir: 1 | -1): void {
    const { weightKg } = this.effective();
    const next = Math.max(0, (weightKg ?? 0) + dir * this.settings.incrementKg());
    this.changed.emit({ weightKg: next });
  }

  protected nudgeReps(dir: 1 | -1): void {
    const { reps } = this.effective();
    this.changed.emit({ reps: Math.max(0, (reps ?? 0) + dir) });
  }

  protected applyGuidance(): void {
    const g = this.guidance();
    const p = this.prev();
    if (!g || g.target === 'hold') return;
    if (g.target === 'reps') this.changed.emit({ reps: g.reps, weightKg: this.set().weightKg ?? p?.weightKg ?? null });
    else this.changed.emit({ weightKg: g.weightKg, reps: g.reps });
  }

  protected onEffortTap(): void {
    if (this.set().completed) {
      this.reopen.emit();
      return;
    }
    const { weightKg, reps } = this.effective();
    if (weightKg == null || reps == null || reps === 0) {
      this.missing.set(true);
      this.weightInput()?.nativeElement.focus();
      return;
    }
    this.missing.set(false);
    this.complete.emit({ weightKg, reps });
  }
}
