import { Exercise } from '../models';
import { buildWarmup } from './warmup';

function ex(id: string, muscle: Exercise['muscle']): Exercise {
  return {
    id, name: id, muscle, equipment: 'Barbell', repRange: { min: 6, max: 10 },
    jointFriendly: false, alternatives: [], formGuide: [],
  };
}

describe('buildWarmup', () => {
  it('picks mobility moves for the regions the workout trains', () => {
    const plan = buildWarmup([ex('squat', 'Quads'), ex('curl', 'Hamstrings')], 100, 2.5);
    const moves = plan.sections[1].items.map((i) => i.id);
    expect(plan.regions).toEqual(['legs']);
    expect(moves).toContain('bw-squat');
    expect(moves).not.toContain('band-pull-apart');
  });

  it('always starts with easy cardio', () => {
    const plan = buildWarmup([ex('bench', 'Chest')], 60, 2.5);
    expect(plan.sections[0].items[0].id).toBe('easy-cardio');
  });

  it('ramps up to the first lift at 50/70/85% rounded to the plate increment', () => {
    const plan = buildWarmup([ex('bench', 'Chest')], 100, 2.5);
    const ramp = plan.sections[2].items[0].rounds;
    expect(ramp).toEqual([
      { kind: 'ramp', weightKg: 50, reps: 8 },
      { kind: 'ramp', weightKg: 70, reps: 5 },
      { kind: 'ramp', weightKg: 85, reps: 2 },
    ]);
  });

  it('skips duplicate or zero ramp weights for light lifts', () => {
    const plan = buildWarmup([ex('raise', 'Shoulders')], 5, 2.5);
    const weights = plan.sections[2].items[0].rounds.map((r) => (r.kind === 'ramp' ? r.weightKg : -1));
    expect(new Set(weights).size).toBe(weights.length);
    expect(weights.every((w) => w > 0 && w < 5)).toBe(true);
  });

  it('falls back to light sets when there is no history', () => {
    const plan = buildWarmup([ex('bench', 'Chest')], null, 2.5);
    expect(plan.sections[2].items[0].rounds.every((r) => r.kind === 'reps')).toBe(true);
  });
});
