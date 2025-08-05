import React from 'react';
import '../global.css';
import '../i18n/i18n';

import 'expo-dev-client';
import { ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { configureReanimatedLogger } from 'react-native-reanimated';
import { useColorScheme, useInitialAndroidBarSync } from '~/lib/useColorScheme';
import { NotificationProvider } from '~/notification/NotificationContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NAV_THEME } from '~/theme';

export { ErrorBoundary } from 'expo-router';

configureReanimatedLogger({
  strict: false,
});

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useInitialAndroidBarSync();
  const { colorScheme, isDarkColorScheme } = useColorScheme();

  return (
    <SafeAreaProvider>
      <StatusBar
        key={`root-status-bar-${isDarkColorScheme ? 'light' : 'dark'}`}
        style={isDarkColorScheme ? 'light' : 'dark'}
      />
      <NotificationProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <NavThemeProvider value={NAV_THEME[colorScheme]}>
            <Stack
              initialRouteName="welcome"
              screenOptions={{
                headerShown: false,
                animation: 'ios_from_right',
              }}
            />
          </NavThemeProvider>
        </GestureHandlerRootView>
      </NotificationProvider>
    </SafeAreaProvider>
  );
}
