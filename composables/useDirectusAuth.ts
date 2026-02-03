/**
 * useDirectusAuth - Authentication composable
 *
 * Handles authentication flows (login, logout, register) by calling
 * server endpoints and integrating with nuxt-auth-utils session management.
 *
 * For user-specific operations (profile, invitations, password resets),
 * use useDirectusUser() instead.
 *
 * Usage:
 * const { login, logout, register, user, loggedIn } = useDirectusAuth()
 */

export const useDirectusAuth = () => {
  // Get session from nuxt-auth-utils
  const session = useUserSession();

  // Computed refs from session
  const user = computed(() => session.user.value);
  const loggedIn = computed(() => session.loggedIn.value);

  /**
   * Login with email and password
   * Accepts either an object { email, password } or two separate parameters
   */
  const login = async (
    emailOrData: string | { email: string; password: string },
    password?: string
  ) => {
    // Handle both object and separate parameters
    const credentials =
      typeof emailOrData === 'string'
        ? { email: emailOrData, password: password! }
        : emailOrData;

    try {
      const data = await $fetch('/api/auth/login', {
        method: 'POST',
        body: credentials,
      });

      // Fetch the updated session
      await session.fetch();

      return data;
    } catch (error: any) {
      // Re-throw with proper error details
      const errorMessage =
        error?.data?.message ||
        error?.statusMessage ||
        error?.message ||
        'Login failed';
      const enhancedError = new Error(errorMessage);
      (enhancedError as any).data = error?.data;
      (enhancedError as any).statusCode = error?.statusCode;
      throw enhancedError;
    }
  };

  /**
   * Logout current user
   */
  const logout = async () => {
    try {
      await $fetch('/api/auth/logout', {
        method: 'POST',
      });

      // Clear the session
      await session.clear();
    } catch (error: any) {
      // Even if the server call fails, clear local session
      await session.clear();
      throw new Error(error.message || 'Logout failed');
    }
  };

  /**
   * Register a new user
   */
  const register = async (userData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone?: string;
    description?: Record<string, any>;
  }) => {
    try {
      const data = await $fetch('/api/auth/register', {
        method: 'POST',
        body: userData,
      });

      return data;
    } catch (error: any) {
      const errorMessage =
        error?.data?.message || error?.message || 'Registration failed';
      throw new Error(errorMessage);
    }
  };

  /**
   * Request password reset email
   */
  const requestPasswordReset = async (email: string, resetUrl?: string) => {
    const { requestPasswordReset: resetRequest } = useDirectusUser();
    return await resetRequest(email, resetUrl);
  };

  /**
   * Reset password with token
   */
  const resetPassword = async (token: string, password: string) => {
    const { resetPassword: reset } = useDirectusUser();
    return await reset(token, password);
  };

  /**
   * Refresh current user session with fresh data from Directus
   * Note: The server endpoint updates the session cookie directly,
   * so we don't need to call session.fetch() which can cause context issues
   * when called after async operations in middleware.
   */
  const refreshUser = async () => {
    try {
      const response = await $fetch('/api/auth/refresh-session', {
        method: 'POST',
      });

      // The session cookie is already updated by the server endpoint.
      // Return the user data from the response instead of calling session.fetch()
      // which can fail with "composable called outside setup function" errors
      // when used in middleware after async operations.
      return (response as any)?.user || session.user.value;
    } catch (error: any) {
      // If refresh fails, return current session user
      // Don't call session.fetch() to avoid context issues
      console.error('Session refresh error:', error?.message || error);
      return session.user.value;
    }
  };

  return {
    // State
    user,
    loggedIn,

    // Actions
    login,
    logout,
    register,
    refreshUser,

    // Password management
    requestPasswordReset,
    resetPassword,

    // Session utilities
    fetch: session.fetch,
    clear: session.clear,
  };
};
