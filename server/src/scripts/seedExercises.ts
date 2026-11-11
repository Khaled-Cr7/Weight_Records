
import { readFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "../lib/prisma.js";

type ExerciseData = {
  id: string;
  name: string;
  force: string | null;
  level: string | null;
  mechanic: string | null;
  equipment: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  category: string | null;
  images: string[];
};

async function main() {
  const filePath = path.resolve(
    process.cwd(),
    "data/exercises.json"
  );

  const fileContent = await readFile(filePath, "utf-8");
  const exercises: ExerciseData[] = JSON.parse(fileContent);

  console.log(`Found ${exercises.length} exercises in JSON.`);

  const result = await prisma.exercise.createMany({
    data: exercises.map((exercise) => ({
      id: exercise.id,
      name: exercise.name,
      force: exercise.force,
      level: exercise.level,
      mechanic: exercise.mechanic,
      equipment: exercise.equipment,
      primaryMuscles: exercise.primaryMuscles,
      secondaryMuscles: exercise.secondaryMuscles,
      instructions: exercise.instructions,
      category: exercise.category,
      images: exercise.images,
    })),
    skipDuplicates: true,
  });

  const total = await prisma.exercise.count();

  console.log(`New exercises inserted: ${result.count}`);
  console.log(`Total exercises in PostgreSQL: ${total}`);
}

main()
  .catch((error) => {
    console.error("Exercise import failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
