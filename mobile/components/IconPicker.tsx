import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { programImage } from '@/lib/routineFormat';
import { EMOJI_PREFIX } from '@/components/ProgramArt';

// The pictures used by the ready-made programs, then a set of emojis
const PICTURES = ['barbell', 'bench', 'dumbell', 'plates', 'incline'];
const EMOJIS = [
  '💪', '🏋️', '🔥', '⚡', '🏆', '🎯', '🚀', '🦾',
  '🥇', '🧠', '❤️', '🏃', '🚴', '🤸', '🧘', '🥊',
  '🦍', '🐺', '🦁', '🐉', '💎', '👑', '🌟', '⛰️',
];

export const DEFAULT_ICON = 'barbell';

type Props = { value: string; onChange: (value: string) => void };

// Grid of icons to choose from; the chosen one gets a blue border
export function IconPicker({ value, onChange }: Props) {
  const cell = (key: string, selected: boolean, content: React.ReactNode) => (
    <TouchableOpacity
      key={key}
      onPress={() => onChange(key)}
      activeOpacity={0.8}
      className={`w-12 h-12 rounded-xl items-center justify-center border ${
        selected ? 'bg-[#1D3558] border-[#719AD1]' : 'bg-[#0B1422] border-[#263B55]'
      }`}
    >
      {content}
    </TouchableOpacity>
  );

  return (
    <View className="flex-row flex-wrap gap-2">
      {PICTURES.map((key) =>
        cell(
          key,
          value === key,
          <Image source={programImage(key)} style={{ width: 34, height: 34 }} resizeMode="contain" />
        )
      )}
      {EMOJIS.map((emoji) => {
        const key = `${EMOJI_PREFIX}${emoji}`;
        return cell(key, value === key, <Text style={{ fontSize: 24 }}>{emoji}</Text>);
      })}
    </View>
  );
}