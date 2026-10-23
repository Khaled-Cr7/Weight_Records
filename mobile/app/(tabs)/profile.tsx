import { View, Text, ScrollView } from 'react-native'
import React from 'react'
import { icons } from '@/constants/icons'
import { Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import AppIcon from "@/components/AppIcon"
    

const profile = () => {
  return (
    <SafeAreaView className ="flex-1 bg-primary">
              <ScrollView className="px-5 flex-1" 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                minHeight: '100%',
                paddingBottom: 10,
              }}
              >
                <AppIcon page= "profile"/>
              </ScrollView>
    </SafeAreaView>
  )
}

export default profile