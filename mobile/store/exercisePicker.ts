import { create } from 'zustand';
import type { ExerciseListItem } from '@/services/types/exercise';

// Hands the exercises chosen in the Exercise Library back to the routine editor
type PickerState = {
  picked: ExerciseListItem[];
  setPicked: (items: ExerciseListItem[]) => void;
  take: () => ExerciseListItem[]; // returns the chosen exercises and empties the list
};

export const useExercisePicker = create<PickerState>((set, get) => ({
  picked: [],
  setPicked: (items) => set({ picked: items }),
  take: () => {
    const items = get().picked;
    if (items.length > 0) set({ picked: [] });
    return items;
  },
}));