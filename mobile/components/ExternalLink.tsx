import { Linking, TextProps } from 'react-native';
import React from 'react';
import { Text, textVariants } from '~/components/nativewindui/Text';
import { VariantProps } from 'class-variance-authority';

export function ExternalLink({
  url,
  onPress,
  ...props
}: { url: string } & TextProps & VariantProps<typeof textVariants>) {
  const openUrl = () => Linking.canOpenURL(url).then(() => Linking.openURL(url));

  return (
    <Text
      onPress={(e) => {
        onPress && onPress(e);
        return openUrl();
      }}
      {...props}
    />
  );
}
