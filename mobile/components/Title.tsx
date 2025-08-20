import { TextProps, View } from 'react-native';

import { Text, textVariants } from '~/components/nativewindui/Text';
import { cn } from '~/lib/cn';
import { ReactNode } from 'react';
import { VariantProps } from 'class-variance-authority';

export function Title({
  primary,
  icon,
  className,
  ...props
}: {
  primary?: boolean;
  action?: ReactNode;
  icon?: {
    element: ReactNode;
  };
} & TextProps) {
  return (
    <View className={'mb-4 w-full flex-row items-center justify-between'}>
      <View className="flex-row items-center gap-2">
        {icon && <View className={cn()}>{icon.element}</View>}
        <Text
          variant="title1"
          className={cn('font-extrabold', primary ? 'text-3xl' : 'text-xl', className)}>
          {props.children}
        </Text>
      </View>
      <View>{props.action}</View>
    </View>
  );
}

export function SheetTitle({
  className,
  icon,
  action,
  children,
  variant,
  ...props
}: { icon?: ReactNode; action?: ReactNode } & TextProps & VariantProps<typeof textVariants>) {
  const title = (
    <Text
      variant={variant ?? 'title1'}
      numberOfLines={1}
      ellipsizeMode="tail"
      className={cn('font-bold', className)}
      {...props}>
      {children}
    </Text>
  );

  return icon || action ? (
    <View className="flex-row items-center justify-between gap-4">
      <View className={'flex-1 flex-row items-center gap-4'}>
        {icon}
        {title}
      </View>
      {action}
    </View>
  ) : (
    title
  );
}

export function SheetHeading({
  className,
  icon,
  children,
  variant,
  ...props
}: { icon?: ReactNode } & TextProps & VariantProps<typeof textVariants>) {
  const title = (
    <Text variant={variant ?? 'heading'} className={cn('font-semibold', className)} {...props}>
      {children}
    </Text>
  );

  return icon ? (
    <View className="flex-row items-center gap-2">
      {icon}
      {title}
    </View>
  ) : (
    title
  );
}
