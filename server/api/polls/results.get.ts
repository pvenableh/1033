/**
 * GET /api/polls/results?poll=<id>
 *
 * Public, unauthenticated. Returns aggregate vote counts per option for a poll,
 * plus whether the current voter (by cookie) has already voted — so the UI can
 * render results instead of the ballot on load.
 */
import { useDirectusAdmin, readItems, aggregate } from '~/server/utils/directus';
import { getOrSetVoterId } from '~/server/utils/voter';

export default defineEventHandler(async (event) => {
  const pollId = (getQuery(event).poll || '').toString();
  if (!pollId) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'poll is required.' });
  }

  const voterId = getOrSetVoterId(event);
  const client = useDirectusAdmin();

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

  // Has this browser already voted? (cookie-based; the strongest person_id
  // check happens at vote time when an email is supplied.)
  const mine = await client.request(
    readItems('poll_votes', {
      filter: { poll: { _eq: pollId }, voter_id: { _eq: voterId } },
      fields: ['option'],
      limit: 1,
    } as any)
  );

  return {
    counts,
    total,
    alreadyVoted: !!mine?.length,
    votedOption: mine?.[0]?.option ?? null,
  };
});
