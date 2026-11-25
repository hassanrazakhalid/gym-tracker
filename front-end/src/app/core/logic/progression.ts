import { Effort, RepRange } from '../models';

export interface PerformedSet {
  weightKg: number;
  reps: number;
  effort: Effort | null;
}

export type Guidance =
  | { target: 'reps'; direction: 'up'; reps: number; reason: string }
  | { target: 'weight'; direction: 'up' | 'down'; weightKg: number; reps: number; reason: string }
  | { target: 'hold'; reason: string };

/**
 * Two-stage (double) progression for one set, based on how that set went last time.
 *
 * - Reps below the range: lower the weight so the range is reachable.
 * - Reps within the range (including the top): push for one more rep.
 *   An Easy rating at the top of the range counts as having gone past it.
 * - Reps above the range: increase the weight and aim for the bottom of the range.
 * - A Max effort set below the top holds the weight and aims for the same reps.
 */
export function guidanceFor(prev: PerformedSet, range: RepRange, incrementKg: number): Guidance {
  const { reps, weightKg, effort } = prev;

  const wentPastRange = reps > range.max || (reps === range.max && effort === 'easy');
  if (wentPastRange && weightKg > 0) {
    return {
      target: 'weight',
      direction: 'up',
      weightKg: weightKg + incrementKg,
      reps: range.min,
      reason: `You beat the top of the ${range.min}–${range.max} range. Go heavier.`,
    };
  }

  if (reps < range.min) {
    if (effort === 'easy') {
      return { target: 'reps', direction: 'up', reps: range.min, reason: 'That felt easy. Get into the range.' };
    }
    if (weightKg > 0) {
      return {
        target: 'weight',
        direction: 'down',
        weightKg: Math.max(0, weightKg - incrementKg),
        reps: range.min,
        reason: `You fell short of ${range.min} reps. Drop the weight to stay in range.`,
      };
    }
  }

  if (effort === 'max' && reps < range.max) {
    return { target: 'hold', reason: 'Last time was max effort. Match it with cleaner reps.' };
  }

  return {
    target: 'reps',
    direction: 'up',
    reps: reps + 1,
    reason: `Push for ${reps + 1} reps, toward the top of the range.`,
  };
}

/** Plate-friendly increment in kg for the user's unit (5 lb or 2.5 kg). */
export function incrementKgFor(unit: 'lb' | 'kg'): number {
  return unit === 'lb' ? 5 / 2.20462 : 2.5;
}
