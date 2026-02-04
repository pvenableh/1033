<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'

definePageMeta({
  layout: 'default',
  middleware: ['auth', 'role'],
})

useSeoMeta({
  title: 'Manage Requests - Admin',
})

const { user } = useDirectusAuth()
const { isAdmin, isBoardMember } = useRoles()
const { getCommentCount } = useComments()

const requestsCollection = useDirectusItems('requests')
const requests = ref<any[]>([])
const loading = ref(true)
const commentCounts = ref<Record<string, number>>({})

// Filters
const filterStatus = ref<string>('')
const filterPriority = ref<string>('')
const searchQuery = ref('')

// Status counts
const statusCounts = ref<Record<string, number>>({})

const statusOptions = [
  { value: '', label: 'All Requests' },
  { value: 'new', label: 'New' },
  { value: 'in progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
]

const statusBadge: Record<string, string> = {
  'new': 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  'in progress': 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300',
  'resolved': 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300',
  'closed': 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

const priorityBadge: Record<string, string> = {
  'low': 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300',
  'medium': 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300',
  'high': 'bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
  'urgent': 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300',
}

async function loadRequests() {
  loading.value = true
  try {
    const filter: Record<string, any> = {}
    if (filterStatus.value) {
      filter.status = { _eq: filterStatus.value }
    }
    if (filterPriority.value) {
      filter.priority = { _eq: filterPriority.value }
    }

    const query: Record<string, any> = {
      fields: ['id', 'status', 'category', 'priority', 'subject', 'name', 'email', 'unit', 'description', 'date_created', 'date_updated'],
      sort: ['-date_created'],
      limit: -1,
    }
    if (Object.keys(filter).length > 0) {
      query.filter = filter
    }
    if (searchQuery.value) {
      query.search = searchQuery.value
    }

    requests.value = await requestsCollection.list(query)

    // Fetch comment counts for all requests
    if (requests.value.length > 0) {
      const counts: Record<string, number> = {}
      await Promise.all(
        requests.value.map(async (request: any) => {
          const countInfo = await getCommentCount('requests', request.id)
          counts[request.id] = countInfo.total_count
        })
      )
      commentCounts.value = counts
    }

    // Compute status counts from all requests
    const allRequests = await requestsCollection.list({
      fields: ['status'],
      limit: -1,
    })
    statusCounts.value = {}
    for (const r of allRequests) {
      const s = (r as any).status || 'new'
      statusCounts.value[s] = (statusCounts.value[s] || 0) + 1
    }
  } catch (e) {
    console.error('Failed to load requests:', e)
  } finally {
    loading.value = false
  }
}

const filteredRequests = computed(() => {
  if (!searchQuery.value) return requests.value
  const q = searchQuery.value.toLowerCase()
  return requests.value.filter(
    (r: any) =>
      r.subject?.toLowerCase().includes(q) ||
      r.name?.toLowerCase().includes(q) ||
      r.description?.toLowerCase().includes(q) ||
      r.category?.toLowerCase().includes(q)
  )
})

function formatDate(date: string | null | undefined): string {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

onMounted(loadRequests)
watch([filterStatus, filterPriority], loadRequests)
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold">Requests</h1>
        <p class="text-sm text-muted-foreground mt-1">
          Community requests, issues, and inquiries
        </p>
      </div>
      <NuxtLink
        to="/requests/inquiry"
        class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
      >
        <Icon name="heroicons:plus" class="h-4 w-4" />
        Submit Request
      </NuxtLink>
    </div>

    <!-- Status Summary Cards (Admin/Board view) -->
    <div v-if="isBoardMember || isAdmin" class="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Card
        class="cursor-pointer hover:shadow-md transition-shadow"
        :class="{ 'ring-2 ring-primary': filterStatus === 'new' }"
        @click="filterStatus = filterStatus === 'new' ? '' : 'new'"
      >
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-muted-foreground uppercase tracking-wider">New</p>
              <p class="text-2xl font-bold mt-1">{{ statusCounts['new'] || 0 }}</p>
            </div>
            <div class="p-2 rounded-lg bg-blue-50 dark:bg-blue-950">
              <Icon name="heroicons:inbox" class="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card
        class="cursor-pointer hover:shadow-md transition-shadow"
        :class="{ 'ring-2 ring-primary': filterStatus === 'in progress' }"
        @click="filterStatus = filterStatus === 'in progress' ? '' : 'in progress'"
      >
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-muted-foreground uppercase tracking-wider">In Progress</p>
              <p class="text-2xl font-bold mt-1">{{ statusCounts['in progress'] || 0 }}</p>
            </div>
            <div class="p-2 rounded-lg bg-yellow-50 dark:bg-yellow-950">
              <Icon name="heroicons:clock" class="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card
        class="cursor-pointer hover:shadow-md transition-shadow"
        :class="{ 'ring-2 ring-primary': filterStatus === 'resolved' }"
        @click="filterStatus = filterStatus === 'resolved' ? '' : 'resolved'"
      >
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-muted-foreground uppercase tracking-wider">Resolved</p>
              <p class="text-2xl font-bold mt-1">{{ statusCounts['resolved'] || 0 }}</p>
            </div>
            <div class="p-2 rounded-lg bg-green-50 dark:bg-green-950">
              <Icon name="heroicons:check-circle" class="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card
        class="cursor-pointer hover:shadow-md transition-shadow"
        :class="{ 'ring-2 ring-primary': filterStatus === 'closed' }"
        @click="filterStatus = filterStatus === 'closed' ? '' : 'closed'"
      >
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-muted-foreground uppercase tracking-wider">Closed</p>
              <p class="text-2xl font-bold mt-1">{{ statusCounts['closed'] || 0 }}</p>
            </div>
            <div class="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
              <Icon name="heroicons:archive-box" class="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Filters -->
    <Card>
      <CardContent class="p-4">
        <div class="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
          <select v-model="filterStatus" class="text-sm border rounded-lg px-3 py-1.5 bg-background">
            <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>

          <select v-model="filterPriority" class="text-sm border rounded-lg px-3 py-1.5 bg-background">
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>

          <div class="relative flex-1 min-w-48">
            <Icon name="heroicons:magnifying-glass" class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search requests..."
              class="w-full pl-9 pr-3 py-1.5 text-sm border rounded-lg bg-background"
            />
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-16">
      <Icon name="heroicons:arrow-path" class="h-6 w-6 animate-spin text-muted-foreground" />
    </div>

    <!-- Empty -->
    <div v-else-if="filteredRequests.length === 0" class="text-center py-16">
      <Icon name="heroicons:inbox" class="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <p class="text-muted-foreground">No requests found</p>
    </div>

    <!-- Request List -->
    <div v-else class="space-y-2">
      <NuxtLink
        v-for="request in filteredRequests"
        :key="request.id"
        :to="`/admin/requests/${request.id}`"
        class="block"
      >
        <Card class="hover:shadow-md transition-shadow">
          <CardContent class="p-4">
            <div class="flex items-start gap-3">
              <!-- Status indicator -->
              <div class="mt-1 shrink-0">
                <div
                  class="w-2.5 h-2.5 rounded-full"
                  :class="{
                    'bg-blue-500': request.status === 'new',
                    'bg-yellow-500': request.status === 'in progress',
                    'bg-green-500': request.status === 'resolved',
                    'bg-gray-400': request.status === 'closed',
                  }"
                />
              </div>

              <!-- Content -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <h3 class="font-medium text-sm">{{ request.subject || 'No subject' }}</h3>
                  <span
                    v-if="request.status"
                    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize"
                    :class="statusBadge[request.status] || 'bg-gray-100'"
                  >
                    {{ request.status }}
                  </span>
                  <span
                    v-if="request.priority"
                    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize"
                    :class="priorityBadge[request.priority] || 'bg-gray-100'"
                  >
                    {{ request.priority }}
                  </span>
                </div>

                <div class="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
                  <span v-if="request.name" class="flex items-center gap-1">
                    <Icon name="heroicons:user" class="h-3 w-3" />
                    {{ request.name }}
                  </span>
                  <span v-if="request.category" class="flex items-center gap-1">
                    <Icon name="heroicons:tag" class="h-3 w-3" />
                    {{ request.category }}
                  </span>
                  <span v-if="request.unit" class="flex items-center gap-1">
                    <Icon name="heroicons:building-office" class="h-3 w-3" />
                    Unit {{ request.unit }}
                  </span>
                  <span class="flex items-center gap-1">
                    <Icon name="heroicons:calendar" class="h-3 w-3" />
                    {{ formatDate(request.date_created) }}
                  </span>
                  <span v-if="commentCounts[request.id]" class="flex items-center gap-1">
                    <Icon name="heroicons:chat-bubble-left" class="h-3 w-3" />
                    {{ commentCounts[request.id] }}
                  </span>
                </div>
              </div>

              <!-- Arrow -->
              <Icon name="heroicons:chevron-right" class="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
            </div>
          </CardContent>
        </Card>
      </NuxtLink>
    </div>
  </div>
</template>
