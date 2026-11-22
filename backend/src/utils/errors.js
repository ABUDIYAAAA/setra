export class AppError extends Error {
  constructor(message, statusCode = 400, code = 'BAD_REQUEST', details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad Request', code = 'BAD_REQUEST', details = null) {
    super(message, 400, code, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', code = 'UNAUTHORIZED', details = null) {
    super(message, 401, code, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', code = 'FORBIDDEN', details = null) {
    super(message, 403, code, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource Not Found', code = 'NOT_FOUND', details = null) {
    super(message, 404, code, details);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict', code = 'CONFLICT', details = null) {
    super(message, 409, code, details);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation Failed', details = null) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class InternalServerError extends AppError {
  constructor(message = 'Internal Server Error', code = 'INTERNAL_SERVER_ERROR', details = null) {
    super(message, 500, code, details);
  }
}
