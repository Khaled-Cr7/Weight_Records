import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScreenHeader } from '@/components/ScreenHeader';
import { plural, programImage } from '@/lib/routineFormat';
import { ProgramService } from '@/services/programService';
import type { ProgramSummary } from '@/services/types/program';

const VISIBLE_CARDS = 4; // this many cards fill the screen; more programs scroll
const GAP = 12;
const MIN_CARD_HEIGHT = 150;

// Glow colour behind each picture (all from the app's blues)
function accentFor(imageKey: string | null): string {
  switch (imageKey) {
    case 'bench':
      return '#719AD1';
    case 'dumbell':
      return '#8CB5EC';
    case 'plates':
      return '#5E86BD';
    case 'incline':
      return '#A3C4F0';
    default:
      return '#719AD1';
  }
}

export default function ExplorePrograms() {
  const router = useRouter();

  const [programs, setPrograms] = useState<ProgramSummary[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [search, setSearch] = useState('');
  const [listHeight, setListHeight] = useState(0);

  const load = useCallback(() => {
    setStatus('loading');
    ProgramService.list()
      .then((data) => {
        setPrograms(data.readyMade);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    const text = search.trim().toLowerCase();
    if (!text) return programs;
    return programs.filter(
      (program) =>
        program.name.toLowerCase().includes(text) ||
        (program.description ?? '').toLowerCase().includes(text)
    );
  }, [programs, search]);

  // Cards share the free height so four of them fill the screen
  const cardHeight =
    listHeight > 0
      ? Math.max(MIN_CARD_HEIGHT, Math.floor((listHeight - GAP * VISIBLE_CARDS) / VISIBLE_CARDS))
      : 160;

  const openProgram = (id: string) => {
    router.push({ pathname: '/programs/[id]', params: { id } } as any);
  };

  const renderCard = ({ item }: { item: ProgramSummary }) => {
    const accent = accentFor(item.imageKey);
    const pictureSize = cardHeight * 1.1;

    return (
      <TouchableOpacity
        onPress={() => openProgram(item.id)}
        activeOpacity={0.85}
        style={{ height: cardHeight, marginBottom: GAP }}
        className="rounded-3xl overflow-hidden border border-[#263B55]"
      >
        {/* Background: dark on the left, tinted on the right */}
        <LinearGradient
          colors={['#142238', '#142238', `${accent}47`]}
          locations={[0, 0.45, 1]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Soft glow behind the picture */}
        <View
          style={{
            position: 'absolute',
            right: -pictureSize * 0.12,
            top: (cardHeight - pictureSize) / 2,
            width: pictureSize,
            height: pictureSize,
            borderRadius: pictureSize / 2,
            backgroundColor: `${accent}26`,
          }}
        />

        {/* The picture, tilted and running off the edge */}
        <Image
          source={programImage(item.imageKey)}
          resizeMode="contain"
          style={{
            position: 'absolute',
            right: -pictureSize * 0.08,
            top: (cardHeight - pictureSize) / 2,
            width: pictureSize,
            height: pictureSize,
            transform: [{ rotate: '-12deg' }],
          }}
        />

        {/* Text */}
        <View className="flex-1 p-5 justify-between" style={{ width: '62%' }}>
          <View className="self-start rounded-full px-3 py-1" style={{ backgroundColor: `${accent}33` }}>
            <Text className="text-[#DCE6F4] text-xs font-semibold">
              {`${plural(item.routineCount, 'routine')}\u00A0`}
            </Text>
          </View>

          <View>
            <Text className="text-[#F1F5FB] text-2xl font-bold" numberOfLines={1}>
              {item.name}
            </Text>
            {item.description ? (
              <Text className="text-[#91A5C0] text-xs mt-1 leading-4" numberOfLines={2}>
                {item.description}
              </Text>
            ) : null}
          </View>

          <View className="flex-row items-center">
            <Text className="text-[#8CB5EC] text-xs font-bold tracking-widest">VIEW PROGRAM</Text>
            <Ionicons name="arrow-forward" size={14} color="#8CB5EC" style={{ marginLeft: 6 }} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0B1422]">
      <ScreenHeader title="Explore Programs" />

      {/* Search */}
      <View className="mx-5 mt-4 mb-3 h-12 bg-[#142238] border border-[#263B55] rounded-xl flex-row items-center px-4">
        <Ionicons name="search-outline" size={18} color="#7186A1" />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search programs"
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

      <View className="flex-1" onLayout={(event) => setListHeight(event.nativeEvent.layout.height)}>
        {status === 'loading' ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#8CB5EC" />
          </View>
        ) : status === 'error' ? (
          <View className="flex-1 items-center justify-center px-8">
            <Text className="text-[#91A5C0] text-center">Couldn't load programs.</Text>
            <TouchableOpacity
              onPress={load}
              className="bg-[#719AD1] h-11 px-6 rounded-xl items-center justify-center mt-4"
            >
              <Text className="text-[#0B1422] font-bold">Try again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={visible}
            keyExtractor={(item) => item.id}
            renderItem={renderCard}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerClassName="px-5"
            ListEmptyComponent={
              <Text className="text-[#91A5C0] text-center mt-10">
                {search.trim() ? 'No programs match your search.' : 'No programs yet.'}
              </Text>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}