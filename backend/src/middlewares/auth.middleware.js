import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../utils/errors.js';

export async function authMiddleware(c, next) {
  const authHeader = c.req.header('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('Authentication required. Missing Bearer token.', 401, 'UNAUTHORIZED');
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    throw new AppError('Authentication required. Missing token.', 401, 'UNAUTHORIZED');
  }

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
    c.set('user', decoded);
    await next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new AppError('Access token expired', 401, 'TOKEN_EXPIRED');
    }
    throw new AppError('Invalid access token', 401, 'INVALID_TOKEN');
  }
}
