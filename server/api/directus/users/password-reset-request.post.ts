/**
 * POST /api/directus/users/password-reset-request
 *
 * Request a password reset email.
 */
import { useDirectusAdmin, passwordRequest } from '~/server/utils/directus';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  if (!body.email || typeof body.email !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Email is required',
    });
  }

  try {
    const client = useDirectusAdmin();
    const config = useRuntimeConfig();

    // Get the reset URL from config or default
    const resetUrl = body.reset_url || `${config.public.siteUrl}/auth/password-reset`;

    await client.request(passwordRequest(body.email, resetUrl));

    return {
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.',
    };
  } catch (error: any) {
    console.error('Password reset request error:', error);

    // Always return success to prevent email enumeration
    return {
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.',
    };
  }
});
