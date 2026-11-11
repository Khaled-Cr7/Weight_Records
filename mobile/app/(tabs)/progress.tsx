
import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Progress() {
  return (
    <SafeAreaView className="flex-1 bg-[#0B1422] px-6 pt-6">
      <Text className="text-[#F1F5FB] text-3xl font-bold">
        Progress
      </Text>
      <Text className="text-[#91A5C0] mt-2">
        Every rep counts.
      </Text>

      <View className="flex-row gap-3 mt-8">
        <View className="flex-1 bg-[#142238] border border-[#263B55] rounded-3xl p-5">
          <Text className="text-[#91A5C0] text-xs">
            Workouts
          </Text>
          <Text className="text-[#F1F5FB] text-3xl font-bold mt-3">
            24
          </Text>
        </View>

        <View className="flex-1 bg-[#142238] border border-[#263B55] rounded-3xl p-5">
          <Text className="text-[#91A5C0] text-xs">
            Current streak
          </Text>
          <Text className="text-[#F1F5FB] text-3xl font-bold mt-3">
            7 days
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
