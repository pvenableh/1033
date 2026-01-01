/**
 * GET /api/directus/users/board-members
 *
 * Get all board members.
 * Available to authenticated users.
 */
import { useDirectusAdmin, readUsers, readRoles } from '~/server/utils/directus';

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

  try {
    // First, find roles that are board-related
    const roles = await client.request(
      readRoles({
        fields: ['id', 'name'],
        filter: {
          _or: [
            { name: { _icontains: 'board' } },
            { name: { _icontains: 'admin' } },
          ],
        },
      } as any)
    );

    if (!roles || roles.length === 0) {
      return [];
    }

    const boardRoleIds = roles.map((r: any) => r.id);

    // Get users with board roles
    const users = await client.request(
      readUsers({
        fields: ['id', 'email', 'first_name', 'last_name', 'avatar', 'status', 'role.id', 'role.name'],
        filter: {
          status: { _eq: 'active' },
          role: { _in: boardRoleIds },
        },
        sort: ['first_name', 'last_name'],
        limit: -1,
      } as any)
    );

    return users || [];
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
