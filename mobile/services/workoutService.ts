import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api';
import type { RepMode, SetType } from './types/program';
import type {
  Workout,
  WorkoutListItem,
  WorkoutSetCore,
  WorkoutSummary,
} from './types/workout';

const enc = encodeURIComponent;

export const WorkoutService = {
  // The workout in progress, or null
  active: async (): Promise<Workout | null> => {
    const { workout } = await apiGet<{ workout: Workout | null }>('/api/workouts/active');
    return workout;
  },

  // Start an empty workout, or one from one of the user's own routines
  start: (routineId?: string): Promise<Workout> => {
    return apiPost<Workout>('/api/workouts', routineId ? { routineId } : {});
  },

  getById: (id: string): Promise<Workout> => {
    return apiGet<Workout>(`/api/workouts/${enc(id)}`);
  },

  // Finished workouts, newest first
  history: (limit = 20, offset = 0): Promise<{ total: number; items: WorkoutListItem[] }> => {
    return apiGet<{ total: number; items: WorkoutListItem[] }>('/api/workouts', { limit, offset });
  },

  // Rename the workout or change its note
  update: (id: string, input: { name?: string; notes?: string | null }): Promise<Workout> => {
    return apiPatch<Workout>(`/api/workouts/${enc(id)}`, input);
  },

  // Deletes a workout for good (finished or not)
  remove: (id: string): Promise<{ deleted: true }> => {
    return apiDelete<{ deleted: true }>(`/api/workouts/${enc(id)}`);
  },

  addExercise: (id: string, exerciseId: string): Promise<Workout> => {
    return apiPost<Workout>(`/api/workouts/${enc(id)}/exercises`, { exerciseId });
  },

  updateExercise: (id: string, exerciseId: string, input: { restSeconds?: number; notes?: string | null }): Promise<Workout> => {
    return apiPatch<Workout>(`/api/workouts/${enc(id)}/exercises/${enc(exerciseId)}`, input);
  },

  removeExercise: (id: string, exerciseId: string): Promise<Workout> => {
    return apiDelete<Workout>(`/api/workouts/${enc(id)}/exercises/${enc(exerciseId)}`);
  },

  addSet: (id: string, exerciseId: string, setType?: SetType): Promise<Workout> => {
    return apiPost<Workout>(`/api/workouts/${enc(id)}/exercises/${enc(exerciseId)}/sets`, setType ? { setType } : {});
  },

  updateSet: (
    id: string,
    setId: string,
    input: {
      weightKg?: number | null;
      reps?: number | null;
      isCompleted?: boolean;
      setType?: SetType;
      repMode?: RepMode;
      targetRepsMin?: number | null;
      targetRepsMax?: number | null;
    },
  ): Promise<WorkoutSetCore> => {
    return apiPatch<WorkoutSetCore>(`/api/workouts/${enc(id)}/sets/${enc(setId)}`, input);
  },

  removeSet: (id: string, setId: string): Promise<Workout> => {
    return apiDelete<Workout>(`/api/workouts/${enc(id)}/sets/${enc(setId)}`);
  },

  // Saves the workout; updateRoutine copies the new weights and reps into its routine
  finish: (id: string, updateRoutine: boolean): Promise<{ workout: Workout; summary: WorkoutSummary }> => {
    return apiPost<{ workout: Workout; summary: WorkoutSummary }>(`/api/workouts/${enc(id)}/finish`, { updateRoutine });
  },
};