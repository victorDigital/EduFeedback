import { db } from '$lib/server/db';
import { lecture as lectureTable, link } from '$lib/server/db/schema';
import { json } from '@sveltejs/kit';
import { customAlphabet } from 'nanoid';

import type { RequestHandler } from './$types';
import { eq } from 'drizzle-orm';

const alphabet = '123456789ABCDEFGHIJKLMPQRSTUVWXYZ';
const nanoid = customAlphabet(alphabet, 6);

export const POST: RequestHandler = async (event) => {
	if (!event.locals.user?.id) {
		return new Response('Unauthorized', { status: 401 });
	}

	let body = await event.request.json();

	if (!body.lectureId) {
		return new Response('Missing Lecture ID', { status: 400 });
	}

	const code = nanoid();

	try {
		//if a code already exists for this lecture, return that code and dont create a new one
		const [existingLink] = await db
			.select()
			.from(link)
			.where(eq(link.lectureId, body.lectureId))
			.limit(1);

		if (existingLink) {
			return json(existingLink);
		}

		const [linkRow] = await db
			.insert(link)
			.values({
				code,
				lectureId: body.lectureId
			})
			.returning();

		return json(linkRow); // Return the link object
	} catch (error) {
		console.error(error);
		return new Response('Internal Server Error', { status: 500 });
	}
};
