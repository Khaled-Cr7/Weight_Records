import React from 'react';
import { Image, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { programImage } from '@/lib/routineFormat';

export const EMOJI_PREFIX = 'emoji:';

// The picture or emoji of a program. Emoji icons are saved as "emoji:💪".
export function ProgramArt({
  imageKey,
  size,
  style,
}: {
  imageKey: string | null;
  size: number;
  style?: StyleProp<ViewStyle>;
}) {
  if (imageKey?.startsWith(EMOJI_PREFIX)) {
    return (
      <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
        <Text style={{ fontSize: size * 0.62, lineHeight: size * 0.85, textAlign: 'center' }}>
          {imageKey.slice(EMOJI_PREFIX.length)}
        </Text>
      </View>
    );
  }

  return (
    <View style={[{ width: size, height: size }, style]}>
      <Image source={programImage(imageKey)} style={{ width: size, height: size }} resizeMode="contain" />
    </View>
  );
}