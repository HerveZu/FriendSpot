import { View, ViewProps } from 'react-native';

import { cn } from '~/lib/cn';

export function Logo({ className, ...props }: ViewProps) {
  return (
    <View className={cn('flex-row items-center', className)} {...props}>
      <LogoCard className="-mr-2 -rotate-12" />
      <LogoCard className="-ml-2 rotate-12" primary />
    </View>
  );
}

export function LogoCard({ primary, className, ...props }: { primary?: boolean } & ViewProps) {
  return (
    <View
      className={cn(
        'h-24 w-14 rounded-xl',
        primary && 'bg-primary',
        !primary && 'border-2 border-primary',
        className
      )}
      {...props}
    />
  );
}
