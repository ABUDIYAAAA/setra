import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { routinesApi, CreateRoutineInput } from '../api/routines.api';

export const ROUTINES_QUERY_KEY = ['routines'];

export function useRoutines() {
  return useQuery({
    queryKey: ROUTINES_QUERY_KEY,
    queryFn: () => routinesApi.getRoutines(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useRoutineDetail(id: string | undefined) {
  return useQuery({
    queryKey: [...ROUTINES_QUERY_KEY, id],
    queryFn: () => (id ? routinesApi.getRoutineById(id) : Promise.reject('No ID')),
    enabled: Boolean(id),
  });
}

export function useCreateRoutine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRoutineInput) => routinesApi.createRoutine(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROUTINES_QUERY_KEY });
    },
  });
}

export function useDuplicateRoutine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => routinesApi.duplicateRoutine(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROUTINES_QUERY_KEY });
    },
  });
}

export function useDeleteRoutine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => routinesApi.deleteRoutine(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROUTINES_QUERY_KEY });
    },
  });
}
