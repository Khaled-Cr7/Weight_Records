import type { Prisma } from "../../generated/prisma/client.js";
import { imageUrls } from "./exerciseImages.js";

// A routine with all its exercises and sets (used by the program and routine endpoints)
export const routineDetailSelect = {
  id: true,
  name: true,
  description: true,
  imageKey: true,
  programId: true,
  sortOrder: true,
  updatedAt: true,
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
          targetWeightKg: true,
          repMode: true,
          targetReps: true,
          targetRepsMin: true,
          targetRepsMax: true,
        },
      },
    },
  },
} satisfies Prisma.RoutineSelect;

type RoutineRow = Prisma.RoutineGetPayload<{ select: typeof routineDetailSelect }>;

// Turns database rows into what the app receives (full image URL, weight as a number)
export function toRoutineDetail(row: RoutineRow) {
  return {
    ...row,
    exercises: row.exercises.map(({ exercise, sets, ...rest }) => ({
      ...rest,
      exercise: {
        id: exercise.id,
        name: exercise.name,
        equipment: exercise.equipment,
        primaryMuscles: exercise.primaryMuscles,
        image: imageUrls(exercise.id, exercise.images)[0] ?? null,
      },
      sets: sets.map((set) => ({
        ...set,
        targetWeightKg: set.targetWeightKg === null ? null : Number(set.targetWeightKg),
      })),
    })),
  };
}

// Ids that are not UUIDs would make the database throw, so check first
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isUuid(value: string): boolean {
  return UUID.test(value);
}