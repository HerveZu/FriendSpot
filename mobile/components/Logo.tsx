import { View, ViewProps } from 'react-native';

import { cn } from '~/lib/cn';
import { omitUndefined } from '~/lib/utils';

export function Logo({ className, ...props }: ViewProps) {
  return (
    <View className={cn('relative', className)} {...props}>
      <LogoCard
        className="absolute h-full w-full -rotate-12"
        style={{
          left: '-17%',
          top: '-4%',
        }}
      />
      <LogoCard
        className="absolute h-full w-full rotate-12"
        primary
        style={{
          right: '-17%',
          bottom: '-4%',
        }}
      />
    </View>
  );
}

export function LogoCard({
  primary,
  className,
  style,
  ...props
}: { primary?: boolean } & ViewProps) {
  return (
    <View
      className={cn(
        'h-24 w-14 shadow-sm shadow-primary',
        primary ? 'bg-primary' : 'bg-card',
        !primary && 'border border-primary',
        className
      )}
      style={[
        {
          borderRadius: '20%',
        },
        omitUndefined(style),
      ]}
      {...props}
    />
  );
}
