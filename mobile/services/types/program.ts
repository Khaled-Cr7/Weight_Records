// services/types/program.ts
// Shapes returned by the Repsy API (see server/src/routes/programs.ts and routines.ts)

export type RepMode = 'REPS' | 'RANGE';
export type SetType = 'NORMAL' | 'WARMUP' | 'DROP';

// One row in the program list
export interface ProgramSummary {
  id: string;
  name: string;
  description: string | null;
  imageKey: string | null; // 'bench' | 'dumbell' | 'plates' | 'incline' (see constants/images)
  sortOrder: number;
  routineCount: number;
}

export interface ProgramListResponse {
  readyMade: ProgramSummary[];
  mine: ProgramSummary[];
}

export interface RoutineSet {
  id: string;
  setOrder: number;
  setType: SetType;
  targetWeightKg: number | null;
  repMode: RepMode;
  targetReps: number | null; // used when repMode is REPS
  targetRepsMin: number | null; // used when repMode is RANGE
  targetRepsMax: number | null;
}

export interface RoutineExercise {
  id: string;
  sortOrder: number;
  notes: string | null;
  restSeconds: number | null;
  exercise: {
    id: string;
    name: string;
    equipment: string | null;
    primaryMuscles: string[];
    image: string | null;
  };
  sets: RoutineSet[];
}

export interface Routine {
  id: string;
  name: string;
  description: string | null;
  imageKey: string | null;
  programId: string | null;
  isReadyMade: boolean;
  sortOrder: number;
  updatedAt: string;
  exercises: RoutineExercise[];
}

export interface ProgramDetail {
  id: string;
  name: string;
  description: string | null;
  imageKey: string | null;
  isReadyMade: boolean;
  routines: Routine[];
}

// One row in the user's own standalone routines
export interface RoutineSummary {
  id: string;
  name: string;
  description: string | null;
  imageKey: string | null;
  updatedAt: string;
  exerciseCount: number;
}

// ---- What the app sends when creating or saving ----

export interface RoutineSetInput {
  setType: SetType;
  repMode: RepMode;
  targetWeightKg: number | null;
  targetReps?: number | null; // REPS mode
  targetRepsMin?: number; // RANGE mode
  targetRepsMax?: number;
}

export interface RoutineExerciseInput {
  exerciseId: string;
  restSeconds: number;
  sets: RoutineSetInput[];
}

export interface RoutineInput {
  name: string;
  exercises: RoutineExerciseInput[];
}