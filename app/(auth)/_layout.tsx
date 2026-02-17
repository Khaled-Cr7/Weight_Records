import { View, Text, Image, KeyboardAvoidingView, Platform, ScrollView, Dimensions } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { icons } from '@/constants/icons'
import { Slot, usePathname } from 'expo-router'
import CustomInput from '@/components/CustomInput'
import CustomButton from '@/components/CustomButton'



const _layout = () => {
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
        <View className='w-full relative bg-primary justify-center' style={{height: Dimensions.get('screen').height/2.5}}>
        <Image source={icons.appIcon} className="self-center size-48 absolute"/>
        <Text className='self-center flex-1 text-3xl font-bold color-secondary -bottom-56' numberOfLines={1}>
          {headerMessage}
        </Text>
        <Text className='self-center flex-1 text-l color-secondary -bottom-16'>
          {subMessage}
        </Text>
        </View>


           <Slot />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

export default _layout