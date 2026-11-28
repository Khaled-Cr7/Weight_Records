import React from 'react';
import { TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// A number box with a big minus and plus button on each side (easy to hit with sweaty hands)
export function StepperInput({
  value,
  placeholder,
  onChangeText,
  onBlur,
  onMinus,
  onPlus,
  decimal = false,
  maxLength = 6,
  height = 48,
}: {
  value: string;
  placeholder?: string;
  onChangeText: (text: string) => void;
  onBlur?: () => void;
  onMinus: () => void;
  onPlus: () => void;
  decimal?: boolean;
  maxLength?: number;
  height?: number;
}) {
  return (
    <View
      style={{ height }}
      className="flex-row items-center bg-[#0B1422] border border-[#263B55] rounded-2xl overflow-hidden"
    >
      <TouchableOpacity onPress={onMinus} activeOpacity={0.6} style={{ width: 38 }} className="h-full items-center justify-center bg-[#192C46]">
        <Ionicons name="remove" size={20} color="#DCE6F4" />
      </TouchableOpacity>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
        placeholder={placeholder}
        placeholderTextColor="#506680"
        keyboardType={decimal ? 'decimal-pad' : 'number-pad'}
        maxLength={maxLength}
        selectTextOnFocus
        className="flex-1 text-[#F1F5FB] font-bold"
        style={{ padding: 0, textAlign: 'center', fontSize: 17, height: '100%' }}
      />

      <TouchableOpacity onPress={onPlus} activeOpacity={0.6} style={{ width: 38 }} className="h-full items-center justify-center bg-[#192C46]">
        <Ionicons name="add" size={20} color="#DCE6F4" />
      </TouchableOpacity>
    </View>
  );
}