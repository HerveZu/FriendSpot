import React from 'react';
import '../../global.css';
import '../../i18n/i18n';

import 'expo-dev-client';
import { Stack } from 'expo-router';

import { AuthenticationGuard } from '~/authentication/AuthenticationGuard';
import { AuthProvider } from '~/authentication/AuthProvider';
import { UserProvider } from '~/authentication/UserProvider';
import { EnsureUserHasSpot } from '~/spots/EnsureUserHasSpot';
import { LiveTimerProvider } from '~/notification/LiveTimerProvider';

export default function AuthenticatedLayout() {
  return (
    <AuthenticationGuard>
      <AuthProvider>
        <UserProvider>
          <EnsureUserHasSpot>
            <LiveTimerProvider>
              <Stack
                screenOptions={{
                  headerShown: false,
                  animation: 'ios_from_right',
                }}
              />
            </LiveTimerProvider>
          </EnsureUserHasSpot>
        </UserProvider>
      </AuthProvider>
    </AuthenticationGuard>
  );
}
