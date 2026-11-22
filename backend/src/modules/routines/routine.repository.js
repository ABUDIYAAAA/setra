import { eq, and, desc, asc } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { routines, routineExercises } from '../../db/schema/routines.js';

export class RoutineRepository {
  async createRoutineWithExercises({ userId, title, description, exercises }) {
    return await db.transaction(async (tx) => {
      // 1. Insert routine
      const [newRoutine] = await tx
        .insert(routines)
        .values({
          userId,
          title,
          description: description || null,
        })
        .returning();

      // 2. Insert exercises
      if (exercises && exercises.length > 0) {
        const exercisesToInsert = exercises.map((ex, idx) => ({
          routineId: newRoutine.id,
          exerciseId: ex.exerciseId,
          orderIndex: ex.orderIndex !== undefined ? ex.orderIndex : idx,
          restTimerSeconds: ex.restTimerSeconds !== undefined ? ex.restTimerSeconds : null,
          notes: ex.notes || null,
          sets: ex.sets || [],
        }));

        await tx.insert(routineExercises).values(exercisesToInsert);
      }

      return newRoutine;
    });
  }

  async findUserRoutines(userId) {
    const userRoutines = await db
      .select()
      .from(routines)
      .where(eq(routines.userId, userId))
      .orderBy(desc(routines.updatedAt));

    if (userRoutines.length === 0) return [];

    // Fetch exercises for each routine
    const routineIds = userRoutines.map((r) => r.id);
    const allExercises = await db
      .select()
      .from(routineExercises)
      .orderBy(asc(routineExercises.orderIndex));

    const exercisesByRoutine = new Map();
    for (const ex of allExercises) {
      if (routineIds.includes(ex.routineId)) {
        if (!exercisesByRoutine.has(ex.routineId)) {
          exercisesByRoutine.set(ex.routineId, []);
        }
        exercisesByRoutine.get(ex.routineId).push(ex);
      }
    }

    return userRoutines.map((routine) => ({
      ...routine,
      exercises: exercisesByRoutine.get(routine.id) || [],
    }));
  }

  async findRoutineById(routineId, userId) {
    const [routine] = await db
      .select()
      .from(routines)
      .where(and(eq(routines.id, routineId), eq(routines.userId, userId)))
      .limit(1);

    if (!routine) return null;

    const exercises = await db
      .select()
      .from(routineExercises)
      .where(eq(routineExercises.routineId, routine.id))
      .orderBy(asc(routineExercises.orderIndex));

    return {
      ...routine,
      exercises,
    };
  }

  async updateRoutine(routineId, userId, { title, description, exercises }) {
    return await db.transaction(async (tx) => {
      // 1. Update routine details
      const updatePayload = { updatedAt: new Date() };
      if (title !== undefined) updatePayload.title = title;
      if (description !== undefined) updatePayload.description = description;

      const [updated] = await tx
        .update(routines)
        .set(updatePayload)
        .where(and(eq(routines.id, routineId), eq(routines.userId, userId)))
        .returning();

      if (!updated) return null;

      // 2. If exercises array provided, replace existing exercises
      if (exercises !== undefined) {
        await tx.delete(routineExercises).where(eq(routineExercises.routineId, routineId));

        if (exercises.length > 0) {
          const exercisesToInsert = exercises.map((ex, idx) => ({
            routineId: routineId,
            exerciseId: ex.exerciseId,
            orderIndex: ex.orderIndex !== undefined ? ex.orderIndex : idx,
            restTimerSeconds: ex.restTimerSeconds !== undefined ? ex.restTimerSeconds : null,
            notes: ex.notes || null,
            sets: ex.sets || [],
          }));

          await tx.insert(routineExercises).values(exercisesToInsert);
        }
      }

      return updated;
    });
  }

  async deleteRoutine(routineId, userId) {
    const [deleted] = await db
      .delete(routines)
      .where(and(eq(routines.id, routineId), eq(routines.userId, userId)))
      .returning();

    return Boolean(deleted);
  }
}

export const routineRepository = new RoutineRepository();
