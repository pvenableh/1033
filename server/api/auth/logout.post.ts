/**
 * POST /api/auth/logout
 *
 * Logs out the current user by clearing the session and
 * invalidating Directus tokens.
 */
import { directusLogout } from '~/server/utils/directus';

export default defineEventHandler(async (event) => {
  try {
    // Get current session
    const session = await getUserSession(event);

    // If we have Directus tokens, invalidate them
    const refreshToken = getSessionRefreshToken(session);
    if (refreshToken) {
      try {
        await directusLogout(refreshToken);
      } catch (error) {
        // Ignore Directus logout errors - still clear local session
        console.warn('Directus logout error:', error);
      }
    }

    // Clear the session
    await clearUserSession(event);

    return {
      success: true,
      message: 'Logged out successfully',
    };
  } catch (error: any) {
    console.error('Logout error:', error);

    // Still try to clear the session even if there was an error
    try {
      await clearUserSession(event);
    } catch (e) {
      // Ignore
    }

    return {
      success: true,
      message: 'Logged out',
    };
  }
});
