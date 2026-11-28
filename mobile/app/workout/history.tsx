import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { ScreenHeader } from '@/components/ScreenHeader';
import { formatDate, formatDuration, formatKg } from '@/lib/workoutFormat';
import { plural } from '@/lib/routineFormat';
import { WorkoutService } from '@/services/workoutService';
import type { WorkoutListItem } from '@/services/types/workout';

const PAGE = 20;

export default function WorkoutHistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<WorkoutListItem[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Reloads from the top whenever the screen is shown (a workout may have been deleted)
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      WorkoutService.history(PAGE, 0)
        .then((data) => {
          if (cancelled) return;
          setItems(data.items);
          setHasMore(data.items.length === PAGE);
          setStatus('ready');
        })
        .catch(() => {
          if (!cancelled) setStatus((current) => (current === 'ready' ? current : 'error'));
        });
      return () => {
        cancelled = true;
      };
    }, [])
  );

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const data = await WorkoutService.history(PAGE, items.length);
      setItems((current) => [...current, ...data.items]);
      setHasMore(data.items.length === PAGE);
    } catch {
      // keep what we have; the button stays so they can try again
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0B1422]">
      <ScreenHeader title="History" />

      {status === 'loading' ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#8CB5EC" />
        </View>
      ) : status === 'error' ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-[#91A5C0] text-center">Couldn't load your workouts.</Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: insets.bottom + 80 }}
          showsVerticalScrollIndicator={false}
        >
          {items.length === 0 && (
            <View className="bg-[#142238] border border-[#263B55] rounded-2xl p-4">
              <Text className="text-[#91A5C0] text-sm">No finished workouts yet. Your first one will show up here.</Text>
            </View>
          )}

          {items.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => router.push({ pathname: '/workout/summary', params: { id: item.id } } as any)}
              activeOpacity={0.8}
              className="bg-[#142238] border border-[#263B55] rounded-3xl p-4 mb-3"
            >
              <Text className="text-[#F1F5FB] font-bold text-base" numberOfLines={1}>
                {item.name}
              </Text>
              <Text className="text-[#8CB5EC] text-xs font-semibold mt-1">{formatDate(item.finishedAt ?? item.startedAt)}</Text>
              <Text className="text-[#91A5C0] text-xs mt-2" numberOfLines={2}>
                {item.exerciseNames.join(', ')}
              </Text>
              <Text className="text-[#DCE6F4] text-xs mt-2">
                {`${formatDuration(item.durationSeconds)}  ·  ${plural(item.setCount, 'set')}  ·  ${formatKg(item.volumeKg)}`}
              </Text>
            </TouchableOpacity>
          ))}

          {hasMore && (
            <TouchableOpacity
              onPress={loadMore}
              disabled={loadingMore}
              className="h-11 rounded-xl border border-[#263B55] items-center justify-center mt-1"
            >
              {loadingMore ? <ActivityIndicator color="#8CB5EC" /> : <Text className="text-[#8CB5EC] font-semibold">Load more</Text>}
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}