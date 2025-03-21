import React from 'react';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withRepeat } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';
import { cn } from '~/lib/cn';


export default function BlinkingDot(props: { color: string, className?: string }) {
  const opacity = useSharedValue(0.8);

  const startAnimation = () => {
    opacity.value = withRepeat(
      withTiming(0.3, { duration: 1200 }),
      -1, 
      true 
    );
  };

  useFocusEffect(
    React.useCallback(() => {
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
    className={cn('', props.className)}
      style={[
        { 
          width: 10, 
          height: 10, 
          borderRadius: 10, 
          backgroundColor: props.color, 
          alignSelf: 'center' 
        },
        animatedStyle,
      ]}
    />
  );
}
