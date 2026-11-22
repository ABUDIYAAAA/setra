import { z } from '@hono/zod-openapi';

export const GoogleAuthRequestSchema = z
  .object({
    idToken: z.string().optional().openapi({
      description: 'Google ID Token from client SDK (iOS/Android/Web One Tap)',
      example: 'eyJhbGciOiJSUzI1NiIsImtpZCI...',
    }),
    accessToken: z.string().optional().openapi({
      description: 'Google OAuth Access Token',
      example: 'ya29.a0AfH6SMC...',
    }),
    code: z.string().optional().openapi({
      description: 'Google Authorization Code from OAuth consent redirect',
      example: '4/0AX4XfWh...',
    }),
  })
  .openapi('GoogleAuthRequest');

export const GoogleAuthUrlResponseSchema = z
  .object({
    success: z.boolean().openapi({ example: true }),
    data: z.object({
      url: z.string().openapi({
        example: 'https://accounts.google.com/o/oauth2/v2/auth?client_id=...&response_type=code',
      }),
    }),
  })
  .openapi('GoogleAuthUrlResponse');

export const RefreshTokenRequestSchema = z
  .object({
    refreshToken: z.string().min(1, 'Refresh token is required').openapi({
      example: 'eyJhbGciOiJIUzI1NiIsIn...',
    }),
  })
  .openapi('RefreshTokenRequest');

export const UserDto = z
  .object({
    id: z.string().uuid().openapi({ example: '123e4567-e89b-12d3-a456-426614174000' }),
    googleId: z.string().nullable().optional().openapi({ example: '1098234789123498172' }),
    name: z.string().openapi({ example: 'Alex Morgan' }),
    email: z.string().email().openapi({ example: 'alex@gmail.com' }),
    avatarUrl: z.string().nullable().optional().openapi({ example: 'https://lh3.googleusercontent.com/a/...' }),
    createdAt: z.string().openapi({ example: '2026-11-22T14:00:00.000Z' }),
    updatedAt: z.string().openapi({ example: '2026-11-22T14:00:00.000Z' }),
  })
  .openapi('UserDto');

export const AuthResponseSchema = z
  .object({
    success: z.boolean().openapi({ example: true }),
    data: z.object({
      user: UserDto,
      accessToken: z.string().openapi({ example: 'eyJhbGciOiJIUzI1Ni...' }),
      refreshToken: z.string().openapi({ example: 'eyJhbGciOiJIUzI1Ni...' }),
    }),
  })
  .openapi('AuthResponse');

export const TokenRefreshResponseSchema = z
  .object({
    success: z.boolean().openapi({ example: true }),
    data: z.object({
      accessToken: z.string().openapi({ example: 'eyJhbGciOiJIUzI1Ni...' }),
      refreshToken: z.string().openapi({ example: 'eyJhbGciOiJIUzI1Ni...' }),
    }),
  })
  .openapi('TokenRefreshResponse');

export const UserProfileResponseSchema = z
  .object({
    success: z.boolean().openapi({ example: true }),
    data: z.object({
      user: UserDto,
    }),
  })
  .openapi('UserProfileResponse');

export const MessageResponseSchema = z
  .object({
    success: z.boolean().openapi({ example: true }),
    message: z.string().openapi({ example: 'Operation completed successfully' }),
  })
  .openapi('MessageResponse');

export const ErrorResponseSchema = z
  .object({
    success: z.boolean().openapi({ example: false }),
    error: z.object({
      message: z.string().openapi({ example: 'Error message description' }),
      code: z.string().openapi({ example: 'ERROR_CODE' }),
      details: z.any().optional(),
    }),
  })
  .openapi('ErrorResponse');
