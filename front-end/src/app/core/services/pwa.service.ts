import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';

/** Chrome/Edge/Android's install prompt (not in the DOM typings yet). */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export type InstallPlatform = 'ios' | 'android' | 'desktop';

/**
 * Installing the app to the home screen, and moving to a new version once the
 * service worker has downloaded one. Created at startup (see App) so it catches
 * the browser's one-time install event.
 */
@Injectable({ providedIn: 'root' })
export class PwaService {
  private readonly sw = inject(SwUpdate);
  private deferred: BeforeInstallPromptEvent | null = null;

  /** The browser offered an install prompt we can show from a button. */
  readonly canPrompt = signal(false);
  /** Running from the home screen rather than in a browser tab. */
  readonly installed = signal(isStandalone());
  readonly platform: InstallPlatform = detectPlatform();
  /** A new version has been downloaded and is ready to use. */
  readonly updateReady = signal(false);

  constructor() {
    if (typeof window === 'undefined') return;
    const onPrompt = (e: Event) => {
      e.preventDefault();
      this.deferred = e as BeforeInstallPromptEvent;
      this.canPrompt.set(true);
    };
    const onInstalled = () => {
      this.deferred = null;
      this.canPrompt.set(false);
      this.installed.set(true);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    const standalone = window.matchMedia('(display-mode: standalone)');
    const onDisplayMode = () => this.installed.set(isStandalone());
    standalone.addEventListener('change', onDisplayMode);

    let stopUpdates = () => {};
    if (this.sw.isEnabled) {
      const sub = this.sw.versionUpdates.subscribe((e) => {
        if (e.type === 'VERSION_READY') this.updateReady.set(true);
      });
      const unrecoverable = this.sw.unrecoverable.subscribe(() => location.reload());
      // Look for a new version when the app comes back to the foreground, and hourly.
      const check = () => {
        if (document.visibilityState === 'visible') this.sw.checkForUpdate().catch(() => undefined);
      };
      document.addEventListener('visibilitychange', check);
      const timer = setInterval(check, 60 * 60 * 1000);
      stopUpdates = () => {
        sub.unsubscribe();
        unrecoverable.unsubscribe();
        document.removeEventListener('visibilitychange', check);
        clearInterval(timer);
      };
    }

    inject(DestroyRef).onDestroy(() => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
      standalone.removeEventListener('change', onDisplayMode);
      stopUpdates();
    });
  }

  /** Shows the browser's install prompt. Resolves true if the user installed. */
  async install(): Promise<boolean> {
    const prompt = this.deferred;
    if (!prompt) return false;
    this.deferred = null;
    this.canPrompt.set(false);
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    return outcome === 'accepted';
  }

  /** Switches to the downloaded version. The workout in progress is already saved on the server. */
  async applyUpdate(): Promise<void> {
    try {
      await this.sw.activateUpdate();
    } finally {
      location.reload();
    }
  }
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function detectPlatform(): InstallPlatform {
  if (typeof navigator === 'undefined') return 'desktop';
  const ua = navigator.userAgent;
  // iPadOS reports itself as a Mac; touch support gives it away.
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'desktop';
}
