import { readFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "../lib/prisma.js";

type ProgramData = {
  key: string;
  name: string;
  description: string;
  imageKey: string;
  routines: {
    name: string;
    exercises: { exerciseId: string; name: string; sets: number; reps: string }[];
  }[];
};

// "8-10" becomes a range, "12" becomes a single target
function parseReps(text: string) {
  const range = /^(\d+)\s*-\s*(\d+)$/.exec(text.trim());
  if (range) {
    const min = Number(range[1]);
    const max = Number(range[2]);
    if (min > max) throw new Error(`Rep range is backwards: "${text}"`);
    return { repMode: "RANGE" as const, targetReps: null, targetRepsMin: min, targetRepsMax: max };
  }

  if (/^\d+$/.test(text.trim())) {
    return { repMode: "REPS" as const, targetReps: Number(text), targetRepsMin: null, targetRepsMax: null };
  }

  throw new Error(`Unsupported reps value: "${text}"`);
}

async function main() {
  const filePath = path.resolve(process.cwd(), "data/programs.json");
  const programs: ProgramData[] = JSON.parse(await readFile(filePath, "utf-8"));

  // Every exercise id in the file must exist in the database
  const wantedIds = [
    ...new Set(programs.flatMap((p) => p.routines.flatMap((r) => r.exercises.map((e) => e.exerciseId)))),
  ];
  const found = await prisma.exercise.findMany({
    where: { id: { in: wantedIds } },
    select: { id: true },
  });
  const foundIds = new Set(found.map((e) => e.id));
  const missing = wantedIds.filter((id) => !foundIds.has(id));
  if (missing.length > 0) {
    throw new Error(`These exercise ids are not in the database (run seed:exercises first?): ${missing.join(", ")}`);
  }

  // Replace the ready-made programs (owner = nobody). Users' own copies are not touched.
  await prisma.$transaction(
    async (tx) => {
      await tx.routine.deleteMany({ where: { ownerId: null } });
      await tx.program.deleteMany({ where: { ownerId: null } });

      for (const [programIndex, program] of programs.entries()) {
        await tx.program.create({
          data: {
            name: program.name,
            description: program.description,
            imageKey: program.imageKey,
            sortOrder: programIndex,
            routines: {
              create: program.routines.map((routine, routineIndex) => ({
                name: routine.name,
                sortOrder: routineIndex,
                exercises: {
                  create: routine.exercises.map((exercise, exerciseIndex) => {
                    const reps = parseReps(exercise.reps);
                    return {
                      exerciseId: exercise.exerciseId,
                      sortOrder: exerciseIndex,
                      sets: {
                        create: Array.from({ length: exercise.sets }, (_, i) => ({
                          setOrder: i + 1,
                          ...reps,
                        })),
                      },
                    };
                  }),
                },
              })),
            },
          },
        });
      }
    },
    { timeout: 60000 }
  );

  const [programCount, routineCount, exerciseCount, setCount] = await Promise.all([
    prisma.program.count({ where: { ownerId: null } }),
    prisma.routine.count({ where: { ownerId: null } }),
    prisma.routineExercise.count({ where: { routine: { ownerId: null } } }),
    prisma.routineSet.count({ where: { routineExercise: { routine: { ownerId: null } } } }),
  ]);

  console.log(
    `Ready-made programs: ${programCount}, routines: ${routineCount}, exercises: ${exerciseCount}, sets: ${setCount}`
  );
}

main()
  .catch((error) => {
    console.error("Program seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });