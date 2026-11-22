import fs from "node:fs/promises";
import path from "node:path";
import { NotFoundError } from "../../utils/errors.js";

export class ExerciseService {
  constructor() {
    this.exercises = [];
    this.metadata = null;
    this.isLoaded = false;
  }

  async loadExercises() {
    if (this.isLoaded) return;
    try {
      let filePath = path.resolve(process.cwd(), "exercises.json");
      try {
        await fs.access(filePath);
      } catch {
        filePath = path.resolve(process.cwd(), "backend", "exercises.json");
      }
      const fileData = await fs.readFile(filePath, "utf-8");
      const parsed = JSON.parse(fileData);
      const rawList = parsed.exercises || [];

      this.exercises = rawList.map((ex) => ({
        id: ex.id,
        name: ex.name_en,
        description: ex.description_en || null,
        category: ex.category || "strength",
        bodyPart: ex.body_part,
        equipment: ex.equipment || (ex.is_bodyweight ? "bodyweight" : "none"),
        forceType: ex.force_type || null,
        mechanic: ex.mechanic || null,
        difficulty: ex.difficulty || "beginner",
        primaryMuscles: ex.primary_muscles || [],
        secondaryMuscles: ex.secondary_muscles || [],
        instructions: ex.instructions_en || [],
        tips: ex.tips_en || [],
        tags: ex.tags || [],
        isUnilateral: Boolean(ex.is_unilateral),
        isBodyweight: Boolean(ex.is_bodyweight),
        images: ex.images || null,
      }));

      // Pre-compute filter metadata
      const categories = new Set();
      const bodyParts = new Set();
      const equipments = new Set();
      const difficulties = new Set();
      const mechanics = new Set();
      const primaryMuscles = new Set();

      for (const ex of this.exercises) {
        if (ex.category) categories.add(ex.category);
        if (ex.bodyPart) bodyParts.add(ex.bodyPart);
        if (ex.equipment) equipments.add(ex.equipment);
        if (ex.difficulty) difficulties.add(ex.difficulty);
        if (ex.mechanic) mechanics.add(ex.mechanic);
        if (Array.isArray(ex.primaryMuscles)) {
          ex.primaryMuscles.forEach((m) => primaryMuscles.add(m));
        }
      }

      this.metadata = {
        categories: Array.from(categories).sort(),
        bodyParts: Array.from(bodyParts).sort(),
        equipments: Array.from(equipments).sort(),
        difficulties: Array.from(difficulties).sort(),
        mechanics: Array.from(mechanics).sort(),
        primaryMuscles: Array.from(primaryMuscles).sort(),
      };

      this.isLoaded = true;
      console.log(
        ` Loaded ${this.exercises.length} exercises into memory at runtime.`,
      );
    } catch (err) {
      console.error("❌ Failed to load exercises.json at runtime:", err);
    }
  }

  async getExercises(queryParams = {}) {
    await this.loadExercises();

    const {
      search,
      category,
      bodyPart,
      equipment,
      difficulty,
      mechanic,
      isBodyweight,
      limit = 50,
      offset = 0,
    } = queryParams;

    let filtered = this.exercises;

    if (search && search.trim()) {
      const term = search.trim().toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.name.toLowerCase().includes(term) ||
          e.id.toLowerCase().includes(term) ||
          e.bodyPart.toLowerCase().includes(term) ||
          e.equipment.toLowerCase().includes(term),
      );
    }

    if (category) {
      const cat = category.toLowerCase();
      filtered = filtered.filter((e) => e.category.toLowerCase() === cat);
    }

    if (bodyPart) {
      const bp = bodyPart.toLowerCase();
      filtered = filtered.filter((e) => e.bodyPart.toLowerCase() === bp);
    }

    if (equipment) {
      const eq = equipment.toLowerCase();
      filtered = filtered.filter((e) => e.equipment.toLowerCase() === eq);
    }

    if (difficulty) {
      const diff = difficulty.toLowerCase();
      filtered = filtered.filter((e) => e.difficulty.toLowerCase() === diff);
    }

    if (mechanic) {
      const mech = mechanic.toLowerCase();
      filtered = filtered.filter(
        (e) => e.mechanic && e.mechanic.toLowerCase() === mech,
      );
    }

    if (isBodyweight !== undefined) {
      const isBw = isBodyweight === "true" || isBodyweight === true;
      filtered = filtered.filter((e) => e.isBodyweight === isBw);
    }

    const total = filtered.length;
    const paginated = filtered.slice(offset, offset + limit);

    return {
      items: paginated,
      meta: {
        total,
        limit,
        offset,
        count: paginated.length,
      },
    };
  }

  async getExerciseById(id) {
    await this.loadExercises();
    const exercise = this.exercises.find((e) => e.id === id);
    if (!exercise) {
      throw new NotFoundError(
        `Exercise with ID '${id}' not found`,
        "EXERCISE_NOT_FOUND",
      );
    }
    return exercise;
  }

  async getFilterMetadata() {
    await this.loadExercises();
    return this.metadata;
  }
}

export const exerciseService = new ExerciseService();
