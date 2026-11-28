import { Alert } from 'react-native';
import type { useRouter } from 'expo-router';
import { ApiError } from '@/lib/api';
import { WorkoutService } from '@/services/workoutService';

type AppRouter = ReturnType<typeof useRouter>;

// Starts a workout (empty, or from one of the user's routines) and opens it.
// If one is already in progress, offers to resume it instead.
export async function startWorkout(router: AppRouter, routineId?: string): Promise<void> {
  try {
    const workout = await WorkoutService.start(routineId);
    router.push({ pathname: '/workout/[id]', params: { id: workout.id } } as any);
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) {
      try {
        const active = await WorkoutService.active();
        if (active) {
          Alert.alert('Workout in progress', `You are already training: "${active.name}". Finish or discard it before starting another.`, [
            { text: 'Not now', style: 'cancel' },
            {
              text: 'Resume',
              onPress: () => router.push({ pathname: '/workout/[id]', params: { id: active.id } } as any),
            },
          ]);
          return;
        }
      } catch {
        // fall through to the generic message
      }
    }
    Alert.alert("Couldn't start the workout", error instanceof Error ? error.message : 'Something went wrong');
  }
}