import { PropsWithChildren, ReactElement, useState } from 'react';
import { ActivityIndicator, Pressable } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { ThemedIcon } from '~/components/ThemedIcon';
import { FontAwesome6 } from '@expo/vector-icons';
import { useColorScheme } from '~/lib/useColorScheme';

export function CopyToClipboard({
  icon,
  textToCopy,
  children,
}: PropsWithChildren<{ textToCopy: string; icon: ReactElement }>) {
  const [state, setState] = useState<'ready' | 'copying' | 'copied'>('ready');
  const { colors } = useColorScheme();

  function copyToClipboard() {
    setState('copying');
    Clipboard.setStringAsync(textToCopy)
      .then(() => setState('copied'))
      .finally(() => setInterval(() => setState('ready'), 3_000));
  }

  return (
    <Pressable
      disabled={state !== 'ready'}
      onPress={copyToClipboard}
      className={'flex-row items-center gap-2'}>
      {state === 'copying' && <ActivityIndicator />}
      {state === 'copied' && (
        <ThemedIcon name={'check'} component={FontAwesome6} color={colors.primary} />
      )}
      {state === 'ready' && icon}
      {children}
    </Pressable>
  );
}
