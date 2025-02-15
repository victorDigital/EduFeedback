import { db } from '$lib/server/db';
import { lecture } from '$lib/server/db/schema';
import { error, type RequestHandler } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { produce } from 'sveltekit-sse';

function delay(milliseconds: number) {
	return new Promise(function run(resolve) {
		setTimeout(resolve, milliseconds);
	});
}

export const POST: RequestHandler = async (event) => {
	if (!event.locals.user) {
		return error(401, 'Unauthorized');
	}

	if (!event.params.id) {
		return error(400, 'Missing Lecture ID');
	}

	const [lectureRow] = await db
		.select({ participants: lecture.participants })
		.from(lecture)
		.where(eq(lecture.id, event.params.id!))
		.limit(1);
	if (!lectureRow) {
		return error(404, 'Lecture not found');
	}

	console.log(lectureRow.participants?.length);

	return produce(
		async function start({ emit }) {
			while (true) {
				const [lectureRow] = await db
					.select({ participants: lecture.participants })
					.from(lecture)
					.where(eq(lecture.id, event.params.id!))
					.limit(1);
				if (!lectureRow) {
					return;
				}

				const participants = lectureRow.participants?.length || 0;
				const { error } = emit('message', participants.toString());
				if (error) {
					return;
				}
				await delay(5000);
			}
		},
		{
			headers: {
				'Cache-Control': 'no-cache',
				Connection: 'keep-alive',
				'X-Accel-Buffering': 'no'
			}
		}
	);
};
