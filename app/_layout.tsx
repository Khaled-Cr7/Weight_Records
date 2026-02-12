import { Stack } from "expo-router";
import "./globals.css";
import { useEffect, useState }  from "react";
import * as SplashScreen from 'expo-splash-screen';
import LoadingScreen from "./loading"
import React from "react";
import { LoadingProvider } from '@/context/LoadingContext';
import { ExerciseService } from '@/services/exerciseService';


SplashScreen.preventAutoHideAsync();
export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // This now works because we added it to the Service
        await ExerciseService.initialize();
      } catch (e) {
        console.warn(e);
      } finally {
        setIsReady(true);
        await SplashScreen.hideAsync();
      }
    }
    prepare();
  }, []);

  // Show the loader while the app is doing its initial setup
  if (!isReady) return <LoadingScreen />;

  return (
    <LoadingProvider>
    <Stack screenOptions={{ headerShown: false }}>
      {/* Note the parentheses here to match your folder name (tabs) */}
    <Stack.Screen name="(tabs)" />
    <Stack.Screen name="(auth)" />
    <Stack.Screen name="schedule/index"/>
    <Stack.Screen name="schedule/[detail]"/>

      {/* <Stack.Screen
        name="schedule/[route]" // Matches the filename
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: '#344c66' },
          headerTintColor: '#dfe7ea',
          title: "Workout Details",
        }}
      /> */}
    </Stack>
    </LoadingProvider>
  );
}
