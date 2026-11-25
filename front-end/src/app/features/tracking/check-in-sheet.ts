import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { Feeling } from '../../core/models';
import { NutritionService } from '../../core/services/tracking.service';
import { isoDate } from '../../core/util';
import { Sheet } from '../../shared/sheet';

/** A 20-second daily nutrition check-in: hunger, energy, and whether today went to plan. */
@Component({
  selector: 'app-check-in-sheet',
  imports: [Sheet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-sheet [open]="open()" title="Nutrition check-in" (closed)="closed.emit()">
      <div class="stack">
        <fieldset class="scale">
          <legend class="field__label">How hungry have you been today?</legend>
          <div class="segmented">
            @for (n of levels; track n) {
              <button type="button" [attr.aria-pressed]="hunger() === n" (click)="hunger.set(n)">{{ n }}</button>
            }
          </div>
          <div class="ends faint"><span>Not at all</span><span>Very</span></div>
        </fieldset>

        <fieldset class="scale">
          <legend class="field__label">How is your energy?</legend>
          <div class="segmented">
            @for (n of levels; track n) {
              <button type="button" [attr.aria-pressed]="energy() === n" (click)="energy.set(n)">{{ n }}</button>
            }
          </div>
          <div class="ends faint"><span>Drained</span><span>Great</span></div>
        </fieldset>

        <fieldset class="scale">
          <legend class="field__label">Did you eat to plan yesterday?</legend>
          <div class="segmented">
            <button type="button" [attr.aria-pressed]="onPlan() === true" (click)="onPlan.set(true)">Yes</button>
            <button type="button" [attr.aria-pressed]="onPlan() === false" (click)="onPlan.set(false)">Not really</button>
          </div>
        </fieldset>

        <button type="button" class="btn btn--primary btn--block btn--lg" [disabled]="!ready()" (click)="save()">
          Save check-in
        </button>
      </div>
    </app-sheet>
  `,
  styles: `
    .scale { border: 0; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 6px; }
    .scale legend { margin-bottom: 6px; padding: 0; }
    .ends { display: flex; justify-content: space-between; font-size: 13px; }
  `,
})
export class CheckInSheet {
  private readonly nutrition = inject(NutritionService);

  readonly open = input(false);
  readonly closed = output<void>();

  protected readonly levels: Feeling[] = [1, 2, 3, 4, 5];
  protected readonly hunger = signal<Feeling | null>(null);
  protected readonly energy = signal<Feeling | null>(null);
  protected readonly onPlan = signal<boolean | null>(null);

  protected ready(): boolean {
    return this.hunger() !== null && this.energy() !== null && this.onPlan() !== null;
  }

  protected save(): void {
    if (!this.ready()) return;
    this.nutrition.checkIn({ date: isoDate(), hunger: this.hunger()!, energy: this.energy()!, onPlan: this.onPlan()! });
    this.closed.emit();
  }
}
