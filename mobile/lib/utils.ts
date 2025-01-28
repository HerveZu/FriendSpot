import { Duration } from 'date-fns';

export function capitalize(val: string) {
  return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}

export function notEmpty(value: string | undefined): boolean {
  return !!value && value.replace(/\s/g, '').length > 0;
}

export function minLength(length: number): (value?: string) => boolean {
  return (value?: string) => !!value && value.length >= length;
}

export function omitObj<T>(obj: T): T {
  const magicObj = obj as any;
  return Object.keys(magicObj).reduce((acc, key) => {
    if (magicObj[key] === undefined) {
      return acc;
    }
    // @ts-ignore
    acc[key] = obj[key];
    return acc;
  }, {}) as T;
}

export function parseDuration(duration: string): Duration {
  const timeSpanRegex = /(?:(\d+)\.)?(\d{1,2}):(\d{2}):(\d{2})(?:\.(\d+))?/;
  const match = timeSpanRegex.exec(duration);

  if (!match) {
    throw new Error('Invalid TimeSpan format');
  }

  const [
    ,
    // full match, unused
    days = '0',
    hours,
    minutes,
    seconds,
  ] = match;

  return {
    days: parseInt(days, 10),
    hours: parseInt(hours, 10),
    minutes: parseInt(minutes, 10),
    seconds: parseInt(seconds, 10),
  };
}
