import { z } from '@hono/zod-openapi';

export const ExerciseDto = z
  .object({
    id: z.string().openapi({ example: 'barbell-bench-press' }),
    name: z.string().openapi({ example: 'Barbell Bench Press' }),
    description: z.string().nullable().optional().openapi({ example: 'Classic chest exercise...' }),
    category: z.string().openapi({ example: 'strength' }),
    bodyPart: z.string().openapi({ example: 'chest' }),
    equipment: z.string().openapi({ example: 'barbell' }),
    forceType: z.string().nullable().optional().openapi({ example: 'push' }),
    mechanic: z.string().nullable().optional().openapi({ example: 'compound' }),
    difficulty: z.string().openapi({ example: 'intermediate' }),
    primaryMuscles: z.array(z.string()).openapi({ example: ['chest'] }),
    secondaryMuscles: z.array(z.string()).openapi({ example: ['triceps', 'front_deltoid'] }),
    instructions: z.array(z.string()).openapi({ example: ['Lie flat on the bench...', 'Unrack the barbell...'] }),
    tips: z.array(z.string()).openapi({ example: ['Keep your shoulder blades pinched together.'] }),
    tags: z.array(z.string()).openapi({ example: ['chest', 'strength', 'push'] }),
    isUnilateral: z.boolean().openapi({ example: false }),
    isBodyweight: z.boolean().openapi({ example: false }),
    images: z.any().nullable().optional(),
    createdAt: z.string().or(z.date()).optional(),
    updatedAt: z.string().or(z.date()).optional(),
  })
  .openapi('Exercise');

export const ExerciseQuerySchema = z.object({
  search: z.string().optional().openapi({ description: 'Search exercise name or tags', example: 'bench' }),
  category: z.string().optional().openapi({ description: 'Filter by category', example: 'strength' }),
  bodyPart: z.string().optional().openapi({ description: 'Filter by target body part', example: 'chest' }),
  equipment: z.string().optional().openapi({ description: 'Filter by equipment', example: 'barbell' }),
  difficulty: z.string().optional().openapi({ description: 'Filter by difficulty level', example: 'intermediate' }),
  mechanic: z.string().optional().openapi({ description: 'Filter by mechanics (compound | isolation)', example: 'compound' }),
  isBodyweight: z.string().optional().openapi({ description: 'Filter bodyweight only (true/false)', example: 'false' }),
  limit: z.coerce.number().min(1).max(200).default(50).openapi({ description: 'Limit number of results', example: 50 }),
  offset: z.coerce.number().min(0).default(0).openapi({ description: 'Offset results', example: 0 }),
});

export const ExerciseListResponseSchema = z
  .object({
    success: z.boolean().openapi({ example: true }),
    data: z.array(ExerciseDto),
    meta: z.object({
      total: z.number().openapi({ example: 708 }),
      limit: z.number().openapi({ example: 50 }),
      offset: z.number().openapi({ example: 0 }),
      count: z.number().openapi({ example: 50 }),
    }),
  })
  .openapi('ExerciseListResponse');

export const ExerciseDetailResponseSchema = z
  .object({
    success: z.boolean().openapi({ example: true }),
    data: ExerciseDto,
  })
  .openapi('ExerciseDetailResponse');

export const ExerciseFilterMetaResponseSchema = z
  .object({
    success: z.boolean().openapi({ example: true }),
    data: z.object({
      categories: z.array(z.string()),
      bodyParts: z.array(z.string()),
      equipments: z.array(z.string()),
      difficulties: z.array(z.string()),
      mechanics: z.array(z.string()),
      primaryMuscles: z.array(z.string()),
    }),
  })
  .openapi('ExerciseFilterMetaResponse');
