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
  type DirectusClient,
  type RestClient,
  type AuthenticationClient,
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
 * Create a Directus client with static token (for server-side operations)
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
 * Create a Directus client with user authentication
 */
export function useDirectusClient(accessToken?: string) {
  const { url } = getDirectusConfig();

  if (!url) {
    throw new Error('DIRECTUS_URL is not configured');
  }

  const client = createDirectus(url)
    .with(rest())
    .with(authentication('json'));

  // If access token provided, set it on the client
  if (accessToken) {
    (client as any).setToken(accessToken);
  }

  return client;
}

/**
 * Login to Directus and return tokens
 */
export async function directusLogin(email: string, password: string): Promise<DirectusTokens> {
  const { url } = getDirectusConfig();

  const client = createDirectus(url)
    .with(rest())
    .with(authentication('json'));

  const result = await client.login(email, password);

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
