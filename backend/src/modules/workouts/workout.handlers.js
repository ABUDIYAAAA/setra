import { workoutService } from './workout.service.js';

function getUserId(c) {
  const user = c.get('user');
  return user?.sub || user?.id || c.get('userId');
}

export const workoutHandlers = {
  start: async (c) => {
    const userId = getUserId(c);
    const body = c.req.valid('json') || {};
    const workout = await workoutService.startWorkout(userId, body);
    return c.json({ data: workout }, 201);
  },

  getActive: async (c) => {
    const userId = getUserId(c);
    const active = await workoutService.getActiveWorkout(userId);
    return c.json({ data: active });
  },

  getById: async (c) => {
    const userId = getUserId(c);
    const { id } = c.req.valid('param');
    const workout = await workoutService.getWorkoutById(id, userId);
    return c.json({ data: workout });
  },

  list: async (c) => {
    const userId = getUserId(c);
    const query = c.req.valid('query') || {};
    const { items, total } = await workoutService.listWorkouts(userId, query);
    return c.json({
      data: items,
      meta: {
        total,
        limit: query.limit || 20,
        offset: query.offset || 0,
        count: items.length,
      },
    });
  },

  update: async (c) => {
    const userId = getUserId(c);
    const { id } = c.req.valid('param');
    const body = c.req.valid('json');
    const updated = await workoutService.updateWorkout(id, userId, body);
    return c.json({ data: updated });
  },

  finish: async (c) => {
    const userId = getUserId(c);
    const { id } = c.req.valid('param');
    const body = c.req.valid('json') || {};
    const finished = await workoutService.finishWorkout(userId, id, body);
    return c.json({ data: finished });
  },

  discard: async (c) => {
    const userId = getUserId(c);
    const { id } = c.req.valid('param');
    const discarded = await workoutService.discardWorkout(userId, id);
    return c.json({ data: discarded });
  },

  addExercise: async (c) => {
    const userId = getUserId(c);
    const { id } = c.req.valid('param');
    const body = c.req.valid('json');
    const added = await workoutService.addExerciseToWorkout(userId, id, body);
    return c.json({ data: added }, 201);
  },

  removeExercise: async (c) => {
    const userId = getUserId(c);
    const { id, exerciseId } = c.req.valid('param');
    await workoutService.removeExerciseFromWorkout(userId, id, exerciseId);
    return c.json({ message: 'Exercise removed from workout successfully' });
  },

  addSet: async (c) => {
    const userId = getUserId(c);
    const { id, exerciseId } = c.req.valid('param');
    const body = c.req.valid('json') || {};
    const set = await workoutService.addSetToExercise(userId, id, exerciseId, body);
    return c.json({ data: set }, 201);
  },

  updateSet: async (c) => {
    const userId = getUserId(c);
    const { id, setId } = c.req.valid('param');
    const body = c.req.valid('json');
    const result = await workoutService.updateSet(userId, id, setId, body);
    return c.json({ data: result.set, newPrs: result.newPrs });
  },

  deleteSet: async (c) => {
    const userId = getUserId(c);
    const { id, setId } = c.req.valid('param');
    await workoutService.deleteSet(userId, id, setId);
    return c.json({ message: 'Set deleted successfully' });
  },

  getStreaks: async (c) => {
    const userId = getUserId(c);
    const streaks = await workoutService.getStreaks(userId);
    return c.json({ data: streaks });
  },

  getActivityCalendar: async (c) => {
    const userId = getUserId(c);
    const query = c.req.valid('query') || {};
    const calendar = await workoutService.getActivityCalendar(userId, query);
    return c.json({ data: calendar });
  },

  getMuscleHeatmap: async (c) => {
    const userId = getUserId(c);
    const query = c.req.valid('query') || {};
    const heatmap = await workoutService.getMuscleHeatmap(userId, query);
    return c.json({ data: heatmap });
  },

  getExerciseHistory: async (c) => {
    const userId = getUserId(c);
    const { exerciseId } = c.req.valid('param');
    const history = await workoutService.getExerciseHistory(userId, exerciseId);
    return c.json({ data: history });
  },

  getExerciseRecords: async (c) => {
    const userId = getUserId(c);
    const { exerciseId } = c.req.valid('param');
    const records = await workoutService.getExerciseRecords(userId, exerciseId);
    return c.json({ data: records });
  },
};
