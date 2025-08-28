import { ReactNode } from 'react';
import { Pressable, PressableProps, View } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { Card } from '~/components/Card';
import { ThemedIcon } from '~/components/ThemedIcon';
import { Text } from '~/components/nativewindui/Text';

export function OpenSection({
  icon,
  title,
  ...props
}: { icon: ReactNode; title: string } & PressableProps) {
  return (
    <Pressable {...props}>
      <Card className={'flex-row items-center justify-between'}>
        <View className={'flex-row items-center gap-4'}>
          {icon}
          <Text variant={'heading'}>{title}</Text>
        </View>
        <ThemedIcon name={'chevron-right'} component={FontAwesome6} size={14} />
      </Card>
    </Pressable>
  );
}
