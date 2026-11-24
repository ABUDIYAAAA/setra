import { drizzle } from 'drizzle-orm/d1';
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

/**
 * Create a Drizzle ORM instance bound to a Cloudflare D1 database binding.
 * @param {D1Database} d1
 */
export function createDb(d1) {
  return drizzle(d1, { schema });
}
