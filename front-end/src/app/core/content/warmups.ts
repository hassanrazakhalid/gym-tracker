/** Body regions a warm-up targets. Each muscle group maps to one (see logic/warmup.ts). */
export type WarmupRegion = 'push' | 'pull' | 'legs' | 'core';

export interface WarmupMove {
  id: string;
  name: string;
  regions: WarmupRegion[];
  /** Reps per round, or seconds per round for timed moves. */
  kind: 'reps' | 'time';
  amount: number;
  rounds: number;
  perSide?: boolean;
  cue: string;
}

/** General warm-up done before every session. */
export const GENERAL_WARMUP: WarmupMove = {
  id: 'easy-cardio',
  name: 'Easy cardio',
  regions: [],
  kind: 'time',
  amount: 300,
  rounds: 1,
  cue: 'Bike, rower or brisk incline walk. You should be able to talk in full sentences.',
};

/** Dynamic mobility and activation moves, ordered from general to specific. */
export const WARMUP_MOVES: WarmupMove[] = [
  {
    id: 'arm-circles', name: 'Arm circles', regions: ['push', 'pull'], kind: 'time', amount: 30, rounds: 1,
    cue: 'Small circles growing to big ones. Switch direction halfway.',
  },
  {
    id: 'band-pull-apart', name: 'Band pull-apart', regions: ['push', 'pull'], kind: 'reps', amount: 15, rounds: 2,
    cue: 'Arms straight at chest height. Pull the band to your chest and squeeze your shoulder blades.',
  },
  {
    id: 'thoracic-rotation', name: 'Open book rotation', regions: ['push', 'pull'], kind: 'reps', amount: 8, rounds: 1, perSide: true,
    cue: 'Lie on your side, knees bent. Open your top arm across to the floor behind you and follow it with your eyes.',
  },
  {
    id: 'scap-push-up', name: 'Scapular push-up', regions: ['push'], kind: 'reps', amount: 10, rounds: 2,
    cue: 'In a push-up position with straight arms, let your chest sink between your shoulders, then push it away.',
  },
  {
    id: 'band-dislocate', name: 'Band shoulder pass-through', regions: ['push'], kind: 'reps', amount: 10, rounds: 1,
    cue: 'Wide grip on a light band. Bring it over your head and behind you with straight arms.',
  },
  {
    id: 'cat-cow', name: 'Cat-cow', regions: ['pull', 'core'], kind: 'reps', amount: 10, rounds: 1,
    cue: 'On hands and knees, round your back fully, then arch it. Move slowly with your breath.',
  },
  {
    id: 'dead-hang', name: 'Dead hang', regions: ['pull'], kind: 'time', amount: 30, rounds: 2,
    cue: 'Hang from a bar with relaxed shoulders. Then pull your shoulders down for a second without bending your arms.',
  },
  {
    id: 'band-row', name: 'Light band row', regions: ['pull'], kind: 'reps', amount: 15, rounds: 1,
    cue: 'Easy tension. Lead with your elbows and squeeze at the end.',
  },
  {
    id: 'leg-swing', name: 'Leg swings', regions: ['legs'], kind: 'reps', amount: 10, rounds: 1, perSide: true,
    cue: 'Hold a rack. Swing front to back, then side to side, growing the range each rep.',
  },
  {
    id: 'ankle-rock', name: 'Ankle rocks', regions: ['legs'], kind: 'reps', amount: 10, rounds: 1, perSide: true,
    cue: 'Half-kneeling, push your front knee forward over your toes with the heel down.',
  },
  {
    id: 'bw-squat', name: 'Bodyweight squat', regions: ['legs'], kind: 'reps', amount: 15, rounds: 2,
    cue: 'Full depth, slow down and steady up. Push your knees out over your toes.',
  },
  {
    id: 'glute-bridge', name: 'Glute bridge', regions: ['legs'], kind: 'reps', amount: 12, rounds: 2,
    cue: 'Feet flat, drive through your heels and pause at the top with glutes squeezed.',
  },
  {
    id: 'walking-lunge', name: 'Walking lunge', regions: ['legs'], kind: 'reps', amount: 8, rounds: 1, perSide: true,
    cue: 'Long steps, back knee just above the floor, torso upright.',
  },
  {
    id: 'dead-bug', name: 'Dead bug', regions: ['core'], kind: 'reps', amount: 8, rounds: 1, perSide: true,
    cue: 'Lower back pressed into the floor while you extend the opposite arm and leg.',
  },
];
