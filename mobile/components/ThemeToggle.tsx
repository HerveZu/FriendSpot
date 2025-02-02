import { Entypo } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import Animated, { LayoutAnimationConfig, ZoomInRotate } from 'react-native-reanimated';

import { ThemedIcon } from '~/components/ThemedIcon';
import { cn } from '~/lib/cn';
import { useColorScheme } from '~/lib/useColorScheme';

export function ThemeToggle() {
  const { isDarkColorScheme, toggleColorScheme } = useColorScheme();
  return (
    <LayoutAnimationConfig skipEntering>
      <Animated.View className="items-center justify-center" entering={ZoomInRotate}>
        <Pressable onPress={toggleColorScheme} className="opacity-80">
          {({ pressed }) => (
            <View className={cn('px-0.5', pressed && 'opacity-50')}>
              <ThemedIcon
                component={Entypo}
                size={22}
                name={isDarkColorScheme ? 'light-up' : 'moon'}
              />
            </View>
          )}
        </Pressable>
      </Animated.View>
    </LayoutAnimationConfig>
  );
}
