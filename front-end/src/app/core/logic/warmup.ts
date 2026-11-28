import { Exercise, MuscleGroup } from '../models';
import { GENERAL_WARMUP, WARMUP_MOVES, WarmupMove, WarmupRegion } from '../content/warmups';

const REGION: Record<MuscleGroup, WarmupRegion> = {
  Chest: 'push',
  Shoulders: 'push',
  Triceps: 'push',
  Back: 'pull',
  Biceps: 'pull',
  Quads: 'legs',
  Hamstrings: 'legs',
  Glutes: 'legs',
  Adductors: 'legs',
  Calves: 'legs',
  Core: 'core',
};

const MAX_MOVES = 6;

/** Ramp-up sets as a share of the first lift's working weight. */
const RAMP: { pct: number; reps: number }[] = [
  { pct: 0.5, reps: 8 },
  { pct: 0.7, reps: 5 },
  { pct: 0.85, reps: 2 },
];

export type WarmupRound =
  | { kind: 'reps'; reps: number; perSide: boolean }
  | { kind: 'time'; seconds: number }
  | { kind: 'ramp'; weightKg: number; reps: number };

export interface WarmupItem {
  id: string;
  name: string;
  cue: string;
  rounds: WarmupRound[];
  /** Set for ramp-up items: the exercise they lead into. */
  exerciseId?: string;
}

export interface WarmupSection {
  title: string;
  items: WarmupItem[];
}

export interface WarmupPlan {
  regions: WarmupRegion[];
  minutes: number;
  sections: WarmupSection[];
}

function fromMove(m: WarmupMove): WarmupItem {
  const round: WarmupRound =
    m.kind === 'time' ? { kind: 'time', seconds: m.amount } : { kind: 'reps', reps: m.amount, perSide: !!m.perSide };
  return { id: m.id, name: m.name, cue: m.cue, rounds: Array.from({ length: m.rounds }, () => round) };
}

/**
 * Builds a warm-up for a workout: easy cardio, mobility for the body regions the
 * workout trains, then ramp-up sets for the first lift based on its last working weight.
 */
export function buildWarmup(
  exercises: Exercise[],
  firstLiftWorkingKg: number | null,
  incrementKg: number,
): WarmupPlan {
  const regions = [...new Set(exercises.map((e) => REGION[e.muscle]))];
  const moves = WARMUP_MOVES.filter((m) => m.regions.some((r) => regions.includes(r))).slice(0, MAX_MOVES);

  const sections: WarmupSection[] = [
    { title: 'Get warm', items: [fromMove(GENERAL_WARMUP)] },
    { title: 'Mobility and activation', items: moves.map(fromMove) },
  ];

  const first = exercises[0];
  if (first) {
    const rounds: WarmupRound[] = [];
    if (firstLiftWorkingKg && firstLiftWorkingKg > 0) {
      let last = 0;
      for (const step of RAMP) {
        const w = Math.round((firstLiftWorkingKg * step.pct) / incrementKg) * incrementKg;
        if (w > 0 && w > last && w < firstLiftWorkingKg) {
          rounds.push({ kind: 'ramp', weightKg: w, reps: step.reps });
          last = w;
        }
      }
    }
    sections.push({
      title: `Ramp up to ${first.name}`,
      items: [
        {
          id: `ramp-${first.id}`,
          name: first.name,
          exerciseId: first.id,
          cue: rounds.length
            ? 'Light, crisp reps building toward your first working set. Rest about a minute between them.'
            : 'Do two or three light sets, adding weight each time, until the movement feels smooth.',
          rounds: rounds.length ? rounds : [{ kind: 'reps', reps: 8, perSide: false }, { kind: 'reps', reps: 5, perSide: false }],
        },
      ],
    });
  }

  const seconds = sections
    .flatMap((s) => s.items)
    .flatMap((i) => i.rounds)
    .reduce((t, r) => t + (r.kind === 'time' ? r.seconds + 15 : r.kind === 'ramp' ? 90 : 45), 0);

  return { regions, minutes: Math.max(5, Math.round(seconds / 60)), sections };
}
