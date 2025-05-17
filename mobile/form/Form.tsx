import { createContext, PropsWithChildren, useCallback, useMemo, useState } from 'react';

export const FormContext = createContext<{
  error: (id: string, error: boolean) => void;
  touch: () => void;
  isSubmitted: boolean;
  isLoading: boolean;
  isValid: boolean;
  touchTrigger: object;
  handleSubmit: (callback: () => Promise<void>) => () => Promise<void>;
}>(null!);

export type FormProps = { autoTouch?: boolean; disabled?: boolean } & PropsWithChildren;

export function Form({ autoTouch, ...props }: FormProps) {
  const [inputErrors, setInputErrors] = useState<string[]>([]);
  const [isTouched, setIsTouched] = useState(autoTouch);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [touchTrigger, setTouchTrigger] = useState({});

  const isValid = useMemo(
    () => !props.disabled && !!isTouched && inputErrors.length === 0,
    [props.disabled, isTouched, inputErrors]
  );

  const error = useCallback(
    (inputId: string, error: boolean) => {
      if (error) {
        setInputErrors((errors) => [...new Set([...errors, inputId])]);
        return;
      }

      setInputErrors((errors) => errors.filter((otherId) => otherId !== inputId));
    },
    [setInputErrors]
  );

  const touch = useCallback(() => {
    setIsTouched(true);
    setTouchTrigger({});
  }, [setIsTouched, setTouchTrigger]);

  const handleSubmit = useCallback(
    (callback: () => Promise<void>) => {
      return async () => {
        if (!isValid) {
          throw new Error('Cannot submit form has it is not valid.');
        }

        setIsLoading(true);

        try {
          await callback();
        } finally {
          setIsLoading(false);
        }

        setIsSubmitted(true);
      };
    },
    [setIsLoading, setIsSubmitted, isValid]
  );

  return (
    <FormContext.Provider
      {...props}
      value={{ error, touch, handleSubmit, isSubmitted, touchTrigger, isLoading, isValid }}
    />
  );
}
