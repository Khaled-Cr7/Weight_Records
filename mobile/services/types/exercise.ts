// services/types/exercise.ts
// Shapes returned by the Repsy API (see server/src/routes/exercises.ts)

// One row in a list or search result (short version)
export interface ExerciseListItem {
  id: string;
  name: string;
  equipment: string | null;
  category: string | null;
  level: string | null;
  primaryMuscles: string[];
  image: string | null; // full URL of the first image
}

export interface ExerciseListResponse {
  total: number;
  limit: number;
  offset: number;
  items: ExerciseListItem[];
}

// Full details of one exercise
export interface Exercise {
  id: string;
  name: string;
  force: string | null;
  level: string | null;
  mechanic: string | null;
  equipment: string | null;
  category: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  images: string[]; // full URLs
  image: string | null; // first image
}

export interface ExerciseFilters {
  muscles: string[];
  equipment: string[];
}