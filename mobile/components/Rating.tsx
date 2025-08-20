import { View, ViewProps } from 'react-native';

import { ThemedIcon } from '~/components/ThemedIcon';
import { Text } from '~/components/nativewindui/Text';
import { cn } from '~/lib/cn';

export function Rating({
  displayRating,
  rating,
  stars,
  className,
  color,
  ...props
}: { displayRating?: boolean; rating: number; stars: number; color: string } & ViewProps) {
  const percent = rating / stars;

  return (
    <View
      className={cn('min-w-0 flex-row items-center justify-center gap-2', className)}
      {...props}>
      {displayRating && (
        <Text className="shrink-0 text-base" style={{ color: color }}>
          {rating.toFixed(1)}
        </Text>
      )}
      <View className="relative">
        <View className="flex-row gap-1">
          {[...new Array(stars).keys()].map((i) => (
            <ThemedIcon key={i} name="star-o" color={color} size={20} />
          ))}
        </View>
        <View className="absolute left-0">
          <View
            className="flex-row gap-1 overflow-hidden"
            style={{
              width: `${100 * percent}%`,
            }}>
            {[...new Array(stars).keys()].map((i) => (
              <ThemedIcon key={i} name="star" color={color} size={20} />
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}
