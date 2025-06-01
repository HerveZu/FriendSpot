import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { useColorScheme } from '~/lib/useColorScheme';

export function BlinkingDot(props: { color?: string; className?: string }) {
  const opacity = useSharedValue(0.8);
  const { colors } = useColorScheme();

  const startAnimation = () => {
    opacity.value = withRepeat(withTiming(0.3, { duration: 1200 }), -1, true);
  };

  useFocusEffect(
    useCallback(() => {
      startAnimation();

      return () => {
        opacity.value = 0.8;
      };
    }, [])
  );

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      className={props.className}
      style={[
        {
          width: 10,
          height: 10,
          borderRadius: 10,
          backgroundColor: props.color ?? colors.destructive,
          alignSelf: 'center',
        },
        animatedStyle,
      ]}
    />
  );
}
