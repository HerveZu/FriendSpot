import React, {
  createContext,
  PropsWithChildren,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  TextInputProps,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import { BackButton } from '~/components/BackButton';
import { ContentView } from '~/components/ContentView';
import { TextInput } from '~/components/TextInput';
import { Button } from '~/components/nativewindui/Button';
import { Text } from '~/components/nativewindui/Text';
import { useColorScheme } from '~/lib/useColorScheme';
import { notEmpty } from '~/lib/utils';
import { COLORS } from '~/theme/colors';

type AuthFormContext = {
  error: (id: string, error: boolean) => void;
  touch: () => void;
  isSubmitted: boolean;
  touchTrigger: object;
};

const _AuthFormContext = createContext<AuthFormContext>(null!);

export function AuthForm(
  props: {
    title: ReactNode;
    error?: string;
    onSubmit: () => Promise<void>;
    submitText: string;
  } & PropsWithChildren
) {
  const [inputErrors, setInputErrors] = useState<string[]>([]);
  const [isTouched, setIsTouched] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [pendingAction, setPendingAction] = useState(false);
  const [touchTrigger, setTouchTrigger] = useState({});

  const error = useCallback(
    (id: string, error: boolean) => {
      if (error) {
        setInputErrors((errors) => [...new Set([...errors, id])]);
        return;
      }

      setInputErrors((errors) => errors.filter((otherId) => otherId !== id));
    },
    [setInputErrors]
  );

  const touch = useCallback(() => {
    setIsTouched(true);
    setTouchTrigger({});
  }, [setIsTouched, setTouchTrigger]);

  return (
    <_AuthFormContext.Provider value={{ touchTrigger, isSubmitted, touch, error }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ContentView className="flex h-full flex-col justify-between">
            <View className="relative w-full flex-row items-center justify-center">
              <BackButton className="absolute left-0" />
              <View className="self-center">{props.title}</View>
            </View>
            <View className="w-full flex-col gap-4">
              <Text className="text-center text-destructive">{props.error}</Text>
              {props.children}
            </View>
            <Button
              size={Platform.select({ ios: 'lg', default: 'md' })}
              disabled={!isTouched || inputErrors.length > 0}
              onPress={() => {
                setPendingAction(true);
                setIsSubmitted(true);

                props.onSubmit().finally(() => setPendingAction(false));
              }}
              variant="primary"
              className="w-full">
              {pendingAction && <ActivityIndicator color={COLORS.white} />}
              <Text>{props.submitText}</Text>
            </Button>
          </ContentView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </_AuthFormContext.Provider>
  );
}

export function AuthFormTitle(props: { title: string }) {
  return <Text variant="title1">{props.title}</Text>;
}

type Validator = {
  validate: (value?: string) => boolean;
  message?: string;
};

export function AuthFormInput({
  onValueChange,
  placeholder,
  secure,
  validators,
  value,
  ...props
}: {
  value: string | undefined;
  onValueChange: (value: string | undefined) => void;
  placeholder: string;
  secure?: boolean;
  validators?: Validator[];
} & TextInputProps) {
  const [id] = useState(Math.random().toString(6));
  const { isSubmitted, touchTrigger, touch, error } = useContext(_AuthFormContext);
  const [failedValidators, setFailedValidators] = useState<Validator[]>([]);
  const [touched, setTouched] = useState(false);
  const { colors } = useColorScheme();

  useEffect(() => {
    const failedValidators: Validator[] = [];
    for (const validator of validators ?? []) {
      if (!validator.validate(value)) {
        failedValidators.push(validator);
      }
    }

    setFailedValidators(failedValidators);
    error(id, failedValidators.length > 0);
  }, [value, touchTrigger]);

  const hasError = (isSubmitted || touched) && failedValidators.length > 0;
  const failedValidatorsWithMessage = failedValidators.filter((validator) =>
    notEmpty(validator.message)
  );

  return (
    <View className="flex-col gap-2">
      <TextInput
        value={value}
        onChangeText={(value) => {
          touch();
          setTouched(true);
          onValueChange(value);
        }}
        className="w-full"
        placeholder={placeholder}
        secureTextEntry={secure}
        style={{
          borderColor: hasError ? colors.destructive : undefined,
        }}
        {...props}
      />
      {hasError && failedValidatorsWithMessage.length > 0 && (
        <View className="flex-col gap-2">
          {failedValidatorsWithMessage.map((validator, i) => (
            <Text key={i} variant="caption1" className="text-destructive">
              {validator.message}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}
