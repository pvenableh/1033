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
    staticToken: config.public.staticToken || process.env.DIRECTUS_SERVER_TOKEN,
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

  const client = createDirectus(url).with(rest());

  // Use the login request function for server-side authentication
  const result = await client.request(
    login({ email, password }, { mode: 'json' })
  );

  return {
    access_token: result.access_token!,
    refresh_token: result.refresh_token!,
    expires: result.expires!,
  };
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
 * Read current user with configured fields for this app
 */
export async function directusReadMeWithFields(accessToken: string): Promise<DirectusUserData> {
  const { url } = getDirectusConfig();

  // Call Directus API directly with the token
  const response = await $fetch<{ data: DirectusUserData }>(`${url}/users/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    query: {
      fields: [
        'id',
        'status',
        'first_name',
        'last_name',
        'email',
        'phone',
        'token',
        'avatar',
        'role.id',
        'role.name',
        'role.admin_access',
        'role.app_access',
        'person_id.id',
        'person_id.first_name',
        'person_id.last_name',
        'person_id.email',
        'person_id.phone',
        'person_id.category',
        'person_id.is_owner',
        'person_id.is_resident',
        'person_id.image',
        'person_id.mailing_address',
        'person_id.board_member.id',
        'person_id.board_member.title',
        'person_id.board_member.start',
        'person_id.board_member.finish',
        'person_id.board_member.status',
        'units.units_id.id',
        'units.units_id.number',
        'units.units_id.occupant',
        'units.units_id.parking_spot',
        'units.units_id.pets.*',
        'units.units_id.vehicles.*',
        'units.units_id.people.people_id.id',
        'units.units_id.people.people_id.first_name',
        'units.units_id.people.people_id.last_name',
        'units.units_id.people.people_id.email',
        'units.units_id.people.people_id.phone',
        'units.units_id.people.people_id.category',
        'units.units_id.people.people_id.is_owner',
        'units.units_id.people.people_id.is_resident',
        'units.units_id.people.people_id.image',
        'units.units_id.people.people_id.board_member.*',
        'units.units_id.people.people_id.leases.start',
        'units.units_id.people.people_id.leases.finish',
      ].join(','),
    },
  });

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
