import { apiClient } from './client';

export interface WorkoutSet {
  id: string;
  workoutExerciseId: string;
  setNumber: number;
  type: 'warmup' | 'normal' | 'drop' | 'failure';
  weight: string | number | null;
  weightUnit: 'kg' | 'lbs';
  reps: number | null;
  durationSeconds?: number | null;
  rpe?: string | number | null;
  isCompleted: boolean;
  completedAt?: string | null;
  estimated1rmKg?: string | number | null;
  isPr?: boolean;
  prTypes?: string[];
}

export interface WorkoutExercise {
  id: string;
  workoutId: string;
  exerciseId: string;
  orderIndex: number;
  restTimerSeconds?: number | null;
  notes?: string | null;
  sets: WorkoutSet[];
}

export interface WorkoutDetail {
  id: string;
  userId: string;
  routineId?: string | null;
  title: string;
  status: 'in_progress' | 'completed' | 'discarded';
  startedAt: string;
  completedAt?: string | null;
  durationSeconds?: number;
  notes?: string | null;
  totalVolumeKg?: string | number;
  totalSetsCompleted?: number;
  muscleScores?: Record<string, number>;
  exercises: WorkoutExercise[];
}

export interface StartWorkoutParams {
  routineId?: string | null;
  title?: string;
}

export interface FinishWorkoutParams {
  durationSeconds?: number;
  notes?: string;
}

export interface AddExerciseParams {
  exerciseId: string;
  orderIndex?: number;
  restTimerSeconds?: number | null;
  notes?: string;
}

export interface AddSetParams {
  type?: 'warmup' | 'normal' | 'drop' | 'failure';
  weight?: number | null;
  weightUnit?: 'kg' | 'lbs';
  reps?: number | null;
  durationSeconds?: number | null;
  rpe?: number | null;
}

export interface UpdateSetParams {
  type?: 'warmup' | 'normal' | 'drop' | 'failure';
  weight?: number | null;
  weightUnit?: 'kg' | 'lbs';
  reps?: number | null;
  durationSeconds?: number | null;
  rpe?: number | null;
  isCompleted?: boolean;
}

export interface StreakStats {
  currentDayStreak: number;
  bestDayStreak: number;
  currentWeekStreak: number;
  totalWorkouts: number;
  totalVolumeKg: number;
  totalDurationSeconds: number;
}

export const workoutsApi = {
  getActive: async (): Promise<WorkoutDetail | null> => {
    const res = await apiClient.get('/workouts/active');
    return res.data.data;
  },

  getById: async (id: string): Promise<WorkoutDetail> => {
    const res = await apiClient.get(`/workouts/${id}`);
    return res.data.data;
  },

  list: async (params?: { limit?: number; offset?: number; status?: string }): Promise<WorkoutDetail[]> => {
    const res = await apiClient.get('/workouts', { params });
    return res.data.data;
  },

  start: async (params?: StartWorkoutParams): Promise<WorkoutDetail> => {
    const res = await apiClient.post('/workouts', params || {});
    return res.data.data;
  },

  finish: async (id: string, params?: FinishWorkoutParams): Promise<WorkoutDetail> => {
    const res = await apiClient.post(`/workouts/${id}/finish`, params || {});
    return res.data.data;
  },

  discard: async (id: string): Promise<void> => {
    await apiClient.post(`/workouts/${id}/discard`);
  },

  addExercise: async (id: string, params: AddExerciseParams): Promise<WorkoutExercise> => {
    const res = await apiClient.post(`/workouts/${id}/exercises`, params);
    return res.data.data;
  },

  removeExercise: async (id: string, exerciseId: string): Promise<void> => {
    await apiClient.delete(`/workouts/${id}/exercises/${exerciseId}`);
  },

  addSet: async (id: string, exerciseId: string, params?: AddSetParams): Promise<WorkoutSet> => {
    const res = await apiClient.post(`/workouts/${id}/exercises/${exerciseId}/sets`, params || {});
    return res.data.data;
  },

  updateSet: async (
    id: string,
    setId: string,
    params: UpdateSetParams
  ): Promise<{ set: WorkoutSet; newPrs: string[] }> => {
    const res = await apiClient.patch(`/workouts/${id}/sets/${setId}`, params);
    return { set: res.data.data, newPrs: res.data.newPrs || [] };
  },

  deleteSet: async (id: string, setId: string): Promise<void> => {
    await apiClient.delete(`/workouts/${id}/sets/${setId}`);
  },

  getStreaks: async (): Promise<StreakStats> => {
    const res = await apiClient.get('/workouts/analytics/streaks');
    return res.data.data;
  },
};
