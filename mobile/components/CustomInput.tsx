
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CustomInputProps } from '@/type';

const CustomInput = ({
  placeholder = 'Enter text',
  value,
  onChangeText,
  label,
  secureTextEntery = false,
  keyboardType = 'default',
}: CustomInputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View className="w-full gap-2">
      <Text className="text-[#DCE6F4] text-sm font-semibold">
        {label}
      </Text>

      <View
        className={`flex-row items-center rounded-2xl border px-4 bg-[#142238] ${
          isFocused
            ? 'border-[#719AD1]'
            : 'border-[#263B55]'
        }`}
      >
        <TextInput
          className="flex-1 h-14 text-[#F1F5FB] text-base"
          placeholder={placeholder}
          placeholderTextColor="#7186A1"
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry={secureTextEntery && !showPassword}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          selectionColor="#719AD1"
        />

        {secureTextEntery && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            className="p-2"
            accessibilityRole="button"
            accessibilityLabel={
              showPassword ? 'Hide password' : 'Show password'
            }
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={21}
              color="#91A5C0"
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default CustomInput;
