import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function longString() {
	let str = '';
	for (let i = 0; i < 20000; i++) {
		str += 'a';
	}
	return str;
}
