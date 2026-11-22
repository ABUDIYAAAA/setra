import { routineRepository } from './routine.repository.js';
import { exerciseService } from '../exercises/exercise.service.js';
import { NotFoundError, BadRequestError } from '../../utils/errors.js';

export class RoutineService {
  constructor(repo = routineRepository, exerciseSvc = exerciseService) {
    this.routineRepository = repo;
    this.exerciseService = exerciseSvc;
  }

  async _validateExerciseIds(exercises) {
    await this.exerciseService.loadExercises();
    const validIds = new Set(this.exerciseService.exercises.map((e) => e.id));

    for (const ex of exercises) {
      if (!validIds.has(ex.exerciseId)) {
        throw new BadRequestError(
          `Exercise '${ex.exerciseId}' does not exist in the exercise library`,
          'INVALID_EXERCISE_ID'
        );
      }
    }
  }

  async createRoutine({ userId, title, description, exercises }) {
    if (!exercises || exercises.length === 0) {
      throw new BadRequestError('At least one exercise is required to create a routine', 'EMPTY_EXERCISES');
    }

    await this._validateExerciseIds(exercises);

    const newRoutine = await this.routineRepository.createRoutineWithExercises({
      userId,
      title,
      description,
      exercises,
    });

    return await this.getRoutineById(newRoutine.id, userId);
  }

  async getUserRoutines(userId) {
    await this.exerciseService.loadExercises();
    const userRoutines = await this.routineRepository.findUserRoutines(userId);
    const exerciseMap = new Map(this.exerciseService.exercises.map((e) => [e.id, e.name]));

    return userRoutines.map((routine) => {
      const exerciseList = routine.exercises || [];
      const totalSetsCount = exerciseList.reduce((acc, ex) => acc + (ex.sets?.length || 0), 0);
      const exerciseNames = exerciseList.map((ex) => exerciseMap.get(ex.exerciseId) || ex.exerciseId);

      return {
        id: routine.id,
        title: routine.title,
        description: routine.description || null,
        exerciseCount: exerciseList.length,
        totalSetsCount,
        exerciseNames,
        createdAt:
          routine.createdAt instanceof Date ? routine.createdAt.toISOString() : new Date(routine.createdAt).toISOString(),
        updatedAt:
          routine.updatedAt instanceof Date ? routine.updatedAt.toISOString() : new Date(routine.updatedAt).toISOString(),
      };
    });
  }

  async getRoutineById(routineId, userId) {
    await this.exerciseService.loadExercises();
    const routine = await this.routineRepository.findRoutineById(routineId, userId);

    if (!routine) {
      throw new NotFoundError(`Routine with ID '${routineId}' not found`, 'ROUTINE_NOT_FOUND');
    }

    const exerciseMap = new Map(this.exerciseService.exercises.map((e) => [e.id, e]));

    const hydratedExercises = (routine.exercises || []).map((ex) => {
      const catalog = exerciseMap.get(ex.exerciseId);
      return {
        exerciseId: ex.exerciseId,
        name: catalog?.name || ex.exerciseId,
        category: catalog?.category || 'strength',
        bodyPart: catalog?.bodyPart || 'other',
        equipment: catalog?.equipment || 'none',
        primaryMuscles: catalog?.primaryMuscles || [],
        images: catalog?.images || null,
        orderIndex: ex.orderIndex,
        restTimerSeconds: ex.restTimerSeconds ?? null,
        notes: ex.notes ?? null,
        sets: ex.sets || [],
      };
    });

    return {
      id: routine.id,
      userId: routine.userId,
      title: routine.title,
      description: routine.description || null,
      exercises: hydratedExercises,
      createdAt:
        routine.createdAt instanceof Date ? routine.createdAt.toISOString() : new Date(routine.createdAt).toISOString(),
      updatedAt:
        routine.updatedAt instanceof Date ? routine.updatedAt.toISOString() : new Date(routine.updatedAt).toISOString(),
    };
  }

  async updateRoutine({ routineId, userId, title, description, exercises }) {
    if (exercises !== undefined) {
      if (!Array.isArray(exercises) || exercises.length === 0) {
        throw new BadRequestError('A routine must contain at least 1 exercise', 'EMPTY_EXERCISES');
      }
      await this._validateExerciseIds(exercises);
    }

    const updated = await this.routineRepository.updateRoutine(routineId, userId, {
      title,
      description,
      exercises,
    });

    if (!updated) {
      throw new NotFoundError(`Routine with ID '${routineId}' not found`, 'ROUTINE_NOT_FOUND');
    }

    return await this.getRoutineById(routineId, userId);
  }

  async deleteRoutine(routineId, userId) {
    const deleted = await this.routineRepository.deleteRoutine(routineId, userId);
    if (!deleted) {
      throw new NotFoundError(`Routine with ID '${routineId}' not found`, 'ROUTINE_NOT_FOUND');
    }

    return { message: 'Routine deleted successfully' };
  }

  async duplicateRoutine(routineId, userId) {
    const routine = await this.routineRepository.findRoutineById(routineId, userId);
    if (!routine) {
      throw new NotFoundError(`Routine with ID '${routineId}' not found`, 'ROUTINE_NOT_FOUND');
    }

    const duplicateExercises = (routine.exercises || []).map((ex) => ({
      exerciseId: ex.exerciseId,
      orderIndex: ex.orderIndex,
      restTimerSeconds: ex.restTimerSeconds,
      notes: ex.notes,
      sets: ex.sets || [],
    }));

    return await this.createRoutine({
      userId,
      title: `${routine.title} (Copy)`,
      description: routine.description,
      exercises: duplicateExercises,
    });
  }
}

export const routineService = new RoutineService();
