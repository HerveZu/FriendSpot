import { useEffect, useState } from 'react';

export function useActualTime(intervalMs: number) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const handler = setInterval(() => {
      setTime(new Date());
    }, intervalMs);

    return () => clearTimeout(handler);
  }, [intervalMs]);

  return time;
}
