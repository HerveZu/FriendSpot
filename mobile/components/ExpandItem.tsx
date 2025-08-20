import { View, ViewProps } from 'react-native';
import { cn } from '~/lib/cn';

export function ExpandItem({ className, ...props }: ViewProps) {
  return <View className={cn('flex-1', className)} {...props} />;
}

export function ExpandRow({ className, ...props }: ViewProps) {
  return <View className={cn('flex-row items-center gap-4', className)} {...props} />;
}
