import { OpenAPIHono } from '@hono/zod-openapi';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { apiReference } from '@scalar/hono-api-reference';
import { authRouter } from './modules/auth/auth.routes.js';
import { exerciseRouter } from './modules/exercises/exercise.routes.js';
import { routineRouter } from './modules/routines/routine.routes.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { ApiResponse } from './utils/apiResponse.js';

export function createApp() {
  const app = new OpenAPIHono({
    defaultHook: (result, c) => {
      if (!result.success) {
        return ApiResponse.error(c, {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: result.error.issues,
          statusCode: 400,
        });
      }
    },
  });

  // HTTP Request Logging (active outside tests)
  if (process.env.NODE_ENV !== 'test') {
    app.use('*', logger());
  }

  // Enable CORS for all routes and clients
  app.use('*', cors());

  // Global Error Handler
  app.onError(errorHandler);

  // Health check
  app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

  // Mount Auth Module
  app.route('/api/v1/auth', authRouter);

  // Mount Exercises Module
  app.route('/api/v1/exercises', exerciseRouter);

  // Mount Routines Module
  app.route('/api/v1/routines', routineRouter);

  // OpenAPI Specification endpoint
  app.doc('/openapi.json', {
    openapi: '3.0.0',
    info: {
      title: 'Setra Backend API',
      version: '1.0.0',
      description: 'Modular Hono backend API with Drizzle ORM, Zod validation, and Scalar documentation.',
    },
    servers: [
      {
        url: '/',
        description: 'Current Environment Server',
      },
    ],
  });

  // Register Security Scheme in OpenAPI
  app.openAPIRegistry.registerComponent('securitySchemes', 'BearerAuth', {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
    description: 'Enter your Bearer access token',
  });

  // Mount Scalar API documentation
  app.get(
    '/docs',
    apiReference({
      spec: {
        url: '/openapi.json',
      },
      pageTitle: 'Setra API Documentation',
      theme: 'purple',
    })
  );

  return app;
}
