import { useEffect, useState } from 'react';
import { useSegments } from 'expo-router';

export function useScreenHasChanged() {
  const [changeCount, setChangeCount] = useState(0);

  const segments = useSegments();

  useEffect(() => {
    setChangeCount((x) => x + 1);
  }, [segments, setChangeCount]);

  return { hasChanged: changeCount > 0, changeCount };
}
