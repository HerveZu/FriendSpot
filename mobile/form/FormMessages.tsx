import { TextProps } from 'react-native';
import { cn } from '~/lib/cn';
import { Text } from '~/components/nativewindui/Text';

export function FormMessages({ className, ...props }: TextProps) {
  return <Text className={cn('text-center text-destructive', className)} {...props} />;
}

export function FormInfo({ className, ...props }: TextProps) {
  return <Text className={cn('text-center text-primary', className)} {...props} />;
}
