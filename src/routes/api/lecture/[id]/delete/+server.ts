import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { lecture, link } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const DELETE: RequestHandler = async (event) => {
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

	//delete the lecture
	await db.delete(link).where(eq(link.lectureId, event.params.id!)); //remove the invitation links
	await db.delete(lecture).where(eq(lecture.id, event.params.id!));

	console.log(`Lecture ${event.params.id} deleted by user ${event.locals.user.id}`);
	return new Response('Lecture deleted successfully', { status: 200 });
};
