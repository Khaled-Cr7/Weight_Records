import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// Back button (and an optional title) for the dark screens
export function ScreenHeader({ title }: { title?: string }) {
  const router = useRouter();

  return (
    <View className="flex-row items-center px-5 pt-3">
      <TouchableOpacity
        onPress={() => router.back()}
        activeOpacity={0.8}
        className="w-10 h-10 rounded-full bg-[#142238] border border-[#263B55] items-center justify-center"
      >
        <Ionicons name="chevron-back" size={22} color="#F1F5FB" />
      </TouchableOpacity>

      {title ? <Text className="text-[#F1F5FB] text-2xl font-bold ml-4">{title}</Text> : null}
    </View>
  );
}