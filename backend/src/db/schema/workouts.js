import { sqliteTable, text, integer, unique } from 'drizzle-orm/sqlite-core';
import { users } from './users.js';
import { routines } from './routines.js';

// 1. Workouts Table
export const workouts = sqliteTable('workouts', {
  id: text('id').$defaultFn(() => crypto.randomUUID()).primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  routineId: text('routine_id').references(() => routines.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  status: text('status').notNull().default('in_progress'), // 'in_progress' | 'completed' | 'discarded'
  startedAt: integer('started_at', { mode: 'timestamp_ms' }).$defaultFn(() => new Date()).notNull(),
  completedAt: integer('completed_at', { mode: 'timestamp_ms' }),
  durationSeconds: integer('duration_seconds').default(0),
  notes: text('notes'),
  totalVolumeKg: text('total_volume_kg').default('0'),
  totalSetsCompleted: integer('total_sets_completed').default(0),
  muscleScores: text('muscle_scores', { mode: 'json' }).default({}), // e.g. { chest: 4.5, triceps: 2.0 }
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).$defaultFn(() => new Date()).notNull(),
});

// 2. Workout Exercises Table
export const workoutExercises = sqliteTable('workout_exercises', {
  id: text('id').$defaultFn(() => crypto.randomUUID()).primaryKey(),
  workoutId: text('workout_id').notNull().references(() => workouts.id, { onDelete: 'cascade' }),
  exerciseId: text('exercise_id').notNull(),
  orderIndex: integer('order_index').notNull(),
  restTimerSeconds: integer('rest_timer_seconds'),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).$defaultFn(() => new Date()).notNull(),
});

// 3. Workout Sets Table
export const workoutSets = sqliteTable('workout_sets', {
  id: text('id').$defaultFn(() => crypto.randomUUID()).primaryKey(),
  workoutExerciseId: text('workout_exercise_id').notNull().references(() => workoutExercises.id, { onDelete: 'cascade' }),
  setNumber: integer('set_number').notNull(),
  type: text('type').notNull().default('normal'), // 'warmup' | 'normal' | 'drop' | 'failure'
  weight: text('weight'),
  weightUnit: text('weight_unit').notNull().default('kg'),
  reps: integer('reps'),
  durationSeconds: integer('duration_seconds'),
  rpe: text('rpe'),
  isCompleted: integer('is_completed', { mode: 'boolean' }).notNull().default(false),
  completedAt: integer('completed_at', { mode: 'timestamp_ms' }),
  estimated1rmKg: text('estimated_1rm_kg'),
  isPr: integer('is_pr', { mode: 'boolean' }).notNull().default(false),
  prTypes: text('pr_types', { mode: 'json' }).default([]), // ['max_weight', 'estimated_1rm', 'max_reps', 'set_volume']
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).$defaultFn(() => new Date()).notNull(),
});

// 4. Personal Records (User Exercise Records) Table
export const userExerciseRecords = sqliteTable('user_exercise_records', {
  id: text('id').$defaultFn(() => crypto.randomUUID()).primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  exerciseId: text('exercise_id').notNull(),
  heaviestWeightKg: text('heaviest_weight_kg').default('0'),
  bestEstimated1rmKg: text('best_estimated_1rm_kg').default('0'),
  maxReps: integer('max_reps').default(0),
  bestSetVolumeKg: text('best_set_volume_kg').default('0'),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).$defaultFn(() => new Date()).notNull(),
}, (t) => [
  unique('user_exercise_unique').on(t.userId, t.exerciseId),
]);
