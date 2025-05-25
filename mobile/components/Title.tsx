import { TextProps, View } from 'react-native';

import { Text } from '~/components/nativewindui/Text';
import { cn } from '~/lib/cn';
import { ReactNode } from 'react';

export function Title({
  primary,
  className,
  ...props
}: { primary?: boolean; action?: ReactNode } & TextProps) {
  return (
    <View className={'mb-4 w-full flex-row items-center justify-between'}>
      <Text
        variant="title1"
        className={cn('font-extrabold', primary ? 'text-3xl' : 'text-xl', className)}>
        {props.children}
      </Text>
      {props.action}
    </View>
  );
}

export function SheetTitle(props: TextProps) {
  return (
    <Text variant="title1" className={cn('font-bold', 'text-2xl')}>
      {props.children}
    </Text>
  );
}
