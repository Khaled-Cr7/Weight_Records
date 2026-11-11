
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Image,
  Animated,
  Easing,
  TouchableOpacity,
  Text,
} from 'react-native';

type LoadingScreenProps = {
  onCancel?: () => void;
};

export default function LoadingScreen({ onCancel }: LoadingScreenProps) {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [showCancel, setShowCancel] = useState(false);

  useEffect(() => {
    const rotation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    const fade = Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 650,
      useNativeDriver: true,
    });

    rotation.start();
    fade.start();

    return () => {
      rotation.stop();
      fade.stop();
    };
  }, [rotateAnim, fadeAnim]);

  useEffect(() => {
    if (!onCancel) return;

    const timer = setTimeout(() => {
      setShowCancel(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, [onCancel]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View className="absolute inset-0 z-50 flex-1 items-center justify-center bg-[#0B1422]">

      {/* Logo and Branding */}
      <Animated.View
        className="items-center"
        style={{ opacity: fadeAnim }}
      >
        {/* Logo Container */}
        <View className="w-[150px] h-[150px] items-center justify-center">

          {/* Animated Loading Ring */}
          <Animated.View
            className="absolute w-[145px] h-[145px] rounded-full border-2 border-[#243A57] border-t-[#719AD1]"
            style={{
              transform: [{ rotate: spin }],
            }}
          />

          {/* Repsy Logo */}
          <Image
            source={require('../assets/images/repsy-symbol-transparent.png')}
            className="w-[110px] h-[110px]"
            resizeMode="contain"
          />

        </View>

        {/* App Name */}
        <Text className="text-[#F1F5FB] text-[34px] font-bold tracking-wider mt-5">
          Repsy
        </Text>

        {/* Tagline */}
        <Text className="text-[#91A5C0] text-[13px] tracking-widest mt-2">
          Train. Track. Progress.
        </Text>

      </Animated.View>

      {/* Loading Message */}
      <View className="absolute bottom-14">
        <Text className="text-[#91A5C0] text-xs tracking-wide">
          Getting everything ready...
        </Text>
      </View>

      {/* Optional Cancel Button */}
      {showCancel && onCancel && (
        <TouchableOpacity
          onPress={onCancel}
          activeOpacity={0.8}
          className="absolute bottom-24 bg-[#1E2D44] px-7 py-3 rounded-full items-center border border-[#344C66]"
        >
          <Text className="text-[#F1F5FB] text-sm font-semibold">
            Take me back
          </Text>

          <Text className="text-[#91A5C0] text-[10px] mt-1">
            Connection is slow...
          </Text>
        </TouchableOpacity>
      )}

    </View>
  );
}
