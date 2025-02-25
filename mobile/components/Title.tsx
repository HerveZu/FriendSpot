import { TextProps } from 'react-native';

import { Text } from '~/components/nativewindui/Text';
import { cn } from '~/lib/cn';

export function Title({ primary, className, ...props }: { primary?: boolean } & TextProps) {
  return (
    <Text
      variant="title1"
      className={cn('mb-4 font-extrabold', primary ? 'text-3xl' : 'text-xl', className)}>
      {props.children}
    </Text>
  );
}

export function SheetTitle(props: TextProps) {
  return (
    <Text variant="title1" className={cn('font-bold', 'text-2xl')}>
      {props.children}
    </Text>
  );
}
