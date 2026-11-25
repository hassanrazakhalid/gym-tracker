/**
 * Domain models, matching the shapes the API returns (backend/src/domain/models.ts).
 *
 * Weights are always stored in kilograms; the UI converts to the user's unit.
 */

export type Unit = 'lb' | 'kg';

export type MuscleGroup =
  | 'Chest'
  | 'Back'
  | 'Shoulders'
  | 'Biceps'
  | 'Triceps'
  | 'Quads'
  | 'Hamstrings'
  | 'Glutes'
  | 'Calves'
  | 'Core';

export interface RepRange {
  min: number;
  max: number;
}

/** An exercise in the library. */
export interface Exercise {
  id: string;
  name: string;
  muscle: MuscleGroup;
  equipment: 'Barbell' | 'Dumbbell' | 'Cable' | 'Machine' | 'Bodyweight';
  /** Recommended rep range, shown as the target whenever the exercise is performed. */
  repRange: RepRange;
  /** Easier on the joints; listed under the Health filter in the exercise picker. */
  jointFriendly: boolean;
  /** Ids of the closest substitutes, shown as recommended alternatives. */
  alternatives: string[];
  formGuide: string[];
  /** Photos of the start and end of the movement, or null when there are none. */
  media?: { start: string; end: string } | null;
}

export interface RoutineExercise {
  exerciseId: string;
  sets: number;
}

/** A block is either one exercise or a superset of two or more, with its own rest time. */
export interface RoutineBlock {
  restSeconds: number;
  exercises: RoutineExercise[];
}

export interface Routine {
  id: string;
  name: string;
  focus: string;
  estimatedMinutes: number;
  blocks: RoutineBlock[];
}

/** Easy: 3+ reps left. Ideal: 1–3 reps left. Max: no more reps with good form. */
export type Effort = 'easy' | 'ideal' | 'max';

export interface SetEntry {
  id: string;
  setNumber: number;
  weightKg: number | null;
  reps: number | null;
  effort: Effort | null;
  completed: boolean;
  completedAt: string | null;
}

/** One exercise as performed in a session. */
export interface SessionExercise {
  id: string;
  exerciseId: string;
  /** Exercises sharing a groupId are a superset (or a single exercise when alone). */
  groupId: string;
  notes: string;
  sets: SetEntry[];
}

export interface SessionGroup {
  id: string;
  restSeconds: number;
}

export type SessionStatus = 'active' | 'completed';

export interface WorkoutSession {
  id: string;
  routineId: string | null;
  name: string;
  startedAt: string;
  endedAt: string | null;
  status: SessionStatus;
  groups: SessionGroup[];
  /** Ordered; exercises of the same group are always adjacent. */
  exercises: SessionExercise[];
}

export type PrMetric = 'weight' | 'reps' | 'volume';

export interface PersonalRecord {
  exerciseId: string;
  metric: PrMetric;
  value: number;
  sessionId: string;
  achievedAt: string;
}

export interface BodyWeightEntry {
  id: string;
  date: string; // yyyy-mm-dd
  weightKg: number;
}

export type GoalType = 'lose-fat' | 'maintain' | 'build-muscle';
export type GoalPace = 'slow' | 'moderate' | 'fast';

export interface Goal {
  type: GoalType;
  pace: GoalPace;
  /** Signed kg per week (negative means losing). */
  weeklyRateKg: number;
  startDate: string;
  startingWeightKg: number;
  dailyCalories: number;
}

export type Meal = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks';

export interface FoodEntry {
  id: string;
  date: string;
  meal: Meal;
  name: string;
  calories: number;
  proteinG: number;
}

export interface Food {
  name: string;
  serving: string;
  calories: number;
  proteinG: number;
}

export type Feeling = 1 | 2 | 3 | 4 | 5;

export interface NutritionCheckIn {
  date: string;
  hunger: Feeling;
  energy: Feeling;
  onPlan: boolean;
}

export interface StepEntry {
  date: string;
  steps: number;
}

export interface ProgressPhoto {
  id: string;
  date: string;
  dataUrl: string;
}

export interface Lesson {
  id: string;
  course: string;
  title: string;
  minutes: number;
  summary: string;
  body: string[];
}
