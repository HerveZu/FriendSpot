import { Component, PropsWithChildren, ReactNode, useContext, useEffect } from 'react';
import {
  ActivityIndicator,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  useAnimatedValue,
  View,
} from 'react-native';

import { BackButton } from '~/components/BackButton';
import { Screen } from '~/components/Screen';
import { Button } from '~/components/nativewindui/Button';
import { Text } from '~/components/nativewindui/Text';
import { useColorScheme } from '~/lib/useColorScheme';
import { useKeyboardVisible } from '~/lib/useKeyboardVisible';
import { Form, FormContext, FormProps } from '~/form/FormContext';

type IllustrationProps = {
  width: number;
  height: number;
};

interface Illustration {
  new (props: IllustrationProps): Component<IllustrationProps>;
}

type AuthFormProps = {
  title: ReactNode;
  error?: string;
  onSubmit: () => Promise<void>;
  submitText: string;
  Illustration?: Illustration;
  submitCaption?: ReactNode;
} & PropsWithChildren;

export function AuthForm(props: AuthFormProps & FormProps) {
  return (
    <Form disabled={props.disabled} autoTouch={props.autoTouch}>
      <AuthFormInternal {...props} />
    </Form>
  );
}

function AuthFormInternal({ Illustration, ...props }: AuthFormProps) {
  const { keyboardVisible } = useKeyboardVisible();
  const illustrationProgress = useAnimatedValue(1);
  const { colors } = useColorScheme();
  const { handleSubmit, isLoading, isValid } = useContext(FormContext);

  useEffect(() => {
    Animated.timing(illustrationProgress, {
      toValue: keyboardVisible ? 0 : 1,
      duration: 100,
      useNativeDriver: false,
    }).start();
  }, [keyboardVisible]);

  return (
    <KeyboardAvoidingView behavior={'padding'}>
      <KeyboardAvoidingView behavior={'height'}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <Screen className="relative flex h-full flex-col justify-between gap-12">
            <View className="relative w-full flex-row items-center justify-center">
              <BackButton className="absolute left-0" />
              <View className="self-center">{props.title}</View>
            </View>
            <Animated.View
              className="mx-auto"
              style={{
                opacity: illustrationProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 1],
                }),
                height: illustrationProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 300],
                }),
              }}>
              {Illustration && <Illustration width={300} height={300} />}
            </Animated.View>
            <View className={'w-full flex-col gap-4'}>
              <Text className="text-center text-destructive">{props.error}</Text>
              {props.children}
            </View>
            {props.submitCaption}
            <Button
              size={Platform.select({ ios: 'lg', default: 'md' })}
              disabled={!isValid}
              onPress={handleSubmit(props.onSubmit)}
              variant="primary"
              className="w-full">
              {isLoading && <ActivityIndicator color={colors.foreground} />}
              <Text>{props.submitText}</Text>
            </Button>
          </Screen>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </KeyboardAvoidingView>
  );
}

export function AuthFormTitle(props: { title: string }) {
  return (
    <Text variant="title1" className="font-semibold">
      {props.title}
    </Text>
  );
}
