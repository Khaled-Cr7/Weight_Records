import { icons } from '@/constants/icons';
import React from 'react';
import { Image, ScrollView, Text, View, TouchableOpacity } from "react-native";

const Headings = ({ title }: any) => {
  return (
    <Text className="text-2xl font-bold text-secondary mt-4">{title}</Text>
  )
}

// Updated Card Component for the Grid
const TrainingCard = ({ title }: { title: string }) => {
  return (
    <TouchableOpacity 
      className="bg-white border border-gray-100 rounded-2xl p-6 mb-4 items-center justify-center shadow-sm"
      style={{ width: '100%', height: 120}} // Takes up roughly half the row
    >
      <Text className="text-secondary font-bold text-center text-lg">{title}</Text>
    </TouchableOpacity>
  )
}

const Box = ({ title1, title2, title3 }: any) => {
  return (
    <View className="mt-4 mb-4 border border-white rounded-lg p-4 bg-white shadow-sm">
      <Text className="text-secondary mb-2">{title1}</Text>
      <Text className="text-secondary mb-2">{title2}</Text>
      <Text className="text-secondary mb-2">{title3}</Text>
    </View>
  )
}

export default function Index() {
  const split1 = ["Bro Split"];
  const split2 = ["PPL Split"];
  const split3 = ["Upper Lower Split"];
  const split4 = ["Full Body Split"];

  return (
    <View className="flex-1 bg-primary">
      <ScrollView 
        className="px-5 flex-1" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 100, // Extra padding so content isn't hidden by the floating tab bar
        }}
      >
        <Image source={icons.appIcon} className="size-40 mt-8 self-center" />
        
        <Headings title="Favorite List" />
        <Box title1="1. Bench Press - 80kg" title2="2. Overhead Press - 40kg" title3="3. Squat - 100kg" />

        <Headings title="Training Schedules" />
        
        {/* Grid Container */}
        <View className="flex-row flex-wrap justify-between mt-4">
          {split1.map((split, index) => (
            <TrainingCard key={index} title={split} />
          ))}
        </View>

        <View className="flex-row flex-wrap justify-between mt-4">
          {split2.map((split, index) => (
            <TrainingCard key={index} title={split} />
          ))}
        </View>
          
        <View className="flex-row flex-wrap justify-between mt-4">
          {split3.map((split, index) => (
            <TrainingCard key={index} title={split} />
          ))}
        </View>

        <View className="flex-row flex-wrap justify-between mt-4">
          {split4.map((split, index) => (
            <TrainingCard key={index} title={split} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}