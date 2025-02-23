import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { lecture } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async (event) => {
	if (!event.locals.user?.id) {
		return error(401, 'Unauthorized');
	}

	if (!event.params.id) {
		return error(400, 'Missing Lecture ID');
	}

	//get the requested body and parse it
	const body = await event.request.json();
	if (!body) {
		return error(400, 'Missing body');
	}

	if (!body.duration && body.duration !== 0) {
		// duration is in minutes
		return error(400, 'Missing duration');
	}

	let endDate: Date | undefined;
	if (body.duration !== 0) {
		endDate = new Date();
		endDate.setMinutes(endDate.getMinutes() + body.duration);
		console.log('End date:');
		console.log(endDate);
	}

	const [lectureRow] = await db
		.select()
		.from(lecture)
		.where(eq(lecture.id, event.params.id!))
		.limit(1);
	if (!lectureRow) {
		return error(404, 'Lecture not found');
	}

	//if the host in not the current user, return an error
	if (lectureRow.hostUserId !== event.locals.user.id) {
		return error(403, 'Forbidden');
	}

	//start the lecture
	if (body.duration !== 0 && endDate) {
		await db
			.update(lecture)
			.set({ startedAt: new Date(), status: 'started', endedAt: endDate })
			.where(eq(lecture.id, event.params.id!));
	} else {
		await db
			.update(lecture)
			.set({ startedAt: new Date(), status: 'started' })
			.where(eq(lecture.id, event.params.id!));
	}

	console.log(`Lecture ${event.params.id} started by user ${event.locals.user.id}`);
	return new Response();
};
