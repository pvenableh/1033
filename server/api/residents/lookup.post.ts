/**
 * POST /api/residents/lookup
 *
 * Public, unauthenticated. Given an email, checks whether it belongs to a
 * published resident in the `people` roster. Used by the community-ideas form
 * to auto-fill name/unit and badge verified residents.
 *
 * Privacy / abuse notes:
 *   - This is an email-enumeration surface, so it is rate-limited per IP and
 *     returns ONLY a boolean + the matched person's own display fields. It
 *     never lists the roster and never reveals *why* a lookup failed.
 *   - Reads via the admin token (people is not publicly readable).
 */
import { useDirectusAdmin, readItems } from '~/server/utils/directus';
import { rateLimit } from '~/server/utils/rateLimit';
import { getClientIp, hashIp } from '~/server/utils/voter';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const email = (body?.email || '').toString().trim().toLowerCase();

  // Basic shape check — don't bother hitting Directus for junk.
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { matched: false };
  }

  // Rate limit: 10 lookups / 5 min per IP.
  const ipHash = hashIp(getClientIp(event));
  const { allowed, retryAfter } = rateLimit(`lookup:${ipHash}`, 10, 5 * 60 * 1000);
  if (!allowed) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Too Many Requests',
      message: `Please wait ${retryAfter}s before trying again.`,
    });
  }

  try {
    const client = useDirectusAdmin();
    const people = await client.request(
      readItems('people', {
        filter: {
          email: { _eq: email },
          status: { _eq: 'published' },
          is_resident: { _eq: true },
        },
        fields: [
          'id',
          'first_name',
          'last_name',
          'unit.units_id.id',
          'unit.units_id.number',
        ],
        limit: 1,
      })
    );

    const person = people?.[0];
    if (!person) return { matched: false };

    const unit = Array.isArray(person.unit) ? person.unit[0]?.units_id : null;

    return {
      matched: true,
      person_id: person.id,
      first_name: person.first_name || '',
      last_name: person.last_name || '',
      unit_id: unit?.id || null,
      unit_number: unit?.number || '',
    };
  } catch (error: any) {
    console.error('Resident lookup error:', error?.errors?.[0]?.message || error?.message);
    // Fail closed (treat as unmatched) — never leak internals to a public caller.
    return { matched: false };
  }
});
