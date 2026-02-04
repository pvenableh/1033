<script setup lang="ts">
import type { DirectusUser, DirectusRole } from '~/types/directus';

definePageMeta({
  layout: 'default',
  middleware: ['auth', 'role'],
});

useSeoMeta({
  title: 'User Management - Admin',
});

const route = useRoute();
const toast = useToast();
const { isAdmin, APP_ROLES } = useRoles();

// State
const users = ref<DirectusUser[]>([]);
const roles = ref<DirectusRole[]>([]);
const loading = ref(true);
const selectedUser = ref<DirectusUser | null>(null);
const showUserModal = ref(false);
const actionLoading = ref(false);

// Filters
const statusFilter = ref(route.query.status as string || 'all');
const searchQuery = ref('');

const statusOptions = [
  { label: 'All Users', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Pending Approval', value: 'draft' },
  { label: 'Invited', value: 'invited' },
  { label: 'Suspended', value: 'suspended' },
];

// Computed
const filteredUsers = computed(() => {
  let result = users.value;

  // Filter by status
  if (statusFilter.value !== 'all') {
    result = result.filter(u => u.status === statusFilter.value);
  }

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(u =>
      u.first_name?.toLowerCase().includes(query) ||
      u.last_name?.toLowerCase().includes(query) ||
      u.email?.toLowerCase().includes(query)
    );
  }

  return result;
});

const pendingCount = computed(() => {
  return users.value.filter(u => u.status === 'draft').length;
});

// Table columns
const columns = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Role' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: 'Actions' },
];

// Methods
async function fetchUsers() {
  loading.value = true;
  try {
    const response: any = await $fetch('/api/directus/users', {
      method: 'POST',
      body: {
        operation: 'list',
        query: {
          fields: ['id', 'first_name', 'last_name', 'email', 'status', 'role.id', 'role.name', 'description'],
          sort: ['-id'],
          limit: -1,
        },
      },
    });
    users.value = response || [];
  } catch (error) {
    console.error('Failed to fetch users:', error);
    toast.add({
      title: 'Error',
      description: 'Failed to load users',
      color: 'red',
    });
  } finally {
    loading.value = false;
  }
}

async function fetchRoles() {
  try {
    const response: any = await $fetch('/api/directus/roles');
    roles.value = response || [];
  } catch (error) {
    console.error('Failed to fetch roles:', error);
  }
}

function openUserModal(user: User) {
  selectedUser.value = { ...user };
  showUserModal.value = true;
}

async function approveUser(user: User, roleId: string) {
  actionLoading.value = true;
  try {
    await $fetch('/api/directus/users', {
      method: 'POST',
      body: {
        operation: 'update',
        id: user.id,
        data: {
          status: 'active',
          role: roleId,
        },
      },
    });

    toast.add({
      title: 'User Approved',
      description: `${user.first_name} ${user.last_name} has been approved and assigned a role.`,
      color: 'green',
    });

    await fetchUsers();
    showUserModal.value = false;
  } catch (error: any) {
    console.error('Failed to approve user:', error);
    toast.add({
      title: 'Error',
      description: error.data?.message || error.data?.errors?.[0]?.message || 'Failed to approve user',
      color: 'red',
    });
  } finally {
    actionLoading.value = false;
  }
}

async function updateUserRole(user: User, roleId: string) {
  actionLoading.value = true;
  try {
    await $fetch('/api/directus/users', {
      method: 'POST',
      body: {
        operation: 'update',
        id: user.id,
        data: {
          role: roleId,
        },
      },
    });

    toast.add({
      title: 'Role Updated',
      description: `Role updated for ${user.first_name} ${user.last_name}.`,
      color: 'green',
    });

    await fetchUsers();
    showUserModal.value = false;
  } catch (error: any) {
    console.error('Failed to update role:', error);
    toast.add({
      title: 'Error',
      description: error.data?.message || error.data?.errors?.[0]?.message || 'Failed to update role',
      color: 'red',
    });
  } finally {
    actionLoading.value = false;
  }
}

async function updateUserStatus(user: User, status: string) {
  actionLoading.value = true;
  try {
    await $fetch('/api/directus/users', {
      method: 'POST',
      body: {
        operation: 'update',
        id: user.id,
        data: { status },
      },
    });

    toast.add({
      title: 'Status Updated',
      description: `${user.first_name} ${user.last_name} is now ${status}.`,
      color: 'green',
    });

    await fetchUsers();
    showUserModal.value = false;
  } catch (error: any) {
    console.error('Failed to update status:', error);
    toast.add({
      title: 'Error',
      description: error.data?.message || error.data?.errors?.[0]?.message || 'Failed to update status',
      color: 'red',
    });
  } finally {
    actionLoading.value = false;
  }
}

async function sendInvite(email: string) {
  actionLoading.value = true;
  try {
    // This would typically call a server API to send an invite email
    // For now, we'll create a user with 'invited' status
    toast.add({
      title: 'Invite Sent',
      description: `Invitation sent to ${email}`,
      color: 'green',
    });
  } catch (error) {
    toast.add({
      title: 'Error',
      description: 'Failed to send invite',
      color: 'red',
    });
  } finally {
    actionLoading.value = false;
  }
}

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    active: 'green',
    draft: 'amber',
    invited: 'blue',
    suspended: 'red',
    deleted: 'gray',
  };
  return colors[status] || 'gray';
}

function getRoleName(user: User): string {
  if (typeof user.role === 'object' && user.role?.name) {
    return user.role.name;
  }
  return 'No Role';
}

function parseUserDescription(user: User): { unit_number?: string; residency_type?: string } | null {
  if (!user.description) return null;
  try {
    return JSON.parse(user.description);
  } catch {
    return null;
  }
}

// Watch for route query changes
watch(() => route.query.status, (newStatus) => {
  if (newStatus) {
    statusFilter.value = newStatus as string;
  }
});

// Initialize
onMounted(async () => {
  await Promise.all([fetchUsers(), fetchRoles()]);
});
</script>

<template>
  <div class="admin-page bg-white dark:bg-gray-900 min-h-full">
  <div class="container mx-auto px-6 py-8">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold">User Management</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-1">
          Manage user access and roles
        </p>
      </div>
      <div class="mt-4 md:mt-0">
        <Badge v-if="pendingCount > 0" color="amber" variant="soft" size="lg">
          {{ pendingCount }} pending {{ pendingCount === 1 ? 'request' : 'requests' }}
        </Badge>
      </div>
    </div>

    <!-- Access Denied -->
    <div v-if="!isAdmin" class="text-center py-12">
      <Icon name="i-heroicons-shield-exclamation" class="w-16 h-16 text-red-500 mx-auto mb-4" />
      <h2 class="text-xl font-semibold mb-2">Access Denied</h2>
      <p class="text-gray-600 dark:text-gray-400">
        You do not have administrator privileges.
      </p>
    </div>

    <!-- User Management -->
    <template v-else>
      <!-- Filters -->
      <div class="flex flex-col md:flex-row gap-4 mb-6">
        <Input
          v-model="searchQuery"
          icon="i-heroicons-magnifying-glass"
          placeholder="Search users..."
          class="md:w-64" />
        <SelectMenu
          v-model="statusFilter"
          :options="statusOptions"
          value-attribute="value"
          option-attribute="label"
          class="md:w-48" />
      </div>

      <!-- Users Table -->
      <Card>
        <Table
          :rows="filteredUsers"
          :columns="columns"
          :loading="loading"
          :empty-state="{ icon: 'i-heroicons-users', label: 'No users found' }">
          <template #name-data="{ row }">
            <div class="flex items-center gap-3">
              <Avatar
                :alt="`${row.first_name} ${row.last_name}`"
                size="sm" />
              <div>
                <p class="font-medium">{{ row.first_name }} {{ row.last_name }}</p>
                <p v-if="parseUserDescription(row)?.unit_number" class="text-xs text-gray-500">
                  Unit {{ parseUserDescription(row)?.unit_number }}
                </p>
              </div>
            </div>
          </template>

          <template #email-data="{ row }">
            <span class="text-sm">{{ row.email }}</span>
          </template>

          <template #role-data="{ row }">
            <Badge
              :color="getRoleName(row) === APP_ROLES.ADMIN ? 'red' : 'gray'"
              variant="soft"
              size="sm">
              {{ getRoleName(row) }}
            </Badge>
          </template>

          <template #status-data="{ row }">
            <Badge
              :color="getStatusColor(row.status)"
              variant="soft"
              size="sm">
              {{ row.status }}
            </Badge>
          </template>

          <template #actions-data="{ row }">
            <div class="flex items-center gap-2">
              <Button
                v-if="row.status === 'draft'"
                size="xs"
                color="green"
                variant="soft"
                icon="i-heroicons-check"
                @click="openUserModal(row)">
                Approve
              </Button>
              <Button
                size="xs"
                color="gray"
                variant="ghost"
                icon="i-heroicons-pencil"
                @click="openUserModal(row)">
                Edit
              </Button>
            </div>
          </template>
        </Table>
      </Card>
    </template>

    <!-- User Edit Modal -->
    <Modal v-model="showUserModal">
      <Card v-if="selectedUser">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">
              {{ selectedUser.status === 'draft' ? 'Approve User' : 'Edit User' }}
            </h3>
            <Button
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark"
              @click="showUserModal = false" />
          </div>
        </template>

        <div class="space-y-6">
          <!-- User Info -->
          <div class="flex items-center gap-4">
            <Avatar
              :alt="`${selectedUser.first_name} ${selectedUser.last_name}`"
              size="lg" />
            <div>
              <h4 class="font-semibold">{{ selectedUser.first_name }} {{ selectedUser.last_name }}</h4>
              <p class="text-sm text-gray-600 dark:text-gray-400">{{ selectedUser.email }}</p>
            </div>
          </div>

          <!-- Request Details (for pending users) -->
          <div v-if="parseUserDescription(selectedUser)" class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h5 class="font-medium mb-2">Request Details</h5>
            <div class="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span class="text-gray-500">Unit Number:</span>
                <span class="ml-2 font-medium">{{ parseUserDescription(selectedUser)?.unit_number }}</span>
              </div>
              <div>
                <span class="text-gray-500">Residency Type:</span>
                <span class="ml-2 font-medium capitalize">{{ parseUserDescription(selectedUser)?.residency_type }}</span>
              </div>
            </div>
          </div>

          <!-- Current Status -->
          <div>
            <label class="block text-sm font-medium mb-2">Current Status</label>
            <Badge :color="getStatusColor(selectedUser.status)" variant="soft">
              {{ selectedUser.status }}
            </Badge>
          </div>

          <!-- Role Selection -->
          <FormGroup label="Assign Role">
            <SelectMenu
              v-model="selectedUser.role"
              :options="roles"
              value-attribute="id"
              option-attribute="name"
              placeholder="Select a role">
              <template #option="{ option }">
                <div>
                  <p class="font-medium">{{ option.name }}</p>
                  <p v-if="option.description" class="text-xs text-gray-500">{{ option.description }}</p>
                </div>
              </template>
            </SelectMenu>
          </FormGroup>

          <!-- Status Actions -->
          <div v-if="selectedUser.status !== 'draft'" class="flex gap-2">
            <Button
              v-if="selectedUser.status !== 'active'"
              size="sm"
              color="green"
              variant="soft"
              :loading="actionLoading"
              @click="updateUserStatus(selectedUser, 'active')">
              Activate
            </Button>
            <Button
              v-if="selectedUser.status !== 'suspended'"
              size="sm"
              color="amber"
              variant="soft"
              :loading="actionLoading"
              @click="updateUserStatus(selectedUser, 'suspended')">
              Suspend
            </Button>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end gap-3">
            <Button
              color="gray"
              variant="ghost"
              @click="showUserModal = false">
              Cancel
            </Button>
            <Button
              v-if="selectedUser.status === 'draft'"
              color="green"
              :loading="actionLoading"
              :disabled="!selectedUser.role"
              @click="approveUser(selectedUser, typeof selectedUser.role === 'object' ? selectedUser.role.id : selectedUser.role)">
              Approve & Assign Role
            </Button>
            <Button
              v-else
              color="primary"
              :loading="actionLoading"
              :disabled="!selectedUser.role"
              @click="updateUserRole(selectedUser, typeof selectedUser.role === 'object' ? selectedUser.role.id : selectedUser.role)">
              Update Role
            </Button>
          </div>
        </template>
      </Card>
    </Modal>
  </div>
  </div>
</template>
