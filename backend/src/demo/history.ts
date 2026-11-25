import { Effort, SessionExercise, SessionGroup, WorkoutSession } from '../domain/models.js';
import { addDays, LB_PER_KG, seededRandom, uid } from '../domain/util.js';
import { EXERCISES } from '../library/data/exercises.js';
import { ROUTINES, WEEK_PLAN } from '../library/data/routines.js';

const WEEKS_OF_HISTORY = 9;

function incrementLb(equipment: string, muscle: string): number {
  if (equipment === 'Barbell') return ['Quads', 'Hamstrings', 'Glutes'].includes(muscle) ? 10 : 5;
  if (equipment === 'Machine') return 10;
  return 5;
}

/**
 * Builds ~9 weeks of completed sessions that follow the weekly plan with
 * double progression (add reps until the top of the range, then add weight).
 */
export function seedHistory(today = new Date()): WorkoutSession[] {
  const rand = seededRandom(42);
  const state = new Map<string, { lb: number; reps: number }>();
  for (const ex of EXERCISES) {
    const inc = incrementLb(ex.equipment, ex.muscle);
    state.set(ex.id, { lb: Math.max(0, ex.startLb - inc * 2), reps: ex.repRange.min });
  }

  const sessions: WorkoutSession[] = [];
  const start = addDays(today, -WEEKS_OF_HISTORY * 7);

  for (let d = new Date(start); d < addDays(today, 0); d = addDays(d, 1)) {
    const isSameDay = d.toDateString() === today.toDateString();
    if (isSameDay) continue;
    const routineId = WEEK_PLAN[d.getDay()];
    if (!routineId || rand() > 0.86) continue;
    const routine = ROUTINES.find((r) => r.id === routineId)!;

    const startedAt = new Date(d);
    startedAt.setHours(17 + Math.floor(rand() * 3), Math.floor(rand() * 60), 0, 0);
    const minutes = routine.estimatedMinutes - 8 + Math.floor(rand() * 16);
    const endedAt = new Date(startedAt.getTime() + minutes * 60_000);

    const groups: SessionGroup[] = [];
    const exercises: SessionExercise[] = [];

    for (const block of routine.blocks) {
      const groupId = uid('grp');
      groups.push({ id: groupId, restSeconds: block.restSeconds });
      for (const re of block.exercises) {
        const ex = EXERCISES.find((e) => e.id === re.exerciseId)!;
        const st = state.get(ex.id)!;
        const inc = incrementLb(ex.equipment, ex.muscle);

        // Progress from last time.
        const roll = rand();
        if (roll < 0.7) st.reps += 1;
        if (st.reps > ex.repRange.max) {
          st.lb += inc;
          st.reps = ex.repRange.min + (rand() < 0.5 ? 0 : 1);
        }

        const sets = Array.from({ length: re.sets }, (_, i) => {
          const reps = Math.max(ex.repRange.min - 2, st.reps - Math.floor(i * (0.5 + rand() * 0.6)));
          const r = rand();
          const effort: Effort =
            i === re.sets - 1 ? (r < 0.55 ? 'max' : 'ideal') : r < 0.2 ? 'easy' : r < 0.85 ? 'ideal' : 'max';
          return {
            id: uid('set'),
            setNumber: i + 1,
            weightKg: st.lb / LB_PER_KG,
            reps,
            effort,
            completed: true,
            completedAt: new Date(startedAt.getTime() + (i + 1) * 4 * 60_000).toISOString(),
          };
        });

        exercises.push({ id: uid('sex'), exerciseId: ex.id, groupId, notes: '', sets });
      }
    }

    sessions.push({
      id: uid('ses'),
      routineId,
      name: routine.name,
      startedAt: startedAt.toISOString(),
      endedAt: endedAt.toISOString(),
      status: 'completed',
      groups,
      exercises,
    });
  }

  // Leave a note on the most recent Push so per-exercise notes are visible in history.
  const lastPush = [...sessions].reverse().find((s) => s.routineId === 'push');
  if (lastPush) lastPush.exercises[0].notes = 'Bench at 30°, right shoulder felt fine.';

  return sessions.reverse(); // newest first
}
