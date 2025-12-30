/**
 * GET /api/directus/users/me
 *
 * Get current authenticated user's data from Directus.
 * Uses getUserDirectus() for automatic token refresh.
 */
import { directusReadMeWithFields } from '~/server/utils/directus';

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);
  const accessToken = getSessionAccessToken(session);

  if (!accessToken) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: 'Authentication required',
    });
  }

  try {
    const query = getQuery(event);
    const fields = query.fields
      ? String(query.fields).split(',')
      : undefined;

    // If custom fields requested, fetch them
    if (fields) {
      const config = useRuntimeConfig();
      const url = config.public.directusUrl || config.public.adminUrl;

      const response = await $fetch(`${url}/users/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        query: {
          fields: fields.join(','),
        },
      });

      return (response as any).data;
    }

    // Otherwise use default fields
    const userData = await directusReadMeWithFields(accessToken);
    return userData;
  } catch (error: any) {
    console.error('Get me error:', error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: 'Failed to fetch user data',
    });
  }
});
