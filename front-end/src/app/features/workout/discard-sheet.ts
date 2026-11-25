import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { Router } from '@angular/router';
import { SessionService } from '../../core/services/session.service';
import { Sheet } from '../../shared/sheet';

/**
 * Confirms ending the workout in progress early. Offers to keep the sets already
 * logged, so leaving in a hurry doesn't have to throw work away.
 */
@Component({
  selector: 'app-discard-sheet',
  imports: [Sheet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-sheet [open]="open()" [title]="'Discard ' + (session.active()?.name ?? 'workout') + '?'" (closed)="closed.emit()">
      @let done = session.completedSetCount();
      <p class="muted copy">
        @if (done > 0) {
          You've logged {{ done }} {{ done === 1 ? 'set' : 'sets' }}. Discarding deletes {{ done === 1 ? 'it' : 'them' }}
          and this workout won't appear in your history.
        } @else {
          Nothing is logged yet, so nothing will be lost.
        }
      </p>
      <div class="stack">
        <button type="button" class="btn btn--danger btn--block btn--lg discard" (click)="discard()">Discard workout</button>
        @if (done > 0) {
          <button type="button" class="btn btn--block" (click)="saveAndEnd()">Save {{ done }} {{ done === 1 ? 'set' : 'sets' }} and end</button>
        }
        <button type="button" class="btn btn--block" (click)="closed.emit()">Keep going</button>
      </div>
    </app-sheet>
  `,
  styles: `
    .copy { margin-bottom: 16px; }
    .discard { box-shadow: inset 0 0 0 1.5px var(--red); }
  `,
})
export class DiscardSheet {
  protected readonly session = inject(SessionService);
  private readonly router = inject(Router);

  readonly open = input(false);
  readonly closed = output<void>();

  protected discard(): void {
    this.session.discard();
    this.closed.emit();
    if (this.router.url.startsWith('/session')) this.router.navigateByUrl('/workout');
  }

  protected saveAndEnd(): void {
    const result = this.session.finish();
    this.closed.emit();
    if (result?.session.exercises.length) this.router.navigate(['/workout/summary', result.session.id]);
    else this.router.navigateByUrl('/workout');
  }
}
