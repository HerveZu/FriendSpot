import React, { useEffect, useState } from 'react';
import { TextInput as ReactTextInput, TextInputProps } from 'react-native';

import { cn } from '~/lib/cn';
import { useColorScheme } from '~/lib/useColorScheme';
import { omitObj } from '~/lib/utils';

export function TextInput({ className, onFocus, onBlur, style, ...props }: TextInputProps) {
  const [focus, setFocus] = useState(false);
  const { colors } = useColorScheme();
  const inputRef = React.createRef<ReactTextInput>();

  useEffect(() => {
    focus && inputRef?.current?.focus();
  }, [focus, inputRef.current]);

  return (
    <ReactTextInput
      ref={inputRef}
      onFocus={(e) => {
        setFocus(true);
        onFocus && onFocus(e);
      }}
      onBlur={(e) => {
        setFocus(false);
        onBlur && onBlur(e);
      }}
      value={props.value}
      className={cn('rounded-lg border p-4 text-xl', className)}
      placeholderTextColor={colors.grey}
      style={[
        {
          color: colors.foreground,
          borderColor: focus ? colors.primary : colors.card,
        },
        omitObj(style),
      ]}
      {...props}
    />
  );
}
