import React, { ReactNode, useEffect, useState } from 'react';
import {
  TextInput as ReactTextInput,
  TextInputProps as NativeTextInputProps,
  View,
} from 'react-native';

import { cn } from '~/lib/cn';
import { useColorScheme } from '~/lib/useColorScheme';
import { omitObj } from '~/lib/utils';

export type TextInputProps = {
  icon?: {
    element: ReactNode;
    position: 'left' | 'right';
  };
} & NativeTextInputProps;

export function TextInput({
  className,
  onFocus,
  onBlur,
  style,
  icon,
  ...props
}: {
  icon?: {
    element: ReactNode;
    position: 'left' | 'right';
  };
} & TextInputProps) {
  const [focus, setFocus] = useState(false);
  const { colors } = useColorScheme();
  const inputRef = React.createRef<ReactTextInput>();

  useEffect(() => {
    focus && inputRef?.current?.focus();
  }, [focus, inputRef.current]);

  return (
    <View className={cn('fl')}>
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
        className={cn(
          'relative rounded-lg border bg-background p-3 pb-4 text-xl',
          icon?.position === 'left' && 'pl-11',
          className
        )}
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
      {icon && (
        <View
          className={cn(
            'absolute top-0 h-full',
            icon.position === 'right' && 'right-0',
            icon.position === 'left' && 'left-0'
          )}>
          <View className="m-1 my-auto bg-background p-3">{icon.element}</View>
        </View>
      )}
    </View>
  );
}
