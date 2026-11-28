import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { formatClock } from '@/lib/workoutFormat';
import { WorkoutService } from '@/services/workoutService';
import type { Workout } from '@/services/types/workout';

// Shows "Workout in progress" with a Resume button (nothing when there is no active workout)
export function ActiveWorkoutBanner() {
  const router = useRouter();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [now, setNow] = useState(Date.now());

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      WorkoutService.active()
        .then((active) => {
          if (!cancelled) setWorkout(active);
        })
        .catch(() => {});
      return () => {
        cancelled = true;
      };
    }, [])
  );

  useEffect(() => {
    if (!workout) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [workout]);

  if (!workout) return null;

  const discard = () => {
    Alert.alert('Discard this workout?', 'Everything you logged in it will be deleted.', [
      { text: 'Keep it', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: async () => {
          try {
            await WorkoutService.remove(workout.id);
            setWorkout(null);
          } catch (e) {
            Alert.alert("Couldn't discard the workout", e instanceof Error ? e.message : 'Something went wrong');
          }
        },
      },
    ]);
  };

  const elapsed = (now - Date.parse(workout.startedAt)) / 1000;

  return (
    <View className="bg-[#1D3558] border border-[#2F5185] rounded-2xl p-4 mb-5">
      <View className="flex-row items-center">
        <View className="w-11 h-11 rounded-full bg-[#2F5185] items-center justify-center">
          <Ionicons name="barbell" size={20} color="#DCE6F4" />
        </View>

        <View className="flex-1 ml-3">
          <Text className="text-[#8CB5EC] text-[10px] font-bold tracking-widest">WORKOUT IN PROGRESS</Text>
          <Text className="text-[#F1F5FB] font-bold text-base mt-0.5" numberOfLines={1}>
            {workout.name}
          </Text>
          <Text className="text-[#91A5C0] text-xs mt-0.5">{formatClock(elapsed)}</Text>
        </View>
      </View>

      <View className="flex-row gap-3 mt-4">
        <TouchableOpacity
          onPress={() => router.push({ pathname: '/workout/[id]', params: { id: workout.id } } as any)}
          activeOpacity={0.85}
          className="flex-1 bg-[#719AD1] h-12 rounded-xl flex-row items-center justify-center gap-2"
        >
          <Ionicons name="play" size={16} color="#0B1422" />
          <Text className="text-[#0B1422] font-bold">Resume</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={discard}
          activeOpacity={0.85}
          className="flex-1 h-12 rounded-xl border border-[#4A2A33] bg-[#142238] flex-row items-center justify-center gap-2"
        >
          <Ionicons name="trash-outline" size={16} color="#F2A0A0" />
          <Text className="text-[#F2A0A0] font-semibold">Discard</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}