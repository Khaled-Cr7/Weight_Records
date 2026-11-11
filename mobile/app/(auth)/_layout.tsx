
import React from 'react';
import {
  View,
  Text,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Slot, usePathname } from 'expo-router';

export default function AuthLayout() {
  const pathname = usePathname();
  const isSignIn = pathname.includes('Sign_In');

  return (
    <SafeAreaView className="flex-1 bg-[#0B1422]">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="flex-grow px-7"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Branding */}
          <View className="items-center pt-12 pb-10">
            <Image
              source={require('../../assets/images/repsy-symbol-transparent.png')}
              className="w-24 h-24"
              resizeMode="contain"
            />

            <Text className="text-[#F1F5FB] text-3xl font-bold tracking-wider mt-3">
              Repsy
            </Text>

            <Text className="text-[#91A5C0] text-xs tracking-widest mt-2">
              Train. Track. Progress.
            </Text>
          </View>

          {/* Page heading */}
          <View className="mb-8">
            <Text className="text-[#F1F5FB] text-[30px] font-bold">
              {isSignIn ? 'Welcome back' : 'Create your account'}
            </Text>

            <Text className="text-[#91A5C0] text-sm mt-2">
              {isSignIn
                ? 'Sign in to continue your fitness journey.'
                : 'Start tracking your progress with Repsy.'}
            </Text>
          </View>

          {/* Sign In or Sign Up content */}
          <Slot />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
