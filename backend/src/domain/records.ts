import { PrMetric, WorkoutSession } from './models.js';

export interface Bests {
  weight: number;
  reps: number;
  volume: number;
}

const EMPTY: Bests = { weight: 0, reps: 0, volume: 0 };

/** Best completed set values for one exercise across the given sessions. */
export function bestsFor(exerciseId: string, sessions: WorkoutSession[]): Bests | null {
  let found = false;
  const b = { ...EMPTY };
  for (const s of sessions) {
    for (const ex of s.exercises) {
      if (ex.exerciseId !== exerciseId) continue;
      for (const set of ex.sets) {
        if (!set.completed || set.reps == null) continue;
        found = true;
        const w = set.weightKg ?? 0;
        b.weight = Math.max(b.weight, w);
        b.reps = Math.max(b.reps, set.reps);
        b.volume = Math.max(b.volume, w * set.reps);
      }
    }
  }
  return found ? b : null;
}

/**
 * Which metrics a set beats. A tiny epsilon stops kg/lb rounding from creating
 * false PRs. With no history, nothing counts as a record.
 */
export function prMetrics(weightKg: number, reps: number, bests: Bests | null): PrMetric[] {
  if (!bests) return [];
  const eps = 0.01;
  const out: PrMetric[] = [];
  if (weightKg > bests.weight + eps) out.push('weight');
  if (reps > bests.reps) out.push('reps');
  if (weightKg * reps > bests.volume + eps) out.push('volume');
  return out;
}

export function addToBests(bests: Bests, weightKg: number, reps: number): Bests {
  return {
    weight: Math.max(bests.weight, weightKg),
    reps: Math.max(bests.reps, reps),
    volume: Math.max(bests.volume, weightKg * reps),
  };
}

/** Epley estimated one-rep max, for history charts. */
export function estimatedOneRepMax(weightKg: number, reps: number): number {
  return reps <= 1 ? weightKg : weightKg * (1 + reps / 30);
}

/**
 * Flags which completed sets in a session were personal records, judged against
 * `prior` sessions and against earlier sets in the same session (in completion order).
 */
export function flagPrSets(
  session: WorkoutSession,
  prior: WorkoutSession[],
): Map<string, { exerciseId: string; metrics: PrMetric[]; weightKg: number; reps: number; at: string | null }> {
  const result = new Map<string, { exerciseId: string; metrics: PrMetric[]; weightKg: number; reps: number; at: string | null }>();
  const running = new Map<string, Bests | null>();
  const ordered = session.exercises
    .flatMap((ex) => ex.sets.map((set) => ({ ex, set })))
    .filter(({ set }) => set.completed && set.reps != null)
    .sort((a, b) => (a.set.completedAt ?? '').localeCompare(b.set.completedAt ?? ''));
  for (const { ex, set } of ordered) {
    if (!running.has(ex.exerciseId)) running.set(ex.exerciseId, bestsFor(ex.exerciseId, prior));
    const bests = running.get(ex.exerciseId) ?? null;
    const w = set.weightKg ?? 0;
    const reps = set.reps!;
    const metrics = prMetrics(w, reps, bests);
    if (metrics.length) result.set(set.id, { exerciseId: ex.exerciseId, metrics, weightKg: w, reps, at: set.completedAt });
    if (bests) running.set(ex.exerciseId, addToBests(bests, w, reps));
  }
  return result;
}
