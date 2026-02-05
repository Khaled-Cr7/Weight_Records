import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import React, { useState } from 'react';
import {Image} from "react-native"
import {icons} from '@/constants/icons'
import CollapsibleSection from "@/components/CollapsibleSection";


export default function Index() {
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
        <Text className="text-2xl font-bold text-secondary">Favorite List</Text>
        <View className="mt-4 mb-4 border border-white rounded-lg p-4 bg-white">
          <Text className="text-secondary mb-2">1. Bench Press - 80kg</Text>
          <Text className="text-secondary mb-2">2. Overhead Press - 40kg</Text>
          <Text className="text-secondary">3. Squat - 100kg</Text>
          <Text className="text-secondary mt-4">Tap on the exercise to view details</Text>
        </View>
    
      </ScrollView>
    </View>
    
  );
}
