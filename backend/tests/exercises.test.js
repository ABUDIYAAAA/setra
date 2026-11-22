import { describe, it, expect, beforeAll } from 'vitest';
import { createApp } from '../src/app.js';
import { exerciseService } from '../src/modules/exercises/exercise.service.js';

describe('In-Memory Exercises Catalog API', () => {
  const app = createApp();

  beforeAll(async () => {
    // Ensure in-memory dataset is ready
    await exerciseService.loadExercises();
  });

  it('GET /api/v1/exercises should return all 708 exercises with pagination', async () => {
    const res = await app.request('/api/v1/exercises?limit=15&offset=0');
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.meta.total).toBe(708);
    expect(json.meta.limit).toBe(15);
    expect(json.data.length).toBe(15);
  });

  it('GET /api/v1/exercises should filter by equipment (dumbbell)', async () => {
    const res = await app.request('/api/v1/exercises?equipment=dumbbell&limit=10');
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.length).toBeGreaterThan(0);
    expect(json.data.every((e) => e.equipment === 'dumbbell')).toBe(true);
  });

  it('GET /api/v1/exercises should filter by target body part (chest)', async () => {
    const res = await app.request('/api/v1/exercises?bodyPart=chest&limit=10');
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.length).toBeGreaterThan(0);
    expect(json.data.every((e) => e.bodyPart === 'chest')).toBe(true);
  });

  it('GET /api/v1/exercises should perform case-insensitive text search', async () => {
    const res = await app.request('/api/v1/exercises?search=press');
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.length).toBeGreaterThan(0);
    expect(
      json.data.some(
        (e) =>
          e.name.toLowerCase().includes('press') ||
          e.id.toLowerCase().includes('press') ||
          e.equipment.toLowerCase().includes('press')
      )
    ).toBe(true);
  });

  it('GET /api/v1/exercises/filters/meta should return available metadata for filters', async () => {
    const res = await app.request('/api/v1/exercises/filters/meta');
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.categories).toContain('strength');
    expect(json.data.bodyParts).toContain('chest');
    expect(json.data.equipments).toContain('dumbbell');
    expect(json.data.equipments).toContain('barbell');
    expect(json.data.equipments).toContain('cable');
    expect(json.data.primaryMuscles.length).toBeGreaterThan(10);
  });

  it('GET /api/v1/exercises/:id should return complete details for a single exercise', async () => {
    const res = await app.request('/api/v1/exercises/ab-wheel-rollout');
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.id).toBe('ab-wheel-rollout');
    expect(json.data.name).toBe('Ab Wheel Rollout');
    expect(json.data.instructions).toBeInstanceOf(Array);
    expect(json.data.instructions.length).toBeGreaterThan(0);
    expect(json.data.tips).toBeInstanceOf(Array);
  });

  it('GET /api/v1/exercises/:id should return 404 for non-existent exercise ID', async () => {
    const res = await app.request('/api/v1/exercises/unknown-exercise-id-999');
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('EXERCISE_NOT_FOUND');
  });
});
