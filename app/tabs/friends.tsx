import { View, Text, ScrollView } from 'react-native'
import React from 'react'
import { icons } from '@/constants/icons'
import { Image } from 'react-native'

const friends = () => {
  return (
    <View className ="flex-1 bg-primary">
              <ScrollView className="px-5 flex-1" 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                minHeight: '100%',
                paddingBottom: 10,
              }}
              >
                <Image source={icons.appIcon} className="size-40 mt-8 self-center"/>
              </ScrollView>
    </View>
  )
}

export default friends