import { db } from '$lib/server/db';
import { lecture as lectureTable, type Lecture } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from '../$types';
import { redirect } from '@sveltejs/kit';
import { date } from 'drizzle-orm/mysql-core';
import { computeStatus } from '$lib/utils';

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

	console.log(computeStatus(lecture));

	return {
		lecture,
		status: computeStatus(lecture),
		isHost: lecture.hostUserId === event.locals.user.id,
		userId: event.locals.user.id
	};
}) satisfies PageServerLoad;
