import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { workoutHandlers } from './workout.handlers.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import {
  WorkoutParamSchema,
  WorkoutExerciseParamSchema,
  WorkoutSetParamSchema,
  ExerciseParamSchema,
  StartWorkoutRequestDto,
  UpdateWorkoutRequestDto,
  FinishWorkoutRequestDto,
  AddWorkoutExerciseDto,
  AddWorkoutSetDto,
  UpdateWorkoutSetDto,
  WorkoutListQuerySchema,
  MuscleHeatmapQuerySchema,
  DateRangeQuerySchema,
} from './workout.dto.js';
import { ErrorResponseSchema } from '../auth/auth.dto.js';

export const workoutRouter = new OpenAPIHono();

// All workout endpoints require authentication
workoutRouter.use('*', authMiddleware);

// --- 1. ACTIVE WORKOUT ---
export const getActiveWorkoutRoute = createRoute({
  method: 'get',
  path: '/active',
  summary: 'Get active in-progress workout',
  description: 'Returns the currently active workout session for the user, or null if none is in progress.',
  tags: ['Workouts'],
  security: [{ BearerAuth: [] }],
  responses: {
    200: { description: 'Active workout or null' },
  },
});

// --- 2. ANALYTICS ROUTES (Static paths before /:id) ---
export const getStreaksRoute = createRoute({
  method: 'get',
  path: '/analytics/streaks',
  summary: 'Get workout streaks and aggregate statistics',
  description: 'Calculates active daily streaks, weekly consistency, total workouts, volume, and duration.',
  tags: ['Workout Analytics'],
  security: [{ BearerAuth: [] }],
  responses: {
    200: { description: 'Workout streak and summary statistics' },
  },
});

export const getActivityCalendarRoute = createRoute({
  method: 'get',
  path: '/analytics/activity-calendar',
  summary: 'Get day-wise workout activity for calendar and streak maps',
  tags: ['Workout Analytics'],
  security: [{ BearerAuth: [] }],
  request: {
    query: DateRangeQuerySchema,
  },
  responses: {
    200: { description: 'Day-by-day workout logs' },
  },
});

export const getMuscleHeatmapRoute = createRoute({
  method: 'get',
  path: '/analytics/muscle-heatmap',
  summary: 'Get muscle group engagement heatmap',
  description: 'Returns set-weighted muscle stimulation scores (1.0 primary, 0.5 secondary) across 7d, 30d, or all-time.',
  tags: ['Workout Analytics'],
  security: [{ BearerAuth: [] }],
  request: {
    query: MuscleHeatmapQuerySchema,
  },
  responses: {
    200: { description: 'Muscle engagement scores' },
  },
});

export const getExerciseHistoryRoute = createRoute({
  method: 'get',
  path: '/analytics/exercises/:exerciseId/history',
  summary: 'Get chronological history of an exercise for graphing',
  tags: ['Workout Analytics'],
  security: [{ BearerAuth: [] }],
  request: {
    params: ExerciseParamSchema,
  },
  responses: {
    200: { description: 'Chronological progression data points' },
  },
});

export const getExerciseRecordsRoute = createRoute({
  method: 'get',
  path: '/analytics/exercises/:exerciseId/records',
  summary: 'Get personal records (PRs) for an exercise',
  tags: ['Workout Analytics'],
  security: [{ BearerAuth: [] }],
  request: {
    params: ExerciseParamSchema,
  },
  responses: {
    200: { description: 'Current PR benchmarks' },
  },
});

// --- 3. WORKOUT CRUD ROUTES ---
export const startWorkoutRoute = createRoute({
  method: 'post',
  path: '/',
  summary: 'Start a new workout',
  description: 'Starts a new in-progress workout, either empty or pre-populated from an existing routine.',
  tags: ['Workouts'],
  security: [{ BearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': { schema: StartWorkoutRequestDto },
      },
    },
  },
  responses: {
    201: { description: 'Workout started successfully' },
    400: { description: 'Invalid routine or constraint error', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

export const listWorkoutsRoute = createRoute({
  method: 'get',
  path: '/',
  summary: 'List user workouts',
  tags: ['Workouts'],
  security: [{ BearerAuth: [] }],
  request: {
    query: WorkoutListQuerySchema,
  },
  responses: {
    200: { description: 'Paginated list of workouts' },
  },
});

export const getWorkoutByIdRoute = createRoute({
  method: 'get',
  path: '/:id',
  summary: 'Get workout details by ID',
  tags: ['Workouts'],
  security: [{ BearerAuth: [] }],
  request: {
    params: WorkoutParamSchema,
  },
  responses: {
    200: { description: 'Workout details with exercises and sets' },
    404: { description: 'Workout not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

export const updateWorkoutRoute = createRoute({
  method: 'patch',
  path: '/:id',
  summary: 'Update workout metadata',
  tags: ['Workouts'],
  security: [{ BearerAuth: [] }],
  request: {
    params: WorkoutParamSchema,
    body: {
      content: {
        'application/json': { schema: UpdateWorkoutRequestDto },
      },
    },
  },
  responses: {
    200: { description: 'Workout updated' },
  },
});

export const finishWorkoutRoute = createRoute({
  method: 'post',
  path: '/:id/finish',
  summary: 'Finish and complete workout',
  description: 'Marks workout as completed, calculates final volume and aggregates muscle heatmap stimulation.',
  tags: ['Workouts'],
  security: [{ BearerAuth: [] }],
  request: {
    params: WorkoutParamSchema,
    body: {
      content: {
        'application/json': { schema: FinishWorkoutRequestDto },
      },
    },
  },
  responses: {
    200: { description: 'Workout finished and scored' },
  },
});

export const discardWorkoutRoute = createRoute({
  method: 'post',
  path: '/:id/discard',
  summary: 'Discard an in-progress workout',
  tags: ['Workouts'],
  security: [{ BearerAuth: [] }],
  request: {
    params: WorkoutParamSchema,
  },
  responses: {
    200: { description: 'Workout discarded' },
  },
});

// --- 4. EXERCISES & SETS MANIPULATION ROUTES ---
export const addExerciseRoute = createRoute({
  method: 'post',
  path: '/:id/exercises',
  summary: 'Add an exercise to the active workout',
  tags: ['Workouts'],
  security: [{ BearerAuth: [] }],
  request: {
    params: WorkoutParamSchema,
    body: {
      content: {
        'application/json': { schema: AddWorkoutExerciseDto },
      },
    },
  },
  responses: {
    201: { description: 'Exercise added' },
  },
});

export const removeExerciseRoute = createRoute({
  method: 'delete',
  path: '/:id/exercises/:exerciseId',
  summary: 'Remove an exercise from the active workout',
  tags: ['Workouts'],
  security: [{ BearerAuth: [] }],
  request: {
    params: WorkoutExerciseParamSchema,
  },
  responses: {
    200: { description: 'Exercise removed' },
  },
});

export const addSetRoute = createRoute({
  method: 'post',
  path: '/:id/exercises/:exerciseId/sets',
  summary: 'Add a set to an exercise in the workout',
  tags: ['Workouts'],
  security: [{ BearerAuth: [] }],
  request: {
    params: WorkoutExerciseParamSchema,
    body: {
      content: {
        'application/json': { schema: AddWorkoutSetDto },
      },
    },
  },
  responses: {
    201: { description: 'Set added' },
  },
});

export const updateSetRoute = createRoute({
  method: 'patch',
  path: '/:id/sets/:setId',
  summary: 'Update set and evaluate PRs immediately',
  description: 'Updates reps, weight, completion status, and calculates PR records in real time.',
  tags: ['Workouts'],
  security: [{ BearerAuth: [] }],
  request: {
    params: WorkoutSetParamSchema,
    body: {
      content: {
        'application/json': { schema: UpdateWorkoutSetDto },
      },
    },
  },
  responses: {
    200: { description: 'Set updated with any newly unlocked PRs' },
  },
});

export const deleteSetRoute = createRoute({
  method: 'delete',
  path: '/:id/sets/:setId',
  summary: 'Delete a set from an exercise',
  tags: ['Workouts'],
  security: [{ BearerAuth: [] }],
  request: {
    params: WorkoutSetParamSchema,
  },
  responses: {
    200: { description: 'Set deleted' },
  },
});

// Register routes in correct order (static subpaths first)
workoutRouter.openapi(getActiveWorkoutRoute, workoutHandlers.getActive);
workoutRouter.openapi(getStreaksRoute, workoutHandlers.getStreaks);
workoutRouter.openapi(getActivityCalendarRoute, workoutHandlers.getActivityCalendar);
workoutRouter.openapi(getMuscleHeatmapRoute, workoutHandlers.getMuscleHeatmap);
workoutRouter.openapi(getExerciseHistoryRoute, workoutHandlers.getExerciseHistory);
workoutRouter.openapi(getExerciseRecordsRoute, workoutHandlers.getExerciseRecords);

workoutRouter.openapi(startWorkoutRoute, workoutHandlers.start);
workoutRouter.openapi(listWorkoutsRoute, workoutHandlers.list);
workoutRouter.openapi(getWorkoutByIdRoute, workoutHandlers.getById);
workoutRouter.openapi(updateWorkoutRoute, workoutHandlers.update);
workoutRouter.openapi(finishWorkoutRoute, workoutHandlers.finish);
workoutRouter.openapi(discardWorkoutRoute, workoutHandlers.discard);

workoutRouter.openapi(addExerciseRoute, workoutHandlers.addExercise);
workoutRouter.openapi(removeExerciseRoute, workoutHandlers.removeExercise);
workoutRouter.openapi(addSetRoute, workoutHandlers.addSet);
workoutRouter.openapi(updateSetRoute, workoutHandlers.updateSet);
workoutRouter.openapi(deleteSetRoute, workoutHandlers.deleteSet);
