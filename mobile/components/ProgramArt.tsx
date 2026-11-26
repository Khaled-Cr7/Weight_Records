import React from 'react';
import { Image, View, type StyleProp, type ViewStyle } from 'react-native';
import { programImage } from '@/lib/routineFormat';

// The picture of a program (chosen by its imageKey)
export function ProgramArt({
  imageKey,
  size,
  style,
}: {
  imageKey: string | null;
  size: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[{ width: size, height: size }, style]}>
      <Image source={programImage(imageKey)} style={{ width: size, height: size }} resizeMode="contain" />
    </View>
  );
}