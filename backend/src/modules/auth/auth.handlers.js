import { catchAsync } from '../../utils/catchAsync.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { authService } from './auth.service.js';

export const authHandlers = {
  getGoogleUrl: catchAsync(async (c) => {
    const state = c.req.query('state');
    const url = authService.getGoogleAuthUrl(state);
    return ApiResponse.success(c, { url });
  }),

  googleCallback: catchAsync(async (c) => {
    const code = c.req.query('code');
    const state = c.req.query('state');
    const error = c.req.query('error');

    // Decode target deep link provided in state parameter, or fallback to default scheme
    let targetDeepLink = state ? decodeURIComponent(state) : 'app://auth/callback';

    if (error || !code) {
      const errorMsg = error || 'Authorization code missing';
      const redirectWithErr = `${targetDeepLink}${targetDeepLink.includes('?') ? '&' : '?'}error=${encodeURIComponent(errorMsg)}`;
      return c.redirect(redirectWithErr, 302);
    }

    try {
      const result = await authService.authenticateWithGoogle({ code });
      const separator = targetDeepLink.includes('?') ? '&' : '?';
      const redirectWithTokens = `${targetDeepLink}${separator}accessToken=${encodeURIComponent(
        result.accessToken
      )}&refreshToken=${encodeURIComponent(result.refreshToken)}`;

      return c.redirect(redirectWithTokens, 302);
    } catch (authErr) {
      console.error('Callback authentication error:', authErr);
      const redirectWithErr = `${targetDeepLink}${targetDeepLink.includes('?') ? '&' : '?'}error=${encodeURIComponent(
        authErr.message || 'Authentication failed'
      )}`;
      return c.redirect(redirectWithErr, 302);
    }
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
