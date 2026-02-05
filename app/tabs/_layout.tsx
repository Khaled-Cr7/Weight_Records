import { View, Text, ImageBackground, Animated, Image } from 'react-native';
import React, { useRef, useEffect } from 'react';
import { Tabs } from 'expo-router';
import { images } from '@/constants/images';
import { icons } from '@/constants/icons';

// Enhanced TabIcon with Animation
const TabIcon = ({ focused, icon, title, inactiveIcon }: any) => {
  const scaleValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scaleValue, {
      toValue: focused ? 1.1 : 1,
      useNativeDriver: true,
      friction: 4,
    }).start();
  }, [focused]);

  const displayIcon = focused ? icon : (inactiveIcon || icon);

  return (
    <Animated.View 
      style={{ transform: [{ scale: scaleValue }] }}
      className="items-center justify-center"
    >
      {focused ? (
        <ImageBackground 
          // source={images.highlight} 
          className="flex flex-row min-w-[65px] h-16 justify-center items-center rounded-full overflow-hidden px-3 mt-8"
          resizeMode="cover"
        >
          <Image source={displayIcon} className="size-5" style={{ tintColor: '#344c66' }} />
          {title && <Text className="text-secondary text-xs font-bold ml-2" numberOfLines={1}>{title}</Text>}
        </ImageBackground>
      ) : (
        <View className="p-2">
          <Image source={displayIcon} className="size-6 mt-8" style={{ opacity: 0.6 }} />
        </View>
      )}
    </Animated.View>
  );
};

const _layout = () => {
  return (
    
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#ffffff', // Clean white background
          borderRadius: 30,
          position: 'absolute',
          bottom: 30,
          left: 20,
          right: 20,
          height: 70,
          elevation: 5, // Shadow for Android
          shadowColor: '#000', // Shadow for iOS
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
          borderTopWidth: 0, // Remove default border
          paddingBottom: 0,
          
        },
      }}
    >
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: 'Home', 
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={icons.homeV2} inactiveIcon={icons.home} title="Home"/>
          ),
        }} 
      />
      <Tabs.Screen 
        name="training" 
        options={{ 
          title: 'Training', 
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={icons.thunderV2} inactiveIcon={icons.thunder} title="Training"/>
          ),
        }} 
      />
      <Tabs.Screen 
        name="message" 
        options={{ 
          title: 'Messages', 
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={icons.messageV2} inactiveIcon={icons.message} title="Chat"/>
          ),
        }} 
      />
      <Tabs.Screen 
        name="friends" 
        options={{ 
          title: 'Friends', 
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={icons.friendsV2} inactiveIcon={icons.friends} title="Friends"/>
          ),
        }} 
      />
      <Tabs.Screen 
        name="profile" 
        options={{ 
          title: 'Profile', 
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={icons.profileV2} inactiveIcon={icons.profile} title="Profile"/>
          ),
        }} 
      />
    </Tabs>

    
  );
};

export default _layout;