import { z } from "zod";
import { isUuid } from "./routineShape.js";

export const MAX_EXERCISES_PER_WORKOUT = 40;
export const MAX_SETS_PER_EXERCISE = 30;

const uuid = z.string().refine(isUuid, "Invalid id");
const reps = z
  .number({ error: "Reps must be a number" })
  .int("Reps must be a whole number")
  .min(1, "Reps must be at least 1")
  .max(999, "Reps must be at most 999");
const weightKg = z
  .number({ error: "Weight must be a number" })
  .min(0, "Weight can't be negative")
  .max(2000, "Weight is too large")
  .transform((value) => Math.round(value * 100) / 100);

export const workoutStartSchema = z.object({
  routineId: uuid.optional(),
  name: z.string().trim().min(1).max(150).optional(),
});

export const workoutUpdateSchema = z.object({
  name: z.string({ error: "Name is required" }).trim().min(1, "Name is required").max(150).optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
});

export const workoutExerciseAddSchema = z.object({ exerciseId: z.string().min(1).max(100) });

export const workoutExerciseUpdateSchema = z.object({
  restSeconds: z.number().int().min(0).max(1800, "Rest can be at most 30 minutes").optional(),
  notes: z.string().trim().max(500).nullable().optional(),
});

export const workoutSetAddSchema = z.object({
  setType: z.enum(["NORMAL", "WARMUP", "DROP"]).optional(),
});

export const workoutSetUpdateSchema = z.object({
  weightKg: weightKg.nullable().optional(),
  reps: reps.nullable().optional(),
  isCompleted: z.boolean().optional(),
  setType: z.enum(["NORMAL", "WARMUP", "DROP"]).optional(),
  repMode: z.enum(["REPS", "RANGE"]).optional(),
  targetRepsMin: reps.nullable().optional(),
  targetRepsMax: reps.nullable().optional(),
});

export const workoutFinishSchema = z.object({ updateRoutine: z.boolean().default(true) });