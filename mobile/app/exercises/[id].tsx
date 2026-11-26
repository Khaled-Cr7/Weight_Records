import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { ScreenHeader } from '@/components/ScreenHeader';
import { repsText, weightText } from '@/lib/routineFormat';
import { SET_STYLE } from '@/lib/setStyle';
import { ExerciseService } from '@/services/exerciseService';
import type { Exercise } from '@/services/types/exercise';
import type { RoutineSet } from '@/services/types/program';

export default function ExerciseDetail() {
  const { id, setsJson } = useLocalSearchParams<{ id: string; setsJson?: string }>();

  // The sets of this exercise in the routine it was opened from (if any)
  let routineSets: RoutineSet[] = [];
  try {
    routineSets = setsJson ? JSON.parse(setsJson) : [];
  } catch {
    routineSets = [];
  }
  const { width } = useWindowDimensions();
  const imageWidth = width - 40; // screen minus the 20px side padding

  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [imageIndex, setImageIndex] = useState(0);
   const [imageRatio, setImageRatio] = useState(1.5); // width / height of the pictures

  const load = useCallback(() => {
    setStatus('loading');
    ExerciseService.getById(id)
      .then((data) => {
        setExercise(data);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const first = exercise?.images[0];
    if (!first) return;
    Image.getSize(
      first,
      (w, h) => {
        if (h > 0) setImageRatio(Math.min(1.8, Math.max(1, w / h)));
      },
      () => {}
    );
  }, [exercise]);


  const onImageScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setImageIndex(Math.round(event.nativeEvent.contentOffset.x / imageWidth));
  };

  if (status === 'loading') {
    return (
      <SafeAreaView className="flex-1 bg-[#0B1422]">
        <ScreenHeader />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#8CB5EC" />
        </View>
      </SafeAreaView>
    );
  }

  if (status === 'error' || !exercise) {
    return (
      <SafeAreaView className="flex-1 bg-[#0B1422]">
        <ScreenHeader />
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-[#91A5C0] text-center">Couldn't load this exercise.</Text>
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

  const facts = [
    { label: 'Level', value: exercise.level },
    { label: 'Equipment', value: exercise.equipment ?? 'None' },
    { label: 'Type', value: exercise.mechanic },
    { label: 'Force', value: exercise.force },
  ].filter((fact) => fact.value);

  return (
    <SafeAreaView className="flex-1 bg-[#0B1422]">
      <ScreenHeader />

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pt-5 pb-16"
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-[#F1F5FB] text-3xl font-bold">{exercise.name}</Text>

        {/* Images: swipe sideways when there is more than one */}
        {exercise.images.length > 0 && (
          <View className="mt-5">
            <View
              style={{ width: imageWidth }}
              className="rounded-2xl overflow-hidden bg-[#142238] border border-[#263B55]"
            >
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={onImageScrollEnd}
              >
                {exercise.images.map((uri) => (
                  <Image
                    key={uri}
                    source={{ uri }}
                    style={{ width: imageWidth, height: imageWidth / imageRatio }}
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>
            </View>

            {exercise.images.length > 1 && (
              <View className="flex-row justify-center gap-2 mt-3">
                {exercise.images.map((uri, i) => (
                  <View
                    key={uri}
                    className={`w-2 h-2 rounded-full ${i === imageIndex ? 'bg-[#8CB5EC]' : 'bg-[#263B55]'}`}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {/* Quick facts */}
        {facts.length > 0 && (
          <View className="flex-row flex-wrap gap-2 mt-5">
            {facts.map((fact) => (
              <View key={fact.label} className="bg-[#142238] border border-[#263B55] rounded-xl px-4 py-2">
                <Text className="text-[#7186A1] text-[10px]">{fact.label}</Text>
                <Text className="text-[#F1F5FB] font-bold capitalize mt-0.5">{`${fact.value}\u00A0`}</Text>
              </View>
            ))}
          </View>
        )}

        {/* From the routine (only when opened from one): one row per set */}
        {routineSets.length > 0 && (
          <View className="bg-[#142238] border border-[#263B55] rounded-3xl p-4 mt-5">
            <Text className="text-[#8CB5EC] text-xs font-bold tracking-widest mb-3">IN THIS ROUTINE</Text>

            {routineSets.map((set, index) => {
              const style = SET_STYLE[set.setType];
              const number = routineSets.slice(0, index + 1).filter((item) => item.setType === 'NORMAL').length;

              return (
                <View
                  key={set.id}
                  className="flex-row items-center rounded-2xl px-3 py-3 mb-2"
                  style={{ backgroundColor: style.bg, borderWidth: 1, borderColor: style.border }}
                >
                  <View
                    className="w-9 h-9 rounded-full items-center justify-center"
                    style={{ backgroundColor: style.border }}
                  >
                    <Text style={{ color: style.text }} className="font-bold">
                      {set.setType === 'NORMAL' ? number : set.setType === 'WARMUP' ? 'W' : 'D'}
                    </Text>
                  </View>

                  <View className="flex-1 ml-3">
                    <Text style={{ color: style.text }} className="text-xs font-semibold">
                      {style.label}
                    </Text>
                    <Text className="text-[#F1F5FB] text-lg font-bold mt-0.5">{`${repsText(set)} reps`}</Text>
                  </View>

                  <Text className="text-[#DCE6F4] font-semibold">{weightText(set)}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Primary muscles */}
        {exercise.primaryMuscles.length > 0 && (
          <View className="mt-8">
            <Text className="text-[#F1F5FB] text-xl font-bold mb-3">Primary Muscles</Text>
            <View className="flex-row flex-wrap gap-2">
              {exercise.primaryMuscles.map((muscle) => (
                <View key={muscle} className="bg-[#719AD1] rounded-full px-4 py-2">
                  <Text className="text-[#0B1422] font-semibold capitalize">{`${muscle}\u00A0`}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Secondary muscles */}
        {exercise.secondaryMuscles.length > 0 && (
          <View className="mt-6">
            <Text className="text-[#F1F5FB] text-xl font-bold mb-3">Secondary Muscles</Text>
            <View className="flex-row flex-wrap gap-2">
              {exercise.secondaryMuscles.map((muscle) => (
                <View key={muscle} className="bg-[#263B55] rounded-full px-4 py-2">
                  <Text className="text-[#DCE6F4] capitalize">{`${muscle}\u00A0`}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Instructions */}
        {exercise.instructions.length > 0 && (
          <View className="mt-8">
            <Text className="text-[#F1F5FB] text-xl font-bold mb-4">How to Perform</Text>
            {exercise.instructions.map((instruction, i) => (
              <View key={i} className="flex-row mb-4">
                <View className="w-7 h-7 rounded-full bg-[#263B55] items-center justify-center mr-3">
                  <Text className="text-[#8CB5EC] font-bold text-xs">{i + 1}</Text>
                </View>
                <Text className="flex-1 text-[#C5D1E3] leading-6">{instruction}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}