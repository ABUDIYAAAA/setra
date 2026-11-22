import { z } from '@hono/zod-openapi';

export const RepRangeSchema = z
  .object({
    min: z.number().int().min(1, 'Min reps must be at least 1').openapi({ example: 8 }),
    max: z.number().int().min(1, 'Max reps must be at least 1').openapi({ example: 12 }),
  })
  .refine((data) => data.max >= data.min, {
    message: 'Max reps must be greater than or equal to min reps',
  })
  .openapi('RepRange');

export const RoutineSetDto = z
  .object({
    setNumber: z.number().int().min(1).openapi({ example: 1 }),
    type: z.enum(['warmup', 'normal', 'drop', 'failure']).default('normal').openapi({ example: 'normal' }),
    weight: z.number().min(0).nullable().optional().openapi({ example: 80.0, description: 'Target weight' }),
    weightUnit: z.enum(['kg', 'lbs']).default('kg').openapi({ example: 'kg' }),
    reps: z.number().int().min(1).nullable().optional().openapi({ example: 10, description: 'Target exact reps' }),
    repRange: RepRangeSchema.nullable().optional().openapi({ description: 'Target rep range (e.g. 8-12 reps)' }),
    targetDurationSeconds: z
      .number()
      .int()
      .min(1)
      .nullable()
      .optional()
      .openapi({ example: 60, description: 'Duration timer in seconds for cardio or timed holds' }),
  })
  .openapi('RoutineSet');

export const RoutineExerciseInputDto = z
  .object({
    exerciseId: z.string().min(1, 'exerciseId is required').openapi({ example: 'barbell-bench-press' }),
    orderIndex: z.number().int().min(0).openapi({ example: 0 }),
    restTimerSeconds: z
      .number()
      .int()
      .min(0, 'Rest timer must be at least 0 seconds')
      .max(600, 'Rest timer cannot exceed 600 seconds (10 minutes)')
      .nullable()
      .optional()
      .default(null)
      .openapi({ example: null, description: 'Deactivated by default (null). Accepts 0 to 600 seconds' }),
    notes: z.string().max(500).nullable().optional().openapi({ example: 'Focus on slow eccentric tempo' }),
    sets: z
      .array(RoutineSetDto)
      .min(1, 'Every exercise must have at least 1 set')
      .max(20, 'Maximum of 20 sets per exercise')
      .openapi({ description: 'List of target sets for this exercise' }),
  })
  .openapi('RoutineExerciseInput');

export const CreateRoutineRequestDto = z
  .object({
    title: z.string().min(1, 'Title is required').max(100, 'Title max 100 characters').openapi({ example: 'Push Day A' }),
    description: z.string().max(500).nullable().optional().openapi({ example: 'Chest, shoulders, and triceps hypertrophy focus' }),
    exercises: z
      .array(RoutineExerciseInputDto)
      .min(1, 'Routine must contain at least 1 exercise')
      .max(30, 'Routine cannot exceed 30 exercises')
      .openapi({ description: 'Ordered list of exercises in routine' }),
  })
  .openapi('CreateRoutineRequest');

export const UpdateRoutineRequestDto = z
  .object({
    title: z.string().min(1).max(100).optional().openapi({ example: 'Push Day A (Updated)' }),
    description: z.string().max(500).nullable().optional(),
    exercises: z.array(RoutineExerciseInputDto).min(1).max(30).optional(),
  })
  .openapi('UpdateRoutineRequest');

// Response schemas
export const HydratedExerciseDetailSchema = z
  .object({
    exerciseId: z.string().openapi({ example: 'barbell-bench-press' }),
    name: z.string().openapi({ example: 'Barbell Bench Press' }),
    category: z.string().openapi({ example: 'strength' }),
    bodyPart: z.string().openapi({ example: 'chest' }),
    equipment: z.string().openapi({ example: 'barbell' }),
    primaryMuscles: z.array(z.string()).openapi({ example: ['chest'] }),
    images: z.any().nullable().optional(),
    orderIndex: z.number().int().openapi({ example: 0 }),
    restTimerSeconds: z.number().int().nullable().optional().openapi({ example: null }),
    notes: z.string().nullable().optional(),
    sets: z.array(RoutineSetDto),
  })
  .openapi('HydratedRoutineExercise');

export const RoutineDetailDto = z
  .object({
    id: z.string().uuid().openapi({ example: '123e4567-e89b-12d3-a456-426614174000' }),
    userId: z.string().uuid().openapi({ example: '123e4567-e89b-12d3-a456-426614174000' }),
    title: z.string().openapi({ example: 'Push Day A' }),
    description: z.string().nullable().optional(),
    exercises: z.array(HydratedExerciseDetailSchema),
    createdAt: z.string().openapi({ example: '2026-11-22T14:00:00.000Z' }),
    updatedAt: z.string().openapi({ example: '2026-11-22T14:00:00.000Z' }),
  })
  .openapi('RoutineDetail');

export const RoutineSummaryDto = z
  .object({
    id: z.string().uuid().openapi({ example: '123e4567-e89b-12d3-a456-426614174000' }),
    title: z.string().openapi({ example: 'Push Day A' }),
    description: z.string().nullable().optional(),
    exerciseCount: z.number().int().openapi({ example: 4 }),
    totalSetsCount: z.number().int().openapi({ example: 12 }),
    exerciseNames: z.array(z.string()).openapi({ example: ['Barbell Bench Press', 'Incline Dumbbell Press'] }),
    createdAt: z.string().openapi({ example: '2026-11-22T14:00:00.000Z' }),
    updatedAt: z.string().openapi({ example: '2026-11-22T14:00:00.000Z' }),
  })
  .openapi('RoutineSummary');

export const RoutineDetailResponseDto = z
  .object({
    success: z.boolean().openapi({ example: true }),
    data: RoutineDetailDto,
  })
  .openapi('RoutineDetailResponse');

export const RoutineListResponseDto = z
  .object({
    success: z.boolean().openapi({ example: true }),
    data: z.array(RoutineSummaryDto),
  })
  .openapi('RoutineListResponse');
