import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  KeyboardAvoidingView,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  Vibration,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { DurationSheet } from '@/components/DurationSheet';
import { StepperInput } from '@/components/StepperInput';
import { formatClock } from '@/lib/workoutFormat';
import { SET_STYLE } from '@/lib/setStyle';
import { WorkoutService } from '@/services/workoutService';
import { useExercisePicker } from '@/store/exercisePicker';
import type { SetType } from '@/services/types/program';
import type { Workout, WorkoutExercise, WorkoutSet } from '@/services/types/workout';

const WEIGHT_STEP = 2.5;
const TICK_W = 52;
const SET_TYPE_ORDER: SetType[] = ['NORMAL', 'WARMUP', 'DROP'];

// What is typed in the weight and reps boxes of each set
type Inputs = Record<string, { weight: string; reps: string }>;

const inputsFor = (set: WorkoutSet) => ({
  weight: set.weightKg === null ? '' : String(set.weightKg),
  reps: set.reps === null ? '' : String(set.reps),
});

// Keeps what the user has typed for sets we already know, and starts new sets from their saved values
function mergeInputs(previous: Inputs, workout: Workout): Inputs {
  const next: Inputs = {};
  for (const exercise of workout.exercises) {
    for (const set of exercise.sets) next[set.id] = previous[set.id] ?? inputsFor(set);
  }
  return next;
}

const round2 = (value: number) => Math.round(value * 100) / 100;

// '' -> null (empty), a valid number -> number, anything else -> 'bad'
function parseWeight(text: string): number | null | 'bad' {
  const value = text.trim().replace(',', '.');
  if (value === '') return null;
  if (!/^\d+(\.\d{1,2})?$/.test(value)) return 'bad';
  return Number(value);
}

function parseReps(text: string): number | null | 'bad' {
  const value = text.trim();
  if (value === '') return null;
  if (!/^\d{1,3}$/.test(value) || Number(value) < 1) return 'bad';
  return Number(value);
}

// Bodyweight exercises hide the weight box unless the user adds weight
function weightShown(exercise: WorkoutExercise, override: boolean | undefined): boolean {
  if (override !== undefined) return override;
  if (exercise.exercise.equipment !== 'body only') return true;
  return exercise.sets.some(
    (set) => (set.weightKg ?? 0) > 0 || (set.previous?.weightKg ?? 0) > 0 || (set.placeholder.weightKg ?? 0) > 0
  );
}

// What the empty boxes show (and what a tick uses): last time's numbers, or the routine's plan when there is no history
function hintOf(set: WorkoutSet): { weight: number | null; reps: number | null } {
  if (set.previous) return { weight: set.previous.weightKg, reps: set.previous.reps };
  return { weight: set.placeholder.weightKg, reps: set.repMode === 'REPS' ? set.placeholder.reps : null };
}

function previousText(set: WorkoutSet, showWeight: boolean): string {
  if (!set.previous) return 'No history yet';
  const { weightKg, reps } = set.previous;
  if (!showWeight || weightKg === null || weightKg === 0) return `${reps ?? '-'} reps`;
  return `${weightKg} kg x ${reps ?? '-'}`;
}

// The big tick button, with a little bounce when a set is completed
function TickButton({ done, onPress }: { done: boolean; onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;

  const press = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.88, duration: 70, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale }], width: TICK_W }}>
      <TouchableOpacity
        onPress={press}
        activeOpacity={0.8}
        style={{
          height: 48,
          borderRadius: 16,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: done ? '#5BD6A0' : 'transparent',
          borderWidth: 2,
          borderColor: done ? '#5BD6A0' : '#344C66',
        }}
      >
        <Ionicons name="checkmark" size={26} color={done ? '#06251A' : '#506680'} />
      </TouchableOpacity>
    </Animated.View>
  );
}

function Chip({
  icon,
  label,
  onPress,
  active = false,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  active?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className={`h-10 px-3 rounded-xl flex-row items-center border ${active ? 'bg-[#1D3558] border-[#2F5185]' : 'bg-[#0B1422] border-[#263B55]'}`}
    >
      <Ionicons name={icon} size={16} color="#8CB5EC" />
      <Text className="text-[#DCE6F4] text-xs font-semibold ml-1.5">{label}</Text>
    </TouchableOpacity>
  );
}

export default function WorkoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [workout, setWorkout] = useState<Workout | null>(null);
  const [inputs, setInputs] = useState<Inputs>({});
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [rowError, setRowError] = useState<Record<string, string>>({});
  const [now, setNow] = useState(Date.now());
  const [rest, setRest] = useState<{ endsAt: number; total: number } | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [updateRoutine, setUpdateRoutine] = useState(true);
  const [busy, setBusy] = useState(false);

  const [nameText, setNameText] = useState('');
  const [notesText, setNotesText] = useState('');
  const [exerciseNotes, setExerciseNotes] = useState<Record<string, string>>({});
  const [weightOverride, setWeightOverride] = useState<Record<string, boolean>>({});
  const [timerSheet, setTimerSheet] = useState<{ kind: 'rest'; exerciseId: string } | { kind: 'custom' } | null>(null);

  // "Apply to all sets" panel (one exercise at a time)
  const [applyFor, setApplyFor] = useState<string | null>(null);
  const [applyForm, setApplyForm] = useState({ weight: '', reps: '', min: '', max: '', mode: 'reps' as 'reps' | 'range' });

  // Set options sheet
  const [sheet, setSheet] = useState<{ exerciseId: string; setId: string } | null>(null);
  const [sheetMode, setSheetMode] = useState<'REPS' | 'RANGE'>('REPS');
  const [rangeMin, setRangeMin] = useState('');
  const [rangeMax, setRangeMax] = useState('');
  const [sheetError, setSheetError] = useState<string | null>(null);

  // Saves for the same set run one after another so the last tap always wins
  const queues = useRef<Record<string, Promise<unknown>>>({});

  const apply = useCallback((next: Workout) => {
    setWorkout(next);
    setInputs((previous) => mergeInputs(previous, next));
  }, []);

  // Replaces the typed text of some sets with what the server now holds
  const resetInputs = (fresh: Workout, ids: Set<string>) =>
    setInputs((previous) => {
      const next = { ...previous };
      for (const exercise of fresh.exercises) {
        for (const set of exercise.sets) if (ids.has(set.id)) next[set.id] = inputsFor(set);
      }
      return next;
    });

  const load = useCallback(() => {
    setStatus('loading');
    WorkoutService.getById(id)
      .then((data) => {
        if (data.status !== 'IN_PROGRESS') {
          router.replace({ pathname: '/workout/summary', params: { id: data.id } } as any);
          return;
        }
        apply(data);
        setNameText(data.name);
        setNotesText(data.notes ?? '');
        setStatus('ready');
      })
      .catch((e) => {
        setLoadError(e instanceof Error ? e.message : String(e));
        setStatus('error');
      });
  }, [id, apply, router]);

  useEffect(() => {
    load();
  }, [load]);

  // Exercises chosen in the library are added to the workout when we come back
  useFocusEffect(
    useCallback(() => {
      const picked = useExercisePicker.getState().take();
      if (picked.length === 0) return;
      (async () => {
        for (const item of picked) {
          try {
            apply(await WorkoutService.addExercise(id, item.id));
          } catch (e) {
            setError(e instanceof Error ? e.message : "Couldn't add the exercise");
            break;
          }
        }
      })();
    }, [id, apply])
  );

  // One clock for the session timer and the rest timer
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const restLeft = rest ? Math.max(0, Math.ceil((rest.endsAt - now) / 1000)) : 0;

  useEffect(() => {
    if (rest && now >= rest.endsAt) {
      Vibration.vibrate([0, 300, 150, 300]);
      setRest(null);
    }
  }, [now, rest]);

  // ---- Small helpers ----
  const updateSetLocal = (setId: string, change: Partial<WorkoutSet>) =>
    setWorkout((previous) =>
      previous
        ? {
            ...previous,
            exercises: previous.exercises.map((exercise) => ({
              ...exercise,
              sets: exercise.sets.map((set) => (set.id === setId ? { ...set, ...change } : set)),
            })),
          }
        : previous
    );

  const setRowMessage = (setId: string, message: string | null) =>
    setRowError((previous) => {
      const next = { ...previous };
      if (message) next[setId] = message;
      else delete next[setId];
      return next;
    });

  // Sends changes for one set, in order
  const saveSet = (set: WorkoutSet, patch: Parameters<typeof WorkoutService.updateSet>[2]) => {
    if (!workout) return Promise.reject(new Error('No workout'));
    const run = (queues.current[set.id] ?? Promise.resolve())
      .catch(() => {})
      .then(async () => {
        const updated = await WorkoutService.updateSet(workout.id, set.id, patch);
        updateSetLocal(set.id, updated);
        return updated;
      });
    queues.current[set.id] = run;
    return run;
  };

  const refresh = async () => {
    if (!workout) return null;
    const fresh = await WorkoutService.getById(workout.id);
    apply(fresh);
    return fresh;
  };

  // Runs a request that returns the whole workout and shows it
  const runWorkoutRequest = async (request: () => Promise<Workout>, failMessage: string) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      apply(await request());
    } catch (e) {
      setError(e instanceof Error ? e.message : failMessage);
    } finally {
      setBusy(false);
    }
  };

  // ---- Name and note ----
  const saveName = async () => {
    if (!workout) return;
    const name = nameText.trim();
    if (name === '' || name === workout.name) {
      setNameText(workout.name);
      return;
    }
    try {
      await WorkoutService.update(workout.id, { name });
      setWorkout((previous) => (previous ? { ...previous, name } : previous));
    } catch (e) {
      setNameText(workout.name);
      setError(e instanceof Error ? e.message : "Couldn't rename the workout");
    }
  };

  const saveNotes = async () => {
    if (!workout) return;
    const notes = notesText.trim();
    if (notes === (workout.notes ?? '')) return;
    try {
      await WorkoutService.update(workout.id, { notes: notes === '' ? null : notes });
      setWorkout((previous) => (previous ? { ...previous, notes: notes === '' ? null : notes } : previous));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save the note");
    }
  };

  const saveExerciseNote = async (exercise: WorkoutExercise) => {
    if (!workout) return;
    const text = (exerciseNotes[exercise.id] ?? exercise.notes ?? '').trim();
    if (text === (exercise.notes ?? '')) return;
    try {
      await WorkoutService.updateExercise(workout.id, exercise.id, { notes: text === '' ? null : text });
      setWorkout((previous) =>
        previous
          ? {
              ...previous,
              exercises: previous.exercises.map((item) => (item.id === exercise.id ? { ...item, notes: text === '' ? null : text } : item)),
            }
          : previous
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save the note");
    }
  };

  // ---- Typing, stepping and ticking sets ----
  // Saves typed weight/reps when the user leaves a box
  const commitInputs = async (set: WorkoutSet, showWeight: boolean) => {
    const typed = inputs[set.id];
    if (!workout || !typed) return;

    const weight = showWeight ? parseWeight(typed.weight) : null;
    const reps = parseReps(typed.reps);
    if (weight === 'bad' || reps === 'bad') {
      setRowMessage(set.id, 'Check the numbers');
      return;
    }
    if (weight === set.weightKg && reps === set.reps) {
      setRowMessage(set.id, null);
      return;
    }

    try {
      await saveSet(set, { weightKg: weight, reps });
      setRowMessage(set.id, null);
    } catch (e) {
      setRowMessage(set.id, e instanceof Error ? e.message : "Couldn't save the set");
    }
  };

  // The + and - buttons
  const step = (set: WorkoutSet, field: 'weight' | 'reps', direction: 1 | -1) => {
    const typed = inputs[set.id] ?? { weight: '', reps: '' };

    if (field === 'weight') {
      const parsed = parseWeight(typed.weight);
      const base = typeof parsed === 'number' ? parsed : (hintOf(set).weight ?? 0);
      const next = Math.max(0, round2(base + direction * WEIGHT_STEP));
      setInputs((previous) => ({ ...previous, [set.id]: { ...typed, weight: String(next) } }));
      saveSet(set, { weightKg: next }).catch((e) => setRowMessage(set.id, e instanceof Error ? e.message : "Couldn't save the weight"));
    } else {
      const parsed = parseReps(typed.reps);
      const base = typeof parsed === 'number' ? parsed : (hintOf(set).reps ?? set.targetRepsMin ?? 0);
      const next = Math.min(999, Math.max(1, base + direction));
      setInputs((previous) => ({ ...previous, [set.id]: { ...typed, reps: String(next) } }));
      saveSet(set, { reps: next }).catch((e) => setRowMessage(set.id, e instanceof Error ? e.message : "Couldn't save the reps"));
    }
    setRowMessage(set.id, null);
  };

  // Ticks a set (empty boxes use the grey numbers; a range set needs its reps typed) or unticks it
  const toggleComplete = async (exercise: WorkoutExercise, set: WorkoutSet, showWeight: boolean) => {
    if (!workout) return;
    setError(null);

    if (set.isCompleted) {
      try {
        await saveSet(set, { isCompleted: false });
        setRowMessage(set.id, null);
      } catch (e) {
        setRowMessage(set.id, e instanceof Error ? e.message : "Couldn't update the set");
      }
      return;
    }

    const typed = inputs[set.id] ?? { weight: '', reps: '' };
    const weightText = !showWeight
      ? ''
      : typed.weight.trim() !== ''
        ? typed.weight
        : hintOf(set).weight !== null
          ? String(hintOf(set).weight)
          : '';
    const repsText =
      typed.reps.trim() !== ''
        ? typed.reps
        : hintOf(set).reps !== null
          ? String(hintOf(set).reps)
          : '';

    const weight = parseWeight(weightText);
    const reps = parseReps(repsText);
    if (weight === 'bad' || reps === 'bad') {
      setRowMessage(set.id, 'Check the numbers');
      return;
    }
    if (reps === null) {
      setRowMessage(set.id, 'Enter your reps (or tap + / -) to complete this set');
      return;
    }

    try {
      await saveSet(set, { weightKg: weight, reps, isCompleted: true });
      setInputs((previous) => ({ ...previous, [set.id]: { weight: weight === null ? '' : String(weight), reps: String(reps) } }));
      setRowMessage(set.id, null);
      Vibration.vibrate(25);
      if (exercise.restSeconds > 0) setRest({ endsAt: Date.now() + exercise.restSeconds * 1000, total: exercise.restSeconds });
    } catch (e) {
      setRowMessage(set.id, e instanceof Error ? e.message : "Couldn't complete the set");
    }
  };

  // Tap the set badge: normal -> warm-up -> drop
  const cycleType = async (set: WorkoutSet) => {
    const next = SET_TYPE_ORDER[(SET_TYPE_ORDER.indexOf(set.setType) + 1) % SET_TYPE_ORDER.length];
    await changeType(set, next);
  };

  const changeType = async (set: WorkoutSet, type: SetType) => {
    if (!workout || type === set.setType) return;
    updateSetLocal(set.id, { setType: type });
    try {
      await saveSet(set, { setType: type });
      await refresh(); // "previous" depends on the type
    } catch (e) {
      updateSetLocal(set.id, { setType: set.setType });
      setError(e instanceof Error ? e.message : "Couldn't change the set type");
    }
  };

  // Copies last time's weight and reps into the given sets
  const copyLast = async (exercise: WorkoutExercise, targets: WorkoutSet[], showWeight: boolean) => {
    const list = targets.filter((set) => set.previous);
    if (!workout) return;
    if (list.length === 0) {
      setError('There is no earlier workout to copy from yet.');
      return;
    }
    setError(null);
    try {
      await Promise.all(
        list.map((set) => {
          const patch: Parameters<typeof WorkoutService.updateSet>[2] = {};
          if (showWeight && set.previous!.weightKg !== null) patch.weightKg = set.previous!.weightKg;
          if (set.previous!.reps !== null) patch.reps = set.previous!.reps;
          return saveSet(set, patch);
        })
      );
      const fresh = await refresh();
      if (fresh) resetInputs(fresh, new Set(list.map((set) => set.id)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't copy the last workout");
    }
  };

  // ---- Apply to all sets ----
  const openApply = (exerciseId: string) => {
    setApplyFor((current) => (current === exerciseId ? null : exerciseId));
    setApplyForm({ weight: '', reps: '', min: '', max: '', mode: 'reps' });
  };

  const submitApply = async (exercise: WorkoutExercise, showWeight: boolean) => {
    const targets = exercise.sets.filter((set) => !set.isCompleted);
    if (targets.length === 0) {
      setError('All sets of this exercise are already done.');
      return;
    }

    const patch: Parameters<typeof WorkoutService.updateSet>[2] = {};
    if (showWeight) {
      const weight = parseWeight(applyForm.weight);
      if (weight === 'bad') return setError('Check the weight');
      if (weight !== null) patch.weightKg = weight;
    }
    if (applyForm.mode === 'reps') {
      const reps = parseReps(applyForm.reps);
      if (reps === 'bad') return setError('Check the reps');
      if (reps !== null) patch.reps = reps;
    } else {
      const min = parseReps(applyForm.min);
      const max = parseReps(applyForm.max);
      if (min === 'bad' || max === 'bad' || min === null || max === null) return setError('Type both the minimum and the maximum reps');
      if (min > max) return setError("Minimum reps can't be above maximum reps");
      patch.repMode = 'RANGE';
      patch.targetRepsMin = min;
      patch.targetRepsMax = max;
    }
    if (Object.keys(patch).length === 0) return setError('Type a weight or reps first');

    setError(null);
    try {
      await Promise.all(targets.map((set) => saveSet(set, patch)));
      const fresh = await refresh();
      if (fresh) resetInputs(fresh, new Set(targets.map((set) => set.id)));
      setApplyFor(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't apply the changes");
    }
  };

  // ---- Set options sheet ----
  const openSheet = (exercise: WorkoutExercise, set: WorkoutSet) => {
    setSheet({ exerciseId: exercise.id, setId: set.id });
    setSheetMode(set.repMode);
    setRangeMin(String(set.targetRepsMin ?? hintOf(set).reps ?? 8));
    setRangeMax(String(set.targetRepsMax ?? (set.targetRepsMin ?? hintOf(set).reps ?? 8) + 4));
    setSheetError(null);
  };

  const sheetExercise = sheet && workout ? workout.exercises.find((item) => item.id === sheet.exerciseId) : undefined;
  const sheetSet = sheetExercise?.sets.find((item) => item.id === sheet?.setId);

  const stepRange = (which: 'min' | 'max', direction: 1 | -1) => {
    const current = Number(which === 'min' ? rangeMin : rangeMax) || 0;
    const next = String(Math.min(999, Math.max(1, current + direction)));
    if (which === 'min') setRangeMin(next);
    else setRangeMax(next);
  };

  const chooseFixed = async () => {
    if (!sheetSet) return;
    setSheetMode('REPS');
    if (sheetSet.repMode === 'REPS') return;
    try {
      await saveSet(sheetSet, { repMode: 'REPS' });
      await refresh();
    } catch (e) {
      setSheetError(e instanceof Error ? e.message : "Couldn't change the rep mode");
    }
  };

  const saveRange = async () => {
    if (!sheetSet) return;
    const min = parseReps(rangeMin);
    const max = parseReps(rangeMax);
    if (min === 'bad' || max === 'bad' || min === null || max === null) return setSheetError('Type both the minimum and the maximum reps');
    if (min > max) return setSheetError("Minimum reps can't be above maximum reps");
    try {
      await saveSet(sheetSet, { repMode: 'RANGE', targetRepsMin: min, targetRepsMax: max });
      await refresh();
      setSheet(null);
    } catch (e) {
      setSheetError(e instanceof Error ? e.message : "Couldn't save the range");
    }
  };

  const deleteSet = (set: WorkoutSet) => {
    if (!workout) return;
    const remove = () => {
      setSheet(null);
      runWorkoutRequest(() => WorkoutService.removeSet(workout.id, set.id), "Couldn't remove the set");
    };
    if (!set.isCompleted) return remove();
    Alert.alert('Delete this completed set?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: remove },
    ]);
  };

  const confirmRemoveExercise = (exercise: WorkoutExercise) => {
    if (!workout) return;
    Alert.alert(`Remove ${exercise.exercise.name}?`, 'Its sets in this workout will be removed.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => runWorkoutRequest(() => WorkoutService.removeExercise(workout.id, exercise.id), "Couldn't remove the exercise"),
      },
    ]);
  };

  const saveRest = async (exerciseId: string, seconds: number) => {
    if (!workout) return;
    setTimerSheet(null);
    await runWorkoutRequest(() => WorkoutService.updateExercise(workout.id, exerciseId, { restSeconds: seconds }), "Couldn't save the rest time");
  };

  // ---- Finish and discard ----
  const allSets = workout ? workout.exercises.flatMap((exercise) => exercise.sets) : [];
  const completedCount = allSets.filter((set) => set.isCompleted).length;
  const incompleteCount = allSets.length - completedCount;

  const openFinish = () => {
    if (completedCount === 0) {
      Alert.alert('Nothing to save yet', 'Complete at least one set first, or discard the workout.');
      return;
    }
    setUpdateRoutine(true);
    setFinishing(true);
  };

  const finish = async () => {
    if (!workout || busy) return;
    setBusy(true);
    try {
      await WorkoutService.finish(workout.id, workout.sourceRoutineId ? updateRoutine : false);
      setFinishing(false);
      router.replace({ pathname: '/workout/summary', params: { id: workout.id, done: '1' } } as any);
    } catch (e) {
      setFinishing(false);
      setError(e instanceof Error ? e.message : "Couldn't finish the workout");
      setBusy(false);
    }
  };

  const confirmDiscard = () => {
    if (!workout) return;
    Alert.alert('Discard this workout?', 'Everything you logged in it will be deleted.', [
      { text: 'Keep training', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: async () => {
          try {
            await WorkoutService.remove(workout.id);
            router.back();
          } catch (e) {
            setError(e instanceof Error ? e.message : "Couldn't discard the workout");
          }
        },
      },
    ]);
  };

  // ---- Screens for loading and errors ----
  if (status === 'loading') {
    return (
      <SafeAreaView className="flex-1 bg-[#0B1422] items-center justify-center">
        <ActivityIndicator color="#8CB5EC" />
      </SafeAreaView>
    );
  }

  if (status === 'error' || !workout) {
    return (
      <SafeAreaView className="flex-1 bg-[#0B1422] items-center justify-center px-8">
        <Text className="text-[#91A5C0] text-center">Couldn't load this workout.</Text>
        {loadError ? <Text className="text-[#F2A0A0] text-xs text-center mt-2">{loadError}</Text> : null}
        <TouchableOpacity onPress={load} className="bg-[#719AD1] h-11 px-6 rounded-xl items-center justify-center mt-4">
          <Text className="text-[#0B1422] font-bold">Try again</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <Text className="text-[#8CB5EC] font-semibold">Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const elapsed = (now - Date.parse(workout.startedAt)) / 1000;
  const restSheetExercise = timerSheet?.kind === 'rest' ? workout.exercises.find((item) => item.id === timerSheet.exerciseId) : undefined;

  return (
    <View className="flex-1 bg-[#0B1422]">
      <KeyboardAvoidingView behavior="padding" className="flex-1">
        {/* Header: stays on screen while you scroll */}
        <View
          style={{ paddingTop: insets.top + 8, shadowColor: '#000', elevation: 6 }}
          className="bg-[#18294A] border-b border-[#2F4A74] px-5 pb-4"
        >
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => router.replace('/(tabs)/training' as any)}
              activeOpacity={0.8}
              className="w-11 h-11 rounded-full bg-[#0F1B2E] border border-[#2F4A74] items-center justify-center"
            >
              <Ionicons name="arrow-back" size={22} color="#F1F5FB" />
            </TouchableOpacity>

            <TextInput
              value={nameText}
              onChangeText={setNameText}
              onBlur={saveName}
              placeholder="Workout name"
              placeholderTextColor="#506680"
              maxLength={150}
              numberOfLines={1}
              className="flex-1 mx-3 text-[#F1F5FB] text-lg font-bold"
              style={{ padding: 0, height: 44 }}
            />

            <TouchableOpacity onPress={openFinish} activeOpacity={0.85} className="bg-[#719AD1] h-11 px-5 rounded-xl items-center justify-center">
              <Text className="text-[#0B1422] font-bold">Finish</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center mt-3 gap-2">
            <View className="h-10 px-4 rounded-xl bg-[#0F1B2E] border border-[#2F4A74] flex-row items-center">
              <Ionicons name="time-outline" size={16} color="#8CB5EC" />
              <Text className="text-[#8CB5EC] font-bold ml-2">{formatClock(elapsed)}</Text>
            </View>

            <TouchableOpacity
              onPress={() => setTimerSheet({ kind: 'custom' })}
              activeOpacity={0.8}
              className="h-10 px-4 rounded-xl bg-[#0F1B2E] border border-[#2F4A74] flex-row items-center"
            >
              <Ionicons name="timer-outline" size={16} color="#8CB5EC" />
              <Text className="text-[#DCE6F4] font-semibold ml-2">Timer</Text>
            </TouchableOpacity>

            <View className="flex-1" />

            <TouchableOpacity
              onPress={confirmDiscard}
              activeOpacity={0.8}
              className="h-10 px-4 rounded-xl bg-[#0F1B2E] border border-[#4A2A33] flex-row items-center"
            >
              <Ionicons name="trash-outline" size={16} color="#F2A0A0" />
              <Text className="text-[#F2A0A0] font-semibold ml-2">Discard</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: insets.bottom + 220 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {/* Note */}
          <View className="flex-row items-start bg-[#142238] border border-[#263B55] rounded-2xl px-3 py-2">
            <Ionicons name="create-outline" size={18} color="#7186A1" style={{ marginTop: 4 }} />
            <TextInput
              value={notesText}
              onChangeText={setNotesText}
              onBlur={saveNotes}
              placeholder="Add a note about this workout..."
              placeholderTextColor="#506680"
              multiline
              maxLength={2000}
              className="flex-1 ml-2 text-[#DCE6F4] text-sm"
              style={{ padding: 0, minHeight: 28, maxHeight: 90 }}
            />
          </View>

          {error && <Text className="text-[#F2A0A0] text-sm mt-3">{error}</Text>}

          {workout.exercises.length === 0 && (
            <View className="bg-[#142238] border border-[#263B55] rounded-2xl p-4 mt-4">
              <Text className="text-[#91A5C0] text-sm">This workout is empty. Add your first exercise below.</Text>
            </View>
          )}

          {workout.exercises.map((exercise) => {
            const showWeight = weightShown(exercise, weightOverride[exercise.id]);
            const isBodyOnly = exercise.exercise.equipment === 'body only';
            const applyOpen = applyFor === exercise.id;

            return (
              <View key={exercise.id} className="bg-[#142238] border border-[#263B55] rounded-3xl p-3 mt-4">
                {/* Exercise header: tap the picture or name to see how it is done */}
                <View className="flex-row items-center">
                  <TouchableOpacity
                    onPress={() => router.push({ pathname: '/exercises/[id]', params: { id: exercise.exercise.id } } as any)}
                    activeOpacity={0.8}
                    className="flex-1 flex-row items-center"
                  >
                    {exercise.exercise.image ? (
                      <Image source={{ uri: exercise.exercise.image }} className="w-14 h-14 rounded-xl bg-[#263B55]" resizeMode="cover" />
                    ) : (
                      <View className="w-14 h-14 rounded-xl bg-[#263B55] items-center justify-center">
                        <Ionicons name="barbell-outline" size={20} color="#8CB5EC" />
                      </View>
                    )}
                    <View className="flex-1 mx-3">
                      <Text className="text-[#F1F5FB] font-bold text-base" numberOfLines={2}>
                        {exercise.exercise.name}
                      </Text>
                      <Text className="text-[#7186A1] text-xs mt-0.5">Tap to see how it's done</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => confirmRemoveExercise(exercise)} hitSlop={8} className="w-10 h-10 items-center justify-center">
                    <Ionicons name="trash-outline" size={20} color="#F2A0A0" />
                  </TouchableOpacity>
                </View>

                {/* Quick actions */}
                <View className="flex-row flex-wrap gap-2 mt-3">
                  <Chip
                    icon="timer-outline"
                    label={`Rest ${exercise.restSeconds}s`}
                    onPress={() => setTimerSheet({ kind: 'rest', exerciseId: exercise.id })}
                  />
                  <Chip icon="copy-outline" label="Use last time" onPress={() => copyLast(exercise, exercise.sets.filter((set) => !set.isCompleted), showWeight)} />
                  <Chip icon="layers-outline" label="Apply to all" active={applyOpen} onPress={() => openApply(exercise.id)} />
                  {isBodyOnly && (
                    <Chip
                      icon={showWeight ? 'body-outline' : 'barbell-outline'}
                      label={showWeight ? 'Bodyweight only' : 'Add weight'}
                      onPress={() => setWeightOverride((previous) => ({ ...previous, [exercise.id]: !showWeight }))}
                    />
                  )}
                </View>

                {/* Apply to all */}
                {applyOpen && (
                  <View className="bg-[#0F1B2E] border border-[#263B55] rounded-2xl p-3 mt-3">
                    <View className="flex-row items-center">
                      <Text className="text-[#F1F5FB] font-bold flex-1">Apply to all unticked sets</Text>
                      <View className="flex-row bg-[#0B1422] rounded-lg p-0.5">
                        {(['reps', 'range'] as const).map((mode) => (
                          <TouchableOpacity
                            key={mode}
                            onPress={() => setApplyForm((previous) => ({ ...previous, mode }))}
                            className={`h-8 px-3 rounded-md items-center justify-center ${applyForm.mode === mode ? 'bg-[#1D3558]' : ''}`}
                          >
                            <Text className={`text-xs font-bold ${applyForm.mode === mode ? 'text-[#8CB5EC]' : 'text-[#7186A1]'}`}>
                              {mode === 'reps' ? 'Reps' : 'Range'}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    <View className="flex-row items-center gap-2 mt-3">
                      {showWeight && (
                        <TextInput
                          value={applyForm.weight}
                          onChangeText={(text) => setApplyForm((previous) => ({ ...previous, weight: text }))}
                          placeholder="Weight (kg)"
                          placeholderTextColor="#506680"
                          keyboardType="decimal-pad"
                          maxLength={6}
                          className="flex-1 h-12 bg-[#0B1422] border border-[#263B55] rounded-xl text-[#F1F5FB] font-semibold"
                          style={{ padding: 0, textAlign: 'center', fontSize: 15 }}
                        />
                      )}
                      {applyForm.mode === 'reps' ? (
                        <TextInput
                          value={applyForm.reps}
                          onChangeText={(text) => setApplyForm((previous) => ({ ...previous, reps: text }))}
                          placeholder="Reps"
                          placeholderTextColor="#506680"
                          keyboardType="number-pad"
                          maxLength={3}
                          className="flex-1 h-12 bg-[#0B1422] border border-[#263B55] rounded-xl text-[#F1F5FB] font-semibold"
                          style={{ padding: 0, textAlign: 'center', fontSize: 15 }}
                        />
                      ) : (
                        <>
                          <TextInput
                            value={applyForm.min}
                            onChangeText={(text) => setApplyForm((previous) => ({ ...previous, min: text }))}
                            placeholder="Min"
                            placeholderTextColor="#506680"
                            keyboardType="number-pad"
                            maxLength={3}
                            className="flex-1 h-12 bg-[#0B1422] border border-[#263B55] rounded-xl text-[#F1F5FB] font-semibold"
                            style={{ padding: 0, textAlign: 'center', fontSize: 15 }}
                          />
                          <TextInput
                            value={applyForm.max}
                            onChangeText={(text) => setApplyForm((previous) => ({ ...previous, max: text }))}
                            placeholder="Max"
                            placeholderTextColor="#506680"
                            keyboardType="number-pad"
                            maxLength={3}
                            className="flex-1 h-12 bg-[#0B1422] border border-[#263B55] rounded-xl text-[#F1F5FB] font-semibold"
                            style={{ padding: 0, textAlign: 'center', fontSize: 15 }}
                          />
                        </>
                      )}
                    </View>

                    <TouchableOpacity
                      onPress={() => submitApply(exercise, showWeight)}
                      activeOpacity={0.85}
                      className="bg-[#719AD1] h-12 rounded-xl items-center justify-center mt-3"
                    >
                      <Text className="text-[#0B1422] font-bold">Apply</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Exercise note */}
                <View className="flex-row items-start bg-[#0F1B2E] border border-[#1C2E47] rounded-xl px-3 py-2 mt-3">
                  <Ionicons name="bulb-outline" size={16} color="#7186A1" style={{ marginTop: 3 }} />
                  <TextInput
                    value={exerciseNotes[exercise.id] ?? exercise.notes ?? ''}
                    onChangeText={(text) => setExerciseNotes((previous) => ({ ...previous, [exercise.id]: text }))}
                    onBlur={() => saveExerciseNote(exercise)}
                    placeholder="Note for this exercise (a cue, a trick...)"
                    placeholderTextColor="#506680"
                    multiline
                    maxLength={500}
                    className="flex-1 ml-2 text-[#DCE6F4] text-sm"
                    style={{ padding: 0, minHeight: 22, maxHeight: 80 }}
                  />
                </View>

                {/* Sets */}
                {exercise.sets.map((set, index) => {
                  const style = SET_STYLE[set.setType];
                  const number = exercise.sets.slice(0, index + 1).filter((item) => item.setType === 'NORMAL').length;
                  const typed = inputs[set.id] ?? { weight: '', reps: '' };
                  const message = rowError[set.id];

                  const hint = hintOf(set);
                  const weightPlaceholder = hint.weight !== null ? String(hint.weight) : '0';
                  const rangeText = set.repMode === 'RANGE' ? `${set.targetRepsMin}-${set.targetRepsMax}` : null;
                  const repsPlaceholder = hint.reps !== null ? String(hint.reps) : (rangeText ?? '0');

                  return (
                    <View
                      key={set.id}
                      className="rounded-2xl p-2 mb-2 border"
                      style={{
                        backgroundColor: set.isCompleted ? '#10291E' : '#0F1B2E',
                        borderColor: set.isCompleted ? '#1F5A3E' : '#1C2E47',
                      }}
                    >
                      {/* Badge, last time, options */}
                      <View className="flex-row items-center gap-2">
                        <TouchableOpacity
                          onPress={() => cycleType(set)}
                          activeOpacity={0.8}
                          style={{ minWidth: 44, backgroundColor: style.bg, borderColor: style.border, borderWidth: 1 }}
                          className="h-9 px-2 rounded-xl items-center justify-center"
                        >
                          <Text style={{ color: style.text }} className="font-bold">
                            {set.setType === 'NORMAL' ? number : set.setType === 'WARMUP' ? 'W' : 'D'}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => copyLast(exercise, [set], showWeight)}
                          disabled={!set.previous || set.isCompleted}
                          activeOpacity={0.7}
                          style={{ backgroundColor: '#14263F', borderColor: set.previous ? '#2F5185' : '#1C2E47', borderStyle: 'dashed', borderWidth: 1 }}
                          className="flex-1 h-9 rounded-xl flex-row items-center px-2"
                        >
                          <View className="bg-[#2F5185] rounded-md px-1.5 py-0.5">
                            <Text className="text-[#DCE6F4] text-[9px] font-bold tracking-widest">LAST</Text>
                          </View>
                          <Text className="text-[#C9D8EE] text-xs font-semibold ml-2 flex-1" numberOfLines={1}>
                            {previousText(set, showWeight)}
                          </Text>
                          {set.previous && !set.isCompleted && <Ionicons name="return-down-forward-outline" size={15} color="#8CB5EC" />}
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => openSheet(exercise, set)}
                          activeOpacity={0.7}
                          className="w-9 h-9 rounded-xl bg-[#0B1422] border border-[#1C2E47] items-center justify-center"
                        >
                          <Ionicons name="ellipsis-horizontal" size={18} color="#DCE6F4" />
                        </TouchableOpacity>
                      </View>

                      {/* Titles for the boxes */}
                      <View className="flex-row items-center gap-2 mt-2">
                        {showWeight && <Text style={{ flex: 1 }} className="text-center text-[#7186A1] text-[10px] font-bold tracking-widest">KG</Text>}
                        <Text style={{ flex: 1 }} className="text-center text-[#7186A1] text-[10px] font-bold tracking-widest">
                          {rangeText ? `REPS  (${rangeText})` : 'REPS'}
                        </Text>
                        <View style={{ width: TICK_W }} />
                      </View>

                      {/* Weight, reps, tick */}
                      <View className="flex-row items-center gap-2 mt-1">
                        {showWeight && (
                          <View style={{ flex: 1 }}>
                            <StepperInput
                              value={typed.weight}
                              placeholder={weightPlaceholder}
                              decimal
                              maxLength={6}
                              onChangeText={(text) => setInputs((previous) => ({ ...previous, [set.id]: { ...typed, weight: text } }))}
                              onBlur={() => commitInputs(set, showWeight)}
                              onMinus={() => step(set, 'weight', -1)}
                              onPlus={() => step(set, 'weight', 1)}
                            />
                          </View>
                        )}
                        <View style={{ flex: 1 }}>
                          <StepperInput
                            value={typed.reps}
                            placeholder={repsPlaceholder}
                            maxLength={3}
                            onChangeText={(text) => setInputs((previous) => ({ ...previous, [set.id]: { ...typed, reps: text } }))}
                            onBlur={() => commitInputs(set, showWeight)}
                            onMinus={() => step(set, 'reps', -1)}
                            onPlus={() => step(set, 'reps', 1)}
                          />
                        </View>
                        <TickButton done={set.isCompleted} onPress={() => toggleComplete(exercise, set, showWeight)} />
                      </View>

                      {message ? <Text className="text-[#F2A0A0] text-xs mt-2 ml-1">{message}</Text> : null}
                    </View>
                  );
                })}

                <TouchableOpacity
                  onPress={() => runWorkoutRequest(() => WorkoutService.addSet(workout.id, exercise.id), "Couldn't add the set")}
                  activeOpacity={0.8}
                  className="h-12 rounded-xl bg-[#263B55] flex-row items-center justify-center gap-1 mt-1"
                >
                  <Ionicons name="add" size={18} color="#DCE6F4" />
                  <Text className="text-[#DCE6F4] text-sm font-semibold">Add set</Text>
                </TouchableOpacity>
              </View>
            );
          })}

          {/* Add exercises */}
          <TouchableOpacity
            onPress={() => router.push({ pathname: '/exercises', params: { pick: '1' } } as any)}
            activeOpacity={0.85}
            className="h-14 rounded-2xl border border-dashed border-[#344C66] flex-row items-center justify-center gap-2 mt-5"
          >
            <Ionicons name="add-circle-outline" size={22} color="#8CB5EC" />
            <Text className="text-[#8CB5EC] font-bold">Add exercises</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Rest timer */}
        {rest && restLeft > 0 && (
          <View className="absolute left-5 right-5 bottom-8 bg-[#1D3558] border border-[#2F5185] rounded-2xl p-3">
            <View className="flex-row items-center">
              <Ionicons name="timer-outline" size={20} color="#8CB5EC" />
              <Text className="text-[#F1F5FB] text-xl font-bold ml-2">{formatClock(restLeft)}</Text>

              <View className="flex-1" />

              <TouchableOpacity
                onPress={() => setRest((current) => (current ? { ...current, endsAt: Math.max(Date.now() + 1000, current.endsAt - 15000) } : current))}
                className="h-10 px-3 rounded-lg bg-[#2F5185] items-center justify-center mr-2"
              >
                <Text className="text-[#DCE6F4] text-xs font-bold">-15s</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setRest((current) => (current ? { ...current, endsAt: current.endsAt + 15000, total: current.total + 15 } : current))}
                className="h-10 px-3 rounded-lg bg-[#2F5185] items-center justify-center mr-2"
              >
                <Text className="text-[#DCE6F4] text-xs font-bold">+15s</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setRest(null)} className="h-10 px-4 rounded-lg bg-[#719AD1] items-center justify-center">
                <Text className="text-[#0B1422] text-xs font-bold">Skip</Text>
              </TouchableOpacity>
            </View>

            <View className="h-1.5 rounded-full bg-[#2F5185] mt-3 overflow-hidden">
              <View className="h-full rounded-full bg-[#8CB5EC]" style={{ width: `${Math.min(100, (restLeft / Math.max(rest.total, 1)) * 100)}%` }} />
            </View>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* Rest time of an exercise */}
      <DurationSheet
        visible={timerSheet?.kind === 'rest' && !!restSheetExercise}
        title="Rest time"
        subtitle={restSheetExercise?.exercise.name}
        initial={restSheetExercise?.restSeconds ?? 90}
        confirmLabel="Save rest time"
        onClose={() => setTimerSheet(null)}
        onConfirm={(seconds) => timerSheet?.kind === 'rest' && saveRest(timerSheet.exerciseId, seconds)}
      />

      {/* Free timer */}
      <DurationSheet
        visible={timerSheet?.kind === 'custom'}
        title="Timer"
        subtitle="Start a countdown any time"
        initial={60}
        confirmLabel="Start timer"
        onClose={() => setTimerSheet(null)}
        onConfirm={(seconds) => {
          setTimerSheet(null);
          if (seconds > 0) setRest({ endsAt: Date.now() + seconds * 1000, total: seconds });
        }}
      />

      {/* Set options */}
      <Modal visible={!!sheetSet} transparent animationType="slide" onRequestClose={() => setSheet(null)}>
        <KeyboardAvoidingView behavior="padding" className="flex-1 justify-end">
          <TouchableOpacity activeOpacity={1} onPress={() => setSheet(null)} className="flex-1 bg-black/60" />
          {sheetSet && sheetExercise && (
            <View style={{ paddingBottom: insets.bottom + 20 }} className="bg-[#142238] rounded-t-3xl px-5 pt-5 border-t border-[#263B55]">
              <View className="flex-row items-center">
                <Text className="text-[#F1F5FB] text-xl font-bold flex-1" numberOfLines={1}>
                  {sheetExercise.exercise.name}
                </Text>
                <TouchableOpacity onPress={() => setSheet(null)} hitSlop={10}>
                  <Ionicons name="close" size={24} color="#91A5C0" />
                </TouchableOpacity>
              </View>

              <Text className="text-[#7186A1] text-[10px] font-bold tracking-widest mt-5">SET TYPE</Text>
              <View className="flex-row gap-2 mt-2">
                {SET_TYPE_ORDER.map((type) => {
                  const style = SET_STYLE[type];
                  const selected = sheetSet.setType === type;
                  return (
                    <TouchableOpacity
                      key={type}
                      onPress={() => changeType(sheetSet, type)}
                      activeOpacity={0.8}
                      style={{ backgroundColor: selected ? style.bg : '#0B1422', borderColor: selected ? style.border : '#263B55', borderWidth: 1 }}
                      className="flex-1 h-12 rounded-xl items-center justify-center"
                    >
                      <Text style={{ color: selected ? style.text : '#91A5C0' }} className="font-bold text-xs">
                        {type === 'NORMAL' ? 'Working' : type === 'WARMUP' ? 'Warm-up' : 'Drop'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text className="text-[#7186A1] text-[10px] font-bold tracking-widest mt-5">REPS</Text>
              <View className="flex-row gap-2 mt-2">
                <TouchableOpacity
                  onPress={chooseFixed}
                  activeOpacity={0.8}
                  className={`flex-1 h-12 rounded-xl items-center justify-center border ${sheetMode === 'REPS' ? 'bg-[#1D3558] border-[#2F5185]' : 'bg-[#0B1422] border-[#263B55]'}`}
                >
                  <Text className={`font-bold text-xs ${sheetMode === 'REPS' ? 'text-[#8CB5EC]' : 'text-[#91A5C0]'}`}>Fixed reps</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setSheetMode('RANGE')}
                  activeOpacity={0.8}
                  className={`flex-1 h-12 rounded-xl items-center justify-center border ${sheetMode === 'RANGE' ? 'bg-[#1D3558] border-[#2F5185]' : 'bg-[#0B1422] border-[#263B55]'}`}
                >
                  <Text className={`font-bold text-xs ${sheetMode === 'RANGE' ? 'text-[#8CB5EC]' : 'text-[#91A5C0]'}`}>Rep range</Text>
                </TouchableOpacity>
              </View>

              {sheetMode === 'RANGE' && (
                <View className="mt-3">
                  <View className="flex-row items-center gap-2">
                    <View style={{ flex: 1 }}>
                      <StepperInput value={rangeMin} placeholder="Min" maxLength={3} onChangeText={setRangeMin} onMinus={() => stepRange('min', -1)} onPlus={() => stepRange('min', 1)} />
                    </View>
                    <Text className="text-[#7186A1] font-bold">to</Text>
                    <View style={{ flex: 1 }}>
                      <StepperInput value={rangeMax} placeholder="Max" maxLength={3} onChangeText={setRangeMax} onMinus={() => stepRange('max', -1)} onPlus={() => stepRange('max', 1)} />
                    </View>
                  </View>
                  <TouchableOpacity onPress={saveRange} activeOpacity={0.85} className="bg-[#719AD1] h-12 rounded-xl items-center justify-center mt-3">
                    <Text className="text-[#0B1422] font-bold">Save range</Text>
                  </TouchableOpacity>
                </View>
              )}

              {sheetError && <Text className="text-[#F2A0A0] text-xs mt-3">{sheetError}</Text>}

              <TouchableOpacity
                onPress={() => deleteSet(sheetSet)}
                activeOpacity={0.85}
                className="h-12 rounded-xl border border-[#4A2A33] flex-row items-center justify-center gap-2 mt-6"
              >
                <Ionicons name="trash-outline" size={18} color="#F2A0A0" />
                <Text className="text-[#F2A0A0] font-semibold">Delete this set</Text>
              </TouchableOpacity>
            </View>
          )}
        </KeyboardAvoidingView>
      </Modal>

      {/* Finish pop-up */}
      <Modal visible={finishing} transparent animationType="fade" onRequestClose={() => setFinishing(false)}>
        <View className="flex-1 bg-black/60 justify-center px-6">
          <View className="bg-[#142238] border border-[#263B55] rounded-3xl p-5">
            <Text className="text-[#F1F5FB] text-xl font-bold">Finish workout?</Text>
            <Text className="text-[#91A5C0] text-sm mt-2 leading-5">
              {`${completedCount} ${completedCount === 1 ? 'set' : 'sets'} completed.`}
              {incompleteCount > 0
                ? ` ${incompleteCount} unfinished ${incompleteCount === 1 ? 'set' : 'sets'} won't be saved in the workout.`
                : ''}
            </Text>

            {workout.sourceRoutineId && (
              <TouchableOpacity onPress={() => setUpdateRoutine((current) => !current)} activeOpacity={0.8} className="flex-row items-center mt-5">
                <Ionicons name={updateRoutine ? 'checkbox' : 'square-outline'} size={24} color={updateRoutine ? '#719AD1' : '#7186A1'} />
                <Text className="text-[#DCE6F4] text-sm ml-3 flex-1 leading-5">Update my routine with these weights and reps</Text>
              </TouchableOpacity>
            )}

            <View className="flex-row gap-3 mt-6">
              <TouchableOpacity onPress={() => setFinishing(false)} disabled={busy} className="flex-1 h-12 rounded-xl border border-[#263B55] items-center justify-center">
                <Text className="text-[#DCE6F4] font-semibold">Keep training</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={finish} disabled={busy} className="flex-1 h-12 rounded-xl bg-[#719AD1] items-center justify-center">
                {busy ? <ActivityIndicator color="#0B1422" /> : <Text className="text-[#0B1422] font-bold">Finish</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}