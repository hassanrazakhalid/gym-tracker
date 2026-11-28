import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { mediaFor } from '../core/content/media';
import { Exercise, MuscleGroup } from '../core/models';

/** Colour per muscle group, borrowed from the bumper-plate palette. Used when there's no photo. */
const MUSCLE_TONE: Record<MuscleGroup, string> = {
  Chest: '#D23F2E',
  Back: '#1E5BD8',
  Shoulders: '#E5B22B',
  Biceps: '#2E9A5A',
  Triceps: '#7A4FD0',
  Quads: '#1B2130',
  Hamstrings: '#3E6E8E',
  Glutes: '#C2577F',
  Adductors: '#A0603A',
  Calves: '#6B7A3A',
  Core: '#8A93A4',
};

/**
 * Exercise picture. Shows the exercise photo (start of the movement); with
 * `animate`, it alternates between the start and end photos so the movement
 * reads at a glance. Falls back to a lettered disc when there's no photo.
 *
 * Pass `exercise` for library exercises, or `id` + `name` for warm-up moves.
 */
@Component({
  selector: 'app-exercise-thumb',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.is-large]': 'animate()' },
  template: `
    @if (media() && !failed()) {
      <span class="photo" [class.photo--animate]="animate()">
        <img [src]="media()!.start" alt="" loading="lazy" decoding="async" (error)="failed.set(true)" />
        @if (animate()) {
          <img class="photo__end" [src]="media()!.end" alt="" loading="lazy" decoding="async" />
        }
      </span>
    } @else {
      <span class="disc" [style.--tone]="tone()">{{ initials() }}</span>
    }
  `,
  styles: `
    :host { display: inline-flex; flex-shrink: 0; }
    .photo {
      position: relative; display: block;
      width: var(--thumb, 48px); height: var(--thumb, 48px);
      border-radius: calc(var(--thumb, 48px) * 0.22);
      overflow: hidden; background: #fff;
      box-shadow: inset 0 0 0 1px var(--line);
    }
    .photo img {
      position: absolute; inset: 0; width: 100%; height: 100%;
      object-fit: cover; object-position: center;
    }
    /* Large guide picture: show the whole frame and cross-fade start ↔ end. */
    :host(.is-large) { display: block; }
    :host(.is-large) .photo { width: 100%; height: auto; aspect-ratio: 3 / 2; border-radius: var(--r-m); }
    :host(.is-large) .photo img { object-fit: contain; }
    .photo__end { animation: movement 2.4s ease-in-out infinite; }
    @keyframes movement {
      0%, 35% { opacity: 0; }
      50%, 85% { opacity: 1; }
      100% { opacity: 0; }
    }
    @media (prefers-reduced-motion: reduce) {
      .photo__end { animation: none; opacity: 0; }
    }
    .disc {
      width: var(--thumb, 48px); height: var(--thumb, 48px);
      border-radius: calc(var(--thumb, 48px) * 0.22);
      display: grid; place-items: center;
      background: var(--tone);
      color: #fff;
      font-family: var(--font-display);
      font-weight: 700;
      font-size: calc(var(--thumb, 48px) * 0.32);
      letter-spacing: 0.02em;
    }
  `,
})
export class ExerciseThumb {
  readonly exercise = input<Exercise | null>(null);
  /** For things outside the library, such as warm-up moves. */
  readonly id = input('');
  readonly name = input('');
  /** Large, animated start ↔ end view (form guide). */
  readonly animate = input(false);

  protected readonly failed = signal(false);

  private readonly resolvedId = computed(() => this.exercise()?.id ?? this.id());
  private readonly resolvedName = computed(() => this.exercise()?.name ?? this.name());

  protected readonly media = computed(() => this.exercise()?.media ?? mediaFor(this.resolvedId()));
  protected readonly tone = computed(() => {
    const ex = this.exercise();
    return ex ? MUSCLE_TONE[ex.muscle] : '#B88A12';
  });
  protected readonly initials = computed(() =>
    this.resolvedName()
      .split(/[\s-]+/)
      .filter((w) => /^[A-Za-z]/.test(w))
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join(''),
  );
}
