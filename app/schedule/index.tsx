import React, { useState } from 'react';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Image, Text, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ExerciseService, getExerciseImage } from '../../services/exerciseService';
import { workoutPlans } from '../../data/workouts';
import { images } from '@/constants/images';
import { TouchableOpacity } from 'react-native';
import { CustomBackButton } from "@/components/CustomBackButton"
import { useLoading } from '@/context/LoadingContext';

export default function WorkoutDetail() {
  const { route } = useLocalSearchParams();
  const router = useRouter(); // ✅ Move this to the top level
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const { setLoading } = useLoading();

  const data = workoutPlans[route as string] || {
    name: "Workout",
    focus: "General Training",
    schedule: []
  };

  return (
    <>
    <Stack.Screen 
        options={{
          headerShown: true,
          headerTitle: "", // Keeps it clean
          headerShadowVisible: false,
          headerStyle: { backgroundColor: '#dfe7ea' }, // Match your app background
          headerLeft: () => <CustomBackButton />,
        }}
      />
    <SafeAreaView className="flex-1 bg-primary p-5">
      <Text className="text-3xl font-bold text-secondary">{data.name}</Text>
      <Text className="text-gray-500 mt-2 mb-6">{data.focus}</Text>
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {data.schedule.map((dayPlan, index) => {
          const isExpanded = expandedDay === index;
          const hasExercises = dayPlan.exercises && dayPlan.exercises.length > 0;
          return (
            <View key={index} className="mb-4">
              {/* --- HEADER --- */}
              <TouchableOpacity 
                onPress={() => hasExercises && setExpandedDay(isExpanded ? null : index)}
                activeOpacity={hasExercises ? 0.7 : 1}
                className="flex-row justify-between items-center bg-white border border-gray-200 p-4 rounded-xl shadow-sm"
              >
                <Text className={`text-xl font-bold ${hasExercises ? 'text-secondary' : 'text-gray-400'}`}>
                  {dayPlan.day}
                </Text>

                {hasExercises && (
                  <Image 
                    source={images.right} 
                    style={{ 
                      width: 20, 
                      height: 20, 
                      transform: [{ rotate: isExpanded ? '90deg' : '0deg' }],
                      tintColor: '#344c66'
                    }} 
                  />
                )}
              </TouchableOpacity>

              {/* --- EXPANDED CONTENT --- */}
              {isExpanded && hasExercises && (
                <View className="mt-3 px-1">
                  {dayPlan.exercises.map((exercise, i) => {
                    const exerciseDetails = ExerciseService.smartSearch(exercise.name);
                    const isCustom = exerciseDetails ? ExerciseService.isCustomExercise(exerciseDetails.id) : false;
                    
                    return (
                      <View 
                        key={i} 
                        className="bg-white p-4 rounded-xl mb-3 border border-gray-100"
                      >
                        <TouchableOpacity 
                          className="flex-row items-center mb-3"
                          onPress={async () => {
                            if (exerciseDetails) {
                             
                              setLoading(true);

                               try{

                                router.push({
                                  pathname: '/schedule/[detail]',
                                  params: { 
                                    exerciseId: exerciseDetails.id,
                                    sets: exercise.sets.toString(),
                                    reps: exercise.reps
                                  } as any
                                });
                                
                               } finally {

                                setTimeout(() => setLoading(false), 250);

                               }
                              
                            } 
                            

                          }}
                          activeOpacity={0.7}
                        >
                          {/* Image Section */}
                          {exerciseDetails?.images?.[0] ? (
                            <Image 
                              source={{ uri: getExerciseImage(exerciseDetails.images[0], isCustom) }}
                              className="w-16 h-16 rounded-lg mr-4"
                              resizeMode="cover"
                            />
                          ) : (
                            <View className="w-16 h-16 bg-gray-100 rounded-lg mr-4 justify-center items-center">
                              <Text className="text-[8px] text-gray-400 text-center">No Image</Text>
                            </View>
                          )}

                          {/* Details Section */}
                          <View className="flex-1">
                            <Text className="text-lg font-semibold text-secondary" numberOfLines={2}>
                              {exerciseDetails ? exerciseDetails.name : exercise.name}
                            </Text>
                            <Text className="text-gray-400 text-sm mt-1">
                              {exerciseDetails?.level || 'N/A'} • {exerciseDetails?.equipment || 'Bodyweight'}
                            </Text>
                          </View>

                        </TouchableOpacity>

                        {/* Divider Line */}
                        <View className="h-[1px] bg-gray-200 mb-3" />

                        {/* Sets and Reps */}
                        <View className="flex-row justify-around items-center bg-gray-50 p-3 rounded-lg">
                          <View className="items-center">
                            <Text className="text-gray-500 text-xs font-medium mb-1">SETS</Text>
                            <Text className="text-secondary text-2xl font-bold">{exercise.sets}</Text>
                          </View>
                          
                          <View className="w-[1px] h-12 bg-gray-300" />
                          
                          <View className="items-center">
                            <Text className="text-gray-500 text-xs font-medium mb-1">REPS</Text>
                            <Text className="text-secondary text-2xl font-bold">{exercise.reps}</Text>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
    </>
  );
}