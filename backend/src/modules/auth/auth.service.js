import crypto from 'node:crypto';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import {
  AppError,
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
} from '../../utils/errors.js';
import { hashToken } from '../../utils/crypto.js';
import { authRepository } from './auth.repository.js';

export class AuthService {
  formatUser(user) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
      updatedAt: user.updatedAt instanceof Date ? user.updatedAt.toISOString() : user.updatedAt,
    };
  }

  generateAccessToken(user) {
    return jwt.sign(
      {
        sub: user.id,
        email: user.email,
        name: user.name,
        jti: crypto.randomUUID(),
      },
      env.JWT_ACCESS_SECRET,
      { expiresIn: env.JWT_ACCESS_EXPIRES_IN }
    );
  }

  generateRefreshToken(user) {
    return jwt.sign(
      {
        sub: user.id,
        jti: crypto.randomUUID(),
      },
      env.JWT_REFRESH_SECRET,
      { expiresIn: env.JWT_REFRESH_EXPIRES_IN }
    );
  }

  async createAndSaveRefreshToken(user) {
    const refreshToken = this.generateRefreshToken(user);
    const decoded = jwt.decode(refreshToken);
    const expiresAt = new Date(decoded.exp * 1000);
    const tokenHash = hashToken(refreshToken);

    await authRepository.saveRefreshToken({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    return refreshToken;
  }

  async register({ name, email, password }) {
    const existingUser = await authRepository.findUserByEmail(email);
    if (existingUser) {
      throw new BadRequestError('Email is already registered', 'EMAIL_ALREADY_EXISTS');
    }

    const passwordHash = await argon2.hash(password);
    const newUser = await authRepository.createUser({
      name,
      email,
      passwordHash,
    });

    const accessToken = this.generateAccessToken(newUser);
    const refreshToken = await this.createAndSaveRefreshToken(newUser);

    return {
      user: this.formatUser(newUser),
      accessToken,
      refreshToken,
    };
  }

  async login({ email, password }) {
    const user = await authRepository.findUserByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    const isValidPassword = await argon2.verify(user.passwordHash, password);
    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.createAndSaveRefreshToken(user);

    return {
      user: this.formatUser(user),
      accessToken,
      refreshToken,
    };
  }

  async refreshTokens({ refreshToken }) {
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token', 'INVALID_REFRESH_TOKEN');
    }

    const tokenHash = hashToken(refreshToken);
    const tokenRecord = await authRepository.findActiveRefreshToken(decoded.sub, tokenHash);

    if (!tokenRecord) {
      throw new UnauthorizedError('Refresh token revoked or not found', 'TOKEN_REVOKED');
    }

    // Token rotation: Revoke old token
    await authRepository.revokeRefreshToken(tokenRecord.id);

    const user = await authRepository.findUserById(decoded.sub);
    if (!user) {
      throw new NotFoundError('User no longer exists', 'USER_NOT_FOUND');
    }

    const newAccessToken = this.generateAccessToken(user);
    const newRefreshToken = await this.createAndSaveRefreshToken(user);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout({ refreshToken }) {
    if (refreshToken) {
      const tokenHash = hashToken(refreshToken);
      await authRepository.revokeRefreshTokenByHash(tokenHash);
    }
    return { message: 'Logged out successfully' };
  }

  async getProfile(userId) {
    const user = await authRepository.findUserById(userId);
    if (!user) {
      throw new NotFoundError('User not found', 'USER_NOT_FOUND');
    }
    return {
      user: this.formatUser(user),
    };
  }

  async changePassword({ userId, currentPassword, newPassword }) {
    const user = await authRepository.findUserById(userId);
    if (!user) {
      throw new NotFoundError('User not found', 'USER_NOT_FOUND');
    }

    const isValidPassword = await argon2.verify(user.passwordHash, currentPassword);
    if (!isValidPassword) {
      throw new BadRequestError('Current password is incorrect', 'INVALID_CURRENT_PASSWORD');
    }

    const newPasswordHash = await argon2.hash(newPassword);
    await authRepository.updateUserPassword(userId, newPasswordHash);

    // Revoke all existing refresh tokens for security
    await authRepository.revokeAllUserRefreshTokens(userId);

    return { message: 'Password changed successfully. Please log in again.' };
  }
}

export const authService = new AuthService();
