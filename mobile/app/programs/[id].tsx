import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { NameModal } from '@/components/NameModal';
import { ProgramArt } from '@/components/ProgramArt';
import { ScreenHeader } from '@/components/ScreenHeader';
import { countSets, plural, topMuscles } from '@/lib/routineFormat';
import { ProgramService } from '@/services/programService';
import type { ProgramDetail } from '@/services/types/program';

const MAX_THUMBS = 4;
const ACCENTS = ['#719AD1', '#8CB5EC', '#5E86BD', '#A3C4F0']; // one per routine card, repeating

export default function ProgramScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [program, setProgram] = useState<ProgramDetail | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [reordering, setReordering] = useState(false);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState('');

  // Loads when the screen opens and again when we come back to it (after editing a routine, say)
  const load = useCallback(() => {
    let cancelled = false;

    ProgramService.getById(id)
      .then((data) => {
        if (cancelled) return;
        setProgram(data);
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

  // Copies this ready-made program into the user's own programs, then opens the copy
  const addToMyPrograms = async () => {
    if (!program || busy) return;
    setBusy(true);
    setActionError(null);
    try {
      const copy = await ProgramService.copy(program.id);
      router.replace({ pathname: '/programs/[id]', params: { id: copy.id } } as any);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Couldn't add the program");
      setBusy(false);
    }
  };

  const confirmDelete = () => {
    if (!program) return;
    const count = program.routines.length;
    Alert.alert(
      `Delete "${program.name}"?`,
      count > 0
        ? `Its ${plural(count, 'routine')} will be deleted too. Workouts you have finished are kept.`
        : 'This program will be deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            setActionError(null);
            try {
              await ProgramService.remove(program.id);
              router.back();
            } catch (error) {
              setActionError(error instanceof Error ? error.message : "Couldn't delete the program");
              setBusy(false);
            }
          },
        },
      ]
    );
  };

  // Moves a routine one place up or down and saves the new order
  const moveRoutine = async (index: number, delta: -1 | 1) => {
    if (!program) return;
    const target = index + delta;
    if (target < 0 || target >= program.routines.length) return;

    const routines = [...program.routines];
    [routines[index], routines[target]] = [routines[target], routines[index]];
    setProgram({ ...program, routines }); // show the new order straight away
    setActionError(null);

    try {
      await ProgramService.reorderRoutines(program.id, routines.map((routine) => routine.id));
    } catch {
      setActionError("Couldn't save the new order");
      load();
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

  const isOwner = !program.isReadyMade;
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
        {/* Hero */}
        <View className="rounded-3xl overflow-hidden border border-[#344C66]" style={{ minHeight: 190 }}>
          <LinearGradient
            colors={['#142238', '#192C46', '#2A4A78']}
            locations={[0, 0.5, 1]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />

          {/* Glow and the icon, running off the right edge */}
          <View
            style={{
              position: 'absolute',
              right: -50,
              top: 10,
              width: 210,
              height: 210,
              borderRadius: 105,
              backgroundColor: '#719AD126',
            }}
          />
          <ProgramArt
            imageKey={program.imageKey}
            size={170}
            style={{ position: 'absolute', right: -24, top: 20, transform: [{ rotate: '-12deg' }] }}
          />

          <View className="p-5" style={{ width: '66%' }}>
            <Text className="text-[#8CB5EC] text-xs font-bold tracking-widest">
              {program.isReadyMade ? 'READY-MADE PROGRAM' : 'MY PROGRAM'}
            </Text>
            <Text className="text-[#F1F5FB] text-3xl font-bold mt-2">{program.name}</Text>
            {program.description ? (
              <Text className="text-[#91A5C0] text-sm mt-2 leading-5">{program.description}</Text>
            ) : null}
          </View>

          <View className="flex-row px-5 pb-5 pt-1">
            {[
              { value: program.routines.length, label: 'ROUTINES' },
              { value: exerciseTotal, label: 'EXERCISES' },
              { value: setTotal, label: 'SETS' },
            ].map((stat) => (
              <View key={stat.label} className="mr-6">
                <Text className="text-[#F1F5FB] text-2xl font-bold">{stat.value}</Text>
                <Text className="text-[#8CB5EC] text-[10px] font-bold tracking-widest mt-0.5">{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Ready-made programs are copied into the user's own programs */}
        {program.isReadyMade && (
          <TouchableOpacity
            onPress={addToMyPrograms}
            disabled={busy}
            activeOpacity={0.85}
            className="bg-[#719AD1] h-12 rounded-xl flex-row items-center justify-center gap-2 mt-4"
          >
            {busy ? (
              <ActivityIndicator color="#0B1422" />
            ) : (
              <>
                <Ionicons name="add-circle-outline" size={20} color="#0B1422" />
                <Text className="text-[#0B1422] font-bold">Add to my programs</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Own programs can be edited and deleted */}
        {isOwner && (
          <View className="flex-row gap-3 mt-4">
            <TouchableOpacity
              onPress={() => setEditing(true)}
              disabled={busy}
              activeOpacity={0.85}
              className="flex-1 h-11 rounded-xl bg-[#142238] border border-[#263B55] justify-center"
            >
              <Text className="text-[#DCE6F4] font-semibold text-center">
                <Ionicons name="create-outline" size={16} color="#8CB5EC" />
                {'  Edit details'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={confirmDelete}
              disabled={busy}
              activeOpacity={0.85}
              className="flex-1 h-11 rounded-xl bg-[#142238] border border-[#263B55] justify-center"
            >
              <Text className="text-[#F2A0A0] font-semibold text-center">
                <Ionicons name="trash-outline" size={16} color="#F2A0A0" />
                {'  Delete'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {actionError && <Text className="text-[#F2A0A0] text-xs text-center mt-3">{actionError}</Text>}

        {/* Routines */}
        <View className="mt-8 mb-4 flex-row items-end justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-[#F1F5FB] text-xl font-bold">Routines</Text>
            <Text className="text-[#91A5C0] text-sm mt-1">Start any routine on any day, in any order.</Text>
          </View>

          {isOwner && program.routines.length > 1 && (
            <TouchableOpacity
              onPress={() => setReordering((current) => !current)}
              hitSlop={8}
              style={{ width: 84 }}
            >
              <Text className="text-[#8CB5EC] font-semibold text-right">{reordering ? 'Done' : 'Reorder'}</Text>
            </TouchableOpacity>
          )}
        </View>

        {program.routines.length === 0 && (
          <View className="bg-[#142238] border border-[#263B55] rounded-2xl p-4">
            <Text className="text-[#91A5C0] text-sm">This program has no routines yet.</Text>
          </View>
        )}

        {program.routines.map((routine, index) => {
          const accent = ACCENTS[index % ACCENTS.length];
          const thumbs = routine.exercises.slice(0, MAX_THUMBS);
          const extra = routine.exercises.length - thumbs.length;
          const muscles = topMuscles(routine);

          return (
            <TouchableOpacity
              key={routine.id}
              onPress={() => {
                if (!reordering) router.push({ pathname: '/routines/[id]', params: { id: routine.id } } as any);
              }}
              activeOpacity={reordering ? 1 : 0.85}
              className="rounded-3xl overflow-hidden border border-[#263B55] mb-3"
            >
              <LinearGradient
                colors={['#142238', '#142238', `${accent}40`]}
                locations={[0, 0.5, 1]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={StyleSheet.absoluteFill}
              />

              {/* Big faint number */}
              <Text
                style={{
                  position: 'absolute',
                  right: 16,
                  top: 4,
                  fontSize: 72,
                  lineHeight: 80,
                  fontWeight: '800',
                  color: `${accent}30`,
                }}
              >
                {String(index + 1).padStart(2, '0')}
              </Text>

              <View className="p-4">
                <View style={{ paddingRight: 70 }}>
                  <Text className="text-[#F1F5FB] font-bold text-xl" numberOfLines={2}>
                    {routine.name}
                  </Text>
                  <Text className="text-[#91A5C0] text-xs mt-1">
                    {plural(routine.exercises.length, 'exercise')} · {plural(countSets(routine), 'set')}
                  </Text>
                </View>

                {muscles.length > 0 && (
                  <View className="flex-row flex-wrap gap-2 mt-3">
                    {muscles.map((muscle) => (
                      <View key={muscle} className="rounded-full px-3 py-1" style={{ backgroundColor: `${accent}33` }}>
                        <Text className="text-[#DCE6F4] text-xs capitalize">{`${muscle}\u00A0`}</Text>
                      </View>
                    ))}
                  </View>
                )}

                <View className="flex-row items-center justify-between mt-4">
                  {/* Overlapping exercise pictures */}
                  <View className="flex-row items-center pl-3">
                    {thumbs.map((item) =>
                      item.exercise.image ? (
                        <Image
                          key={item.id}
                          source={{ uri: item.exercise.image }}
                          className="w-11 h-11 rounded-full bg-[#263B55] border-2 border-[#142238] -ml-3"
                          resizeMode="cover"
                        />
                      ) : (
                        <View
                          key={item.id}
                          className="w-11 h-11 rounded-full bg-[#263B55] border-2 border-[#142238] -ml-3 items-center justify-center"
                        >
                          <Ionicons name="barbell-outline" size={16} color="#8CB5EC" />
                        </View>
                      )
                    )}
                    {extra > 0 && (
                      <View className="w-11 h-11 rounded-full bg-[#263B55] border-2 border-[#142238] -ml-3 items-center justify-center">
                        <Text className="text-[#DCE6F4] text-xs font-bold">{`+${extra}`}</Text>
                      </View>
                    )}
                  </View>

                  {reordering ? (
                    <View className="flex-row">
                      <TouchableOpacity onPress={() => moveRoutine(index, -1)} hitSlop={8} className="p-1.5">
                        <Ionicons name="arrow-up-circle" size={30} color={index === 0 ? '#344C66' : '#8CB5EC'} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => moveRoutine(index, 1)} hitSlop={8} className="p-1.5">
                        <Ionicons
                          name="arrow-down-circle"
                          size={30}
                          color={index === program.routines.length - 1 ? '#344C66' : '#8CB5EC'}
                        />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: `${accent}33` }}>
                      <Ionicons name="arrow-forward" size={18} color="#DCE6F4" />
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        {/* New routine inside this program */}
        {isOwner && (
          <TouchableOpacity
            onPress={() =>
              router.push({ pathname: '/routine-editor', params: { programId: program.id } } as any)
            }
            activeOpacity={0.85}
            className="h-12 rounded-xl border border-dashed border-[#344C66] flex-row items-center justify-center gap-2 mt-1"
          >
            <Ionicons name="add-circle-outline" size={20} color="#8CB5EC" />
            <Text className="text-[#8CB5EC] font-bold">Add routine</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <NameModal
        visible={editing}
        title="Edit program"
        submitLabel="Save"
        initialName={program.name}
        initialDescription={program.description ?? ''}
        initialIcon={program.imageKey}
        withIcon
        onClose={() => setEditing(false)}
        onSubmit={async (name, description, icon) => {
          const updated = await ProgramService.update(program.id, { name, description, imageKey: icon });
          setProgram(updated);
          setEditing(false);
        }}
      />
    </SafeAreaView>
  );
}