import { FontAwesome, FontAwesome6 } from '@expo/vector-icons';
import { Icon } from '@expo/vector-icons/build/createIconSet';
import { OpaqueColorValue } from 'react-native';

import { useColorScheme } from '~/lib/useColorScheme';

export type ThemedIconProps<TGlyph extends string> = {
  name: TGlyph;
  component?: Icon<TGlyph, any>;
  size?: number;
  className?: string;
  color?: string | OpaqueColorValue;
};

export function ThemedIcon<TGlyph extends string>({
  size = 18,
  name,
  component,
  color,
}: ThemedIconProps<TGlyph>) {
  const { colors } = useColorScheme();
  const Icon = component ?? FontAwesome;

  return <Icon name={name as any} size={size} color={color ?? colors.foreground} />;
}

type KnownIconType = 'premium' | 'warning' | 'search' | 'settings' | 'support';

const iconNameMap: Record<KnownIconType, string> = {
  premium: 'crown',
  warning: 'circle-exclamation',
  search: 'magnifying-glass',
  settings: 'gear',
  support: 'headset',
};

export function KnownIcon<TGlyph extends string>({
  name,
  ...props
}: Omit<ThemedIconProps<TGlyph>, 'name' | 'component'> & { name: KnownIconType }) {
  return <ThemedIcon component={FontAwesome6} name={iconNameMap[name] as any} {...props} />;
}
