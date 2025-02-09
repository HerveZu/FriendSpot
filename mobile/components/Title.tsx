import { TextProps } from 'react-native';

import { Text } from '~/components/nativewindui/Text';
import { cn } from '~/lib/cn';

export function Title({ primary, ...props }: { primary?: boolean } & TextProps) {
  return (
    <Text variant="title1" className={cn('font-extrabold', primary ? 'text-3xl' : 'text-2xl')}>
      {props.children}
    </Text>
  );
}
