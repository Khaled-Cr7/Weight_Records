import { Router } from "express";
import type { Prisma } from "../../generated/prisma/client.js";
import { denyUnlessOwned, programAccess } from "../lib/access.js";
import { prisma } from "../lib/prisma.js";
import {
  MAX_PROGRAMS_PER_USER,
  MAX_ROUTINES_PER_USER,
  blankToNull,
  firstIssue,
  programCreateSchema,
  programUpdateSchema,
  routineOrderSchema,
} from "../lib/routineInput.js";
import {
  isUuid,
  programDetailSelect,
  routineCopySelect,
  toProgramDetail,
  toRoutineCopyCreate,
} from "../lib/routineShape.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();
router.use(requireAuth);

const programSummarySelect = {
  id: true,
  name: true,
  description: true,
  imageKey: true,
  sortOrder: true,
  _count: { select: { routines: { where: { deletedAt: null } } } },
} satisfies Prisma.ProgramSelect;

type ProgramSummaryRow = Prisma.ProgramGetPayload<{ select: typeof programSummarySelect }>;

function toSummary({ _count, ...program }: ProgramSummaryRow) {
  return { ...program, routineCount: _count.routines };
}

// Next free position at the end of the user's programs
async function nextProgramOrder(userId: string): Promise<number> {
  const last = await prisma.program.aggregate({
    where: { ownerId: userId, deletedAt: null },
    _max: { sortOrder: true },
  });
  return (last._max.sortOrder ?? -1) + 1;
}

// GET /api/programs  -> ready-made programs and the user's own
router.get("/", async (req, res) => {
  try {
    const userId = req.userId as string;
    const orderBy = [{ sortOrder: "asc" as const }, { createdAt: "asc" as const }];

    const [readyMade, mine] = await Promise.all([
      prisma.program.findMany({
        where: { ownerId: null, deletedAt: null },
        orderBy,
        select: programSummarySelect,
      }),
      prisma.program.findMany({
        where: { ownerId: userId, deletedAt: null },
        orderBy,
        select: programSummarySelect,
      }),
    ]);

    res.json({ readyMade: readyMade.map(toSummary), mine: mine.map(toSummary) });
  } catch (error) {
    console.error("GET /api/programs failed:", error);
    res.status(500).json({ error: "Could not load programs" });
  }
});

// POST /api/programs  -> create an empty program
router.post("/", async (req, res) => {
  const parsed = programCreateSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ error: firstIssue(parsed.error) });
    return;
  }

  try {
    const userId = req.userId as string;

    const count = await prisma.program.count({ where: { ownerId: userId, deletedAt: null } });
    if (count >= MAX_PROGRAMS_PER_USER) {
      res.status(400).json({ error: `You can have at most ${MAX_PROGRAMS_PER_USER} programs` });
      return;
    }

    const program = await prisma.program.create({
      data: {
        ownerId: userId,
        name: parsed.data.name,
        description: blankToNull(parsed.data.description),
        imageKey: parsed.data.imageKey ?? null,
        sortOrder: await nextProgramOrder(userId),
      },
      select: programDetailSelect,
    });

    res.status(201).json(toProgramDetail(program));
  } catch (error) {
    console.error("POST /api/programs failed:", error);
    res.status(500).json({ error: "Could not create the program" });
  }
});

// GET /api/programs/:id  -> one program with all its routines, exercises and sets
router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.userId as string;

    if (!isUuid(id)) {
      res.status(404).json({ error: "Program not found" });
      return;
    }

    // Ready-made (no owner) or the user's own; never someone else's
    const program = await prisma.program.findFirst({
      where: { id, deletedAt: null, OR: [{ ownerId: null }, { ownerId: userId }] },
      select: programDetailSelect,
    });

    if (!program) {
      res.status(404).json({ error: "Program not found" });
      return;
    }

    res.json(toProgramDetail(program));
  } catch (error) {
    console.error("GET /api/programs/:id failed:", error);
    res.status(500).json({ error: "Could not load the program" });
  }
});

// POST /api/programs/:id/copy  -> copy a program (and all its routines) into the user's own programs
router.post("/:id/copy", async (req, res) => {
  try {
    const userId = req.userId as string;
    const id = req.params.id;

    if ((await programAccess(id, userId)) === "missing") {
      res.status(404).json({ error: "Program not found" });
      return;
    }

    const source = await prisma.program.findUniqueOrThrow({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        imageKey: true,
        routines: {
          where: { deletedAt: null },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          select: routineCopySelect,
        },
      },
    });

    const [programCount, routineCount] = await Promise.all([
      prisma.program.count({ where: { ownerId: userId, deletedAt: null } }),
      prisma.routine.count({ where: { ownerId: userId, deletedAt: null } }),
    ]);
    if (programCount >= MAX_PROGRAMS_PER_USER) {
      res.status(400).json({ error: `You can have at most ${MAX_PROGRAMS_PER_USER} programs` });
      return;
    }
    if (routineCount + source.routines.length > MAX_ROUTINES_PER_USER) {
      res.status(400).json({ error: `You can have at most ${MAX_ROUTINES_PER_USER} routines` });
      return;
    }

    const copy = await prisma.program.create({
      data: {
        ownerId: userId,
        name: source.name,
        description: source.description,
        imageKey: source.imageKey,
        sourceProgramId: source.id,
        sortOrder: await nextProgramOrder(userId),
        routines: {
          create: source.routines.map((routine, index) => toRoutineCopyCreate(routine, userId, index)),
        },
      },
      select: programDetailSelect,
    });

    res.status(201).json(toProgramDetail(copy));
  } catch (error) {
    console.error("POST /api/programs/:id/copy failed:", error);
    res.status(500).json({ error: "Could not copy the program" });
  }
});

// PATCH /api/programs/:id  -> rename / change description or picture (own programs only)
router.patch("/:id", async (req, res) => {
  const parsed = programUpdateSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ error: firstIssue(parsed.error) });
    return;
  }

  try {
    const userId = req.userId as string;
    const id = req.params.id;

    if (denyUnlessOwned(res, await programAccess(id, userId), "Program")) return;

    const { name, description, imageKey } = parsed.data;
    const program = await prisma.program.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(description !== undefined ? { description: blankToNull(description) } : {}),
        ...(imageKey !== undefined ? { imageKey } : {}),
      },
      select: programDetailSelect,
    });

    res.json(toProgramDetail(program));
  } catch (error) {
    console.error("PATCH /api/programs/:id failed:", error);
    res.status(500).json({ error: "Could not update the program" });
  }
});

// DELETE /api/programs/:id  -> remove a program and its routines (finished workouts are kept)
router.delete("/:id", async (req, res) => {
  try {
    const userId = req.userId as string;
    const id = req.params.id;

    if (denyUnlessOwned(res, await programAccess(id, userId), "Program")) return;

    const now = new Date();
    await prisma.$transaction([
      prisma.routine.updateMany({ where: { programId: id, deletedAt: null }, data: { deletedAt: now } }),
      prisma.program.update({ where: { id }, data: { deletedAt: now } }),
    ]);

    res.json({ deleted: true });
  } catch (error) {
    console.error("DELETE /api/programs/:id failed:", error);
    res.status(500).json({ error: "Could not delete the program" });
  }
});

// PUT /api/programs/:id/routines/order  -> new order of the program's routines
router.put("/:id/routines/order", async (req, res) => {
  const parsed = routineOrderSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ error: firstIssue(parsed.error) });
    return;
  }

  try {
    const userId = req.userId as string;
    const id = req.params.id;

    if (denyUnlessOwned(res, await programAccess(id, userId), "Program")) return;

    // The list must contain every routine of the program exactly once
    const current = await prisma.routine.findMany({
      where: { programId: id, deletedAt: null },
      select: { id: true },
    });
    const sent = parsed.data.routineIds;
    const currentIds = new Set(current.map((routine) => routine.id));
    const sameRoutines =
      sent.length === currentIds.size && new Set(sent).size === sent.length && sent.every((routineId) => currentIds.has(routineId));
    if (!sameRoutines) {
      res.status(400).json({ error: "The list must contain every routine of the program exactly once" });
      return;
    }

    await prisma.$transaction(
      sent.map((routineId, index) => prisma.routine.update({ where: { id: routineId }, data: { sortOrder: index } }))
    );

    const program = await prisma.program.findUniqueOrThrow({ where: { id }, select: programDetailSelect });
    res.json(toProgramDetail(program));
  } catch (error) {
    console.error("PUT /api/programs/:id/routines/order failed:", error);
    res.status(500).json({ error: "Could not reorder the routines" });
  }
});

export default router;