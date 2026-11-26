import type { Prisma } from "../../generated/prisma/client.js";
import { imageUrls } from "./exerciseImages.js";

// A routine with all its exercises and sets (used by the program and routine endpoints)
export const routineDetailSelect = {
  id: true,
  name: true,
  description: true,
  imageKey: true,
  programId: true,
  ownerId: true,
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
  const { ownerId, ...routine } = row;
  return {
    ...routine,
    isReadyMade: ownerId === null,
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

// ---- Programs ----

// A program with all its routines (used by the program endpoints)
export const programDetailSelect = {
  id: true,
  name: true,
  description: true,
  imageKey: true,
  ownerId: true,
  routines: {
    where: { deletedAt: null },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: routineDetailSelect,
  },
} satisfies Prisma.ProgramSelect;

type ProgramRow = Prisma.ProgramGetPayload<{ select: typeof programDetailSelect }>;

// The program as the app receives it: "isReadyMade" instead of the owner id
export function toProgramDetail(row: ProgramRow) {
  const { ownerId, routines, ...rest } = row;
  return { ...rest, isReadyMade: ownerId === null, routines: routines.map(toRoutineDetail) };
}

// ---- Copying ----

// Everything needed to copy a routine (no ids, so the copy gets its own)
export const routineCopySelect = {
  name: true,
  description: true,
  imageKey: true,
  exercises: {
    orderBy: { sortOrder: "asc" },
    select: {
      exerciseId: true,
      notes: true,
      restSeconds: true,
      sets: {
        orderBy: { setOrder: "asc" },
        select: {
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

export type RoutineCopyRow = Prisma.RoutineGetPayload<{ select: typeof routineCopySelect }>;

// A copy of a routine, owned by the user, ready for a nested "create"
export function toRoutineCopyCreate(
  routine: RoutineCopyRow,
  ownerId: string,
  sortOrder: number
): Prisma.RoutineUncheckedCreateWithoutProgramInput {
  return {
    ownerId,
    name: routine.name,
    description: routine.description,
    imageKey: routine.imageKey,
    sortOrder,
    exercises: {
      create: routine.exercises.map((exercise, index) => ({
        exerciseId: exercise.exerciseId,
        sortOrder: index,
        notes: exercise.notes,
        restSeconds: exercise.restSeconds,
        sets: { create: exercise.sets },
      })),
    },
  };
}