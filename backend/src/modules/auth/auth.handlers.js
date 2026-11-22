import { authService } from './auth.service.js';

export const authHandlers = {
  async register(c) {
    const body = c.req.valid('json');
    const result = await authService.register(body);
    return c.json({ success: true, data: result }, 201);
  },

  async login(c) {
    const body = c.req.valid('json');
    const result = await authService.login(body);
    return c.json({ success: true, data: result }, 200);
  },

  async refresh(c) {
    const body = c.req.valid('json');
    const result = await authService.refreshTokens(body);
    return c.json({ success: true, data: result }, 200);
  },

  async logout(c) {
    const body = c.req.valid('json');
    const result = await authService.logout(body);
    return c.json({ success: true, message: result.message }, 200);
  },

  async getMe(c) {
    const userPayload = c.get('user');
    const result = await authService.getProfile(userPayload.sub);
    return c.json({ success: true, data: result }, 200);
  },

  async changePassword(c) {
    const userPayload = c.get('user');
    const body = c.req.valid('json');
    const result = await authService.changePassword({
      userId: userPayload.sub,
      currentPassword: body.currentPassword,
      newPassword: body.newPassword,
    });
    return c.json({ success: true, message: result.message }, 200);
  },
};
