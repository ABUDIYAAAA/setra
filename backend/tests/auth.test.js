import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createApp } from '../src/app.js';
import axios from 'axios';

describe('Google OAuth & Session Lifecycle', () => {
  const app = createApp();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('GET /api/v1/auth/google/url should return a valid Google consent URL', async () => {
    const res = await app.request('/api/v1/auth/google/url');
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.url).toContain('accounts.google.com/o/oauth2/v2/auth');
    expect(json.data.url).toContain('client_id=');
  });

  it('GET /api/v1/auth/google/callback should redirect with tokens to deep link in state', async () => {
    const mockGoogleUser = {
      sub: `google_cb_${Date.now()}`,
      email: `cb_${Date.now()}@gmail.com`,
      name: 'Callback User',
      picture: 'https://lh3.googleusercontent.com/pic',
      email_verified: true,
    };

    // Mock axios.post for token exchange
    vi.spyOn(axios, 'post').mockResolvedValueOnce({
      data: {
        access_token: 'mock-google-access-token',
      },
    });

    // Mock axios.get for userinfo
    vi.spyOn(axios, 'get').mockResolvedValueOnce({
      data: mockGoogleUser,
    });

    const targetDeepLink = 'app://auth/callback';
    const callbackRes = await app.request(
      `/api/v1/auth/google/callback?code=mock-auth-code&state=${encodeURIComponent(targetDeepLink)}`
    );

    expect(callbackRes.status).toBe(302);
    const location = callbackRes.headers.get('location');
    expect(location).toBeDefined();
    expect(location).toContain('app://auth/callback');
    expect(location).toContain('accessToken=');
    expect(location).toContain('refreshToken=');
  });

  it('POST /api/v1/auth/google should reject empty or invalid requests', async () => {
    const emptyRes = await app.request('/api/v1/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(emptyRes.status).toBe(400);

    // Mock axios to simulate Google rejecting an invalid ID token
    vi.spyOn(axios, 'get').mockRejectedValueOnce({
      response: { data: { error_description: 'Invalid Value' } },
    });

    const invalidRes = await app.request('/api/v1/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: 'invalid.google.token' }),
    });
    const invalidJson = await invalidRes.json();

    expect(invalidRes.status).toBe(401);
    expect(invalidJson.success).toBe(false);
    expect(invalidJson.error.code).toBe('GOOGLE_AUTH_FAILED');
  });

  it('POST /api/v1/auth/google should authenticate user with valid Google ID Token and issue JWTs', async () => {
    const mockGoogleUser = {
      sub: `google_id_${Date.now()}`,
      email: `test_${Date.now()}@gmail.com`,
      name: 'Jordan Miller',
      picture: 'https://lh3.googleusercontent.com/avatar123',
      email_verified: true,
    };

    vi.spyOn(axios, 'get').mockResolvedValueOnce({
      data: mockGoogleUser,
    });

    const res = await app.request('/api/v1/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: 'valid-test-id-token' }),
    });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.user.email).toBe(mockGoogleUser.email);
    expect(json.data.user.googleId).toBe(mockGoogleUser.sub);
    expect(json.data.user.name).toBe(mockGoogleUser.name);
    expect(json.data.user.avatarUrl).toBe(mockGoogleUser.picture);
    expect(json.data.accessToken).toBeTypeOf('string');
    expect(json.data.refreshToken).toBeTypeOf('string');
  });

  it('Protected /me, Refresh Token rotation, and Logout workflow', async () => {
    const mockGoogleUser = {
      sub: `google_flow_${Date.now()}`,
      email: `flow_${Date.now()}@gmail.com`,
      name: 'Taylor Reed',
      picture: 'https://lh3.googleusercontent.com/flow_pic',
      email_verified: true,
    };

    vi.spyOn(axios, 'get').mockResolvedValueOnce({
      data: mockGoogleUser,
    });

    // 1. Authenticate with Google
    const authRes = await app.request('/api/v1/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: 'valid-id-token-flow' }),
    });
    const authJson = await authRes.json();
    let accessToken = authJson.data.accessToken;
    let refreshToken = authJson.data.refreshToken;

    // 2. Fetch authenticated profile via GET /me
    const meRes = await app.request('/api/v1/auth/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const meJson = await meRes.json();
    expect(meRes.status).toBe(200);
    expect(meJson.data.user.email).toBe(mockGoogleUser.email);
    expect(meJson.data.user.name).toBe(mockGoogleUser.name);

    // 2b. Unauthenticated /me must return 401
    const unauthRes = await app.request('/api/v1/auth/me');
    expect(unauthRes.status).toBe(401);

    // 3. Refresh token rotation
    const refreshRes = await app.request('/api/v1/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    const refreshJson = await refreshRes.json();
    expect(refreshRes.status).toBe(200);
    expect(refreshJson.data.accessToken).toBeTypeOf('string');
    expect(refreshJson.data.refreshToken).toBeTypeOf('string');

    const rotatedOldToken = refreshToken;
    const newRefreshToken = refreshJson.data.refreshToken;

    // 4. Replay attack rejection: old rotated refresh token must fail
    const replayRes = await app.request('/api/v1/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: rotatedOldToken }),
    });
    expect(replayRes.status).toBe(401);

    // 5. Logout
    const logoutRes = await app.request('/api/v1/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: newRefreshToken }),
    });
    const logoutJson = await logoutRes.json();
    expect(logoutRes.status).toBe(200);
    expect(logoutJson.success).toBe(true);

    // 6. Logged out refresh token can no longer be refreshed
    const postLogoutRefreshRes = await app.request('/api/v1/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: newRefreshToken }),
    });
    expect(postLogoutRefreshRes.status).toBe(401);
  });
});
