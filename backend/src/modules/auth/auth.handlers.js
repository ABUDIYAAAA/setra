import { catchAsync } from '../../utils/catchAsync.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { authService } from './auth.service.js';

export const authHandlers = {
  register: catchAsync(async (c) => {
    const body = c.req.valid('json');
    const result = await authService.register(body);
    return ApiResponse.created(c, result);
  }),

  login: catchAsync(async (c) => {
    const body = c.req.valid('json');
    const result = await authService.login(body);
    return ApiResponse.success(c, result);
  }),

  refresh: catchAsync(async (c) => {
    const body = c.req.valid('json');
    const result = await authService.refreshTokens(body);
    return ApiResponse.success(c, result);
  }),

  logout: catchAsync(async (c) => {
    const body = c.req.valid('json');
    const result = await authService.logout(body);
    return ApiResponse.message(c, result.message);
  }),

  getMe: catchAsync(async (c) => {
    const userPayload = c.get('user');
    const result = await authService.getProfile(userPayload.sub);
    return ApiResponse.success(c, result);
  }),

  changePassword: catchAsync(async (c) => {
    const userPayload = c.get('user');
    const body = c.req.valid('json');
    const result = await authService.changePassword({
      userId: userPayload.sub,
      currentPassword: body.currentPassword,
      newPassword: body.newPassword,
    });
    return ApiResponse.message(c, result.message);
  }),
};
