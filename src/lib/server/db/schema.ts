import {
	pgTable,
	serial,
	text,
	integer,
	timestamp,
	boolean,
	jsonb,
	uuid
} from 'drizzle-orm/pg-core';

export const user = pgTable('user', {
	id: text('id').primaryKey(),
	age: integer('age'),
	username: text('username').notNull(),
	passwordHash: text('password_hash'),
	isAnonymous: boolean('is_anonymous').notNull().default(true)
});

export const session = pgTable('session', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull()
});

//link a short join code to a lecture uuid
export const link = pgTable('link', {
	id: serial('id').primaryKey(),
	code: text('code').unique(),
	lectureId: uuid('lecture_id')
		.notNull()
		.references(() => lecture.id)
});

//a lecture has an id, a host, and an array of scores which is a foreign key to the score table
export const lecture = pgTable('lecture', {
	id: uuid().primaryKey().defaultRandom(),
	hostUserId: text('host_user_id')
		.notNull()
		.references(() => user.id),
	scores: jsonb('scores')
		.$type<
			Array<{
				id: string;
				value: number;
				at: string;
				submitterId: string;
			}>
		>()
		.default([]),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
	startedAt: timestamp('started_at', { withTimezone: true, mode: 'date' }),
	endedAt: timestamp('ended_at', { withTimezone: true, mode: 'date' }),
	eventTitle: text('event_title').notNull(),
	status: text('status')
		.notNull()
		.$type<'not_started' | 'active' | 'done'>()
		.default('not_started'),
	participants: jsonb('participants').$type<Array<string>>().default([])
});

export type Session = typeof session.$inferSelect;

export type User = typeof user.$inferSelect;

export type Link = typeof link.$inferSelect;

export type Lecture = typeof lecture.$inferSelect;

export type Score = {
	id: string;
	value: number;
	at: string;
	submitterId: string;
};
