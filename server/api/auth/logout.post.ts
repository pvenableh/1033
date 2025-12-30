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
    if (session?.directusTokens?.refresh_token) {
      try {
        await directusLogout(session.directusTokens.refresh_token);
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
