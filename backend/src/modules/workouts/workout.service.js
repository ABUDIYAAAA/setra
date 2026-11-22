import { workoutRepository } from './workout.repository.js';
import { routineRepository } from '../routines/routine.repository.js';
import { exerciseService } from '../exercises/exercise.service.js';
import { NotFoundError, BadRequestError } from '../../utils/errors.js';

export class WorkoutService {
  /**
   * Start a new workout, optionally pre-filled from an existing routine.
   */
  async startWorkout(userId, { routineId, title } = {}) {
    // If active workout exists, return it
    const existingActive = await workoutRepository.findActiveWorkoutByUserId(userId);
    if (existingActive) {
      return existingActive;
    }

    let workoutTitle = title?.trim() || 'Quick Workout';
    let exercisesToCreate = [];

    if (routineId) {
      const routine = await routineRepository.findRoutineById(routineId, userId);
      if (!routine) {
        throw new NotFoundError(`Routine with ID '${routineId}' not found`, 'ROUTINE_NOT_FOUND');
      }
      workoutTitle = title?.trim() || routine.title;
      exercisesToCreate = routine.exercises || [];
    }

    // 1. Create Workout
    const createdWorkout = await workoutRepository.createWorkout({
      userId,
      routineId: routineId || null,
      title: workoutTitle,
      status: 'in_progress',
      startedAt: new Date(),
    });

    // 2. Populate exercises & sets if starting from routine
    for (let i = 0; i < exercisesToCreate.length; i++) {
      const rEx = exercisesToCreate[i];
      const createdEx = await workoutRepository.addExerciseToWorkout({
        workoutId: createdWorkout.id,
        exerciseId: rEx.exerciseId,
        orderIndex: i,
        restTimerSeconds: rEx.restTimerSeconds ?? null,
        notes: rEx.notes || null,
      });

      const sets = rEx.sets || [];
      for (let s = 0; s < sets.length; s++) {
        const setItem = sets[s];
        await workoutRepository.addSetToExercise({
          workoutExerciseId: createdEx.id,
          setNumber: setItem.setNumber ?? s + 1,
          type: setItem.type || 'normal',
          weight: setItem.weight !== undefined && setItem.weight !== null ? String(setItem.weight) : null,
          weightUnit: setItem.weightUnit || 'kg',
          reps: setItem.reps ?? 10,
          durationSeconds: setItem.targetDurationSeconds ?? null,
          isCompleted: false,
        });
      }
    }

    return workoutRepository.findWorkoutById(createdWorkout.id, userId);
  }

  async getActiveWorkout(userId) {
    return workoutRepository.findActiveWorkoutByUserId(userId);
  }

  async getWorkoutById(id, userId) {
    const workout = await workoutRepository.findWorkoutById(id, userId);
    if (!workout) {
      throw new NotFoundError(`Workout with ID '${id}' not found`, 'WORKOUT_NOT_FOUND');
    }
    return workout;
  }

  async listWorkouts(userId, options) {
    return workoutRepository.listWorkoutsByUserId(userId, options);
  }

  async updateWorkout(id, userId, updates) {
    await this.getWorkoutById(id, userId);
    return workoutRepository.updateWorkout(id, userId, updates);
  }

  async addExerciseToWorkout(userId, workoutId, { exerciseId, orderIndex, restTimerSeconds, notes }) {
    const workout = await this.getWorkoutById(workoutId, userId);
    if (workout.status !== 'in_progress') {
      throw new BadRequestError('Cannot add exercises to a completed or discarded workout');
    }

    // Verify exercise exists
    await exerciseService.getExerciseById(exerciseId);

    const existingCount = workout.exercises?.length || 0;
    const finalOrder = orderIndex !== undefined ? orderIndex : existingCount;

    const createdExercise = await workoutRepository.addExerciseToWorkout({
      workoutId,
      exerciseId,
      orderIndex: finalOrder,
      restTimerSeconds: restTimerSeconds ?? null,
      notes: notes || null,
    });

    // Add 1 default empty working set
    const defaultSet = await workoutRepository.addSetToExercise({
      workoutExerciseId: createdExercise.id,
      setNumber: 1,
      type: 'normal',
      weight: null,
      weightUnit: 'kg',
      reps: 10,
      isCompleted: false,
    });

    return {
      ...createdExercise,
      sets: [defaultSet],
    };
  }

  async removeExerciseFromWorkout(userId, workoutId, workoutExerciseId) {
    const workout = await this.getWorkoutById(workoutId, userId);
    if (workout.status !== 'in_progress') {
      throw new BadRequestError('Cannot remove exercises from a completed or discarded workout');
    }
    return workoutRepository.removeExerciseFromWorkout(workoutExerciseId, workoutId);
  }

  async addSetToExercise(userId, workoutId, workoutExerciseId, setData) {
    const workout = await this.getWorkoutById(workoutId, userId);
    if (workout.status !== 'in_progress') {
      throw new BadRequestError('Cannot add sets to a completed or discarded workout');
    }

    const ex = workout.exercises?.find((e) => e.id === workoutExerciseId);
    if (!ex) {
      throw new NotFoundError('Workout exercise not found in this workout');
    }

    const nextSetNumber = (ex.sets?.length || 0) + 1;
    const lastSet = ex.sets?.[ex.sets.length - 1];

    const newSet = await workoutRepository.addSetToExercise({
      workoutExerciseId,
      setNumber: nextSetNumber,
      type: setData.type || 'normal',
      weight: setData.weight !== undefined ? String(setData.weight) : lastSet ? lastSet.weight : null,
      weightUnit: setData.weightUnit || lastSet?.weightUnit || 'kg',
      reps: setData.reps !== undefined ? setData.reps : lastSet ? lastSet.reps : 10,
      durationSeconds: setData.durationSeconds ?? null,
      rpe: setData.rpe ? String(setData.rpe) : null,
      isCompleted: false,
    });

    return newSet;
  }

  /**
   * Updates a set and performs REAL-TIME PR detection when marked completed!
   */
  async updateSet(userId, workoutId, setId, updates) {
    const workout = await this.getWorkoutById(workoutId, userId);
    if (workout.status !== 'in_progress') {
      throw new BadRequestError('Cannot edit sets in a completed or discarded workout');
    }

    const existingSet = await workoutRepository.findSetById(setId);
    if (!existingSet) {
      throw new NotFoundError(`Set with ID '${setId}' not found`);
    }

    const workoutExercise = await workoutRepository.findWorkoutExerciseById(existingSet.workoutExerciseId);
    if (!workoutExercise || workoutExercise.workoutId !== workoutId) {
      throw new BadRequestError('Set does not belong to this workout');
    }

    const exerciseId = workoutExercise.exerciseId;

    // Merge updates
    const finalType = updates.type !== undefined ? updates.type : existingSet.type;
    const finalWeight = updates.weight !== undefined ? updates.weight : (existingSet.weight ? Number(existingSet.weight) : null);
    const finalUnit = updates.weightUnit !== undefined ? updates.weightUnit : existingSet.weightUnit;
    const finalReps = updates.reps !== undefined ? updates.reps : existingSet.reps;
    const finalDuration = updates.durationSeconds !== undefined ? updates.durationSeconds : existingSet.durationSeconds;
    const finalRpe = updates.rpe !== undefined ? updates.rpe : existingSet.rpe;
    const finalCompleted = updates.isCompleted !== undefined ? updates.isCompleted : existingSet.isCompleted;

    // Normalized weight in KG
    let weightKg = null;
    if (finalWeight !== null && finalWeight !== undefined) {
      weightKg = finalUnit === 'lbs' ? finalWeight * 0.45359237 : finalWeight;
    }

    // Estimated 1RM via Epley formula
    let estimated1rmKg = null;
    if (weightKg !== null && weightKg > 0 && finalReps && finalReps > 0) {
      estimated1rmKg = finalReps === 1 ? weightKg : weightKg * (1 + finalReps / 30);
      estimated1rmKg = Math.round(estimated1rmKg * 100) / 100;
    }

    // PR Detection Engine (only for completed working sets)
    let isPr = false;
    const unlockedPrTypes = [];

    if (finalCompleted && finalType !== 'warmup' && weightKg !== null && weightKg > 0 && finalReps && finalReps > 0) {
      const currentRecord = await workoutRepository.getUserExerciseRecord(userId, exerciseId);
      const setVolumeKg = Math.round(weightKg * finalReps * 100) / 100;

      const prevHeaviest = currentRecord?.heaviestWeightKg ? Number(currentRecord.heaviestWeightKg) : 0;
      const prev1rm = currentRecord?.bestEstimated1rmKg ? Number(currentRecord.bestEstimated1rmKg) : 0;
      const prevMaxReps = currentRecord?.maxReps || 0;
      const prevVolume = currentRecord?.bestSetVolumeKg ? Number(currentRecord.bestSetVolumeKg) : 0;

      if (weightKg > prevHeaviest) {
        unlockedPrTypes.push('max_weight');
      }
      if (estimated1rmKg && estimated1rmKg > prev1rm) {
        unlockedPrTypes.push('estimated_1rm');
      }
      if (finalReps > prevMaxReps && weightKg >= prevHeaviest * 0.7) {
        unlockedPrTypes.push('max_reps');
      }
      if (setVolumeKg > prevVolume) {
        unlockedPrTypes.push('set_volume');
      }

      if (unlockedPrTypes.length > 0) {
        isPr = true;
        await workoutRepository.upsertUserExerciseRecord(userId, exerciseId, {
          heaviestWeightKg: Math.max(weightKg, prevHeaviest),
          bestEstimated1rmKg: Math.max(estimated1rmKg || 0, prev1rm),
          maxReps: Math.max(finalReps, prevMaxReps),
          bestSetVolumeKg: Math.max(setVolumeKg, prevVolume),
        });
      }
    }

    const setUpdates = {
      type: finalType,
      weight: finalWeight !== null ? String(finalWeight) : null,
      weightUnit: finalUnit,
      reps: finalReps,
      durationSeconds: finalDuration,
      rpe: finalRpe !== null && finalRpe !== undefined ? String(finalRpe) : null,
      isCompleted: finalCompleted,
      completedAt: finalCompleted ? (existingSet.completedAt || new Date()) : null,
      estimated1rmKg: estimated1rmKg !== null ? String(estimated1rmKg) : null,
      isPr,
      prTypes: unlockedPrTypes,
    };

    const updated = await workoutRepository.updateSet(setId, setUpdates);
    return {
      set: updated,
      newPrs: unlockedPrTypes,
    };
  }

  async deleteSet(userId, workoutId, setId) {
    const workout = await this.getWorkoutById(workoutId, userId);
    if (workout.status !== 'in_progress') {
      throw new BadRequestError('Cannot delete sets in a completed or discarded workout');
    }
    return workoutRepository.deleteSet(setId);
  }

  /**
   * Finalize the workout, calculating total volume, completed sets count, and muscle heatmap scores.
   */
  async finishWorkout(userId, workoutId, { durationSeconds, notes } = {}) {
    const workout = await this.getWorkoutById(workoutId, userId);
    if (workout.status !== 'in_progress') {
      throw new BadRequestError('This workout is not currently active');
    }

    const completedAt = new Date();
    const finalDuration = durationSeconds !== undefined
      ? durationSeconds
      : Math.max(0, Math.round((completedAt.getTime() - new Date(workout.startedAt).getTime()) / 1000));

    // Calculate totals & muscle engagement scores
    let totalVolumeKg = 0;
    let totalSetsCompleted = 0;
    const muscleScores = {};

    for (const ex of workout.exercises || []) {
      let catalogEx = null;
      try {
        catalogEx = await exerciseService.getExerciseById(ex.exerciseId);
      } catch {
        // Skip if catalog exercise details not found
      }

      for (const s of ex.sets || []) {
        if (!s.isCompleted) continue;
        totalSetsCompleted += 1;

        if (s.weight && s.reps) {
          const w = Number(s.weight);
          const wKg = s.weightUnit === 'lbs' ? w * 0.45359237 : w;
          totalVolumeKg += wKg * Number(s.reps);
        }

        // Set-weighted muscle heatmap
        if (catalogEx && s.type !== 'warmup') {
          // Primary muscles get 1.0 point
          for (const m of catalogEx.primaryMuscles || []) {
            muscleScores[m] = (muscleScores[m] || 0) + 1.0;
          }
          // Secondary muscles get 0.5 point
          for (const m of catalogEx.secondaryMuscles || []) {
            muscleScores[m] = (muscleScores[m] || 0) + 0.5;
          }
        }
      }
    }

    totalVolumeKg = Math.round(totalVolumeKg * 100) / 100;

    await workoutRepository.updateWorkout(workoutId, userId, {
      status: 'completed',
      completedAt,
      durationSeconds: finalDuration,
      notes: notes !== undefined ? notes : workout.notes,
      totalVolumeKg: String(totalVolumeKg),
      totalSetsCompleted,
      muscleScores,
    });

    return this.getWorkoutById(workoutId, userId);
  }

  async discardWorkout(userId, workoutId) {
    const workout = await this.getWorkoutById(workoutId, userId);
    if (workout.status !== 'in_progress') {
      throw new BadRequestError('Only active in-progress workouts can be discarded');
    }
    return workoutRepository.updateWorkout(workoutId, userId, {
      status: 'discarded',
      completedAt: new Date(),
    });
  }

  // --- ANALYTICS SUITE ---

  async getStreaks(userId) {
    const completed = await workoutRepository.getAllCompletedWorkouts(userId);

    if (completed.length === 0) {
      return {
        currentDayStreak: 0,
        bestDayStreak: 0,
        currentWeekStreak: 0,
        totalWorkouts: 0,
        totalVolumeKg: 0,
        totalDurationSeconds: 0,
      };
    }

    // Collect distinct dates in YYYY-MM-DD
    const dateSet = new Set();
    let totalVolume = 0;
    let totalDuration = 0;

    for (const w of completed) {
      const dStr = new Date(w.startedAt).toISOString().split('T')[0];
      dateSet.add(dStr);
      totalVolume += Number(w.totalVolumeKg || 0);
      totalDuration += Number(w.durationSeconds || 0);
    }

    const sortedDates = Array.from(dateSet).sort().reverse(); // newest to oldest

    // Calculate daily streak
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    let currentDayStreak = 0;
    let checkDate = new Date();

    // If worked out today or yesterday, streak is active
    if (dateSet.has(today)) {
      currentDayStreak = 1;
      checkDate = new Date(Date.now() - 86400000);
    } else if (dateSet.has(yesterday)) {
      currentDayStreak = 1;
      checkDate = new Date(Date.now() - 86400000 * 2);
    }

    if (currentDayStreak > 0) {
      while (true) {
        const checkStr = checkDate.toISOString().split('T')[0];
        if (dateSet.has(checkStr)) {
          currentDayStreak++;
          checkDate = new Date(checkDate.getTime() - 86400000);
        } else {
          break;
        }
      }
    }

    // Best daily streak
    let bestDayStreak = currentDayStreak;
    let tempStreak = 1;
    const ascendingDates = Array.from(dateSet).sort();
    for (let i = 1; i < ascendingDates.length; i++) {
      const prev = new Date(ascendingDates[i - 1]);
      const curr = new Date(ascendingDates[i]);
      const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000);
      if (diffDays === 1) {
        tempStreak++;
        if (tempStreak > bestDayStreak) bestDayStreak = tempStreak;
      } else {
        tempStreak = 1;
      }
    }

    // Weekly consistency streak (at least 1 workout per calendar week)
    const weekSet = new Set();
    for (const d of sortedDates) {
      const dt = new Date(d);
      const weekNumber = `${dt.getFullYear()}-W${Math.ceil((dt.getDate() + 6 - dt.getDay()) / 7)}`;
      weekSet.add(weekNumber);
    }

    return {
      currentDayStreak,
      bestDayStreak: Math.max(bestDayStreak, currentDayStreak),
      currentWeekStreak: weekSet.size,
      totalWorkouts: completed.length,
      totalVolumeKg: Math.round(totalVolume * 100) / 100,
      totalDurationSeconds: totalDuration,
    };
  }

  async getActivityCalendar(userId, { days = 90 } = {}) {
    const sinceDate = new Date(Date.now() - days * 86400000);
    const workouts = await workoutRepository.getCompletedWorkoutsSince(userId, sinceDate);

    const dayMap = new Map();
    for (const w of workouts) {
      const dateKey = new Date(w.startedAt).toISOString().split('T')[0];
      const existing = dayMap.get(dateKey) || {
        date: dateKey,
        count: 0,
        volumeKg: 0,
        durationSeconds: 0,
      };

      existing.count += 1;
      existing.volumeKg = Math.round((existing.volumeKg + Number(w.totalVolumeKg || 0)) * 100) / 100;
      existing.durationSeconds += Number(w.durationSeconds || 0);

      dayMap.set(dateKey, existing);
    }

    return Array.from(dayMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }

  async getMuscleHeatmap(userId, { period = '30d' } = {}) {
    let days = 30;
    if (period === '7d') days = 7;
    if (period === 'all') days = 3650; // ~10 years

    const sinceDate = new Date(Date.now() - days * 86400000);
    const workouts = await workoutRepository.getCompletedWorkoutsSince(userId, sinceDate);

    const aggregated = {};
    for (const w of workouts) {
      const scores = w.muscleScores || {};
      for (const [muscle, score] of Object.entries(scores)) {
        aggregated[muscle] = (aggregated[muscle] || 0) + Number(score);
      }
    }

    return {
      period,
      sinceDate: sinceDate.toISOString(),
      workoutCount: workouts.length,
      muscles: aggregated,
    };
  }

  async getExerciseHistory(userId, exerciseId) {
    await exerciseService.getExerciseById(exerciseId);
    const history = await workoutRepository.getExerciseHistory(userId, exerciseId);

    // Group by workout session for chart ease
    const sessionsMap = new Map();
    for (const row of history) {
      if (!sessionsMap.has(row.workoutId)) {
        sessionsMap.set(row.workoutId, {
          workoutId: row.workoutId,
          workoutTitle: row.workoutTitle,
          date: row.completedAt || row.startedAt,
          sets: [],
          heaviestWeightKg: 0,
          best1rmKg: 0,
          totalVolumeKg: 0,
        });
      }

      const session = sessionsMap.get(row.workoutId);
      const wKg = row.weight ? (row.weightUnit === 'lbs' ? Number(row.weight) * 0.45359237 : Number(row.weight)) : 0;
      const reps = row.reps || 0;
      const vol = wKg * reps;

      session.sets.push(row);
      if (wKg > session.heaviestWeightKg) session.heaviestWeightKg = wKg;
      if (row.estimated1rmKg && Number(row.estimated1rmKg) > session.best1rmKg) {
        session.best1rmKg = Number(row.estimated1rmKg);
      }
      session.totalVolumeKg = Math.round((session.totalVolumeKg + vol) * 100) / 100;
    }

    return {
      exerciseId,
      sessions: Array.from(sessionsMap.values()),
    };
  }

  async getExerciseRecords(userId, exerciseId) {
    await exerciseService.getExerciseById(exerciseId);
    const record = await workoutRepository.getUserExerciseRecord(userId, exerciseId);
    return record || {
      exerciseId,
      heaviestWeightKg: '0',
      bestEstimated1rmKg: '0',
      maxReps: 0,
      bestSetVolumeKg: '0',
    };
  }
}

export const workoutService = new WorkoutService();
