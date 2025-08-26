import { Pressable, Text, View } from 'react-native';
import { KnownIcon, ThemedIcon } from './ThemedIcon';
import { useColorScheme } from '~/lib/useColorScheme';
import { Card } from '~/components/Card';
import { ReactElement } from 'react';
import { cn } from '~/lib/cn';

type Variant = 'info' | 'warning';
export function MessageInfo({
  info,
  action,
  variant = 'info',
}: {
  info: string;
  action?: () => void;
  variant?: Variant;
}) {
  const { colors } = useColorScheme();

  const variantMap: Record<
    Variant,
    { icon: ReactElement; containerClassname?: string; textClassname?: string }
  > = {
    info: {
      icon: <ThemedIcon name="lightbulb-o" size={24} color={colors.primary} />,
      containerClassname: 'bg-primary/20',
    },
    warning: {
      icon: <KnownIcon name={'warning'} size={24} color={colors.destructive} />,
      containerClassname: 'bg-destructive/15',
      textClassname: 'text-destructive',
    },
  };

  const content = (
    <>
      {variantMap[variant].icon}
      <Text
        className={cn(
          'shrink text-lg font-semibold text-foreground',
          variantMap[variant].textClassname
        )}>
        {info}
      </Text>
    </>
  );

  return action || variant === 'warning' ? (
    <Pressable onPress={() => action?.()}>
      <Card
        className={cn(
          'flex-row items-center justify-center',
          variantMap[variant].containerClassname
        )}>
        {content}
      </Card>
    </Pressable>
  ) : (
    <View className={cn('w-full flex-row items-center gap-4')}>{content}</View>
  );
}
