import { db } from '$lib/server/db';
import { lecture as lectureTable } from '$lib/server/db/schema';
import { count, eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load = (async (event) => {
	if (!event.locals.user?.id) {
		throw redirect(302, '/');
	}

	const [lectures] = await db
		.select({ count: count() })
		.from(lectureTable)
		.where(eq(lectureTable.hostUserId, event.locals.user.id));

	return { lectures };
}) satisfies PageServerLoad;
