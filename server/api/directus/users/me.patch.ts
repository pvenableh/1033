/**
 * PATCH /api/directus/users/me
 *
 * Update current authenticated user's profile.
 * Uses secure session tokens with automatic refresh support.
 */
import { getUserDirectus, updateUser } from '~/server/utils/directus';

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

  const body = await readBody(event);

  if (!body || Object.keys(body).length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Update data is required',
    });
  }

  try {
    // Use getUserDirectus for automatic token refresh
    const client = await getUserDirectus(event);
    const userId = session.user?.id;

    if (!userId) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
        message: 'User ID not found in session',
      });
    }

    const result = await client.request(updateUser(userId, body));
    return result;
  } catch (error: any) {
    console.error('Update me error:', error);

    if (error.statusCode) {
      throw error;
    }

    if (error?.data?.errors?.[0]) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: error.data.errors[0].message,
      });
    }

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
      message: 'Failed to update profile',
    });
  }
});
