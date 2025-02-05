import React, { useEffect, useState } from 'react';
import { TextInput as ReactTextInput, TextInputProps, View } from 'react-native';
import { ThemedIcon } from '~/components/ThemedIcon';

import { cn } from '~/lib/cn';
import { useColorScheme } from '~/lib/useColorScheme';
import { omitObj } from '~/lib/utils';

interface CustomTextInputProps extends TextInputProps {
  className?: string;
  icon?: string;
  iconPosition?: 'left' | 'right';
  iconSize?: number;
}

export function TextInput({
  className,
  onFocus,
  onBlur,
  icon,
  style,
  iconPosition = 'right',
  iconSize = 20,
  ...props
}: CustomTextInputProps) {
  const [focus, setFocus] = useState(false);
  const { colors } = useColorScheme();
  const inputRef = React.createRef<ReactTextInput>();

  useEffect(() => {
    focus && inputRef?.current?.focus();
  }, [focus, inputRef.current]);

  return (
    <View className={cn('relative w-full flex-row items-center gap-4', className)}>
      {icon && iconPosition === 'left' && (
        <ThemedIcon name={icon} size={iconSize} color={colors.primary} />
      )}
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
        placeholderTextColor={colors.grey}
        style={[
          {
            color: colors.foreground,
            borderColor: focus ? colors.primary : colors.card,
          },
          omitObj(style),
        ]}
        {...props}
        className="flex-1"
      />
      {icon && iconPosition === 'right' && (
        <ThemedIcon name={icon} size={iconSize} color={colors.primary} />
      )}
    </View>
  );
}
