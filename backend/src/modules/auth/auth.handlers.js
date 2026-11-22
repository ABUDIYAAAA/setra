import { catchAsync } from '../../utils/catchAsync.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { authService } from './auth.service.js';

export const authHandlers = {
  getGoogleUrl: catchAsync(async (c) => {
    const url = authService.getGoogleAuthUrl();
    return ApiResponse.success(c, { url });
  }),

  googleAuth: catchAsync(async (c) => {
    const body = c.req.valid('json');
    const result = await authService.authenticateWithGoogle(body);
    return ApiResponse.success(c, result, 'Authenticated with Google successfully');
  }),

  refresh: catchAsync(async (c) => {
    const body = c.req.valid('json');
    const result = await authService.refreshTokens(body);
    return ApiResponse.success(c, result, 'Tokens refreshed successfully');
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
};
