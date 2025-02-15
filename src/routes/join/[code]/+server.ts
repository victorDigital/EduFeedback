import { json, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { eq } from 'drizzle-orm';
import { link } from '$lib/server/db/schema';
import { db } from '$lib/server/db';

export const GET: RequestHandler = async (event) => {
	const code = event.params.code;
	if (!code) {
		return redirect(302, '/');
	}

	const user = event.locals.user;
	if (!user) {
		return redirect(302, '/');
	}

	const [linkRow] = await db.select().from(link).where(eq(link.code, code.toUpperCase())).limit(1);

	console.log('Link:', linkRow);

	if (!linkRow) {
		return redirect(302, '/');
	}

	return redirect(302, `/lecture/${linkRow.lectureId}`);
};
