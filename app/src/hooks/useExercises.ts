import { useQuery } from '@tanstack/react-query';
import { exercisesApi, ExerciseQueryParams } from '../api/exercises.api';

/**
 * TanStack Query hook with aggressive caching for exercise library.
 */
export function useExercises(params?: ExerciseQueryParams) {
  return useQuery({
    queryKey: ['exercises', params],
    queryFn: () => exercisesApi.getExercises(params),
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  });
}

/**
 * Filter metadata hook for exercise filters.
 */
export function useExerciseFilterMeta() {
  return useQuery({
    queryKey: ['exercises-filter-meta'],
    queryFn: () => exercisesApi.getFilterMetadata(),
    staleTime: 1000 * 60 * 60 * 12, // 12 hours
    gcTime: 1000 * 60 * 60 * 24,
  });
}

/**
 * Single exercise detail query.
 */
export function useExerciseDetail(id: string) {
  return useQuery({
    queryKey: ['exercise-detail', id],
    queryFn: () => exercisesApi.getExerciseById(id),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}
