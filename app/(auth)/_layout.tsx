import { View, Text, Image } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { icons } from '@/constants/icons'
import { Slot } from 'expo-router'
const _layout = () => {
  return (
    <SafeAreaView className='bg-primary flex-1'>
        <Image source= {icons.appIcon} className='size-40 self-center'/>

        <View className="flex-1 px-5">
           <Slot />
        </View>
    </SafeAreaView>
  )
}

export default _layout