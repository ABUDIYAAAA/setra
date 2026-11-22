import { apiClient } from './client';

export interface RoutineSet {
  setNumber: number;
  type: 'warmup' | 'normal' | 'drop' | 'failure';
  weight?: number | null;
  weightUnit?: 'kg' | 'lbs';
  reps?: number | null;
  repRange?: { min: number; max: number } | null;
  targetDurationSeconds?: number | null;
}

export interface HydratedRoutineExercise {
  exerciseId: string;
  name: string;
  category: string;
  bodyPart: string;
  equipment: string;
  primaryMuscles: string[];
  images?: any;
  orderIndex: number;
  restTimerSeconds?: number | null;
  notes?: string | null;
  sets: RoutineSet[];
}

export interface RoutineSummary {
  id: string;
  title: string;
  description?: string | null;
  exerciseCount: number;
  totalSetsCount: number;
  exerciseNames: string[];
  createdAt: string;
  updatedAt: string;
}

export interface RoutineDetail {
  id: string;
  userId: string;
  title: string;
  description?: string | null;
  exercises: HydratedRoutineExercise[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoutineInput {
  title: string;
  description?: string | null;
  exercises: {
    exerciseId: string;
    orderIndex?: number;
    restTimerSeconds?: number | null;
    notes?: string | null;
    sets: RoutineSet[];
  }[];
}

export const routinesApi = {
  getRoutines: async (): Promise<RoutineSummary[]> => {
    const res = await apiClient.get('/routines');
    return res.data.data;
  },

  getRoutineById: async (id: string): Promise<RoutineDetail> => {
    const res = await apiClient.get(`/routines/${id}`);
    return res.data.data;
  },

  createRoutine: async (data: CreateRoutineInput): Promise<RoutineDetail> => {
    const res = await apiClient.post('/routines', data);
    return res.data.data;
  },

  updateRoutine: async (id: string, data: Partial<CreateRoutineInput>): Promise<RoutineDetail> => {
    const res = await apiClient.put(`/routines/${id}`, data);
    return res.data.data;
  },

  duplicateRoutine: async (id: string): Promise<RoutineDetail> => {
    const res = await apiClient.post(`/routines/${id}/duplicate`);
    return res.data.data;
  },

  deleteRoutine: async (id: string): Promise<void> => {
    await apiClient.delete(`/routines/${id}`);
  },
};
