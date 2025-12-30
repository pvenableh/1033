/**
 * useDirectusNotifications composable
 *
 * Notification management using @directus/sdk directly.
 * Supports creating, reading, and managing user notifications.
 */
import {
  createDirectus,
  rest,
  staticToken,
  createNotification,
  createNotifications,
  readNotification,
  readNotifications,
  updateNotification,
  updateNotifications,
  deleteNotification,
  deleteNotifications,
  type Query,
} from '@directus/sdk';

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
  const config = useRuntimeConfig();
  const { getClient: getAuthClient, user } = useCustomAuth();

  /**
   * Get the static token client
   */
  function getStaticClient() {
    const url = config.public.directusUrl || config.public.adminUrl;
    const token = config.public.staticToken;
    return createDirectus(url).with(rest()).with(staticToken(token));
  }

  /**
   * Get the authenticated client
   */
  function getUserClient() {
    return getAuthClient();
  }

  // ==================== CREATE OPERATIONS ====================

  /**
   * Create a notification for a user
   */
  async function create(
    data: CreateNotificationData,
    options?: { useStaticToken?: boolean }
  ): Promise<DirectusNotification> {
    const client = options?.useStaticToken ? getStaticClient() : getUserClient();
    return await client.request(createNotification(data as any));
  }

  /**
   * Create notifications for multiple users
   */
  async function createMany(
    notifications: CreateNotificationData[],
    options?: { useStaticToken?: boolean }
  ): Promise<DirectusNotification[]> {
    const client = options?.useStaticToken ? getStaticClient() : getUserClient();
    return await client.request(createNotifications(notifications as any[]));
  }

  /**
   * Send notification to a specific user
   */
  async function sendTo(
    userId: string,
    subject: string,
    message?: string,
    options?: { collection?: string; item?: string; useStaticToken?: boolean }
  ): Promise<DirectusNotification> {
    return await create(
      {
        recipient: userId,
        subject,
        message,
        collection: options?.collection,
        item: options?.item,
      },
      options
    );
  }

  /**
   * Broadcast notification to multiple users
   */
  async function broadcast(
    userIds: string[],
    subject: string,
    message?: string,
    options?: { useStaticToken?: boolean }
  ): Promise<DirectusNotification[]> {
    const notifications = userIds.map((userId) => ({
      recipient: userId,
      subject,
      message,
    }));
    return await createMany(notifications, options);
  }

  // ==================== READ OPERATIONS ====================

  /**
   * Get a single notification by ID
   */
  async function findOne(
    id: string,
    query?: Query<any, DirectusNotification>,
    options?: { useStaticToken?: boolean }
  ): Promise<DirectusNotification> {
    const client = options?.useStaticToken ? getStaticClient() : getUserClient();
    return await client.request(readNotification(id, query as any));
  }

  /**
   * Get notifications (all or filtered)
   */
  async function findMany(
    query?: Query<any, DirectusNotification>,
    options?: { useStaticToken?: boolean }
  ): Promise<DirectusNotification[]> {
    const client = options?.useStaticToken ? getStaticClient() : getUserClient();
    return await client.request(readNotifications(query as any));
  }

  /**
   * Get current user's notifications
   */
  async function getMyNotifications(
    query?: Query<any, DirectusNotification>
  ): Promise<DirectusNotification[]> {
    if (!user.value?.id) {
      throw new Error('User not authenticated');
    }

    const client = getUserClient();
    return await client.request(
      readNotifications({
        ...query,
        filter: {
          ...((query as any)?.filter || {}),
          recipient: { _eq: user.value.id },
        },
        sort: ['-timestamp'],
      } as any)
    );
  }

  /**
   * Get current user's unread notifications (inbox)
   */
  async function getUnread(
    query?: Query<any, DirectusNotification>
  ): Promise<DirectusNotification[]> {
    if (!user.value?.id) {
      throw new Error('User not authenticated');
    }

    const client = getUserClient();
    return await client.request(
      readNotifications({
        ...query,
        filter: {
          ...((query as any)?.filter || {}),
          recipient: { _eq: user.value.id },
          status: { _eq: 'inbox' },
        },
        sort: ['-timestamp'],
      } as any)
    );
  }

  /**
   * Get current user's archived notifications
   */
  async function getArchived(
    query?: Query<any, DirectusNotification>
  ): Promise<DirectusNotification[]> {
    if (!user.value?.id) {
      throw new Error('User not authenticated');
    }

    const client = getUserClient();
    return await client.request(
      readNotifications({
        ...query,
        filter: {
          ...((query as any)?.filter || {}),
          recipient: { _eq: user.value.id },
          status: { _eq: 'archived' },
        },
        sort: ['-timestamp'],
      } as any)
    );
  }

  /**
   * Count unread notifications for current user
   */
  async function countUnread(): Promise<number> {
    const unread = await getUnread({ limit: -1 });
    return unread.length;
  }

  // ==================== UPDATE OPERATIONS ====================

  /**
   * Update a notification
   */
  async function update(
    id: string,
    data: Partial<DirectusNotification>,
    options?: { useStaticToken?: boolean }
  ): Promise<DirectusNotification> {
    const client = options?.useStaticToken ? getStaticClient() : getUserClient();
    return await client.request(updateNotification(id, data as any));
  }

  /**
   * Update multiple notifications
   */
  async function updateMany(
    ids: string[],
    data: Partial<DirectusNotification>,
    options?: { useStaticToken?: boolean }
  ): Promise<DirectusNotification[]> {
    const client = options?.useStaticToken ? getStaticClient() : getUserClient();
    return await client.request(updateNotifications(ids, data as any));
  }

  /**
   * Archive a notification
   */
  async function archive(
    id: string,
    options?: { useStaticToken?: boolean }
  ): Promise<DirectusNotification> {
    return await update(id, { status: 'archived' }, options);
  }

  /**
   * Archive multiple notifications
   */
  async function archiveMany(
    ids: string[],
    options?: { useStaticToken?: boolean }
  ): Promise<DirectusNotification[]> {
    return await updateMany(ids, { status: 'archived' }, options);
  }

  /**
   * Archive all unread notifications for current user
   */
  async function archiveAll(): Promise<DirectusNotification[]> {
    const unread = await getUnread({ limit: -1 });
    if (unread.length === 0) return [];

    const ids = unread.map((n) => n.id);
    return await archiveMany(ids);
  }

  /**
   * Mark notification as unread (move back to inbox)
   */
  async function markAsUnread(
    id: string,
    options?: { useStaticToken?: boolean }
  ): Promise<DirectusNotification> {
    return await update(id, { status: 'inbox' }, options);
  }

  // ==================== DELETE OPERATIONS ====================

  /**
   * Delete a notification
   */
  async function remove(
    id: string,
    options?: { useStaticToken?: boolean }
  ): Promise<void> {
    const client = options?.useStaticToken ? getStaticClient() : getUserClient();
    await client.request(deleteNotification(id));
  }

  /**
   * Delete multiple notifications
   */
  async function removeMany(
    ids: string[],
    options?: { useStaticToken?: boolean }
  ): Promise<void> {
    const client = options?.useStaticToken ? getStaticClient() : getUserClient();
    await client.request(deleteNotifications(ids));
  }

  /**
   * Delete all archived notifications for current user
   */
  async function clearArchived(): Promise<void> {
    const archived = await getArchived({ limit: -1 });
    if (archived.length === 0) return;

    const ids = archived.map((n) => n.id);
    await removeMany(ids);
  }

  // ==================== REACTIVE HELPERS ====================

  /**
   * Create a reactive notification list with auto-refresh
   */
  function useNotificationList(options?: {
    status?: 'inbox' | 'archived';
    refreshInterval?: number;
  }) {
    const notifications = ref<DirectusNotification[]>([]);
    const loading = ref(true);
    const error = ref<string | null>(null);
    let intervalId: NodeJS.Timeout | null = null;

    const fetch = async () => {
      try {
        if (options?.status === 'archived') {
          notifications.value = await getArchived();
        } else {
          notifications.value = await getUnread();
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
      notifications,
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
