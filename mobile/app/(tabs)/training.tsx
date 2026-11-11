
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { images } from '@/constants/images';

const programs = [
  {
    name: 'Bro Split',
    days: '5 days / week',
    description: 'Focus on individual muscle groups.',
    image: images.bench,
    route: 'broSplit',
  },
  {
    name: 'PPL Split',
    days: '6 days / week',
    description: 'Push, pull, and legs.',
    image: images.dumbell,
    route: 'pplSplit',
  },
  {
    name: 'Upper Lower',
    days: '4 days / week',
    description: 'Balanced upper and lower body.',
    image: images.plates,
    route: 'ulSplit',
  },
  {
    name: 'Full Body',
    days: '3 days / week',
    description: 'Train your whole body.',
    image: images.incline,
    route: 'fullSplit',
  },
];

export default function Training() {
  const router = useRouter();

  const openSchedule = (route: string) => {
    router.push({
      pathname: '/schedule',
      params: { route },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0B1422]">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pt-5 pb-32"
        showsVerticalScrollIndicator={false}
      >
        {/* Heading */}
        <Text className="text-[#F1F5FB] text-3xl font-bold">
          Training
        </Text>

        <Text className="text-[#91A5C0] text-sm mt-2 mb-7">
          Build strength. Stay consistent.
        </Text>

        {/* Quick start */}
        <View className="bg-[#192C46] border border-[#344C66] rounded-3xl p-5">
          <View className="flex-row justify-between items-center">
            <Text className="text-[#8CB5EC] text-xs font-bold tracking-widest">
              QUICK START
            </Text>

            <Ionicons
              name="flash-outline"
              size={26}
              color="#8CB5EC"
            />
          </View>

          <Text className="text-[#F1F5FB] text-2xl font-bold mt-5">
            Ready for a workout?
          </Text>

          <Text className="text-[#91A5C0] text-sm mt-2 leading-5">
            Choose a training program and explore your next workout.
          </Text>

          <TouchableOpacity
            onPress={() => openSchedule('pplSplit')}
            className="bg-[#719AD1] h-12 rounded-xl flex-row items-center justify-center gap-2 mt-6"
          >
            <Ionicons
              name="play"
              size={17}
              color="#0B1422"
            />
            <Text className="text-[#0B1422] font-bold">
              Explore PPL Program
            </Text>
          </TouchableOpacity>
        </View>

        {/* Sample routines */}
        <View className="flex-row justify-between items-center mt-9 mb-4">
          <Text className="text-[#F1F5FB] text-xl font-bold">
            My Routines
          </Text>

          <Text className="text-[#7186A1] text-xs">
            Sample routines
          </Text>
        </View>

        <View className="bg-[#142238] border border-[#263B55] rounded-2xl p-4 mb-3 flex-row items-center">
          <View className="w-14 h-14 bg-[#263B55] rounded-xl items-center justify-center">
            <Ionicons
              name="barbell-outline"
              size={26}
              color="#8CB5EC"
            />
          </View>

          <View className="flex-1 ml-4">
            <Text className="text-[#F1F5FB] font-bold text-base">
              Upper Body Strength
            </Text>
            <Text className="text-[#91A5C0] text-xs mt-1">
              6 exercises · 60 min
            </Text>
            <Text className="text-[#8CB5EC] text-xs mt-2">
              Preview only
            </Text>
          </View>

          <Ionicons
            name="fitness-outline"
            size={20}
            color="#7186A1"
          />
        </View>

        <View className="bg-[#142238] border border-[#263B55] rounded-2xl p-4 flex-row items-center">
          <View className="w-14 h-14 bg-[#263B55] rounded-xl items-center justify-center">
            <Ionicons
              name="body-outline"
              size={26}
              color="#8CB5EC"
            />
          </View>

          <View className="flex-1 ml-4">
            <Text className="text-[#F1F5FB] font-bold text-base">
              Leg Day
            </Text>
            <Text className="text-[#91A5C0] text-xs mt-1">
              5 exercises · 50 min
            </Text>
            <Text className="text-[#8CB5EC] text-xs mt-2">
              Preview only
            </Text>
          </View>

          <Ionicons
            name="fitness-outline"
            size={20}
            color="#7186A1"
          />
        </View>

        {/* Programs */}
        <View className="mt-9 mb-4">
          <Text className="text-[#F1F5FB] text-xl font-bold">
            Explore Programs
          </Text>

          <Text className="text-[#91A5C0] text-sm mt-2">
            Find a training split that suits your goals.
          </Text>
        </View>

        <View className="flex-row flex-wrap justify-between">
          {programs.map((program) => (
            <TouchableOpacity
              key={program.route}
              onPress={() => openSchedule(program.route)}
              activeOpacity={0.8}
              className="w-[48%] bg-[#142238] border border-[#263B55] rounded-2xl p-4 mb-4"
            >
              <Image
                source={program.image}
                className="w-full h-24"
                resizeMode="contain"
              />

              <Text className="text-[#F1F5FB] text-base font-bold mt-3">
                {program.name}
              </Text>

              <Text className="text-[#8CB5EC] text-xs mt-1">
                {program.days}
              </Text>

              <Text className="text-[#91A5C0] text-xs mt-3 leading-4">
                {program.description}
              </Text>

              <View className="flex-row justify-between items-center mt-5">
                <Text className="text-[#DCE6F4] text-xs font-semibold">
                  View program
                </Text>
                <Ionicons
                  name="arrow-forward"
                  size={16}
                  color="#8CB5EC"
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Future workout feature */}
        <View className="bg-[#142238] border border-dashed border-[#344C66] rounded-2xl p-5 mt-3 items-center">
          <Ionicons
            name="add-circle-outline"
            size={30}
            color="#8CB5EC"
          />

          <Text className="text-[#F1F5FB] font-bold text-base mt-3">
            Create Your Own Routine
          </Text>

          <Text className="text-[#91A5C0] text-sm text-center mt-2">
            Custom routines and workout logging will be available in a future update.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
