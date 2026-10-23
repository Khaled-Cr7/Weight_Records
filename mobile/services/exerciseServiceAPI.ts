import { ExerciseAPI, GymFitExercise } from './types/exerciseAPI';
import { GymFitAPI } from './gymFitApi';

// Convert GymFit API exercise to our ExerciseAPI type
const convertGymFitToExercise = (gymFitEx: GymFitExercise): ExerciseAPI => {
  return {
    name: gymFitEx.name,
    force: null,
    level: 'intermediate' as const,
    mechanic: null,
    equipment: gymFitEx.equipment,
    primaryMuscles: [gymFitEx.target],
    secondaryMuscles: gymFitEx.secondaryMuscles,
    instructions: gymFitEx.instructions,
    category: 'strength',
    images: [gymFitEx.gifUrl],
    id: gymFitEx.id,
  };
};

export const getExerciseImageAPI = (gifUrl: string) => {
  return gifUrl;
};

// CACHE: Store fetched exercises in memory
let cachedExercises: ExerciseAPI[] | null = null;
let isFetching = false;

// Fetch and cache all exercises once
const getCachedExercises = async (): Promise<ExerciseAPI[]> => {
  // Return cache if available
  if (cachedExercises) {
    return cachedExercises;
  }

  // Wait if already fetching
  if (isFetching) {
    return new Promise((resolve) => {
      const checkCache = setInterval(() => {
        if (cachedExercises) {
          clearInterval(checkCache);
          resolve(cachedExercises);
        }
      }, 100);
    });
  }

  // Fetch exercises
  try {
    isFetching = true;
    const apiResults = await GymFitAPI.getAllExercises();
    cachedExercises = apiResults.map(convertGymFitToExercise);
    return cachedExercises;
  } catch (error) {
    console.error('Error fetching exercises:', error);
    return [];
  } finally {
    isFetching = false;
  }
};

export const ExerciseServiceAPI = {
  // Get all exercises (uses cache)
  getAll: async (): Promise<ExerciseAPI[]> => {
    return await getCachedExercises();
  },

  // Search by name (uses cache)
  search: async (query: string): Promise<ExerciseAPI[]> => {
    const exercises = await getCachedExercises();
    const term = query.toLowerCase();
    return exercises.filter(ex => 
      ex.name.toLowerCase().includes(term)
    );
  },

  // Get by exact name (uses cache)
  getByExactName: async (name: string): Promise<ExerciseAPI | undefined> => {
    const exercises = await getCachedExercises();
    return exercises.find(ex =>
      ex.name.toLowerCase() === name.toLowerCase()
    );
  },

  // Smart search (uses cache)
  smartSearch: async (query: string): Promise<ExerciseAPI | undefined> => {
    const exercises = await getCachedExercises();
    
    // Try exact match first
    let result = exercises.find(ex =>
      ex.name.toLowerCase() === query.toLowerCase()
    );

    // If no exact match, try fuzzy search
    if (!result) {
      const fuzzyResults = exercises.filter(ex =>
        ex.name.toLowerCase().includes(query.toLowerCase())
      );
      result = fuzzyResults.length > 0 ? fuzzyResults[0] : undefined;
    }

    return result;
  },

  // Other methods...
  getByMuscle: async (muscle: string): Promise<ExerciseAPI[]> => {
    const exercises = await getCachedExercises();
    return exercises.filter(ex =>
      ex.primaryMuscles.some(m => m.toLowerCase().includes(muscle.toLowerCase()))
    );
  },

  getByBodyPart: async (bodyPart: string): Promise<ExerciseAPI[]> => {
    try {
      const apiResults = await GymFitAPI.getExercisesByBodyPart(bodyPart);
      return apiResults.map(convertGymFitToExercise);
    } catch (error) {
      console.error('Error getting exercises by body part:', error);
      return [];
    }
  },

  getById: async (id: string): Promise<ExerciseAPI | undefined> => {
    const exercises = await getCachedExercises();
    return exercises.find(ex => ex.id === id);
  },
};