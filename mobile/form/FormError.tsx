import { TextProps } from 'react-native';
import { cn } from '~/lib/cn';
import { Text } from '~/components/nativewindui/Text';

export function FormError({ className, ...props }: TextProps) {
  return <Text className={cn('text-center text-destructive', className)} {...props} />;
}
