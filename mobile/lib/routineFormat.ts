import { images } from '@/constants/images';
import type { Routine, RoutineSet } from '@/services/types/program';

// Picture for a program card, chosen by the imageKey the server sends
export function programImage(imageKey: string | null) {
  switch (imageKey) {
    case 'bench':
      return images.bench;
    case 'dumbell':
      return images.dumbell;
    case 'plates':
      return images.plates;
    case 'incline':
      return images.incline;
    default:
      return images.barbell;
  }
}

// "8-10" for a range set, "12" for a fixed-reps set, "-" when nothing is set
export function repsText(set: RoutineSet): string {
  if (set.repMode === 'RANGE' && set.targetRepsMin !== null && set.targetRepsMax !== null) {
    return `${set.targetRepsMin}-${set.targetRepsMax}`;
  }
  if (set.repMode === 'REPS' && set.targetReps !== null) {
    return String(set.targetReps);
  }
  return '-';
}

export function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}

// How many sets of each kind an exercise has
export function setCounts(sets: RoutineSet[]) {
  return {
    main: sets.filter((set) => set.setType === 'NORMAL').length,
    warmup: sets.filter((set) => set.setType === 'WARMUP').length,
    drop: sets.filter((set) => set.setType === 'DROP').length,
  };
}

// "sets" always means the main (working) sets. Warm-up and drop sets are counted on their own.
export function countSets(routine: Routine): number {
  return routine.exercises.reduce((total, item) => total + setCounts(item.sets).main, 0);
}

export function countWarmups(routine: Routine): number {
  return routine.exercises.reduce((total, item) => total + setCounts(item.sets).warmup, 0);
}

export function countDrops(routine: Routine): number {
  return routine.exercises.reduce((total, item) => total + setCounts(item.sets).drop, 0);
}

// "50 kg", or "-" when the set has no weight
export function weightText(set: RoutineSet): string {
  return set.targetWeightKg === null ? '-' : `${set.targetWeightKg} kg`;
}

// The muscles a routine trains most often (by number of exercises), for the chips
export function topMuscles(routine: Routine, max = 3): string[] {
  const counts = new Map<string, number>();
  for (const item of routine.exercises) {
    const muscle = item.exercise.primaryMuscles[0];
    if (muscle) counts.set(muscle, (counts.get(muscle) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([muscle]) => muscle);
}