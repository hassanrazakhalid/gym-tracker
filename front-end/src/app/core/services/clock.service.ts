import { Injectable, signal } from '@angular/core';

/** One shared ticking clock for session and rest timers. */
@Injectable({ providedIn: 'root' })
export class ClockService {
  readonly now = signal(Date.now());

  constructor() {
    setInterval(() => this.now.set(Date.now()), 250);
  }
}
