import { Falsy, View } from 'react-native';
import { useContext, useEffect, useState } from 'react';
import { FormContext } from '~/form/Form';
import { Text } from '~/components/nativewindui/Text';
import { TextInput, TextInputProps } from '~/components/TextInput';
import { useColorScheme } from '~/lib/useColorScheme';
import { notEmpty } from '~/lib/utils';

export type Validator = {
  validate: (value?: string) => boolean;
  errorMessage?: string;
};

export function FormInput({
  onValueChange,
  placeholder,
  secure,
  validators,
  value,
  error,
  ...props
}: {
  value: string | undefined;
  onValueChange: (value: string) => void;
  placeholder: string;
  secure?: boolean;
  validators?: Validator[];
  error?: string | Falsy;
} & TextInputProps) {
  const [id] = useState(Math.random().toString(6));
  const { isSubmitted, touchTrigger, touch, error: doError } = useContext(FormContext);
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
    doError(id, failedValidators.length > 0);
  }, [value, touchTrigger]);

  const hasError = (isSubmitted || touched) && (!!error || failedValidators.length > 0);
  const failedValidatorsWithMessage = failedValidators.filter((validator) =>
    notEmpty(validator.errorMessage)
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
      {hasError && (failedValidatorsWithMessage.length > 0 || !!error) && (
        <View className="flex-col gap-2">
          {[error, ...failedValidatorsWithMessage.map((validator) => validator.errorMessage)].map(
            (errorMessage, i) =>
              errorMessage && (
                <Text key={i} variant="caption1" className="text-destructive">
                  {errorMessage}
                </Text>
              )
          )}
        </View>
      )}
    </View>
  );
}
