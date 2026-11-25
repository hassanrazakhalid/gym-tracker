import { SessionExercise, WorkoutSession } from './models.js';
import { bestsFor, flagPrSets, prMetrics } from './records.js';

function session(id: string, startedAt: string, sets: [number, number][], exerciseId = 'bench'): WorkoutSession {
  const ex: SessionExercise = {
    id: `${id}-ex`,
    exerciseId,
    groupId: 'g',
    notes: '',
    sets: sets.map(([w, r], i) => ({
      id: `${id}-s${i + 1}`,
      setNumber: i + 1,
      weightKg: w,
      reps: r,
      effort: 'ideal',
      completed: true,
      completedAt: `${startedAt.slice(0, 10)}T10:0${i}:00Z`,
    })),
  };
  return {
    id, routineId: null, name: 'Push', startedAt, endedAt: startedAt, status: 'completed',
    groups: [{ id: 'g', restSeconds: 90 }], exercises: [ex],
  };
}

describe('personal records', () => {
  const past = [session('a', '2026-11-01T10:00:00Z', [[60, 8], [60, 7]])];

  it('computes bests from history', () => {
    expect(bestsFor('bench', past)).toEqual({ weight: 60, reps: 8, volume: 480 });
    expect(bestsFor('squat', past)).toBeNull();
  });

  it('never flags a PR on the first time an exercise is logged', () => {
    expect(prMetrics(100, 10, null)).toEqual([]);
  });

  it('flags heavier, more reps and more volume separately', () => {
    const b = { weight: 60, reps: 8, volume: 480 };
    expect(prMetrics(62.5, 6, b)).toEqual(['weight']);
    expect(prMetrics(50, 10, b)).toEqual(['reps', 'volume']);
    expect(prMetrics(60, 8, b)).toEqual([]);
  });

  it('judges later sets against earlier sets in the same session', () => {
    const today = session('b', '2026-11-08T10:00:00Z', [[60, 9], [60, 9]]);
    const flags = flagPrSets(today, past);
    expect([...flags.keys()]).toEqual(['b-s1']);
  });

  it('keeps history per exercise, so a swapped exercise has its own bests', () => {
    const other = session('c', '2026-11-08T10:00:00Z', [[20, 12]], 'db-press');
    expect(flagPrSets(other, past).size).toBe(0);
  });
});
