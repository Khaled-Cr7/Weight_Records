import { Router, type Response } from "express";
import { denyUnlessOwned, programAccess, routineAccess } from "../lib/access.js";
import { prisma } from "../lib/prisma.js";
import {
  MAX_ROUTINES_PER_USER,
  blankToNull,
  firstIssue,
  routineCopySchema,
  routineCreateSchema,
  routineUpdateSchema,
  toExerciseCreates,
  type RoutineExerciseInput,
} from "../lib/routineInput.js";
import {
  isUuid,
  routineCopySelect,
  routineDetailSelect,
  toRoutineCopyCreate,
  toRoutineDetail,
} from "../lib/routineShape.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();
router.use(requireAuth);

// Next free position at the end of a program (or of the standalone routines when programId is null)
async function nextRoutineOrder(userId: string, programId: string | null): Promise<number> {
  const last = await prisma.routine.aggregate({
    where: { ownerId: userId, programId, deletedAt: null },
    _max: { sortOrder: true },
  });
  return (last._max.sortOrder ?? -1) + 1;
}

// Every exercise id must exist in the exercise library; returns the first unknown one
async function findUnknownExercise(items: RoutineExerciseInput[]): Promise<string | null> {
  const ids = [...new Set(items.map((item) => item.exerciseId))];
  if (ids.length === 0) return null;
  const found = await prisma.exercise.findMany({ where: { id: { in: ids } }, select: { id: true } });
  const known = new Set(found.map((exercise) => exercise.id));
  return ids.find((id) => !known.has(id)) ?? null;
}

// Checks that the user may put a routine into this program. Returns true when it answered with an error.
async function denyProgramTarget(res: Response, programId: string, userId: string) {
  return denyUnlessOwned(res, await programAccess(programId, userId), "Program");
}

// GET /api/routines  -> the user's own routines that are not inside a program
router.get("/", async (req, res) => {
  try {
    const rows = await prisma.routine.findMany({
      where: { ownerId: req.userId as string, programId: null, deletedAt: null },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        name: true,
        description: true,
        imageKey: true,
        updatedAt: true,
        _count: { select: { exercises: true } },
      },
    });

    res.json({
      routines: rows.map(({ _count, ...routine }) => ({ ...routine, exerciseCount: _count.exercises })),
    });
  } catch (error) {
    console.error("GET /api/routines failed:", error);
    res.status(500).json({ error: "Could not load routines" });
  }
});

// POST /api/routines  -> create a routine (standalone, or inside one of the user's own programs)
router.post("/", async (req, res) => {
  const parsed = routineCreateSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ error: firstIssue(parsed.error) });
    return;
  }

  try {
    const userId = req.userId as string;
    const { name, description, exercises } = parsed.data;
    const programId = parsed.data.programId ?? null;

    if (programId && (await denyProgramTarget(res, programId, userId))) return;

    const count = await prisma.routine.count({ where: { ownerId: userId, deletedAt: null } });
    if (count >= MAX_ROUTINES_PER_USER) {
      res.status(400).json({ error: `You can have at most ${MAX_ROUTINES_PER_USER} routines` });
      return;
    }

    const unknown = await findUnknownExercise(exercises);
    if (unknown) {
      res.status(400).json({ error: `Unknown exercise: ${unknown}` });
      return;
    }

    const routine = await prisma.routine.create({
      data: {
        ownerId: userId,
        programId,
        name,
        description: blankToNull(description),
        sortOrder: await nextRoutineOrder(userId, programId),
        exercises: { create: toExerciseCreates(exercises) },
      },
      select: routineDetailSelect,
    });

    res.status(201).json(toRoutineDetail(routine));
  } catch (error) {
    console.error("POST /api/routines failed:", error);
    res.status(500).json({ error: "Could not create the routine" });
  }
});

// GET /api/routines/:id  -> one routine with its exercises and sets
router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;

    if (!isUuid(id)) {
      res.status(404).json({ error: "Routine not found" });
      return;
    }

    // Ready-made (no owner) or the user's own; never someone else's
    const routine = await prisma.routine.findFirst({
      where: { id, deletedAt: null, OR: [{ ownerId: null }, { ownerId: req.userId as string }] },
      select: routineDetailSelect,
    });

    if (!routine) {
      res.status(404).json({ error: "Routine not found" });
      return;
    }

    res.json(toRoutineDetail(routine));
  } catch (error) {
    console.error("GET /api/routines/:id failed:", error);
    res.status(500).json({ error: "Could not load the routine" });
  }
});

// POST /api/routines/:id/copy  -> copy a routine into the user's routines (or one of their programs)
router.post("/:id/copy", async (req, res) => {
  const parsed = routineCopySchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ error: firstIssue(parsed.error) });
    return;
  }

  try {
    const userId = req.userId as string;
    const id = req.params.id;
    const programId = parsed.data.programId ?? null;

    if ((await routineAccess(id, userId)) === "missing") {
      res.status(404).json({ error: "Routine not found" });
      return;
    }
    if (programId && (await denyProgramTarget(res, programId, userId))) return;

    const count = await prisma.routine.count({ where: { ownerId: userId, deletedAt: null } });
    if (count >= MAX_ROUTINES_PER_USER) {
      res.status(400).json({ error: `You can have at most ${MAX_ROUTINES_PER_USER} routines` });
      return;
    }

    const source = await prisma.routine.findUniqueOrThrow({ where: { id }, select: routineCopySelect });
    const sortOrder = await nextRoutineOrder(userId, programId);

    const copy = await prisma.routine.create({
      data: { ...toRoutineCopyCreate(source, userId, sortOrder), programId },
      select: routineDetailSelect,
    });

    res.status(201).json(toRoutineDetail(copy));
  } catch (error) {
    console.error("POST /api/routines/:id/copy failed:", error);
    res.status(500).json({ error: "Could not copy the routine" });
  }
});

// PATCH /api/routines/:id  -> change name / description and/or replace all exercises and sets (own routines only)
router.patch("/:id", async (req, res) => {
  const parsed = routineUpdateSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ error: firstIssue(parsed.error) });
    return;
  }

  try {
    const userId = req.userId as string;
    const id = req.params.id;

    if (denyUnlessOwned(res, await routineAccess(id, userId), "Routine")) return;

    const { name, description, exercises } = parsed.data;

    if (exercises) {
      const unknown = await findUnknownExercise(exercises);
      if (unknown) {
        res.status(400).json({ error: `Unknown exercise: ${unknown}` });
        return;
      }
    }

    // Replacing the exercises is all-or-nothing: either everything is saved or nothing changes
    const routine = await prisma.$transaction(async (tx) => {
      if (exercises) await tx.routineExercise.deleteMany({ where: { routineId: id } });

      return tx.routine.update({
        where: { id },
        data: {
          ...(name !== undefined ? { name } : {}),
          ...(description !== undefined ? { description: blankToNull(description) } : {}),
          ...(exercises ? { exercises: { create: toExerciseCreates(exercises) } } : {}),
        },
        select: routineDetailSelect,
      });
    });

    res.json(toRoutineDetail(routine));
  } catch (error) {
    console.error("PATCH /api/routines/:id failed:", error);
    res.status(500).json({ error: "Could not update the routine" });
  }
});

// DELETE /api/routines/:id  -> remove a routine (finished workouts are kept)
router.delete("/:id", async (req, res) => {
  try {
    const userId = req.userId as string;
    const id = req.params.id;

    if (denyUnlessOwned(res, await routineAccess(id, userId), "Routine")) return;

    await prisma.routine.update({ where: { id }, data: { deletedAt: new Date() } });
    res.json({ deleted: true });
  } catch (error) {
    console.error("DELETE /api/routines/:id failed:", error);
    res.status(500).json({ error: "Could not delete the routine" });
  }
});

export default router;