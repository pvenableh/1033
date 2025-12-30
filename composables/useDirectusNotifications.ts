/**
 * useDirectusNotifications composable
 *
 * Notification management via server API endpoints.
 * Supports creating, reading, and managing user notifications.
 */

export interface DirectusNotification {
  id: string;
  timestamp: string;
  status: 'inbox' | 'archived';
  recipient: string;
  sender: string | null;
  subject: string;
  message: string | null;
  collection: string | null;
  item: string | null;
}

export interface CreateNotificationData {
  recipient: string;
  subject: string;
  message?: string;
  collection?: string;
  item?: string;
}

export function useDirectusNotifications() {
  const notifications = useDirectusItems<DirectusNotification>('directus_notifications');
  const { user } = useDirectusAuth();

  // ==================== CREATE OPERATIONS ====================

  /**
   * Create a notification for a user
   */
  const create = async (data: CreateNotificationData): Promise<DirectusNotification> => {
    return await notifications.create(data as Partial<DirectusNotification>);
  };

  /**
   * Create notifications for multiple users
   */
  const createMany = async (
    notificationList: CreateNotificationData[]
  ): Promise<DirectusNotification[]> => {
    return await notifications.createMany(notificationList as Partial<DirectusNotification>[]);
  };

  /**
   * Send notification to a specific user
   */
  const sendTo = async (
    userId: string,
    subject: string,
    message?: string,
    options?: { collection?: string; item?: string }
  ): Promise<DirectusNotification> => {
    return await create({
      recipient: userId,
      subject,
      message,
      collection: options?.collection,
      item: options?.item,
    });
  };

  /**
   * Broadcast notification to multiple users
   */
  const broadcast = async (
    userIds: string[],
    subject: string,
    message?: string
  ): Promise<DirectusNotification[]> => {
    const notificationList = userIds.map((userId) => ({
      recipient: userId,
      subject,
      message,
    }));
    return await createMany(notificationList);
  };

  // ==================== READ OPERATIONS ====================

  /**
   * Get a single notification by ID
   */
  const findOne = async (
    id: string,
    query?: { fields?: string[]; deep?: Record<string, any> }
  ): Promise<DirectusNotification> => {
    return await notifications.get(id, query);
  };

  /**
   * Get notifications (all or filtered)
   */
  const findMany = async (query?: {
    fields?: string[];
    filter?: Record<string, any>;
    sort?: string[];
    limit?: number;
  }): Promise<DirectusNotification[]> => {
    return await notifications.list(query);
  };

  /**
   * Get current user's notifications
   */
  const getMyNotifications = async (query?: {
    fields?: string[];
    filter?: Record<string, any>;
    sort?: string[];
    limit?: number;
  }): Promise<DirectusNotification[]> => {
    if (!user.value?.id) {
      throw new Error('User not authenticated');
    }

    return await notifications.list({
      ...query,
      filter: {
        ...(query?.filter || {}),
        recipient: { _eq: user.value.id },
      },
      sort: query?.sort || ['-timestamp'],
    });
  };

  /**
   * Get current user's unread notifications (inbox)
   */
  const getUnread = async (query?: {
    fields?: string[];
    filter?: Record<string, any>;
    limit?: number;
  }): Promise<DirectusNotification[]> => {
    if (!user.value?.id) {
      throw new Error('User not authenticated');
    }

    return await notifications.list({
      ...query,
      filter: {
        ...(query?.filter || {}),
        recipient: { _eq: user.value.id },
        status: { _eq: 'inbox' },
      },
      sort: ['-timestamp'],
    });
  };

  /**
   * Get current user's archived notifications
   */
  const getArchived = async (query?: {
    fields?: string[];
    filter?: Record<string, any>;
    limit?: number;
  }): Promise<DirectusNotification[]> => {
    if (!user.value?.id) {
      throw new Error('User not authenticated');
    }

    return await notifications.list({
      ...query,
      filter: {
        ...(query?.filter || {}),
        recipient: { _eq: user.value.id },
        status: { _eq: 'archived' },
      },
      sort: ['-timestamp'],
    });
  };

  /**
   * Count unread notifications for current user
   */
  const countUnread = async (): Promise<number> => {
    const unread = await getUnread({ limit: -1 });
    return unread.length;
  };

  // ==================== UPDATE OPERATIONS ====================

  /**
   * Update a notification
   */
  const update = async (
    id: string,
    data: Partial<DirectusNotification>
  ): Promise<DirectusNotification> => {
    return await notifications.update(id, data);
  };

  /**
   * Update multiple notifications
   */
  const updateMany = async (
    ids: string[],
    data: Partial<DirectusNotification>
  ): Promise<DirectusNotification[]> => {
    return await notifications.updateMany(ids, data);
  };

  /**
   * Archive a notification
   */
  const archive = async (id: string): Promise<DirectusNotification> => {
    return await update(id, { status: 'archived' });
  };

  /**
   * Archive multiple notifications
   */
  const archiveMany = async (ids: string[]): Promise<DirectusNotification[]> => {
    return await updateMany(ids, { status: 'archived' });
  };

  /**
   * Archive all unread notifications for current user
   */
  const archiveAll = async (): Promise<DirectusNotification[]> => {
    const unread = await getUnread({ limit: -1 });
    if (unread.length === 0) return [];

    const ids = unread.map((n) => n.id);
    return await archiveMany(ids);
  };

  /**
   * Mark notification as unread (move back to inbox)
   */
  const markAsUnread = async (id: string): Promise<DirectusNotification> => {
    return await update(id, { status: 'inbox' });
  };

  // ==================== DELETE OPERATIONS ====================

  /**
   * Delete a notification
   */
  const remove = async (id: string): Promise<boolean> => {
    return await notifications.remove(id);
  };

  /**
   * Delete multiple notifications
   */
  const removeMany = async (ids: string[]): Promise<boolean> => {
    return await notifications.remove(ids);
  };

  /**
   * Delete all archived notifications for current user
   */
  const clearArchived = async (): Promise<void> => {
    const archived = await getArchived({ limit: -1 });
    if (archived.length === 0) return;

    const ids = archived.map((n) => n.id);
    await removeMany(ids);
  };

  // ==================== REACTIVE HELPERS ====================

  /**
   * Create a reactive notification list with auto-refresh
   */
  function useNotificationList(options?: {
    status?: 'inbox' | 'archived';
    refreshInterval?: number;
  }) {
    const notificationsList = ref<DirectusNotification[]>([]);
    const loading = ref(true);
    const error = ref<string | null>(null);
    let intervalId: NodeJS.Timeout | null = null;

    const fetch = async () => {
      try {
        if (options?.status === 'archived') {
          notificationsList.value = await getArchived();
        } else {
          notificationsList.value = await getUnread();
        }
        error.value = null;
      } catch (e: any) {
        error.value = e.message;
      } finally {
        loading.value = false;
      }
    };

    onMounted(() => {
      fetch();
      if (options?.refreshInterval) {
        intervalId = setInterval(fetch, options.refreshInterval);
      }
    });

    onUnmounted(() => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    });

    return {
      notifications: notificationsList,
      loading,
      error,
      refresh: fetch,
    };
  }

  return {
    // Create
    create,
    createMany,
    sendTo,
    broadcast,

    // Read
    findOne,
    findMany,
    getMyNotifications,
    getUnread,
    getArchived,
    countUnread,

    // Update
    update,
    updateMany,
    archive,
    archiveMany,
    archiveAll,
    markAsUnread,

    // Delete
    remove,
    removeMany,
    clearArchived,

    // Reactive
    useNotificationList,
  };
}
