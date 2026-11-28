import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { formatClock } from '@/lib/workoutFormat';

const PRESETS = [30, 60, 90, 120, 180, 300];

// Bottom sheet to pick a number of seconds with big -15 / +15 buttons and quick presets
export function DurationSheet({
  visible,
  title,
  subtitle,
  initial,
  max = 1800,
  confirmLabel,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  title: string;
  subtitle?: string;
  initial: number;
  max?: number;
  confirmLabel: string;
  onClose: () => void;
  onConfirm: (seconds: number) => void;
}) {
  const insets = useSafeAreaInsets();
  const [seconds, setSeconds] = useState(initial);

  useEffect(() => {
    if (visible) setSeconds(initial);
  }, [visible, initial]);

  const change = (delta: number) => setSeconds((current) => Math.min(max, Math.max(0, current + delta)));

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior="padding" className="flex-1 justify-end">
        <TouchableOpacity activeOpacity={1} onPress={onClose} className="flex-1 bg-black/60" />
        <View style={{ paddingBottom: insets.bottom + 20 }} className="bg-[#142238] rounded-t-3xl px-5 pt-5 border-t border-[#263B55]">
          <View className="flex-row items-center">
            <View className="flex-1">
              <Text className="text-[#F1F5FB] text-xl font-bold">{title}</Text>
              {subtitle ? <Text className="text-[#91A5C0] text-xs mt-1">{subtitle}</Text> : null}
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={24} color="#91A5C0" />
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center justify-between mt-5">
            <TouchableOpacity
              onPress={() => change(-15)}
              activeOpacity={0.7}
              className="w-20 h-16 rounded-2xl bg-[#192C46] border border-[#263B55] items-center justify-center"
            >
              <Text className="text-[#DCE6F4] text-lg font-bold">-15s</Text>
            </TouchableOpacity>

            <Text className="text-[#F1F5FB] text-4xl font-bold">{formatClock(seconds)}</Text>

            <TouchableOpacity
              onPress={() => change(15)}
              activeOpacity={0.7}
              className="w-20 h-16 rounded-2xl bg-[#192C46] border border-[#263B55] items-center justify-center"
            >
              <Text className="text-[#DCE6F4] text-lg font-bold">+15s</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row flex-wrap gap-2 mt-5">
            {PRESETS.filter((value) => value <= max).map((value) => (
              <TouchableOpacity
                key={value}
                onPress={() => setSeconds(value)}
                activeOpacity={0.7}
                className={`h-10 px-4 rounded-xl items-center justify-center border ${
                  seconds === value ? 'bg-[#1D3558] border-[#2F5185]' : 'bg-[#0B1422] border-[#263B55]'
                }`}
              >
                <Text className={`font-semibold ${seconds === value ? 'text-[#8CB5EC]' : 'text-[#91A5C0]'}`}>{formatClock(value)}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            onPress={() => onConfirm(seconds)}
            activeOpacity={0.85}
            className="bg-[#719AD1] h-14 rounded-2xl items-center justify-center mt-6"
          >
            <Text className="text-[#0B1422] font-bold text-base">{confirmLabel}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}