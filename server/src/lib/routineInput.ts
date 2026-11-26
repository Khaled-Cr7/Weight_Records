import { z } from "zod";
import type { Prisma } from "../../generated/prisma/client.js";
import { isUuid } from "./routineShape.js";

// ---- Limits (keep one user from filling the database) ----
export const MAX_PROGRAMS_PER_USER = 50;
export const MAX_ROUTINES_PER_USER = 300;
const MAX_EXERCISES_PER_ROUTINE = 40;
const MAX_SETS_PER_EXERCISE = 30;

// ---- Building blocks ----
const name = z.string({ error: "Name is required" }).trim().min(1, "Name is required").max(150, "Name must be at most 150 characters");
const description = z.string().trim().max(1000, "Description must be at most 1000 characters").nullable().optional();
const uuid = z.string().refine(isUuid, "Invalid id");

// The pictures the app knows for programs (see mobile/lib/routineFormat.ts)
const imageKey = z.enum(["bench", "dumbell", "plates", "incline", "barbell"]).nullable().optional();

const reps = z
  .number({ error: "Enter reps as a number (a range needs both a minimum and a maximum)" })
  .int("Reps must be a whole number")
  .min(1, "Reps must be at least 1")
  .max(999, "Reps must be at most 999");

// Weights are kept in kg with at most 2 decimals
const weightKg = z
  .number({ error: "Weight must be a number" })
  .min(0, "Weight can't be negative")
  .max(2000, "Weight is too large")
  .transform((value) => Math.round(value * 100) / 100);

const setType = z.enum(["NORMAL", "WARMUP", "DROP"]).default("NORMAL");

// A set is either "REPS" (one target number, may be empty) or "RANGE" (min and max, both required)
const setSchema = z.discriminatedUnion("repMode", [
  z.object({
    repMode: z.literal("REPS"),
    setType,
    targetWeightKg: weightKg.nullable().optional(),
    targetReps: reps.nullable().optional(),
  }),
  z
    .object({
      repMode: z.literal("RANGE"),
      setType,
      targetWeightKg: weightKg.nullable().optional(),
      targetRepsMin: reps,
      targetRepsMax: reps,
    })
    .refine((set) => set.targetRepsMin <= set.targetRepsMax, {
      message: "Minimum reps can't be above maximum reps",
      path: ["targetRepsMin"],
    }),
]);

const exerciseSchema = z.object({
  exerciseId: z.string().min(1).max(100),
  notes: z.string().trim().max(500).nullable().optional(),
  restSeconds: z.number().int().min(0).max(1800, "Rest can be at most 30 minutes").optional(),
  sets: z
    .array(setSchema)
    .min(1, "Each exercise needs at least one set")
    .max(MAX_SETS_PER_EXERCISE, `An exercise can have at most ${MAX_SETS_PER_EXERCISE} sets`),
});

const exercises = z
  .array(exerciseSchema)
  .max(MAX_EXERCISES_PER_ROUTINE, `A routine can have at most ${MAX_EXERCISES_PER_ROUTINE} exercises`);

// ---- Request bodies ----
export const programCreateSchema = z.object({ name, description, imageKey });
export const programUpdateSchema = z.object({ name: name.optional(), description, imageKey });
export const routineOrderSchema = z.object({ routineIds: z.array(uuid).max(MAX_ROUTINES_PER_USER) });

export const routineCreateSchema = z.object({
  name,
  description,
  programId: uuid.nullable().optional(), // put the routine inside one of the user's own programs
  exercises: exercises.default([]),
});

// Only the fields that are sent change; "exercises" replaces the whole list of exercises and sets
export const routineUpdateSchema = z.object({ name: name.optional(), description, exercises: exercises.optional() });

export const routineCopySchema = z.object({ programId: uuid.nullable().optional() });

export type RoutineExerciseInput = z.infer<typeof exerciseSchema>;

// The message shown to the user for the first thing that is wrong
export function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid input";
}

// Empty text is stored as "nothing"
export function blankToNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

// Turns the exercises sent by the app into what Prisma needs to create them
export function toExerciseCreates(items: RoutineExerciseInput[]): Prisma.RoutineExerciseUncheckedCreateWithoutRoutineInput[] {
  return items.map((item, index) => ({
    exerciseId: item.exerciseId,
    sortOrder: index,
    notes: blankToNull(item.notes),
    ...(item.restSeconds !== undefined ? { restSeconds: item.restSeconds } : {}),
    sets: {
      create: item.sets.map((set, setIndex) => ({
        setOrder: setIndex + 1,
        setType: set.setType,
        targetWeightKg: set.targetWeightKg ?? null,
        repMode: set.repMode,
        targetReps: set.repMode === "REPS" ? (set.targetReps ?? null) : null,
        targetRepsMin: set.repMode === "RANGE" ? set.targetRepsMin : null,
        targetRepsMax: set.repMode === "RANGE" ? set.targetRepsMax : null,
      })),
    },
  }));
}