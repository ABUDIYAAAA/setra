import { eq, ilike, and, sql, asc, or } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { exercises } from '../../db/schema/exercises.js';

export class ExerciseRepository {
  async getCount() {
    const [result] = await db.select({ count: sql`count(*)` }).from(exercises);
    return Number(result?.count || 0);
  }

  buildFilters({ search, category, bodyPart, equipment, difficulty, mechanic, isBodyweight }) {
    const conditions = [];

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      conditions.push(
        or(
          ilike(exercises.name, term),
          ilike(exercises.id, term),
          ilike(exercises.bodyPart, term),
          ilike(exercises.equipment, term)
        )
      );
    }

    if (category) {
      conditions.push(eq(exercises.category, category.toLowerCase()));
    }

    if (bodyPart) {
      conditions.push(eq(exercises.bodyPart, bodyPart.toLowerCase()));
    }

    if (equipment) {
      conditions.push(eq(exercises.equipment, equipment.toLowerCase()));
    }

    if (difficulty) {
      conditions.push(eq(exercises.difficulty, difficulty.toLowerCase()));
    }

    if (mechanic) {
      conditions.push(eq(exercises.mechanic, mechanic.toLowerCase()));
    }

    if (isBodyweight !== undefined) {
      conditions.push(eq(exercises.isBodyweight, isBodyweight === 'true' || isBodyweight === true));
    }

    return conditions.length > 0 ? and(...conditions) : undefined;
  }

  async findMany(filters = {}, { limit = 50, offset = 0 } = {}) {
    const where = this.buildFilters(filters);
    const query = db
      .select()
      .from(exercises)
      .where(where)
      .orderBy(asc(exercises.name))
      .limit(limit)
      .offset(offset);

    return await query;
  }

  async countFiltered(filters = {}) {
    const where = this.buildFilters(filters);
    const [result] = await db
      .select({ count: sql`count(*)` })
      .from(exercises)
      .where(where);
    return Number(result?.count || 0);
  }

  async findById(id) {
    const [exercise] = await db
      .select()
      .from(exercises)
      .where(eq(exercises.id, id))
      .limit(1);
    return exercise || null;
  }

  async batchUpsert(items) {
    if (!items || items.length === 0) return;
    await db
      .insert(exercises)
      .values(items)
      .onConflictDoUpdate({
        target: exercises.id,
        set: {
          name: sql`excluded.name`,
          description: sql`excluded.description`,
          category: sql`excluded.category`,
          bodyPart: sql`excluded.body_part`,
          equipment: sql`excluded.equipment`,
          forceType: sql`excluded.force_type`,
          mechanic: sql`excluded.mechanic`,
          difficulty: sql`excluded.difficulty`,
          primaryMuscles: sql`excluded.primary_muscles`,
          secondaryMuscles: sql`excluded.secondary_muscles`,
          instructions: sql`excluded.instructions`,
          tips: sql`excluded.tips`,
          tags: sql`excluded.tags`,
          isUnilateral: sql`excluded.is_unilateral`,
          isBodyweight: sql`excluded.is_bodyweight`,
          images: sql`excluded.images`,
          updatedAt: new Date(),
        },
      });
  }

  async getFilterMetadata() {
    const rows = await db
      .select({
        category: exercises.category,
        bodyPart: exercises.bodyPart,
        equipment: exercises.equipment,
        difficulty: exercises.difficulty,
        mechanic: exercises.mechanic,
        primaryMuscles: exercises.primaryMuscles,
      })
      .from(exercises);

    const categories = new Set();
    const bodyParts = new Set();
    const equipments = new Set();
    const difficulties = new Set();
    const mechanics = new Set();
    const primaryMuscles = new Set();

    for (const r of rows) {
      if (r.category) categories.add(r.category);
      if (r.bodyPart) bodyParts.add(r.bodyPart);
      if (r.equipment) equipments.add(r.equipment);
      if (r.difficulty) difficulties.add(r.difficulty);
      if (r.mechanic) mechanics.add(r.mechanic);
      if (Array.isArray(r.primaryMuscles)) {
        r.primaryMuscles.forEach((m) => primaryMuscles.add(m));
      }
    }

    return {
      categories: Array.from(categories).sort(),
      bodyParts: Array.from(bodyParts).sort(),
      equipments: Array.from(equipments).sort(),
      difficulties: Array.from(difficulties).sort(),
      mechanics: Array.from(mechanics).sort(),
      primaryMuscles: Array.from(primaryMuscles).sort(),
    };
  }
}

export const exerciseRepository = new ExerciseRepository();
