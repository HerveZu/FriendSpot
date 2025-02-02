import { View, ViewProps } from 'react-native';

import { cn } from '~/lib/cn';

export function Logo() {
  return (
    <View className="flex-row items-center">
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
