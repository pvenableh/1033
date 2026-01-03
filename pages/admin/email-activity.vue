<script setup lang="ts">
import type { EmailActivity, Announcement } from '~/types/directus';

definePageMeta({
  layout: 'default',
  middleware: ['auth'],
});

const toast = useToast();
const { isAdmin, isBoardMember } = useRoles();
const { hasPermission } = useUserPermissions();

// Check if user has access
const hasAccess = computed(() => {
  return isAdmin.value || isBoardMember.value || hasPermission('announcements', 'read');
});

// State
const activities = ref<EmailActivity[]>([]);
const announcements = ref<Announcement[]>([]);
const loading = ref(true);
const searchQuery = ref('');
const eventFilter = ref<string>('all');
const announcementFilter = ref<string>('all');

// Stats
const stats = computed(() => {
  const total = activities.value.length;
  const opens = activities.value.filter(a => a.event === 'open').length;
  const clicks = activities.value.filter(a => a.event === 'click').length;
  const bounces = activities.value.filter(a => a.event === 'bounce').length;
  const delivered = activities.value.filter(a => a.event === 'delivered').length;

  return { total, opens, clicks, bounces, delivered };
});

// Event options
const eventOptions = [
  { label: 'All Events', value: 'all' },
  { label: 'Delivered', value: 'delivered', color: 'green', icon: 'i-heroicons-check-circle' },
  { label: 'Opened', value: 'open', color: 'blue', icon: 'i-heroicons-envelope-open' },
  { label: 'Clicked', value: 'click', color: 'purple', icon: 'i-heroicons-cursor-arrow-rays' },
  { label: 'Bounced', value: 'bounce', color: 'red', icon: 'i-heroicons-exclamation-triangle' },
];

// Computed
const filteredActivities = computed(() => {
  let result = activities.value;

  if (eventFilter.value !== 'all') {
    result = result.filter(a => a.event === eventFilter.value);
  }

  if (announcementFilter.value !== 'all') {
    result = result.filter(a => {
      const announcementId = typeof a.announcement === 'object' ? a.announcement?.id : a.announcement;
      return String(announcementId) === announcementFilter.value;
    });
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(a =>
      a.email?.toLowerCase().includes(query) ||
      (typeof a.person === 'object' && a.person?.first_name?.toLowerCase().includes(query)) ||
      (typeof a.person === 'object' && a.person?.last_name?.toLowerCase().includes(query))
    );
  }

  return result;
});

const announcementOptions = computed(() => {
  return [
    { label: 'All Announcements', value: 'all' },
    ...announcements.value.map(a => ({
      label: a.title || `Announcement ${a.id}`,
      value: String(a.id),
    })),
  ];
});

// Methods
async function fetchActivities() {
  loading.value = true;
  try {
    const response = await $fetch<EmailActivity[]>('/api/directus/items', {
      method: 'POST',
      body: {
        collection: 'email_activity',
        operation: 'list',
        query: {
          fields: [
            '*',
            'person.first_name',
            'person.last_name',
            'person.email',
            'announcement.id',
            'announcement.title',
          ],
          sort: ['-date_created'],
          limit: 500,
        },
      },
    });
    activities.value = response || [];
  } catch (error: any) {
    console.error('Failed to fetch activities:', error);
    toast.add({ title: 'Error', description: 'Failed to load email activity', color: 'red' });
  } finally {
    loading.value = false;
  }
}

async function fetchAnnouncements() {
  try {
    const response = await $fetch<Announcement[]>('/api/directus/items', {
      method: 'POST',
      body: {
        collection: 'announcements',
        operation: 'list',
        query: {
          fields: ['id', 'title', 'status', 'date_sent'],
          filter: { status: { _eq: 'sent' } },
          sort: ['-date_sent'],
          limit: 50,
        },
      },
    });
    announcements.value = response || [];
  } catch (error: any) {
    console.error('Failed to fetch announcements:', error);
  }
}

function getEventColor(event?: string): string {
  const option = eventOptions.find(o => o.value === event);
  return (option as any)?.color || 'gray';
}

function getEventIcon(event?: string): string {
  const option = eventOptions.find(o => o.value === event);
  return (option as any)?.icon || 'i-heroicons-envelope';
}

function formatDate(date?: string | null): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getPersonName(activity: EmailActivity): string {
  if (typeof activity.person === 'object' && activity.person) {
    return `${activity.person.first_name || ''} ${activity.person.last_name || ''}`.trim();
  }
  return activity.email || 'Unknown';
}

function getAnnouncementTitle(activity: EmailActivity): string {
  if (typeof activity.announcement === 'object' && activity.announcement) {
    return activity.announcement.title || `#${activity.announcement.id}`;
  }
  return activity.announcement ? `#${activity.announcement}` : '-';
}

async function refreshData() {
  await Promise.all([fetchActivities(), fetchAnnouncements()]);
}

// Initialize
onMounted(() => {
  refreshData();
});
</script>

<template>
  <div class="admin-page bg-white dark:bg-gray-900 min-h-full">
    <div class="container mx-auto px-6 py-8">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 class="text-2xl font-bold">Email Activity</h1>
          <p class="text-gray-600 dark:text-gray-400 mt-1">
            Track email opens, clicks, bounces, and delivery status
          </p>
        </div>
        <div class="mt-4 md:mt-0 flex gap-3">
          <UButton
            variant="soft"
            color="gray"
            icon="i-heroicons-arrow-path"
            :loading="loading"
            @click="refreshData"
          >
            Refresh
          </UButton>
          <UButton
            variant="soft"
            color="gray"
            icon="i-heroicons-megaphone"
            to="/admin/announcements"
          >
            Announcements
          </UButton>
        </div>
      </div>

      <!-- Access Denied -->
      <div v-if="!hasAccess" class="text-center py-12">
        <UIcon name="i-heroicons-shield-exclamation" class="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 class="text-xl font-semibold mb-2">Access Denied</h2>
        <p class="text-gray-600 dark:text-gray-400">
          You don't have permission to view email activity.
        </p>
      </div>

      <template v-else>
        <!-- Stats Cards -->
        <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <UCard class="text-center">
            <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats.total }}</div>
            <div class="text-xs text-gray-500 uppercase tracking-wide">Total Events</div>
          </UCard>
          <UCard class="text-center">
            <div class="text-2xl font-bold text-green-600">{{ stats.delivered }}</div>
            <div class="text-xs text-gray-500 uppercase tracking-wide">Delivered</div>
          </UCard>
          <UCard class="text-center">
            <div class="text-2xl font-bold text-blue-600">{{ stats.opens }}</div>
            <div class="text-xs text-gray-500 uppercase tracking-wide">Opens</div>
          </UCard>
          <UCard class="text-center">
            <div class="text-2xl font-bold text-purple-600">{{ stats.clicks }}</div>
            <div class="text-xs text-gray-500 uppercase tracking-wide">Clicks</div>
          </UCard>
          <UCard class="text-center">
            <div class="text-2xl font-bold text-red-600">{{ stats.bounces }}</div>
            <div class="text-xs text-gray-500 uppercase tracking-wide">Bounces</div>
          </UCard>
        </div>

        <!-- Filters -->
        <div class="flex flex-col sm:flex-row gap-4 mb-6">
          <UInput
            v-model="searchQuery"
            icon="i-heroicons-magnifying-glass"
            placeholder="Search by email or name..."
            class="flex-1 max-w-md"
          />
          <USelectMenu
            v-model="eventFilter"
            :options="eventOptions"
            value-attribute="value"
            option-attribute="label"
            class="w-40"
          />
          <USelectMenu
            v-model="announcementFilter"
            :options="announcementOptions"
            value-attribute="value"
            option-attribute="label"
            class="w-60"
          />
        </div>

        <!-- Activity Table -->
        <UCard>
          <UTable
            :rows="filteredActivities"
            :columns="[
              { key: 'event', label: 'Event' },
              { key: 'recipient', label: 'Recipient' },
              { key: 'announcement', label: 'Announcement' },
              { key: 'clicked_url', label: 'Clicked URL' },
              { key: 'date_created', label: 'Time' },
            ]"
            :loading="loading"
            :empty-state="{ icon: 'i-heroicons-inbox', label: 'No activity found' }"
          >
            <template #event-data="{ row }">
              <div class="flex items-center gap-2">
                <UIcon :name="getEventIcon(row.event)" :class="`text-${getEventColor(row.event)}-500`" class="w-5 h-5" />
                <UBadge :color="getEventColor(row.event)" variant="soft" size="sm">
                  {{ row.event }}
                </UBadge>
              </div>
            </template>

            <template #recipient-data="{ row }">
              <div>
                <p class="font-medium text-sm">{{ getPersonName(row) }}</p>
                <p class="text-xs text-gray-500">{{ row.email }}</p>
              </div>
            </template>

            <template #announcement-data="{ row }">
              <span class="text-sm">{{ getAnnouncementTitle(row) }}</span>
            </template>

            <template #clicked_url-data="{ row }">
              <a
                v-if="row.clicked_url"
                :href="row.clicked_url"
                target="_blank"
                class="text-xs text-primary-500 hover:underline truncate block max-w-[200px]"
              >
                {{ row.clicked_url }}
              </a>
              <span v-else class="text-gray-400">-</span>
            </template>

            <template #date_created-data="{ row }">
              <span class="text-sm text-gray-500">{{ formatDate(row.date_created) }}</span>
            </template>
          </UTable>
        </UCard>

        <!-- Pagination Info -->
        <div class="mt-4 text-sm text-gray-500 text-center">
          Showing {{ filteredActivities.length }} of {{ activities.length }} events
        </div>
      </template>
    </div>
  </div>
</template>
