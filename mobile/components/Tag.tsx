import { Pressable, PressableProps } from 'react-native';
import { ThemedIcon } from './ThemedIcon';
import { useColorScheme } from '~/lib/useColorScheme';

import { Text } from '~/components/nativewindui/Text';
import { cn } from '~/lib/cn';
import { FontAwesome6 } from '@expo/vector-icons';

export function Tag({
  text,
  className,
  icon,
  ...props
}: {
  text: string;
  className?: string;
  icon?: string;
} & PressableProps) {
  const { colors } = useColorScheme();

  return (
    <Pressable
      className={cn(
        'bg-primary/20 w-auto flex-row items-center self-start rounded-xl border border-primary px-2 text-primary',
        className
      )}
      {...props}>
      <Text variant="heading" className={`text-primary`}>
        {text + (icon ? ' ' : '')}
      </Text>
      {icon && (
        <ThemedIcon
          component={FontAwesome6}
          name={icon}
          size={16}
          color={colors.primary}
          className="ml-1"
        />
      )}
    </Pressable>
  );
}
