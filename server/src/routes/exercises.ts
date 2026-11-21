import { Router } from "express";
import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import { imageUrls } from "../lib/exerciseImages.js";

const router = Router();

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

// Reads a query value only if it is a non-empty string
function text(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

// Reads a whole number from the query, clamped between min and max
function whole(value: unknown, fallback: number, min: number, max: number): number {
  const n = Number(text(value));
  if (!Number.isInteger(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}

// GET /api/exercises/filters  -> lists for the filter chips
// (must stay above "/:id" or "filters" would be treated as an id)
router.get("/filters", async (_req, res) => {
  try {
    const rows = await prisma.exercise.findMany({
      select: { primaryMuscles: true, equipment: true },
    });

    const muscles = new Set<string>();
    const equipment = new Set<string>();
    for (const row of rows) {
      row.primaryMuscles.forEach((m) => muscles.add(m));
      if (row.equipment) equipment.add(row.equipment);
    }

    res.json({
      muscles: [...muscles].sort(),
      equipment: [...equipment].sort(),
    });
  } catch (error) {
    console.error("GET /api/exercises/filters failed:", error);
    res.status(500).json({ error: "Could not load filters" });
  }
});

// GET /api/exercises?q=&muscle=&equipment=&limit=&offset=
router.get("/", async (req, res) => {
  try {
    const q = text(req.query.q);
    const muscle = text(req.query.muscle);
    const equipment = text(req.query.equipment);
    const limit = whole(req.query.limit, DEFAULT_LIMIT, 1, MAX_LIMIT);
    const offset = whole(req.query.offset, 0, 0, Number.MAX_SAFE_INTEGER);

    const where: Prisma.ExerciseWhereInput = {};

    // Every word typed must appear in the name ("bench press" matches "Barbell Bench Press")
    if (q) {
      where.AND = q
        .split(/\s+/)
        .map((word) => ({ name: { contains: word, mode: "insensitive" as const } }));
    }
    if (muscle) where.primaryMuscles = { has: muscle.toLowerCase() };
    if (equipment) where.equipment = { equals: equipment, mode: "insensitive" };

    const [total, rows] = await Promise.all([
      prisma.exercise.count({ where }),
      prisma.exercise.findMany({
        where,
        orderBy: [{ name: "asc" }, { id: "asc" }],
        take: limit,
        skip: offset,
        select: {
          id: true,
          name: true,
          equipment: true,
          category: true,
          level: true,
          primaryMuscles: true,
          images: true,
        },
      }),
    ]);

    const items = rows.map(({ images, ...exercise }) => ({
      ...exercise,
      image: imageUrls(exercise.id, images)[0] ?? null,
    }));

    res.json({ total, limit, offset, items });
  } catch (error) {
    console.error("GET /api/exercises failed:", error);
    res.status(500).json({ error: "Could not load exercises" });
  }
});

// GET /api/exercises/:id  -> full details
router.get("/:id", async (req, res) => {
  try {
    const exercise = await prisma.exercise.findUnique({
      where: { id: req.params.id },
    });

    if (!exercise) {
      res.status(404).json({ error: "Exercise not found" });
      return;
    }

    const images = imageUrls(exercise.id, exercise.images);
    res.json({ ...exercise, images, image: images[0] ?? null });
  } catch (error) {
    console.error("GET /api/exercises/:id failed:", error);
    res.status(500).json({ error: "Could not load exercise" });
  }
});

export default router;