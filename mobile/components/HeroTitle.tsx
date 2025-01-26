import React from 'react';
import { View } from 'react-native';

import { Text } from '~/components/nativewindui/Text';

export function HeroTitle(props: { part1: string; part2: string }) {
  return (
    <View className="flex-row justify-center gap-2">
      <Text variant="title1">{props.part1}</Text>
      <Text variant="title1" className="text-primary">
        {props.part2}
      </Text>
    </View>
  );
}
