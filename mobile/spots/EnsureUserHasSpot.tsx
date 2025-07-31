import { useCurrentUser } from '~/authentication/UserProvider';
import React, { PropsWithChildren, useEffect, useState } from 'react';

import { useRouter } from 'expo-router';

export function EnsureUserHasSpot({ children }: PropsWithChildren) {
  const router = useRouter();
  const user = useCurrentUser();
  const userHasParking = user.userProfile?.spot?.parking;

  if (!userHasParking) {
    router.push({
      pathname: '/join-parking',
    });
  }
  return;
}
