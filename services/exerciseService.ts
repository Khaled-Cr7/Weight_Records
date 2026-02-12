import { Exercise } from './types/exercise';
import exerciseData from '../data/exercises.json';


// Cast the raw JSON as an array of our Exercise type
const allExercises = exerciseData as Exercise[];

// Main database images (GitHub free exercise DB)
const GITHUB_RAW_BASE = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/";

// Your custom exercises images (your personal repo)
const GITHUB_KHALED_BASE = "https://raw.githubusercontent.com/Khaled-Cr7/exercise-gifs/main/";

// Helper to get the first image of an exercise with fallback
export const getExerciseImage = (imagePath: string, useCustomRepo: boolean = false) => {
  // If the path already starts with http, return as is
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // Use custom repo if specified, otherwise use main repo
  if (useCustomRepo) {
    return `${GITHUB_KHALED_BASE}${imagePath}`;
  }
  
  return `${GITHUB_RAW_BASE}${imagePath}`;
};

export const fetchExerciseDetails = (exerciseId: string): Exercise | undefined => {
  return ExerciseService.getById(exerciseId);
};

// Check if exercise should use custom repo (you added it manually)
const isCustomExercise = (exerciseId: string): boolean => {
  const customExerciseIds = [
    'Lower_Back_Extension',
    'One_Arm_Cable_Lateral_Raise',
    'One_Arm_Cable_Curl',
  ];
  return customExerciseIds.includes(exerciseId);
};



export const ExerciseService = {
  // Get all exercises
  getAll: (): Exercise[] => {
    return allExercises;
  },

  // Get by muscle (e.g., 'chest')
  getByMuscle: (muscle: string): Exercise[] => {
    return allExercises.filter(ex => 
      ex.primaryMuscles.includes(muscle.toLowerCase())
    );
  },

  // Search by name
  search: (query: string): Exercise[] => {
    const term = query.toLowerCase();
    return allExercises.filter(ex => 
      ex.name.toLowerCase().includes(term)
    );
  },

  // Get exact exercise by ID
  getById: (id: string): Exercise | undefined => {
    return allExercises.find(ex => ex.id === id);
  },

  // Get exact exercise by name (exact match)
  getByExactName: (name: string): Exercise | undefined => {
    return allExercises.find(ex => 
      ex.name.toLowerCase() === name.toLowerCase()
    );
  },

  // Smart search: Try exact match first, fallback to fuzzy search
  smartSearch: (query: string): Exercise | undefined => {
    // First try exact match
    let result = allExercises.find(ex => 
      ex.name.toLowerCase() === query.toLowerCase()
    );
    
    // If no exact match, try fuzzy search
    if (!result) {
      const fuzzyResults = allExercises.filter(ex => 
        ex.name.toLowerCase().includes(query.toLowerCase())
      );
      result = fuzzyResults.length > 0 ? fuzzyResults[0] : undefined;
    }
    
    return result;
  },

  // Check if exercise uses custom repo
  isCustomExercise: (exerciseId: string): boolean => {
    return isCustomExercise(exerciseId);
  },

  initialize: async () => {

    return new Promise((resolve) => {

      setTimeout(resolve, 1000); 
    });
  },
  
  // Example of a "isCached" check for later
  isDataReady: () => {
    // Returns true if your exercise array is not empty
    return true; 
  }
};

