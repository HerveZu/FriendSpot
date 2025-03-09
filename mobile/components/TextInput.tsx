import { forwardRef, ReactNode, useEffect, useRef, useState } from 'react';
import {
  TextInput as ReactTextInput,
  TextInputProps as NativeTextInputProps,
  View,
} from 'react-native';

import { cn } from '~/lib/cn';
import { useColorScheme } from '~/lib/useColorScheme';
import { omitUndefined } from '~/lib/utils';

export type TextInputProps = {
  icon?: {
    element: ReactNode;
    position: 'left' | 'right';
  };
} & NativeTextInputProps;

export const TextInput = forwardRef<ReactTextInput, TextInputProps>(
  ({ className, onFocus, onBlur, style, icon, ...props }: TextInputProps, ref) => {
    const [focus, setFocus] = useState(false);
    const { colors } = useColorScheme();
    const innerRef = useRef<ReactTextInput>(null);
    const refToUse = !ref || typeof ref === 'function' ? innerRef : ref;

    useEffect(() => {
      focus && refToUse?.current?.focus();
    }, [focus]);

    return (
      <View>
        <ReactTextInput
          ref={refToUse}
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
            'relative min-h-12 rounded-xl border bg-background p-2 text-lg',
            icon?.position === 'left' && 'pl-11',
            props.readOnly && 'opacity-65',
            className
          )}
          placeholderTextColor={colors.grey}
          style={[
            {
              lineHeight: 0,
              color: colors.foreground,
              borderColor: focus ? colors.primary : colors.card,
            },
            omitUndefined(style),
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
);

TextInput.displayName = 'TextInput';
