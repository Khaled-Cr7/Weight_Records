import type { Prisma } from "../../generated/prisma/client.js";
import { imageUrls } from "./exerciseImages.js";
import { prisma } from "./prisma.js";

// A workout with all its exercises and sets
export const workoutDetailSelect = {
  id: true,
  name: true,
  status: true,
  notes: true,
  sourceRoutineId: true,
  startedAt: true,
  finishedAt: true,
  durationSeconds: true,
  routineUpdatedAt: true,
  exercises: {
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      sortOrder: true,
      notes: true,
      restSeconds: true,
      exercise: {
        select: { id: true, name: true, equipment: true, primaryMuscles: true, images: true },
      },
      sets: {
        orderBy: { setOrder: "asc" },
        select: {
          id: true,
          setOrder: true,
          setType: true,
          repMode: true,
          targetRepsMin: true,
          targetRepsMax: true,
          weightKg: true,
          reps: true,
          isCompleted: true,
          sourceRoutineSet: { select: { targetWeightKg: true, targetReps: true } },
        },
      },
    },
  },
} satisfies Prisma.WorkoutSessionSelect;

export type WorkoutRow = Prisma.WorkoutSessionGetPayload<{ select: typeof workoutDetailSelect }>;

type Numberish = { toString(): string } | null;
const toNumber = (value: Numberish) => (value === null ? null : Number(value));

type PreviousSet = { setType: string; weightKg: number | null; reps: number | null };

// For every exercise: the sets from the user's most recent earlier finished workout with that exercise
async function loadPrevious(
  userId: string,
  workout: WorkoutRow,
): Promise<Map<string, PreviousSet[]>> {
  const exerciseIds = [...new Set(workout.exercises.map((item) => item.exercise.id))];
  const result = new Map<string, PreviousSet[]>();
  if (exerciseIds.length === 0) return result;

  const rows = await prisma.sessionExercise.findMany({
    where: {
      exerciseId: { in: exerciseIds },
      session: { userId, status: "COMPLETED", id: { not: workout.id }, startedAt: { lt: workout.startedAt } },
    },
    distinct: ["exerciseId"],
    orderBy: [{ exerciseId: "asc" }, { session: { startedAt: "desc" } }],
    select: {
      exerciseId: true,
      sets: {
        where: { isCompleted: true },
        orderBy: { setOrder: "asc" },
        select: { setType: true, weightKg: true, reps: true },
      },
    },
  });

  for (const row of rows) {
    result.set(
      row.exerciseId,
      row.sets.map((set) => ({ setType: set.setType, weightKg: toNumber(set.weightKg), reps: set.reps })),
    );
  }
  return result;
}

// Turns database rows into what the app receives. Each set also carries:
//   previous    - what the user did last time for this kind of set (same type, same position)
//   placeholder - what to show in the empty boxes (last time's weight, or the routine's planned weight)
export async function toWorkoutDetail(userId: string, workout: WorkoutRow) {
  const previousByExercise = await loadPrevious(userId, workout);

  return {
    id: workout.id,
    name: workout.name,
    status: workout.status,
    notes: workout.notes,
    sourceRoutineId: workout.sourceRoutineId,
    startedAt: workout.startedAt,
    finishedAt: workout.finishedAt,
    durationSeconds: workout.durationSeconds,
    routineUpdatedAt: workout.routineUpdatedAt,
    exercises: workout.exercises.map((item) => {
      const previousSets = previousByExercise.get(item.exercise.id) ?? [];
      const seenOfType: Record<string, number> = {};

      return {
        id: item.id,
        sortOrder: item.sortOrder,
        notes: item.notes,
        restSeconds: item.restSeconds,
        exercise: {
          id: item.exercise.id,
          name: item.exercise.name,
          equipment: item.exercise.equipment,
          primaryMuscles: item.exercise.primaryMuscles,
          image: imageUrls(item.exercise.id, item.exercise.images)[0] ?? null,
        },
        sets: item.sets.map((set) => {
          const position = seenOfType[set.setType] ?? 0;
          seenOfType[set.setType] = position + 1;

          const ofSameType = previousSets.filter((previous) => previous.setType === set.setType);
          const previous = ofSameType[position] ?? null;
          const plannedWeight = toNumber(set.sourceRoutineSet?.targetWeightKg ?? null);
          const plannedReps = set.sourceRoutineSet?.targetReps ?? null;

          return {
            id: set.id,
            setOrder: set.setOrder,
            setType: set.setType,
            repMode: set.repMode,
            targetRepsMin: set.targetRepsMin,
            targetRepsMax: set.targetRepsMax,
            weightKg: toNumber(set.weightKg),
            reps: set.reps,
            isCompleted: set.isCompleted,
            previous: previous ? { weightKg: previous.weightKg, reps: previous.reps } : null,
            placeholder: {
              weightKg: previous?.weightKg ?? plannedWeight,
              // A range always shows the range itself; fixed reps show last time's reps (or the planned reps)
              reps: set.repMode === "REPS" ? (previous?.reps ?? plannedReps) : null,
            },
          };
        }),
      };
    }),
  };
}

// Just the fields of one set (returned after a single edit)
export function toSetShape(set: {
  id: string;
  setOrder: number;
  setType: string;
  repMode: string;
  targetRepsMin: number | null;
  targetRepsMax: number | null;
  weightKg: Numberish;
  reps: number | null;
  isCompleted: boolean;
}) {
  return {
    id: set.id,
    setOrder: set.setOrder,
    setType: set.setType,
    repMode: set.repMode,
    targetRepsMin: set.targetRepsMin,
    targetRepsMax: set.targetRepsMax,
    weightKg: toNumber(set.weightKg),
    reps: set.reps,
    isCompleted: set.isCompleted,
  };
}