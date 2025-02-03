import { useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

export function useListenOnAppStateChange(...listenStates: AppStateStatus[]) {
  const [trigger, setTrigger] = useState({});

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (appState) => {
      if (!listenStates.includes(appState)) {
        return;
      }

      setTrigger({});
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return trigger;
}
