import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { lecture, type Annotation } from '$lib/server/db/schema';
import { db } from '$lib/server/db';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async (event) => {
	if (!event.locals.user) return error(401, 'Unauthorized');
	if (!event.params.id) return error(400, 'Missing Lecture ID');
	const annotationData = await event.request.json();
	if (!annotationData) return error(400, 'Missing annotation data');
	const annotationText = annotationData.text;
	if (!annotationText) return error(400, 'Missing annotationText');

	const at = new Date();

	const annotation: Annotation = {
		at: at.getTime().toString(),
		text: annotationText,
		submitterId: event.locals.user.id
	};

	// Save annotation to database
	const [existingLecture] = await db
		.select({ annotations: lecture.annotations })
		.from(lecture)
		.where(eq(lecture.id, event.params.id))
		.limit(1);

	if (!existingLecture) return error(404, 'Lecture not found');

	const updatedAnnotation = [...(existingLecture.annotations || []), annotation];

	await db
		.update(lecture)
		.set({ annotations: updatedAnnotation })
		.where(eq(lecture.id, event.params.id));

	return new Response(JSON.stringify({ message: 'Annotation received' }), { status: 200 });
};
