import { View, Text, Image, KeyboardAvoidingView, Platform, ScrollView, Dimensions } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { icons } from '@/constants/icons'
import { Redirect, Slot, usePathname } from 'expo-router'
import CustomInput from '@/components/CustomInput'
import CustomButton from '@/components/CustomButton'



const AuthLayout = () => {

  const pathname = usePathname();

  const headerMessage = pathname.includes('Sign_In') 
    ? "Welcome Back!" 
    : "Create an Account";


  const subMessage = pathname.includes('Sign_In')
    ? "Please sign in to continue"
    : "Join us and start your journey";

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView className= "bg-white h-full" keyboardShouldPersistTaps="handled">
        <SafeAreaView className='w-full relative bg-primary justify-center items-center' style={{height: Dimensions.get('screen').height/2.5}}>
          <Image source={icons.appIcon} className="size-48 mb-4"/>
          <Text className="text-3xl font-bold text-secondary mb-4">
            {headerMessage}
          </Text>

          <Text className="text-base text-secondary mt-2">
            {subMessage}
          </Text>
        </SafeAreaView>
           <Slot />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

export default AuthLayout