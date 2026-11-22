import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { routineHandlers } from './routine.handlers.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import {
  CreateRoutineRequestDto,
  UpdateRoutineRequestDto,
  RoutineDetailResponseDto,
  RoutineListResponseDto,
} from './routine.dto.js';
import { MessageResponseSchema, ErrorResponseSchema } from '../auth/auth.dto.js';

export const routineRouter = new OpenAPIHono();

// All routine endpoints require authentication
routineRouter.use('*', authMiddleware);

const RoutineIdParamSchema = z.object({
  id: z.string().uuid().openapi({ description: 'Routine UUID identifier', example: '123e4567-e89b-12d3-a456-426614174000' }),
});

export const createRoutineRoute = createRoute({
  method: 'post',
  path: '/',
  summary: 'Create a new routine',
  description: 'Creates a workout routine with structured exercises and sets.',
  tags: ['Routines'],
  security: [{ BearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateRoutineRequestDto,
        },
      },
      required: true,
    },
  },
  responses: {
    201: {
      description: 'Routine created successfully',
      content: {
        'application/json': {
          schema: RoutineDetailResponseDto,
        },
      },
    },
    400: {
      description: 'Validation error or invalid exercise ID',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

export const listRoutinesRoute = createRoute({
  method: 'get',
  path: '/',
  summary: 'List user routines',
  description: 'Returns all routines belonging to the authenticated user with exercise summary counts and names.',
  tags: ['Routines'],
  security: [{ BearerAuth: [] }],
  responses: {
    200: {
      description: 'List of user routines',
      content: {
        'application/json': {
          schema: RoutineListResponseDto,
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

export const getRoutineByIdRoute = createRoute({
  method: 'get',
  path: '/{id}',
  summary: 'Get routine by ID',
  description: 'Returns full routine details hydrated with complete exercise catalog metadata.',
  tags: ['Routines'],
  security: [{ BearerAuth: [] }],
  request: {
    params: RoutineIdParamSchema,
  },
  responses: {
    200: {
      description: 'Hydrated routine details',
      content: {
        'application/json': {
          schema: RoutineDetailResponseDto,
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
    404: {
      description: 'Routine not found',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

export const updateRoutineRoute = createRoute({
  method: 'put',
  path: '/{id}',
  summary: 'Update routine',
  description: 'Updates a routine title, description, or replaces exercises and sets.',
  tags: ['Routines'],
  security: [{ BearerAuth: [] }],
  request: {
    params: RoutineIdParamSchema,
    body: {
      content: {
        'application/json': {
          schema: UpdateRoutineRequestDto,
        },
      },
      required: true,
    },
  },
  responses: {
    200: {
      description: 'Routine updated successfully',
      content: {
        'application/json': {
          schema: RoutineDetailResponseDto,
        },
      },
    },
    400: {
      description: 'Validation error or invalid exercise ID',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
    404: {
      description: 'Routine not found',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

export const deleteRoutineRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  summary: 'Delete routine',
  description: 'Permanently deletes a routine and cascades to all its assigned exercises.',
  tags: ['Routines'],
  security: [{ BearerAuth: [] }],
  request: {
    params: RoutineIdParamSchema,
  },
  responses: {
    200: {
      description: 'Routine deleted successfully',
      content: {
        'application/json': {
          schema: MessageResponseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
    404: {
      description: 'Routine not found',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

export const duplicateRoutineRoute = createRoute({
  method: 'post',
  path: '/{id}/duplicate',
  summary: 'Duplicate routine',
  description: 'Duplicates an existing routine with a new UUID and "(Copy)" appended to its title.',
  tags: ['Routines'],
  security: [{ BearerAuth: [] }],
  request: {
    params: RoutineIdParamSchema,
  },
  responses: {
    201: {
      description: 'Routine duplicated successfully',
      content: {
        'application/json': {
          schema: RoutineDetailResponseDto,
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
    404: {
      description: 'Routine not found',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

// Bind route handlers
routineRouter.openapi(createRoutineRoute, routineHandlers.create);
routineRouter.openapi(listRoutinesRoute, routineHandlers.list);
routineRouter.openapi(getRoutineByIdRoute, routineHandlers.getById);
routineRouter.openapi(updateRoutineRoute, routineHandlers.update);
routineRouter.openapi(deleteRoutineRoute, routineHandlers.delete);
routineRouter.openapi(duplicateRoutineRoute, routineHandlers.duplicate);
