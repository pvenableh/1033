/**
 * POST /api/directus/users/password-reset
 *
 * Reset password using a token.
 */
import { useDirectusAdmin, passwordReset } from '~/server/utils/directus';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  if (!body.token || typeof body.token !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Reset token is required',
    });
  }

  if (!body.password || typeof body.password !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'New password is required',
    });
  }

  try {
    const client = useDirectusAdmin();
    await client.request(passwordReset(body.token, body.password));

    return {
      success: true,
      message: 'Password has been reset successfully.',
    };
  } catch (error: any) {
    console.error('Password reset error:', error);

    if (error?.errors?.[0]) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: error.errors[0].message || 'Invalid or expired token',
      });
    }

    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Password reset failed. The token may be invalid or expired.',
    });
  }
});
