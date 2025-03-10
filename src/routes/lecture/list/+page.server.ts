import { db } from '$lib/server/db';
import { lecture as lectureTable } from '$lib/server/db/schema';
import { count, desc, eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load = (async (event) => {
	if (!event.locals.user?.id) {
		throw redirect(302, '/');
	}

	const lectures = await db
		.select()
		.from(lectureTable)
		.where(eq(lectureTable.hostUserId, event.locals.user.id))
		.orderBy(desc(lectureTable.createdAt));

	return { lectures };
}) satisfies PageServerLoad;
