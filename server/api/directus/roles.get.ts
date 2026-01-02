/**
 * GET /api/directus/roles
 *
 * Fetch all roles (admin only).
 */
import { useDirectusAdmin, readRoles, hasAdminAccess } from '~/server/utils/directus';

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);

  if (!session?.user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: 'Authentication required',
    });
  }

  // Check if user has admin access (from policies in Directus v11+)
  if (!hasAdminAccess(session)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
      message: 'Admin access required',
    });
  }

  try {
    const client = useDirectusAdmin();

    // Fetch roles with id, name, and description
    const roles = await client.request(
      readRoles({
        fields: ['id', 'name', 'description'],
        sort: ['name'],
      })
    );

    return roles;
  } catch (error: any) {
    console.error('Fetch roles error:', error);

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
      message: 'Failed to fetch roles',
    });
  }
});
