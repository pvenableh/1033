/**
 * POST /api/public/access-request
 *
 * Public endpoint to submit an access request.
 * Creates a user with 'draft' status pending admin approval.
 */
import { useDirectusAdmin, createUser } from '~/server/utils/directus';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  // Validate required fields
  if (!body.email || !body.password || !body.first_name || !body.last_name) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Email, password, first name, and last name are required',
    });
  }

  if (!body.unit_id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Unit is required',
    });
  }

  try {
    const client = useDirectusAdmin();

    // Create user with 'draft' status (pending approval)
    const user = await client.request(
      createUser({
        email: body.email,
        password: body.password,
        first_name: body.first_name,
        last_name: body.last_name,
        status: 'draft',
        description: JSON.stringify({
          unit_id: body.unit_id,
          unit_number: body.unit_number,
          residency_type: body.residency_type,
          phone: body.phone,
          requested_at: new Date().toISOString(),
        }),
      })
    );

    return {
      success: true,
      message: 'Access request submitted successfully',
    };
  } catch (error: any) {
    console.error('Access request error:', error);

    if (error?.errors?.[0]?.message?.includes('unique')) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: 'This email is already registered',
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
      message: 'Failed to submit access request',
    });
  }
});
