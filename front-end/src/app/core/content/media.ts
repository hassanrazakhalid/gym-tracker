/**
 * Ids (exercises and warm-up moves) that have photos in public/exercises/:
 * `<id>-0.jpg` is the start of the movement and `<id>-1.jpg` the end.
 * Photos are from free-exercise-db (public domain); see public/exercises/ATTRIBUTION.md.
 */
const WITH_MEDIA = new Set([
  'bench-press', 'incline-db-press', 'incline-bench-press', 'db-bench-press', 'cable-fly', 'pec-deck', 'db-fly',
  'machine-chest-press', 'push-up', 'overhead-press', 'db-shoulder-press', 'machine-shoulder-press',
  'lateral-raise', 'cable-lateral-raise', 'face-pull', 'rear-delt-fly', 'triceps-pushdown',
  'overhead-triceps-ext', 'skull-crusher', 'dips', 'lat-pulldown', 'assisted-pull-up', 'single-arm-pulldown',
  'barbell-row', 'chest-supported-row', 'cable-row', 'db-curl', 'hammer-curl', 'cable-curl', 'back-squat',
  'smith-squat', 'leg-press', 'hack-squat', 'leg-extension', 'romanian-deadlift', 'db-rdl', 'seated-leg-curl',
  'lying-leg-curl', 'hip-thrust', 'standing-calf-raise', 'seated-calf-raise', 'cable-crunch',
  'hanging-leg-raise', 'deadlift', 'goblet-squat', 'hip-abduction', 'hip-adduction', 'leg-press-calf-raise',
  // Warm-up moves
  'arm-circles', 'band-pull-apart', 'thoracic-rotation', 'scap-push-up', 'cat-cow', 'bw-squat',
  'glute-bridge', 'walking-lunge', 'dead-bug', 'easy-cardio',
]);

export interface ExerciseMedia {
  start: string;
  end: string;
}

export function mediaFor(id: string): ExerciseMedia | null {
  return WITH_MEDIA.has(id) ? { start: `exercises/${id}-0.jpg`, end: `exercises/${id}-1.jpg` } : null;
}
