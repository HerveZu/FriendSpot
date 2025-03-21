import { Pressable, View } from 'react-native';
import { ThemedIcon } from './ThemedIcon';
import { useColorScheme } from '~/lib/useColorScheme';

import { Text } from '~/components/nativewindui/Text';
import { cn } from '~/lib/cn';
import { FontAwesome6 } from '@expo/vector-icons';
import { useCallback, useState } from 'react';


export function Tag({ text, className, iconLock=false }: { text: string; className?: string, iconLock?: boolean }) {

  const { colors } = useColorScheme();
  const [displayCustomText, setDisplayCustomText] = useState(false);
  const [customText, setCustomText] = useState('');

  const TIMEOUT_DURATION = 8000;

  const handlePress = useCallback(() => {
    setDisplayCustomText((prev) => !prev);
    if (!displayCustomText) {
      setCustomText('Le numéro du spot sera révélé au début de la réservation.');
      setTimeout(() => {
        setDisplayCustomText(false);
      }, TIMEOUT_DURATION);
    }
  }, [displayCustomText]);

  return (
    <>
      {iconLock ? (
        <Pressable onPress={handlePress} className='bg-primary/20 rounded-xl border flex-row items-center border-primary px-2 text-primary w-auto self-start'>
          {displayCustomText ? (
            <Text variant="callout" className={`text-primary font-semibold`}>
            {customText}
          </Text>
          ) : (
            <Text variant="heading" className={`text-primary`}>
              {text}
            </Text>
          )}
          {!displayCustomText && (
            <ThemedIcon
              component={FontAwesome6}
              name="lock"
              size={16}
              color={colors.primary}
              className="ml-1"
            />
          )}
        </Pressable>
      ) : (
        <View
          className={cn(
            'bg-primary/20 rounded-xl border border-primary px-2 text-primary w-auto self-start',
            className
          )}
        >
          <Text variant="heading" className="text-primary">
            {text}
          </Text>
        </View>
      )}
    </>
  );
}
