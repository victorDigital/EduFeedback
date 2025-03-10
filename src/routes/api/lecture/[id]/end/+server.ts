import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { lecture, link } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async (event) => {
	if (!event.locals.user?.id) {
		return error(401, 'Unauthorized');
	}

	if (!event.params.id) {
		return error(400, 'Missing Lecture ID');
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
	await db
		.update(lecture)
		.set({ endedAt: new Date(), status: 'started' })
		.where(eq(lecture.id, event.params.id!));

	await db.delete(link).where(eq(link.lectureId, event.params.id!)); //remove the invitation links

	console.log(`Lecture ${event.params.id} ended by user ${event.locals.user.id}`);
	return new Response();
};
