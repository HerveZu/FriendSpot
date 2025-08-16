import React from 'react';
import '../../global.css';
import '../../i18n/i18n';

import 'expo-dev-client';
import { Stack } from 'expo-router';
import { AuthProvider } from '~/authentication/AuthProvider';
import { UserProvider } from '~/authentication/UserProvider';
import { EnsureUserHasSpot } from '~/spots/EnsureUserHasSpot';
import { RefreshTriggerProvider } from '~/authentication/RefreshTriggerProvider';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

export default function AuthenticatedLayout() {
  return (
    <AuthProvider>
      <RefreshTriggerProvider refreshIntervalMs={30_000}>
        <UserProvider>
          {/*BottomSheetModalProvider children need to have access to the currentUser*/}
          <BottomSheetModalProvider>
            <EnsureUserHasSpot>
              <Stack
                screenOptions={{
                  headerShown: false,
                }}
              />
            </EnsureUserHasSpot>
          </BottomSheetModalProvider>
        </UserProvider>
      </RefreshTriggerProvider>
    </AuthProvider>
  );
}
