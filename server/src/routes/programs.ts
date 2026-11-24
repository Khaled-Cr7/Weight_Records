import { Router } from "express";
import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import { isUuid, routineDetailSelect, toRoutineDetail } from "../lib/routineShape.js";
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
      select: {
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
      },
    });

    if (!program) {
      res.status(404).json({ error: "Program not found" });
      return;
    }

    const { ownerId, routines, ...rest } = program;
    res.json({ ...rest, isReadyMade: ownerId === null, routines: routines.map(toRoutineDetail) });
  } catch (error) {
    console.error("GET /api/programs/:id failed:", error);
    res.status(500).json({ error: "Could not load the program" });
  }
});

export default router;