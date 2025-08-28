import { useCallback } from 'react';

import { useApiRequest } from '~/endpoints/use-api-request';

export type AppFeatures = {
  readonly isPremium: boolean;
  readonly currentParkingIsLocked: boolean;
  readonly plans: Plans;
  readonly plan?: Plan;
  readonly baseline: SubscriptionSpecs;
  readonly active: SubscriptionSpecs;
};

export type Plans = {
  readonly premium: Plan;
  readonly neighbourhood: Plan;
};

export type Plan = {
  readonly productId: string;
  readonly specs: SubscriptionSpecs;
};

export type SubscriptionSpecs = {
  readonly canSendRequest: boolean;
  readonly maxBookInAdvanceTime: string;
  readonly maxSpotPerNeighbourhoodGroup: number;
  readonly maxSpotPerGroup: number;
  readonly availableNeighbourhoodGroups: number;
  readonly maxNeighbourhoodGroups: number;
};

export function useGetFeatures() {
  const { apiRequest } = useApiRequest();

  return useCallback(() => apiRequest<AppFeatures>('/@me/features', 'GET'), [apiRequest]);
}
