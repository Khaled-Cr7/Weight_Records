
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { CustomButtonProps } from '@/type';
import clsx from 'clsx';

const CustomButton = ({
  onPress,
  title = 'Continue',
  style,
  textStyle,
  leftIcon,
  isLoading = false,
}: CustomButtonProps) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isLoading}
      activeOpacity={0.85}
      className={clsx(
        'h-14 bg-[#719AD1] rounded-2xl items-center justify-center',
        isLoading && 'opacity-60',
        style
      )}
    >
      {isLoading ? (
        <ActivityIndicator color="#0B1422" />
      ) : (
        <View className="flex-row items-center gap-2">
          {leftIcon}

          <Text
            className={clsx(
              'text-[#0B1422] font-bold text-base',
              textStyle
            )}
          >
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default CustomButton;
