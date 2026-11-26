import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProgramArt } from '@/components/ProgramArt';
import { plural } from '@/lib/routineFormat';
import type { ProgramSummary } from '@/services/types/program';

// Half-width program card for two-column grids
export function ProgramCard({ program, onPress }: { program: ProgramSummary; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className="w-[48%] bg-[#142238] border border-[#263B55] rounded-2xl p-4 mb-4"
    >
      <View className="items-center">
        <ProgramArt imageKey={program.imageKey} size={96} />
      </View>

      <Text className="text-[#F1F5FB] text-base font-bold mt-3">
        {program.name}
      </Text>

      <Text className="text-[#8CB5EC] text-xs mt-1">
        {plural(program.routineCount, 'routine')}
      </Text>

      <Text className="text-[#91A5C0] text-xs mt-3 leading-4">
        {program.description ?? ''}
      </Text>

      <View className="flex-row justify-between items-center mt-5">
        <Text className="text-[#DCE6F4] text-xs font-semibold">
          View program
        </Text>
        <Ionicons name="arrow-forward" size={16} color="#8CB5EC" />
      </View>
    </TouchableOpacity>
  );
}