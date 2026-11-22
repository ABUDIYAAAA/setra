import { pgTable, varchar, text, jsonb, timestamp, boolean } from 'drizzle-orm/pg-core';

export const exercises = pgTable('exercises', {
  id: varchar('id', { length: 128 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 64 }).notNull(),
  bodyPart: varchar('body_part', { length: 64 }).notNull(),
  equipment: varchar('equipment', { length: 64 }).notNull(),
  forceType: varchar('force_type', { length: 64 }),
  mechanic: varchar('mechanic', { length: 64 }),
  difficulty: varchar('difficulty', { length: 64 }).notNull(),
  primaryMuscles: jsonb('primary_muscles').$type().notNull().default([]),
  secondaryMuscles: jsonb('secondary_muscles').$type().notNull().default([]),
  instructions: jsonb('instructions').$type().notNull().default([]),
  tips: jsonb('tips').$type().notNull().default([]),
  tags: jsonb('tags').$type().notNull().default([]),
  isUnilateral: boolean('is_unilateral').default(false).notNull(),
  isBodyweight: boolean('is_bodyweight').default(false).notNull(),
  images: jsonb('images'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
