import React, { createContext, useContext, useState } from 'react';
import { Animated, View, ViewProps } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';

import { ThemedIcon } from '~/components/ThemedIcon';
import { cn } from '~/lib/cn';
import { useColorScheme } from '~/lib/useColorScheme';

const DeletableContext = createContext<{
  canDelete: boolean;
}>(null!);

export function Deletable({
  canDelete,
  onDelete,
  className,
  ...props
}: { canDelete: boolean; onDelete: () => Promise<void> } & ViewProps) {
  const shakeAnimation = new Animated.Value(0);
  const [deleted, setDeleted] = useState(false);

  const startShake = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shakeAnimation, { toValue: 2, duration: 25, useNativeDriver: true }),
        Animated.timing(shakeAnimation, { toValue: -2, duration: 25, useNativeDriver: true }),
      ]),
      { iterations: 5 }
    ).start();
  };

  function RightAction() {
    return (
      !deleted && (
        <View
          className={cn('w-full flex-row items-center justify-end bg-destructive pr-4', className)}
          {...props}>
          <Animated.View style={{ transform: [{ translateX: shakeAnimation }] }}>
            <ThemedIcon name={canDelete ? 'trash' : 'lock'} size={32} />
          </Animated.View>
        </View>
      )
    );
  }

  return (
    <GestureHandlerRootView>
      <ReanimatedSwipeable
        onSwipeableOpenStartDrag={() => !canDelete && startShake()}
        friction={2}
        enableTrackpadTwoFingerGesture
        rightThreshold={canDelete ? 100 : 100000}
        renderRightActions={RightAction}
        onSwipeableWillOpen={() => canDelete && onDelete().then(() => setDeleted(true))}>
        <DeletableContext.Provider value={{ canDelete }}>
          {props.children}
        </DeletableContext.Provider>
      </ReanimatedSwipeable>
    </GestureHandlerRootView>
  );
}

export function DeletableStatus() {
  const { colors } = useColorScheme();
  const { canDelete } = useContext(DeletableContext);

  return (
    !canDelete && (
      <ThemedIcon
        size={18}
        color={colors.primary}
        className="absolute right-0 top-1/2"
        name="lock"
      />
    )
  );
}
