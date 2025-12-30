/**
 * useDirectusUser - User-specific operations composable
 *
 * Handles current user operations, profile updates, user management,
 * invitations, and password resets via server API endpoints.
 *
 * Usage:
 * const { me, updateProfile, inviteUser, acceptInvite, resetPassword } = useDirectusUser()
 */

export const useDirectusUser = () => {
  const { loggedIn } = useUserSession();

  /**
   * Get current user data
   */
  const me = async (fields?: string[]) => {
    if (!loggedIn.value) {
      throw new Error('Authentication required');
    }

    const query = fields ? { fields: fields.join(',') } : undefined;

    const data = await $fetch('/api/directus/users/me', {
      method: 'GET',
      query,
    });

    return data;
  };

  /**
   * Update current user's profile
   */
  const updateProfile = async (updates: Record<string, any>) => {
    if (!loggedIn.value) {
      throw new Error('Authentication required');
    }

    const data = await $fetch('/api/directus/users/me', {
      method: 'PATCH',
      body: updates,
    });

    return data;
  };

  /**
   * Invite a new user (admin only)
   */
  const inviteUser = async (
    email: string,
    role: string,
    additionalData?: Record<string, any>
  ) => {
    if (!loggedIn.value) {
      throw new Error('Authentication required');
    }

    const data = await $fetch('/api/directus/users/invite', {
      method: 'POST',
      body: {
        email,
        role,
        ...additionalData,
      },
    });

    return data;
  };

  /**
   * Accept an invitation and set password
   */
  const acceptInvite = async (token: string, password: string) => {
    const data = await $fetch('/api/directus/users/accept-invite', {
      method: 'POST',
      body: {
        token,
        password,
      },
    });

    return data;
  };

  /**
   * Request password reset
   */
  const requestPasswordReset = async (email: string, resetUrl?: string) => {
    const data = await $fetch('/api/directus/users/password-reset-request', {
      method: 'POST',
      body: {
        email,
        reset_url: resetUrl,
      },
    });

    return data;
  };

  /**
   * Reset password with token
   */
  const resetPassword = async (token: string, password: string) => {
    const data = await $fetch('/api/directus/users/password-reset', {
      method: 'POST',
      body: {
        token,
        password,
      },
    });

    return data;
  };

  /**
   * Get user by ID (admin only)
   */
  const getUser = async (userId: string, fields?: string[]) => {
    if (!loggedIn.value) {
      throw new Error('Authentication required');
    }

    const { get } = useDirectusItems('directus_users');
    return await get(userId, { fields });
  };

  /**
   * Update user by ID (admin only)
   */
  const updateUser = async (userId: string, updates: Record<string, any>) => {
    if (!loggedIn.value) {
      throw new Error('Authentication required');
    }

    const { update } = useDirectusItems('directus_users');
    return await update(userId, updates);
  };

  /**
   * Delete user by ID (admin only)
   */
  const deleteUser = async (userId: string) => {
    if (!loggedIn.value) {
      throw new Error('Authentication required');
    }

    const { remove } = useDirectusItems('directus_users');
    return await remove(userId);
  };

  /**
   * List users (admin only)
   */
  const listUsers = async (query?: {
    filter?: Record<string, any>;
    fields?: string[];
    sort?: string[];
    limit?: number;
  }) => {
    if (!loggedIn.value) {
      throw new Error('Authentication required');
    }

    const { list } = useDirectusItems('directus_users');
    return await list(query);
  };

  return {
    // Current user
    me,
    updateProfile,

    // Invitations
    inviteUser,
    acceptInvite,

    // Password management
    requestPasswordReset,
    resetPassword,

    // User management (admin)
    getUser,
    updateUser,
    deleteUser,
    listUsers,
  };
};
