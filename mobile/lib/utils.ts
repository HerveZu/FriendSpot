import { Duration } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

export function capitalize(val: string) {
  return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}

export function notEmpty(value: string | undefined): boolean {
  return !!value && value.replace(/\s/g, '').length > 0;
}

export function minLength(length: number): (value?: string) => boolean {
  return (value?: string) => !!value && value.length >= length;
}

export function omitUndefined<T>(obj: T): T {
  if (!obj) {
    return obj;
  }

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

type HexColor = `#${string}`;

export function rgbToHex(rgb: string): HexColor {
  const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!match) {
    throw new Error(`Invalid RGB format ${rgb}`);
  }

  const [, r, g, b] = match.map(Number);

  if ([r, g, b].some((num) => num < 0 || num > 255 || isNaN(num))) {
    throw new Error('RGB values must be between 0 and 255');
  }

  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}` as HexColor;
}

export function opacity(rgb: string, opacity: number): string {
  return rgb.replace('rgb', 'rgba').replace(')', `, ${opacity})`);
}

export function fromUtc(date: string | Date): Date {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return toZonedTime(date, timezone);
}

export function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}
