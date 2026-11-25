import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  input,
  output,
  viewChild,
} from '@angular/core';
import { Icon } from './icon';

/**
 * Bottom sheet built on the native <dialog>, which handles focus trapping,
 * Escape to close and the backdrop.
 */
@Component({
  selector: 'app-sheet',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dialog
      #dialog
      class="sheet"
      [class.sheet--tall]="tall()"
      [attr.aria-label]="title()"
      (close)="closed.emit()"
      (click)="onBackdrop($event)"
    >
      <div class="sheet__panel">
        <div class="sheet__grip" aria-hidden="true"></div>
        @if (title()) {
          <header class="sheet__head">
            <h2 class="sheet__title">{{ title() }}</h2>
            <button type="button" class="icon-btn" (click)="dialog.close()" aria-label="Close">
              <app-icon name="x" />
            </button>
          </header>
        }
        <div class="sheet__body"><ng-content /></div>
      </div>
    </dialog>
  `,
})
export class Sheet {
  readonly open = input(false);
  readonly title = input('');
  readonly tall = input(false);
  readonly closed = output<void>();

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    effect(() => {
      const el = this.dialog().nativeElement;
      if (this.open() && !el.open) el.showModal();
      else if (!this.open() && el.open) el.close();
    });
  }

  protected onBackdrop(e: MouseEvent): void {
    if (e.target === this.dialog().nativeElement) this.dialog().nativeElement.close();
  }
}
