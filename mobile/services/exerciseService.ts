import { apiGet } from '@/lib/api';
import type {
  Exercise,
  ExerciseFilters,
  ExerciseListItem,
  ExerciseListResponse,
} from './types/exercise';

export type ExerciseQuery = {
  q?: string;
  muscle?: string;
  equipment?: string;
  limit?: number;
  offset?: number;
};

export const ExerciseService = {
  // Search / filter / paginate
  list: (query: ExerciseQuery = {}): Promise<ExerciseListResponse> => {
    return apiGet<ExerciseListResponse>('/api/exercises', query);
  },

  // Full details of one exercise (throws ApiError with status 404 if missing)
  getById: (id: string): Promise<Exercise> => {
    return apiGet<Exercise>(`/api/exercises/${encodeURIComponent(id)}`);
  },

  // Muscle and equipment lists for the filter chips
  getFilters: (): Promise<ExerciseFilters> => {
    return apiGet<ExerciseFilters>('/api/exercises/filters');
  },

  // Exact name match if there is one, otherwise the first result (null if none)
  findByName: async (name: string): Promise<ExerciseListItem | null> => {
    const { items } = await ExerciseService.list({ q: name, limit: 10 });
    const exact = items.find((item) => item.name.toLowerCase() === name.toLowerCase());
    return exact ?? items[0] ?? null;
  },
};