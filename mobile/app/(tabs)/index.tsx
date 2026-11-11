
import React from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { images } from '@/constants/images';
import { session } from '@/constants/session';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const programs = [
  {
    title: 'Bro Split',
    days: '5 days / week',
    image: images.bench,
    route: 'broSplit',
  },
  {
    title: 'PPL Split',
    days: '6 days / week',
    image: images.dumbell,
    route: 'pplSplit',
  },
  {
    title: 'Upper Lower',
    days: '4 days / week',
    image: images.plates,
    route: 'ulSplit',
  },
  {
    title: 'Full Body',
    days: '3 days / week',
    image: images.incline,
    route: 'fullSplit',
  },
];

function StatCard({
  value,
  label,
  icon,
}: {
  value: string;
  label: string;
  icon: IconName;
}) {
  return (
    <View className="flex-1 rounded-2xl bg-[#142238] border border-[#263B55] p-3">
      <Ionicons name={icon} size={19} color="#8CB5EC" />
      <Text className="text-[#F1F5FB] text-2xl font-bold mt-3">
        {value}
      </Text>
      <Text className="text-[#91A5C0] text-xs mt-1">
        {label}
      </Text>
    </View>
  );
}

export default function Home() {
  const router = useRouter();

  const openSchedule = (route: string) => {
    router.push({
      pathname: '/schedule',
      params: { route },
    });
  };

  const signOut = () => {
    session.isGuest = false;
    router.replace('/(auth)/Sign_In');
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0B1422]">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pt-4 pb-32"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row justify-between items-center mb-8">
          <View className="flex-row items-center gap-3">
            <Image
              source={require('../../assets/images/repsy-symbol-transparent.png')}
              className="w-11 h-11"
              resizeMode="contain"
            />
            <Text className="text-[#F1F5FB] text-2xl font-bold">
              Repsy
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => router.push('/(tabs)/profile')}
            className="w-11 h-11 rounded-full bg-[#142238] border border-[#263B55] items-center justify-center"
          >
            <Ionicons
              name="person-outline"
              size={22}
              color="#8CB5EC"
            />
          </TouchableOpacity>
        </View>

        {/* Greeting */}
        <Text className="text-[#91A5C0] text-sm">
          YOUR DASHBOARD
        </Text>
        <Text className="text-[#F1F5FB] text-[29px] font-bold mt-2">
          Ready to get stronger?
        </Text>
        <Text className="text-[#91A5C0] text-sm mt-2 mb-7">
          Every rep brings you closer to your goals.
        </Text>

        {/* Featured workout */}
        <View className="rounded-3xl bg-[#192C46] border border-[#344C66] p-5">
          <View className="flex-row justify-between items-center">
            <Text className="text-[#8CB5EC] text-xs font-bold tracking-widest">
              TODAY'S FOCUS
            </Text>
            <Ionicons
              name="barbell-outline"
              size={28}
              color="#8CB5EC"
            />
          </View>

          <Text className="text-[#F1F5FB] text-3xl font-bold mt-5">
            Push Day
          </Text>
          <Text className="text-[#91A5C0] text-sm mt-2">
            Chest · Shoulders · Triceps
          </Text>

          <View className="flex-row items-center gap-4 mt-5 mb-6">
            <View className="flex-row items-center gap-1">
              <Ionicons
                name="time-outline"
                size={16}
                color="#91A5C0"
              />
              <Text className="text-[#91A5C0] text-xs">
                60 min
              </Text>
            </View>

            <View className="flex-row items-center gap-1">
              <Ionicons
                name="fitness-outline"
                size={16}
                color="#91A5C0"
              />
              <Text className="text-[#91A5C0] text-xs">
                6 exercises
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => router.push('/(tabs)/training')}
            className="bg-[#719AD1] h-12 rounded-xl flex-row items-center justify-center gap-2"
          >
            <Ionicons
              name="play"
              size={17}
              color="#0B1422"
            />
            <Text className="text-[#0B1422] font-bold">
              Explore Training
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View className="flex-row justify-between items-center mt-8 mb-4">
          <Text className="text-[#F1F5FB] text-xl font-bold">
            Your Activity
          </Text>
          <Text className="text-[#7186A1] text-xs">
            Sample data
          </Text>
        </View>

        <View className="flex-row gap-3">
          <StatCard
            value="12"
            label="Workouts"
            icon="barbell-outline"
          />
          <StatCard
            value="7"
            label="Day streak"
            icon="flame-outline"
          />
          <StatCard
            value="4/5"
            label="Weekly goal"
            icon="trophy-outline"
          />
        </View>

        {/* Weekly activity */}
        <View className="bg-[#142238] border border-[#263B55] rounded-3xl p-5 mt-4">
          <View className="flex-row justify-between items-center mb-5">
            <Text className="text-[#F1F5FB] font-bold text-base">
              Weekly Activity
            </Text>
            <Text className="text-[#8CB5EC] text-xs">
              4 workouts
            </Text>
          </View>

          <View className="flex-row justify-between">
            {[
              ['M', true],
              ['T', true],
              ['W', false],
              ['T', true],
              ['F', true],
              ['S', false],
              ['S', false],
            ].map(([day, active], index) => (
              <View key={index} className="items-center gap-2">
                <View
                  className={`w-9 h-9 rounded-full items-center justify-center ${
                    active
                      ? 'bg-[#719AD1]'
                      : 'bg-[#263B55]'
                  }`}
                >
                  <Ionicons
                    name={active ? 'checkmark' : 'remove'}
                    size={17}
                    color={active ? '#0B1422' : '#7186A1'}
                  />
                </View>
                <Text className="text-[#91A5C0] text-xs">
                  {day}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Nutrition preview */}
        <View className="flex-row justify-between items-center mt-8 mb-4">
          <Text className="text-[#F1F5FB] text-xl font-bold">
            Nutrition
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/nutrition')}
          >
            <Text className="text-[#8CB5EC] text-sm font-semibold">
              View details
            </Text>
          </TouchableOpacity>
        </View>

        <View className="bg-[#142238] border border-[#263B55] rounded-3xl p-5">
          <Text className="text-[#91A5C0] text-sm">
            Daily calorie intake
          </Text>
          <Text className="text-[#F1F5FB] text-2xl font-bold mt-2">
            1,650
            <Text className="text-[#91A5C0] text-sm">
              {' '} / 2,400 kcal
            </Text>
          </Text>

          <View className="h-2 bg-[#263B55] rounded-full mt-4 overflow-hidden">
            <View className="h-full w-[69%] bg-[#719AD1] rounded-full" />
          </View>

          <Text className="text-[#8CB5EC] text-xs mt-3">
            750 kcal remaining
          </Text>
        </View>

        {/* Existing training schedules */}
        <View className="flex-row justify-between items-center mt-8 mb-4">
          <Text className="text-[#F1F5FB] text-xl font-bold">
            Training Programs
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/training')}
          >
            <Text className="text-[#8CB5EC] text-sm font-semibold">
              See all
            </Text>
          </TouchableOpacity>
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
                {program.title}
              </Text>

              <Text className="text-[#91A5C0] text-xs mt-1">
                {program.days}
              </Text>

              <View className="flex-row justify-between items-center mt-4">
                <Text className="text-[#8CB5EC] text-xs font-semibold">
                  View schedule
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

        {/* Guest sign out */}
        <TouchableOpacity
          onPress={signOut}
          className="flex-row items-center justify-center gap-2 mt-5 py-4"
        >
          <Ionicons
            name="log-out-outline"
            size={18}
            color="#91A5C0"
          />
          <Text className="text-[#91A5C0] font-semibold">
            Sign Out
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
