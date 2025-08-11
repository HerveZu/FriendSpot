import React from 'react';
import '../../global.css';
import '../../i18n/i18n';

import 'expo-dev-client';
import { Stack } from 'expo-router';

import { AuthenticationGuard } from '~/authentication/AuthenticationGuard';
import { AuthProvider } from '~/authentication/AuthProvider';
import { UserProvider } from '~/authentication/UserProvider';
import { EnsureUserHasSpot } from '~/spots/EnsureUserHasSpot';

export default function AuthenticatedLayout() {
  return (
    <AuthenticationGuard>
      <AuthProvider>
        <UserProvider>
          <EnsureUserHasSpot>
            <Stack
              screenOptions={{
                headerShown: false,
              }}
            />
          </EnsureUserHasSpot>
        </UserProvider>
      </AuthProvider>
    </AuthenticationGuard>
  );
}
