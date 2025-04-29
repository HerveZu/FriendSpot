import { useCallback } from 'react';

import { useApiRequest } from '~/endpoints/use-api-request';

type SuggestedSpotsResponse = {
  readonly suggestions: SpotSuggestion[];
};

export type SpotSuggestion = {
  readonly parkingLotId: string;
  readonly from: string;
  readonly to: string;
  readonly duration: string;
  readonly owner: {
    readonly displayName: string;
    readonly pictureUrl: string | undefined;
    readonly rating: number;
  };
};

export function useGetSuggestedSpots() {
  const { apiRequest } = useApiRequest();

  return useCallback(
    (from: Date, to: Date) =>
      apiRequest<SuggestedSpotsResponse>(
        `/spots/suggested?from=${from.toISOString()}&to=${to.toISOString()}`,
        'GET'
      ),
    [apiRequest]
  );
}
