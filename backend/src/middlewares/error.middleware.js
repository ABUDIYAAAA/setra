import { AppError } from '../utils/errors.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ZodError } from 'zod';

export function errorHandler(err, c) {
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      console.error('[Internal AppError]:', err);
    }
    return ApiResponse.error(c, {
      message: err.message,
      code: err.code,
      details: err.details,
      statusCode: err.statusCode,
    });
  }

  if (err instanceof ZodError) {
    return ApiResponse.error(c, {
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: err.issues,
      statusCode: 400,
    });
  }

  console.error('[Unhandled Error]:', err);

  const statusCode = err.status || 500;
  return ApiResponse.error(c, {
    message: err.message || 'Internal Server Error',
    code: 'INTERNAL_SERVER_ERROR',
    statusCode,
  });
}
