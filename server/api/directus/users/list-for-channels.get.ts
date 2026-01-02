/**
 * GET /api/directus/users/list-for-channels
 *
 * List users for channel invitations.
 * Available to board members and admins.
 * Returns all active users with basic info.
 */
import { useDirectusAdmin, readUsers, hasAdminAccess } from '~/server/utils/directus';

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);

  if (!session?.user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: 'Authentication required',
    });
  }

  // Check if user has board member or admin access (from policies in Directus v11+)
  const isAdmin = hasAdminAccess(session);
  const isBoardMember = session.user.role?.name?.toLowerCase().includes('board') ||
                        session.user.role?.name?.toLowerCase().includes('admin');

  if (!isAdmin && !isBoardMember) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
      message: 'Board member or admin access required',
    });
  }

  const client = useDirectusAdmin();

  try {
    const users = await client.request(
      readUsers({
        fields: ['id', 'email', 'first_name', 'last_name', 'avatar', 'status', 'role.id', 'role.name'],
        filter: {
          status: { _eq: 'active' },
        },
        sort: ['first_name', 'last_name'],
        limit: -1,
      } as any)
    );

    return users;
  } catch (error: any) {
    console.error('List users for channels error:', error);

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
      message: 'Failed to load users',
    });
  }
});
