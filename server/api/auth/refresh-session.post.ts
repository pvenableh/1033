/**
 * POST /api/auth/refresh-session
 *
 * Refreshes the current session with fresh user data from Directus.
 * Also refreshes Directus tokens if they are close to expiring.
 */
import { createDirectus, rest, authentication, refresh } from '@directus/sdk';
import { directusReadMeWithFields } from '~/server/utils/directus';

export default defineEventHandler(async (event) => {
  try {
    // Get current session
    const session = await getUserSession(event);
    const refreshToken = getSessionRefreshToken(session);

    if (!session?.user || !refreshToken) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
        message: 'No active session',
      });
    }

    let accessToken = getSessionAccessToken(session);
    let expiresAt = (session as any).expiresAt;

    // Check if token needs refresh (within 5 minutes of expiring)
    const fiveMinutes = 5 * 60 * 1000;
    const now = Date.now();

    if (expiresAt && now > expiresAt - fiveMinutes) {
      const config = useRuntimeConfig();
      const directusUrl = config.public.directusUrl || config.public.adminUrl;

      try {
        const directus = createDirectus(directusUrl)
          .with(rest())
          .with(authentication('json'));

        const authResult = await directus.request(
          refresh({ mode: 'json', refresh_token: refreshToken })
        );

        if (!authResult.access_token) {
          throw new Error('Token refresh failed');
        }

        accessToken = authResult.access_token;
        expiresAt = Date.now() + (authResult.expires || 900) * 1000;

        // Update tokens in session immediately
        await setUserSession(event, {
          ...session,
          expiresAt,
          secure: {
            directusAccessToken: accessToken,
            directusRefreshToken: authResult.refresh_token || refreshToken,
          },
        });
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
    console.log('refresh-session: Fetching fresh user data...');
    const userData = await directusReadMeWithFields(accessToken!);
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
