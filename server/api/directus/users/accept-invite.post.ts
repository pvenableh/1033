/**
 * POST /api/directus/users/accept-invite
 *
 * Accept an invitation and set password.
 */
import { useDirectusAdmin, acceptUserInvite } from '~/server/utils/directus';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  if (!body.token || typeof body.token !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Invitation token is required',
    });
  }

  if (!body.password || typeof body.password !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Password is required',
    });
  }

  try {
    const client = useDirectusAdmin();
    await client.request(acceptUserInvite(body.token, body.password));

    return {
      success: true,
      message: 'Invitation accepted. You can now log in.',
    };
  } catch (error: any) {
    console.error('Accept invite error:', error);

    if (error?.errors?.[0]) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: error.errors[0].message || 'Invalid or expired invitation',
      });
    }

    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Failed to accept invitation. The token may be invalid or expired.',
    });
  }
});
