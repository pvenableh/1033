/**
 * PATCH /api/directus/users/me
 *
 * Update current authenticated user's profile.
 */
export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);

  if (!session?.directusTokens?.access_token) {
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
    const config = useRuntimeConfig();
    const url = config.public.directusUrl || config.public.adminUrl;

    const response = await $fetch(`${url}/users/me`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${session.directusTokens.access_token}`,
        'Content-Type': 'application/json',
      },
      body: body,
    });

    return (response as any).data;
  } catch (error: any) {
    console.error('Update me error:', error);

    if (error?.data?.errors?.[0]) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: error.data.errors[0].message,
      });
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: 'Failed to update profile',
    });
  }
});
