import { db } from '$lib/server/db';
import { lecture as lectureTable } from '$lib/server/db/schema';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
	if (!event.locals.user?.id) {
		return new Response('Unauthorized', { status: 401 });
	}

	let body = await event.request.json();

	console.log(`Event Title: ${body.name}`);

	if (!body.name) {
		return new Response('Missing Event Title', { status: 400 });
	}

	console.log(`User ID: ${event.locals.user.id}`);

	try {
		const [lecture] = await db
			.insert(lectureTable)
			.values({
				hostUserId: event.locals.user.id,
				eventTitle: body.name
			})
			.returning();

		console.log(`Lecture ID: ${lecture.id}`);

		return json(lecture); // Return the lecture object
	} catch (error) {
		console.error(error);
		return new Response('Internal Server Error', { status: 500 });
	}
};
