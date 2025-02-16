import { FontAwesome } from '@expo/vector-icons';
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

export function ThemedIcon<TGlyph extends string>(props: ThemedIconProps<TGlyph>) {
  const { colors } = useColorScheme();
  const Icon = props.component ?? FontAwesome;

  return (
    <Icon name={props.name as any} size={props.size} color={props.color ?? colors.foreground} />
  );
}
