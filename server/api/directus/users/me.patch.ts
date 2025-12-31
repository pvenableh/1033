/**
 * PATCH /api/directus/users/me
 *
 * Update current authenticated user's profile.
 * Uses admin client to bypass permission restrictions,
 * but only allows updating specific safe fields.
 */
import { useDirectusAdmin, updateUser } from '~/server/utils/directus';

// Fields that users are allowed to update on their own profile
const ALLOWED_FIELDS = ['first_name', 'last_name', 'avatar', 'description'];

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);

  if (!session?.user) {
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

  const userId = session.user.id;

  if (!userId) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: 'User ID not found in session',
    });
  }

  // Filter to only allowed fields
  const safeUpdates: Record<string, any> = {};
  for (const field of ALLOWED_FIELDS) {
    if (body[field] !== undefined) {
      safeUpdates[field] = body[field];
    }
  }

  if (Object.keys(safeUpdates).length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'No valid fields to update',
    });
  }

  try {
    // Use admin client to update user (bypasses permission restrictions)
    const client = useDirectusAdmin();
    const result = await client.request(updateUser(userId, safeUpdates));
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
