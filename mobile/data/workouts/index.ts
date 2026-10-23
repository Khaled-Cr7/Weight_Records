import { broSplitData } from './broSplit';
import { pplSplitData } from './pplSplit';
import { ulSplitData } from './ulSplit';
import { fullSplitData } from './fullSplit';

export interface WorkoutExercise {
  name: string;
  sets: number;
  reps: string;
}

export interface WorkoutDay {
  day: string;
  exercises: WorkoutExercise[];
}

export interface WorkoutPlan {
  name: string;
  focus: string;
  schedule: WorkoutDay[];
}

export const workoutPlans: { [key: string]: WorkoutPlan } = {
  broSplit: broSplitData,
  pplSplit: pplSplitData,
  ulSplit: ulSplitData,
  fullSplit: fullSplitData,
};