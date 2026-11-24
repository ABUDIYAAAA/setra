import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  workoutsApi,
  WorkoutDetail,
  StartWorkoutParams,
  FinishWorkoutParams,
  AddExerciseParams,
  AddSetParams,
  UpdateSetParams,
} from '../api/workouts.api';

export function useActiveWorkout() {
  return useQuery<WorkoutDetail | null>({
    queryKey: ['active-workout'],
    queryFn: () => workoutsApi.getActive(),
    staleTime: 1000 * 5, // 5 seconds
    refetchOnWindowFocus: true,
  });
}

export function useWorkoutsList(params?: { limit?: number; offset?: number; status?: string }) {
  return useQuery({
    queryKey: ['workouts', params],
    queryFn: () => workoutsApi.list(params),
    staleTime: 1000 * 60 * 5,
  });
}

export function useWorkoutStreaks() {
  return useQuery({
    queryKey: ['workout-streaks'],
    queryFn: () => workoutsApi.getStreaks(),
    staleTime: 1000 * 60 * 10,
  });
}

export function useWorkoutDetail(id: string) {
  return useQuery<WorkoutDetail>({
    queryKey: ['workout', id],
    queryFn: () => workoutsApi.getById(id),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 5,
  });
}

export function useStartWorkout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params?: StartWorkoutParams) => workoutsApi.start(params),
    onSuccess: (data) => {
      queryClient.setQueryData(['active-workout'], data);
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    },
  });
}

export function useFinishWorkout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, params }: { id: string; params?: FinishWorkoutParams }) =>
      workoutsApi.finish(id, params),
    onSuccess: () => {
      queryClient.setQueryData(['active-workout'], null);
      queryClient.invalidateQueries({ queryKey: ['active-workout'] });
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      queryClient.invalidateQueries({ queryKey: ['workout-streaks'] });
    },
  });
}

export function useDiscardWorkout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => workoutsApi.discard(id),
    onSuccess: () => {
      queryClient.setQueryData(['active-workout'], null);
      queryClient.invalidateQueries({ queryKey: ['active-workout'] });
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    },
  });
}

export function useAddWorkoutExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ workoutId, params }: { workoutId: string; params: AddExerciseParams }) =>
      workoutsApi.addExercise(workoutId, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-workout'] });
    },
  });
}

export function useRemoveWorkoutExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ workoutId, exerciseId }: { workoutId: string; exerciseId: string }) =>
      workoutsApi.removeExercise(workoutId, exerciseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-workout'] });
    },
  });
}

export function useAddWorkoutSet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      workoutId,
      exerciseId,
      params,
    }: {
      workoutId: string;
      exerciseId: string;
      params?: AddSetParams;
    }) => workoutsApi.addSet(workoutId, exerciseId, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-workout'] });
    },
  });
}

export function useUpdateWorkoutSet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      workoutId,
      setId,
      params,
    }: {
      workoutId: string;
      setId: string;
      params: UpdateSetParams;
    }) => workoutsApi.updateSet(workoutId, setId, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-workout'] });
    },
  });
}

export function useDeleteWorkoutSet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ workoutId, setId }: { workoutId: string; setId: string }) =>
      workoutsApi.deleteSet(workoutId, setId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-workout'] });
    },
  });
}
