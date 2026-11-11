
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import CustomInput from '@/components/CustomInput';
import CustomButton from '@/components/CustomButton';
import { Link, router } from 'expo-router';
import { session } from '@/constants/session';

const Sign_IN = () => {
  const [form, setForm] = useState({
    email: '',
    password: '',
  });

  const joinAsGuest = () => {
    session.isGuest = true;
    router.replace('/');
  };

  const handleSignIn = () => {
    Alert.alert(
      'Coming Soon',
      'Account sign-in will be available when authentication is connected.'
    );
  };

  return (
    <View className="flex-1 pb-10">
      <View className="gap-5">
        <CustomInput
          label="Email address"
          placeholder="Enter your email"
          value={form.email}
          onChangeText={(text) =>
            setForm((prev) => ({ ...prev, email: text }))
          }
          keyboardType="email-address"
        />

        <CustomInput
          label="Password"
          placeholder="Enter your password"
          value={form.password}
          onChangeText={(text) =>
            setForm((prev) => ({ ...prev, password: text }))
          }
          secureTextEntery={true}
        />
      </View>

      <View className="mt-8">
        <CustomButton
          title="Sign In"
          onPress={handleSignIn}
        />
      </View>

      <View className="flex-row items-center gap-4 my-8">
        <View className="flex-1 h-px bg-[#263B55]" />
        <Text className="text-[#7186A1] text-sm">
          or
        </Text>
        <View className="flex-1 h-px bg-[#263B55]" />
      </View>

      <TouchableOpacity
        className="h-14 rounded-2xl items-center justify-center border border-[#344C66] bg-[#142238]"
        onPress={joinAsGuest}
        activeOpacity={0.8}
      >
        <Text
          className="font-semibold text-base"
          style={{ color: '#F1F5FB' }}
        >
          Continue as Guest
        </Text>
      </TouchableOpacity>

      <View className="flex-row items-center justify-center mt-10 gap-1">
        <Text className="text-[#91A5C0] text-sm">
          Don't have an account?
        </Text>

        <Link href="/Sign_Up" asChild>
          <TouchableOpacity>
            <Text
              className="font-bold text-sm"
              style={{ color: '#8CB5EC' }}
            >
              Sign Up
            </Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
};

export default Sign_IN;
