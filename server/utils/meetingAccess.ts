/**
 * Shared helpers for the /board-meetings passphrase gate.
 *
 * The schedule itself is always public. The *records* — agendas, minutes,
 * presentations, announcements, recordings and live links — are withheld by the
 * API until the visitor unlocks them. Withholding happens server-side because
 * Nuxt serialises fetched data into the SSR payload: a template-level v-if
 * hides a button but still ships the URL in the page source.
 *
 * TEMPORARY BY DESIGN. This is a shared-phrase bridge until residents have real
 * accounts; once they do, the records move behind authentication proper.
 *
 * The swap is deliberately small: `isUnlocked()` is the single decision point.
 * Replace its body with a session/role check (see getUserSession in
 * server/utils/session.ts) and the endpoint, the page's `locked` flag and the
 * whole locked-state UI keep working unchanged. At that point the `site_access`
 * singleton, the unlock endpoint, and this file's passphrase plumbing can all
 * be deleted in one go.
 *
 * Known limit while it's in use: the gate hides *discovery* of the file URLs,
 * not the files. Directus serves assets publicly, so a link shared once keeps
 * working and survives a passphrase rotation. Real auth plus a proxied asset
 * route is what closes that — not worth building for an interim measure.
 */
import { timingSafeEqual } from 'node:crypto';
import type { H3Event } from 'h3';
import { useDirectusAdmin } from '~/server/utils/directus';
import { readSingleton } from '@directus/sdk';

const SESSION_NAME = 'board-meetings-access';

/** Normalised so "Flamingo Park" and " flamingo  park " both match. */
function normalize(value: string) {
	return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Constant-time compare so response timing can't be used to guess the phrase. */
function safeEqual(a: string, b: string) {
	const bufA = Buffer.from(a, 'utf8');
	const bufB = Buffer.from(b, 'utf8');
	if (bufA.length !== bufB.length) {
		// Still burn a comparison so the mismatch-length path isn't measurably faster.
		timingSafeEqual(bufA, bufA);
		return false;
	}
	return timingSafeEqual(bufA, bufB);
}

export interface MeetingAccessConfig {
	passphrase: string | null;
	hint: string | null;
}

/**
 * Read the configured phrase. Lives in the `site_access` singleton, which has
 * no Directus public permission — only this admin-token read can see it.
 */
export async function getMeetingAccessConfig(): Promise<MeetingAccessConfig> {
	try {
		const client = useDirectusAdmin();
		const row: any = await client.request(
			readSingleton('site_access', { fields: ['meetings_passphrase', 'meetings_hint'] } as any)
		);
		const passphrase = row?.meetings_passphrase?.trim() || null;
		return { passphrase, hint: row?.meetings_hint?.trim() || null };
	} catch (error) {
		// If the singleton isn't set up yet, fail OPEN rather than locking the
		// board out of their own records — an unconfigured gate is not a gate.
		console.error('Meeting access config read failed:', error);
		return { passphrase: null, hint: null };
	}
}

function sessionOptions() {
	const config = useRuntimeConfig();
	// Reuses NUXT_SESSION_PASSWORD (nuxt-auth-utils' secret) to seal the cookie,
	// under a distinct name so it never collides with the resident auth session.
	const password = (config.session as { password?: string } | undefined)?.password ?? '';
	return {
		name: SESSION_NAME,
		password,
		// No maxAge → a session cookie, cleared when the browser closes.
		cookie: {
			httpOnly: true,
			sameSite: 'lax' as const,
			secure: !import.meta.dev,
			path: '/',
		},
	};
}

/** True when this visitor has already entered the current phrase. */
export async function isUnlocked(event: H3Event, passphrase: string | null) {
	// No phrase configured → records are public.
	if (!passphrase) return true;
	try {
		const session = await useSession<{ unlocked?: string }>(event, sessionOptions());
		// Store a fingerprint of the phrase, so rotating it invalidates old sessions.
		return session.data.unlocked === normalize(passphrase);
	} catch {
		return false;
	}
}

/** Verify a submitted phrase and, on success, mark this session unlocked. */
export async function attemptUnlock(event: H3Event, submitted: string) {
	const { passphrase } = await getMeetingAccessConfig();
	if (!passphrase) return true;

	if (!safeEqual(normalize(submitted), normalize(passphrase))) return false;

	const session = await useSession<{ unlocked?: string }>(event, sessionOptions());
	await session.update({ unlocked: normalize(passphrase) });
	return true;
}

/** Forget the unlock for this browser. */
export async function clearUnlock(event: H3Event) {
	const session = await useSession(event, sessionOptions());
	await session.clear();
}
