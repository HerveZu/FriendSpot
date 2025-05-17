import { useRouter } from 'expo-router';
import React from 'react';

import { ThemedIcon } from '~/components/ThemedIcon';
import { Button, ButtonProps } from '~/components/nativewindui/Button';
import { FontAwesome6 } from '@expo/vector-icons';

export function BackButton(props: ButtonProps) {
  const router = useRouter();

  return (
    <Button onPress={() => router.back()} variant="plain" {...props}>
      <ThemedIcon component={FontAwesome6} name="chevron-left" size={18} />
    </Button>
  );
}
