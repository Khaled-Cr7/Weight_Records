import * as SecureStore from 'expo-secure-store';

// The login token lives in the phone's encrypted storage (Keystore on Android)
const KEY = 'repsy_token';

export async function loadToken(): Promise<string | null> {
  try {
    const token = await SecureStore.getItemAsync(KEY);
    return token;
  } catch (error) {
    return null;
  }
}

export async function saveToken(token: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(KEY, token);
  } catch (error) {
    // if saving fails the user stays signed in until the app closes
    console.warn('[auth] saveToken failed:', error);
  }
}

export async function clearToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(KEY);
  } catch (error) {
    console.warn('[auth] clearToken failed:', error);
  }
}