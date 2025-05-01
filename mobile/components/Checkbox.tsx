import { Checkbox as ReactCheckbox, CheckboxProps } from 'expo-checkbox';
import React from 'react';
import { useColorScheme } from '~/lib/useColorScheme';
import { omitUndefined } from '~/lib/utils';

export function Checkbox({ style, color, ...props }: CheckboxProps) {
  const { colors } = useColorScheme();
  const checkedColor = color ?? colors.primary;

  return (
    <ReactCheckbox
      style={[
        {
          borderColor: colors.foreground,
          borderRadius: 6,
        },
        omitUndefined(style),
      ]}
      color={props.value ? checkedColor : colors.foreground}
      {...props}
    />
  );
}
