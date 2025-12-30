/**
 * useCustomAuth composable
 *
 * Custom authentication composable using @directus/sdk directly.
 * This bypasses nuxt-directus-next to avoid version conflicts.
 */
import {
  createDirectus,
  rest,
  authentication,
  readMe,
  type DirectusClient,
  type RestClient,
  type AuthenticationClient,
} from '@directus/sdk';

// Cookie names for token storage
const ACCESS_TOKEN_COOKIE = 'directus_access_token';
const REFRESH_TOKEN_COOKIE = 'directus_refresh_token';

// User state (shared across the app)
const authUser = ref<any>(null);
const isAuthenticated = computed(() => !!authUser.value);
const isLoading = ref(false);
const authError = ref<string | null>(null);

// Client instance (singleton)
let directusClient: DirectusClient<any> & RestClient<any> & AuthenticationClient<any> | null = null;

export function useCustomAuth() {
  const config = useRuntimeConfig();
  const accessTokenCookie = useCookie(ACCESS_TOKEN_COOKIE, {
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
  const refreshTokenCookie = useCookie(REFRESH_TOKEN_COOKIE, {
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });

  /**
   * Get or create the Directus client
   */
  function getClient() {
    if (!directusClient) {
      const url = config.public.directusUrl || config.public.adminUrl;

      directusClient = createDirectus(url)
        .with(rest())
        .with(authentication('json', {
          credentials: 'include',
          autoRefresh: true,
          storage: {
            get: () => {
              const access_token = accessTokenCookie.value || null;
              const refresh_token = refreshTokenCookie.value || null;
              return access_token || refresh_token ? { access_token, refresh_token } : null;
            },
            set: (data) => {
              if (data?.access_token) {
                accessTokenCookie.value = data.access_token;
              }
              if (data?.refresh_token) {
                refreshTokenCookie.value = data.refresh_token;
              }
            },
          },
        }));
    }
    return directusClient;
  }

  /**
   * Login with email and password
   */
  async function login(email: string, password: string): Promise<any> {
    isLoading.value = true;
    authError.value = null;

    // Validate inputs
    if (!email || typeof email !== 'string') {
      authError.value = 'Email is required';
      isLoading.value = false;
      throw new Error('Email is required');
    }
    if (!password || typeof password !== 'string') {
      authError.value = 'Password is required';
      isLoading.value = false;
      throw new Error('Password is required');
    }

    try {
      const client = getClient();

      // Call the SDK login method - SDK v20 supports both object and positional args
      // Using object format for explicit clarity
      const result = await client.login(email, password);

      // Store tokens in cookies
      if (result?.access_token) {
        accessTokenCookie.value = result.access_token;
      }
      if (result?.refresh_token) {
        refreshTokenCookie.value = result.refresh_token;
      }

      // Fetch user data
      await fetchUser();

      return result;
    } catch (error: any) {
      console.error('Login error:', error);
      authError.value = error?.errors?.[0]?.message || error?.message || 'Login failed';
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Logout and clear tokens
   */
  async function logout(): Promise<void> {
    try {
      const client = getClient();
      await client.logout();
    } catch (error) {
      // Ignore logout errors
      console.warn('Logout error:', error);
    } finally {
      // Clear tokens and user state
      accessTokenCookie.value = null;
      refreshTokenCookie.value = null;
      authUser.value = null;
    }
  }

  /**
   * Refresh the access token
   */
  async function refresh(): Promise<any> {
    try {
      const client = getClient();
      const result = await client.refresh();

      if (result?.access_token) {
        accessTokenCookie.value = result.access_token;
      }
      if (result?.refresh_token) {
        refreshTokenCookie.value = result.refresh_token;
      }

      return result;
    } catch (error: any) {
      // If refresh fails, clear tokens
      accessTokenCookie.value = null;
      refreshTokenCookie.value = null;
      authUser.value = null;
      throw error;
    }
  }

  /**
   * Fetch the current user data
   */
  async function fetchUser(): Promise<any> {
    isLoading.value = true;

    try {
      const client = getClient();

      // Build the fields query matching readMeQuery from nuxt.config
      const user = await client.request(
        readMe({
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
            'units.units_id.people.people_id.board_member.id',
            'units.units_id.people.people_id.board_member.title',
            'units.units_id.people.people_id.board_member.start',
            'units.units_id.people.people_id.board_member.finish',
            'units.units_id.people.people_id.board_member.status',
            'units.units_id.people.people_id.leases.start',
            'units.units_id.people.people_id.leases.finish',
          ],
        })
      );

      authUser.value = user;
      return user;
    } catch (error: any) {
      authError.value = error?.message || 'Failed to fetch user';
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Check if user has a valid session (try to refresh if needed)
   */
  async function checkAuth(): Promise<boolean> {
    // If we have a user, we're authenticated
    if (authUser.value) {
      return true;
    }

    // If we have tokens, try to get the user
    if (accessTokenCookie.value || refreshTokenCookie.value) {
      try {
        // Try to refresh if we only have a refresh token
        if (!accessTokenCookie.value && refreshTokenCookie.value) {
          await refresh();
        }
        await fetchUser();
        return true;
      } catch (error) {
        // Tokens are invalid, clear them
        accessTokenCookie.value = null;
        refreshTokenCookie.value = null;
        authUser.value = null;
        return false;
      }
    }

    return false;
  }

  /**
   * Set user data directly (useful for SSR hydration)
   */
  function setUser(user: any) {
    authUser.value = user;
  }

  /**
   * Get the current access token
   */
  function getAccessToken(): string | null {
    return accessTokenCookie.value || null;
  }

  return {
    // State
    user: authUser,
    isAuthenticated,
    isLoading,
    error: authError,

    // Methods
    login,
    logout,
    refresh,
    fetchUser,
    checkAuth,
    setUser,
    getAccessToken,
    getClient,
  };
}
