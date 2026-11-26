import { pgTable, uuid, varchar, text, integer, numeric, boolean, timestamp, jsonb, unique } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users.js';
import { routines } from './routines.js';

// 1. Workouts Table
export const workouts = pgTable('workouts', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  routineId: uuid('routine_id').references(() => routines.id, { onDelete: 'set null' }),
  title: varchar('title', { length: 255 }).notNull(),
  status: varchar('status', { length: 32 }).notNull().default('in_progress'), // 'in_progress' | 'completed' | 'discarded'
  startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  durationSeconds: integer('duration_seconds').default(0),
  notes: text('notes'),
  totalVolumeKg: numeric('total_volume_kg', { precision: 10, scale: 2 }).default('0'),
  totalSetsCompleted: integer('total_sets_completed').default(0),
  muscleScores: jsonb('muscle_scores').default({}), // e.g. { chest: 4.5, triceps: 2.0 }
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 2. Workout Exercises Table
export const workoutExercises = pgTable('workout_exercises', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  workoutId: uuid('workout_id').notNull().references(() => workouts.id, { onDelete: 'cascade' }),
  exerciseId: varchar('exercise_id', { length: 128 }).notNull(),
  orderIndex: integer('order_index').notNull(),
  restTimerSeconds: integer('rest_timer_seconds'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 3. Workout Sets Table
export const workoutSets = pgTable('workout_sets', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  workoutExerciseId: uuid('workout_exercise_id').notNull().references(() => workoutExercises.id, { onDelete: 'cascade' }),
  setNumber: integer('set_number').notNull(),
  type: varchar('type', { length: 32 }).notNull().default('normal'), // 'warmup' | 'normal' | 'drop' | 'failure'
  weight: numeric('weight', { precision: 8, scale: 2 }),
  weightUnit: varchar('weight_unit', { length: 8 }).notNull().default('kg'),
  reps: integer('reps'),
  durationSeconds: integer('duration_seconds'),
  rpe: numeric('rpe', { precision: 3, scale: 1 }),
  isCompleted: boolean('is_completed').notNull().default(false),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  estimated1rmKg: numeric('estimated_1rm_kg', { precision: 8, scale: 2 }),
  isPr: boolean('is_pr').notNull().default(false),
  prTypes: jsonb('pr_types').default([]), // ['max_weight', 'estimated_1rm', 'max_reps', 'set_volume']
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 4. Personal Records (User Exercise Records) Table
export const userExerciseRecords = pgTable('user_exercise_records', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  exerciseId: varchar('exercise_id', { length: 128 }).notNull(),
  heaviestWeightKg: numeric('heaviest_weight_kg', { precision: 8, scale: 2 }).default('0'),
  bestEstimated1rmKg: numeric('best_estimated_1rm_kg', { precision: 8, scale: 2 }).default('0'),
  maxReps: integer('max_reps').default(0),
  bestSetVolumeKg: numeric('best_set_volume_kg', { precision: 10, scale: 2 }).default('0'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  userExerciseUnique: unique('user_exercise_unique').on(t.userId, t.exerciseId),
}));
