import { BottomSheetProps, BottomSheetView, useBottomSheetInternal } from '@gorhom/bottom-sheet';
import {
  Children,
  cloneElement,
  Dispatch,
  ReactElement,
  SetStateAction,
  useCallback,
  useEffect,
} from 'react';
import { SafeAreaView, View } from 'react-native';
import { cn } from '~/lib/cn';
import { Sheet, useSheetRef } from '~/components/nativewindui/Sheet';
import { TextInputProps } from '~/components/TextInput';
import { useScreenHasChanged } from '~/lib/useScreenHasChanged';

export function DynamicBottomSheet({
  open,
  onOpenChange,
  children,
  className,
  onClose,
  ...sheetProps
}: BottomSheetProps & {
  className?: string;
  open: boolean;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
}) {
  const ref = useSheetRef();

  useEffect(() => {
    if (open) {
      ref.current?.present();
    } else {
      ref.current?.dismiss();
    }
  }, [open]);

  useScreenHasChanged(() => ref.current?.close());

  return (
    <Sheet
      ref={ref}
      enableDynamicSizing={true}
      onDismiss={() => {
        onOpenChange(false);
        onClose?.();
        ref.current?.close();
      }}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      handleComponent={null}
      {...sheetProps}>
      <SafeAreaView>
        <BottomSheetView>
          <View className={cn('pb-safe-offset-4 mx-auto w-full gap-8 p-6', className)}>
            {children}
          </View>
        </BottomSheetView>
      </SafeAreaView>
    </Sheet>
  );
}

export function DynamicBottomSheetTextInput({
  children,
}: {
  children: ReactElement<TextInputProps>;
}) {
  const { shouldHandleKeyboardEvents } = useBottomSheetInternal();

  useEffect(() => {
    return () => {
      shouldHandleKeyboardEvents.value = false;
    };
  }, [shouldHandleKeyboardEvents]);

  const handleOnBlur = useCallback(
    () => (shouldHandleKeyboardEvents.value = false),
    [shouldHandleKeyboardEvents]
  );

  const handleOnFocus = useCallback(
    () => (shouldHandleKeyboardEvents.value = true),
    [shouldHandleKeyboardEvents]
  );

  const child = Children.only(children);

  return cloneElement(child, {
    onBlur: (event) => {
      handleOnBlur();
      child.props.onBlur?.(event);
    },
    onFocus: (event) => {
      handleOnFocus();
      child.props.onFocus?.(event);
    },
  });
}
