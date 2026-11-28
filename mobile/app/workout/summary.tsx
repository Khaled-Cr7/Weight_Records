import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScreenHeader } from '@/components/ScreenHeader';
import { formatDate, formatDuration, formatKg, setText } from '@/lib/workoutFormat';
import { SET_STYLE } from '@/lib/setStyle';
import { WorkoutService } from '@/services/workoutService';
import type { Workout } from '@/services/types/workout';

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 bg-[#142238] border border-[#263B55] rounded-2xl p-3">
      <Text className="text-[#7186A1] text-[10px] font-bold tracking-widest">{label}</Text>
      <Text className="text-[#F1F5FB] text-lg font-bold mt-1" numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

export default function WorkoutSummaryScreen() {
  const { id, done } = useLocalSearchParams<{ id: string; done?: string }>();
  const router = useRouter();
  const justFinished = done === '1';
  const insets = useSafeAreaInsets();

  const [workout, setWorkout] = useState<Workout | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setStatus('loading');
    WorkoutService.getById(id)
      .then((data) => {
        setWorkout(data);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const leave = () => {
    if (justFinished) router.replace('/(tabs)/training' as any);
    else router.back();
  };

  const confirmDelete = () => {
    if (!workout) return;
    Alert.alert('Delete this workout?', 'It will be removed from your history. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await WorkoutService.remove(workout.id);
            leave();
          } catch (e) {
            setError(e instanceof Error ? e.message : "Couldn't delete the workout");
          }
        },
      },
    ]);
  };

  if (status === 'loading') {
    return (
      <SafeAreaView className="flex-1 bg-[#0B1422] items-center justify-center">
        <ActivityIndicator color="#8CB5EC" />
      </SafeAreaView>
    );
  }

  if (status === 'error' || !workout) {
    return (
      <SafeAreaView className="flex-1 bg-[#0B1422]">
        <ScreenHeader />
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-[#91A5C0] text-center">Couldn't load this workout.</Text>
          <TouchableOpacity onPress={load} className="bg-[#719AD1] h-11 px-6 rounded-xl items-center justify-center mt-4">
            <Text className="text-[#0B1422] font-bold">Try again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const sets = workout.exercises.flatMap((exercise) => exercise.sets).filter((set) => set.isCompleted);
  const totalReps = sets.reduce((sum, set) => sum + (set.reps ?? 0), 0);
  const volume = sets.reduce((sum, set) => sum + (set.weightKg ?? 0) * (set.reps ?? 0), 0);

  return (
    <SafeAreaView className="flex-1 bg-[#0B1422]">
      {justFinished ? <View className="h-3" /> : <ScreenHeader />}

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: insets.bottom + 80 }}
        showsVerticalScrollIndicator={false}
      >
        {justFinished && (
          <View className="items-center mb-4">
            <View className="w-14 h-14 rounded-full bg-[#1D3558] items-center justify-center">
              <Ionicons name="checkmark" size={30} color="#8CB5EC" />
            </View>
            <Text className="text-[#8CB5EC] text-xs font-bold tracking-widest mt-3">WORKOUT COMPLETE</Text>
          </View>
        )}

        <Text className="text-[#F1F5FB] text-2xl font-bold">{workout.name}</Text>
        <Text className="text-[#91A5C0] text-sm mt-1">{formatDate(workout.finishedAt ?? workout.startedAt)}</Text>

        {workout.notes ? (
          <View className="bg-[#142238] border border-[#263B55] rounded-2xl p-3 mt-4">
            <Text className="text-[#DCE6F4] text-sm leading-5">{workout.notes}</Text>
          </View>
        ) : null}

        <View className="flex-row gap-3 mt-5">
          <Stat label="DURATION" value={formatDuration(workout.durationSeconds)} />
          <Stat label="VOLUME" value={formatKg(volume)} />
        </View>
        <View className="flex-row gap-3 mt-3">
          <Stat label="EXERCISES" value={String(workout.exercises.length)} />
          <Stat label="SETS" value={String(sets.length)} />
          <Stat label="REPS" value={String(totalReps)} />
        </View>

        {workout.routineUpdatedAt && (
          <View className="flex-row items-center bg-[#1D3558] border border-[#2F5185] rounded-2xl p-3 mt-4">
            <Ionicons name="refresh-circle-outline" size={20} color="#8CB5EC" />
            <Text className="text-[#DCE6F4] text-sm ml-2 flex-1">Your routine was updated with these weights.</Text>
          </View>
        )}

        {workout.exercises.map((exercise) => (
          <View key={exercise.id} className="bg-[#142238] border border-[#263B55] rounded-3xl p-4 mt-4">
            <Text className="text-[#F1F5FB] font-bold">{exercise.exercise.name}</Text>
            {exercise.notes ? <Text className="text-[#91A5C0] text-xs mt-1 leading-4">{exercise.notes}</Text> : null}
            {exercise.sets
              .filter((set) => set.isCompleted)
              .map((set, index, list) => {
                const style = SET_STYLE[set.setType];
                const number = list.slice(0, index + 1).filter((item) => item.setType === 'NORMAL').length;
                return (
                  <View key={set.id} className="flex-row items-center mt-2">
                    <View
                      style={{ width: 32, backgroundColor: style.bg, borderColor: style.border, borderWidth: 1 }}
                      className="h-8 rounded-lg items-center justify-center"
                    >
                      <Text style={{ color: style.text }} className="text-xs font-bold">
                        {set.setType === 'NORMAL' ? number : set.setType === 'WARMUP' ? 'W' : 'D'}
                      </Text>
                    </View>
                    <Text className="text-[#DCE6F4] text-sm ml-3">{setText(set.weightKg, set.reps)}</Text>
                  </View>
                );
              })}
          </View>
        ))}

        {error && <Text className="text-[#F2A0A0] text-sm text-center mt-4">{error}</Text>}

        <TouchableOpacity onPress={leave} activeOpacity={0.85} className="bg-[#719AD1] h-12 rounded-xl items-center justify-center mt-6">
          <Text className="text-[#0B1422] font-bold">Done</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={confirmDelete}
          activeOpacity={0.85}
          className="h-12 rounded-xl border border-[#4A2A33] flex-row items-center justify-center gap-2 mt-3"
        >
          <Ionicons name="trash-outline" size={18} color="#F2A0A0" />
          <Text className="text-[#F2A0A0] font-semibold">Delete workout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}