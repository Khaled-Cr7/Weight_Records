import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScreenHeader } from '@/components/ScreenHeader';
import { countSets, plural, programImage, topMuscles } from '@/lib/routineFormat';
import { ProgramService } from '@/services/programService';
import type { ProgramDetail } from '@/services/types/program';

const MAX_THUMBS = 4;

export default function ProgramScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [program, setProgram] = useState<ProgramDetail | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  const load = useCallback(() => {
    setStatus('loading');
    ProgramService.getById(id)
      .then((data) => {
        setProgram(data);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Copies this ready-made program into the user's own programs, then opens the copy
  const addToMyPrograms = async () => {
    if (!program || adding) return;
    setAdding(true);
    setAddError(null);
    try {
      const copy = await ProgramService.copy(program.id);
      router.replace({ pathname: '/programs/[id]', params: { id: copy.id } } as any);
    } catch (error) {
      setAddError(error instanceof Error ? error.message : "Couldn't add the program");
      setAdding(false);
    }
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

  if (status === 'error' || !program) {
    return (
      <SafeAreaView className="flex-1 bg-[#0B1422]">
        <ScreenHeader />
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-[#91A5C0] text-center">Couldn't load this program.</Text>
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

  const exerciseTotal = program.routines.reduce((sum, routine) => sum + routine.exercises.length, 0);
  const setTotal = program.routines.reduce((sum, routine) => sum + countSets(routine), 0);

  return (
    <SafeAreaView className="flex-1 bg-[#0B1422]">
      <ScreenHeader />

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pt-5 pb-16"
        showsVerticalScrollIndicator={false}
      >
        {/* Program card */}
        <View className="bg-[#192C46] border border-[#344C66] rounded-3xl p-5">
          <View className="flex-row items-center">
            <View className="flex-1 pr-3">
              <Text className="text-[#8CB5EC] text-xs font-bold tracking-widest">
                {program.isReadyMade ? 'READY-MADE PROGRAM' : 'MY PROGRAM'}
              </Text>
              <Text className="text-[#F1F5FB] text-3xl font-bold mt-3">{program.name}</Text>
              {program.description ? (
                <Text className="text-[#91A5C0] text-sm mt-2 leading-5">{program.description}</Text>
              ) : null}
            </View>

            <Image
              source={programImage(program.imageKey)}
              className="w-24 h-24"
              resizeMode="contain"
            />
          </View>

          <View className="flex-row gap-2 mt-5">
            {[
              plural(program.routines.length, 'routine'),
              plural(exerciseTotal, 'exercise'),
              plural(setTotal, 'set'),
            ].map((label) => (
              <View key={label} className="bg-[#142238] border border-[#263B55] rounded-full px-3 py-1.5">
                <Text className="text-[#DCE6F4] text-xs font-semibold">{label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Ready-made programs are copied into the user's own programs */}
        {program.isReadyMade && (
          <>
            <TouchableOpacity
              onPress={addToMyPrograms}
              disabled={adding}
              activeOpacity={0.85}
              className="bg-[#719AD1] h-12 rounded-xl flex-row items-center justify-center gap-2 mt-4"
            >
              {adding ? (
                <ActivityIndicator color="#0B1422" />
              ) : (
                <>
                  <Ionicons name="add-circle-outline" size={20} color="#0B1422" />
                  <Text className="text-[#0B1422] font-bold">Add to my programs</Text>
                </>
              )}
            </TouchableOpacity>
            {addError && <Text className="text-[#F2A0A0] text-xs text-center mt-2">{addError}</Text>}
          </>
        )}

        {/* Routines */}
        <View className="mt-8 mb-4">
          <Text className="text-[#F1F5FB] text-xl font-bold">Routines</Text>
          <Text className="text-[#91A5C0] text-sm mt-1">
            Start any routine on any day, in any order.
          </Text>
        </View>

        {program.routines.length === 0 && (
          <View className="bg-[#142238] border border-[#263B55] rounded-2xl p-4">
            <Text className="text-[#91A5C0] text-sm">This program has no routines yet.</Text>
          </View>
        )}

        {program.routines.map((routine, index) => {
          const thumbs = routine.exercises.slice(0, MAX_THUMBS);
          const extra = routine.exercises.length - thumbs.length;
          const muscles = topMuscles(routine);

          return (
            <TouchableOpacity
              key={routine.id}
              onPress={() => router.push({ pathname: '/routines/[id]', params: { id: routine.id } } as any)}
              activeOpacity={0.8}
              className="bg-[#142238] border border-[#263B55] rounded-2xl p-4 mb-3"
            >
              <View className="flex-row items-center">
                <View className="w-9 h-9 rounded-full bg-[#263B55] items-center justify-center">
                  <Text className="text-[#8CB5EC] font-bold">{index + 1}</Text>
                </View>

                <View className="flex-1 ml-3">
                  <Text className="text-[#F1F5FB] font-bold text-lg" numberOfLines={1}>
                    {routine.name}
                  </Text>
                  <Text className="text-[#91A5C0] text-xs mt-0.5">
                    {plural(routine.exercises.length, 'exercise')} · {plural(countSets(routine), 'set')}
                  </Text>
                </View>

                <Ionicons name="chevron-forward" size={18} color="#7186A1" />
              </View>

              {muscles.length > 0 && (
                <View className="flex-row flex-wrap gap-2 mt-3">
                  {muscles.map((muscle) => (
                    <View key={muscle} className="bg-[#263B55] rounded-full px-3 py-1">
                      <Text className="text-[#DCE6F4] text-xs capitalize">{`${muscle}\u00A0`}</Text>
                    </View>
                  ))}
                </View>
              )}

              <View className="flex-row mt-3">
                {thumbs.map((item) =>
                  item.exercise.image ? (
                    <Image
                      key={item.id}
                      source={{ uri: item.exercise.image }}
                      className="w-11 h-11 rounded-lg bg-[#263B55] mr-2"
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      key={item.id}
                      className="w-11 h-11 rounded-lg bg-[#263B55] mr-2 items-center justify-center"
                    >
                      <Ionicons name="barbell-outline" size={16} color="#8CB5EC" />
                    </View>
                  )
                )}
                {extra > 0 && (
                  <View className="w-11 h-11 rounded-lg bg-[#263B55] items-center justify-center">
                    <Text className="text-[#91A5C0] text-xs font-semibold">{`+${extra}`}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}