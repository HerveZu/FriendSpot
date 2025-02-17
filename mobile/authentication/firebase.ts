import { initializeApp } from '@firebase/app';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { Platform } from 'react-native';

const appIds: { [platform: string]: string | undefined } = {
  ios: process.env.EXPO_PUBLIC_FIREBASE_IOS_APP_ID,
  android: process.env.EXPO_PUBLIC_FIREBASE_ANDROID_APP_ID,
};

const appId = appIds[Platform.OS];

if (!appId) {
  throw new Error(`${Platform.OS} is not supported`);
}

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: 'friendspot-app.firebasestorage.app',
  appId,
};

const app = initializeApp(firebaseConfig);
export const firebaseAuth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
