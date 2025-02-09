import React, { PropsWithChildren } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';

import { ThemedIcon } from '~/components/ThemedIcon';

export function Deletable(props: { onDelete: () => void } & PropsWithChildren) {
  function RightAction() {
    return (
      <View className="w-full flex-row items-center justify-end bg-destructive pr-4">
        <ThemedIcon name="trash" size={32} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView>
      <ReanimatedSwipeable
        friction={2}
        enableTrackpadTwoFingerGesture
        rightThreshold={100}
        renderRightActions={RightAction}
        onSwipeableOpen={props.onDelete}>
        {props.children}
      </ReanimatedSwipeable>
    </GestureHandlerRootView>
  );
}
