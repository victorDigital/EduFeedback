import { error, type Handle } from '@sveltejs/kit';
import * as auth from '$lib/server/auth.js';

const handleAuth: Handle = async ({ event, resolve }) => {
	let sessionToken = event.cookies.get(auth.sessionCookieName);
	if (!sessionToken) {
		try {
			sessionToken = await auth.createAnonymousUser(event);
		} catch (_) {
			return error(500, 'Error creating anonymous user');
		}
	}

	const { session, user } = await auth.validateSessionToken(sessionToken);
	if (session) {
		auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);
	} else {
		auth.deleteSessionTokenCookie(event);
	}

	event.locals.user = user;
	event.locals.session = session;
	return resolve(event);
};

export const handle: Handle = handleAuth;
