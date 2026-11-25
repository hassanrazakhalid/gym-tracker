import { guidanceFor } from './progression';

const range = { min: 10, max: 15 };
const inc = 2.5;

describe('guidanceFor (double progression)', () => {
  it('pushes reps when within the range but below the top', () => {
    const g = guidanceFor({ weightKg: 40, reps: 14, effort: 'ideal' }, range, inc);
    expect(g).toMatchObject({ target: 'reps', direction: 'up', reps: 15 });
  });

  it('still pushes reps at exactly the top of the range', () => {
    const g = guidanceFor({ weightKg: 40, reps: 15, effort: 'ideal' }, range, inc);
    expect(g).toMatchObject({ target: 'reps', reps: 16 });
  });

  it('raises the weight once reps go above the range', () => {
    const g = guidanceFor({ weightKg: 40, reps: 16, effort: 'max' }, range, inc);
    expect(g).toMatchObject({ target: 'weight', direction: 'up', weightKg: 42.5, reps: 10 });
  });

  it('treats an easy set at the top of the range as past it', () => {
    const g = guidanceFor({ weightKg: 40, reps: 15, effort: 'easy' }, range, inc);
    expect(g).toMatchObject({ target: 'weight', direction: 'up' });
  });

  it('lowers the weight when reps fall below the range', () => {
    const g = guidanceFor({ weightKg: 40, reps: 8, effort: 'max' }, range, inc);
    expect(g).toMatchObject({ target: 'weight', direction: 'down', weightKg: 37.5, reps: 10 });
  });

  it('asks for more reps instead of less weight when a short set felt easy', () => {
    const g = guidanceFor({ weightKg: 40, reps: 8, effort: 'easy' }, range, inc);
    expect(g).toMatchObject({ target: 'reps', reps: 10 });
  });

  it('holds after a max-effort set inside the range', () => {
    const g = guidanceFor({ weightKg: 40, reps: 12, effort: 'max' }, range, inc);
    expect(g.target).toBe('hold');
  });
});
