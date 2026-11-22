import { pgTable, uuid, text, varchar, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  googleId: varchar('google_id', { length: 255 }).unique(),
  name: text('name').notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  avatarUrl: text('avatar_url'),
  passwordHash: text('password_hash'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
