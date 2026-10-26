import React, { useState } from 'react'
import { Text, View, TouchableOpacity } from 'react-native'
import CustomInput from '@/components/CustomInput'
import CustomButton from '@/components/CustomButton'
import { Link, router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { session } from '@/constants/session'

const Sign_IN = () => {
  const [form, setform] = useState({ email: "", password: "" })

  const joinAsGuest = () => {
    session.isGuest = true
    router.replace('/')
  }

  return (
    <SafeAreaView className="flex-1 gap-10 bg-white rounded-t-[40px] p-7 -mt-10">
      <CustomInput
        placeholder="Enter your email"
        value={form.email}
        onChangeText={(text) => setform((prev) => ({ ...prev, email: text }))}
        label="Email"
        keyboardType="email-address"
      />
      <CustomInput
        placeholder="Enter your Password"
        value={form.password}
        onChangeText={(text) => setform((prev) => ({ ...prev, password: text }))}
        label="Password"
        secureTextEntery={true}
      />

      {/* TODO: real sign in */}
      <CustomButton title="Sign In" onPress={() => {}} />

      <TouchableOpacity
        className="p-4 rounded-3xl items-center border border-secondary"
        onPress={joinAsGuest}
      >
        <Text className="text-secondary font-bold">Join as Guest</Text>
      </TouchableOpacity>

      <View className='flex justify-center mt-5 flex-row gap-2'>
        <Text className="text-gray-300">Don't have an account?</Text>
        <Link href="/Sign_Up" className="font-bold text-secondary">
          Sign Up
        </Link>
      </View>
    </SafeAreaView>
  )
}

export default Sign_IN