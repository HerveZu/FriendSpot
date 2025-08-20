import { Text } from '~/components/nativewindui/Text';
import { cn } from '~/lib/cn';
import { View } from 'react-native';
import { ThemedIcon } from '~/components/ThemedIcon';
import React from 'react';
import { ParkingResponse } from '~/endpoints/parkings/parking-response';

export function ParkingSpotCount({ parking }: { parking: ParkingResponse }) {
  return (
    <View className="flex-row items-end gap-1">
      <Text className={cn('text-3xl font-bold text-primary', parking.isFull && 'text-destructive')}>
        {parking.spotsCount}
      </Text>

      <View className={'flex-row items-center gap-1'}>
        <Text className="text-lg font-semibold text-foreground">/{parking.maxSpots}</Text>
        <ThemedIcon name="user" className="text-primary" />
      </View>
    </View>
  );
}
