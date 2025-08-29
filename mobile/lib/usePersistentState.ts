import AsyncStorage from '@react-native-async-storage/async-storage';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';

export function usePersistentState<Value>(
  key: string,
  initialValue: Value,
  loadingValue: Value
): [Value, Dispatch<SetStateAction<Value>>] {
  const [value, setValue] = useState<Value>(loadingValue);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(key);
        if (saved) {
          setValue(JSON.parse(saved));
        } else {
          setValue(initialValue);
        }
      } catch (err) {
        console.error('Failed to load activity IDs', err);
      }
    })();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(key, JSON.stringify(value)).catch((err) =>
      console.error('Failed to save activity IDs', err)
    );
  }, [value]);

  return [value, setValue];
}
