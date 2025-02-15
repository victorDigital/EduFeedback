import { db } from '$lib/server/db';
import { lecture, type Score } from '$lib/server/db/schema';
import { error, type RequestHandler } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { produce, type Unsafe } from 'sveltekit-sse';

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

	console.log('Connected to lecture:', event.params.id);

	return produce(
		async function start({ emit }) {
			emit('message', 'hello');
			while (true) {
				const { error: statusError } = await sendScores(emit, event.params.id ?? '');
				if (statusError) return;

				await delay(5000);
			}
		},
		{
			ping: 10000,
			stop() {
				console.log('Connection stopped.');
			}
		}
	);
};

async function sendScores(
	emit: (eventName: string, data: string) => Unsafe<void, Error>,
	id: string
) {
	const [row] = await db
		.select({ scores: lecture.scores })
		.from(lecture)
		.where(eq(lecture.id, id))
		.limit(1);
	if (!row) {
		return { error: new Error('Lecture not found') };
	}

	const scores = row.scores || [];
	return emit('scores', JSON.stringify(scores));
}
