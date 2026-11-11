
import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Nutrition() {
  return (
    <SafeAreaView className="flex-1 bg-[#0B1422] px-6 pt-6">
      <Text className="text-[#F1F5FB] text-3xl font-bold">
        Nutrition
      </Text>
      <Text className="text-[#91A5C0] mt-2">
        Your daily nutrition overview
      </Text>

      <View className="bg-[#142238] border border-[#263B55] rounded-3xl p-6 mt-8">
        <Text className="text-[#91A5C0]">Calories consumed</Text>
        <Text className="text-[#F1F5FB] text-4xl font-bold mt-3">
          1,650
          <Text className="text-[#91A5C0] text-base"> / 2,400 kcal</Text>
        </Text>
        <Text className="text-[#8CB5EC] mt-4">
          750 kcal remaining
        </Text>
      </View>
    </SafeAreaView>
  );
}
