import { catchAsync } from '../../utils/catchAsync.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { routineService } from './routine.service.js';

export const routineHandlers = {
  create: catchAsync(async (c) => {
    const user = c.get('user');
    const body = c.req.valid('json');
    const routine = await routineService.createRoutine({
      userId: user.sub,
      ...body,
    });
    return ApiResponse.created(c, routine, 'Routine created successfully');
  }),

  list: catchAsync(async (c) => {
    const user = c.get('user');
    const routines = await routineService.getUserRoutines(user.sub);
    return ApiResponse.success(c, routines);
  }),

  getById: catchAsync(async (c) => {
    const user = c.get('user');
    const { id } = c.req.valid('param');
    const routine = await routineService.getRoutineById(id, user.sub);
    return ApiResponse.success(c, routine);
  }),

  update: catchAsync(async (c) => {
    const user = c.get('user');
    const { id } = c.req.valid('param');
    const body = c.req.valid('json');
    const routine = await routineService.updateRoutine({
      routineId: id,
      userId: user.sub,
      ...body,
    });
    return ApiResponse.success(c, routine, 'Routine updated successfully');
  }),

  delete: catchAsync(async (c) => {
    const user = c.get('user');
    const { id } = c.req.valid('param');
    const result = await routineService.deleteRoutine(id, user.sub);
    return ApiResponse.message(c, result.message);
  }),

  duplicate: catchAsync(async (c) => {
    const user = c.get('user');
    const { id } = c.req.valid('param');
    const routine = await routineService.duplicateRoutine(id, user.sub);
    return ApiResponse.created(c, routine, 'Routine duplicated successfully');
  }),
};
