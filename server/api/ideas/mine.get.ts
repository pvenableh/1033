/**
 * GET /api/ideas/mine
 *
 * Authenticated. Returns the current user's OWN idea submissions across all
 * statuses (including `pending`, which the public feed hides) so a logged-in
 * resident can see their submissions and review state.
 *
 * Scoped server-side to the caller: matches on their linked person_id and/or
 * their account email. Uses the admin token because the MEMBER policy only
 * grants read on published ideas — but the filter guarantees a user only ever
 * sees their own rows.
 */
import { useDirectusAdmin, readItems } from '~/server/utils/directus';

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized', message: 'Sign in to view your submissions.' });
  }

  const personId = session.user.person_id ? Number(session.user.person_id) : null;
  const email = (session.user.email || '').toLowerCase();

  // Build an OR over whichever identifiers we have. If somehow neither is
  // present, return nothing rather than risk a broad query.
  const or: any[] = [];
  if (personId != null) or.push({ person_id: { _eq: personId } });
  if (email) or.push({ email: { _eq: email } });
  if (!or.length) return [];

  const client = useDirectusAdmin();
  const ideas = await client.request(
    readItems('ideas', {
      filter: { _or: or },
      fields: [
        'id',
        'status',
        'title',
        'category',
        'description',
        'name',
        'unit_number',
        'verified_resident',
        'date_created',
        'images.directus_files_id',
      ],
      sort: ['-date_created'],
      limit: 100,
    } as any)
  );

  return ideas;
});
