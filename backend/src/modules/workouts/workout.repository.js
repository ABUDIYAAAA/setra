import { eq, and, desc, sql, gte, lte, inArray } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { workouts, workoutExercises, workoutSets, userExerciseRecords } from '../../db/schema/workouts.js';

function cleanData(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== undefined));
}

export class WorkoutRepository {
  async createWorkout(data) {
    const [created] = await db
      .insert(workouts)
      .values(cleanData(data))
      .returning();
    return created;
  }

  async findActiveWorkoutByUserId(userId) {
    const [active] = await db
      .select()
      .from(workouts)
      .where(and(eq(workouts.userId, userId), eq(workouts.status, 'in_progress')))
      .orderBy(desc(workouts.startedAt))
      .limit(1);

    if (!active) return null;
    return this.findWorkoutById(active.id, userId);
  }

  async findWorkoutById(id, userId) {
    const [workout] = await db
      .select()
      .from(workouts)
      .where(and(eq(workouts.id, id), eq(workouts.userId, userId)))
      .limit(1);

    if (!workout) return null;

    // Load exercises
    const exercises = await db
      .select()
      .from(workoutExercises)
      .where(eq(workoutExercises.workoutId, id))
      .orderBy(workoutExercises.orderIndex);

    // Load sets for each exercise
    const exerciseIds = exercises.map((e) => e.id);
    let sets = [];
    if (exerciseIds.length > 0) {
      sets = await db
        .select()
        .from(workoutSets)
        .where(inArray(workoutSets.workoutExerciseId, exerciseIds))
        .orderBy(workoutSets.setNumber);
    }

    const setsByExerciseId = new Map();
    for (const s of sets) {
      if (!setsByExerciseId.has(s.workoutExerciseId)) {
        setsByExerciseId.set(s.workoutExerciseId, []);
      }
      setsByExerciseId.get(s.workoutExerciseId).push(s);
    }

    const populatedExercises = exercises.map((e) => ({
      ...e,
      sets: setsByExerciseId.get(e.id) || [],
    }));

    return {
      ...workout,
      exercises: populatedExercises,
    };
  }

  async listWorkoutsByUserId(userId, { limit = 20, offset = 0, status = 'completed' } = {}) {
    let condition = eq(workouts.userId, userId);
    if (status && status !== 'all') {
      condition = and(condition, eq(workouts.status, status));
    }

    const items = await db
      .select()
      .from(workouts)
      .where(condition)
      .orderBy(desc(workouts.startedAt))
      .limit(limit)
      .offset(offset);

    const [{ total }] = await db
      .select({ total: sql`count(*)::int` })
      .from(workouts)
      .where(condition);

    return { items, total };
  }

  async updateWorkout(id, userId, updates) {
    const [updated] = await db
      .update(workouts)
      .set(cleanData({ ...updates, updatedAt: new Date() }))
      .where(and(eq(workouts.id, id), eq(workouts.userId, userId)))
      .returning();
    return updated;
  }

  async addExerciseToWorkout(data) {
    const [created] = await db
      .insert(workoutExercises)
      .values(cleanData(data))
      .returning();
    return created;
  }

  async removeExerciseFromWorkout(workoutExerciseId, workoutId) {
    const [deleted] = await db
      .delete(workoutExercises)
      .where(and(eq(workoutExercises.id, workoutExerciseId), eq(workoutExercises.workoutId, workoutId)))
      .returning();
    return deleted;
  }

  async addSetToExercise(data) {
    const [created] = await db
      .insert(workoutSets)
      .values(cleanData(data))
      .returning();
    return created;
  }

  async findSetById(setId) {
    const [set] = await db
      .select()
      .from(workoutSets)
      .where(eq(workoutSets.id, setId))
      .limit(1);
    return set;
  }

  async findWorkoutExerciseById(workoutExerciseId) {
    const [ex] = await db
      .select()
      .from(workoutExercises)
      .where(eq(workoutExercises.id, workoutExerciseId))
      .limit(1);
    return ex;
  }

  async updateSet(setId, updates) {
    const [updated] = await db
      .update(workoutSets)
      .set(cleanData({ ...updates, updatedAt: new Date() }))
      .where(eq(workoutSets.id, setId))
      .returning();
    return updated;
  }

  async deleteSet(setId) {
    const [deleted] = await db
      .delete(workoutSets)
      .where(eq(workoutSets.id, setId))
      .returning();
    return deleted;
  }

  async getUserExerciseRecord(userId, exerciseId) {
    const [record] = await db
      .select()
      .from(userExerciseRecords)
      .where(and(eq(userExerciseRecords.userId, userId), eq(userExerciseRecords.exerciseId, exerciseId)))
      .limit(1);
    return record || null;
  }

  async upsertUserExerciseRecord(userId, exerciseId, data) {
    const [upserted] = await db
      .insert(userExerciseRecords)
      .values({
        userId,
        exerciseId,
        heaviestWeightKg: String(data.heaviestWeightKg || 0),
        bestEstimated1rmKg: String(data.bestEstimated1rmKg || 0),
        maxReps: data.maxReps || 0,
        bestSetVolumeKg: String(data.bestSetVolumeKg || 0),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [userExerciseRecords.userId, userExerciseRecords.exerciseId],
        set: {
          heaviestWeightKg: String(data.heaviestWeightKg || 0),
          bestEstimated1rmKg: String(data.bestEstimated1rmKg || 0),
          maxReps: data.maxReps || 0,
          bestSetVolumeKg: String(data.bestSetVolumeKg || 0),
          updatedAt: new Date(),
        },
      })
      .returning();
    return upserted;
  }

  async getExerciseHistory(userId, exerciseId) {
    const results = await db
      .select({
        workoutId: workouts.id,
        workoutTitle: workouts.title,
        completedAt: workouts.completedAt,
        startedAt: workouts.startedAt,
        setId: workoutSets.id,
        setNumber: workoutSets.setNumber,
        type: workoutSets.type,
        weight: workoutSets.weight,
        weightUnit: workoutSets.weightUnit,
        reps: workoutSets.reps,
        durationSeconds: workoutSets.durationSeconds,
        estimated1rmKg: workoutSets.estimated1rmKg,
        isPr: workoutSets.isPr,
        prTypes: workoutSets.prTypes,
      })
      .from(workoutSets)
      .innerJoin(workoutExercises, eq(workoutSets.workoutExerciseId, workoutExercises.id))
      .innerJoin(workouts, eq(workoutExercises.workoutId, workouts.id))
      .where(
        and(
          eq(workouts.userId, userId),
          eq(workoutExercises.exerciseId, exerciseId),
          eq(workoutSets.isCompleted, true),
          eq(workouts.status, 'completed'),
        )
      )
      .orderBy(desc(workouts.startedAt), workoutSets.setNumber);

    return results;
  }

  async getCompletedWorkoutsSince(userId, sinceDate) {
    return db
      .select()
      .from(workouts)
      .where(
        and(
          eq(workouts.userId, userId),
          eq(workouts.status, 'completed'),
          gte(workouts.startedAt, sinceDate)
        )
      )
      .orderBy(desc(workouts.startedAt));
  }

  async getAllCompletedWorkouts(userId) {
    return db
      .select()
      .from(workouts)
      .where(and(eq(workouts.userId, userId), eq(workouts.status, 'completed')))
      .orderBy(desc(workouts.startedAt));
  }
}

export const workoutRepository = new WorkoutRepository();
