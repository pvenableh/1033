<script setup lang="ts">
import type { Request } from '~/types/directus';

definePageMeta({
  layout: 'default',
  middleware: ['auth'],
});

useSeoMeta({
  title: 'My Requests - 1033 Lenox',
  description: 'View and track your submitted requests',
});

const { user } = useDirectusAuth();
const requestsItems = useDirectusItems<Request>('requests');
const router = useRouter();

// Fetch user's requests
const { data: requests, pending, error, refresh } = await useAsyncData(
  'my-requests',
  async () => {
    if (!user.value?.id) return [];

    // Get requests created by this user OR matching their email
    const userEmail = user.value.email;
    const userId = user.value.id;

    const result = await requestsItems.list({
      filter: {
        _or: [
          { user_created: { _eq: userId } },
          { email: { _eq: userEmail } },
        ],
      },
      fields: ['id', 'subject', 'description', 'status', 'category', 'priority', 'date_created', 'date_updated'],
      sort: ['-date_created'],
    });

    return result || [];
  },
  {
    watch: [() => user.value?.id],
  }
);

// Status badge colors
const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  'in progress': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

// Priority badge colors
const priorityColors: Record<string, string> = {
  emergency: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  low: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

// Format date
const formatDate = (dateStr: string | undefined) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

// Navigate to request detail
const viewRequest = (id: string) => {
  router.push(`/my-requests/${id}`);
};
</script>

<template>
  <div class="container mx-auto px-4 py-8 max-w-4xl">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold t-text">My Requests</h1>
        <p class="text-sm t-text-secondary mt-1">
          Track your submitted requests and communicate with the board
        </p>
      </div>
      <NuxtLink
        to="/my-requests/new"
        class="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
      >
        <UIcon name="i-heroicons-plus" class="w-5 h-5" />
        New Request
      </NuxtLink>
    </div>

    <!-- Loading State -->
    <div v-if="pending" class="space-y-4">
      <div v-for="i in 3" :key="i" class="bg-card rounded-lg p-6 animate-pulse">
        <div class="h-5 bg-muted rounded w-1/3 mb-3"></div>
        <div class="h-4 bg-muted rounded w-2/3 mb-2"></div>
        <div class="h-4 bg-muted rounded w-1/4"></div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-destructive/10 text-destructive rounded-lg p-6 text-center">
      <UIcon name="i-heroicons-exclamation-triangle" class="w-12 h-12 mx-auto mb-3" />
      <p class="font-medium">Failed to load requests</p>
      <p class="text-sm mt-1">{{ error.message }}</p>
      <button
        @click="refresh()"
        class="mt-4 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90"
      >
        Try Again
      </button>
    </div>

    <!-- Empty State -->
    <div v-else-if="!requests?.length" class="bg-card rounded-lg p-12 text-center">
      <UIcon name="i-heroicons-inbox" class="w-16 h-16 mx-auto mb-4 t-text-muted" />
      <h2 class="text-xl font-semibold t-text mb-2">No requests yet</h2>
      <p class="t-text-secondary mb-6">
        Submit a request to communicate with the board about maintenance, suggestions, or questions.
      </p>
      <NuxtLink
        to="/my-requests/new"
        class="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
      >
        <UIcon name="i-heroicons-plus" class="w-5 h-5" />
        Submit Your First Request
      </NuxtLink>
    </div>

    <!-- Requests List -->
    <div v-else class="space-y-4">
      <div
        v-for="request in requests"
        :key="request.id"
        @click="viewRequest(request.id)"
        class="bg-card rounded-lg p-6 cursor-pointer hover:shadow-md transition-shadow border border-border"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1 min-w-0">
            <!-- Subject -->
            <h3 class="font-semibold t-text truncate">{{ request.subject || 'Untitled Request' }}</h3>

            <!-- Description preview -->
            <p class="text-sm t-text-secondary mt-1 line-clamp-2">
              {{ request.description }}
            </p>

            <!-- Meta info -->
            <div class="flex items-center gap-4 mt-3 text-xs t-text-muted">
              <span class="flex items-center gap-1">
                <UIcon name="i-heroicons-calendar" class="w-4 h-4" />
                {{ formatDate(request.date_created) }}
              </span>
              <span v-if="request.category" class="capitalize">
                {{ request.category }}
              </span>
            </div>
          </div>

          <!-- Status & Priority Badges -->
          <div class="flex flex-col items-end gap-2">
            <span
              v-if="request.status"
              :class="statusColors[request.status] || statusColors.new"
              class="px-2 py-1 rounded-full text-xs font-medium capitalize"
            >
              {{ request.status }}
            </span>
            <span
              v-if="request.priority"
              :class="priorityColors[request.priority] || priorityColors.medium"
              class="px-2 py-1 rounded-full text-xs font-medium capitalize"
            >
              {{ request.priority }}
            </span>
          </div>
        </div>

        <!-- Arrow indicator -->
        <div class="flex justify-end mt-2">
          <UIcon name="i-heroicons-chevron-right" class="w-5 h-5 t-text-muted" />
        </div>
      </div>
    </div>
  </div>
</template>
