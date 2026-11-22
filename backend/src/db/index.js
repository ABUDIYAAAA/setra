import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '../config/env.js';
import * as usersSchema from './schema/users.js';
import * as refreshTokensSchema from './schema/refreshTokens.js';
import * as exercisesSchema from './schema/exercises.js';
import * as routinesSchema from './schema/routines.js';
import * as workoutsSchema from './schema/workouts.js';

export const schema = {
  ...usersSchema,
  ...refreshTokensSchema,
  ...exercisesSchema,
  ...routinesSchema,
  ...workoutsSchema,
};

const queryClient = postgres(env.DATABASE_URL);
export const db = drizzle(queryClient, { schema });
