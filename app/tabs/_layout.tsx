import { View, Text, ImageBackground } from 'react-native'
import React from 'react'
import { Tabs } from 'expo-router'
import {images} from '@/constants/images'
import {icons} from '@/constants/icons'
import { Image } from 'react-native'

const TabIcon = ({ focused, icon, title }: any) => {
  if (focused) {
    return (
      <ImageBackground source={images.highlight} className="flex flex-row w-full flex-1 min-w-[60px] min-h-16 mt-4 justify-center items-center  overflow-hidden">
                      <Image source={icon} className="size-6 position-relative"/>
                      <Text className="text-primary text-base font-semibold ml-2">{title}</Text>
                    
                    </ImageBackground>

    )
  } else { 
      if (icon === icons.homeV2) {
        icon = icons.home
      }
      if (icon === icons.trainingV2) {
        icon = icons.training
      }
    return (
      <Image source={icon} className="size-6 mt-3"/>
    )
  }

}


const _layout = () => {
  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        tabBarItemStyle: {
          width: '100%',
          height: '100%',
          justifyContent: 'center',
          alignItems: 'center',
        },
          tabBarStyle: {
            backgroundColor: '#dfe7ea',
            borderRadius: 50,
            position: 'absolute',
            marginHorizontal: 40,
            marginBottom: 36,
            height: 52,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: '#344c66',
          },
      }}

      
    >


      <Tabs.Screen name="index" 
        options={{ 
          title: 'Home', 
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon  focused={focused} icon={icons.homeV2} title=""/>
          ),
        }} 
      />

      <Tabs.Screen name="training" 
        options={{ 
          title: 'Training', 
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={icons.trainingV2} title=""/>
          ),
        }} 
      />

      <Tabs.Screen name="message" 
        options={{ 
          title: 'Training', 
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={icons.message} title=""/>
          ),
        }} 
      />

      <Tabs.Screen name="friends" 
        options={{ 
          title: 'Training', 
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={icons.friends} title=""/>
          ),
        }} 
      />

      <Tabs.Screen name="profile" 
        options={{ 
          title: 'Training', 
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={icons.profile} title=""/>
          ),
        }} 
      />



    </Tabs>
  )
}

export default _layout