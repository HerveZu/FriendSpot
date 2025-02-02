import { View } from 'react-native';

import { Text } from '~/components/nativewindui/Text';
import { cn } from '~/lib/cn';

export function Tag({ text, className }: { text: string; className?: string }) {
  return (
    <View className={cn('w-fit rounded-xl border border-primary px-2 text-primary', className)}>
      <Text variant="heading" className="text-primary">
        {text}
      </Text>
    </View>
  );
}
