import { useCallback } from 'react';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';

export function useRedirectToInitialUrl() {
  const router = useRouter();

  return useCallback((fallback: string) => {
    Linking.getInitialURL().then((initialLinkingUrl) => {
      console.log('Redirecting to app initial URL after authentication ', {
        initialLinkingUrl,
        fallback,
      });
      router.navigate(initialLinkingUrl ?? (fallback as any));
    });
  }, []);
}
