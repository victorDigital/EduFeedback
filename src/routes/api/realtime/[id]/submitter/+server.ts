import { db } from '$lib/server/db';
import { lecture, type Score } from '$lib/server/db/schema';
import { longString } from '$lib/utils';
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

	await connect(event.params.id, event.locals.user.id);

	return produce(
		async function start({ emit }) {
			emit('heartbeat', longString()); // Initial heartbeat to flush the connection
			emit('message', 'hello');
			while (true) {
				const { error: statusError } = await sendStatus(emit, event.params.id ?? '');
				if (statusError) return;

				const { error: canSendFeedbackError } = await sendCanSendFeedback(
					emit,
					event.params.id ?? '',
					event.locals.user?.id ?? ''
				);
				if (canSendFeedbackError) return;

				await delay(5000);
			}
		},
		{
			ping: 10000,
			stop() {
				disconnect(event.params.id ?? '', event.locals.user?.id ?? '');
				console.log('Connection stopped.');
			},
			headers: {
				'Cache-Control': 'no-cache',
				Connection: 'keep-alive',
				'X-Accel-Buffering': 'no'
			}
		}
	);
};

async function connect(id: string, userId: string) {
	const [row] = await db
		.select({ participants: lecture.participants })
		.from(lecture)
		.where(eq(lecture.id, id))
		.limit(1);
	if (!row) throw new Error('Lecture not found');
	if (!row.participants) row.participants = [];
	if (!row.participants.includes(userId)) row.participants.push(userId);
	await db
		.update(lecture)
		.set({ participants: row.participants })
		.where(eq(lecture.id, id))
		.execute(); // Added execute() method back
	console.log(`User ${userId} has been connected to lecture ${id}.`);
}

async function disconnect(id: string, userId: string) {
	const [row] = await db
		.select({ participants: lecture.participants })
		.from(lecture)
		.where(eq(lecture.id, id))
		.limit(1);
	if (!row) throw new Error('Lecture not found');
	if (!row.participants) row.participants = [];
	if (row.participants.includes(userId))
		row.participants.splice(row.participants.indexOf(userId), 1);
	await db
		.update(lecture)
		.set({ participants: row.participants })
		.where(eq(lecture.id, id))
		.execute(); // Added execute() method back
	console.log(`User ${userId} has been disconnected from lecture ${id}.`);
}

async function sendStatus(
	emit: (eventName: string, data: string) => Unsafe<void, Error>,
	id: string
) {
	const [row] = await db
		.select({ status: lecture.status })
		.from(lecture)
		.where(eq(lecture.id, id))
		.limit(1);
	if (!row) throw new Error('Lecture not found');
	if (!row.status) return error(500, 'Lecture status not found');
	const statusMessage = row.status;
	return emit('status', statusMessage);
}

async function sendCanSendFeedback(
	emit: (eventName: string, data: string) => Unsafe<void, Error>,
	id: string,
	userId: string
) {
	const [row] = await db
		.select({ scores: lecture.scores })
		.from(lecture)
		.where(eq(lecture.id, id))
		.limit(1);
	if (!row) throw new Error('Lecture not found');
	if (!row.scores) return emit('canSendFeedback', 'true');
	const scores = row.scores;
	// Loop through scores and find the latest score submitted by the user, if the user has submitted a score within the last 1 minute, they cannot submit another score; otherwise, they can. If the user has not submitted a score, they can submit a score.
	for (let i = scores.length - 1; i >= 0; i--) {
		if (scores[i].submitterId === userId) {
			const now = new Date();
			const scoreDate = parseInt(scores[i].at);
			if (now.getTime() - scoreDate < 60000) {
				emit('whenCanSendFeedback', (scoreDate + 60000).toString());
				return emit('canSendFeedback', 'false');
			}
		}
	}
	return emit('canSendFeedback', 'true');
}
