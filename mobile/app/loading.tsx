import React, { useEffect, useRef, useState } from 'react';
import { View, Image, Animated, Easing, Dimensions, TouchableOpacity, Text } from 'react-native';
import { icons } from '@/constants/icons';
import { useLoading } from '@/context/LoadingContext';

const { width, height } = Dimensions.get('window');

export default function LoadingScreen() {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const [showCancel, setShowCancel] = useState(false);
  const { setLoading } = useLoading();

  // 1. Rotation Animation
  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  // 2. Timer to show "Cancel" button if loading takes > 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowCancel(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View 
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: width,
        height: height,
        zIndex: 9999,
        backgroundColor: '#dfe7ea',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View className="items-center justify-center">
        {/* Animated Ring */}
        <Animated.View
          style={{
            transform: [{ rotate: spin }],
            width: 140, // Slightly bigger than the icon
            height: 140,
            borderRadius: 90,
            borderWidth: 5,
            borderColor: '#344c66',
            borderTopColor: 'transparent',
            position: 'absolute',
          }}
        />

        {/* Static App Icon */}
        <Image 
          source={icons.appIcon} 
          className="size-40" 
          resizeMode="contain" 
        />
      </View>

      {/* 3. The "Cancel" Button - Only appears after 3 seconds */}
      {showCancel && (
        <TouchableOpacity 
          onPress={() => setLoading(false)}
          activeOpacity={0.8}
          className="absolute bottom-24 bg-white px-8 py-3 rounded-full shadow-md border border-gray-100"
        >
          <Text className="text-[#344c66] font-bold text-base">
            Take me back
          </Text>
          <Text className="text-gray-400 text-[10px] text-center mt-1">
            Connection is slow...
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}