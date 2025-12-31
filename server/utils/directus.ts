/**
 * Server-side Directus utilities
 *
 * Provides Directus client instances for server-side API routes.
 * Uses the Directus SDK directly for all operations.
 */
import {
  createDirectus,
  rest,
  staticToken,
  authentication,
  refresh,
  login,
  readMe,
  readItems,
  readItem,
  createItem,
  createItems,
  updateItem,
  updateItems,
  deleteItem,
  deleteItems,
  aggregate,
  readUsers,
  readUser,
  createUser,
  updateUser,
  deleteUser,
  inviteUser,
  acceptUserInvite,
  passwordRequest,
  passwordReset,
  uploadFiles,
  importFile,
  readFiles,
  readFile,
  updateFile,
  deleteFile,
  readFolders,
  readFolder,
  createFolder,
  updateFolder,
  deleteFolder,
  readNotifications,
  createNotification,
  updateNotification,
  deleteNotification,
} from '@directus/sdk';
import type { H3Event } from 'h3';

// Types
export interface DirectusTokens {
  access_token: string;
  refresh_token: string;
  expires: number;
}

export interface DirectusUserData {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  status: string;
  role: any;
  [key: string]: any;
}

/**
 * Get runtime config for Directus
 */
function getDirectusConfig() {
  const config = useRuntimeConfig();
  return {
    url: config.public.directusUrl || config.public.adminUrl || process.env.DIRECTUS_URL,
    // staticToken is now in server-only config (not public) for security
    staticToken: config.staticToken || process.env.DIRECTUS_SERVER_TOKEN,
  };
}

/**
 * Create a Directus client with static token (for admin/server-side operations)
 * Uses static token for server-side operations that require admin access
 */
export function useDirectusAdmin() {
  const { url, staticToken: token } = getDirectusConfig();

  if (!url) {
    throw new Error('DIRECTUS_URL is not configured');
  }

  return createDirectus(url)
    .with(rest())
    .with(staticToken(token));
}

/**
 * Get a Directus client with user authentication
 * Uses the session token from nuxt-auth-utils
 * Automatically refreshes expired tokens
 */
export async function getUserDirectus(
  event: H3Event,
  forceRefresh: boolean = false
) {
  const { url } = getDirectusConfig();

  if (!url) {
    throw new Error('DIRECTUS_URL is not configured');
  }

  const session = await getUserSession(event);

  // Check if session exists
  if (!session?.user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'No active session',
    });
  }

  // Access token from secure section
  let accessToken = getSessionAccessToken(session);
  const refreshToken = getSessionRefreshToken(session);

  if (!accessToken) {
    throw createError({
      statusCode: 401,
      statusMessage: 'No authentication token available',
    });
  }

  // Check if token is expired or about to expire (within 60 seconds)
  const now = Date.now();
  const expiresAt = (session as any).expiresAt;
  // If expiresAt is missing (old session), don't force refresh unless explicitly requested
  // The token will still work and the client-side refresh will eventually set expiresAt
  const needsRefresh = forceRefresh || (expiresAt !== undefined && expiresAt - now < 60000);

  // If token needs refresh but no refresh token is available, clear session
  if (needsRefresh && !refreshToken) {
    await clearUserSession(event);
    throw createError({
      statusCode: 401,
      statusMessage: 'Session expired - please log in again',
    });
  }

  // Refresh token if needed
  if (needsRefresh && refreshToken) {
    try {
      const directus = createDirectus(url)
        .with(rest())
        .with(authentication('json'));

      const authResult = await directus.request(
        refresh({ mode: 'json', refresh_token: refreshToken })
      );

      if (!authResult.access_token) {
        throw new Error('Token refresh failed - no access token returned');
      }

      // Update session with new tokens
      await setUserSession(event, {
        ...session,
        expiresAt: Date.now() + (authResult.expires || 900) * 1000,
        secure: {
          directusAccessToken: authResult.access_token,
          directusRefreshToken: authResult.refresh_token || refreshToken,
        },
      });

      accessToken = authResult.access_token;
    } catch (error) {
      await clearUserSession(event);
      throw createError({
        statusCode: 401,
        statusMessage: 'Session expired - please log in again',
      });
    }
  }

  return createDirectus(url)
    .with(staticToken(accessToken))
    .with(rest());
}

/**
 * Get a public Directus client (no authentication)
 * Use for accessing publicly available data
 */
export function getPublicDirectus() {
  const { url } = getDirectusConfig();

  if (!url) {
    throw new Error('DIRECTUS_URL is not configured');
  }

  return createDirectus(url).with(rest());
}

/**
 * Login to Directus and return tokens
 */
export async function directusLogin(email: string, password: string): Promise<DirectusTokens> {
  const { url } = getDirectusConfig();

  console.log('directusLogin: Attempting login for', email, 'to', url);

  const client = createDirectus(url).with(rest());

  try {
    // Use the login request function for server-side authentication
    const result = await client.request(
      login({ email, password }, { mode: 'json' })
    );

    console.log('directusLogin: Success - got tokens');

    return {
      access_token: result.access_token!,
      refresh_token: result.refresh_token!,
      expires: result.expires!,
    };
  } catch (error: any) {
    console.error('directusLogin: Failed -', error?.message || error);
    console.error('directusLogin: Error details:', JSON.stringify({
      errors: error?.errors,
      data: error?.data,
      statusCode: error?.statusCode,
      response: error?.response,
    }, null, 2));
    throw error;
  }
}

/**
 * Refresh Directus tokens
 */
export async function directusRefresh(refreshToken: string): Promise<DirectusTokens> {
  const { url } = getDirectusConfig();

  const response = await $fetch<{ data: DirectusTokens }>(`${url}/auth/refresh`, {
    method: 'POST',
    body: {
      refresh_token: refreshToken,
      mode: 'json',
    },
  });

  return response.data;
}

/**
 * Logout from Directus
 */
export async function directusLogout(refreshToken: string): Promise<void> {
  const { url } = getDirectusConfig();

  try {
    await $fetch(`${url}/auth/logout`, {
      method: 'POST',
      body: {
        refresh_token: refreshToken,
      },
    });
  } catch (error) {
    // Ignore logout errors
    console.warn('Directus logout error:', error);
  }
}

/**
 * Get current user data from Directus
 */
export async function directusGetMe(
  accessToken: string,
  fields: string[] = ['*', 'role.*']
): Promise<DirectusUserData> {
  const { url } = getDirectusConfig();

  const client = createDirectus(url).with(rest());

  const user = await client.request(
    // @ts-ignore - SDK types issue
    readMe({
      fields,
    })
  );

  return user as DirectusUserData;
}

/**
 * Read current user with minimal fields for login/session
 * Uses admin client to fetch user data to avoid field permission issues
 *
 * Only fetches essential auth data to keep session cookie under 4KB limit.
 * Full user data (units, people, etc.) should be fetched via separate API calls.
 */
export async function directusReadMeWithFields(accessToken: string): Promise<DirectusUserData> {
  const { url, staticToken: adminToken } = getDirectusConfig();

  console.log('directusReadMeWithFields: Fetching user data from', url);

  // First, get the user ID from the access token (this endpoint always returns id)
  const meResponse = await $fetch<{ data: { id: string } }>(`${url}/users/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    query: {
      fields: 'id',
    },
  });

  const userId = meResponse.data.id;
  console.log('directusReadMeWithFields: Got user ID:', userId);

  // Fetch only essential user data for session (keep under 4KB cookie limit)
  const response = await $fetch<{ data: DirectusUserData }>(`${url}/users/${userId}`, {
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
    query: {
      fields: [
        // Core directus_users fields
        'id',
        'status',
        'first_name',
        'last_name',
        'email',
        'avatar',
        // Role info
        'role.id',
        'role.name',
        // Person profile - only id and phone for session
        'person_id.id',
        'person_id.phone',
      ].join(','),
    },
  });

  console.log('directusReadMeWithFields: Got user - ID:', response.data.id, 'Status:', response.data.status, 'Email:', response.data.email);

  return response.data;
}

// Re-export SDK functions for convenience
export {
  readMe,
  readItems,
  readItem,
  createItem,
  createItems,
  updateItem,
  updateItems,
  deleteItem,
  deleteItems,
  aggregate,
  readUsers,
  readUser,
  createUser,
  updateUser,
  deleteUser,
  inviteUser,
  acceptUserInvite,
  passwordRequest,
  passwordReset,
  uploadFiles,
  importFile,
  readFiles,
  readFile,
  updateFile,
  deleteFile,
  readFolders,
  readFolder,
  createFolder,
  updateFolder,
  deleteFolder,
  readNotifications,
  createNotification,
  updateNotification,
  deleteNotification,
};
