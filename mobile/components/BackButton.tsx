import { useRouter } from 'expo-router';
import React from 'react';

import { ThemedIcon } from '~/components/ThemedIcon';
import { Button, ButtonProps } from '~/components/nativewindui/Button';

export function BackButton(props: ButtonProps) {
  const router = useRouter();

  return (
    <Button onPress={() => router.back()} variant="plain" {...props}>
      <ThemedIcon name="arrow-left" size={24} />
    </Button>
  );
}
