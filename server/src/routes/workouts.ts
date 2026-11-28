import { Router, type Response } from "express";
import { Prisma } from "../../generated/prisma/client.js";
import { routineAccess } from "../lib/access.js";
import { prisma } from "../lib/prisma.js";
import { firstIssue } from "../lib/routineInput.js";
import { isUuid, routineDetailSelect } from "../lib/routineShape.js";
import {
  MAX_EXERCISES_PER_WORKOUT,
  MAX_SETS_PER_EXERCISE,
  workoutExerciseAddSchema,
  workoutExerciseUpdateSchema,
  workoutFinishSchema,
  workoutSetAddSchema,
  workoutSetUpdateSchema,
  workoutStartSchema,
  workoutUpdateSchema,
} from "../lib/workoutInput.js";
import { toSetShape, toWorkoutDetail, workoutDetailSelect } from "../lib/workoutShape.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();
router.use(requireAuth);

const NOT_FOUND = "Workout not found";

// The user's workout with this id, or null (someone else's workout counts as missing)
async function findWorkout(id: string, userId: string) {
  if (!isUuid(id)) return null;
  return prisma.workoutSession.findFirst({ where: { id, userId }, select: { id: true, status: true, startedAt: true } });
}

// Sends the error response when the workout is missing or already finished. Returns true when it answered.
async function requireInProgress(res: Response, id: string, userId: string): Promise<boolean> {
  const workout = await findWorkout(id, userId);
  if (!workout) {
    res.status(404).json({ error: NOT_FOUND });
    return true;
  }
  if (workout.status !== "IN_PROGRESS") {
    res.status(409).json({ error: "This workout is already finished" });
    return true;
  }
  return false;
}

async function sendDetail(res: Response, userId: string, id: string, status = 200) {
  const row = await prisma.workoutSession.findFirst({ where: { id, userId }, select: workoutDetailSelect });
  if (!row) {
    res.status(404).json({ error: NOT_FOUND });
    return;
  }
  res.status(status).json(await toWorkoutDetail(userId, row));
}

// GET /api/workouts/active  -> the workout in progress, or { workout: null }
router.get("/active", async (req, res) => {
  try {
    const userId = req.userId as string;
    const active = await prisma.workoutSession.findFirst({ where: { userId, status: "IN_PROGRESS" }, select: { id: true } });
    if (!active) {
      res.json({ workout: null });
      return;
    }
    const row = await prisma.workoutSession.findFirstOrThrow({ where: { id: active.id }, select: workoutDetailSelect });
    res.json({ workout: await toWorkoutDetail(userId, row) });
  } catch (error) {
    console.error("GET /api/workouts/active failed:", error);
    res.status(500).json({ error: "Could not load the workout" });
  }
});

// GET /api/workouts  -> finished workouts, newest first
router.get("/", async (req, res) => {
  try {
    const userId = req.userId as string;
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const offset = Math.max(Number(req.query.offset) || 0, 0);
    const where = { userId, status: "COMPLETED" as const };

    const [total, rows] = await Promise.all([
      prisma.workoutSession.count({ where }),
      prisma.workoutSession.findMany({
        where,
        orderBy: { startedAt: "desc" },
        take: limit,
        skip: offset,
        select: {
          id: true,
          name: true,
          startedAt: true,
          finishedAt: true,
          durationSeconds: true,
          exercises: {
            orderBy: { sortOrder: "asc" },
            select: {
              exercise: { select: { name: true } },
              sets: { where: { isCompleted: true }, select: { weightKg: true, reps: true } },
            },
          },
        },
      }),
    ]);

    res.json({
      total,
      items: rows.map((row) => {
        const sets = row.exercises.flatMap((item) => item.sets);
        return {
          id: row.id,
          name: row.name,
          startedAt: row.startedAt,
          finishedAt: row.finishedAt,
          durationSeconds: row.durationSeconds,
          exerciseNames: row.exercises.map((item) => item.exercise.name),
          setCount: sets.length,
          volumeKg: Math.round(sets.reduce((sum, set) => sum + Number(set.weightKg ?? 0) * (set.reps ?? 0), 0) * 100) / 100,
        };
      }),
    });
  } catch (error) {
    console.error("GET /api/workouts failed:", error);
    res.status(500).json({ error: "Could not load workouts" });
  }
});

// POST /api/workouts  -> start a workout: empty, or from one of the user's own routines
router.post("/", async (req, res) => {
  const parsed = workoutStartSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ error: firstIssue(parsed.error) });
    return;
  }

  try {
    const userId = req.userId as string;
    const { routineId, name } = parsed.data;

    let routineName: string | null = null;
    let exercises: Prisma.SessionExerciseUncheckedCreateWithoutSessionInput[] = [];

    if (routineId) {
      const access = await routineAccess(routineId, userId);
      if (access === "missing") {
        res.status(404).json({ error: "Routine not found" });
        return;
      }
      if (access === "readonly") {
        res.status(403).json({ error: "Add this routine to your own routines before starting it" });
        return;
      }

      const routine = await prisma.routine.findFirstOrThrow({ where: { id: routineId }, select: routineDetailSelect });
      routineName = routine.name;
      exercises = routine.exercises.map((item, index) => ({
        exerciseId: item.exercise.id,
        sourceRoutineExerciseId: item.id,
        sortOrder: index,
        notes: item.notes,
        restSeconds: item.restSeconds ?? 90,
        sets: {
          create: item.sets.map((set, setIndex) => ({
            sourceRoutineSetId: set.id,
            setOrder: setIndex + 1,
            setType: set.setType,
            repMode: set.repMode,
            targetRepsMin: set.repMode === "RANGE" ? set.targetRepsMin : null,
            targetRepsMax: set.repMode === "RANGE" ? set.targetRepsMax : null,
          })),
        },
      }));
    }

    try {
      const created = await prisma.workoutSession.create({
        data: {
          userId,
          sourceRoutineId: routineId ?? null,
          name: name ?? routineName ?? "Workout",
          exercises: { create: exercises },
        },
        select: { id: true },
      });
      await sendDetail(res, userId, created.id, 201);
    } catch (error) {
      // The database allows only one workout in progress per user
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const active = await prisma.workoutSession.findFirst({ where: { userId, status: "IN_PROGRESS" }, select: { id: true } });
        res.status(409).json({ error: "You already have a workout in progress", activeId: active?.id ?? null });
        return;
      }
      throw error;
    }
  } catch (error) {
    console.error("POST /api/workouts failed:", error);
    res.status(500).json({ error: "Could not start the workout" });
  }
});

// GET /api/workouts/:id
router.get("/:id", async (req, res) => {
  try {
    const userId = req.userId as string;
    if (!(await findWorkout(req.params.id, userId))) {
      res.status(404).json({ error: NOT_FOUND });
      return;
    }
    await sendDetail(res, userId, req.params.id);
  } catch (error) {
    console.error("GET /api/workouts/:id failed:", error);
    res.status(500).json({ error: "Could not load the workout" });
  }
});

// PATCH /api/workouts/:id  -> rename, or change the notes
router.patch("/:id", async (req, res) => {
  const parsed = workoutUpdateSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ error: firstIssue(parsed.error) });
    return;
  }

  try {
    const userId = req.userId as string;
    if (!(await findWorkout(req.params.id, userId))) {
      res.status(404).json({ error: NOT_FOUND });
      return;
    }
    const { name, notes } = parsed.data;
    await prisma.workoutSession.update({
      where: { id: req.params.id },
      data: { ...(name !== undefined ? { name } : {}), ...(notes !== undefined ? { notes: notes?.trim() ? notes.trim() : null } : {}) },
    });
    await sendDetail(res, userId, req.params.id);
  } catch (error) {
    console.error("PATCH /api/workouts/:id failed:", error);
    res.status(500).json({ error: "Could not update the workout" });
  }
});

// DELETE /api/workouts/:id  -> delete a workout for good (finished or not)
router.delete("/:id", async (req, res) => {
  try {
    const userId = req.userId as string;
    if (!(await findWorkout(req.params.id, userId))) {
      res.status(404).json({ error: NOT_FOUND });
      return;
    }
    await prisma.workoutSession.delete({ where: { id: req.params.id } });
    res.json({ deleted: true });
  } catch (error) {
    console.error("DELETE /api/workouts/:id failed:", error);
    res.status(500).json({ error: "Could not delete the workout" });
  }
});

// POST /api/workouts/:id/exercises  -> add an exercise (with one empty set) to a workout in progress
router.post("/:id/exercises", async (req, res) => {
  const parsed = workoutExerciseAddSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ error: firstIssue(parsed.error) });
    return;
  }

  try {
    const userId = req.userId as string;
    const id = req.params.id;
    if (await requireInProgress(res, id, userId)) return;

    const exercise = await prisma.exercise.findUnique({ where: { id: parsed.data.exerciseId }, select: { id: true } });
    if (!exercise) {
      res.status(400).json({ error: `Unknown exercise: ${parsed.data.exerciseId}` });
      return;
    }

    const last = await prisma.sessionExercise.aggregate({ where: { sessionId: id }, _max: { sortOrder: true }, _count: true });
    if (last._count >= MAX_EXERCISES_PER_WORKOUT) {
      res.status(400).json({ error: `A workout can have at most ${MAX_EXERCISES_PER_WORKOUT} exercises` });
      return;
    }

    await prisma.sessionExercise.create({
      data: {
        sessionId: id,
        exerciseId: exercise.id,
        sortOrder: (last._max.sortOrder ?? -1) + 1,
        sets: { create: [{ setOrder: 1 }] },
      },
    });
    await sendDetail(res, userId, id, 201);
  } catch (error) {
    console.error("POST /api/workouts/:id/exercises failed:", error);
    res.status(500).json({ error: "Could not add the exercise" });
  }
});

// Finds an exercise of a workout in progress that belongs to the user; answers 404/409 and returns null otherwise
async function ownedExercise(res: Response, workoutId: string, exerciseId: string, userId: string) {
  if (await requireInProgress(res, workoutId, userId)) return null;
  const found = isUuid(exerciseId)
    ? await prisma.sessionExercise.findFirst({ where: { id: exerciseId, sessionId: workoutId }, select: { id: true } })
    : null;
  if (!found) {
    res.status(404).json({ error: "Exercise not found in this workout" });
    return null;
  }
  return found;
}

// PATCH /api/workouts/:id/exercises/:exerciseId  -> rest time or notes
router.patch("/:id/exercises/:exerciseId", async (req, res) => {
  const parsed = workoutExerciseUpdateSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ error: firstIssue(parsed.error) });
    return;
  }

  try {
    const userId = req.userId as string;
    const found = await ownedExercise(res, req.params.id, req.params.exerciseId, userId);
    if (!found) return;

    const { restSeconds, notes } = parsed.data;
    await prisma.sessionExercise.update({
      where: { id: found.id },
      data: {
        ...(restSeconds !== undefined ? { restSeconds } : {}),
        ...(notes !== undefined ? { notes: notes?.trim() ? notes.trim() : null } : {}),
      },
    });
    await sendDetail(res, userId, req.params.id);
  } catch (error) {
    console.error("PATCH exercise failed:", error);
    res.status(500).json({ error: "Could not update the exercise" });
  }
});

// DELETE /api/workouts/:id/exercises/:exerciseId
router.delete("/:id/exercises/:exerciseId", async (req, res) => {
  try {
    const userId = req.userId as string;
    const found = await ownedExercise(res, req.params.id, req.params.exerciseId, userId);
    if (!found) return;

    await prisma.sessionExercise.delete({ where: { id: found.id } });
    await sendDetail(res, userId, req.params.id);
  } catch (error) {
    console.error("DELETE exercise failed:", error);
    res.status(500).json({ error: "Could not remove the exercise" });
  }
});

// POST /api/workouts/:id/exercises/:exerciseId/sets  -> add a set at the end (copies the last set's rep mode)
router.post("/:id/exercises/:exerciseId/sets", async (req, res) => {
  const parsed = workoutSetAddSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ error: firstIssue(parsed.error) });
    return;
  }

  try {
    const userId = req.userId as string;
    const found = await ownedExercise(res, req.params.id, req.params.exerciseId, userId);
    if (!found) return;

    const sets = await prisma.sessionSet.findMany({
      where: { sessionExerciseId: found.id },
      orderBy: { setOrder: "desc" },
      take: 1,
      select: { setOrder: true, repMode: true, targetRepsMin: true, targetRepsMax: true },
    });
    const count = await prisma.sessionSet.count({ where: { sessionExerciseId: found.id } });
    if (count >= MAX_SETS_PER_EXERCISE) {
      res.status(400).json({ error: `An exercise can have at most ${MAX_SETS_PER_EXERCISE} sets` });
      return;
    }

    const last = sets[0];
    await prisma.sessionSet.create({
      data: {
        sessionExerciseId: found.id,
        setOrder: (last?.setOrder ?? 0) + 1,
        setType: parsed.data.setType ?? "NORMAL",
        repMode: last?.repMode ?? "REPS",
        targetRepsMin: last?.repMode === "RANGE" ? last.targetRepsMin : null,
        targetRepsMax: last?.repMode === "RANGE" ? last.targetRepsMax : null,
      },
    });
    await sendDetail(res, userId, req.params.id, 201);
  } catch (error) {
    console.error("POST set failed:", error);
    res.status(500).json({ error: "Could not add the set" });
  }
});

// PATCH /api/workouts/:id/sets/:setId  -> type the weight and reps, tick the set, change its type or rep mode
router.patch("/:id/sets/:setId", async (req, res) => {
  const parsed = workoutSetUpdateSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ error: firstIssue(parsed.error) });
    return;
  }

  try {
    const userId = req.userId as string;
    if (await requireInProgress(res, req.params.id, userId)) return;

    const current = isUuid(req.params.setId)
      ? await prisma.sessionSet.findFirst({
          where: { id: req.params.setId, sessionExercise: { sessionId: req.params.id } },
        })
      : null;
    if (!current) {
      res.status(404).json({ error: "Set not found" });
      return;
    }

    const body = parsed.data;
    const repMode = body.repMode ?? current.repMode;
    const weightKg = body.weightKg !== undefined ? body.weightKg : current.weightKg === null ? null : Number(current.weightKg);
    const reps = body.reps !== undefined ? body.reps : current.reps;
    const isCompleted = body.isCompleted ?? current.isCompleted;

    let targetRepsMin = body.targetRepsMin !== undefined ? body.targetRepsMin : current.targetRepsMin;
    let targetRepsMax = body.targetRepsMax !== undefined ? body.targetRepsMax : current.targetRepsMax;
    if (repMode === "REPS") {
      targetRepsMin = null;
      targetRepsMax = null;
    } else if (targetRepsMin === null || targetRepsMax === null) {
      res.status(400).json({ error: "A range needs both a minimum and a maximum" });
      return;
    } else if (targetRepsMin > targetRepsMax) {
      res.status(400).json({ error: "Minimum reps can't be above maximum reps" });
      return;
    }

    // A set can only be ticked once its reps are known (a range set must have its reps typed)
    if (isCompleted && reps === null) {
      res.status(400).json({ error: "Enter the reps before completing the set" });
      return;
    }

    const updated = await prisma.sessionSet.update({
      where: { id: current.id },
      data: {
        setType: body.setType ?? current.setType,
        repMode,
        targetRepsMin,
        targetRepsMax,
        weightKg,
        reps,
        isCompleted,
        completedAt: isCompleted ? (current.isCompleted ? current.completedAt : new Date()) : null,
      },
    });
    res.json(toSetShape(updated));
  } catch (error) {
    console.error("PATCH set failed:", error);
    res.status(500).json({ error: "Could not update the set" });
  }
});

// DELETE /api/workouts/:id/sets/:setId
router.delete("/:id/sets/:setId", async (req, res) => {
  try {
    const userId = req.userId as string;
    if (await requireInProgress(res, req.params.id, userId)) return;

    const current = isUuid(req.params.setId)
      ? await prisma.sessionSet.findFirst({
          where: { id: req.params.setId, sessionExercise: { sessionId: req.params.id } },
          select: { id: true },
        })
      : null;
    if (!current) {
      res.status(404).json({ error: "Set not found" });
      return;
    }

    await prisma.sessionSet.delete({ where: { id: current.id } });
    await sendDetail(res, userId, req.params.id);
  } catch (error) {
    console.error("DELETE set failed:", error);
    res.status(500).json({ error: "Could not remove the set" });
  }
});

// POST /api/workouts/:id/finish  -> save the workout (and, if asked, copy what was done into its routine)
router.post("/:id/finish", async (req, res) => {
  const parsed = workoutFinishSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ error: firstIssue(parsed.error) });
    return;
  }

  try {
    const userId = req.userId as string;
    const id = req.params.id;
    if (await requireInProgress(res, id, userId)) return;

    const session = await prisma.workoutSession.findFirstOrThrow({
      where: { id },
      select: {
        startedAt: true,
        sourceRoutineId: true,
        exercises: {
          select: {
            id: true,
            restSeconds: true,
            notes: true,
            sourceRoutineExercise: {
              select: {
                id: true,
                routine: { select: { id: true, ownerId: true, deletedAt: true } },
                sets: { select: { id: true, setOrder: true }, orderBy: { setOrder: "asc" } },
              },
            },
            sets: {
              orderBy: { setOrder: "asc" },
              select: {
                id: true,
                isCompleted: true,
                weightKg: true,
                reps: true,
                setType: true,
                repMode: true,
                targetRepsMin: true,
                targetRepsMax: true,
              },
            },
          },
        },
      },
    });

    const completed = session.exercises.flatMap((item) => item.sets).filter((set) => set.isCompleted);
    if (completed.length === 0) {
      res.status(400).json({ error: "Complete at least one set before finishing, or discard the workout" });
      return;
    }

    const now = new Date();
    const durationSeconds = Math.max(1, Math.round((now.getTime() - session.startedAt.getTime()) / 1000));
    let routineUpdated = false;

    await prisma.$transaction(async (tx) => {
      // 1. Routine: each exercise of the routine becomes what was done in the workout
      //    (the completed sets with their type, rep mode, weight and reps, plus rest time and note).
      //    Exercises added to or removed from the workout are not copied to the routine.
      if (parsed.data.updateRoutine && session.sourceRoutineId) {
        const touched = new Set<string>();
        for (const item of session.exercises) {
          const source = item.sourceRoutineExercise;
          const routine = source?.routine;
          const done = item.sets.filter((set) => set.isCompleted);
          if (!source || !routine || routine.ownerId !== userId || routine.deletedAt !== null || done.length === 0) continue;

          await tx.routineExercise.update({
            where: { id: source.id },
            data: { restSeconds: item.restSeconds, notes: item.notes },
          });

          for (let index = 0; index < done.length; index++) {
            const set = done[index];
            const data = {
              setType: set.setType,
              targetWeightKg: set.weightKg,
              repMode: set.repMode,
              targetReps: set.repMode === "REPS" ? set.reps : null,
              targetRepsMin: set.repMode === "RANGE" ? set.targetRepsMin : null,
              targetRepsMax: set.repMode === "RANGE" ? set.targetRepsMax : null,
            };
            const existing = source.sets[index];
            if (existing) {
              await tx.routineSet.update({ where: { id: existing.id }, data });
            } else {
              await tx.routineSet.create({ data: { ...data, routineExerciseId: source.id, setOrder: index + 1 } });
            }
          }

          // Sets the routine had beyond what was done are removed
          const extra = source.sets.slice(done.length).map((set) => set.id);
          if (extra.length > 0) await tx.routineSet.deleteMany({ where: { id: { in: extra } } });

          touched.add(routine.id);
        }
        for (const routineId of touched) {
          await tx.routine.update({ where: { id: routineId }, data: { updatedAt: now } });
        }
        routineUpdated = touched.size > 0;
      }

      // 2. The saved workout only keeps what was done
      await tx.sessionSet.deleteMany({ where: { isCompleted: false, sessionExercise: { sessionId: id } } });
      await tx.sessionExercise.deleteMany({ where: { sessionId: id, sets: { none: {} } } });

      // 3. Close the workout
      await tx.workoutSession.update({
        where: { id },
        data: { status: "COMPLETED", finishedAt: now, durationSeconds, routineUpdatedAt: routineUpdated ? now : null },
      });
    });

    const row = await prisma.workoutSession.findFirstOrThrow({ where: { id }, select: workoutDetailSelect });
    const workout = await toWorkoutDetail(userId, row);
    const sets = workout.exercises.flatMap((item) => item.sets);

    res.json({
      workout,
      summary: {
        durationSeconds,
        exerciseCount: workout.exercises.length,
        setCount: sets.length,
        totalReps: sets.reduce((sum, set) => sum + (set.reps ?? 0), 0),
        volumeKg: Math.round(sets.reduce((sum, set) => sum + (set.weightKg ?? 0) * (set.reps ?? 0), 0) * 100) / 100,
        routineUpdated,
      },
    });
  } catch (error) {
    console.error("POST /api/workouts/:id/finish failed:", error);
    res.status(500).json({ error: "Could not finish the workout" });
  }
});

export default router;