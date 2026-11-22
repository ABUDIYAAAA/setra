import { apiClient } from './client';

export interface Exercise {
  id: string;
  name: string;
  description?: string | null;
  category: string;
  bodyPart: string;
  equipment: string;
  forceType?: string | null;
  mechanic?: string | null;
  difficulty: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  tips: string[];
  tags: string[];
  isUnilateral: boolean;
  isBodyweight: boolean;
  images?: any;
}

export interface ExerciseQueryParams {
  search?: string;
  category?: string;
  bodyPart?: string;
  equipment?: string;
  difficulty?: string;
  mechanic?: string;
  isBodyweight?: boolean;
  limit?: number;
  offset?: number;
}

export interface ExerciseListResponse {
  data: Exercise[];
  meta: {
    total: number;
    limit: number;
    offset: number;
    count: number;
  };
}

export interface ExerciseFilterMeta {
  categories: string[];
  bodyParts: string[];
  equipments: string[];
  difficulties: string[];
  mechanics: string[];
  primaryMuscles: string[];
}

export const exercisesApi = {
  getExercises: async (params?: ExerciseQueryParams): Promise<ExerciseListResponse> => {
    const res = await apiClient.get('/exercises', { params });
    return res.data;
  },

  getExerciseById: async (id: string): Promise<Exercise> => {
    const res = await apiClient.get(`/exercises/${id}`);
    return res.data.data;
  },

  getFilterMetadata: async (): Promise<ExerciseFilterMeta> => {
    const res = await apiClient.get('/exercises/filters/meta');
    return res.data.data;
  },
};
