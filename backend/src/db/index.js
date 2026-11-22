import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '../config/env.js';
import * as usersSchema from './schema/users.js';
import * as refreshTokensSchema from './schema/refreshTokens.js';
import * as exercisesSchema from './schema/exercises.js';

export const schema = {
  ...usersSchema,
  ...refreshTokensSchema,
  ...exercisesSchema,
};

const queryClient = postgres(env.DATABASE_URL);
export const db = drizzle(queryClient, { schema });
