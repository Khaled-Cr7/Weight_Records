import { apiGet, apiPost } from '@/lib/api';
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

  // Copy a program (with all its routines) into the user's own programs
  copy: (id: string): Promise<ProgramDetail> => {
    return apiPost<ProgramDetail>(`/api/programs/${encodeURIComponent(id)}/copy`, {});
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

  // Copy a routine into the user's own routines (or into one of their programs)
  copy: (id: string, programId?: string): Promise<Routine> => {
    return apiPost<Routine>(`/api/routines/${encodeURIComponent(id)}/copy`, programId ? { programId } : {});
  },
};