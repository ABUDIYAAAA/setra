import { errorHandler } from '../middlewares/error.middleware.js';

/**
 * Higher-order try-catch wrapper for async route handlers.
 * Catches any unhandled rejections or thrown errors and forwards them
 * directly to the standardized error handler.
 *
 * @param {Function} fn - Async handler function (c, next) => Promise<Response>
 * @returns {Function} Wrapped handler with guaranteed error catching
 */
export const catchAsync = (fn) => {
  return async (c, next) => {
    try {
      return await fn(c, next);
    } catch (error) {
      return errorHandler(error, c);
    }
  };
};
