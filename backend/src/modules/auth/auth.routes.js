import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import { authHandlers } from './auth.handlers.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import {
  GoogleAuthRequestSchema,
  GoogleAuthUrlResponseSchema,
  RefreshTokenRequestSchema,
  AuthResponseSchema,
  TokenRefreshResponseSchema,
  UserProfileResponseSchema,
  MessageResponseSchema,
  ErrorResponseSchema,
} from './auth.dto.js';

export const authRouter = new OpenAPIHono();

export const googleUrlRoute = createRoute({
  method: 'get',
  path: '/google/url',
  summary: 'Get Google OAuth Consent URL',
  description: 'Returns the Google OAuth 2.0 authorization URL to redirect users for consent.',
  tags: ['Authentication'],
  responses: {
    200: {
      description: 'Google OAuth consent URL',
      content: {
        'application/json': {
          schema: GoogleAuthUrlResponseSchema,
        },
      },
    },
  },
});

export const googleAuthRoute = createRoute({
  method: 'post',
  path: '/google',
  summary: 'Authenticate with Google OAuth',
  description:
    'Sign in or sign up using Google OAuth. Accepts Google ID token (iOS/Android/Web), Access token, or Authorization code.',
  tags: ['Authentication'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: GoogleAuthRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Authenticated successfully with Google',
      content: {
        'application/json': {
          schema: AuthResponseSchema,
        },
      },
    },
    400: {
      description: 'Bad Request / Missing parameters',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
    401: {
      description: 'Google authentication failed / Invalid token',
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
  description: 'Returns profile details of the authenticated Google user identified by the Bearer access token.',
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

// Register routes
authRouter.openapi(googleUrlRoute, authHandlers.getGoogleUrl);
authRouter.openapi(googleAuthRoute, authHandlers.googleAuth);
authRouter.openapi(refreshRoute, authHandlers.refresh);
authRouter.openapi(logoutRoute, authHandlers.logout);

// Protected routes
authRouter.use('/me', authMiddleware);
authRouter.openapi(meRoute, authHandlers.getMe);
