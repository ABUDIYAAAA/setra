import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { exerciseHandlers } from './exercise.handlers.js';
import {
  ExerciseQuerySchema,
  ExerciseListResponseSchema,
  ExerciseDetailResponseSchema,
  ExerciseFilterMetaResponseSchema,
} from './exercise.dto.js';
import { ErrorResponseSchema } from '../auth/auth.dto.js';

export const exerciseRouter = new OpenAPIHono();

const ExerciseParamSchema = z.object({
  id: z.string().min(1).openapi({ example: 'barbell-bench-press', description: 'Exercise unique ID or slug' }),
});

export const listExercisesRoute = createRoute({
  method: 'get',
  path: '/',
  summary: 'List and filter exercises',
  description:
    'Search and filter through the master exercise catalog by body part, equipment, category, difficulty, mechanics, and text search.',
  tags: ['Exercises'],
  request: {
    query: ExerciseQuerySchema,
  },
  responses: {
    200: {
      description: 'List of exercises matching filters',
      content: {
        'application/json': {
          schema: ExerciseListResponseSchema,
        },
      },
    },
  },
});

export const getFilterMetaRoute = createRoute({
  method: 'get',
  path: '/filters/meta',
  summary: 'Get available filter options',
  description: 'Returns available categories, body parts, equipment types, difficulties, mechanics, and muscle groups for frontend filter dropdowns.',
  tags: ['Exercises'],
  responses: {
    200: {
      description: 'Metadata options for exercises filtering',
      content: {
        'application/json': {
          schema: ExerciseFilterMetaResponseSchema,
        },
      },
    },
  },
});

export const getExerciseByIdRoute = createRoute({
  method: 'get',
  path: '/:id',
  summary: 'Get exercise details by ID',
  description: 'Returns full details, instructions, tips, and target muscles for a specific exercise.',
  tags: ['Exercises'],
  request: {
    params: ExerciseParamSchema,
  },
  responses: {
    200: {
      description: 'Exercise details',
      content: {
        'application/json': {
          schema: ExerciseDetailResponseSchema,
        },
      },
    },
    404: {
      description: 'Exercise not found',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

// Register routes (note: static subpath /filters/meta must precede /:id)
exerciseRouter.openapi(getFilterMetaRoute, exerciseHandlers.getFilterMeta);
exerciseRouter.openapi(listExercisesRoute, exerciseHandlers.list);
exerciseRouter.openapi(getExerciseByIdRoute, exerciseHandlers.getById);
