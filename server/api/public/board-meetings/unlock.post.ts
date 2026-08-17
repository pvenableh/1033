/**
 * POST /api/public/board-meetings/unlock
 *
 * Body: { passphrase: string }
 *
 * On success, marks this browser session as unlocked so the meetings feed
 * starts returning records. Rate limited per IP — a shared phrase is short and
 * guessable by definition, so unlimited attempts would defeat it.
 */
import { attemptUnlock } from '~/server/utils/meetingAccess';
import { rateLimit } from '~/server/utils/rateLimit';

const MAX_ATTEMPTS = 10;
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes

export default defineEventHandler(async (event) => {
	const body = await readBody(event);
	const submitted = typeof body?.passphrase === 'string' ? body.passphrase : '';

	if (!submitted.trim()) {
		throw createError({
			statusCode: 400,
			statusMessage: 'Bad Request',
			message: 'Enter the passphrase to continue.',
		});
	}

	const ip =
		getRequestHeader(event, 'x-forwarded-for')?.split(',')[0]?.trim() ||
		getRequestHeader(event, 'x-real-ip') ||
		'unknown';

	const { allowed, retryAfter } = rateLimit(`board-meetings-unlock:${ip}`, MAX_ATTEMPTS, WINDOW_MS);
	if (!allowed) {
		setResponseHeader(event, 'Retry-After', retryAfter);
		throw createError({
			statusCode: 429,
			statusMessage: 'Too Many Requests',
			message: `Too many attempts. Try again in ${Math.ceil(retryAfter / 60)} minute(s).`,
		});
	}

	const ok = await attemptUnlock(event, submitted);
	if (!ok) {
		throw createError({
			statusCode: 401,
			statusMessage: 'Unauthorized',
			message: "That phrase doesn't match. Check with the board if you need it.",
		});
	}

	return { unlocked: true };
});
