import React from 'react';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Image, Text, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchExerciseDetails, getExerciseImage } from '../../services/exerciseService';
import { ExerciseService } from '../../services/exerciseService';
import { CustomBackButton } from "@/components/CustomBackButton"

export default function ExerciseDetail() {
  const { detail, exerciseId, sets, reps } = useLocalSearchParams();
  
  // Fetch the exercise details using the ID
  const exercise = fetchExerciseDetails((exerciseId || detail) as string);
  
  if (!exercise) {
    return (
      <SafeAreaView className="flex-1 bg-primary p-5">
        <Text className="text-xl text-secondary">Exercise not found</Text>
      </SafeAreaView>
    );
  }

  const isCustom = ExerciseService.isCustomExercise(exercise.id);

  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: true,
          headerTitle: "",
          headerTitleStyle: { color: '#344c66', fontWeight: 'bold'},
          headerShadowVisible: false,
          headerStyle: { backgroundColor: '#dfe7ea' },
          headerLeft: () => <CustomBackButton />,
        }}
      />
      
      <SafeAreaView className="flex-1 bg-primary">
        {/* Exercise Name */}
        <Text className="text-3xl font-bold text-secondary mb-2 p-5">
            {exercise.name}
        </Text>
        <ScrollView className="p-5">
          {/* Exercise Image */}
          {exercise.images?.[0] && (
            <Image 
              source={{ uri: getExerciseImage(exercise.images[0], isCustom) }}
              className="w-full h-64 rounded-xl mb-5"
              resizeMode="cover"
            />
          )}
        
          {/* Divider Line */}
          <View className="h-[2px] bg-secondary mb-6" />
          {/* Quick Info - Horizontal Scroll Fix */}
          <View className="mb-5">
            <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ 
                flexDirection: 'row', 
                paddingRight: 40,
                alignItems: 'center' 
                }}
            >
                {[
                { label: 'Level', value: exercise.level },
                { label: 'Equipment', value: exercise.equipment || 'None' },
                { label: 'Type', value: exercise.mechanic },
                { label: 'Force', value: exercise.force },
                ].map((item, index) => {
                if (!item.value) return null;

                return (
                    <View 
                    key={index} 
                    className="bg-white px-4 py-2 rounded-lg mr-2 justify-center h-16"
                    style={{ alignSelf: 'flex-start' }} // Allows the box to define its own width
                    >
                    <Text className="text-gray-400 text-[10px] mb-1">{item.label}</Text>
                    
                    {/* We use a View wrapper for the text to ensure it never wraps */}
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text 
                        className="text-secondary font-bold text-base"
                        style={{ flexWrap: 'nowrap' }}
                        >
                        {`${item.value}\u00A0\u00A0`} 
                        </Text>
                    </View>
                    </View>
                );
                })}
            </ScrollView>
                </View>

         
          {/* Sets and Reps from workout (if passed) */}
          {sets && reps && (
            <View className="bg-white p-4 rounded-xl mb-5">
              <Text className="text-gray-500 text-sm mb-2">Your Workout</Text>
              <View className="flex-row justify-around">
                <View className="items-center">
                  <Text className="text-gray-500 text-xs mb-1">SETS</Text>
                  <Text className="text-secondary text-2xl font-bold">{sets}</Text>
                </View>
                <View className="w-[1px] bg-gray-300" />
                <View className="items-center">
                  <Text className="text-gray-500 text-xs mb-1">REPS</Text>
                  <Text className="text-secondary text-2xl font-bold">{reps}</Text>
                </View>
              </View>
            </View>
          )}
          

          {/* Primary Muscles */}
          {exercise.primaryMuscles.length > 0 && (
            <View className="mb-5">
              <Text className="text-xl font-bold text-secondary mb-2">
                Primary Muscles
              </Text>
              <View className="flex-row flex-wrap">
                {exercise.primaryMuscles.map((muscle, i) => (
                  <View key={i} className="bg-secondary px-3 py-2 rounded-full mr-2 mb-2">
                    <Text className="text-white font-semibold capitalize">{muscle}{'\u00A0'}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Secondary Muscles */}
          {exercise.secondaryMuscles.length > 0 && (
            <View className="mb-5">
              <Text className="text-xl font-bold text-secondary mb-2">
                Secondary Muscles
              </Text>
              <View className="flex-row flex-wrap">
                {exercise.secondaryMuscles.map((muscle, i) => (
                  <View key={i} className="bg-gray-200 px-3 py-2 rounded-full mr-2 mb-2">
                    <Text className="text-gray-700 capitalize">{muscle}{'\u00A0'}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}


          {/* Instructions */}
          {exercise.instructions.length > 0 && (
            <View className="mb-5">
              <Text className="text-xl font-bold text-secondary mb-3">
                How to Perform
              </Text>
              {exercise.instructions.map((instruction, i) => (
                <View key={i} className="flex-row mb-3">
                  <View className="w-6 h-6 bg-secondary rounded-full items-center justify-center mr-3 mt-1">
                    <Text className="text-white font-bold text-xs">{i + 1}</Text>
                  </View>
                  <Text className="flex-1 text-gray-700 leading-6">
                    {instruction}
                  </Text>
                </View>
              ))}
            </View>
          )}

        </ScrollView>
      </SafeAreaView>
    </>
  );
}