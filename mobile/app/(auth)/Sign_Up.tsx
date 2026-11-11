
import React, { useState } from 'react';
import {
  View,
  Text,
  Alert,
  TouchableOpacity,
} from 'react-native';
import CustomInput from '@/components/CustomInput';
import CustomButton from '@/components/CustomButton';
import { Link } from 'expo-router';

const Sign_Up = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  });

  const handleSignUp = () => {
    Alert.alert(
      'Coming Soon',
      'Account registration will be available when authentication is connected.'
    );
  };

  return (
    <View className="flex-1 pb-10">
      <View className="gap-5">
        <CustomInput
          label="Full name"
          placeholder="Enter your full name"
          value={form.name}
          onChangeText={(text) =>
            setForm((prev) => ({ ...prev, name: text }))
          }
        />

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
          placeholder="Create a password"
          value={form.password}
          onChangeText={(text) =>
            setForm((prev) => ({ ...prev, password: text }))
          }
          secureTextEntery={true}
        />

        <Text className="text-[#7186A1] text-xs leading-5">
          Use at least 8 characters for your password.
        </Text>
      </View>

      <View className="mt-8">
        <CustomButton
          title="Create Account"
          onPress={handleSignUp}
        />
      </View>

      <View className="flex-row items-center justify-center mt-10 gap-1">
        <Text className="text-[#91A5C0] text-sm">
          Already have an account?
        </Text>

        <Link href="/Sign_In" asChild>
          <TouchableOpacity>
            <Text
              className="font-bold text-sm"
              style={{ color: '#8CB5EC' }}
            >
              Sign In
            </Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
};

export default Sign_Up;
