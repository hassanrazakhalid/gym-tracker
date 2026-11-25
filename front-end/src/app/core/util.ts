import { effect, signal, WritableSignal } from '@angular/core';

export const LB_PER_KG = 2.20462;

export function uid(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

/** Local calendar date as yyyy-mm-dd. */
export function isoDate(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseIsoDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(d: Date, days: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
}

export function daysBetween(a: Date, b: Date): number {
  const ms = parseIsoDate(isoDate(b)).getTime() - parseIsoDate(isoDate(a)).getTime();
  return Math.round(ms / 86_400_000);
}

/** "today", "yesterday", "3 days ago", or a short date. */
export function relativeDay(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date.length === 10 ? date + 'T12:00:00' : date) : date;
  const diff = daysBetween(d, new Date());
  if (diff === 0) return 'today';
  if (diff === 1) return 'yesterday';
  if (diff < 7) return `${diff} days ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/** 657 → "10m 57s"; 3725 → "1h 2m". */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${String(sec).padStart(2, '0')}s`;
  return `${sec}s`;
}

/** Workout length: 3120 → "52 min"; 3725 → "1h 2m". */
export function formatWorkoutLength(totalSeconds: number): string {
  const m = Math.round(totalSeconds / 60);
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m} min`;
}

/** 120 → "2:00". */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.ceil(totalSeconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Seeded PRNG for repeatable pseudo-random values. */
export function seededRandom(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const STORAGE_PREFIX = 'gymtracker.v1.';

/**
 * A signal backed by localStorage, for state that belongs to this device only
 * (such as a running rest timer). Account data lives on the server.
 */
export function persistedSignal<T>(key: string, seed: () => T): WritableSignal<T> {
  const storageKey = STORAGE_PREFIX + key;
  let initial: T;
  try {
    const raw = localStorage.getItem(storageKey);
    initial = raw !== null ? (JSON.parse(raw) as T) : seed();
  } catch {
    initial = seed();
  }
  const s = signal<T>(initial);
  effect(() => {
    const value = s();
    try {
      if (value === undefined) localStorage.removeItem(storageKey);
      else localStorage.setItem(storageKey, JSON.stringify(value));
    } catch {
      // Storage full or unavailable: keep working in memory.
    }
  });
  return s;
}
