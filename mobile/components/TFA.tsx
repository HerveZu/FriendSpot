import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTheme } from '@react-navigation/core';
import { OpaqueColorValue } from 'react-native';

export function TFA(props: {
  name: string;
  size?: number;
  className?: string;
  color?: string | OpaqueColorValue;
}) {
  const theme = useTheme();

  return (
    <FontAwesome
      name={props.name as any}
      size={props.size}
      color={props.color ?? theme.colors.text}
    />
  );
}
