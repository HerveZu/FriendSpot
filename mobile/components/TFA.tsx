import FontAwesome from '@expo/vector-icons/FontAwesome';
import { OpaqueColorValue } from 'react-native';

import { useColorScheme } from '~/lib/useColorScheme';

export function TFA(props: {
  name: string;
  size?: number;
  className?: string;
  color?: string | OpaqueColorValue;
}) {
  const colorScheme = useColorScheme();

  return (
    <FontAwesome
      name={props.name as any}
      size={props.size}
      color={props.color ?? (colorScheme.isDarkColorScheme ? 'white' : 'dark')}
    />
  );
}
