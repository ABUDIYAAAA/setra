import { describe, it, expect } from 'vitest';
import { createApp } from '../src/app.js';

describe('Health & Documentation Endpoints', () => {
  const app = createApp();

  it('GET /health should return 200 and status ok', async () => {
    const res = await app.request('/health');
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.status).toBe('ok');
    expect(json.timestamp).toBeDefined();
  });

  it('GET /openapi.json should return valid OpenAPI 3.0 specification', async () => {
    const res = await app.request('/openapi.json');
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.openapi).toBe('3.0.0');
    expect(json.info.title).toBe('Setra Backend API');
    expect(json.paths['/api/v1/auth/google']).toBeDefined();
    expect(json.paths['/api/v1/auth/google/url']).toBeDefined();
    expect(json.paths['/api/v1/auth/refresh']).toBeDefined();
    expect(json.paths['/api/v1/auth/logout']).toBeDefined();
    expect(json.paths['/api/v1/auth/me']).toBeDefined();
    expect(json.paths['/api/v1/exercises']).toBeDefined();
  });

  it('GET /docs should serve Scalar API documentation HTML', async () => {
    const res = await app.request('/docs');
    const text = await res.text();

    expect(res.status).toBe(200);
    expect(text).toContain('@scalar/api-reference');
  });
});
