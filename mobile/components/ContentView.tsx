import { View, ViewProps } from 'react-native';

import { cn } from '~/lib/cn';

export function ContentView({ className, ...props }: ViewProps) {
  return (
    <View className={cn('mx-auto h-full w-full p-6', className)} {...props}>
      {props.children}
    </View>
  );
}

export function ContentSheetView({ className, ...props }: ViewProps) {
  return (
    <ContentView className={cn('pb-8 pt-0', className)} {...props}>
      {props.children}
    </ContentView>
  );
}
