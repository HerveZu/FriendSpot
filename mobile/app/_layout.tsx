import '../global.css';
import 'expo-dev-client';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { setDefaultOptions } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AuthenticationGuard } from '~/authentication/AuthenticationGuard';
import { useColorScheme, useInitialAndroidBarSync } from '~/lib/useColorScheme';
import { NAV_THEME } from '~/theme';

export { ErrorBoundary } from 'expo-router';

setDefaultOptions({ locale: fr });

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
        <BottomSheetModalProvider>
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
        </BottomSheetModalProvider>
      </GestureHandlerRootView>
    </>
  );
}
