import { createContext, ReactNode, useCallback, useContext, useRef, useState } from 'react';
import { Animated, View, ViewProps } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import ReanimatedSwipeable, {
  SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';

import { ThemedIcon } from '~/components/ThemedIcon';
import { cn } from '~/lib/cn';
import { useColorScheme } from '~/lib/useColorScheme';
import { Button } from '~/components/nativewindui/Button';

const DeletableContext = createContext<{
  canDelete: boolean;
  triggerDelete: () => void;
}>(null!);

export function Deletable({
  disabled,
  canDelete,
  onDelete,
  className,
  ...props
}: { disabled?: boolean; canDelete: boolean; onDelete: () => Promise<void> } & ViewProps) {
  const shakeAnimation = new Animated.Value(0);
  const [deleted, setDeleted] = useState(false);
  const swipeableRef = useRef<SwipeableMethods>(null);

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
      !disabled &&
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

  const triggerDelete = useCallback(() => {
    swipeableRef.current?.openRight();
    // Fix for not opening the swipeable on first press.
    // See https://github.com/software-mansion/react-native-gesture-handler/discussions/3066
    setTimeout(() => {
      swipeableRef.current?.openRight();
    }, 200);
  }, [swipeableRef.current]);

  return (
    <GestureHandlerRootView>
      <ReanimatedSwipeable
        ref={swipeableRef}
        onSwipeableOpenStartDrag={() => !canDelete && startShake()}
        friction={2}
        enableTrackpadTwoFingerGesture
        rightThreshold={canDelete ? 100 : 100_000}
        renderRightActions={RightAction}
        onSwipeableWillOpen={() => canDelete && onDelete().then(() => setDeleted(true))}>
        <DeletableContext.Provider value={{ canDelete, triggerDelete }}>
          <View className={cn(className, 'bg-background')}>{props.children}</View>
        </DeletableContext.Provider>
      </ReanimatedSwipeable>
    </GestureHandlerRootView>
  );
}

export function DeletableStatus(props: { fallback: ReactNode }) {
  const { colors } = useColorScheme();
  const { canDelete } = useContext(DeletableContext);

  return !canDelete ? (
    <ThemedIcon size={18} color={colors.primary} className="absolute right-0 top-1/2" name="lock" />
  ) : (
    props.fallback
  );
}

export function DeleteTrigger(props: { fallback?: ReactNode }) {
  const { colors } = useColorScheme();
  const { canDelete, triggerDelete } = useContext(DeletableContext);

  return canDelete ? (
    <Button
      disabled={!canDelete}
      variant={'plain'}
      size={'sm'}
      className={'bg-destructive/30 border border-destructive'}
      onPress={triggerDelete}>
      <ThemedIcon name={'trash'} size={18} color={colors.destructive} />
    </Button>
  ) : (
    <></>
  );
}
