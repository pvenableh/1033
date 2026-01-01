/**
 * GET /api/directus/users/me
 *
 * Get current authenticated user's data from Directus.
 * Uses getUserDirectus() for automatic token refresh.
 */
import { getUserDirectus, directusReadMeWithFields, readMe } from '~/server/utils/directus';

export default defineEventHandler(async (event) => {
  try {
    // Use getUserDirectus which handles automatic token refresh
    const client = await getUserDirectus(event);

    // Get refreshed session with potentially new access token
    const session = await getUserSession(event);
    const accessToken = getSessionAccessToken(session);

    if (!accessToken) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    const query = getQuery(event);
    const fields = query.fields
      ? String(query.fields).split(',')
      : undefined;

    // If custom fields requested, use the authenticated client directly
    if (fields) {
      const result = await client.request(
        readMe({
          fields: fields as any,
        })
      );
      return result;
    }

    // Otherwise use default fields with admin token for extended access
    const userData = await directusReadMeWithFields(accessToken);
    return userData;
  } catch (error: any) {
    console.error('Get me error:', error);

    if (error.statusCode) {
      throw error;
    }

    // Handle token expiration gracefully
    if (error.message?.includes('Token expired') || error.status === 401) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
        message: 'Session expired. Please log in again.',
      });
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: 'Failed to fetch user data',
    });
  }
});
