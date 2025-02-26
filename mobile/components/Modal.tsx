import { Text } from '~/components/nativewindui/Text';
import { TextProps } from 'react-native';
import { cn } from '~/lib/cn';

export function ModalTitle({ className, ...props }: TextProps) {
  return <Text variant="title1" className={cn('font-semibold', className)} {...props} />;
}
