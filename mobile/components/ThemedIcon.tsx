import { FontAwesome } from '@expo/vector-icons';
import { Icon } from '@expo/vector-icons/build/createIconSet';
import { OpaqueColorValue } from 'react-native';

import { useColorScheme } from '~/lib/useColorScheme';

export function ThemedIcon<TGlyph extends string>(props: {
  name: TGlyph;
  component?: Icon<TGlyph, any>;
  size?: number;
  className?: string;
  color?: string | OpaqueColorValue;
}) {
  const { colors } = useColorScheme();
  const Icon = props.component ?? FontAwesome;

  return (
    <Icon name={props.name as any} size={props.size} color={props.color ?? colors.foreground} />
  );
}
