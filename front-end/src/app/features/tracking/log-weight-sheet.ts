import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { BodyWeightService } from '../../core/services/tracking.service';
import { SettingsService } from '../../core/services/settings.service';
import { relativeDay } from '../../core/util';
import { Sheet } from '../../shared/sheet';

@Component({
  selector: 'app-log-weight-sheet',
  imports: [Sheet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-sheet [open]="open()" title="Log your weight" (closed)="closed.emit()">
      <form class="stack" (submit)="save($event)">
        <label class="field">
          <span class="field__label">Weight this morning ({{ settings.unitLabel() }})</span>
          <input
            class="input big"
            inputmode="decimal"
            [value]="value()"
            (input)="value.set($any($event.target).value)"
            [placeholder]="placeholder()"
            autofocus
          />
        </label>
        @if (last(); as l) {
          <p class="faint">Last logged {{ l }}.</p>
        }
        @if (error()) { <p class="error" role="alert">{{ error() }}</p> }
        <button type="submit" class="btn btn--primary btn--block btn--lg">Save weight</button>
      </form>
    </app-sheet>
  `,
  styles: `
    .big { font-family: var(--font-display); font-weight: 700; font-size: 34px; min-height: 64px; text-align: center; }
    .error { color: var(--red); font-weight: 600; font-size: 14px; }
  `,
})
export class LogWeightSheet {
  protected readonly settings = inject(SettingsService);
  private readonly weights = inject(BodyWeightService);

  readonly open = input(false);
  readonly closed = output<void>();

  protected readonly value = signal('');
  protected readonly error = signal('');

  protected readonly placeholder = computed(() => this.settings.formatWeight(this.weights.latest()?.weightKg));
  protected readonly last = computed(() => {
    const l = this.weights.latest();
    return l ? `${relativeDay(l.date)}: ${this.settings.formatWeight(l.weightKg)} ${this.settings.unitLabel()}` : null;
  });

  protected save(e: Event): void {
    e.preventDefault();
    const n = parseFloat(this.value().replace(',', '.'));
    const min = this.settings.unit() === 'lb' ? 60 : 27;
    const max = this.settings.unit() === 'lb' ? 700 : 320;
    if (!Number.isFinite(n) || n < min || n > max) {
      this.error.set(`Enter a weight between ${min} and ${max} ${this.settings.unitLabel()}.`);
      return;
    }
    this.weights.log(this.settings.fromDisplay(n));
    this.value.set('');
    this.error.set('');
    this.closed.emit();
  }
}
