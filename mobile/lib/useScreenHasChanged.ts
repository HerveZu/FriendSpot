import { useEffect, useState } from 'react';
import { useSegments } from 'expo-router';

export function useScreenHasChanged(onChange: () => void) {
  const [, setPreviousSegments] = useState<string[]>();

  const segments = useSegments();

  useEffect(() => {
    setPreviousSegments((previousSegments) => {
      if (!previousSegments) {
        return segments;
      }

      onChange();

      return segments;
    });
  }, [segments]);
}
