import crypto from 'node:crypto';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import {
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
      googleId: user.googleId || null,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl || null,
      createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
      updatedAt: user.updatedAt instanceof Date ? user.updatedAt.toISOString() : user.updatedAt,
    };
  }

  generateAccessToken(user) {
    return jwt.sign(
      {
        sub: user.id,
        googleId: user.googleId,
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

  getGoogleAuthUrl() {
    const clientId = env.GOOGLE_CLIENT_ID || '';
    const redirectUri = env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/v1/auth/google/callback';
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async verifyGoogleCredentials({ idToken, accessToken, code }) {
    try {
      // 1. If ID token provided (Direct client-side authentication e.g. One Tap or Mobile SDK)
      if (idToken) {
        const res = await axios.get('https://oauth2.googleapis.com/tokeninfo', {
          params: { id_token: idToken },
        });
        const data = res.data;
        if (!data || !data.sub || !data.email) {
          throw new UnauthorizedError('Invalid Google ID token payload', 'INVALID_GOOGLE_TOKEN');
        }
        return {
          googleId: data.sub,
          email: data.email,
          name: data.name || data.email.split('@')[0],
          avatarUrl: data.picture || null,
        };
      }

      // 2. If Access token provided (Bearer token from client)
      if (accessToken) {
        const res = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = res.data;
        if (!data || !data.sub || !data.email) {
          throw new UnauthorizedError('Invalid Google access token payload', 'INVALID_GOOGLE_TOKEN');
        }
        return {
          googleId: data.sub,
          email: data.email,
          name: data.name || data.email.split('@')[0],
          avatarUrl: data.picture || null,
        };
      }

      // 3. If Authorization code provided (Web redirect flow)
      if (code) {
        const tokenRes = await axios.post(
          'https://oauth2.googleapis.com/token',
          new URLSearchParams({
            code,
            client_id: env.GOOGLE_CLIENT_ID || '',
            client_secret: env.GOOGLE_CLIENT_SECRET || '',
            redirect_uri: env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/v1/auth/google/callback',
            grant_type: 'authorization_code',
          }).toString(),
          {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          }
        );

        const { id_token, access_token } = tokenRes.data;
        if (id_token) {
          return this.verifyGoogleCredentials({ idToken: id_token });
        }
        if (access_token) {
          return this.verifyGoogleCredentials({ accessToken: access_token });
        }
        throw new UnauthorizedError('Failed to retrieve tokens from Google code exchange', 'GOOGLE_OAUTH_FAILED');
      }

      throw new BadRequestError('Must provide idToken, accessToken, or code', 'MISSING_GOOGLE_CREDENTIALS');
    } catch (err) {
      if (err instanceof BadRequestError || err instanceof UnauthorizedError) {
        throw err;
      }
      const message = err.response?.data?.error_description || err.response?.data?.error || err.message;
      throw new UnauthorizedError(`Google authentication failed: ${message}`, 'GOOGLE_AUTH_FAILED');
    }
  }

  async authenticateWithGoogle({ idToken, accessToken, code }) {
    const googleUser = await this.verifyGoogleCredentials({ idToken, accessToken, code });

    // Find user by googleId or email
    let user = await authRepository.findUserByGoogleId(googleUser.googleId);

    if (!user) {
      user = await authRepository.findUserByEmail(googleUser.email);
      if (user) {
        // Link existing user to Google ID
        user = await authRepository.updateUser(user.id, {
          googleId: googleUser.googleId,
          avatarUrl: googleUser.avatarUrl || user.avatarUrl,
        });
      } else {
        // Create new user from Google profile
        user = await authRepository.createUser({
          googleId: googleUser.googleId,
          email: googleUser.email,
          name: googleUser.name,
          avatarUrl: googleUser.avatarUrl,
        });
      }
    } else if (googleUser.avatarUrl && user.avatarUrl !== googleUser.avatarUrl) {
      // Update avatar if changed
      user = await authRepository.updateUser(user.id, {
        avatarUrl: googleUser.avatarUrl,
      });
    }

    const setraAccessToken = this.generateAccessToken(user);
    const setraRefreshToken = await this.createAndSaveRefreshToken(user);

    return {
      user: this.formatUser(user),
      accessToken: setraAccessToken,
      refreshToken: setraRefreshToken,
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
}

export const authService = new AuthService();
