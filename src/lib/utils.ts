import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Lecture } from './server/db/schema';

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

export const computeStatus = (lecture: Lecture): 'not_started' | 'active' | 'done' => {
	if (lecture.status === 'not_started') {
		return 'not_started';
	}

	console.log(Date.now(), lecture.endedAt?.getTime() ?? 0);

	if (
		lecture.status === 'started' &&
		(Date.now() < (lecture.endedAt?.getTime() ?? 0) || lecture.endedAt === null)
	) {
		return 'active';
	}

	return 'done';
};
