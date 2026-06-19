/**
 * POST /api/polls/vote
 *
 * Public, unauthenticated poll voting. De-duplication is layered:
 *   1. matched resident (person_id) — strongest; one vote per real person
 *   2. voter_id cookie — per-browser
 *   3. ip_hash — soft per-network rate limit (NOT a hard block: a whole
 *      building can share one NAT'd IP, so we only rate-limit, never reject
 *      solely on IP)
 *
 * Body: { poll: string, option: string, email?: string }
 * Returns the refreshed results so the UI can flip straight to the chart.
 */
import {
  useDirectusAdmin,
  readItem,
  readItems,
  createItem,
  aggregate,
} from '~/server/utils/directus';
import { rateLimit } from '~/server/utils/rateLimit';
import { getOrSetVoterId, getClientIp, hashIp } from '~/server/utils/voter';

async function tallyResults(client: ReturnType<typeof useDirectusAdmin>, pollId: string) {
  const rows = await client.request(
    aggregate('poll_votes', {
      aggregate: { count: '*' },
      groupBy: ['option'],
      query: { filter: { poll: { _eq: pollId } } },
    } as any)
  );
  const counts: Record<string, number> = {};
  let total = 0;
  for (const row of rows as any[]) {
    const optionId = row.option;
    const n = Number(row.count ?? row.count?.['*'] ?? 0);
    if (optionId != null) {
      counts[optionId] = n;
      total += n;
    }
  }
  return { counts, total };
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const pollId = (body?.poll || '').toString();
  const optionId = (body?.option || '').toString();
  const email = (body?.email || '').toString().trim().toLowerCase();

  if (!pollId || !optionId) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'poll and option are required.' });
  }

  const voterId = getOrSetVoterId(event);
  const ipHash = hashIp(getClientIp(event));

  // Soft IP rate limit: 15 votes / hour / IP. Generous so shared building
  // WiFi isn't blocked, but stops a single machine spraying votes.
  const rl = rateLimit(`vote:${ipHash}`, 15, 60 * 60 * 1000);
  if (!rl.allowed) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Too Many Requests',
      message: `Too many votes from your network. Try again in ${Math.ceil(rl.retryAfter / 60)} min.`,
    });
  }

  const client = useDirectusAdmin();

  // 1. Validate the poll is open.
  let poll: any;
  try {
    poll = await client.request(
      readItem('polls', pollId, { fields: ['id', 'status', 'closes_at'] } as any)
    );
  } catch {
    throw createError({ statusCode: 404, statusMessage: 'Not Found', message: 'Poll not found.' });
  }
  if (!poll || poll.status !== 'open') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden', message: 'This poll is not open for voting.' });
  }
  if (poll.closes_at && new Date(poll.closes_at).getTime() < Date.now()) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden', message: 'This poll has closed.' });
  }

  // 2. Validate the option belongs to this poll.
  const options = await client.request(
    readItems('poll_options', { filter: { poll: { _eq: pollId } }, fields: ['id'], limit: -1 } as any)
  );
  if (!options.some((o: any) => String(o.id) === optionId)) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'Invalid option for this poll.' });
  }

  // 3. Identify the voter as a resident (strongest dedup signal).
  //    Preference order:
  //      a) authenticated session — trusted, no email entry needed (this is the
  //         seamless path once residents have accounts)
  //      b) submitted email matched against the published resident roster
  let personId: number | null = null;
  const session = await getUserSession(event);
  if (session?.user?.person_id) {
    personId = Number(session.user.person_id);
  } else if (email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    try {
      const people = await client.request(
        readItems('people', {
          filter: { email: { _eq: email }, status: { _eq: 'published' }, is_resident: { _eq: true } },
          fields: ['id'],
          limit: 1,
        } as any)
      );
      if (people?.[0]) personId = people[0].id;
    } catch {
      // ignore — fall back to cookie/ip dedup
    }
  }

  // 4. Reject duplicates. Match on person_id (if known) OR the voter cookie.
  const dupeOr: any[] = [{ voter_id: { _eq: voterId } }];
  if (personId != null) dupeOr.push({ person_id: { _eq: personId } });
  const existing = await client.request(
    readItems('poll_votes', {
      filter: { poll: { _eq: pollId }, _or: dupeOr },
      fields: ['id'],
      limit: 1,
    } as any)
  );
  if (existing?.length) {
    const results = await tallyResults(client, pollId);
    throw createError({
      statusCode: 409,
      statusMessage: 'Conflict',
      message: 'You have already voted in this poll.',
      data: { ...results, alreadyVoted: true },
    });
  }

  // 5. Record the vote. If a composite unique index exists on poll_votes
  //    (poll, voter_id) / (poll, person_id), a vote that races past the check
  //    in step 4 will hit a DB unique violation — treat that as "already voted"
  //    rather than a 500, so behavior is identical whether or not the index is
  //    installed.
  try {
    await client.request(
      createItem('poll_votes', {
        poll: pollId,
        option: optionId,
        voter_id: voterId,
        ip_hash: ipHash,
        person_id: personId,
      })
    );
  } catch (error: any) {
    if (isUniqueViolation(error)) {
      const results = await tallyResults(client, pollId);
      throw createError({
        statusCode: 409,
        statusMessage: 'Conflict',
        message: 'You have already voted in this poll.',
        data: { ...results, alreadyVoted: true },
      });
    }
    throw error;
  }

  const results = await tallyResults(client, pollId);
  return { ...results, alreadyVoted: true, votedOption: optionId };
});

/**
 * Detect a Postgres unique-constraint violation (SQLSTATE 23505) surfaced
 * through the Directus SDK / pg driver, however it happens to be wrapped.
 */
function isUniqueViolation(error: any): boolean {
  const code = error?.code || error?.cause?.code || error?.errors?.[0]?.extensions?.code;
  if (code === '23505' || code === 'RECORD_NOT_UNIQUE') return true;
  const msg = (error?.message || error?.errors?.[0]?.message || '').toLowerCase();
  return msg.includes('unique') && (msg.includes('violat') || msg.includes('constraint') || msg.includes('duplicate'));
}
