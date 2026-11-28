// services/types/workout.ts
// Shapes returned by the Repsy API (see server/src/routes/workouts.ts)
import type { RepMode, SetType } from './program';

export type WorkoutStatus = 'IN_PROGRESS' | 'COMPLETED' | 'DISCARDED';

// The fields of a set that the user changes
export interface WorkoutSetCore {
  id: string;
  setOrder: number;
  setType: SetType;
  repMode: RepMode;
  targetRepsMin: number | null;
  targetRepsMax: number | null;
  weightKg: number | null;
  reps: number | null;
  isCompleted: boolean;
}

export interface WorkoutSet extends WorkoutSetCore {
  // What the user did last time for this kind of set
  previous: { weightKg: number | null; reps: number | null } | null;
  // What to show in the empty boxes
  placeholder: { weightKg: number | null; reps: number | null };
}

export interface WorkoutExercise {
  id: string;
  sortOrder: number;
  notes: string | null;
  restSeconds: number;
  exercise: {
    id: string;
    name: string;
    equipment: string | null;
    primaryMuscles: string[];
    image: string | null;
  };
  sets: WorkoutSet[];
}

export interface Workout {
  id: string;
  name: string;
  status: WorkoutStatus;
  notes: string | null;
  sourceRoutineId: string | null;
  startedAt: string;
  finishedAt: string | null;
  durationSeconds: number | null;
  routineUpdatedAt: string | null;
  exercises: WorkoutExercise[];
}

export interface WorkoutSummary {
  durationSeconds: number;
  exerciseCount: number;
  setCount: number;
  totalReps: number;
  volumeKg: number;
  routineUpdated: boolean;
}

// One row in the history list
export interface WorkoutListItem {
  id: string;
  name: string;
  startedAt: string;
  finishedAt: string | null;
  durationSeconds: number | null;
  exerciseNames: string[];
  setCount: number;
  volumeKg: number;
}