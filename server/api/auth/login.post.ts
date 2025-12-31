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

    // Debug: log user status for troubleshooting
    console.log('Login - User status:', userData.status, 'User ID:', userData.id, 'Email:', userData.email);

    // Check if user is active (handle various status formats and invited users)
    const allowedStatuses = ['active', 'draft', 'invited'];
    const userStatus = userData.status?.toLowerCase?.() || userData.status;
    if (!allowedStatuses.includes(userStatus)) {
      console.error('Login rejected - invalid status:', userData.status);
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden',
        message: `Account status "${userData.status}" is not allowed. Contact an administrator.`,
      });
    }

    // Calculate expiration time
    const expiresAt = Date.now() + tokens.expires * 1000;

    // Set session with user data and tokens in secure section
    // Only store essential data to stay under 4KB cookie limit
    // Full user data (units, people, etc.) should be fetched via API when needed
    await setUserSession(event, {
      user: {
        id: userData.id,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        status: userData.status,
        role: userData.role,
        avatar: userData.avatar,
        phone: userData.person_id?.phone,
        person_id: userData.person_id?.id,
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
    console.error('Login error:', error?.message || error);
    console.error('Login error details:', JSON.stringify({
      message: error?.message,
      errors: error?.errors,
      dataErrors: error?.data?.errors,
      statusCode: error?.statusCode,
      cause: error?.cause,
    }, null, 2));

    // Handle Directus SDK errors (array format)
    if (error?.errors?.[0]) {
      const directusMessage = error.errors[0].message || 'Invalid credentials';
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
        message: directusMessage,
      });
    }

    // Handle fetch errors from Directus ($fetch format)
    if (error?.data?.errors?.[0]) {
      const directusMessage = error.data.errors[0].message || 'Invalid credentials';
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
        message: directusMessage,
      });
    }

    // Re-throw if already a proper error (e.g., from our status check)
    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: error?.message || 'Login failed. Please try again.',
    });
  }
});
