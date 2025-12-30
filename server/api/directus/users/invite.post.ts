/**
 * POST /api/directus/users/invite
 *
 * Invite a new user (admin only).
 */
import { useDirectusAdmin, inviteUser } from '~/server/utils/directus';

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);

  if (!session?.user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: 'Authentication required',
    });
  }

  // Check if user has admin access
  const isAdmin = session.user.role?.admin_access === true;
  if (!isAdmin) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
      message: 'Admin access required',
    });
  }

  const body = await readBody(event);

  if (!body.email || typeof body.email !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Email is required',
    });
  }

  if (!body.role || typeof body.role !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Role is required',
    });
  }

  try {
    const client = useDirectusAdmin();
    const config = useRuntimeConfig();

    const inviteUrl = body.invite_url || `${config.public.siteUrl}/auth/accept-invite`;

    await client.request(inviteUser(body.email, body.role, inviteUrl));

    return {
      success: true,
      message: 'Invitation sent successfully.',
    };
  } catch (error: any) {
    console.error('Invite user error:', error);

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
      message: 'Failed to send invitation',
    });
  }
});
