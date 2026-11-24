import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import CustomInput from '@/components/CustomInput';
import CustomButton from '@/components/CustomButton';
import { Link, router } from 'expo-router';
import { useAuth } from '@/store/auth';

// Same rules as the server (server/src/routes/auth.ts)
function validate(form: { username: string; email: string; password: string }): string {
  if (!/^[A-Za-z0-9_]{3,30}$/.test(form.username.trim())) {
    return 'Username must be 3-30 characters: letters, numbers or _';
  }
  if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
    return 'Enter a valid email address';
  }
  if (form.password.length < 8) {
    return 'Password must be at least 8 characters';
  }
  return '';
}

const Sign_Up = () => {
  const signUp = useAuth((state) => state.signUp);

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async () => {
    const problem = validate(form);
    if (problem) {
      setError(problem);
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await signUp(form.email.trim(), form.username.trim(), form.password);
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 pb-10">
      <View className="gap-5">
        <CustomInput
          label="Username"
          placeholder="Choose a username"
          value={form.username}
          onChangeText={(text) =>
            setForm((prev) => ({ ...prev, username: text }))
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

      {error !== '' && (
        <Text className="text-[#F2A0A0] text-sm mt-4">{error}</Text>
      )}

      <View className="mt-8">
        <CustomButton
          title="Create Account"
          onPress={handleSignUp}
          isLoading={isLoading}
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