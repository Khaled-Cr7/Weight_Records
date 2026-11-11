
import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Social() {
  return (
    <SafeAreaView className="flex-1 bg-[#0B1422] px-6 pt-6">
      <Text className="text-[#F1F5FB] text-3xl font-bold">
        Social
      </Text>
      <Text className="text-[#91A5C0] mt-2">
        Train together. Grow stronger.
      </Text>

      <View className="bg-[#142238] border border-[#263B55] rounded-3xl p-6 mt-8">
        <Text className="text-[#F1F5FB] text-xl font-bold">
          Weekly Challenge
        </Text>
        <Text className="text-[#91A5C0] mt-3">
          Complete 4 workouts this week.
        </Text>
        <Text className="text-[#8CB5EC] font-semibold mt-4">
          2 / 4 workouts completed
        </Text>
      </View>
    </SafeAreaView>
  );
}
