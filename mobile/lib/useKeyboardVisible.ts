import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

export function useKeyboardVisible() {
  const [keyboardHeight, setKeyboardHeight] = useState<number>();

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.select({ default: 'keyboardWillShow', android: 'keyboardDidShow' }),
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.select({ default: 'keyboardWillHide', android: 'keyboardDidHide' }),
      () => {
        setKeyboardHeight(undefined);
      }
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  return { keyboardVisible: !!keyboardHeight, keyboardHeight: keyboardHeight ?? 0 };
}
