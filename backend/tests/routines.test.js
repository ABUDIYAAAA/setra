import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { createApp } from '../src/app.js';
import axios from 'axios';

describe('Routines Module End-to-End Tests', () => {
  const app = createApp();

  let userA = null;
  let userB = null;

  async function createTestUser(prefix) {
    const mockGoogleUser = {
      sub: `google_${prefix}_${Date.now()}_${Math.random()}`,
      email: `${prefix}_${Date.now()}_${Math.random()}@gmail.com`,
      name: `${prefix} User`,
      picture: `https://example.com/${prefix}.png`,
      email_verified: true,
    };

    vi.spyOn(axios, 'get').mockResolvedValueOnce({
      data: mockGoogleUser,
    });

    const res = await app.request('/api/v1/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: `mock-token-${prefix}` }),
    });

    const json = await res.json();
    return {
      user: json.data.user,
      accessToken: json.data.accessToken,
    };
  }

  beforeAll(async () => {
    userA = await createTestUser('user_a');
    userB = await createTestUser('user_b');
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('POST /api/v1/routines should require authentication', async () => {
    const res = await app.request('/api/v1/routines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Push Day',
        exercises: [],
      }),
    });

    expect(res.status).toBe(401);
  });

  it('POST /api/v1/routines should reject empty exercises or invalid constraints', async () => {
    // 1. Empty exercises array
    const emptyRes = await app.request('/api/v1/routines', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userA.accessToken}`,
      },
      body: JSON.stringify({
        title: 'Empty Routine',
        exercises: [],
      }),
    });
    expect(emptyRes.status).toBe(400);

    // 2. Rest timer exceeding 600s
    const restTimerRes = await app.request('/api/v1/routines', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userA.accessToken}`,
      },
      body: JSON.stringify({
        title: 'Heavy Day',
        exercises: [
          {
            exerciseId: 'bench-press',
            orderIndex: 0,
            restTimerSeconds: 601, // exceeds 600 max
            sets: [{ setNumber: 1, type: 'normal', reps: 10, weight: 60 }],
          },
        ],
      }),
    });
    expect(restTimerRes.status).toBe(400);

    // 3. Rep range where max < min
    const repRangeRes = await app.request('/api/v1/routines', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userA.accessToken}`,
      },
      body: JSON.stringify({
        title: 'Hypertrophy Day',
        exercises: [
          {
            exerciseId: 'bench-press',
            orderIndex: 0,
            sets: [
              {
                setNumber: 1,
                type: 'normal',
                repRange: { min: 12, max: 8 }, // Invalid min > max
              },
            ],
          },
        ],
      }),
    });
    expect(repRangeRes.status).toBe(400);

    // 4. Non-existent exerciseId
    const invalidIdRes = await app.request('/api/v1/routines', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userA.accessToken}`,
      },
      body: JSON.stringify({
        title: 'Leg Day',
        exercises: [
          {
            exerciseId: 'totally-fake-exercise-12345',
            orderIndex: 0,
            sets: [{ setNumber: 1, type: 'normal', reps: 10 }],
          },
        ],
      }),
    });
    expect(invalidIdRes.status).toBe(400);
    const invalidIdJson = await invalidIdRes.json();
    expect(invalidIdJson.error.code).toBe('INVALID_EXERCISE_ID');
  });

  it('POST /api/v1/routines should successfully create routine with multi-unit weights, cardio timers & default null rest timer', async () => {
    const payload = {
      title: 'Upper Body Hypertrophy',
      description: 'Focus on chest and back with cardio burnout',
      exercises: [
        {
          exerciseId: 'bench-press',
          orderIndex: 0,
          restTimerSeconds: 120,
          notes: 'Keep shoulder blades pinched back',
          sets: [
            {
              setNumber: 1,
              type: 'warmup',
              weight: 40,
              weightUnit: 'kg',
              reps: 15,
            },
            {
              setNumber: 2,
              type: 'normal',
              weight: 185,
              weightUnit: 'lbs',
              repRange: { min: 8, max: 10 },
            },
            {
              setNumber: 3,
              type: 'drop',
              weight: 135,
              weightUnit: 'lbs',
              reps: 12,
            },
          ],
        },
        {
          exerciseId: 'running',
          orderIndex: 1,
          restTimerSeconds: null, // Deactivated rest timer
          notes: 'High intensity interval sprint',
          sets: [
            {
              setNumber: 1,
              type: 'normal',
              targetDurationSeconds: 900, // 15 minute run
            },
          ],
        },
      ],
    };

    const res = await app.request('/api/v1/routines', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userA.accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    expect(res.status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.data.title).toBe(payload.title);
    expect(json.data.description).toBe(payload.description);
    expect(json.data.exercises).toHaveLength(2);

    // Verify Exercise 1 is hydrated
    const ex1 = json.data.exercises[0];
    expect(ex1.exerciseId).toBe('bench-press');
    expect(ex1.name).toBe('Barbell Bench Press');
    expect(ex1.category).toBe('strength');
    expect(ex1.bodyPart).toBe('chest');
    expect(ex1.restTimerSeconds).toBe(120);
    expect(ex1.sets).toHaveLength(3);
    expect(ex1.sets[0].type).toBe('warmup');
    expect(ex1.sets[0].weightUnit).toBe('kg');
    expect(ex1.sets[1].weightUnit).toBe('lbs');
    expect(ex1.sets[1].repRange).toEqual({ min: 8, max: 10 });

    // Verify Exercise 2
    const ex2 = json.data.exercises[1];
    expect(ex2.exerciseId).toBe('running');
    expect(ex2.restTimerSeconds).toBeNull();
    expect(ex2.sets[0].targetDurationSeconds).toBe(900);
  });

  it('Full Routine CRUD, user isolation, and duplicate workflow', async () => {
    // 1. Create routine for user A
    const createRes = await app.request('/api/v1/routines', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userA.accessToken}`,
      },
      body: JSON.stringify({
        title: 'Original Routine A',
        description: 'User A exclusive routine',
        exercises: [
          {
            exerciseId: 'bench-press',
            orderIndex: 0,
            sets: [{ setNumber: 1, type: 'normal', reps: 10, weight: 70, weightUnit: 'kg' }],
          },
        ],
      }),
    });
    const createdJson = await createRes.json();
    expect(createRes.status).toBe(201);
    const routineId = createdJson.data.id;

    // 2. User B tries to get User A's routine (should return 404)
    const crossGetRes = await app.request(`/api/v1/routines/${routineId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${userB.accessToken}`,
      },
    });
    expect(crossGetRes.status).toBe(404);

    // 3. User A gets own routine
    const getRes = await app.request(`/api/v1/routines/${routineId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${userA.accessToken}`,
      },
    });
    expect(getRes.status).toBe(200);
    const getJson = await getRes.json();
    expect(getJson.data.id).toBe(routineId);
    expect(getJson.data.exercises[0].name).toBe('Barbell Bench Press');

    // 4. User A lists routines
    const listRes = await app.request('/api/v1/routines', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${userA.accessToken}`,
      },
    });
    expect(listRes.status).toBe(200);
    const listJson = await listRes.json();
    expect(Array.isArray(listJson.data)).toBe(true);
    const foundSummary = listJson.data.find((r) => r.id === routineId);
    expect(foundSummary).toBeDefined();
    expect(foundSummary.exerciseCount).toBe(1);
    expect(foundSummary.totalSetsCount).toBe(1);
    expect(foundSummary.exerciseNames).toContain('Barbell Bench Press');

    // 5. User B lists routines (should NOT contain User A's routine)
    const listBRes = await app.request('/api/v1/routines', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${userB.accessToken}`,
      },
    });
    const listBJson = await listBRes.json();
    expect(listBJson.data.some((r) => r.id === routineId)).toBe(false);

    // 6. User A updates routine
    const updateRes = await app.request(`/api/v1/routines/${routineId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userA.accessToken}`,
      },
      body: JSON.stringify({
        title: 'Original Routine A (Updated)',
        exercises: [
          {
            exerciseId: 'dumbbell-shoulder-press',
            orderIndex: 0,
            sets: [
              { setNumber: 1, type: 'normal', reps: 12, weight: 20, weightUnit: 'kg' },
              { setNumber: 2, type: 'normal', reps: 10, weight: 22, weightUnit: 'kg' },
            ],
          },
        ],
      }),
    });
    expect(updateRes.status).toBe(200);
    const updateJson = await updateRes.json();
    expect(updateJson.data.title).toBe('Original Routine A (Updated)');
    expect(updateJson.data.exercises).toHaveLength(1);
    expect(updateJson.data.exercises[0].exerciseId).toBe('dumbbell-shoulder-press');
    expect(updateJson.data.exercises[0].name).toBe('Dumbbell Shoulder Press');
    expect(updateJson.data.exercises[0].sets).toHaveLength(2);

    // 7. Duplicate routine
    const duplicateRes = await app.request(`/api/v1/routines/${routineId}/duplicate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${userA.accessToken}`,
      },
    });
    expect(duplicateRes.status).toBe(201);
    const duplicateJson = await duplicateRes.json();
    expect(duplicateJson.data.id).not.toBe(routineId);
    expect(duplicateJson.data.title).toBe('Original Routine A (Updated) (Copy)');
    expect(duplicateJson.data.exercises).toHaveLength(1);
    expect(duplicateJson.data.exercises[0].exerciseId).toBe('dumbbell-shoulder-press');

    // 8. Delete routine
    const deleteRes = await app.request(`/api/v1/routines/${routineId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${userA.accessToken}`,
      },
    });
    expect(deleteRes.status).toBe(200);

    // 9. Subsequent GET returns 404
    const getAfterDeleteRes = await app.request(`/api/v1/routines/${routineId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${userA.accessToken}`,
      },
    });
    expect(getAfterDeleteRes.status).toBe(404);
  });
});
