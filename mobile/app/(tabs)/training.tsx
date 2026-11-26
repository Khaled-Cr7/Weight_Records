import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { ProgramCard } from '@/components/ProgramCard';
import { plural } from '@/lib/routineFormat';
import { ProgramService, RoutineService } from '@/services/programService';
import type { ProgramSummary, RoutineSummary } from '@/services/types/program';

export default function Training() {
  const router = useRouter();

  const [readyMade, setReadyMade] = useState<ProgramSummary[]>([]);
  const [myPrograms, setMyPrograms] = useState<ProgramSummary[]>([]);
  const [routines, setRoutines] = useState<RoutineSummary[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  // Loads when the tab is opened and again each time the user comes back to it
  const load = useCallback(() => {
    let cancelled = false;

    Promise.all([ProgramService.list(), RoutineService.list()])
      .then(([programList, routineList]) => {
        if (cancelled) return;
        setReadyMade(programList.readyMade);
        setMyPrograms(programList.mine);
        setRoutines(routineList);
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus((current) => (current === 'ready' ? current : 'error'));
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useFocusEffect(load);

  const retry = () => {
    setStatus('loading');
    load();
  };

  const openProgram = (id: string) => {
    router.push({ pathname: '/programs/[id]', params: { id } } as any);
  };

  // Quick start opens PPL if it exists, otherwise the first ready-made program
  const featured = readyMade.find((program) => program.name === 'PPL Split') ?? readyMade[0];

  return (
    <SafeAreaView className="flex-1 bg-[#0B1422]">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pt-5 pb-32"
        showsVerticalScrollIndicator={false}
      >
        {/* Heading */}
        <Text className="text-[#F1F5FB] text-3xl font-bold">
          Training
        </Text>

        <Text className="text-[#91A5C0] text-sm mt-2 mb-7">
          Build strength. Stay consistent.
        </Text>

        {/* Quick start */}
        <View className="bg-[#192C46] border border-[#344C66] rounded-3xl p-5">
          <View className="flex-row justify-between items-center">
            <Text className="text-[#8CB5EC] text-xs font-bold tracking-widest">
              QUICK START
            </Text>

            <Ionicons
              name="flash-outline"
              size={26}
              color="#8CB5EC"
            />
          </View>

          <Text className="text-[#F1F5FB] text-2xl font-bold mt-5">
            Ready for a workout?
          </Text>

          <Text className="text-[#91A5C0] text-sm mt-2 leading-5">
            Choose a training program and explore your next workout.
          </Text>

          {featured && (
            <TouchableOpacity
              onPress={() => openProgram(featured.id)}
              className="bg-[#719AD1] h-12 rounded-xl flex-row items-center justify-center gap-2 mt-6"
            >
              <Ionicons
                name="play"
                size={17}
                color="#0B1422"
              />
              <Text className="text-[#0B1422] font-bold">
                Explore {featured.name}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Exercise library and Explore programs, side by side */}
        <View className="flex-row gap-3 mt-4">
          <TouchableOpacity
            onPress={() => router.push('/exercises' as any)}
            activeOpacity={0.8}
            className="flex-1 bg-[#142238] border border-[#263B55] rounded-2xl p-4"
          >
            <View className="w-12 h-12 bg-[#263B55] rounded-xl items-center justify-center">
              <Ionicons name="search-outline" size={22} color="#8CB5EC" />
            </View>

            <Text className="text-[#F1F5FB] font-bold text-base mt-4">Exercise Library</Text>
            <Text className="text-[#91A5C0] text-xs mt-1">
              Browse and search every exercise
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/programs' as any)}
            activeOpacity={0.8}
            className="flex-1 bg-[#142238] border border-[#263B55] rounded-2xl p-4"
          >
            <View className="w-12 h-12 bg-[#263B55] rounded-xl items-center justify-center">
              <Ionicons name="albums-outline" size={22} color="#8CB5EC" />
            </View>

            <Text className="text-[#F1F5FB] font-bold text-base mt-4">Explore Programs</Text>
            <Text className="text-[#91A5C0] text-xs mt-1">
              Ready-made training splits
            </Text>
          </TouchableOpacity>
        </View>

        {status === 'loading' && (
          <View className="py-16 items-center">
            <ActivityIndicator color="#8CB5EC" />
          </View>
        )}

        {status === 'error' && (
          <View className="py-12 items-center">
            <Text className="text-[#91A5C0] text-sm text-center">
              Couldn't load your training. Check your connection.
            </Text>
            <TouchableOpacity
              onPress={retry}
              activeOpacity={0.8}
              className="bg-[#719AD1] h-10 px-6 rounded-xl items-center justify-center mt-4"
            >
              <Text className="text-[#0B1422] font-bold">Try again</Text>
            </TouchableOpacity>
          </View>
        )}

        {status === 'ready' && (
          <>
            {/* My programs */}
            <View className="mt-9 mb-4">
              <Text className="text-[#F1F5FB] text-xl font-bold">
                My Programs
              </Text>
            </View>

            {myPrograms.length === 0 ? (
              <View className="bg-[#142238] border border-[#263B55] rounded-2xl p-4">
                <Text className="text-[#91A5C0] text-sm">
                  You have no programs yet. Add one from Explore Programs.
                </Text>
              </View>
            ) : (
              <View className="flex-row flex-wrap justify-between">
                {myPrograms.map((program) => (
                  <ProgramCard
                    key={program.id}
                    program={program}
                    onPress={() => openProgram(program.id)}
                  />
                ))}
              </View>
            )}

            {/* My routines */}
            <View className="mt-9 mb-4">
              <Text className="text-[#F1F5FB] text-xl font-bold">
                My Routines
              </Text>
            </View>

            {routines.length === 0 ? (
              <View className="bg-[#142238] border border-[#263B55] rounded-2xl p-4">
                <Text className="text-[#91A5C0] text-sm">
                  You have no routines yet.
                </Text>
              </View>
            ) : (
              routines.map((routine) => (
                <TouchableOpacity
                  key={routine.id}
                  onPress={() =>
                    router.push({ pathname: '/routines/[id]', params: { id: routine.id } } as any)
                  }
                  activeOpacity={0.8}
                  className="bg-[#142238] border border-[#263B55] rounded-2xl p-4 mb-3 flex-row items-center"
                >
                  <View className="w-14 h-14 bg-[#263B55] rounded-xl items-center justify-center">
                    <Ionicons
                      name="barbell-outline"
                      size={26}
                      color="#8CB5EC"
                    />
                  </View>

                  <View className="flex-1 ml-4">
                    <Text className="text-[#F1F5FB] font-bold text-base">
                      {routine.name}
                    </Text>
                    <Text className="text-[#91A5C0] text-xs mt-1">
                      {plural(routine.exerciseCount, 'exercise')}
                    </Text>
                  </View>

                  <Ionicons name="chevron-forward" size={18} color="#7186A1" />
                </TouchableOpacity>
              ))
            )}

            {/* Future workout feature */}
            <View className="bg-[#142238] border border-dashed border-[#344C66] rounded-2xl p-5 mt-6 items-center">
              <Ionicons
                name="add-circle-outline"
                size={30}
                color="#8CB5EC"
              />

              <Text className="text-[#F1F5FB] font-bold text-base mt-3">
                Create Your Own Routine
              </Text>

              <Text className="text-[#91A5C0] text-sm text-center mt-2">
                Custom routines and workout logging will be available in a future update.
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}