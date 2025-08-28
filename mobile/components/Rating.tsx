import { View, ViewProps } from 'react-native';

import { ThemedIcon } from '~/components/ThemedIcon';
import { Text } from '~/components/nativewindui/Text';
import { cn } from '~/lib/cn';
import { useColorScheme } from '~/lib/useColorScheme';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

export function Rating({
  displayRating,
  rating,
  stars,
  className,
  color,
  ...props
}: { displayRating?: boolean; rating: number; stars: number; color: string } & ViewProps) {
  const { colors } = useColorScheme();
  const { t } = useTranslation();

  const baseline = stars / 2;
  const baselineMargin = 0.5;
  const baselineBoundaries = { min: baseline - baselineMargin, max: baseline + baselineMargin };
  const isNeutral = rating > baselineBoundaries.min && rating < baselineBoundaries.max;
  const info = isNeutral
    ? null
    : rating > baselineBoundaries.min && rating < baselineBoundaries.max
      ? null
      : rating >= baselineBoundaries.max
        ? {
            color: colors.primary,
            icon: 'thumbs-up',
            i18nKey: 'user.profile.reputation.good',
          }
        : {
            color: colors.destructive,
            icon: 'thumbs-down',
            i18nKey: 'user.profile.reputation.bad',
          };

  return (
    info && (
      <View
        className={cn('min-w-0 flex-row items-center justify-center gap-2', className)}
        {...props}>
        <ThemedIcon name={info.icon} color={info.color} component={FontAwesome6} />
        {displayRating && (
          <Text className={'text-lg font-bold'} style={{ color: info.color }}>
            {t(info.i18nKey)}
          </Text>
        )}
      </View>
    )
  );
}
