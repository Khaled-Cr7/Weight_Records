// services/types/exercise.ts

export interface Exercise {
  name: string;
  force: string | null;
  level: 'beginner' | 'intermediate' | 'expert';
  mechanic: string | null;
  equipment: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  category: string;
  images: string[];
  id: string;
}