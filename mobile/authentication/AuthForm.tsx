import {
  Component,
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
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TouchableWithoutFeedback,
  useAnimatedValue,
  View,
} from 'react-native';
import { Modal } from '~/components/Modal';
import { ModalTitle } from '~/components/Modal';

import { BackButton } from '~/components/BackButton';
import { Screen } from '~/components/Screen';
import { TextInput, TextInputProps } from '~/components/TextInput';
import { Button } from '~/components/nativewindui/Button';
import { Text } from '~/components/nativewindui/Text';
import { useColorScheme } from '~/lib/useColorScheme';
import { notEmpty } from '~/lib/utils';
import { isEmail } from 'validator';
import { useKeyboardVisible } from '~/lib/useKeyboardVisible';
import { getAuth, sendPasswordResetEmail } from "firebase/auth";

type AuthFormContext = {
  error: (id: string, error: boolean) => void;
  touch: () => void;
  isSubmitted: boolean;
  touchTrigger: object;
  preFilled: boolean;
  displayForgotPassword?: boolean;
};

const _AuthFormContext = createContext<AuthFormContext>(null!);

type IllustrationProps = {
  width: number;
  height: number;
};

interface Illustration {
  new (props: IllustrationProps): Component<IllustrationProps>;
}

export function AuthForm({
  Illustration,
  preFilled = false,
  displayForgotPassword = false,
  ...props
}: {
  title: ReactNode;
  error?: string;
  onSubmit: () => Promise<void>;
  submitText: string;
  Illustration?: Illustration;
  preFilled?: boolean;
  displayForgotPassword?: boolean;
} & PropsWithChildren) {
  const [inputErrors, setInputErrors] = useState<string[]>([]);
  const [isTouched, setIsTouched] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [pendingAction, setPendingAction] = useState(false);
  const [touchTrigger, setTouchTrigger] = useState({});
  const [isOpen, setIsOpen] = useState(false)
  const [email, setEmail] = useState<string>('')
  const auth = getAuth();
  const { colors } = useColorScheme();
  const [resetEmailStatus, setResetEmailStatus] = useState('Envoyer');

  async function handleSubmit() {
    try {
      await sendPasswordResetEmail(auth, email)
      setPendingAction(true)
      setResetEmailStatus('Envoie en cours..');
      setTimeout(() => {
        setIsOpen(false);
        setEmail('')
        setPendingAction(false)
        setResetEmailStatus('Envoyer');
      }, 500);
    } catch (error) {
      console.error(error);
    }
  }

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

  const { keyboardVisible } = useKeyboardVisible();
  const illustrationProgress = useAnimatedValue(1);

  useEffect(() => {
    Animated.timing(illustrationProgress, {
      toValue: keyboardVisible ? 0 : 1,
      duration: 100,
      useNativeDriver: false,
    }).start();
  }, [keyboardVisible]);

  return (
    <_AuthFormContext.Provider value={{ touchTrigger, preFilled, isSubmitted, touch, error }}>
      <KeyboardAvoidingView behavior={'height'}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <Screen className="relative flex h-full flex-col justify-between gap-12">
            <View className="relative w-full flex-row items-center justify-center">
              <BackButton className="absolute left-0" />
              <View className="self-center">{props.title}</View>
            </View>

            {isOpen && (
              <>
                <Modal open={isOpen} onOpenChange={setIsOpen} className='gap-4'>
                  <ModalTitle text='Entre ton adresse e-mail'/>
                  <View className='flex-row items-center '>
                      <Text className='text-foreground text-sm'>On t’enverra un lien pour réinitialiser ton mot de passe. Assure-toi que l’adresse est valide.</Text>
                  </View>
                  <AuthFormInput
                    value={email}
                    onValueChange={(value) => setEmail(value || '')}
                    placeholder="Adresse email"
                    inputMode="email"
                    autoCapitalize="none"
                    keyboardType="email-address"                      
                    validators={[
                      {
                        validate: (email) => !email || isEmail(email),
                        message: "L'adresse e-mail n'est pas valide",
                      },
                      {
                        validate: notEmpty,
                      },
                    ]}
                  />
                  <Button
                    size={Platform.select({ default: 'md' })}
                    disabled={!isTouched && (!preFilled || inputErrors.length > 0)}
                    onPress={() => handleSubmit()}
                    variant="primary"
                    className="w-full">
                    {pendingAction && <ActivityIndicator color={colors.foreground} />}
                    <Text>{resetEmailStatus}</Text>
                  </Button>
                </Modal>
                </>
            )}

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
            <Button
              size={Platform.select({ ios: 'lg', default: 'md' })}
              disabled={!isTouched && (!preFilled || inputErrors.length > 0)}
              onPress={() => {
                setPendingAction(true);
                setIsSubmitted(true);
                
                props.onSubmit().finally(() => setPendingAction(false));
              }}
              variant="primary"
              className="w-full">
              {pendingAction && <ActivityIndicator color={colors.foreground} />}
              <Text>{props.submitText}</Text>
            </Button>
              {displayForgotPassword && (
                <Pressable className="flex-row justify-center" onPress={() => setIsOpen(true)}>
                  <Text variant="footnote" className="text-foreground">
                    Mot de passe oublié ?
                  </Text>
                </Pressable>
              )}
          </Screen>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </_AuthFormContext.Provider>
  );
}

export function AuthFormTitle(props: { title: string }) {
  return (
    <Text variant="title1" className="font-semibold">
      {props.title}
    </Text>
  );
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
