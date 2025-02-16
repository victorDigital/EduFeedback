import { db } from '$lib/server/db';
import { lecture as lectureTable } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from '../$types';
import { redirect } from '@sveltejs/kit';

export const load = (async (event) => {
	if (!event.locals.user?.id) {
		throw redirect(302, '/');
	}

	const lectureId = event.params.id;
	console.log(`Lecture ID: ${lectureId}`);

	if (!lectureId) {
		throw redirect(302, '/');
	}

	let [lecture] = await db
		.select()
		.from(lectureTable)
		.where(eq(lectureTable.id, lectureId))
		.limit(1);

	if (!lecture) {
		throw redirect(302, '/');
	}

	return {
		lecture,
		isHost: lecture.hostUserId === event.locals.user.id,
		userId: event.locals.user.id
	};
}) satisfies PageServerLoad;
