import { View, ViewProps } from 'react-native';

import { cn } from '~/lib/cn';

export function List({ className, ...props }: ViewProps) {
  return <View className={cn('flex-col gap-4', className)} {...props} />;
}
