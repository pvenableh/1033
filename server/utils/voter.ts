/**
 * Voter identity helpers for the public (unauthenticated) polls.
 *
 * Two soft signals are combined to deter double-voting without requiring login:
 *   - voter_id : a random UUID kept in an httpOnly cookie (per-browser)
 *   - ip_hash  : a salted SHA-256 of the request IP (per-network, for audit /
 *                rate-limiting — never store the raw IP, it's PII)
 *
 * When a voter's email matches a resident, person_id is the strongest signal
 * and takes precedence over both of these (handled in the vote endpoint).
 */
import { createHash } from 'node:crypto';
import { randomUUID } from 'node:crypto';
import type { H3Event } from 'h3';
import { getCookie, setCookie, getRequestHeader, getRequestIP } from 'h3';

const VOTER_COOKIE = 'voter_id';
const ONE_YEAR = 60 * 60 * 24 * 365;

/** Get the existing voter cookie or mint + set a new one. */
export function getOrSetVoterId(event: H3Event): string {
  let voterId = getCookie(event, VOTER_COOKIE);
  if (!voterId || voterId.length < 16) {
    voterId = randomUUID();
    setCookie(event, VOTER_COOKIE, voterId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      path: '/',
      maxAge: ONE_YEAR,
    });
  }
  return voterId;
}

/** Best-effort client IP, honoring common proxy headers (Vercel/Cloudflare). */
export function getClientIp(event: H3Event): string {
  const fwd = getRequestHeader(event, 'x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return getRequestIP(event, { xForwardedFor: true }) || 'unknown';
}

/** Salted hash of the client IP. Salt = session password (already a secret). */
export function hashIp(ip: string): string {
  const salt = process.env.NUXT_SESSION_PASSWORD || 'ideas-fallback-salt';
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex');
}
