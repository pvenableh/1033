/**
 * POST /api/auth/login
 *
 * Authenticates user with Directus and creates a session using nuxt-auth-utils.
 * Stores Directus tokens securely in the session's secure section (encrypted).
 */
import { directusLogin, directusReadMeWithFields } from '~/server/utils/directus';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  // Validate input
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

  try {
    // Authenticate with Directus
    const tokens = await directusLogin(body.email, body.password);

    // Get user data from Directus
    const userData = await directusReadMeWithFields(tokens.access_token);

    // Check if user is active
    if (userData.status !== 'active' && userData.status !== 'draft') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden',
        message: 'Account is not active',
      });
    }

    // Calculate expiration time
    const expiresAt = Date.now() + tokens.expires * 1000;

    // Set session with user data and tokens in secure section
    await setUserSession(event, {
      user: {
        id: userData.id,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        status: userData.status,
        role: userData.role,
        person_id: userData.person_id,
        units: userData.units,
        avatar: userData.avatar,
        phone: userData.phone,
      },
      expiresAt,
      loggedInAt: Date.now(),
      // Store tokens securely in encrypted section (not exposed to client)
      secure: {
        directusAccessToken: tokens.access_token,
        directusRefreshToken: tokens.refresh_token,
      },
    });

    return {
      success: true,
      user: {
        id: userData.id,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        status: userData.status,
        role: userData.role,
      },
    };
  } catch (error: any) {
    console.error('Login error:', error);

    // Handle Directus errors
    if (error?.errors?.[0]) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
        message: error.errors[0].message || 'Invalid credentials',
      });
    }

    // Handle fetch errors from Directus
    if (error?.data?.errors?.[0]) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
        message: error.data.errors[0].message || 'Invalid credentials',
      });
    }

    // Re-throw if already a proper error
    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: 'Login failed. Please try again.',
    });
  }
});
