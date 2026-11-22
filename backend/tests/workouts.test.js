import { describe, it, expect, vi, beforeAll } from 'vitest';
import { createApp } from '../src/app.js';
import axios from 'axios';

describe('Workouts Module End-to-End Tests', () => {
  const app = createApp();

  let user = null;
  let routineId = null;

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
    user = await createTestUser('workout_tester');

    // Create a routine for testing starting workout from routine
    const routineRes = await app.request('/api/v1/routines', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user.accessToken}`,
      },
      body: JSON.stringify({
        title: 'Upper Body A',
        exercises: [
          {
            exerciseId: 'bench-press',
            orderIndex: 0,
            sets: [
              { setNumber: 1, type: 'warmup', weight: 60, reps: 10 },
              { setNumber: 2, type: 'normal', weight: 90, reps: 8 },
            ],
          },
        ],
      }),
    });
    const routineJson = await routineRes.json();
    routineId = routineJson.data.id;
  });

  it('POST /api/v1/workouts should start an empty active workout session', async () => {
    const res = await app.request('/api/v1/workouts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user.accessToken}`,
      },
      body: JSON.stringify({ title: 'Chest & Arms Blast' }),
    });

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.data.id).toBeDefined();
    expect(json.data.title).toBe('Chest & Arms Blast');
    expect(json.data.status).toBe('in_progress');
    expect(json.data.exercises).toEqual([]);
  });

  it('GET /api/v1/workouts/active should return current in-progress workout', async () => {
    const res = await app.request('/api/v1/workouts/active', {
      headers: { Authorization: `Bearer ${user.accessToken}` },
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).not.toBeNull();
    expect(json.data.title).toBe('Chest & Arms Blast');
  });

  it('POST /api/v1/workouts/:id/exercises & sets should add exercises and sets dynamically', async () => {
    const activeRes = await app.request('/api/v1/workouts/active', {
      headers: { Authorization: `Bearer ${user.accessToken}` },
    });
    const activeJson = await activeRes.json();
    const workoutId = activeJson.data.id;

    // 1. Add Exercise
    const addExRes = await app.request(`/api/v1/workouts/${workoutId}/exercises`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user.accessToken}`,
      },
      body: JSON.stringify({
        exerciseId: 'bench-press',
        notes: 'Keep elbows tucked',
      }),
    });

    expect(addExRes.status).toBe(201);
    const addExJson = await addExRes.json();
    expect(addExJson.data.exerciseId).toBe('bench-press');
    expect(addExJson.data.sets.length).toBe(1);

    const workoutExerciseId = addExJson.data.id;
    const initialSetId = addExJson.data.sets[0].id;

    // 2. Add second set
    const addSetRes = await app.request(`/api/v1/workouts/${workoutId}/exercises/${workoutExerciseId}/sets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user.accessToken}`,
      },
      body: JSON.stringify({
        type: 'normal',
        weight: 100,
        reps: 8,
      }),
    });

    expect(addSetRes.status).toBe(201);
    const addSetJson = await addSetRes.json();
    expect(addSetJson.data.setNumber).toBe(2);

    // 3. Mark set 1 as completed with heavy weight and verify INSTANT PR DETECTION
    const updateSet1Res = await app.request(`/api/v1/workouts/${workoutId}/sets/${initialSetId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user.accessToken}`,
      },
      body: JSON.stringify({
        weight: 100,
        reps: 8,
        isCompleted: true,
      }),
    });

    expect(updateSet1Res.status).toBe(200);
    const updateSet1Json = await updateSet1Res.json();
    expect(updateSet1Json.data.isCompleted).toBe(true);
    expect(updateSet1Json.data.isPr).toBe(true);
    expect(updateSet1Json.newPrs).toContain('max_weight');
    expect(updateSet1Json.newPrs).toContain('estimated_1rm');
    expect(updateSet1Json.newPrs).toContain('set_volume');

    // 4. Mark set 2 as completed with even heavier weight (110kg x 5) -> New max_weight PR!
    const set2Id = addSetJson.data.id;
    const updateSet2Res = await app.request(`/api/v1/workouts/${workoutId}/sets/${set2Id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user.accessToken}`,
      },
      body: JSON.stringify({
        weight: 110,
        reps: 5,
        isCompleted: true,
      }),
    });

    expect(updateSet2Res.status).toBe(200);
    const updateSet2Json = await updateSet2Res.json();
    expect(updateSet2Json.data.isPr).toBe(true);
    expect(updateSet2Json.newPrs).toContain('max_weight');
  });

  it('POST /api/v1/workouts/:id/finish should complete workout and compute volume + muscle heatmap', async () => {
    const activeRes = await app.request('/api/v1/workouts/active', {
      headers: { Authorization: `Bearer ${user.accessToken}` },
    });
    const activeJson = await activeRes.json();
    const workoutId = activeJson.data.id;

    const finishRes = await app.request(`/api/v1/workouts/${workoutId}/finish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user.accessToken}`,
      },
      body: JSON.stringify({
        durationSeconds: 3200,
        notes: 'Incredible chest pump',
      }),
    });

    expect(finishRes.status).toBe(200);
    const finishJson = await finishRes.json();
    expect(finishJson.data.status).toBe('completed');
    expect(finishJson.data.durationSeconds).toBe(3200);
    expect(Number(finishJson.data.totalVolumeKg)).toBe(100 * 8 + 110 * 5); // 800 + 550 = 1350kg
    expect(finishJson.data.totalSetsCompleted).toBe(2);

    // Verify set-weighted muscle heatmap
    expect(finishJson.data.muscleScores).toBeDefined();
    // 2 completed working sets on bench press award points to primary & secondary muscles
    expect(Object.keys(finishJson.data.muscleScores).length).toBeGreaterThan(0);
  });

  it('POST /api/v1/workouts should start workout pre-populated from an existing routine', async () => {
    const res = await app.request('/api/v1/workouts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user.accessToken}`,
      },
      body: JSON.stringify({ routineId }),
    });

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.data.routineId).toBe(routineId);
    expect(json.data.title).toBe('Upper Body A');
    expect(json.data.exercises.length).toBe(1);
    expect(json.data.exercises[0].exerciseId).toBe('bench-press');
    expect(json.data.exercises[0].sets.length).toBe(2);

    // Clean up by discarding this active workout
    await app.request(`/api/v1/workouts/${json.data.id}/discard`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${user.accessToken}` },
    });
  });

  it('Analytics endpoints: streaks, calendar, heatmap, and exercise history', async () => {
    // 1. Streaks
    const streaksRes = await app.request('/api/v1/workouts/analytics/streaks', {
      headers: { Authorization: `Bearer ${user.accessToken}` },
    });
    expect(streaksRes.status).toBe(200);
    const streaksJson = await streaksRes.json();
    expect(streaksJson.data.totalWorkouts).toBeGreaterThanOrEqual(1);
    expect(streaksJson.data.currentDayStreak).toBeGreaterThanOrEqual(1);

    // 2. Activity Calendar
    const calRes = await app.request('/api/v1/workouts/analytics/activity-calendar', {
      headers: { Authorization: `Bearer ${user.accessToken}` },
    });
    expect(calRes.status).toBe(200);
    const calJson = await calRes.json();
    expect(Array.isArray(calJson.data)).toBe(true);
    expect(calJson.data.length).toBeGreaterThanOrEqual(1);

    // 3. Muscle Heatmap
    const heatmapRes = await app.request('/api/v1/workouts/analytics/muscle-heatmap?period=30d', {
      headers: { Authorization: `Bearer ${user.accessToken}` },
    });
    expect(heatmapRes.status).toBe(200);
    const heatmapJson = await heatmapRes.json();
    expect(heatmapJson.data.workoutCount).toBeGreaterThanOrEqual(1);
    expect(heatmapJson.data.muscles).toBeDefined();

    // 4. Exercise History (bench-press)
    const historyRes = await app.request('/api/v1/workouts/analytics/exercises/bench-press/history', {
      headers: { Authorization: `Bearer ${user.accessToken}` },
    });
    expect(historyRes.status).toBe(200);
    const historyJson = await historyRes.json();
    expect(historyJson.data.sessions.length).toBeGreaterThanOrEqual(1);
    expect(historyJson.data.sessions[0].heaviestWeightKg).toBe(110);

    // 5. Exercise Records (bench-press PRs)
    const recordsRes = await app.request('/api/v1/workouts/analytics/exercises/bench-press/records', {
      headers: { Authorization: `Bearer ${user.accessToken}` },
    });
    expect(recordsRes.status).toBe(200);
    const recordsJson = await recordsRes.json();
    expect(Number(recordsJson.data.heaviestWeightKg)).toBe(110);
  });
});
