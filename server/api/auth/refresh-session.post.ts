/**
 * POST /api/auth/refresh-session
 *
 * Refreshes the current session with fresh data from Directus.
 * Also refreshes Directus tokens if they are close to expiring.
 */
import { directusRefresh, directusReadMeWithFields } from '~/server/utils/directus';

export default defineEventHandler(async (event) => {
  try {
    // Get current session
    const session = await getUserSession(event);

    if (!session?.directusTokens) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
        message: 'No active session',
      });
    }

    let accessToken = session.directusTokens.access_token;
    let refreshToken = session.directusTokens.refresh_token;
    let expiresAt = session.directusTokens.expires_at;

    // Check if token needs refresh (within 5 minutes of expiring)
    const fiveMinutes = 5 * 60 * 1000;
    if (expiresAt && Date.now() > expiresAt - fiveMinutes) {
      try {
        const newTokens = await directusRefresh(refreshToken);
        accessToken = newTokens.access_token;
        refreshToken = newTokens.refresh_token;
        expiresAt = Date.now() + newTokens.expires;
      } catch (error) {
        console.error('Token refresh failed:', error);
        throw createError({
          statusCode: 401,
          statusMessage: 'Unauthorized',
          message: 'Session expired. Please login again.',
        });
      }
    }

    // Get fresh user data from Directus
    const userData = await directusReadMeWithFields(accessToken);

    // Update session with fresh data
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
      directusTokens: {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: expiresAt,
      },
      loggedInAt: session.loggedInAt || Date.now(),
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
    console.error('Session refresh error:', error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: 'Failed to refresh session',
    });
  }
});
