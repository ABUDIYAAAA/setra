/**
 * Standardized API Response utilities for consistent HTTP responses.
 */
export class ApiResponse {
  /**
   * Return a standardized success response.
   */
  static success(c, data = null, message = null, statusCode = 200) {
    const responsePayload = {
      success: true,
    };

    if (message !== null && message !== undefined) {
      responsePayload.message = message;
    }

    if (data !== null && data !== undefined) {
      responsePayload.data = data;
    }

    return c.json(responsePayload, statusCode);
  }

  /**
   * Return a standardized 201 Created response.
   */
  static created(c, data = null, message = null) {
    return ApiResponse.success(c, data, message, 201);
  }

  /**
   * Return a standardized message-only response.
   */
  static message(c, message, statusCode = 200) {
    return c.json(
      {
        success: true,
        message,
      },
      statusCode
    );
  }

  /**
   * Return a standardized error response.
   */
  static error(c, { message, code = 'INTERNAL_SERVER_ERROR', details = null, statusCode = 500 }) {
    const errorPayload = {
      message: message || 'An unexpected error occurred',
      code,
    };

    if (details !== null && details !== undefined) {
      errorPayload.details = details;
    }

    return c.json(
      {
        success: false,
        error: errorPayload,
      },
      statusCode
    );
  }
}
