import { useEffect, useState } from 'react';
import { Keyboard } from 'react-native';

export function useKeyboardVisible() {
  const [keyboardHeight, setKeyboardHeight] = useState<number>();

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardWillShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardWillHide', () => {
      setKeyboardHeight(undefined);
    });

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  return { keyboardVisible: !!keyboardHeight, keyboardHeight: keyboardHeight ?? 0 };
}
