
import React from 'react';
import { View, Text } from 'react-native';
import { Tabs, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { session } from '@/constants/session';

type TabIconName = React.ComponentProps<
  typeof Ionicons
>['name'];

type TabIconProps = {
  focused: boolean;
  name: TabIconName;
  label: string;
};

const TabIcon = ({ focused, name, label }: TabIconProps) => {
  return (
    <View className="items-center justify-center gap-1 w-[65px]">
      <Ionicons
        name={name}
        size={22}
        color={focused ? '#8CB5EC' : '#7186A1'}
      />

      <Text
        className="text-[10px] font-semibold"
        style={{
          color: focused ? '#8CB5EC' : '#7186A1',
        }}
      >
        {label}
      </Text>
    </View>
  );
};

export default function TabLayout() {
  if (!session.isGuest) {
    return <Redirect href="/(auth)/Sign_In" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          position: 'absolute',
          bottom: 20,
          left: 16,
          right: 16,
          height: 72,
          borderRadius: 24,
          backgroundColor: '#142238',
          borderTopWidth: 1,
          borderWidth: 1,
          borderColor: '#263B55',
          paddingTop: 12,
          paddingBottom: 8,
          elevation: 8,
          shadowColor: '#000',
          shadowOpacity: 0.3,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 5 },
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              name={focused ? 'home' : 'home-outline'}
              label="Home"
            />
          ),
        }}
      />

      <Tabs.Screen
        name="training"
        options={{
          title: 'Training',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              name={focused ? 'barbell' : 'barbell-outline'}
              label="Training"
            />
          ),
        }}
      />

      <Tabs.Screen
        name="nutrition"
        options={{
          title: 'Nutrition',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              name={focused ? 'nutrition' : 'nutrition-outline'}
              label="Nutrition"
            />
          ),
        }}
      />

      <Tabs.Screen
        name="social"
        options={{
          title: 'Social',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              name={focused ? 'people' : 'people-outline'}
              label="Social"
            />
          ),
        }}
      />

      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              name={focused ? 'stats-chart' : 'stats-chart-outline'}
              label="Progress"
            />
          ),
        }}
      />

      {/* Keep existing screens accessible, but hide their tabs */}
      <Tabs.Screen name="message" options={{ href: null }} />
      <Tabs.Screen name="friends" options={{ href: null }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
    </Tabs>
  );
}
