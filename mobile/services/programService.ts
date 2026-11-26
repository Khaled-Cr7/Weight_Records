import { apiGet } from '@/lib/api';
import type {
  ProgramDetail,
  ProgramListResponse,
  Routine,
  RoutineSummary,
} from './types/program';

export const ProgramService = {
  // Ready-made programs and the user's own
  list: (): Promise<ProgramListResponse> => {
    return apiGet<ProgramListResponse>('/api/programs');
  },

  // One program with all its routines, exercises and sets
  getById: (id: string): Promise<ProgramDetail> => {
    return apiGet<ProgramDetail>(`/api/programs/${encodeURIComponent(id)}`);
  },
};

export const RoutineService = {
  // The user's own routines that are not inside a program
  list: async (): Promise<RoutineSummary[]> => {
    const { routines } = await apiGet<{ routines: RoutineSummary[] }>('/api/routines');
    return routines;
  },

  getById: (id: string): Promise<Routine> => {
    return apiGet<Routine>(`/api/routines/${encodeURIComponent(id)}`);
  },
};