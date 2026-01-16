/**
 * useNotificationCenter composable
 *
 * Central state management for the notification system.
 * Combines user notifications from Directus with public notices.
 * Provides reactive state for unread counts and panel visibility.
 */

import type { DirectusNotification } from './useDirectusNotifications';

export interface Notice {
  id: string;
  title: string;
  content?: string;
  type: 'announcement' | 'update' | 'alert' | 'maintenance' | string;
  visibility: string[];
  status: 'draft' | 'published' | 'archived';
  published_at?: string;
  expires_at?: string;
  pinned: boolean;
  date_created?: string;
}

// Keep Announcement for backwards compatibility
export type Announcement = Notice;

export interface NotificationCenterState {
  isOpen: boolean;
  activeTab: 'all' | 'unread' | 'notices';
  notifications: DirectusNotification[];
  notices: Notice[];
  unreadCount: number;
  unreadNoticeCount: number;
  loading: boolean;
  error: string | null;
}

// Global state (singleton pattern for SSR compatibility)
const isOpen = ref(false);
const activeTab = ref<'all' | 'unread' | 'notices'>('unread');
const notifications = ref<DirectusNotification[]>([]);
const notices = ref<Notice[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const lastFetchTime = ref<number>(0);

// LocalStorage key for tracking read notices (for public visitors)
const STORAGE_KEY = '1033_read_notices';
const readNoticeIds = ref<Set<string>>(new Set());

export function useNotificationCenter() {
  const { user } = useDirectusAuth();
  const directusNotifications = useDirectusNotifications();
  const noticesCollection = useDirectusItems<Notice>('notices');

  // Computed: total unread count (notifications + unread notices)
  const unreadNotificationCount = computed(() => {
    return notifications.value.filter((n) => n.status === 'inbox').length;
  });

  const unreadNoticeCount = computed(() => {
    return notices.value.filter((n) => !readNoticeIds.value.has(n.id)).length;
  });

  // Alias for backwards compatibility
  const unreadAnnouncementCount = unreadNoticeCount;

  const totalUnreadCount = computed(() => {
    return unreadNotificationCount.value + unreadNoticeCount.value;
  });

  // Initialize read notices from localStorage
  const initReadNotices = () => {
    if (import.meta.client) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          readNoticeIds.value = new Set(JSON.parse(stored));
        }
      } catch (e) {
        console.error('Failed to load read notices from localStorage:', e);
      }
    }
  };

  // Save read notices to localStorage
  const saveReadNotices = () => {
    if (import.meta.client) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...readNoticeIds.value]));
      } catch (e) {
        console.error('Failed to save read notices to localStorage:', e);
      }
    }
  };

  // Mark a notice as read (for public visitors)
  const markNoticeAsRead = (noticeId: string) => {
    readNoticeIds.value.add(noticeId);
    saveReadNotices();
  };

  // Alias for backwards compatibility
  const markAnnouncementAsRead = markNoticeAsRead;

  // Check if a notice has been read
  const isNoticeRead = (noticeId: string): boolean => {
    return readNoticeIds.value.has(noticeId);
  };

  // Alias for backwards compatibility
  const isAnnouncementRead = isNoticeRead;

  // Determine visibility filter based on user status (requires authentication)
  const getVisibilityFilter = () => {
    const { isBoardMember } = useRoles();

    // Notifications require sign-in - no public visibility
    if (!user.value) {
      return [];
    }

    // Build visibility array based on user role
    const visibilities = ['residents'];

    if (isBoardMember.value) {
      visibilities.push('board');
    }

    return visibilities;
  };

  // Fetch notices (requires authentication - no public visibility)
  const fetchNotices = async () => {
    const visibilities = getVisibilityFilter();

    // No notices for unauthenticated users
    if (visibilities.length === 0) {
      notices.value = [];
      return;
    }

    try {
      const now = new Date().toISOString();

      // Fetch published notices and filter visibility client-side
      // (Directus JSON fields don't support _contains filter)
      const result = await noticesCollection.list({
        fields: ['id', 'title', 'content', 'type', 'visibility', 'status', 'published_at', 'expires_at', 'pinned', 'date_created'],
        filter: {
          status: { _eq: 'published' },
          _and: [
            // Check if published (or no publish date set)
            {
              _or: [
                { published_at: { _lte: now } },
                { published_at: { _null: true } },
              ],
            },
            // Check if not expired (or no expiry date set)
            {
              _or: [
                { expires_at: { _gte: now } },
                { expires_at: { _null: true } },
              ],
            },
          ],
        },
        sort: ['-pinned', '-published_at', '-date_created'],
        limit: 50,
      });

      // Filter by visibility client-side (visibility is a JSON array)
      notices.value = result.filter((notice) => {
        if (!notice.visibility || !Array.isArray(notice.visibility)) {
          return false;
        }
        return visibilities.some((v) => notice.visibility.includes(v));
      });
    } catch (e: any) {
      // Silently handle common errors (collection doesn't exist, permissions, etc.)
      // This prevents console spam when notices collection isn't set up
      const isExpectedError = e?.statusCode === 400 || e?.statusCode === 403 || e?.statusCode === 404;
      if (!isExpectedError) {
        console.error('Failed to fetch notices:', e);
      }
      notices.value = [];
    }
  };

  // Alias for backwards compatibility
  const fetchAnnouncements = fetchNotices;

  // Fetch user notifications (requires auth)
  const fetchNotifications = async () => {
    if (!user.value?.id) {
      notifications.value = [];
      return;
    }

    try {
      const result = await directusNotifications.getMyNotifications({
        limit: 50,
        sort: ['-timestamp'],
      });
      notifications.value = result;
    } catch (e: any) {
      console.error('Failed to fetch notifications:', e);
      error.value = e.message;
    }
  };

  // Refresh all data
  const refresh = async () => {
    const now = Date.now();
    // Throttle refreshes to every 5 seconds
    if (now - lastFetchTime.value < 5000) {
      return;
    }

    loading.value = true;
    error.value = null;
    lastFetchTime.value = now;

    try {
      await Promise.all([fetchNotifications(), fetchNotices()]);
    } finally {
      loading.value = false;
    }
  };

  // Panel controls
  const openPanel = () => {
    isOpen.value = true;
    refresh();
  };

  const closePanel = () => {
    isOpen.value = false;
  };

  const togglePanel = () => {
    if (isOpen.value) {
      closePanel();
    } else {
      openPanel();
    }
  };

  // Notification actions
  const markAsRead = async (notificationId: string) => {
    try {
      await directusNotifications.archive(notificationId);
      const notification = notifications.value.find((n) => n.id === notificationId);
      if (notification) {
        notification.status = 'archived';
      }
    } catch (e: any) {
      error.value = e.message;
    }
  };

  const markAllAsRead = async () => {
    try {
      // Mark all notifications as archived
      await directusNotifications.archiveAll();
      notifications.value.forEach((n) => {
        n.status = 'archived';
      });

      // Mark all notices as read
      notices.value.forEach((n) => {
        readNoticeIds.value.add(n.id);
      });
      saveReadNotices();
    } catch (e: any) {
      error.value = e.message;
    }
  };

  const markAsUnread = async (notificationId: string) => {
    try {
      await directusNotifications.markAsUnread(notificationId);
      const notification = notifications.value.find((n) => n.id === notificationId);
      if (notification) {
        notification.status = 'inbox';
      }
    } catch (e: any) {
      error.value = e.message;
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await directusNotifications.remove(notificationId);
      notifications.value = notifications.value.filter((n) => n.id !== notificationId);
    } catch (e: any) {
      error.value = e.message;
    }
  };

  // Initialize on mount
  const initialize = () => {
    initReadNotices();
    refresh();
  };

  // Set up auto-refresh interval
  let refreshInterval: NodeJS.Timeout | null = null;

  const startAutoRefresh = (intervalMs: number = 60000) => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }
    refreshInterval = setInterval(refresh, intervalMs);
  };

  const stopAutoRefresh = () => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
      refreshInterval = null;
    }
  };

  // Realtime WebSocket subscription for notices
  let noticesUnsubscribe: (() => void) | null = null;

  const startRealtimeSubscription = async () => {
    // Only subscribe for authenticated users
    if (!user.value) {
      return;
    }

    try {
      const { subscribe } = useDirectusWebSocket();

      noticesUnsubscribe = await subscribe<Notice>(
        {
          collection: 'notices',
          query: {
            fields: ['id', 'title', 'content', 'type', 'visibility', 'status', 'published_at', 'expires_at', 'pinned', 'date_created'],
            filter: {
              status: { _eq: 'published' },
            },
          },
          uid: 'notices-realtime',
        },
        (event) => {
          // Refresh notices on any change (create, update, delete)
          if (event.type === 'create' || event.type === 'update' || event.type === 'delete') {
            fetchNotices();
          }
        }
      );
    } catch (e: any) {
      // WebSocket subscription failed - fall back to polling only
      console.warn('Notices realtime subscription failed, using polling fallback:', e.message);
    }
  };

  const stopRealtimeSubscription = () => {
    if (noticesUnsubscribe) {
      noticesUnsubscribe();
      noticesUnsubscribe = null;
    }
  };

  return {
    // State
    isOpen: readonly(isOpen),
    activeTab,
    notifications: readonly(notifications),
    notices: readonly(notices),
    // Backwards compatibility alias
    announcements: readonly(notices),
    loading: readonly(loading),
    error: readonly(error),

    // Computed
    unreadNotificationCount,
    unreadNoticeCount,
    unreadAnnouncementCount, // Backwards compatibility
    totalUnreadCount,

    // Panel controls
    openPanel,
    closePanel,
    togglePanel,

    // Notification actions
    markAsRead,
    markAllAsRead,
    markAsUnread,
    deleteNotification,

    // Notice actions
    markNoticeAsRead,
    isNoticeRead,
    // Backwards compatibility aliases
    markAnnouncementAsRead,
    isAnnouncementRead,

    // Data fetching
    refresh,
    fetchNotifications,
    fetchNotices,
    fetchAnnouncements, // Backwards compatibility
    initialize,

    // Auto-refresh
    startAutoRefresh,
    stopAutoRefresh,

    // Realtime subscription
    startRealtimeSubscription,
    stopRealtimeSubscription,
  };
}
