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
function repsText(set: RoutineSet): string {
  if (set.repMode === 'RANGE' && set.targetRepsMin !== null && set.targetRepsMax !== null) {
    return `${set.targetRepsMin}-${set.targetRepsMax}`;
  }
  if (set.repMode === 'REPS' && set.targetReps !== null) {
    return String(set.targetReps);
  }
  return '-';
}

// One text for a whole exercise: "8-10" if every set matches, otherwise "12 / 10 / 8"
export function describeReps(sets: RoutineSet[]): string {
  if (sets.length === 0) return '-';
  const texts = sets.map(repsText);
  const unique = texts.filter((text, i) => texts.indexOf(text) === i);
  return unique.length === 1 ? unique[0] : texts.join(' / ');
}

export function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}

// Total number of sets in a routine
export function countSets(routine: Routine): number {
  return routine.exercises.reduce((total, item) => total + item.sets.length, 0);
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