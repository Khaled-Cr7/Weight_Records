import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { ScreenHeader } from '@/components/ScreenHeader';
import { RoutineService } from '@/services/programService';
import type { ExerciseListItem } from '@/services/types/exercise';
import type { RepMode, Routine, RoutineExerciseInput, RoutineInput, SetType } from '@/services/types/program';
import { useExercisePicker } from '@/store/exercisePicker';

// ---- What the screen edits (everything is text while typing) ----
type DraftSet = {
  key: string;
  setType: SetType;
  repMode: RepMode;
  weight: string;
  reps: string;
  min: string;
  max: string;
};

type DraftExercise = {
  key: string;
  exerciseId: string;
  name: string;
  image: string | null;
  detail: string;
  rest: string;
  sets: DraftSet[];
};

let keyCounter = 0;
const nextKey = () => `k${++keyCounter}`;

const emptySet = (): DraftSet => ({
  key: nextKey(),
  setType: 'NORMAL',
  repMode: 'REPS',
  weight: '',
  reps: '',
  min: '',
  max: '',
});

function fromPicked(item: ExerciseListItem): DraftExercise {
  return {
    key: nextKey(),
    exerciseId: item.id,
    name: item.name,
    image: item.image,
    detail: [item.primaryMuscles[0], item.equipment ?? 'no equipment'].filter(Boolean).join(' • '),
    rest: '90',
    sets: [emptySet(), emptySet(), emptySet()],
  };
}

function fromRoutine(routine: Routine): DraftExercise[] {
  return routine.exercises.map((item) => ({
    key: nextKey(),
    exerciseId: item.exercise.id,
    name: item.exercise.name,
    image: item.exercise.image,
    detail: [item.exercise.primaryMuscles[0], item.exercise.equipment ?? 'no equipment'].filter(Boolean).join(' • '),
    rest: String(item.restSeconds ?? 90),
    sets: item.sets.map((set) => ({
      key: nextKey(),
      setType: set.setType,
      repMode: set.repMode,
      weight: set.targetWeightKg === null ? '' : String(set.targetWeightKg),
      reps: set.targetReps === null ? '' : String(set.targetReps),
      min: set.targetRepsMin === null ? '' : String(set.targetRepsMin),
      max: set.targetRepsMax === null ? '' : String(set.targetRepsMax),
    })),
  }));
}

// ---- Turning the typed text into what the server expects ----
function buildBody(name: string, exercises: DraftExercise[]): { error: string } | { body: RoutineInput } {
  if (!name.trim()) return { error: 'Give the routine a name' };

  const result: RoutineExerciseInput[] = [];

  for (const exercise of exercises) {
    if (exercise.sets.length === 0) return { error: `${exercise.name} needs at least one set` };

    const restText = exercise.rest.trim();
    if (restText !== '' && !/^\d{1,4}$/.test(restText)) return { error: `Check the rest time of ${exercise.name}` };
    const restSeconds = restText === '' ? 90 : Number(restText);
    if (restSeconds > 1800) return { error: `Rest time of ${exercise.name} can be at most 1800 seconds` };

    const sets: RoutineExerciseInput['sets'] = [];

    for (let i = 0; i < exercise.sets.length; i++) {
      const set = exercise.sets[i];
      const where = `set ${i + 1} of ${exercise.name}`;

      const weightText = set.weight.trim().replace(',', '.');
      if (weightText !== '' && !/^\d+(\.\d{1,2})?$/.test(weightText)) return { error: `Check the weight in ${where}` };
      const targetWeightKg = weightText === '' ? null : Number(weightText);

      if (set.repMode === 'RANGE') {
        if (!/^\d+$/.test(set.min.trim()) || !/^\d+$/.test(set.max.trim())) {
          return { error: `Enter both a minimum and a maximum in ${where}` };
        }
        const min = Number(set.min);
        const max = Number(set.max);
        if (min < 1 || max > 999) return { error: `Reps must be between 1 and 999 in ${where}` };
        if (min > max) return { error: `The minimum is above the maximum in ${where}` };
        sets.push({ setType: set.setType, repMode: 'RANGE', targetWeightKg, targetRepsMin: min, targetRepsMax: max });
      } else {
        const repsText = set.reps.trim();
        if (repsText !== '' && !/^\d+$/.test(repsText)) return { error: `Check the reps in ${where}` };
        const targetReps = repsText === '' ? null : Number(repsText);
        if (targetReps !== null && (targetReps < 1 || targetReps > 999)) {
          return { error: `Reps must be between 1 and 999 in ${where}` };
        }
        sets.push({ setType: set.setType, repMode: 'REPS', targetWeightKg, targetReps });
      }
    }

    result.push({ exerciseId: exercise.exerciseId, restSeconds, sets });
  }

  return { body: { name: name.trim(), exercises: result } };
}

// ---- Small input used for numbers ----
function NumberInput(props: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  decimal?: boolean;
  className?: string;
}) {
  return (
    <TextInput
      value={props.value}
      onChangeText={props.onChangeText}
      placeholder={props.placeholder}
      placeholderTextColor="#7186A1"
      keyboardType={props.decimal ? 'decimal-pad' : 'number-pad'}
      maxLength={7}
      selectTextOnFocus
      className={`h-10 bg-[#0B1422] border border-[#263B55] rounded-lg text-center text-[#F1F5FB] ${props.className ?? ''}`}
    />
  );
}

const SET_TYPE_ORDER: SetType[] = ['NORMAL', 'WARMUP', 'DROP'];

export default function RoutineEditor() {
  const router = useRouter();
  const { id, programId } = useLocalSearchParams<{ id?: string; programId?: string }>();
  const isEdit = Boolean(id);

  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(isEdit ? 'loading' : 'ready');
  const [name, setName] = useState('');
  const [exercises, setExercises] = useState<DraftExercise[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit mode: load the routine
  const load = useCallback(() => {
    if (!id) return;
    setStatus('loading');
    RoutineService.getById(id)
      .then((routine) => {
        if (routine.isReadyMade) {
          setStatus('error');
          return;
        }
        setName(routine.name);
        setExercises(fromRoutine(routine));
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // Exercises ticked in the library are added when we come back
  useFocusEffect(
    useCallback(() => {
      const picked = useExercisePicker.getState().take();
      if (picked.length > 0) setExercises((previous) => [...previous, ...picked.map(fromPicked)]);
    }, [])
  );

  // ---- Changing the draft ----
  const changeExercise = (key: string, change: (exercise: DraftExercise) => DraftExercise) =>
    setExercises((previous) => previous.map((exercise) => (exercise.key === key ? change(exercise) : exercise)));

  const changeSet = (exerciseKey: string, setKey: string, change: Partial<DraftSet>) =>
    changeExercise(exerciseKey, (exercise) => ({
      ...exercise,
      sets: exercise.sets.map((set) => (set.key === setKey ? { ...set, ...change } : set)),
    }));

  const removeExercise = (key: string) => setExercises((previous) => previous.filter((exercise) => exercise.key !== key));

  const moveExercise = (index: number, delta: -1 | 1) =>
    setExercises((previous) => {
      const target = index + delta;
      if (target < 0 || target >= previous.length) return previous;
      const next = [...previous];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  // A new set starts as a copy of the last one
  const addSet = (key: string) =>
    changeExercise(key, (exercise) => {
      const last = exercise.sets[exercise.sets.length - 1];
      return { ...exercise, sets: [...exercise.sets, last ? { ...last, key: nextKey() } : emptySet()] };
    });

  const removeSet = (exerciseKey: string, setKey: string) =>
    changeExercise(exerciseKey, (exercise) => ({
      ...exercise,
      sets: exercise.sets.filter((set) => set.key !== setKey),
    }));

  const setModeForAll = (key: string, repMode: RepMode) =>
    changeExercise(key, (exercise) => ({
      ...exercise,
      sets: exercise.sets.map((set) => ({ ...set, repMode })),
    }));

  const openPicker = () => router.push({ pathname: '/exercises', params: { pick: '1' } } as any);

  // ---- Save ----
  const save = async () => {
    if (saving) return;
    const built = buildBody(name, exercises);
    if ('error' in built) {
      setError(built.error);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (id) {
        await RoutineService.update(id, built.body);
        router.back();
      } else {
        const created = await RoutineService.create({ ...built.body, programId: programId || undefined });
        router.replace({ pathname: '/routines/[id]', params: { id: created.id } } as any);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save the routine");
      setSaving(false);
    }
  };

  const saveButton = (
    <TouchableOpacity
      onPress={save}
      disabled={saving || status !== 'ready'}
      activeOpacity={0.85}
      className="bg-[#719AD1] h-10 px-5 rounded-xl items-center justify-center"
    >
      {saving ? <ActivityIndicator color="#0B1422" /> : <Text className="text-[#0B1422] font-bold">Save</Text>}
    </TouchableOpacity>
  );

  if (status === 'loading') {
    return (
      <SafeAreaView className="flex-1 bg-[#0B1422]">
        <ScreenHeader title="Edit routine" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#8CB5EC" />
        </View>
      </SafeAreaView>
    );
  }

  if (status === 'error') {
    return (
      <SafeAreaView className="flex-1 bg-[#0B1422]">
        <ScreenHeader title="Edit routine" />
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-[#91A5C0] text-center">Couldn't load this routine.</Text>
          <TouchableOpacity
            onPress={load}
            className="bg-[#719AD1] h-11 px-6 rounded-xl items-center justify-center mt-4"
          >
            <Text className="text-[#0B1422] font-bold">Try again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#0B1422]">
      <ScreenHeader title={isEdit ? 'Edit routine' : 'New routine'} right={saveButton} />

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pt-5 pb-40"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Name */}
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Routine name"
          placeholderTextColor="#7186A1"
          maxLength={150}
          className="h-14 bg-[#142238] border border-[#263B55] rounded-2xl px-4 text-[#F1F5FB] text-lg font-bold"
        />

        {error && <Text className="text-[#F2A0A0] text-sm mt-3">{error}</Text>}

        {/* Exercises */}
        {exercises.length === 0 && (
          <View className="bg-[#142238] border border-[#263B55] rounded-2xl p-4 mt-5">
            <Text className="text-[#91A5C0] text-sm">No exercises yet. Add some below.</Text>
          </View>
        )}

        {exercises.map((exercise, index) => {
          const allReps = exercise.sets.length > 0 && exercise.sets.every((set) => set.repMode === 'REPS');
          const allRange = exercise.sets.length > 0 && exercise.sets.every((set) => set.repMode === 'RANGE');

          return (
            <View key={exercise.key} className="bg-[#142238] border border-[#263B55] rounded-2xl p-4 mt-5">
              {/* Exercise header */}
              <View className="flex-row items-center">
                {exercise.image ? (
                  <Image source={{ uri: exercise.image }} className="w-12 h-12 rounded-lg bg-[#263B55]" resizeMode="cover" />
                ) : (
                  <View className="w-12 h-12 rounded-lg bg-[#263B55] items-center justify-center">
                    <Ionicons name="barbell-outline" size={18} color="#8CB5EC" />
                  </View>
                )}

                <View className="flex-1 mx-3">
                  <Text className="text-[#F1F5FB] font-bold" numberOfLines={2}>
                    {exercise.name}
                  </Text>
                  <Text className="text-[#91A5C0] text-xs mt-0.5 capitalize" numberOfLines={1}>
                    {exercise.detail}
                  </Text>
                </View>

                <TouchableOpacity onPress={() => moveExercise(index, -1)} hitSlop={8} className="p-1.5">
                  <Ionicons name="chevron-up" size={18} color={index === 0 ? '#344C66' : '#8CB5EC'} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => moveExercise(index, 1)} hitSlop={8} className="p-1.5">
                  <Ionicons name="chevron-down" size={18} color={index === exercises.length - 1 ? '#344C66' : '#8CB5EC'} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => removeExercise(exercise.key)} hitSlop={8} className="p-1.5">
                  <Ionicons name="trash-outline" size={18} color="#F2A0A0" />
                </TouchableOpacity>
              </View>

              {/* Reps / Range for the whole exercise, and rest time */}
              <View className="flex-row items-center justify-between mt-4">
                <View className="flex-row bg-[#0B1422] border border-[#263B55] rounded-lg p-0.5">
                  <TouchableOpacity
                    onPress={() => setModeForAll(exercise.key, 'REPS')}
                    className={`px-4 h-8 rounded-md items-center justify-center ${allReps ? 'bg-[#719AD1]' : ''}`}
                  >
                    <Text className={`text-xs font-semibold ${allReps ? 'text-[#0B1422]' : 'text-[#91A5C0]'}`}>Reps</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setModeForAll(exercise.key, 'RANGE')}
                    className={`px-4 h-8 rounded-md items-center justify-center ${allRange ? 'bg-[#719AD1]' : ''}`}
                  >
                    <Text className={`text-xs font-semibold ${allRange ? 'text-[#0B1422]' : 'text-[#91A5C0]'}`}>Range</Text>
                  </TouchableOpacity>
                </View>

                <View className="flex-row items-center">
                  <Text className="text-[#91A5C0] text-xs mr-2">Rest</Text>
                  <NumberInput
                    value={exercise.rest}
                    onChangeText={(text) => changeExercise(exercise.key, (current) => ({ ...current, rest: text }))}
                    placeholder="90"
                    className="w-16"
                  />
                  <Text className="text-[#91A5C0] text-xs ml-2">sec</Text>
                </View>
              </View>

              {/* Column titles */}
              <View className="flex-row items-center mt-4 mb-2">
                <Text className="w-9 text-center text-[#7186A1] text-[10px] font-bold">SET</Text>
                <Text className="w-[72px] mx-2 text-center text-[#7186A1] text-[10px] font-bold">KG</Text>
                <Text className="flex-1 text-center text-[#7186A1] text-[10px] font-bold">REPS</Text>
                <View className="w-[68px]" />
              </View>

              {/* Sets */}
              {exercise.sets.map((set, setIndex) => (
                <View key={set.key} className="flex-row items-center mb-2">
                  {/* Tap to switch between normal, warm-up and drop set */}
                  <TouchableOpacity
                    onPress={() =>
                      changeSet(exercise.key, set.key, {
                        setType: SET_TYPE_ORDER[(SET_TYPE_ORDER.indexOf(set.setType) + 1) % SET_TYPE_ORDER.length],
                      })
                    }
                    className="w-9 h-10 rounded-lg bg-[#263B55] items-center justify-center"
                  >
                    <Text className={`font-bold ${set.setType === 'NORMAL' ? 'text-[#8CB5EC]' : 'text-[#F1F5FB]'}`}>
                      {set.setType === 'NORMAL'
                        ? exercise.sets.slice(0, setIndex + 1).filter((item) => item.setType === 'NORMAL').length
                        : set.setType === 'WARMUP'
                          ? 'W'
                          : 'D'}
                    </Text>
                  </TouchableOpacity>

                  <NumberInput
                    value={set.weight}
                    onChangeText={(text) => changeSet(exercise.key, set.key, { weight: text })}
                    placeholder="-"
                    decimal
                    className="w-[72px] mx-2"
                  />

                  {set.repMode === 'RANGE' ? (
                    <View className="flex-1 flex-row items-center">
                      <NumberInput
                        value={set.min}
                        onChangeText={(text) => changeSet(exercise.key, set.key, { min: text })}
                        placeholder="min"
                        className="flex-1"
                      />
                      <Text className="text-[#91A5C0] mx-1.5">-</Text>
                      <NumberInput
                        value={set.max}
                        onChangeText={(text) => changeSet(exercise.key, set.key, { max: text })}
                        placeholder="max"
                        className="flex-1"
                      />
                    </View>
                  ) : (
                    <NumberInput
                      value={set.reps}
                      onChangeText={(text) => changeSet(exercise.key, set.key, { reps: text })}
                      placeholder="-"
                      className="flex-1"
                    />
                  )}

                  {/* Switch this one set between a fixed number and a range */}
                  <TouchableOpacity
                    onPress={() =>
                      changeSet(exercise.key, set.key, { repMode: set.repMode === 'RANGE' ? 'REPS' : 'RANGE' })
                    }
                    hitSlop={6}
                    className="w-8 h-10 items-center justify-center"
                  >
                    <Ionicons name="swap-horizontal" size={18} color="#8CB5EC" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => removeSet(exercise.key, set.key)}
                    disabled={exercise.sets.length === 1}
                    hitSlop={6}
                    className="w-8 h-10 items-center justify-center"
                  >
                    <Ionicons name="close" size={18} color={exercise.sets.length === 1 ? '#344C66' : '#F2A0A0'} />
                  </TouchableOpacity>
                </View>
              ))}

              <TouchableOpacity
                onPress={() => addSet(exercise.key)}
                activeOpacity={0.8}
                className="h-10 rounded-lg bg-[#263B55] flex-row items-center justify-center gap-1 mt-1"
              >
                <Ionicons name="add" size={16} color="#DCE6F4" />
                <Text className="text-[#DCE6F4] text-sm font-semibold">Add set</Text>
              </TouchableOpacity>
            </View>
          );
        })}

        {/* Add exercises */}
        <TouchableOpacity
          onPress={openPicker}
          activeOpacity={0.85}
          className="h-12 rounded-xl border border-dashed border-[#344C66] flex-row items-center justify-center gap-2 mt-5"
        >
          <Ionicons name="add-circle-outline" size={20} color="#8CB5EC" />
          <Text className="text-[#8CB5EC] font-bold">Add exercises</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}