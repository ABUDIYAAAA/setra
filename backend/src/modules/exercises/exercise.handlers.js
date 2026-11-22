import { catchAsync } from '../../utils/catchAsync.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { exerciseService } from './exercise.service.js';

export const exerciseHandlers = {
  list: catchAsync(async (c) => {
    const query = c.req.valid('query');
    const result = await exerciseService.getExercises(query);
    return c.json(
      {
        success: true,
        data: result.items,
        meta: result.meta,
      },
      200
    );
  }),

  getById: catchAsync(async (c) => {
    const { id } = c.req.valid('param');
    const exercise = await exerciseService.getExerciseById(id);
    return ApiResponse.success(c, exercise);
  }),

  getFilterMeta: catchAsync(async (c) => {
    const meta = await exerciseService.getFilterMetadata();
    return ApiResponse.success(c, meta);
  }),
};
