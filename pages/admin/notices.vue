<script setup lang="ts">
definePageMeta({
  layout: 'default',
  middleware: ['auth'],
});

interface Notice {
  id: number;
  status: 'draft' | 'published' | 'archived';
  title: string;
  content?: string;
  type: 'announcement' | 'update' | 'alert' | 'maintenance';
  visibility: string[];
  published_at?: string;
  expires_at?: string;
  pinned: boolean;
  date_created?: string;
  user_created?: any;
}

const toast = useToast();
const { isAdmin, isBoardMember } = useRoles();
const { canManage } = useUserPermissions();

// Check if user has access - uses notices_approved permission
const hasAccess = computed(() => {
  return canManage('notices');
});

const canCreate = computed(() => {
  return canManage('notices');
});

const canEdit = computed(() => {
  return canManage('notices');
});

const canDelete = computed(() => {
  return canManage('notices');
});

// State
const notices = ref<Notice[]>([]);
const loading = ref(true);
const showModal = ref(false);
const saving = ref(false);
const selectedNotice = ref<Notice | null>(null);
const searchQuery = ref('');
const statusFilter = ref<string>('all');

// Form state
const form = ref<Partial<Notice>>({
  status: 'draft',
  title: '',
  content: '',
  type: 'announcement',
  visibility: ['residents'],
  pinned: false,
});

// Visibility options (no public option - notifications require sign-in)
const visibilityOptions = [
  { label: 'Residents', value: 'residents' },
  { label: 'Board Members', value: 'board' },
  { label: 'Staff', value: 'staff' },
];

// Type options
const typeOptions = [
  { label: 'Announcement', value: 'announcement', color: 'blue' },
  { label: 'Update', value: 'update', color: 'purple' },
  { label: 'Alert', value: 'alert', color: 'orange' },
  { label: 'Maintenance', value: 'maintenance', color: 'gray' },
];

// Status options
const statusOptions = [
  { label: 'Draft', value: 'draft', color: 'gray' },
  { label: 'Published', value: 'published', color: 'green' },
  { label: 'Archived', value: 'archived', color: 'red' },
];

// Computed
const filteredNotices = computed(() => {
  let result = notices.value;

  if (statusFilter.value !== 'all') {
    result = result.filter(n => n.status === statusFilter.value);
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(n =>
      n.title?.toLowerCase().includes(query) ||
      n.content?.toLowerCase().includes(query)
    );
  }

  return result;
});

// Methods
async function fetchNotices() {
  loading.value = true;
  try {
    const response = await $fetch<Notice[]>('/api/directus/items', {
      method: 'POST',
      body: {
        collection: 'notices',
        operation: 'list',
        query: {
          fields: ['*', 'user_created.first_name', 'user_created.last_name'],
          sort: ['-pinned', '-date_created'],
          limit: -1,
        },
      },
    });
    notices.value = response || [];
  } catch (error: any) {
    console.error('Failed to fetch notices:', error);
    toast.add({
      title: 'Error',
      description: 'Failed to load notices',
      color: 'red',
    });
  } finally {
    loading.value = false;
  }
}

function openCreateModal() {
  selectedNotice.value = null;
  form.value = {
    status: 'draft',
    title: '',
    content: '',
    type: 'announcement',
    visibility: ['residents'],
    pinned: false,
  };
  showModal.value = true;
}

function openEditModal(notice: Notice) {
  selectedNotice.value = notice;
  form.value = { ...notice };
  showModal.value = true;
}

async function saveNotice() {
  if (!form.value.title) {
    toast.add({ title: 'Error', description: 'Title is required', color: 'red' });
    return;
  }

  saving.value = true;
  try {
    if (selectedNotice.value) {
      // Update
      await $fetch('/api/directus/items', {
        method: 'POST',
        body: {
          collection: 'notices',
          operation: 'update',
          id: selectedNotice.value.id,
          data: form.value,
        },
      });
      toast.add({ title: 'Success', description: 'Notice updated', color: 'green' });
    } else {
      // Create
      await $fetch('/api/directus/items', {
        method: 'POST',
        body: {
          collection: 'notices',
          operation: 'create',
          data: form.value,
        },
      });
      toast.add({ title: 'Success', description: 'Notice created', color: 'green' });
    }

    showModal.value = false;
    await fetchNotices();
  } catch (error: any) {
    console.error('Failed to save notice:', error);
    toast.add({
      title: 'Error',
      description: error?.data?.message || 'Failed to save notice',
      color: 'red',
    });
  } finally {
    saving.value = false;
  }
}

async function deleteNotice(notice: Notice) {
  if (!confirm(`Delete "${notice.title}"?`)) return;

  try {
    await $fetch('/api/directus/items', {
      method: 'POST',
      body: {
        collection: 'notices',
        operation: 'delete',
        id: notice.id,
      },
    });
    toast.add({ title: 'Success', description: 'Notice deleted', color: 'green' });
    await fetchNotices();
  } catch (error: any) {
    toast.add({
      title: 'Error',
      description: error?.data?.message || 'Failed to delete notice',
      color: 'red',
    });
  }
}

async function togglePin(notice: Notice) {
  try {
    await $fetch('/api/directus/items', {
      method: 'POST',
      body: {
        collection: 'notices',
        operation: 'update',
        id: notice.id,
        data: { pinned: !notice.pinned },
      },
    });
    await fetchNotices();
  } catch (error: any) {
    toast.add({ title: 'Error', description: 'Failed to update pin status', color: 'red' });
  }
}

async function updateStatus(notice: Notice, status: string) {
  try {
    await $fetch('/api/directus/items', {
      method: 'POST',
      body: {
        collection: 'notices',
        operation: 'update',
        id: notice.id,
        data: { status, published_at: status === 'published' ? new Date().toISOString() : notice.published_at },
      },
    });
    toast.add({ title: 'Success', description: `Notice ${status}`, color: 'green' });
    await fetchNotices();
  } catch (error: any) {
    toast.add({ title: 'Error', description: 'Failed to update status', color: 'red' });
  }
}

function getTypeColor(type: string): string {
  const option = typeOptions.find(o => o.value === type);
  return option?.color || 'gray';
}

function getStatusColor(status: string): string {
  const option = statusOptions.find(o => o.value === status);
  return option?.color || 'gray';
}

function formatDate(date?: string): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// Initialize
onMounted(() => {
  fetchNotices();
});
</script>

<template>
  <div class="admin-page bg-white dark:bg-gray-900 min-h-full">
    <div class="container mx-auto px-6 py-8">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 class="text-2xl font-bold">Notices Management</h1>
          <p class="text-gray-600 dark:text-gray-400 mt-1">
            Create and manage in-app notices for residents and visitors
          </p>
        </div>
        <div class="mt-4 md:mt-0 flex gap-3">
          <UButton
            v-if="canCreate"
            icon="i-heroicons-plus"
            color="primary"
            @click="openCreateModal">
            New Notice
          </UButton>
        </div>
      </div>

      <!-- Access Denied -->
      <div v-if="!hasAccess" class="text-center py-12">
        <UIcon name="i-heroicons-shield-exclamation" class="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 class="text-xl font-semibold mb-2">Access Denied</h2>
        <p class="text-gray-600 dark:text-gray-400">
          You don't have permission to manage notices.
        </p>
      </div>

      <template v-else>
        <!-- Filters -->
        <div class="flex flex-col sm:flex-row gap-4 mb-6">
          <UInput
            v-model="searchQuery"
            icon="i-heroicons-magnifying-glass"
            placeholder="Search notices..."
            class="flex-1 max-w-md"
          />
          <USelectMenu
            v-model="statusFilter"
            :options="[{ label: 'All Status', value: 'all' }, ...statusOptions]"
            value-attribute="value"
            option-attribute="label"
            class="w-40"
          />
        </div>

        <!-- Notices Table -->
        <UCard>
          <UTable
            :rows="filteredNotices"
            :columns="[
              { key: 'pinned', label: '' },
              { key: 'title', label: 'Title' },
              { key: 'type', label: 'Type' },
              { key: 'visibility', label: 'Visibility' },
              { key: 'status', label: 'Status' },
              { key: 'date_created', label: 'Created' },
              { key: 'actions', label: 'Actions' },
            ]"
            :loading="loading"
            :empty-state="{ icon: 'i-heroicons-bell-slash', label: 'No notices found' }"
          >
            <template #pinned-data="{ row }">
              <button @click="togglePin(row)" class="p-1" :title="row.pinned ? 'Unpin' : 'Pin'">
                <UIcon
                  :name="row.pinned ? 'i-heroicons-bookmark-solid' : 'i-heroicons-bookmark'"
                  :class="row.pinned ? 'text-yellow-500' : 'text-gray-400'"
                  class="w-5 h-5"
                />
              </button>
            </template>

            <template #title-data="{ row }">
              <div class="max-w-xs">
                <p class="font-medium truncate">{{ row.title }}</p>
              </div>
            </template>

            <template #type-data="{ row }">
              <UBadge :color="getTypeColor(row.type)" variant="soft" size="sm">
                {{ row.type }}
              </UBadge>
            </template>

            <template #visibility-data="{ row }">
              <div class="flex flex-wrap gap-1">
                <UBadge
                  v-for="v in (row.visibility || [])"
                  :key="v"
                  color="gray"
                  variant="soft"
                  size="xs"
                >
                  {{ v }}
                </UBadge>
              </div>
            </template>

            <template #status-data="{ row }">
              <UBadge :color="getStatusColor(row.status)" variant="soft" size="sm">
                {{ row.status }}
              </UBadge>
            </template>

            <template #date_created-data="{ row }">
              <span class="text-sm text-gray-500">{{ formatDate(row.date_created) }}</span>
            </template>

            <template #actions-data="{ row }">
              <div class="flex gap-2">
                <UButton
                  v-if="row.status === 'draft' && canEdit"
                  size="xs"
                  color="green"
                  variant="ghost"
                  icon="i-heroicons-check"
                  @click="updateStatus(row, 'published')"
                  title="Publish"
                />
                <UButton
                  v-if="row.status === 'published' && canEdit"
                  size="xs"
                  color="gray"
                  variant="ghost"
                  icon="i-heroicons-archive-box"
                  @click="updateStatus(row, 'archived')"
                  title="Archive"
                />
                <UButton
                  v-if="canEdit"
                  size="xs"
                  color="primary"
                  variant="ghost"
                  icon="i-heroicons-pencil"
                  @click="openEditModal(row)"
                />
                <UButton
                  v-if="canDelete"
                  size="xs"
                  color="red"
                  variant="ghost"
                  icon="i-heroicons-trash"
                  @click="deleteNotice(row)"
                />
              </div>
            </template>
          </UTable>
        </UCard>
      </template>

      <!-- Create/Edit Modal -->
      <UModal v-model="showModal" :ui="{ width: 'sm:max-w-2xl' }">
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold">
                {{ selectedNotice ? 'Edit Notice' : 'Create Notice' }}
              </h3>
              <UButton
                color="gray"
                variant="ghost"
                icon="i-heroicons-x-mark"
                @click="showModal = false"
              />
            </div>
          </template>

          <div class="space-y-4">
            <UFormGroup label="Title" required>
              <UInput v-model="form.title" placeholder="Notice title" />
            </UFormGroup>

            <div class="grid grid-cols-2 gap-4">
              <UFormGroup label="Type">
                <USelectMenu
                  v-model="form.type"
                  :options="typeOptions"
                  value-attribute="value"
                  option-attribute="label"
                />
              </UFormGroup>

              <UFormGroup label="Status">
                <USelectMenu
                  v-model="form.status"
                  :options="statusOptions"
                  value-attribute="value"
                  option-attribute="label"
                />
              </UFormGroup>
            </div>

            <UFormGroup label="Visibility" hint="Who can see this notice">
              <div class="flex flex-wrap gap-3 mt-2">
                <UCheckbox
                  v-for="option in visibilityOptions"
                  :key="option.value"
                  v-model="form.visibility"
                  :value="option.value"
                  :label="option.label"
                />
              </div>
            </UFormGroup>

            <UFormGroup label="Content">
              <TiptapEditor
                v-model="form.content"
                placeholder="Write your notice content..."
                mode="simple"
                height="min-h-[150px] max-h-[300px]"
                :allow-uploads="false"
              />
            </UFormGroup>

            <div class="grid grid-cols-2 gap-4">
              <UFormGroup label="Publish At">
                <UInput v-model="form.published_at" type="datetime-local" />
              </UFormGroup>

              <UFormGroup label="Expires At">
                <UInput v-model="form.expires_at" type="datetime-local" />
              </UFormGroup>
            </div>

            <UCheckbox v-model="form.pinned" label="Pin to top" />
          </div>

          <template #footer>
            <div class="flex justify-end gap-3">
              <UButton color="gray" variant="ghost" @click="showModal = false">
                Cancel
              </UButton>
              <UButton color="primary" :loading="saving" @click="saveNotice">
                {{ selectedNotice ? 'Update' : 'Create' }}
              </UButton>
            </div>
          </template>
        </UCard>
      </UModal>
    </div>
  </div>
</template>
