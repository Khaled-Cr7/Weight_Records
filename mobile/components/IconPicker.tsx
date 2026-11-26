import React from 'react';
import { Image, TouchableOpacity, View } from 'react-native';
import { programImage } from '@/lib/routineFormat';

// The pictures used by the ready-made programs
const PICTURES = ['bench', 'dumbell', 'plates', 'incline'];

export const DEFAULT_ICON = 'bench';

type Props = { value: string; onChange: (value: string) => void };

// Row of pictures to choose from; the chosen one gets a blue border
export function IconPicker({ value, onChange }: Props) {
  return (
    <View className="flex-row gap-2">
      {PICTURES.map((key) => (
        <TouchableOpacity
          key={key}
          onPress={() => onChange(key)}
          activeOpacity={0.8}
          className={`flex-1 h-16 rounded-xl items-center justify-center border ${
            value === key ? 'bg-[#1D3558] border-[#719AD1]' : 'bg-[#0B1422] border-[#263B55]'
          }`}
        >
          <Image source={programImage(key)} style={{ width: 44, height: 44 }} resizeMode="contain" />
        </TouchableOpacity>
      ))}
    </View>
  );
}