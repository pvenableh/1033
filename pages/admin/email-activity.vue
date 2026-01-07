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
const loadingMore = ref(false);
const searchQuery = ref('');
const eventFilter = ref<string>('all');
const announcementFilter = ref<string>('all');

// Pagination state for infinite scroll
const pageSize = 100;
const currentPage = ref(0);
const hasMore = ref(true);

// Total counts from database (for accurate stats)
const totalCounts = ref({
  total: 0,
  delivered: 0,
  open: 0,
  click: 0,
  bounce: 0,
});

// Computed stats from loaded data (proportional display)
const loadedStats = computed(() => {
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

// Calculate percentage for visual indicator
const getPercentage = (loaded: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((loaded / total) * 100);
};

// Methods
async function fetchTotalCounts() {
  try {
    // Fetch aggregate counts for each event type
    const [totalResult, deliveredResult, openResult, clickResult, bounceResult] = await Promise.all([
      $fetch<{ count: number }[]>('/api/directus/items', {
        method: 'POST',
        body: {
          collection: 'email_activity',
          operation: 'aggregate',
          query: {
            aggregate: { count: '*' },
          },
        },
      }),
      $fetch<{ count: number }[]>('/api/directus/items', {
        method: 'POST',
        body: {
          collection: 'email_activity',
          operation: 'aggregate',
          query: {
            aggregate: { count: '*' },
            filter: { event: { _eq: 'delivered' } },
          },
        },
      }),
      $fetch<{ count: number }[]>('/api/directus/items', {
        method: 'POST',
        body: {
          collection: 'email_activity',
          operation: 'aggregate',
          query: {
            aggregate: { count: '*' },
            filter: { event: { _eq: 'open' } },
          },
        },
      }),
      $fetch<{ count: number }[]>('/api/directus/items', {
        method: 'POST',
        body: {
          collection: 'email_activity',
          operation: 'aggregate',
          query: {
            aggregate: { count: '*' },
            filter: { event: { _eq: 'click' } },
          },
        },
      }),
      $fetch<{ count: number }[]>('/api/directus/items', {
        method: 'POST',
        body: {
          collection: 'email_activity',
          operation: 'aggregate',
          query: {
            aggregate: { count: '*' },
            filter: { event: { _eq: 'bounce' } },
          },
        },
      }),
    ]);

    totalCounts.value = {
      total: totalResult?.[0]?.count || 0,
      delivered: deliveredResult?.[0]?.count || 0,
      open: openResult?.[0]?.count || 0,
      click: clickResult?.[0]?.count || 0,
      bounce: bounceResult?.[0]?.count || 0,
    };
  } catch (error: any) {
    console.error('Failed to fetch counts:', error);
    // Fallback to showing loaded data counts
  }
}

async function fetchActivities(reset = false) {
  if (reset) {
    currentPage.value = 0;
    activities.value = [];
    hasMore.value = true;
  }

  if (!hasMore.value && !reset) return;

  loading.value = reset || activities.value.length === 0;
  loadingMore.value = !reset && activities.value.length > 0;

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
          limit: pageSize,
          offset: currentPage.value * pageSize,
        },
      },
    });

    const newActivities = response || [];

    if (reset) {
      activities.value = newActivities;
    } else {
      activities.value = [...activities.value, ...newActivities];
    }

    hasMore.value = newActivities.length === pageSize;
    currentPage.value++;
  } catch (error: any) {
    console.error('Failed to fetch activities:', error);
    toast.add({ title: 'Error', description: 'Failed to load email activity', color: 'red' });
  } finally {
    loading.value = false;
    loadingMore.value = false;
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
  await Promise.all([
    fetchActivities(true),
    fetchAnnouncements(),
    fetchTotalCounts(),
  ]);
}

// Infinite scroll handler
const scrollContainer = ref<HTMLElement | null>(null);

function handleScroll() {
  if (!scrollContainer.value || loadingMore.value || !hasMore.value) return;

  const { scrollTop, scrollHeight, clientHeight } = scrollContainer.value;
  const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;

  // Load more when scrolled 80% down
  if (scrollPercentage > 0.8) {
    fetchActivities(false);
  }
}

// Watch for filter changes to reset
watch([eventFilter, announcementFilter, searchQuery], () => {
  // Filters are applied client-side, no need to refetch
  // But we could implement server-side filtering if needed
});

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
        <!-- Stats Cards with Total Counts -->
        <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <UCard class="text-center relative overflow-hidden">
            <div class="relative z-10">
              <div class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ totalCounts.total.toLocaleString() }}
              </div>
              <div class="text-xs text-gray-500 uppercase tracking-wide">Total Events</div>
              <div v-if="activities.length < totalCounts.total" class="text-[10px] text-gray-400 mt-1">
                {{ activities.length.toLocaleString() }} loaded
              </div>
            </div>
            <!-- Progress indicator -->
            <div
              v-if="totalCounts.total > 0"
              class="absolute bottom-0 left-0 h-1 bg-gray-200 dark:bg-gray-700 transition-all duration-500"
              :style="{ width: `${getPercentage(activities.length, totalCounts.total)}%` }"
            ></div>
          </UCard>

          <UCard class="text-center relative overflow-hidden">
            <div class="relative z-10">
              <div class="text-2xl font-bold text-green-600">
                {{ totalCounts.delivered.toLocaleString() }}
              </div>
              <div class="text-xs text-gray-500 uppercase tracking-wide">Delivered</div>
              <div v-if="loadedStats.delivered < totalCounts.delivered && totalCounts.delivered > 0" class="text-[10px] text-gray-400 mt-1">
                {{ loadedStats.delivered.toLocaleString() }} in view
              </div>
            </div>
            <div
              v-if="totalCounts.total > 0"
              class="absolute bottom-0 left-0 h-1 bg-green-500 transition-all duration-500"
              :style="{ width: `${getPercentage(totalCounts.delivered, totalCounts.total)}%` }"
            ></div>
          </UCard>

          <UCard class="text-center relative overflow-hidden">
            <div class="relative z-10">
              <div class="text-2xl font-bold text-blue-600">
                {{ totalCounts.open.toLocaleString() }}
              </div>
              <div class="text-xs text-gray-500 uppercase tracking-wide">Opens</div>
              <div v-if="totalCounts.delivered > 0" class="text-[10px] text-gray-400 mt-1">
                {{ Math.round((totalCounts.open / totalCounts.delivered) * 100) }}% open rate
              </div>
            </div>
            <div
              v-if="totalCounts.total > 0"
              class="absolute bottom-0 left-0 h-1 bg-blue-500 transition-all duration-500"
              :style="{ width: `${getPercentage(totalCounts.open, totalCounts.total)}%` }"
            ></div>
          </UCard>

          <UCard class="text-center relative overflow-hidden">
            <div class="relative z-10">
              <div class="text-2xl font-bold text-purple-600">
                {{ totalCounts.click.toLocaleString() }}
              </div>
              <div class="text-xs text-gray-500 uppercase tracking-wide">Clicks</div>
              <div v-if="totalCounts.open > 0" class="text-[10px] text-gray-400 mt-1">
                {{ Math.round((totalCounts.click / totalCounts.open) * 100) }}% click rate
              </div>
            </div>
            <div
              v-if="totalCounts.total > 0"
              class="absolute bottom-0 left-0 h-1 bg-purple-500 transition-all duration-500"
              :style="{ width: `${getPercentage(totalCounts.click, totalCounts.total)}%` }"
            ></div>
          </UCard>

          <UCard class="text-center relative overflow-hidden">
            <div class="relative z-10">
              <div class="text-2xl font-bold text-red-600">
                {{ totalCounts.bounce.toLocaleString() }}
              </div>
              <div class="text-xs text-gray-500 uppercase tracking-wide">Bounces</div>
              <div v-if="totalCounts.delivered > 0" class="text-[10px] text-gray-400 mt-1">
                {{ Math.round((totalCounts.bounce / (totalCounts.delivered + totalCounts.bounce)) * 100) }}% bounce rate
              </div>
            </div>
            <div
              v-if="totalCounts.total > 0"
              class="absolute bottom-0 left-0 h-1 bg-red-500 transition-all duration-500"
              :style="{ width: `${getPercentage(totalCounts.bounce, totalCounts.total)}%` }"
            ></div>
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

        <!-- Activity Table with Infinite Scroll -->
        <UCard>
          <div
            ref="scrollContainer"
            class="max-h-[60vh] overflow-y-auto"
            @scroll="handleScroll"
          >
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

            <!-- Load More Indicator -->
            <div v-if="loadingMore" class="flex items-center justify-center py-4">
              <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 animate-spin text-gray-400 mr-2" />
              <span class="text-sm text-gray-500">Loading more...</span>
            </div>

            <!-- End of Data -->
            <div v-else-if="!hasMore && activities.length > 0" class="text-center py-4 text-sm text-gray-500">
              All {{ activities.length.toLocaleString() }} events loaded
            </div>
          </div>
        </UCard>

        <!-- Pagination Info -->
        <div class="mt-4 flex items-center justify-between text-sm text-gray-500">
          <div>
            Showing {{ filteredActivities.length.toLocaleString() }} of {{ activities.length.toLocaleString() }} loaded events
          </div>
          <div v-if="hasMore" class="flex items-center gap-2">
            <UButton
              size="xs"
              variant="ghost"
              icon="i-heroicons-arrow-down"
              :loading="loadingMore"
              @click="fetchActivities(false)"
            >
              Load More
            </UButton>
          </div>
        </div>

        <!-- Data freshness note -->
        <p v-if="totalCounts.total > activities.length" class="mt-2 text-xs text-gray-400 text-center">
          Showing the most recent {{ activities.length.toLocaleString() }} of {{ totalCounts.total.toLocaleString() }} total events.
          Scroll down or click "Load More" to see older events.
        </p>
      </template>
    </div>
  </div>
</template>
