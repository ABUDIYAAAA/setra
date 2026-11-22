import { AppError } from '../utils/errors.js';
import { ZodError } from 'zod';

export function errorHandler(err, c) {
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      console.error('[Internal AppError]:', err);
    }
    return c.json(
      {
        success: false,
        error: {
          message: err.message,
          code: err.code,
          details: err.details,
        },
      },
      err.statusCode
    );
  }

  if (err instanceof ZodError) {
    return c.json(
      {
        success: false,
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: err.issues,
        },
      },
      400
    );
  }

  console.error('[Unhandled Error]:', err);

  const statusCode = err.status || 500;
  return c.json(
    {
      success: false,
      error: {
        message: err.message || 'Internal Server Error',
        code: 'INTERNAL_SERVER_ERROR',
      },
    },
    statusCode
  );
}
