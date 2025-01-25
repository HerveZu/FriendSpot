import { View, ViewProps } from 'react-native';

import { ThemedIcon } from '~/components/ThemedIcon';
import { Text } from '~/components/nativewindui/Text';
import { cn } from '~/lib/cn';

export function Rating({
  rating,
  stars,
  className,
  color,
  ...props
}: { rating: number; stars: number; color: string } & ViewProps) {
  const percent = rating / stars;

  return (
    <View className={cn('min-w-0 flex-row items-center gap-2', className)} {...props}>
      <Text
        className="shrink-0 font-bold"
        style={{
          color,
        }}>
        {rating.toFixed(1)}
      </Text>
      <View className="relative">
        <View className="flex-row gap-1">
          {[...new Array(stars).keys()].map((i) => (
            <ThemedIcon key={i} name="star-o" color={color} size={24} />
          ))}
        </View>
        <View className="absolute left-0">
          <View
            className="flex-row gap-1 overflow-hidden"
            style={{
              width: `${100 * percent}%`,
            }}>
            {[...new Array(stars).keys()].map((i) => (
              <ThemedIcon key={i} name="star" color={color} size={24} />
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}
