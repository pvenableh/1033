<script setup lang="ts">
definePageMeta({
  layout: 'default',
  middleware: ['auth', 'role'],
});

const toast = useToast();
const { canApprove, APPROVAL_CATEGORIES, APPROVAL_CATEGORY_META } = useUserPermissions();

// State
const loading = ref(true);
const actionLoading = ref<string | null>(null);
const pendingItems = ref<{
  pets: any[];
  vehicles: any[];
  leases: any[];
  permissions: {
    pets: boolean;
    vehicles: boolean;
    leases: boolean;
  };
}>({
  pets: [],
  vehicles: [],
  leases: [],
  permissions: {
    pets: false,
    vehicles: false,
    leases: false,
  },
});

// Active tab
const activeTab = ref<'pets' | 'vehicles' | 'leases'>('pets');

// Computed
const hasAnyPermission = computed(() => {
  return pendingItems.value.permissions.pets ||
    pendingItems.value.permissions.vehicles ||
    pendingItems.value.permissions.leases;
});

const totalPending = computed(() => {
  return pendingItems.value.pets.length +
    pendingItems.value.vehicles.length +
    pendingItems.value.leases.length;
});

const tabs = computed(() => {
  const items = [];

  if (pendingItems.value.permissions.pets) {
    items.push({
      key: 'pets',
      label: 'Pets',
      icon: 'i-heroicons-heart',
      badge: pendingItems.value.pets.length,
    });
  }

  if (pendingItems.value.permissions.vehicles) {
    items.push({
      key: 'vehicles',
      label: 'Vehicles',
      icon: 'i-heroicons-truck',
      badge: pendingItems.value.vehicles.length,
    });
  }

  if (pendingItems.value.permissions.leases) {
    items.push({
      key: 'leases',
      label: 'Leases',
      icon: 'i-heroicons-document-check',
      badge: pendingItems.value.leases.length,
    });
  }

  return items;
});

// Methods
async function fetchPendingItems() {
  loading.value = true;
  try {
    const response = await $fetch<typeof pendingItems.value>('/api/admin/approvals/pending');
    pendingItems.value = response;

    // Set first available tab as active
    if (response.permissions.pets && response.pets.length > 0) {
      activeTab.value = 'pets';
    } else if (response.permissions.vehicles && response.vehicles.length > 0) {
      activeTab.value = 'vehicles';
    } else if (response.permissions.leases && response.leases.length > 0) {
      activeTab.value = 'leases';
    }
  } catch (error: any) {
    console.error('Failed to fetch pending items:', error);
    toast.add({
      title: 'Error',
      description: error.data?.message || 'Failed to load pending items',
      color: 'red',
    });
  } finally {
    loading.value = false;
  }
}

async function updateStatus(type: 'pets' | 'vehicles' | 'leases', id: string | number, status: string) {
  const loadingKey = `${type}-${id}`;
  actionLoading.value = loadingKey;

  try {
    await $fetch(`/api/admin/approvals/${type}/${id}`, {
      method: 'PATCH',
      body: { status },
    });

    const action = status === 'published' ? 'approved' : status === 'archived' ? 'rejected' : 'updated';
    toast.add({
      title: 'Success',
      description: `Item ${action} successfully`,
      color: 'green',
    });

    // Refresh the list
    await fetchPendingItems();
  } catch (error: any) {
    console.error(`Failed to update ${type} status:`, error);
    toast.add({
      title: 'Error',
      description: error.data?.message || `Failed to update ${type} status`,
      color: 'red',
    });
  } finally {
    actionLoading.value = null;
  }
}

function getUnitNumber(item: any): string {
  if (item.unit_id?.number) return item.unit_id.number;
  if (typeof item.unit_id === 'string') return item.unit_id;
  return 'N/A';
}

function formatDate(date: string): string {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Initialize
onMounted(() => {
  fetchPendingItems();
});
</script>

<template>
  <div class="admin-page bg-white dark:bg-gray-900 min-h-full">
    <div class="container mx-auto px-6 py-8">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 class="text-2xl font-bold">Pending Approvals</h1>
          <p class="text-gray-600 dark:text-gray-400 mt-1">
            Review and approve member submissions
          </p>
        </div>
        <div class="mt-4 md:mt-0 flex items-center gap-3">
          <UBadge v-if="totalPending > 0" color="amber" variant="soft" size="lg">
            {{ totalPending }} pending {{ totalPending === 1 ? 'item' : 'items' }}
          </UBadge>
          <UButton
            icon="i-heroicons-arrow-path"
            color="gray"
            variant="ghost"
            :loading="loading"
            @click="fetchPendingItems">
            Refresh
          </UButton>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center py-12">
        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-primary-500" />
      </div>

      <!-- No Permission -->
      <div v-else-if="!hasAnyPermission" class="text-center py-12">
        <UIcon name="i-heroicons-shield-exclamation" class="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 class="text-xl font-semibold mb-2">Access Denied</h2>
        <p class="text-gray-600 dark:text-gray-400">
          You do not have permission to approve any items.
        </p>
      </div>

      <!-- Approvals Content -->
      <template v-else>
        <!-- No Pending Items -->
        <div v-if="totalPending === 0" class="text-center py-12">
          <UIcon name="i-heroicons-check-circle" class="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 class="text-xl font-semibold mb-2">All Caught Up!</h2>
          <p class="text-gray-600 dark:text-gray-400">
            There are no items pending approval.
          </p>
        </div>

        <!-- Tabs and Content -->
        <template v-else>
          <UTabs :items="tabs" v-model="activeTab" class="mb-6">
            <template #item="{ item }">
              <div class="flex items-center gap-2">
                <UIcon :name="item.icon" class="w-4 h-4" />
                <span>{{ item.label }}</span>
                <UBadge v-if="item.badge > 0" color="amber" variant="soft" size="xs">
                  {{ item.badge }}
                </UBadge>
              </div>
            </template>
          </UTabs>

          <!-- Pets Tab -->
          <div v-if="activeTab === 'pets' && pendingItems.permissions.pets">
            <UCard v-if="pendingItems.pets.length === 0">
              <div class="text-center py-8 text-gray-500">
                No pending pet registrations
              </div>
            </UCard>

            <div v-else class="space-y-4">
              <UCard v-for="pet in pendingItems.pets" :key="pet.id">
                <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div class="flex items-center gap-4">
                    <div class="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                      <UIcon name="i-heroicons-heart" class="w-6 h-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <h3 class="font-semibold">{{ pet.name || 'Unnamed Pet' }}</h3>
                      <p class="text-sm text-gray-600 dark:text-gray-400">
                        {{ pet.category }} {{ pet.breed ? `- ${pet.breed}` : '' }}
                        {{ pet.weight ? `(${pet.weight} lbs)` : '' }}
                      </p>
                      <p class="text-xs text-gray-500 mt-1">
                        Unit {{ getUnitNumber(pet) }} &bull; Submitted {{ formatDate(pet.date_created) }}
                      </p>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <UButton
                      color="green"
                      variant="soft"
                      icon="i-heroicons-check"
                      :loading="actionLoading === `pets-${pet.id}`"
                      :disabled="actionLoading !== null"
                      @click="updateStatus('pets', pet.id, 'published')">
                      Approve
                    </UButton>
                    <UButton
                      color="red"
                      variant="soft"
                      icon="i-heroicons-x-mark"
                      :loading="actionLoading === `pets-${pet.id}`"
                      :disabled="actionLoading !== null"
                      @click="updateStatus('pets', pet.id, 'archived')">
                      Reject
                    </UButton>
                  </div>
                </div>
              </UCard>
            </div>
          </div>

          <!-- Vehicles Tab -->
          <div v-if="activeTab === 'vehicles' && pendingItems.permissions.vehicles">
            <UCard v-if="pendingItems.vehicles.length === 0">
              <div class="text-center py-8 text-gray-500">
                No pending vehicle registrations
              </div>
            </UCard>

            <div v-else class="space-y-4">
              <UCard v-for="vehicle in pendingItems.vehicles" :key="vehicle.id">
                <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div class="flex items-center gap-4">
                    <div class="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <UIcon name="i-heroicons-truck" class="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 class="font-semibold">
                        {{ vehicle.year }} {{ vehicle.make }} {{ vehicle.model }}
                      </h3>
                      <p class="text-sm text-gray-600 dark:text-gray-400">
                        {{ vehicle.color }} &bull; {{ vehicle.license_plate }} ({{ vehicle.state }})
                      </p>
                      <p class="text-xs text-gray-500 mt-1">
                        Unit {{ getUnitNumber(vehicle) }} &bull; Submitted {{ formatDate(vehicle.date_created) }}
                      </p>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <UButton
                      color="green"
                      variant="soft"
                      icon="i-heroicons-check"
                      :loading="actionLoading === `vehicles-${vehicle.id}`"
                      :disabled="actionLoading !== null"
                      @click="updateStatus('vehicles', vehicle.id, 'published')">
                      Approve
                    </UButton>
                    <UButton
                      color="red"
                      variant="soft"
                      icon="i-heroicons-x-mark"
                      :loading="actionLoading === `vehicles-${vehicle.id}`"
                      :disabled="actionLoading !== null"
                      @click="updateStatus('vehicles', vehicle.id, 'archived')">
                      Reject
                    </UButton>
                  </div>
                </div>
              </UCard>
            </div>
          </div>

          <!-- Leases Tab -->
          <div v-if="activeTab === 'leases' && pendingItems.permissions.leases">
            <UCard v-if="pendingItems.leases.length === 0">
              <div class="text-center py-8 text-gray-500">
                No pending lease submissions
              </div>
            </UCard>

            <div v-else class="space-y-4">
              <UCard v-for="lease in pendingItems.leases" :key="lease.id">
                <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div class="flex items-center gap-4">
                    <div class="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <UIcon name="i-heroicons-document-check" class="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h3 class="font-semibold">
                        {{ lease.person?.first_name }} {{ lease.person?.last_name }}
                      </h3>
                      <p class="text-sm text-gray-600 dark:text-gray-400">
                        {{ formatDate(lease.start) }} - {{ formatDate(lease.finish) }}
                      </p>
                      <p class="text-xs text-gray-500 mt-1">
                        Submitted {{ formatDate(lease.date_created) }}
                      </p>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <UButton
                      v-if="lease.file"
                      color="gray"
                      variant="ghost"
                      icon="i-heroicons-document-arrow-down"
                      size="sm">
                      View File
                    </UButton>
                    <UButton
                      color="green"
                      variant="soft"
                      icon="i-heroicons-check"
                      :loading="actionLoading === `leases-${lease.id}`"
                      :disabled="actionLoading !== null"
                      @click="updateStatus('leases', lease.id, 'published')">
                      Approve
                    </UButton>
                    <UButton
                      color="red"
                      variant="soft"
                      icon="i-heroicons-x-mark"
                      :loading="actionLoading === `leases-${lease.id}`"
                      :disabled="actionLoading !== null"
                      @click="updateStatus('leases', lease.id, 'archived')">
                      Reject
                    </UButton>
                  </div>
                </div>
              </UCard>
            </div>
          </div>
        </template>
      </template>
    </div>
  </div>
</template>
