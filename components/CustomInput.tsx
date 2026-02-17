import { View, Text, TextInput } from 'react-native'
import React from 'react'
import {CustomInputProps} from "@/type";
import { useState } from 'react';
import clsx from 'clsx';
import cn from 'clsx';



const CustomInput = ({placeholder = "Enter text", value, onChangeText, label, secureTextEntery = false, keyboardType="default"}:CustomInputProps) => {
    const [isFocused, setIsFocused] = useState(false);
  
    return (
    <View className="w-full">
      <Text className="label text-secondary font-bold">{label}</Text>

      <TextInput
        autoCapitalize='none'
        autoCorrect={false}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntery}
        keyboardType={keyboardType}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        placeholderTextColor="#888"
        className={cn('input', isFocused? 'border-secondary' : 'border-gray-300')}
      
      />
    </View>
  )
}

export default CustomInput