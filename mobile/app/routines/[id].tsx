import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SetTags } from '@/components/SetTags';
import { countDrops, countSets, countWarmups, topMuscles } from '@/lib/routineFormat';
import { SET_STYLE } from '@/lib/setStyle';
import { startWorkout } from '@/lib/startWorkout';
import { RoutineService } from '@/services/programService';
import type { Routine } from '@/services/types/program';

function Stat({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <View className="mr-6">
      <Text style={{ color }} className="text-3xl font-bold">
        {value}
      </Text>
      <Text className="text-[#91A5C0] text-[10px] font-bold tracking-widest mt-0.5">{label}</Text>
    </View>
  );
}

export default function RoutineScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [routine, setRoutine] = useState<Routine | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState('');

  // Loads when the screen opens and again when we come back to it (after editing)
  const load = useCallback(() => {
    let cancelled = false;

    RoutineService.getById(id)
      .then((data) => {
        if (cancelled) return;
        setRoutine(data);
        setStatus('ready');
      })
      .catch((error) => {
        if (cancelled) return;
        setLoadError(error instanceof Error ? error.message : String(error));
        setStatus((current) => (current === 'ready' ? current : 'error'));
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  useFocusEffect(load);

  const retry = () => {
    setStatus('loading');
    load();
  };

  // Copies this ready-made routine into the user's own routines, then opens the copy
  const addToMyRoutines = async () => {
    if (!routine || busy) return;
    setBusy(true);
    setActionError(null);
    try {
      const copy = await RoutineService.copy(routine.id);
      router.replace({ pathname: '/routines/[id]', params: { id: copy.id } } as any);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Couldn't add the routine");
      setBusy(false);
    }
  };

  const confirmDelete = () => {
    if (!routine) return;
    Alert.alert(`Delete "${routine.name}"?`, 'Workouts you have finished are kept.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          setActionError(null);
          try {
            await RoutineService.remove(routine.id);
            router.back();
          } catch (error) {
            setActionError(error instanceof Error ? error.message : "Couldn't delete the routine");
            setBusy(false);
          }
        },
      },
    ]);
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

  if (status === 'error' || !routine) {
    return (
      <SafeAreaView className="flex-1 bg-[#0B1422]">
        <ScreenHeader />
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-[#91A5C0] text-center">Couldn't load this routine.</Text>
          {loadError ? <Text className="text-[#F2A0A0] text-xs text-center mt-2">{loadError}</Text> : null}
          <TouchableOpacity
            onPress={retry}
            className="bg-[#719AD1] h-11 px-6 rounded-xl items-center justify-center mt-4"
          >
            <Text className="text-[#0B1422] font-bold">Try again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const muscles = topMuscles(routine, 4);
  const warmups = countWarmups(routine);
  const drops = countDrops(routine);

  return (
    <SafeAreaView className="flex-1 bg-[#0B1422]">
      <ScreenHeader />

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pt-5 pb-16"
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View className="rounded-3xl overflow-hidden border border-[#344C66] p-5">
          <LinearGradient
            colors={['#223D63', '#142238']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          <Text className="text-[#8CB5EC] text-xs font-bold tracking-widest">
            {routine.isReadyMade ? 'READY-MADE ROUTINE' : 'MY ROUTINE'}
          </Text>
          <Text className="text-[#F1F5FB] text-3xl font-bold mt-2">{routine.name}</Text>
          {routine.description ? (
            <Text className="text-[#91A5C0] text-sm mt-2 leading-5">{routine.description}</Text>
          ) : null}

          <View className="flex-row mt-5">
            <Stat value={routine.exercises.length} label="EXERCISES" color="#F1F5FB" />
            <Stat value={countSets(routine)} label="SETS" color={SET_STYLE.NORMAL.text} />
            {warmups > 0 && <Stat value={warmups} label="WARM-UP" color={SET_STYLE.WARMUP.text} />}
            {drops > 0 && <Stat value={drops} label="DROP" color={SET_STYLE.DROP.text} />}
          </View>

          {muscles.length > 0 && (
            <View className="flex-row flex-wrap gap-2 mt-4">
              {muscles.map((muscle) => (
                <View key={muscle} className="bg-[#0B1422]/50 border border-[#344C66] rounded-full px-3 py-1">
                  <Text className="text-[#DCE6F4] text-xs capitalize">{`${muscle}\u00A0`}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Ready-made routines are copied into the user's own routines */}
        {routine.isReadyMade ? (
          <TouchableOpacity
            onPress={addToMyRoutines}
            disabled={busy}
            activeOpacity={0.85}
            className="bg-[#719AD1] h-12 rounded-xl flex-row items-center justify-center gap-2 mt-4"
          >
            {busy ? (
              <ActivityIndicator color="#0B1422" />
            ) : (
              <>
                <Ionicons name="add-circle-outline" size={20} color="#0B1422" />
                <Text className="text-[#0B1422] font-bold">Add to my routines</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              onPress={() => startWorkout(router, routine.id)}
              disabled={busy}
              activeOpacity={0.85}
              className="bg-[#719AD1] h-12 rounded-xl flex-row items-center justify-center gap-2 mt-4"
            >
              <Ionicons name="play" size={17} color="#0B1422" />
              <Text className="text-[#0B1422] font-bold">Start workout</Text>
            </TouchableOpacity>
            <View className="flex-row gap-3 mt-3">
              <TouchableOpacity
              onPress={() => router.push({ pathname: '/routine-editor', params: { id: routine.id } } as any)}
              disabled={busy}
              activeOpacity={0.85}
              className="flex-1 h-11 rounded-xl bg-[#142238] border border-[#263B55] flex-row items-center justify-center gap-2"
            >
              <Ionicons name="create-outline" size={18} color="#8CB5EC" />
              <Text className="text-[#DCE6F4] font-semibold">Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={confirmDelete}
              disabled={busy}
              activeOpacity={0.85}
              className="flex-1 h-11 rounded-xl bg-[#142238] border border-[#263B55] flex-row items-center justify-center gap-2"
            >
              <Ionicons name="trash-outline" size={18} color="#F2A0A0" />
              <Text className="text-[#F2A0A0] font-semibold">Delete</Text>
            </TouchableOpacity>
            </View>
          </>
        )}
          
        {actionError && <Text className="text-[#F2A0A0] text-xs text-center mt-3">{actionError}</Text>}

        {/* Exercises */}
        <Text className="text-[#F1F5FB] text-xl font-bold mt-8 mb-4">Exercises</Text>

        {routine.exercises.length === 0 && (
          <View className="bg-[#142238] border border-[#263B55] rounded-2xl p-4">
            <Text className="text-[#91A5C0] text-sm">This routine has no exercises yet.</Text>
          </View>
        )}

        {routine.exercises.map((item, index) => (
          <TouchableOpacity
            key={item.id}
            onPress={() =>
              router.push({
                pathname: '/exercises/[id]',
                params: { id: item.exercise.id, setsJson: JSON.stringify(item.sets) },
              } as any)
            }
            activeOpacity={0.8}
            className="bg-[#142238] border border-[#263B55] rounded-3xl p-3 mb-3"
          >
            <View className="flex-row items-center">
              {item.exercise.image ? (
                <Image
                  source={{ uri: item.exercise.image }}
                  className="w-[76px] h-[76px] rounded-2xl bg-[#263B55]"
                  resizeMode="cover"
                />
              ) : (
                <View className="w-[76px] h-[76px] rounded-2xl bg-[#263B55] items-center justify-center">
                  <Ionicons name="barbell-outline" size={24} color="#8CB5EC" />
                </View>
              )}

              <View className="flex-1 ml-3">
                <Text className="text-[#7186A1] text-[10px] font-bold tracking-widest">
                  {`EXERCISE ${index + 1}`}
                </Text>
                <Text className="text-[#F1F5FB] font-bold text-base mt-0.5" numberOfLines={2}>
                  {item.exercise.name}
                </Text>
                <Text className="text-[#91A5C0] text-xs mt-0.5 capitalize" numberOfLines={1}>
                  {[item.exercise.primaryMuscles[0], item.exercise.equipment ?? 'no equipment']
                    .filter(Boolean)
                    .join(' • ')}
                </Text>
              </View>

              <Ionicons name="chevron-forward" size={18} color="#7186A1" />
            </View>

            <View className="mt-3">
              <SetTags sets={item.sets} />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}