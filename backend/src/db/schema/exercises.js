import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const exercises = sqliteTable('exercises', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  category: text('category').notNull(),
  bodyPart: text('body_part').notNull(),
  equipment: text('equipment').notNull(),
  forceType: text('force_type'),
  mechanic: text('mechanic'),
  difficulty: text('difficulty').notNull(),
  primaryMuscles: text('primary_muscles', { mode: 'json' }).$type().notNull().default([]),
  secondaryMuscles: text('secondary_muscles', { mode: 'json' }).$type().notNull().default([]),
  instructions: text('instructions', { mode: 'json' }).$type().notNull().default([]),
  tips: text('tips', { mode: 'json' }).$type().notNull().default([]),
  tags: text('tags', { mode: 'json' }).$type().notNull().default([]),
  isUnilateral: integer('is_unilateral', { mode: 'boolean' }).default(false).notNull(),
  isBodyweight: integer('is_bodyweight', { mode: 'boolean' }).default(false).notNull(),
  images: text('images', { mode: 'json' }),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).$defaultFn(() => new Date()).notNull(),
});
