// services/types/exerciseAPI.ts

export interface ExerciseAPI {
  name: string;
  force: string | null;
  level: 'beginner' | 'intermediate' | 'expert';
  mechanic: string | null;
  equipment: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  category: string;
  images: string[]; // Will store GIF URLs from API
  id: string;
}

export interface GymFitExercise {
  bodyPart: string;
  equipment: string;
  gifUrl: string;
  id: string;
  name: string;
  target: string;
  secondaryMuscles: string[];
  instructions: string[];
}