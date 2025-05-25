import { ThemedIcon } from '~/components/ThemedIcon';
import React from 'react';
import { Button } from '~/components/nativewindui/Button';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

export function CollapsableButton(props: {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
}) {
  const rotation = useSharedValue(0);

  React.useEffect(() => {
    rotation.value = withSpring(props.collapsed ? 0 : 180, {
      mass: 0.5,
    });
  }, [props.collapsed]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  return (
    <Button variant={'plain'} onPress={() => props.onCollapse(!props.collapsed)}>
      <Animated.View style={animatedStyle}>
        <ThemedIcon name={'chevron-down'} size={20} />
      </Animated.View>
    </Button>
  );
}
