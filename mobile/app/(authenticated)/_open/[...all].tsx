import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator } from 'react-native';

export default function All() {
  const router = useRouter();
  const { all, ...params } = useLocalSearchParams();

  useEffect(() => {
    const allSegments = Array.isArray(all) ? all : [all];

    if (allSegments.length === 0) {
      router.replace('/');
      return;
    }

    const path = '/' + allSegments.join('/');
    const queryString = new URLSearchParams(params as Record<string, string>).toString();
    let redirectUrl = path;
    if (queryString) {
      redirectUrl += `?${queryString}`;
    }

    console.log('Opening dynamic open url', { redirectUrl });
    router.replace(redirectUrl as any);
  }, [all, params, router]);

  return <ActivityIndicator />;
}
