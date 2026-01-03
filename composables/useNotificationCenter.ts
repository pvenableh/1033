/**
 * useNotificationCenter composable
 *
 * Central state management for the notification system.
 * Combines user notifications from Directus with public announcements.
 * Provides reactive state for unread counts and panel visibility.
 */

import type { DirectusNotification } from './useDirectusNotifications';

export interface Announcement {
  id: string;
  title: string;
  subtitle?: string;
  content?: string;
  url?: string;
  date_sent: string;
  status: string;
  tags?: string[];
  is_public?: boolean;
}

export interface NotificationCenterState {
  isOpen: boolean;
  activeTab: 'all' | 'unread' | 'announcements';
  notifications: DirectusNotification[];
  announcements: Announcement[];
  unreadCount: number;
  unreadAnnouncementCount: number;
  loading: boolean;
  error: string | null;
}

// Global state (singleton pattern for SSR compatibility)
const isOpen = ref(false);
const activeTab = ref<'all' | 'unread' | 'announcements'>('unread');
const notifications = ref<DirectusNotification[]>([]);
const announcements = ref<Announcement[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const lastFetchTime = ref<number>(0);

// LocalStorage key for tracking read announcements (for public visitors)
const STORAGE_KEY = '1033_read_announcements';
const readAnnouncementIds = ref<Set<string>>(new Set());

export function useNotificationCenter() {
  const { user } = useDirectusAuth();
  const directusNotifications = useDirectusNotifications();
  const announcementsCollection = useDirectusItems<Announcement>('announcements', { requireAuth: false });

  // Computed: total unread count (notifications + unread announcements)
  const unreadNotificationCount = computed(() => {
    return notifications.value.filter((n) => n.status === 'inbox').length;
  });

  const unreadAnnouncementCount = computed(() => {
    return announcements.value.filter((a) => !readAnnouncementIds.value.has(a.id)).length;
  });

  const totalUnreadCount = computed(() => {
    return unreadNotificationCount.value + unreadAnnouncementCount.value;
  });

  // Initialize read announcements from localStorage
  const initReadAnnouncements = () => {
    if (import.meta.client) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          readAnnouncementIds.value = new Set(JSON.parse(stored));
        }
      } catch (e) {
        console.error('Failed to load read announcements from localStorage:', e);
      }
    }
  };

  // Save read announcements to localStorage
  const saveReadAnnouncements = () => {
    if (import.meta.client) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...readAnnouncementIds.value]));
      } catch (e) {
        console.error('Failed to save read announcements to localStorage:', e);
      }
    }
  };

  // Mark an announcement as read (for public visitors)
  const markAnnouncementAsRead = (announcementId: string) => {
    readAnnouncementIds.value.add(announcementId);
    saveReadAnnouncements();
  };

  // Check if an announcement has been read
  const isAnnouncementRead = (announcementId: string): boolean => {
    return readAnnouncementIds.value.has(announcementId);
  };

  // Fetch announcements (public - no auth required)
  const fetchAnnouncements = async () => {
    try {
      const result = await announcementsCollection.list({
        fields: ['id', 'title', 'subtitle', 'content', 'url', 'date_sent', 'status', 'tags', 'is_public'],
        filter: {
          status: { _eq: 'sent' },
          _or: [
            { is_public: { _eq: true } },
            { is_public: { _null: true } }, // Treat null as public for backwards compatibility
          ],
        },
        sort: ['-date_sent'],
        limit: 20,
      });
      announcements.value = result;
    } catch (e: any) {
      console.error('Failed to fetch announcements:', e);
    }
  };

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
      await Promise.all([fetchNotifications(), fetchAnnouncements()]);
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

      // Mark all announcements as read
      announcements.value.forEach((a) => {
        readAnnouncementIds.value.add(a.id);
      });
      saveReadAnnouncements();
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
    initReadAnnouncements();
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

  return {
    // State
    isOpen: readonly(isOpen),
    activeTab,
    notifications: readonly(notifications),
    announcements: readonly(announcements),
    loading: readonly(loading),
    error: readonly(error),

    // Computed
    unreadNotificationCount,
    unreadAnnouncementCount,
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

    // Announcement actions
    markAnnouncementAsRead,
    isAnnouncementRead,

    // Data fetching
    refresh,
    fetchNotifications,
    fetchAnnouncements,
    initialize,

    // Auto-refresh
    startAutoRefresh,
    stopAutoRefresh,
  };
}
