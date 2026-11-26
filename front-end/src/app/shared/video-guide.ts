import { ChangeDetectionStrategy, Component, computed, inject, input, linkedSignal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Icon } from './icon';

/** The video id from a YouTube watch, share (youtu.be), Shorts or embed link; null otherwise. */
export function youTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^(www|m)\./, '');
    let id: string | null = null;
    if (host === 'youtu.be') id = u.pathname.slice(1);
    else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      id = u.searchParams.get('v') ?? u.pathname.match(/^\/(?:shorts|embed|live)\/([^/?]+)/)?.[1] ?? null;
    }
    return id && /^[A-Za-z0-9_-]{6,20}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

/**
 * An optional video guide: a button that plays the video inside the app (so an
 * installed app doesn't jump to YouTube mid-workout), plus a link to open it there.
 * Nothing loads from YouTube until it's tapped.
 */
@Component({
  selector: 'app-video-guide',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (embed(); as src) {
      @if (playing()) {
        <div class="frame" [class.frame--tall]="isShort()">
          <iframe [src]="src" [title]="'Video guide: ' + title()" loading="lazy"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>
        </div>
      } @else {
        <button type="button" class="btn btn--block play" (click)="playing.set(true)">
          <app-icon name="play" [size]="16" />Watch video guide
        </button>
      }
      <a class="open" [href]="url()" target="_blank" rel="noopener noreferrer">Open in YouTube</a>
    }
  `,
  styles: `
    :host { display: flex; flex-direction: column; gap: 8px; align-items: center; }
    .play { color: var(--ink); }
    .frame { width: 100%; aspect-ratio: 16 / 9; border-radius: var(--r-m); overflow: hidden; background: #000; }
    /* Shorts are portrait; keep them inside the sheet on short screens. */
    .frame--tall { aspect-ratio: 9 / 16; width: auto; height: min(62dvh, 560px); }
    iframe { width: 100%; height: 100%; border: 0; display: block; }
    .open { font-size: 14px; font-weight: 600; color: var(--blue); }
  `,
})
export class VideoGuide {
  private readonly sanitizer = inject(DomSanitizer);

  readonly url = input.required<string>();
  readonly title = input('');
  /** Start playing straight away (when the sheet was opened just to watch). */
  readonly autoplay = input(false);

  protected readonly playing = linkedSignal(() => this.autoplay());
  protected readonly isShort = computed(() => this.url().includes('/shorts/'));
  protected readonly embed = computed<SafeResourceUrl | null>(() => {
    const id = youTubeId(this.url());
    // Only a validated id goes into a fixed YouTube embed address.
    return id
      ? this.sanitizer.bypassSecurityTrustResourceUrl(
          `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&playsinline=1&rel=0`,
        )
      : null;
  });
}
