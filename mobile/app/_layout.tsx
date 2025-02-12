import '../global.css';
import 'expo-dev-client';
import { ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { setDefaultOptions } from 'date-fns';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AuthenticationGuard } from '~/authentication/AuthenticationGuard';
import { getCurrentLocale } from '~/lib/locale';
import { useColorScheme, useInitialAndroidBarSync } from '~/lib/useColorScheme';
import { NAV_THEME } from '~/theme';

export { ErrorBoundary } from 'expo-router';

setDefaultOptions({ locale: getCurrentLocale() });

export default function RootLayout() {
  useInitialAndroidBarSync();
  const { colorScheme, isDarkColorScheme } = useColorScheme();

  return (
    <>
      <StatusBar
        key={`root-status-bar-${isDarkColorScheme ? 'light' : 'dark'}`}
        style={isDarkColorScheme ? 'light' : 'dark'}
      />
      <GestureHandlerRootView style={{ flex: 1 }}>
        <NavThemeProvider value={NAV_THEME[colorScheme]}>
          <AuthenticationGuard>
            <Stack
              initialRouteName="welcome"
              screenOptions={{
                headerShown: false,
                animation: 'ios_from_right',
              }}
            />
          </AuthenticationGuard>
        </NavThemeProvider>
      </GestureHandlerRootView>
    </>
  );
}
