/**
 * POST /api/auth/refresh-session
 *
 * Refreshes the current session with fresh user data from Directus.
 * Also refreshes Directus tokens if they are close to expiring or invalid.
 */
import { createDirectus, rest, authentication, refresh } from '@directus/sdk';
import { directusReadMeWithFields } from '~/server/utils/directus';

/**
 * Helper to refresh Directus tokens
 */
async function refreshDirectusTokens(refreshToken: string) {
  const config = useRuntimeConfig();
  const directusUrl = config.public.directusUrl || config.public.adminUrl;

  const directus = createDirectus(directusUrl)
    .with(rest())
    .with(authentication('json'));

  const authResult = await directus.request(
    refresh({ mode: 'json', refresh_token: refreshToken })
  );

  if (!authResult.access_token) {
    throw new Error('Token refresh failed - no access token returned');
  }

  return {
    accessToken: authResult.access_token,
    refreshToken: authResult.refresh_token || refreshToken,
    expiresAt: Date.now() + (authResult.expires || 900) * 1000,
  };
}

export default defineEventHandler(async (event) => {
  try {
    // Get current session
    const session = await getUserSession(event);
    let refreshToken = getSessionRefreshToken(session);

    if (!session?.user || !refreshToken) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
        message: 'No active session',
      });
    }

    let accessToken = getSessionAccessToken(session);
    let expiresAt = (session as any).expiresAt;

    // Check if token needs refresh based on expiry time:
    // - If expiresAt is not set (old session without expiry tracking)
    // - Or if token is within 5 minutes of expiring
    // - Or if token is already expired
    const fiveMinutes = 5 * 60 * 1000;
    const now = Date.now();
    const needsRefreshByTime = !expiresAt || now > expiresAt - fiveMinutes;

    if (needsRefreshByTime) {
      console.log('refresh-session: Token needs refresh by time, expiresAt:', expiresAt, 'now:', now);
      try {
        const tokens = await refreshDirectusTokens(refreshToken);
        accessToken = tokens.accessToken;
        refreshToken = tokens.refreshToken;
        expiresAt = tokens.expiresAt;

        // Update tokens in session immediately
        await setUserSession(event, {
          ...session,
          expiresAt,
          secure: {
            directusAccessToken: accessToken,
            directusRefreshToken: refreshToken,
          },
        });
      } catch (error) {
        console.error('Token refresh failed:', error);
        await clearUserSession(event);
        throw createError({
          statusCode: 401,
          statusMessage: 'Unauthorized',
          message: 'Session expired. Please login again.',
        });
      }
    }

    // Try to get fresh user data from Directus
    // If the token is invalid (e.g., revoked), we'll catch the 401 and try to refresh
    console.log('refresh-session: Fetching fresh user data...');
    let userData;
    try {
      userData = await directusReadMeWithFields(accessToken!);
    } catch (fetchError: any) {
      // If we get a 401 and haven't already refreshed, try refreshing tokens
      const is401 = fetchError?.statusCode === 401 ||
                    fetchError?.cause?.statusCode === 401 ||
                    fetchError?.message?.includes('401');

      if (is401 && !needsRefreshByTime) {
        console.log('refresh-session: Got 401, attempting token refresh...');
        try {
          const tokens = await refreshDirectusTokens(refreshToken);
          accessToken = tokens.accessToken;
          refreshToken = tokens.refreshToken;
          expiresAt = tokens.expiresAt;

          // Retry fetching user data with new token
          userData = await directusReadMeWithFields(accessToken);

          // Update tokens in session
          await setUserSession(event, {
            ...session,
            expiresAt,
            secure: {
              directusAccessToken: accessToken,
              directusRefreshToken: refreshToken,
            },
          });
        } catch (refreshError) {
          console.error('Token refresh after 401 failed:', refreshError);
          await clearUserSession(event);
          throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized',
            message: 'Session expired. Please login again.',
          });
        }
      } else {
        // Either already tried to refresh or error is not 401
        console.error('Failed to fetch user data:', fetchError);
        await clearUserSession(event);
        throw createError({
          statusCode: 401,
          statusMessage: 'Unauthorized',
          message: 'Session expired. Please login again.',
        });
      }
    }

    console.log('refresh-session: Got user data:', {
      id: userData.id,
      first_name: userData.first_name,
      last_name: userData.last_name,
    });

    // Update session with fresh user data
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
      loggedInAt: (session as any).loggedInAt || Date.now(),
      secure: {
        directusAccessToken: accessToken,
        directusRefreshToken: refreshToken,
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
