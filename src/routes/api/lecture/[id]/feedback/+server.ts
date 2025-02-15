import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { lecture, type Score } from '$lib/server/db/schema';
import { db } from '$lib/server/db';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async (event) => {
	if (!event.locals.user) return error(401, 'Unauthorized');
	if (!event.params.id) return error(400, 'Missing Lecture ID');
	const feedbackData = await event.request.json();
	if (!feedbackData) return error(400, 'Missing feedback data');
	const sentiment = feedbackData.sentiment;
	if (sentiment === null) return error(400, 'Missing sentiment');

	const at = new Date();

	const feedback: Score = {
		at: at.getTime().toString(),
		value: sentiment,
		id: event.params.id,
		submitterId: event.locals.user.id
	};

	// Save feedback to database
	const [existingLecture] = await db
		.select({ scores: lecture.scores })
		.from(lecture)
		.where(eq(lecture.id, event.params.id))
		.limit(1);

	if (!existingLecture) return error(404, 'Lecture not found');

	const updatedScores = [...(existingLecture.scores || []), feedback];

	await db.update(lecture).set({ scores: updatedScores }).where(eq(lecture.id, event.params.id));

	return new Response(JSON.stringify({ message: 'Feedback received' }), { status: 200 });
};
