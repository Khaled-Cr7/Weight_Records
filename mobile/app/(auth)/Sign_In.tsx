import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import CustomInput from '@/components/CustomInput';
import CustomButton from '@/components/CustomButton';
import { Link, router } from 'expo-router';
import { useAuth } from '@/store/auth';

// Development shortcut. Create the account with `npm run seed:dev-user` in /server.
// Remove this button (and the seed script) before the final version.
const DEV_EMAIL = 'user1@repsy.dev';
const DEV_PASSWORD = 'user1pass123';

const Sign_IN = () => {
  const signIn = useAuth((state) => state.signIn);

  const [form, setForm] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const submit = async (email: string, password: string) => {
    setError('');
    setIsLoading(true);

    try {
      await signIn(email.trim(), password);
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = () => {
    if (!form.email.trim() || !form.password) {
      setError('Enter your email and password');
      return;
    }
    submit(form.email, form.password);
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

      {error !== '' && (
        <Text className="text-[#F2A0A0] text-sm mt-4">{error}</Text>
      )}

      <View className="mt-8">
        <CustomButton
          title="Sign In"
          onPress={handleSignIn}
          isLoading={isLoading}
        />
      </View>

      {__DEV__ && (
        <>
          <View className="flex-row items-center gap-4 my-8">
            <View className="flex-1 h-px bg-[#263B55]" />
            <Text className="text-[#7186A1] text-sm">
              or
            </Text>
            <View className="flex-1 h-px bg-[#263B55]" />
          </View>

          <TouchableOpacity
            className="h-14 rounded-2xl items-center justify-center border border-[#344C66] bg-[#142238]"
            onPress={() => submit(DEV_EMAIL, DEV_PASSWORD)}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <Text
              className="font-semibold text-base"
              style={{ color: '#F1F5FB' }}
            >
              Join as user1
            </Text>
          </TouchableOpacity>
        </>
      )}

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