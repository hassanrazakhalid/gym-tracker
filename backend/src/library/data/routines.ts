import { Routine } from '../../domain/models.js';

export const ROUTINES: Routine[] = [
  {
    id: 'push',
    name: 'Push',
    focus: 'Chest, shoulders, triceps',
    estimatedMinutes: 55,
    blocks: [
      { restSeconds: 120, exercises: [{ exerciseId: 'incline-db-press', sets: 3 }, { exerciseId: 'cable-fly', sets: 3 }] },
      { restSeconds: 150, exercises: [{ exerciseId: 'overhead-press', sets: 3 }] },
      { restSeconds: 90, exercises: [{ exerciseId: 'lateral-raise', sets: 3 }, { exerciseId: 'triceps-pushdown', sets: 3 }] },
      { restSeconds: 75, exercises: [{ exerciseId: 'overhead-triceps-ext', sets: 2 }] },
    ],
  },
  {
    id: 'pull',
    name: 'Pull',
    focus: 'Back, rear delts, biceps',
    estimatedMinutes: 50,
    blocks: [
      { restSeconds: 150, exercises: [{ exerciseId: 'lat-pulldown', sets: 3 }] },
      { restSeconds: 120, exercises: [{ exerciseId: 'barbell-row', sets: 3 }, { exerciseId: 'face-pull', sets: 3 }] },
      { restSeconds: 90, exercises: [{ exerciseId: 'cable-row', sets: 3 }] },
      { restSeconds: 75, exercises: [{ exerciseId: 'db-curl', sets: 3 }, { exerciseId: 'hammer-curl', sets: 2 }] },
    ],
  },
  {
    id: 'legs',
    name: 'Legs',
    focus: 'Quads, hamstrings, glutes, calves',
    estimatedMinutes: 60,
    blocks: [
      { restSeconds: 180, exercises: [{ exerciseId: 'back-squat', sets: 3 }] },
      { restSeconds: 150, exercises: [{ exerciseId: 'romanian-deadlift', sets: 3 }] },
      { restSeconds: 90, exercises: [{ exerciseId: 'leg-extension', sets: 3 }, { exerciseId: 'seated-leg-curl', sets: 3 }] },
      { restSeconds: 60, exercises: [{ exerciseId: 'standing-calf-raise', sets: 3 }, { exerciseId: 'cable-crunch', sets: 3 }] },
    ],
  },
];

/** Planned routine for each weekday, Sunday = 0. Null is a rest day. */
export const WEEK_PLAN: (string | null)[] = [null, 'push', 'pull', 'legs', null, 'push', 'pull'];
