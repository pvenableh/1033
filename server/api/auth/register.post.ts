/**
 * POST /api/auth/register
 *
 * Registers a new user in Directus.
 * User is created with 'draft' status pending admin approval.
 */
import { useDirectusAdmin, createUser } from '~/server/utils/directus';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  // Validate required fields
  if (!body.email || typeof body.email !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Email is required',
    });
  }

  if (!body.password || typeof body.password !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Password is required',
    });
  }

  if (!body.first_name || typeof body.first_name !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'First name is required',
    });
  }

  if (!body.last_name || typeof body.last_name !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Last name is required',
    });
  }

  try {
    const client = useDirectusAdmin();

    // Create user with draft status (pending approval)
    const user = await client.request(
      createUser({
        email: body.email,
        password: body.password,
        first_name: body.first_name,
        last_name: body.last_name,
        phone: body.phone || null,
        status: 'draft', // Pending admin approval
        // Store additional registration data if provided
        description: body.description ? JSON.stringify(body.description) : null,
      })
    );

    return {
      success: true,
      message: 'Registration successful. Your account is pending approval.',
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
      },
    };
  } catch (error: any) {
    console.error('Registration error:', error);

    // Handle Directus errors
    if (error?.errors?.[0]) {
      const message = error.errors[0].message;

      // Check for duplicate email
      if (message.includes('unique') || message.includes('already exists')) {
        throw createError({
          statusCode: 409,
          statusMessage: 'Conflict',
          message: 'An account with this email already exists',
        });
      }

      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: message,
      });
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: 'Registration failed. Please try again.',
    });
  }
});
