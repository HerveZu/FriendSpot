import { View, ViewProps } from 'react-native';

import { cn } from '~/lib/cn';

export default function ContentView({ className, ...props }: ViewProps) {
  return (
    <View className={cn('h-full w-full max-w-sm px-8 py-4', className)} {...props}>
      {props.children}
    </View>
  );
}
