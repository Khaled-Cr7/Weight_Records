-- CreateEnum
CREATE TYPE "RepMode" AS ENUM ('REPS', 'RANGE');

-- AlterTable
ALTER TABLE "routine_sets" ADD COLUMN     "rep_mode" "RepMode" NOT NULL DEFAULT 'REPS',
ADD COLUMN     "target_reps_max" INTEGER,
ADD COLUMN     "target_reps_min" INTEGER,
ALTER COLUMN "target_weight_kg" DROP NOT NULL,
ALTER COLUMN "target_weight_kg" DROP DEFAULT,
ALTER COLUMN "target_reps" DROP NOT NULL,
ALTER COLUMN "target_reps" DROP DEFAULT;

-- AlterTable
ALTER TABLE "session_sets" ADD COLUMN     "rep_mode" "RepMode" NOT NULL DEFAULT 'REPS',
ADD COLUMN     "target_reps_max" INTEGER,
ADD COLUMN     "target_reps_min" INTEGER,
ALTER COLUMN "weight_kg" DROP NOT NULL,
ALTER COLUMN "weight_kg" DROP DEFAULT,
ALTER COLUMN "reps" DROP NOT NULL,
ALTER COLUMN "reps" DROP DEFAULT;

-- A RANGE set needs both ends, and the minimum can never be above the maximum
ALTER TABLE "routine_sets" ADD CONSTRAINT "routine_sets_rep_range_valid" CHECK (
  ("rep_mode" <> 'RANGE' OR ("target_reps_min" IS NOT NULL AND "target_reps_max" IS NOT NULL))
  AND ("target_reps_min" IS NULL OR "target_reps_max" IS NULL OR "target_reps_min" <= "target_reps_max")
);

ALTER TABLE "session_sets" ADD CONSTRAINT "session_sets_rep_range_valid" CHECK (
  ("rep_mode" <> 'RANGE' OR ("target_reps_min" IS NOT NULL AND "target_reps_max" IS NOT NULL))
  AND ("target_reps_min" IS NULL OR "target_reps_max" IS NULL OR "target_reps_min" <= "target_reps_max")
);