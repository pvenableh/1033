/**
 * POST /api/public/check-email
 *
 * Public endpoint to check if an email is already registered.
 * Used during registration to prevent duplicate accounts.
 */
import { useDirectusAdmin, readUsers } from '~/server/utils/directus';

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

    const users = await client.request(
      readUsers({
        filter: { email: { _eq: body.email } },
        fields: ['id', 'email', 'status'],
        limit: 1,
      } as any)
    );

    if (users && users.length > 0) {
      return {
        exists: true,
        status: users[0].status,
      };
    }

    return { exists: false };
  } catch (error: any) {
    console.error('Check email error:', error);

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: 'Failed to check email',
    });
  }
});
