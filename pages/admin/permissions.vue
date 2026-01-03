<script setup lang="ts">
import type { People, UserPermission } from '~/types/directus';
import { PERMISSION_CATEGORIES, PERMISSION_CATEGORY_META, CRUD_ACTIONS, APPROVAL_CATEGORIES, APPROVAL_CATEGORY_META } from '~/composables/useUserPermissions';

definePageMeta({
  layout: 'default',
  middleware: ['auth', 'role'],
});

const toast = useToast();
const { isAdmin } = useRoles();

// State
const people = ref<People[]>([]);
const loading = ref(true);
const selectedPerson = ref<People | null>(null);
const showPermissionModal = ref(false);
const saving = ref(false);
const searchQuery = ref('');

// Permission form state
const permissionForm = ref<Partial<UserPermission>>({});
const existingPermissionId = ref<number | null>(null);

// Computed
const filteredPeople = computed(() => {
  if (!searchQuery.value) return people.value;

  const query = searchQuery.value.toLowerCase();
  return people.value.filter(
    (p) =>
      p.first_name?.toLowerCase().includes(query) ||
      p.last_name?.toLowerCase().includes(query) ||
      p.email?.toLowerCase().includes(query)
  );
});

// Methods
async function fetchPeople() {
  loading.value = true;
  try {
    const response = await $fetch<People[]>('/api/directus/items', {
      method: 'POST',
      body: {
        collection: 'people',
        operation: 'list',
        query: {
          fields: ['id', 'first_name', 'last_name', 'email', 'category', 'is_owner', 'is_resident', 'permissions.*'],
          filter: {
            status: { _eq: 'published' },
          },
          sort: ['last_name', 'first_name'],
          limit: -1,
        },
      },
    });
    people.value = response || [];
  } catch (error) {
    console.error('Failed to fetch people:', error);
    toast.add({
      title: 'Error',
      description: 'Failed to load people',
      color: 'red',
    });
  } finally {
    loading.value = false;
  }
}

function openPermissionModal(person: People) {
  selectedPerson.value = person;

  // Load existing permissions if available
  const existingPermission = person.permissions?.[0] as UserPermission | undefined;
  if (existingPermission && typeof existingPermission === 'object') {
    existingPermissionId.value = existingPermission.id;
    permissionForm.value = { ...existingPermission };
  } else {
    existingPermissionId.value = null;
    // Initialize with all false
    permissionForm.value = {
      person_id: person.id,
      status: 'published',
    };
    // Initialize CRUD permissions
    for (const category of Object.values(PERMISSION_CATEGORIES)) {
      for (const action of Object.values(CRUD_ACTIONS)) {
        (permissionForm.value as any)[`${category}_${action}`] = false;
      }
    }
    // Initialize approval permissions
    for (const category of Object.values(APPROVAL_CATEGORIES)) {
      (permissionForm.value as any)[`${category}_approve`] = false;
    }
  }

  showPermissionModal.value = true;
}

async function savePermissions() {
  if (!selectedPerson.value) return;

  saving.value = true;
  try {
    if (existingPermissionId.value) {
      // Update existing permission
      await $fetch('/api/directus/items', {
        method: 'POST',
        body: {
          collection: 'user_permissions',
          operation: 'update',
          id: existingPermissionId.value,
          data: permissionForm.value,
        },
      });
    } else {
      // Create new permission
      await $fetch('/api/directus/items', {
        method: 'POST',
        body: {
          collection: 'user_permissions',
          operation: 'create',
          data: {
            ...permissionForm.value,
            person_id: selectedPerson.value.id,
            status: 'published',
          },
        },
      });
    }

    toast.add({
      title: 'Permissions Saved',
      description: `Permissions updated for ${selectedPerson.value.first_name} ${selectedPerson.value.last_name}`,
      color: 'green',
    });

    showPermissionModal.value = false;
    await fetchPeople();
  } catch (error: any) {
    console.error('Failed to save permissions:', error);
    toast.add({
      title: 'Error',
      description: error?.data?.message || 'Failed to save permissions',
      color: 'red',
    });
  } finally {
    saving.value = false;
  }
}

async function deletePermissions() {
  if (!existingPermissionId.value) return;

  saving.value = true;
  try {
    await $fetch('/api/directus/items', {
      method: 'POST',
      body: {
        collection: 'user_permissions',
        operation: 'delete',
        id: existingPermissionId.value,
      },
    });

    toast.add({
      title: 'Permissions Deleted',
      description: `Permissions removed for ${selectedPerson.value?.first_name} ${selectedPerson.value?.last_name}`,
      color: 'green',
    });

    showPermissionModal.value = false;
    await fetchPeople();
  } catch (error: any) {
    console.error('Failed to delete permissions:', error);
    toast.add({
      title: 'Error',
      description: error?.data?.message || 'Failed to delete permissions',
      color: 'red',
    });
  } finally {
    saving.value = false;
  }
}

function toggleAllCategory(category: string, value: boolean) {
  for (const action of Object.values(CRUD_ACTIONS)) {
    (permissionForm.value as any)[`${category}_${action}`] = value;
  }
}

function hasAnyPermission(person: People): boolean {
  const perm = person.permissions?.[0] as UserPermission | undefined;
  if (!perm || typeof perm !== 'object') return false;

  // Check CRUD permissions
  for (const category of Object.values(PERMISSION_CATEGORIES)) {
    for (const action of Object.values(CRUD_ACTIONS)) {
      if ((perm as any)[`${category}_${action}`] === true) {
        return true;
      }
    }
  }
  // Check approval permissions
  for (const category of Object.values(APPROVAL_CATEGORIES)) {
    if ((perm as any)[`${category}_approve`] === true) {
      return true;
    }
  }
  return false;
}

function getPermissionCount(person: People): number {
  const perm = person.permissions?.[0] as UserPermission | undefined;
  if (!perm || typeof perm !== 'object') return 0;

  let count = 0;
  // Count CRUD permissions
  for (const category of Object.values(PERMISSION_CATEGORIES)) {
    for (const action of Object.values(CRUD_ACTIONS)) {
      if ((perm as any)[`${category}_${action}`] === true) {
        count++;
      }
    }
  }
  // Count approval permissions
  for (const category of Object.values(APPROVAL_CATEGORIES)) {
    if ((perm as any)[`${category}_approve`] === true) {
      count++;
    }
  }
  return count;
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    projects: 'blue',
    channels: 'purple',
    financials: 'green',
    announcements: 'orange',
    meetings: 'cyan',
    documents: 'gray',
    units: 'amber',
    requests: 'rose',
    vendors: 'emerald',
  };
  return colors[category] || 'gray';
}

// Initialize
onMounted(() => {
  fetchPeople();
});
</script>

<template>
  <div class="admin-page bg-white dark:bg-gray-900 min-h-full">
    <div class="container mx-auto px-6 py-8">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 class="text-2xl font-bold">User Permissions</h1>
          <p class="text-gray-600 dark:text-gray-400 mt-1">
            Manage granular CRUD permissions for individual users
          </p>
        </div>
        <div class="mt-4 md:mt-0">
          <UBadge color="primary" variant="soft" size="lg">
            {{ people.length }} users
          </UBadge>
        </div>
      </div>

      <!-- Access Denied -->
      <div v-if="!isAdmin" class="text-center py-12">
        <UIcon name="i-heroicons-shield-exclamation" class="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 class="text-xl font-semibold mb-2">Access Denied</h2>
        <p class="text-gray-600 dark:text-gray-400">
          You need administrator privileges to manage permissions.
        </p>
      </div>

      <!-- Permissions Management -->
      <template v-else>
        <!-- Info Card -->
        <UCard class="mb-6">
          <div class="flex items-start gap-4">
            <UIcon name="i-heroicons-information-circle" class="w-6 h-6 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 class="font-medium text-gray-900 dark:text-white">How Permissions Work</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                <strong>Administrators</strong> always have full access to everything.
                <strong>Board Members</strong> have full access by default.
                <strong>Members</strong> need explicit permissions granted here for actions beyond their role defaults.
              </p>
            </div>
          </div>
        </UCard>

        <!-- Search -->
        <div class="mb-6">
          <UInput
            v-model="searchQuery"
            icon="i-heroicons-magnifying-glass"
            placeholder="Search by name or email..."
            class="max-w-md"
          />
        </div>

        <!-- People Table -->
        <UCard>
          <UTable
            :rows="filteredPeople"
            :columns="[
              { key: 'name', label: 'Person' },
              { key: 'category', label: 'Category' },
              { key: 'permissions', label: 'Permissions' },
              { key: 'actions', label: 'Actions' },
            ]"
            :loading="loading"
            :empty-state="{ icon: 'i-heroicons-users', label: 'No people found' }"
          >
            <template #name-data="{ row }">
              <div class="flex items-center gap-3">
                <UAvatar :alt="`${row.first_name} ${row.last_name}`" size="sm" />
                <div>
                  <p class="font-medium">{{ row.first_name }} {{ row.last_name }}</p>
                  <p class="text-xs text-gray-500">{{ row.email }}</p>
                </div>
              </div>
            </template>

            <template #category-data="{ row }">
              <UBadge
                :color="row.category === 'Owner' ? 'green' : row.category === 'Tenant' ? 'blue' : 'gray'"
                variant="soft"
                size="sm"
              >
                {{ row.category || 'Unknown' }}
              </UBadge>
            </template>

            <template #permissions-data="{ row }">
              <div v-if="hasAnyPermission(row)" class="flex items-center gap-2">
                <UBadge color="primary" variant="soft" size="sm">
                  {{ getPermissionCount(row) }} permissions
                </UBadge>
              </div>
              <span v-else class="text-sm text-gray-500">Role defaults only</span>
            </template>

            <template #actions-data="{ row }">
              <UButton
                size="xs"
                color="primary"
                variant="soft"
                icon="i-heroicons-key"
                @click="openPermissionModal(row)"
              >
                Configure
              </UButton>
            </template>
          </UTable>
        </UCard>
      </template>

      <!-- Permission Modal -->
      <UModal v-model="showPermissionModal" :ui="{ width: 'sm:max-w-3xl' }">
        <UCard v-if="selectedPerson">
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <UAvatar :alt="`${selectedPerson.first_name} ${selectedPerson.last_name}`" />
                <div>
                  <h3 class="text-lg font-semibold">
                    {{ selectedPerson.first_name }} {{ selectedPerson.last_name }}
                  </h3>
                  <p class="text-sm text-gray-500">{{ selectedPerson.email }}</p>
                </div>
              </div>
              <UButton
                color="gray"
                variant="ghost"
                icon="i-heroicons-x-mark"
                @click="showPermissionModal = false"
              />
            </div>
          </template>

          <div class="space-y-6 max-h-[60vh] overflow-y-auto">
            <!-- Approval Permissions Section -->
            <div class="border-2 border-amber-200 dark:border-amber-800 rounded-lg p-4 bg-amber-50 dark:bg-amber-900/20">
              <div class="flex items-center gap-2 mb-3">
                <UIcon name="i-heroicons-check-badge" class="w-5 h-5 text-amber-600" />
                <span class="font-medium text-amber-800 dark:text-amber-200">Approval Permissions</span>
              </div>
              <p class="text-xs text-amber-700 dark:text-amber-300 mb-4">
                Allow this user to approve member submissions (pets, vehicles, leases).
                Board members have these permissions by default.
              </p>
              <div class="grid grid-cols-3 gap-4">
                <div
                  v-for="category in Object.values(APPROVAL_CATEGORIES)"
                  :key="category"
                  class="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg"
                >
                  <UIcon :name="APPROVAL_CATEGORY_META[category].icon" class="w-5 h-5 text-amber-600" />
                  <UCheckbox
                    v-model="(permissionForm as any)[`${category}_approve`]"
                    :label="`Approve ${APPROVAL_CATEGORY_META[category].label}`"
                  />
                </div>
              </div>
            </div>

            <!-- CRUD Permission Categories -->
            <div class="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Content Permissions (CRUD)</h4>
            </div>
            <div
              v-for="category in Object.values(PERMISSION_CATEGORIES)"
              :key="category"
              class="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
            >
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                  <UIcon :name="PERMISSION_CATEGORY_META[category].icon" class="w-5 h-5" />
                  <span class="font-medium">{{ PERMISSION_CATEGORY_META[category].label }}</span>
                </div>
                <div class="flex gap-2">
                  <UButton
                    size="xs"
                    color="green"
                    variant="ghost"
                    @click="toggleAllCategory(category, true)"
                  >
                    All
                  </UButton>
                  <UButton
                    size="xs"
                    color="gray"
                    variant="ghost"
                    @click="toggleAllCategory(category, false)"
                  >
                    None
                  </UButton>
                </div>
              </div>
              <p class="text-xs text-gray-500 mb-3">
                {{ PERMISSION_CATEGORY_META[category].description }}
              </p>
              <div class="grid grid-cols-4 gap-2">
                <UCheckbox
                  v-for="action in Object.values(CRUD_ACTIONS)"
                  :key="`${category}_${action}`"
                  v-model="(permissionForm as any)[`${category}_${action}`]"
                  :label="action.charAt(0).toUpperCase() + action.slice(1)"
                />
              </div>
            </div>
          </div>

          <template #footer>
            <div class="flex justify-between">
              <div>
                <UButton
                  v-if="existingPermissionId"
                  color="red"
                  variant="ghost"
                  icon="i-heroicons-trash"
                  :loading="saving"
                  @click="deletePermissions"
                >
                  Delete Permissions
                </UButton>
              </div>
              <div class="flex gap-3">
                <UButton color="gray" variant="ghost" @click="showPermissionModal = false">
                  Cancel
                </UButton>
                <UButton color="primary" :loading="saving" @click="savePermissions">
                  Save Permissions
                </UButton>
              </div>
            </div>
          </template>
        </UCard>
      </UModal>
    </div>
  </div>
</template>
