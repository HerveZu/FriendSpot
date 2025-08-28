import { FontAwesome, FontAwesome6 } from '@expo/vector-icons';
import { Icon, IconProps } from '@expo/vector-icons/build/createIconSet';
import { OpaqueColorValue } from 'react-native';

import { useColorScheme } from '~/lib/useColorScheme';

export type ThemedIconProps<TGlyph extends string> = {
  name: TGlyph;
  component?: Icon<TGlyph, any>;
  color?: string | OpaqueColorValue;
} & IconProps<TGlyph>;

export function ThemedIcon<TGlyph extends string>({
  size = 18,
  name,
  component,
  color,
  ...props
}: ThemedIconProps<TGlyph>) {
  const { colors } = useColorScheme();
  const Icon = component ?? FontAwesome;

  return <Icon name={name as any} size={size} color={color ?? colors.foreground} {...props} />;
}

type KnownIconType = 'premium' | 'warning' | 'search' | 'settings' | 'support';

const iconNameMap: Record<KnownIconType, { name: string }> = {
  premium: { name: 'gem' },
  warning: { name: 'circle-exclamation' },
  search: { name: 'magnifying-glass' },
  settings: { name: 'gear' },
  support: { name: 'headset' },
};

export function KnownIcon<TGlyph extends string>({
  name,
  ...props
}: Omit<ThemedIconProps<TGlyph>, 'name' | 'component'> & { name: KnownIconType }) {
  const iconProps = iconNameMap[name];
  return <ThemedIcon component={FontAwesome6} name={iconProps.name} {...props} />;
}
