import { View, ViewProps } from 'react-native';

import { cn } from '~/lib/cn';

export function ContentSheetView({ className, ...props }: ViewProps) {
  return (
    <View className={cn('pb-safe-offset-2 mx-auto h-full w-full p-6 py-4', className)} {...props}>
      {props.children}
    </View>
  );
}
