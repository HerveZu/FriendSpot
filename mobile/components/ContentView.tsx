import { View, ViewProps } from 'react-native';

import { cn } from '~/lib/cn';

export function ContentView({ className, ...props }: ViewProps) {
  return (
    <View className={cn('mx-auto h-full w-full max-w-sm p-2', className)} {...props}>
      {props.children}
    </View>
  );
}

export function ContentSheetView({ className, ...props }: ViewProps) {
  return (
    <ContentView className={cn('pb-8', className)} {...props}>
      {props.children}
    </ContentView>
  );
}
