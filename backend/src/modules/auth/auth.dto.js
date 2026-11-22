import { z } from '@hono/zod-openapi';

export const RegisterRequestSchema = z
  .object({
    name: z.string().min(2, 'Name must have at least 2 characters').openapi({ example: 'John Doe' }),
    email: z.string().email('Invalid email address').openapi({ example: 'john@example.com' }),
    password: z.string().min(8, 'Password must be at least 8 characters').openapi({ example: 'SecureP@ss123' }),
  })
  .openapi('RegisterRequest');

export const LoginRequestSchema = z
  .object({
    email: z.string().email('Invalid email address').openapi({ example: 'john@example.com' }),
    password: z.string().min(1, 'Password is required').openapi({ example: 'SecureP@ss123' }),
  })
  .openapi('LoginRequest');

export const RefreshTokenRequestSchema = z
  .object({
    refreshToken: z.string().min(1, 'Refresh token is required').openapi({ example: 'eyJhbGciOiJIUzI1NiIsIn...' }),
  })
  .openapi('RefreshTokenRequest');

export const ChangePasswordRequestSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required').openapi({ example: 'SecureP@ss123' }),
    newPassword: z.string().min(8, 'New password must be at least 8 characters').openapi({ example: 'NewSecureP@ss456' }),
  })
  .openapi('ChangePasswordRequest');

export const UserDto = z
  .object({
    id: z.string().uuid().openapi({ example: '123e4567-e89b-12d3-a456-426614174000' }),
    name: z.string().openapi({ example: 'John Doe' }),
    email: z.string().email().openapi({ example: 'john@example.com' }),
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
