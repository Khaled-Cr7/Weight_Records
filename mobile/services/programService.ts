import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from '@/lib/api';
import type {
  ProgramDetail,
  ProgramListResponse,
  Routine,
  RoutineInput,
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

  create: (input: { name: string; description?: string; imageKey?: string }): Promise<ProgramDetail> => {
    return apiPost<ProgramDetail>('/api/programs', input);
  },

  update: (id: string, input: { name?: string; description?: string; imageKey?: string }): Promise<ProgramDetail> => {
    return apiPatch<ProgramDetail>(`/api/programs/${encodeURIComponent(id)}`, input);
  },

  // Deletes the program and its routines
  remove: (id: string): Promise<{ deleted: true }> => {
    return apiDelete<{ deleted: true }>(`/api/programs/${encodeURIComponent(id)}`);
  },

  // Send every routine id of the program, in the new order
  reorderRoutines: (id: string, routineIds: string[]): Promise<ProgramDetail> => {
    return apiPut<ProgramDetail>(`/api/programs/${encodeURIComponent(id)}/routines/order`, { routineIds });
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

  // Standalone, or inside one of the user's programs when programId is given
  create: (input: RoutineInput & { programId?: string }): Promise<Routine> => {
    return apiPost<Routine>('/api/routines', input);
  },

  // Saves the name and the whole list of exercises and sets
  update: (id: string, input: Partial<RoutineInput>): Promise<Routine> => {
    return apiPatch<Routine>(`/api/routines/${encodeURIComponent(id)}`, input);
  },

  remove: (id: string): Promise<{ deleted: true }> => {
    return apiDelete<{ deleted: true }>(`/api/routines/${encodeURIComponent(id)}`);
  },
};