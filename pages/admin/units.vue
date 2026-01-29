<script setup lang="ts">
definePageMeta({
  layout: 'default',
  middleware: ['auth', 'role'],
});

const toast = useToast();
const { isAdmin } = useRoles();

// State
const units = ref<any[]>([]);
const allUsers = ref<any[]>([]);
const loading = ref(true);
const selectedUnit = ref<any | null>(null);
const showUnitModal = ref(false);
const showAssignModal = ref(false);
const actionLoading = ref(false);

// Filters
const searchQuery = ref('');
const occupantFilter = ref('all');

const occupantOptions = [
  { label: 'All Units', value: 'all' },
  { label: 'Owner-Occupied', value: 'Owner' },
  { label: 'Tenant-Occupied', value: 'Tenant' },
];

// Collections
const unitsCollection = useDirectusItems('units');
const junctionCollection = useDirectusItems('junction_directus_users_units');
const leasesCollection = useDirectusItems('leases');

// Lease management state
const showLeaseModal = ref(false);
const selectedPerson = ref<any | null>(null);
const personLeases = ref<any[]>([]);
const leasesLoading = ref(false);
const leaseUploading = ref(false);
const newLeaseStart = ref('');
const newLeaseEnd = ref('');
const leaseFileInput = ref<HTMLInputElement | null>(null);

// Computed
const filteredUnits = computed(() => {
  let result = units.value;

  if (occupantFilter.value !== 'all') {
    result = result.filter(u => u.occupant === occupantFilter.value);
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(u => {
      const unitNum = (u.number || '').toLowerCase();
      const assignedNames = (u.assignedUsers || []).map((au: any) =>
        `${au.first_name || ''} ${au.last_name || ''}`.toLowerCase()
      ).join(' ');
      const peopleNames = (u.people || []).map((p: any) =>
        `${p.people_id?.first_name || ''} ${p.people_id?.last_name || ''}`.toLowerCase()
      ).join(' ');
      return unitNum.includes(query) || assignedNames.includes(query) || peopleNames.includes(query);
    });
  }

  return result;
});

const columns = [
  { key: 'number', label: 'Unit' },
  { key: 'occupant', label: 'Occupant Type' },
  { key: 'people', label: 'Residents' },
  { key: 'assignedUsers', label: 'Assigned Users' },
  { key: 'vehicles', label: 'Vehicles' },
  { key: 'pets', label: 'Pets' },
  { key: 'actions', label: 'Actions' },
];

// Methods
async function fetchUnits() {
  loading.value = true;
  try {
    const data = await unitsCollection.list({
      fields: [
        'id', 'number', 'occupant', 'parking_spot', 'status',
        'people.id', 'people.people_id.id', 'people.people_id.first_name', 'people.people_id.last_name', 'people.people_id.category', 'people.people_id.email', 'people.people_id.phone',
        'people.people_id.leases.id', 'people.people_id.leases.start', 'people.people_id.leases.finish', 'people.people_id.leases.status',
        'vehicles.id', 'vehicles.make', 'vehicles.model', 'vehicles.year', 'vehicles.color', 'vehicles.license_plate', 'vehicles.state',
        'pets.id', 'pets.name', 'pets.category', 'pets.breed',
      ],
      filter: { status: { _eq: 'published' } },
      sort: ['number'],
      limit: -1,
    });

    // Fetch junction data to get assigned users per unit
    const junctionData = await junctionCollection.list({
      fields: ['id', 'directus_users_id.id', 'directus_users_id.first_name', 'directus_users_id.last_name', 'directus_users_id.email', 'units_id.id'],
      limit: -1,
    });

    // Map junction entries to units
    const junctionByUnit: Record<number, any[]> = {};
    for (const j of (junctionData || [])) {
      const unitId = typeof j.units_id === 'object' ? j.units_id?.id : j.units_id;
      if (unitId) {
        if (!junctionByUnit[unitId]) junctionByUnit[unitId] = [];
        junctionByUnit[unitId].push({
          junctionId: j.id,
          ...( typeof j.directus_users_id === 'object' ? j.directus_users_id : { id: j.directus_users_id }),
        });
      }
    }

    units.value = (data || []).map((unit: any) => ({
      ...unit,
      assignedUsers: junctionByUnit[unit.id] || [],
    }));
  } catch (error) {
    console.error('Failed to fetch units:', error);
    toast.add({ title: 'Error', description: 'Failed to load units', color: 'red' });
  } finally {
    loading.value = false;
  }
}

async function fetchUsers() {
  try {
    const response: any = await $fetch('/api/directus/users', {
      method: 'POST',
      body: {
        operation: 'list',
        query: {
          fields: ['id', 'first_name', 'last_name', 'email', 'status'],
          filter: { status: { _eq: 'active' } },
          sort: ['first_name'],
          limit: -1,
        },
      },
    });
    allUsers.value = response || [];
  } catch (error) {
    console.error('Failed to fetch users:', error);
  }
}

function openUnitDetail(unit: any) {
  selectedUnit.value = { ...unit };
  showUnitModal.value = true;
}

function openAssignModal(unit: any) {
  selectedUnit.value = { ...unit };
  showAssignModal.value = true;
}

// Users not yet assigned to this unit
const availableUsers = computed(() => {
  if (!selectedUnit.value) return [];
  const assignedIds = new Set(
    (selectedUnit.value.assignedUsers || []).map((u: any) => u.id)
  );
  return allUsers.value.filter(u => !assignedIds.has(u.id));
});

async function assignUser(userId: string) {
  if (!selectedUnit.value) return;
  actionLoading.value = true;
  try {
    await junctionCollection.create({
      directus_users_id: userId,
      units_id: selectedUnit.value.id,
    });
    toast.add({
      title: 'User Assigned',
      description: 'User has been assigned to the unit.',
      color: 'green',
    });
    await fetchUnits();
    // Update the selected unit reference
    selectedUnit.value = units.value.find((u: any) => u.id === selectedUnit.value.id) || null;
  } catch (error: any) {
    console.error('Failed to assign user:', error);
    toast.add({
      title: 'Error',
      description: error.data?.message || 'Failed to assign user',
      color: 'red',
    });
  } finally {
    actionLoading.value = false;
  }
}

async function unassignUser(junctionId: number) {
  actionLoading.value = true;
  try {
    await junctionCollection.remove(junctionId);
    toast.add({
      title: 'User Removed',
      description: 'User has been removed from the unit.',
      color: 'green',
    });
    await fetchUnits();
    if (selectedUnit.value) {
      selectedUnit.value = units.value.find((u: any) => u.id === selectedUnit.value.id) || null;
    }
  } catch (error: any) {
    console.error('Failed to unassign user:', error);
    toast.add({
      title: 'Error',
      description: error.data?.message || 'Failed to remove user',
      color: 'red',
    });
  } finally {
    actionLoading.value = false;
  }
}

async function updateOccupantType(unit: any, occupant: string) {
  actionLoading.value = true;
  try {
    await unitsCollection.update(unit.id, { occupant });
    toast.add({
      title: 'Updated',
      description: `Unit ${unit.number} occupant type updated to ${occupant}.`,
      color: 'green',
    });
    await fetchUnits();
    if (selectedUnit.value) {
      selectedUnit.value = units.value.find((u: any) => u.id === selectedUnit.value.id) || null;
    }
  } catch (error: any) {
    console.error('Failed to update unit:', error);
    toast.add({
      title: 'Error',
      description: error.data?.message || 'Failed to update unit',
      color: 'red',
    });
  } finally {
    actionLoading.value = false;
  }
}

// Lease management
async function openLeaseModal(person: any) {
  selectedPerson.value = person;
  personLeases.value = [];
  showLeaseModal.value = true;
  await fetchPersonLeases(person.id);
}

async function fetchPersonLeases(personId: number) {
  leasesLoading.value = true;
  try {
    const data = await leasesCollection.list({
      fields: ['id', 'status', 'start', 'finish', 'file.id', 'file.filename_download', 'file.type', 'person.id', 'person.first_name', 'person.last_name'],
      filter: { person: { _eq: personId } },
      sort: ['-start'],
      limit: -1,
    });
    personLeases.value = data || [];
  } catch (error) {
    console.error('Failed to fetch leases:', error);
    toast.add({ title: 'Error', description: 'Failed to load leases', color: 'red' });
  } finally {
    leasesLoading.value = false;
  }
}

async function uploadLeaseWithPdf() {
  if (!selectedPerson.value || !newLeaseStart.value || !newLeaseEnd.value) {
    toast.add({ title: 'Error', description: 'Please fill in lease start and end dates', color: 'red' });
    return;
  }

  leaseUploading.value = true;
  try {
    let fileId = null;

    // Upload PDF if selected
    const fileInput = leaseFileInput.value;
    if (fileInput?.files?.length) {
      const formData = new FormData();
      formData.append('file', fileInput.files[0]);
      const uploadResult: any = await $fetch('/api/directus/files/upload', {
        method: 'POST',
        body: formData,
      });
      fileId = uploadResult?.id || null;
    }

    // Create lease record
    await leasesCollection.create({
      person: selectedPerson.value.id,
      start: newLeaseStart.value,
      finish: newLeaseEnd.value,
      file: fileId,
      status: 'published',
    });

    toast.add({ title: 'Lease Created', description: 'Lease has been added successfully.', color: 'green' });

    // Reset form
    newLeaseStart.value = '';
    newLeaseEnd.value = '';
    if (fileInput) fileInput.value = '';

    // Refresh leases
    await fetchPersonLeases(selectedPerson.value.id);
  } catch (error: any) {
    console.error('Failed to create lease:', error);
    toast.add({ title: 'Error', description: error.data?.message || 'Failed to create lease', color: 'red' });
  } finally {
    leaseUploading.value = false;
  }
}

async function deleteLease(leaseId: number) {
  actionLoading.value = true;
  try {
    await leasesCollection.remove(leaseId);
    toast.add({ title: 'Lease Removed', description: 'Lease has been deleted.', color: 'green' });
    if (selectedPerson.value) {
      await fetchPersonLeases(selectedPerson.value.id);
    }
  } catch (error: any) {
    console.error('Failed to delete lease:', error);
    toast.add({ title: 'Error', description: error.data?.message || 'Failed to delete lease', color: 'red' });
  } finally {
    actionLoading.value = false;
  }
}

function getLeaseStatus(lease: any) {
  const now = new Date();
  const end = new Date(lease.finish);
  const start = new Date(lease.start);
  if (now > end) return { label: 'Expired', color: 'red' };
  if (now < start) return { label: 'Upcoming', color: 'blue' };
  return { label: 'Active', color: 'green' };
}

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getOccupantColor(occupant: string) {
  if (occupant === 'Owner') return 'blue';
  if (occupant === 'Tenant') return 'cyan';
  return 'gray';
}

// Initialize
onMounted(async () => {
  await Promise.all([fetchUnits(), fetchUsers()]);
});
</script>

<template>
  <div class="admin-page bg-white dark:bg-gray-900 min-h-full">
  <div class="container mx-auto px-6 py-8">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold">Unit Management</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-1">
          Manage units, assign users, and view occupancy details
        </p>
      </div>
      <div class="mt-4 md:mt-0">
        <Badge color="blue" variant="soft" size="lg">
          {{ units.length }} {{ units.length === 1 ? 'unit' : 'units' }}
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

    <!-- Unit Management -->
    <template v-else>
      <!-- Filters -->
      <div class="flex flex-col md:flex-row gap-4 mb-6">
        <Input
          v-model="searchQuery"
          icon="i-heroicons-magnifying-glass"
          placeholder="Search units, users, residents..."
          class="md:w-64" />
        <SelectMenu
          v-model="occupantFilter"
          :options="occupantOptions"
          value-attribute="value"
          option-attribute="label"
          class="md:w-48" />
      </div>

      <!-- Units Table -->
      <Card>
        <Table
          :rows="filteredUnits"
          :columns="columns"
          :loading="loading"
          :empty-state="{ icon: 'i-heroicons-home', label: 'No units found' }">
          <template #number-data="{ row }">
            <span class="font-semibold">Unit {{ row.number }}</span>
            <p v-if="row.parking_spot" class="text-xs text-gray-500">
              Parking: {{ row.parking_spot }}
            </p>
          </template>

          <template #occupant-data="{ row }">
            <Badge
              :color="getOccupantColor(row.occupant)"
              variant="soft"
              size="sm">
              {{ row.occupant || 'Unset' }}
            </Badge>
          </template>

          <template #people-data="{ row }">
            <div v-if="row.people && row.people.length > 0" class="space-y-0.5">
              <div
                v-for="person in row.people"
                :key="person.id"
                class="text-sm flex items-center gap-1.5">
                <span>{{ person.people_id?.first_name }} {{ person.people_id?.last_name }}</span>
                <span v-if="person.people_id?.category" class="text-xs text-gray-500">({{ person.people_id.category }})</span>
                <Icon
                  v-if="person.people_id?.leases?.length > 0"
                  name="i-heroicons-document-text"
                  class="w-3.5 h-3.5 text-primary-500"
                  title="Has lease on file" />
              </div>
            </div>
            <span v-else class="text-sm text-gray-400">None</span>
          </template>

          <template #assignedUsers-data="{ row }">
            <div v-if="row.assignedUsers && row.assignedUsers.length > 0" class="space-y-0.5">
              <p
                v-for="user in row.assignedUsers"
                :key="user.id"
                class="text-sm">
                {{ user.first_name }} {{ user.last_name }}
                <span class="text-xs text-gray-500">{{ user.email }}</span>
              </p>
            </div>
            <span v-else class="text-sm text-gray-400">No users assigned</span>
          </template>

          <template #vehicles-data="{ row }">
            <span class="text-sm">{{ row.vehicles?.length || 0 }}</span>
          </template>

          <template #pets-data="{ row }">
            <span class="text-sm">{{ row.pets?.length || 0 }}</span>
          </template>

          <template #actions-data="{ row }">
            <div class="flex items-center gap-2">
              <Button
                size="xs"
                color="primary"
                variant="soft"
                icon="i-heroicons-user-plus"
                @click="openAssignModal(row)">
                Assign
              </Button>
              <Button
                size="xs"
                color="gray"
                variant="ghost"
                icon="i-heroicons-eye"
                @click="openUnitDetail(row)">
                Details
              </Button>
            </div>
          </template>
        </Table>
      </Card>
    </template>

    <!-- Unit Detail Modal -->
    <Modal v-model="showUnitModal">
      <Card v-if="selectedUnit">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">Unit {{ selectedUnit.number }}</h3>
            <Button
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark"
              @click="showUnitModal = false" />
          </div>
        </template>

        <div class="space-y-6">
          <!-- Occupant Type -->
          <div>
            <label class="block text-sm font-medium mb-2">Occupant Type</label>
            <div class="flex gap-2">
              <Button
                size="sm"
                :color="selectedUnit.occupant === 'Owner' ? 'blue' : 'gray'"
                :variant="selectedUnit.occupant === 'Owner' ? 'solid' : 'soft'"
                :loading="actionLoading"
                @click="updateOccupantType(selectedUnit, 'Owner')">
                Owner
              </Button>
              <Button
                size="sm"
                :color="selectedUnit.occupant === 'Tenant' ? 'cyan' : 'gray'"
                :variant="selectedUnit.occupant === 'Tenant' ? 'solid' : 'soft'"
                :loading="actionLoading"
                @click="updateOccupantType(selectedUnit, 'Tenant')">
                Tenant
              </Button>
            </div>
          </div>

          <!-- Parking -->
          <div v-if="selectedUnit.parking_spot">
            <label class="block text-sm font-medium mb-1">Parking Spot</label>
            <p class="text-sm text-gray-600 dark:text-gray-400">{{ selectedUnit.parking_spot }}</p>
          </div>

          <!-- Assigned Users -->
          <div>
            <label class="block text-sm font-medium mb-2">Assigned Users</label>
            <div v-if="selectedUnit.assignedUsers?.length > 0" class="space-y-2">
              <div
                v-for="user in selectedUnit.assignedUsers"
                :key="user.id"
                class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <p class="font-medium text-sm">{{ user.first_name }} {{ user.last_name }}</p>
                  <p class="text-xs text-gray-500">{{ user.email }}</p>
                </div>
                <Button
                  size="xs"
                  color="red"
                  variant="soft"
                  icon="i-heroicons-x-mark"
                  :loading="actionLoading"
                  @click="unassignUser(user.junctionId)">
                  Remove
                </Button>
              </div>
            </div>
            <p v-else class="text-sm text-gray-400">No users assigned to this unit.</p>
          </div>

          <!-- Residents -->
          <div>
            <label class="block text-sm font-medium mb-2">Residents</label>
            <div v-if="selectedUnit.people?.length > 0" class="space-y-2">
              <div
                v-for="person in selectedUnit.people"
                :key="person.id"
                class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="font-medium text-sm">
                      {{ person.people_id?.first_name }} {{ person.people_id?.last_name }}
                    </p>
                    <div class="flex gap-4 text-xs text-gray-500 mt-1">
                      <span v-if="person.people_id?.category">{{ person.people_id.category }}</span>
                      <span v-if="person.people_id?.email">{{ person.people_id.email }}</span>
                      <span v-if="person.people_id?.phone">{{ person.people_id.phone }}</span>
                    </div>
                  </div>
                  <Button
                    v-if="person.people_id?.category === 'Tenant'"
                    size="xs"
                    color="primary"
                    variant="soft"
                    icon="i-heroicons-document-text"
                    @click="openLeaseModal(person.people_id)">
                    Leases
                  </Button>
                </div>
              </div>
            </div>
            <p v-else class="text-sm text-gray-400">No residents.</p>
          </div>

          <!-- Vehicles -->
          <div>
            <label class="block text-sm font-medium mb-2">Vehicles ({{ selectedUnit.vehicles?.length || 0 }})</label>
            <div v-if="selectedUnit.vehicles?.length > 0" class="space-y-2">
              <div
                v-for="v in selectedUnit.vehicles"
                :key="v.id"
                class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">
                <p class="font-medium">{{ v.year }} {{ v.make }} {{ v.model }}</p>
                <div class="flex gap-4 text-xs text-gray-500 mt-1">
                  <span v-if="v.color">{{ v.color }}</span>
                  <span v-if="v.license_plate">{{ v.state }} {{ v.license_plate }}</span>
                </div>
              </div>
            </div>
            <p v-else class="text-sm text-gray-400">No vehicles registered.</p>
          </div>

          <!-- Pets -->
          <div>
            <label class="block text-sm font-medium mb-2">Pets ({{ selectedUnit.pets?.length || 0 }})</label>
            <div v-if="selectedUnit.pets?.length > 0" class="space-y-2">
              <div
                v-for="pet in selectedUnit.pets"
                :key="pet.id"
                class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">
                <p class="font-medium">{{ pet.name }}</p>
                <div class="flex gap-4 text-xs text-gray-500 mt-1">
                  <span v-if="pet.category">{{ pet.category }}</span>
                  <span v-if="pet.breed">{{ pet.breed }}</span>
                </div>
              </div>
            </div>
            <p v-else class="text-sm text-gray-400">No pets registered.</p>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end">
            <Button color="gray" variant="ghost" @click="showUnitModal = false">
              Close
            </Button>
          </div>
        </template>
      </Card>
    </Modal>

    <!-- Assign User Modal -->
    <Modal v-model="showAssignModal">
      <Card v-if="selectedUnit">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">Assign User to Unit {{ selectedUnit.number }}</h3>
            <Button
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark"
              @click="showAssignModal = false" />
          </div>
        </template>

        <div class="space-y-4">
          <!-- Currently Assigned -->
          <div v-if="selectedUnit.assignedUsers?.length > 0">
            <label class="block text-sm font-medium mb-2">Currently Assigned</label>
            <div class="space-y-2">
              <div
                v-for="user in selectedUnit.assignedUsers"
                :key="user.id"
                class="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <span class="text-sm">{{ user.first_name }} {{ user.last_name }}</span>
                <Button
                  size="xs"
                  color="red"
                  variant="soft"
                  icon="i-heroicons-x-mark"
                  :loading="actionLoading"
                  @click="unassignUser(user.junctionId)">
                  Remove
                </Button>
              </div>
            </div>
          </div>

          <!-- Available Users -->
          <div>
            <label class="block text-sm font-medium mb-2">Available Users</label>
            <div v-if="availableUsers.length > 0" class="space-y-2 max-h-64 overflow-y-auto">
              <div
                v-for="user in availableUsers"
                :key="user.id"
                class="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded">
                <div>
                  <p class="text-sm font-medium">{{ user.first_name }} {{ user.last_name }}</p>
                  <p class="text-xs text-gray-500">{{ user.email }}</p>
                </div>
                <Button
                  size="xs"
                  color="green"
                  variant="soft"
                  icon="i-heroicons-plus"
                  :loading="actionLoading"
                  @click="assignUser(user.id)">
                  Assign
                </Button>
              </div>
            </div>
            <p v-else class="text-sm text-gray-400">All active users are already assigned to this unit.</p>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end">
            <Button color="gray" variant="ghost" @click="showAssignModal = false">
              Close
            </Button>
          </div>
        </template>
      </Card>
    </Modal>
    <!-- Lease Management Modal -->
    <Modal v-model="showLeaseModal">
      <Card v-if="selectedPerson">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">
              Leases &mdash; {{ selectedPerson.first_name }} {{ selectedPerson.last_name }}
            </h3>
            <Button
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark"
              @click="showLeaseModal = false" />
          </div>
        </template>

        <div class="space-y-6">
          <!-- Existing Leases -->
          <div>
            <label class="block text-sm font-medium mb-2">Lease History</label>
            <div v-if="leasesLoading" class="text-center py-4">
              <Icon name="i-heroicons-arrow-path" class="w-5 h-5 animate-spin text-gray-400" />
            </div>
            <div v-else-if="personLeases.length > 0" class="space-y-3">
              <div
                v-for="lease in personLeases"
                :key="lease.id"
                class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div class="flex items-center justify-between mb-2">
                  <Badge
                    :color="getLeaseStatus(lease).color"
                    variant="soft"
                    size="sm">
                    {{ getLeaseStatus(lease).label }}
                  </Badge>
                  <Button
                    size="xs"
                    color="red"
                    variant="soft"
                    icon="i-heroicons-trash"
                    :loading="actionLoading"
                    @click="deleteLease(lease.id)">
                    Delete
                  </Button>
                </div>
                <div class="text-sm space-y-1">
                  <p>
                    <span class="text-gray-500">Period:</span>
                    {{ formatDate(lease.start) }} &mdash; {{ formatDate(lease.finish) }}
                  </p>
                  <div v-if="lease.file" class="flex items-center gap-2">
                    <Icon name="i-heroicons-paper-clip" class="w-3.5 h-3.5 text-gray-400" />
                    <a
                      :href="`https://admin.1033lenox.com/assets/${typeof lease.file === 'object' ? lease.file.id : lease.file}`"
                      target="_blank"
                      class="text-sm text-primary-500 hover:underline">
                      {{ typeof lease.file === 'object' ? lease.file.filename_download : 'View PDF' }}
                    </a>
                  </div>
                  <p v-else class="text-xs text-gray-400">No document attached</p>
                </div>
              </div>
            </div>
            <p v-else class="text-sm text-gray-400">No leases on record.</p>
          </div>

          <!-- Add New Lease -->
          <div class="border-t pt-4">
            <label class="block text-sm font-medium mb-3">Add New Lease</label>
            <div class="space-y-3">
              <div class="grid grid-cols-2 gap-3">
                <FormGroup label="Start Date">
                  <Input
                    v-model="newLeaseStart"
                    type="date" />
                </FormGroup>
                <FormGroup label="End Date">
                  <Input
                    v-model="newLeaseEnd"
                    type="date" />
                </FormGroup>
              </div>
              <FormGroup label="Lease PDF (optional)">
                <input
                  ref="leaseFileInput"
                  type="file"
                  accept=".pdf"
                  class="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded file:border-0
                    file:text-sm file:font-semibold
                    file:bg-primary-50 file:text-primary-700
                    hover:file:bg-primary-100
                    dark:file:bg-primary-900 dark:file:text-primary-300" />
              </FormGroup>
              <Button
                color="primary"
                :loading="leaseUploading"
                :disabled="!newLeaseStart || !newLeaseEnd"
                @click="uploadLeaseWithPdf">
                <Icon name="i-heroicons-plus" class="w-4 h-4 mr-1" />
                Add Lease
              </Button>
            </div>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end">
            <Button color="gray" variant="ghost" @click="showLeaseModal = false">
              Close
            </Button>
          </div>
        </template>
      </Card>
    </Modal>
  </div>
  </div>
</template>
