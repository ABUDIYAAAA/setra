import { z } from '@hono/zod-openapi';

export const WorkoutParamSchema = z.object({
  id: z.string().uuid().openapi({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' }),
});

export const WorkoutExerciseParamSchema = z.object({
  id: z.string().uuid().openapi({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' }),
  exerciseId: z.string().min(1).openapi({ example: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22' }),
});

export const WorkoutSetParamSchema = z.object({
  id: z.string().uuid().openapi({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' }),
  setId: z.string().uuid().openapi({ example: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33' }),
});

export const ExerciseParamSchema = z.object({
  exerciseId: z.string().min(1).openapi({ example: 'bench-press' }),
});

export const StartWorkoutRequestDto = z
  .object({
    routineId: z.string().uuid().nullable().optional().openapi({ example: null }),
    title: z.string().max(100).optional().openapi({ example: 'Afternoon Workout' }),
  })
  .openapi('StartWorkoutRequest');

export const UpdateWorkoutRequestDto = z
  .object({
    title: z.string().min(1).max(100).optional().openapi({ example: 'Push Hypertrophy' }),
    notes: z.string().max(1000).nullable().optional().openapi({ example: 'Felt great energy today' }),
    durationSeconds: z.number().int().min(0).optional().openapi({ example: 3600 }),
  })
  .openapi('UpdateWorkoutRequest');

export const FinishWorkoutRequestDto = z
  .object({
    durationSeconds: z.number().int().min(0).optional().openapi({ example: 3450 }),
    notes: z.string().max(1000).nullable().optional(),
  })
  .openapi('FinishWorkoutRequest');

export const AddWorkoutExerciseDto = z
  .object({
    exerciseId: z.string().min(1, 'exerciseId is required').openapi({ example: 'bench-press' }),
    orderIndex: z.number().int().min(0).optional().openapi({ example: 0 }),
    restTimerSeconds: z.number().int().min(0).max(600).nullable().optional().default(null),
    notes: z.string().max(500).nullable().optional(),
  })
  .openapi('AddWorkoutExercise');

export const AddWorkoutSetDto = z
  .object({
    type: z.enum(['warmup', 'normal', 'drop', 'failure']).default('normal').openapi({ example: 'normal' }),
    weight: z.number().min(0).nullable().optional().openapi({ example: 80 }),
    weightUnit: z.enum(['kg', 'lbs']).default('kg').openapi({ example: 'kg' }),
    reps: z.number().int().min(0).nullable().optional().openapi({ example: 10 }),
    durationSeconds: z.number().int().min(0).nullable().optional().openapi({ example: null }),
    rpe: z.number().min(1).max(10).nullable().optional().openapi({ example: 8.5 }),
    isCompleted: z.boolean().default(false).openapi({ example: false }),
  })
  .openapi('AddWorkoutSet');

export const UpdateWorkoutSetDto = z
  .object({
    type: z.enum(['warmup', 'normal', 'drop', 'failure']).optional().openapi({ example: 'normal' }),
    weight: z.number().min(0).nullable().optional().openapi({ example: 100 }),
    weightUnit: z.enum(['kg', 'lbs']).optional().openapi({ example: 'kg' }),
    reps: z.number().int().min(0).nullable().optional().openapi({ example: 8 }),
    durationSeconds: z.number().int().min(0).nullable().optional(),
    rpe: z.number().min(1).max(10).nullable().optional().openapi({ example: 9 }),
    isCompleted: z.boolean().optional().openapi({ example: true }),
  })
  .openapi('UpdateWorkoutSet');

export const WorkoutListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
  offset: z.coerce.number().int().min(0).default(0).optional(),
  status: z.enum(['in_progress', 'completed', 'discarded', 'all']).default('completed').optional(),
});

export const MuscleHeatmapQuerySchema = z.object({
  period: z.enum(['7d', '30d', 'all']).default('30d').optional(),
});

export const DateRangeQuerySchema = z.object({
  days: z.coerce.number().int().min(7).max(365).default(90).optional(),
});
