import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ExerciseService } from '@/services/exerciseService';
import type { ExerciseFilters, ExerciseListItem } from '@/services/types/exercise';

const PAGE_SIZE = 20;

type ChipProps = { label: string; active: boolean; onPress: () => void };

const Chip = ({ label, active, onPress }: ChipProps) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.8}
    className={`px-4 h-9 rounded-full items-center justify-center border ${
      active ? 'bg-[#719AD1] border-[#719AD1]' : 'bg-[#142238] border-[#263B55]'
    }`}
  >
    <Text
      className={`text-xs font-semibold capitalize ${
        active ? 'text-[#0B1422]' : 'text-[#91A5C0]'
      }`}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

export default function ExerciseLibrary() {
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [query, setQuery] = useState(''); // the search text after a short pause
  const [muscle, setMuscle] = useState<string | null>(null);
  const [equipment, setEquipment] = useState<string | null>(null);
  const [filters, setFilters] = useState<ExerciseFilters | null>(null);

  const [items, setItems] = useState<ExerciseListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);

  // Lets us ignore the answer of an older request if a newer one has started
  const requestId = useRef(0);

  // Filter chips (loaded once)
  useEffect(() => {
    ExerciseService.getFilters()
      .then(setFilters)
      .catch(() => {});
  }, []);

  // Wait 300 ms after typing stops before searching
  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // First page: runs on start and whenever the search or a filter changes
  const loadFirstPage = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError(false);

    try {
      const result = await ExerciseService.list({
        q: query,
        muscle: muscle ?? undefined,
        equipment: equipment ?? undefined,
        limit: PAGE_SIZE,
        offset: 0,
      });
      if (id !== requestId.current) return;
      setItems(result.items);
      setTotal(result.total);
    } catch {
      if (id === requestId.current) setError(true);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [query, muscle, equipment]);

  useEffect(() => {
    loadFirstPage();
  }, [loadFirstPage]);

  // Next page: runs when the user scrolls near the bottom
  const loadMore = async () => {
    if (loading || loadingMore || error || items.length >= total) return;

    const id = requestId.current;
    setLoadingMore(true);

    try {
      const result = await ExerciseService.list({
        q: query,
        muscle: muscle ?? undefined,
        equipment: equipment ?? undefined,
        limit: PAGE_SIZE,
        offset: items.length,
      });
      if (id !== requestId.current) return;
      setItems((previous) => [...previous, ...result.items]);
    } catch {
      // keep what we have; scrolling again tries once more
    } finally {
      setLoadingMore(false);
    }
  };

  const openExercise = (exerciseId: string) => {
    router.push({
      pathname: '/schedule/[detail]',
      params: { exerciseId },
    } as any);
  };

  const renderItem = ({ item }: { item: ExerciseListItem }) => (
    <TouchableOpacity
      onPress={() => openExercise(item.id)}
      activeOpacity={0.8}
      className="flex-row items-center bg-[#142238] border border-[#263B55] rounded-2xl p-3 mb-3"
    >
      {item.image ? (
        <Image
          source={{ uri: item.image }}
          className="w-14 h-14 rounded-xl bg-[#263B55]"
          resizeMode="cover"
        />
      ) : (
        <View className="w-14 h-14 rounded-xl bg-[#263B55] items-center justify-center">
          <Ionicons name="barbell-outline" size={22} color="#8CB5EC" />
        </View>
      )}

      <View className="flex-1 ml-3">
        <Text className="text-[#F1F5FB] font-bold" numberOfLines={2}>
          {item.name}
        </Text>
        <Text className="text-[#91A5C0] text-xs mt-1 capitalize" numberOfLines={1}>
          {[item.primaryMuscles[0], item.equipment ?? 'no equipment'].filter(Boolean).join(' • ')}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={18} color="#7186A1" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#0B1422]">
      {/* Top bar */}
      <View className="flex-row items-center px-5 pt-3">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-[#142238] border border-[#263B55] items-center justify-center"
        >
          <Ionicons name="chevron-back" size={22} color="#F1F5FB" />
        </TouchableOpacity>
        <Text className="text-[#F1F5FB] text-2xl font-bold ml-4">Exercise Library</Text>
      </View>

      {/* Search */}
      <View className="mx-5 mt-4 mb-3 h-12 bg-[#142238] border border-[#263B55] rounded-xl flex-row items-center px-4">
        <Ionicons name="search-outline" size={18} color="#7186A1" />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search exercises"
          placeholderTextColor="#7186A1"
          autoCorrect={false}
          returnKeyType="search"
          className="flex-1 ml-3 text-[#F1F5FB]"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color="#7186A1" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter chips */}
      {filters && (
        <>
          <View className="h-9 mb-2">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="px-5 gap-2"
            >
              <Chip label="All muscles" active={muscle === null} onPress={() => setMuscle(null)} />
              {filters.muscles.map((name) => (
                <Chip
                  key={name}
                  label={name}
                  active={muscle === name}
                  onPress={() => setMuscle(muscle === name ? null : name)}
                />
              ))}
            </ScrollView>
          </View>

          <View className="h-9 mb-3">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="px-5 gap-2"
            >
              <Chip label="All equipment" active={equipment === null} onPress={() => setEquipment(null)} />
              {filters.equipment.map((name) => (
                <Chip
                  key={name}
                  label={name}
                  active={equipment === name}
                  onPress={() => setEquipment(equipment === name ? null : name)}
                />
              ))}
            </ScrollView>
          </View>
        </>
      )}

      {!loading && !error && (
        <Text className="text-[#7186A1] text-xs px-5 mb-2">
          {total} {total === 1 ? 'exercise' : 'exercises'}
        </Text>
      )}

      {/* Results */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#8CB5EC" />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-[#91A5C0] text-center">Couldn't load exercises.</Text>
          <TouchableOpacity
            onPress={loadFirstPage}
            className="bg-[#719AD1] h-11 px-6 rounded-xl items-center justify-center mt-4"
          >
            <Text className="text-[#0B1422] font-bold">Try again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerClassName="px-5 pb-10"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <Text className="text-[#91A5C0] text-center mt-10">No exercises found.</Text>
          }
          ListFooterComponent={
            loadingMore ? <ActivityIndicator color="#8CB5EC" className="my-4" /> : undefined
          }
        />
      )}
    </SafeAreaView>
  );
}