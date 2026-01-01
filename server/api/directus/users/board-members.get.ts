/**
 * GET /api/directus/users/board-members
 *
 * Get all active board members from the board_member collection.
 * Follows the relationship: board_member -> people -> directus_users
 * Available to authenticated users.
 */
import { useDirectusAdmin, readItems } from '~/server/utils/directus';

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);

  if (!session?.user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: 'Authentication required',
    });
  }

  const client = useDirectusAdmin();
  const now = new Date().toISOString();

  try {
    // Query active board members from board_member collection
    // Filter: status is published, and current date is within start/finish range
    const boardMembers = await client.request(
      readItems('board_member', {
        fields: [
          'id',
          'title',
          'status',
          'start',
          'finish',
          // Get the related person
          'people_id.id',
          'people_id.first_name',
          'people_id.last_name',
          'people_id.email',
          // Get the related directus user through person
          'people_id.user_id.id',
          'people_id.user_id.first_name',
          'people_id.user_id.last_name',
          'people_id.user_id.email',
          'people_id.user_id.avatar',
          'people_id.user_id.status',
        ],
        filter: {
          status: { _eq: 'published' },
          _and: [
            {
              _or: [
                { start: { _null: true } },
                { start: { _lte: now } },
              ],
            },
            {
              _or: [
                { finish: { _null: true } },
                { finish: { _gte: now } },
              ],
            },
          ],
        },
        limit: -1,
      } as any)
    );

    // Extract unique users from board members
    const usersMap = new Map<string, any>();

    for (const bm of boardMembers as any[]) {
      const person = bm.people_id;
      if (!person) continue;

      const user = person.user_id;
      if (user && user.id && user.status === 'active') {
        // Use user data if available
        if (!usersMap.has(user.id)) {
          usersMap.set(user.id, {
            id: user.id,
            first_name: user.first_name || person.first_name,
            last_name: user.last_name || person.last_name,
            email: user.email || person.email,
            avatar: user.avatar,
            board_title: bm.title,
          });
        }
      } else if (person.id && person.email) {
        // Fallback to person data if no linked user
        const personKey = `person-${person.id}`;
        if (!usersMap.has(personKey)) {
          usersMap.set(personKey, {
            id: personKey,
            first_name: person.first_name,
            last_name: person.last_name,
            email: person.email,
            avatar: null,
            board_title: bm.title,
          });
        }
      }
    }

    return Array.from(usersMap.values());
  } catch (error: any) {
    console.error('Get board members error:', error);

    if (error?.errors?.[0]) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: error.errors[0].message,
      });
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: 'Failed to load board members',
    });
  }
});
