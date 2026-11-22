import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import { authHandlers } from './auth.handlers.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import {
  RegisterRequestSchema,
  LoginRequestSchema,
  RefreshTokenRequestSchema,
  ChangePasswordRequestSchema,
  AuthResponseSchema,
  TokenRefreshResponseSchema,
  UserProfileResponseSchema,
  MessageResponseSchema,
  ErrorResponseSchema,
} from './auth.dto.js';

export const authRouter = new OpenAPIHono();

// Routes definitions
export const registerRoute = createRoute({
  method: 'post',
  path: '/register',
  summary: 'Register a new user account',
  description: 'Registers a new user with name, email, and password, returning tokens and user profile.',
  tags: ['Authentication'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: RegisterRequestSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'User registered successfully',
      content: {
        'application/json': {
          schema: AuthResponseSchema,
        },
      },
    },
    400: {
      description: 'Bad Request / Email already exists',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

export const loginRoute = createRoute({
  method: 'post',
  path: '/login',
  summary: 'Login with credentials',
  description: 'Authenticates user using email and password, issuing access and refresh tokens.',
  tags: ['Authentication'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: LoginRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Logged in successfully',
      content: {
        'application/json': {
          schema: AuthResponseSchema,
        },
      },
    },
    401: {
      description: 'Invalid credentials',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

export const refreshRoute = createRoute({
  method: 'post',
  path: '/refresh',
  summary: 'Refresh access token',
  description: 'Rotates the refresh token and returns a new access and refresh token pair.',
  tags: ['Authentication'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: RefreshTokenRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Token refreshed successfully',
      content: {
        'application/json': {
          schema: TokenRefreshResponseSchema,
        },
      },
    },
    401: {
      description: 'Invalid, revoked or expired refresh token',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

export const logoutRoute = createRoute({
  method: 'post',
  path: '/logout',
  summary: 'Revoke refresh token (Logout)',
  description: 'Revokes the provided refresh token to prevent further token renewals.',
  tags: ['Authentication'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: RefreshTokenRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Logged out successfully',
      content: {
        'application/json': {
          schema: MessageResponseSchema,
        },
      },
    },
  },
});

export const meRoute = createRoute({
  method: 'get',
  path: '/me',
  summary: 'Get current user profile',
  description: 'Returns profile details of the authenticated user identified by the Bearer access token.',
  tags: ['Authentication'],
  security: [{ BearerAuth: [] }],
  responses: {
    200: {
      description: 'Current user profile retrieved successfully',
      content: {
        'application/json': {
          schema: UserProfileResponseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized - invalid or missing Bearer token',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

export const changePasswordRoute = createRoute({
  method: 'post',
  path: '/change-password',
  summary: 'Change password',
  description: 'Updates the user password and revokes all active refresh tokens.',
  tags: ['Authentication'],
  security: [{ BearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: ChangePasswordRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Password changed successfully',
      content: {
        'application/json': {
          schema: MessageResponseSchema,
        },
      },
    },
    400: {
      description: 'Incorrect current password or invalid input',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized - invalid or missing Bearer token',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

// Register routes
authRouter.openapi(registerRoute, authHandlers.register);
authRouter.openapi(loginRoute, authHandlers.login);
authRouter.openapi(refreshRoute, authHandlers.refresh);
authRouter.openapi(logoutRoute, authHandlers.logout);

// Protected routes with authMiddleware
authRouter.use('/me', authMiddleware);
authRouter.openapi(meRoute, authHandlers.getMe);

authRouter.use('/change-password', authMiddleware);
authRouter.openapi(changePasswordRoute, authHandlers.changePassword);
