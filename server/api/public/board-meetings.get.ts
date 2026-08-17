/**
 * GET /api/public/board-meetings?year=2026
 *
 * Public, unauthenticated feed of published board meetings for a single
 * calendar year. Powers the standalone /board-meetings page.
 *
 * Everything is filtered and reshaped here rather than in the page so the
 * public payload only ever carries fields we intend to publish — no internal
 * notes, attendee lists, draft meetings, or user metadata leak out.
 *
 * Uses the admin static token when configured and falls back to the
 * unauthenticated client (public role) so local dev works without a token.
 */
import { useDirectusAdmin, getPublicDirectus, readItems } from '~/server/utils/directus';
import { getMeetingAccessConfig, isUnlocked } from '~/server/utils/meetingAccess';

interface RawFile {
	id?: string;
	title?: string | null;
	tags?: string[] | null;
	filename_download?: string | null;
	type?: string | null;
	filesize?: number | string | null;
}

export interface PublicMeetingFile {
	id: string;
	name: string;
	type: string | null;
	size: number | null;
	url: string;
}

export interface PublicMeetingPresentation {
	id: number;
	title: string;
	url: string;
}

export interface PublicMeetingAnnouncement {
	id: number;
	title: string;
	/** Public "view in browser" page for the sent announcement. */
	url: string;
	date: string | null;
}

export interface PublicMeetingRecording {
	/** Share URL (Zoom cloud recording, or an uploaded video file). */
	url: string;
	/** Passcode Zoom issues with the share link, when one is set. */
	passcode: string | null;
}

export interface PublicMeeting {
	id: number;
	title: string;
	description: string | null;
	date: string;
	time: string | null;
	location: string | null;
	isVirtual: boolean;
	isPast: boolean;
	/** How many people are linked to the meeting. Count only — never the names. */
	attendeeCount: number;
	canceled: boolean;
	cancellationNote: string | null;
	tags: string[];
	agenda: PublicMeetingFile | null;
	minutes: PublicMeetingFile | null;
	presentations: PublicMeetingPresentation[];
	announcements: PublicMeetingAnnouncement[];
	/** Recording of a past meeting. Never present before the meeting happens. */
	recording: PublicMeetingRecording | null;
	/** Live Zoom link. Only present for an upcoming meeting — it's dead after. */
	joinLink: string | null;
	/** Any remaining attachments that aren't the agenda, minutes, or a recording. */
	documents: PublicMeetingFile[];
	/** Present only while locked: what exists, without revealing where. */
	lockedCounts?: {
		agenda: boolean;
		minutes: boolean;
		presentations: number;
		announcements: number;
		recording: boolean;
	};
}

/** Case-insensitive tag match against a Directus file's tag list. */
function hasTag(file: RawFile | null | undefined, ...tags: string[]) {
	if (!file?.tags?.length) return false;
	const normalized = file.tags.map((t) => String(t).toLowerCase());
	return tags.some((tag) => normalized.includes(tag.toLowerCase()));
}

export default defineEventHandler(async (event) => {
	const config = useRuntimeConfig();
	const directusUrl = config.public.directusUrl;

	// Default to the year the page is built around; ignore anything non-numeric.
	const requested = Number(getQuery(event).year);
	const year = Number.isInteger(requested) && requested > 1900 && requested < 3000 ? requested : 2026;

	const toFile = (raw: RawFile | null | undefined): PublicMeetingFile | null => {
		if (!raw?.id) return null;
		return {
			id: raw.id,
			name: raw.title || raw.filename_download || 'Document',
			type: raw.type || null,
			size: raw.filesize != null ? Number(raw.filesize) : null,
			url: `${directusUrl}/assets/${raw.id}`,
		};
	};

	let client;
	try {
		client = useDirectusAdmin();
	} catch {
		// No static token configured (e.g. local dev) — read as the public role.
		client = getPublicDirectus();
	}

	let rows: any[];
	try {
		rows = (await client.request(
			readItems('meetings', {
				fields: [
					// `*` rather than a scalar whitelist so the query keeps working
					// before/after `pnpm setup:meeting-records` adds the newer columns.
					// Nothing leaks: the response is reshaped field-by-field below.
					'*',
					'agenda_file.id',
					'agenda_file.title',
					'agenda_file.filename_download',
					'agenda_file.type',
					'agenda_file.filesize',
					'minutes_file.id',
					'minutes_file.title',
					'minutes_file.filename_download',
					'minutes_file.type',
					'minutes_file.filesize',
					'files.directus_files_id.id',
					'files.directus_files_id.title',
					'files.directus_files_id.tags',
					'files.directus_files_id.filename_download',
					'files.directus_files_id.type',
					'files.directus_files_id.filesize',
					'presentations.presentations_id.id',
					'presentations.presentations_id.title',
					'presentations.presentations_id.url',
					'presentations.presentations_id.status',
					'announcements.announcements_id.id',
					'announcements.announcements_id.title',
					'announcements.announcements_id.url',
					'announcements.announcements_id.status',
					'announcements.announcements_id.private',
					'announcements.announcements_id.date_sent',
				],
				filter: {
					status: { _eq: 'published' },
					date: { _between: [`${year}-01-01`, `${year}-12-31`] },
				},
				// Newest first — the most recent meeting is the one people came for.
				sort: ['-date', '-time'],
				limit: -1,
			} as any)
		)) as any[];
	} catch (error: any) {
		console.error('Fetch public board meetings error:', error);
		throw createError({
			statusCode: 502,
			statusMessage: 'Bad Gateway',
			message: 'Failed to load board meetings',
		});
	}

	// Compare on the date string so the result doesn't depend on server timezone.
	const today = new Date().toISOString().slice(0, 10);

	const meetings: PublicMeeting[] = (rows || []).map((row) => {
		const attached: RawFile[] = (row.files || [])
			.map((entry: any) => entry?.directus_files_id)
			.filter((file: RawFile | null) => Boolean(file?.id));

		// Newer meetings use the dedicated agenda_file/minutes_file fields; older
		// ones only have tagged entries in the shared `files` list. Support both.
		const agenda = toFile(row.agenda_file) || toFile(attached.find((f) => hasTag(f, 'Agenda')));
		const minutes = toFile(row.minutes_file) || toFile(attached.find((f) => hasTag(f, 'Minutes')));
		const recordingFile = toFile(attached.find((f) => hasTag(f, 'Recording', 'Video')));

		const usedIds = new Set([agenda?.id, minutes?.id, recordingFile?.id].filter(Boolean));
		const documents = attached
			.map(toFile)
			.filter((f): f is PublicMeetingFile => Boolean(f) && !usedIds.has(f!.id));

		const presentations: PublicMeetingPresentation[] = (row.presentations || [])
			.map((entry: any) => entry?.presentations_id)
			.filter((p: any) => p?.url && p?.status === 'published')
			.map((p: any) => ({
				id: p.id,
				title: p.title || 'Presentation',
				url: `/presentations/${p.url}`,
			}));

		// The board curates these in Directus, but re-filter here anyway: an
		// announcement that was never sent, or one flagged Private, must not be
		// published just because someone attached it to a meeting.
		const announcements: PublicMeetingAnnouncement[] = (row.announcements || [])
			.map((entry: any) => entry?.announcements_id)
			// Status is stored inconsistently ("sent" and "Sent" both occur), so
			// compare case-insensitively — an exact match silently drops records.
			// `private` is typed as 'Private' | null but holds booleans in practice,
			// so treat any truthy value as private rather than trusting one shape.
			.filter((a: any) => a?.url && String(a.status).toLowerCase() === 'sent' && !a.private)
			.map((a: any) => ({
				id: a.id,
				title: a.title || 'Announcement',
				url: `/announcements/email/${a.url}`,
				date: a.date_sent || null,
			}));

		const isPast = String(row.date) < today;
		const canceled = row.canceled === true;

		// The recording lives on its own field so it never gets confused with the
		// live Zoom link. An uploaded file wins over an external share URL.
		const recordingUrl = recordingFile?.url || row.recording_link || null;
		const recording: PublicMeetingRecording | null =
			recordingUrl && !canceled
				? { url: recordingUrl, passcode: row.recording_passcode || null }
				: null;

		return {
			id: row.id,
			title: row.title || row.category || 'Board Meeting',
			description: row.description || null,
			date: row.date,
			time: row.time || null,
			location: row.location || null,
			// Virtual if the location says so OR a live link exists — the two are
			// separate facts, so a Community Room meeting that also streams counts.
			isVirtual: /zoom|online|virtual|teams|meet/i.test(String(row.location || '')) || Boolean(row.video_link),
			isPast,
			// `people` comes back as junction ids under `*`, so counting it never
			// pulls a name into the public payload.
			attendeeCount: Array.isArray(row.people) ? row.people.length : 0,
			canceled,
			cancellationNote: canceled ? row.cancellation_note || null : null,
			// `tags` is a JSON field; tolerate null, a real array, or a stray string.
			tags: Array.isArray(row.tags)
				? row.tags.filter((t: unknown) => typeof t === 'string' && t.trim()).map((t: string) => t.trim())
				: typeof row.tags === 'string' && row.tags.trim()
					? [row.tags.trim()]
					: [],
			agenda,
			minutes,
			presentations,
			announcements,
			recording,
			// video_link is the live Zoom room. It's dead once the meeting is over,
			// so it's withheld from past and canceled meetings rather than shown broken.
			joinLink: isPast || canceled ? null : row.video_link || null,
			documents,
		};
	});

	// The schedule is always public; the records are gated. Stripping happens
	// HERE rather than in the template because Nuxt serialises this response
	// into the SSR payload — a v-if hides the button but still ships the URL.
	const { passphrase, hint } = await getMeetingAccessConfig();
	const unlocked = await isUnlocked(event, passphrase);

	if (!unlocked) {
		return {
			year,
			locked: true,
			hint,
			meetings: meetings.map((m) => ({
				...m,
				agenda: null,
				minutes: null,
				presentations: [],
				announcements: [],
				recording: null,
				joinLink: null,
				documents: [],
				// Keep the counts so the UI can say what's behind the lock without
				// revealing where any of it lives.
				lockedCounts: {
					agenda: Boolean(m.agenda),
					minutes: Boolean(m.minutes),
					presentations: m.presentations.length,
					announcements: m.announcements.length,
					recording: Boolean(m.recording),
				},
			})),
		};
	}

	return { year, locked: false, hint: null, meetings };
});
