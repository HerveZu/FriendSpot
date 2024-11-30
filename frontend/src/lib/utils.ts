import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function blerp(a: number, b: number, t: number) {
	const range = Math.abs(b - a)
	const progress = range * ((Math.cos(t * Math.PI - Math.PI) + 1) / 2 % range)

	return a + progress;
}
