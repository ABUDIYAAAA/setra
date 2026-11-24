import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { users } from './users.js';

export const routines = sqliteTable('routines', {
  id: text('id').$defaultFn(() => crypto.randomUUID()).primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).$defaultFn(() => new Date()).notNull(),
});

export const routineExercises = sqliteTable('routine_exercises', {
  id: text('id').$defaultFn(() => crypto.randomUUID()).primaryKey(),
  routineId: text('routine_id').notNull().references(() => routines.id, { onDelete: 'cascade' }),
  exerciseId: text('exercise_id').notNull(),
  orderIndex: integer('order_index').notNull(),
  restTimerSeconds: integer('rest_timer_seconds'),
  notes: text('notes'),
  sets: text('sets', { mode: 'json' }).$type().notNull().default([]),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).$defaultFn(() => new Date()).notNull(),
});
