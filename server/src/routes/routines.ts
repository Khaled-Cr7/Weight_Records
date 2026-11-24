import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { isUuid, routineDetailSelect, toRoutineDetail } from "../lib/routineShape.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();
router.use(requireAuth);

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

export default router;