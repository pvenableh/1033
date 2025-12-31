<script setup lang="ts">
const toast = useToast();

// Fetch units with pets from server endpoint
const { data: unitsData, pending: unitsPending, refresh: refreshUnits } = useLazyFetch<{ units: any[] }>(
  '/api/directus/users/me/units',
  {
    server: false,
    default: () => ({ units: [] }),
  }
);

// Get all pets from user's units
const pets = computed(() => {
  const allPets: any[] = [];
  const units = unitsData.value?.units || [];

  for (const unit of units) {
    if (unit.units_id?.pets) {
      for (const pet of unit.units_id.pets) {
        allPets.push({
          ...pet,
          unit_number: unit.units_id.number,
          unit_id: unit.units_id.id,
        });
      }
    }
  }

  return allPets;
});

// Get first unit ID for creating new pets
const defaultUnitId = computed(() => {
  const units = unitsData.value?.units || [];
  return units[0]?.units_id?.id || null;
});

// Modal state
const showModal = ref(false);
const isEditing = ref(false);
const loading = ref(false);

const emptyPet = {
  id: null as number | null,
  name: '',
  category: 'Dog',
  breed: '',
  weight: '',
  image: null as string | null,
  unit_id: null as number | null,
};

const editingPet = ref({ ...emptyPet });

const petCategories = ['Dog', 'Cat', 'Bird', 'Fish', 'Other'];

function openAddModal() {
  editingPet.value = { ...emptyPet, unit_id: defaultUnitId.value };
  isEditing.value = false;
  showModal.value = true;
}

function openEditModal(pet: any) {
  editingPet.value = {
    id: pet.id,
    name: pet.name || '',
    category: pet.category || 'Dog',
    breed: pet.breed || '',
    weight: pet.weight || '',
    image: pet.image || null,
    unit_id: pet.unit_id,
  };
  isEditing.value = true;
  showModal.value = true;
}

async function savePet() {
  loading.value = true;

  try {
    const petData = {
      name: editingPet.value.name,
      category: editingPet.value.category,
      breed: editingPet.value.breed,
      weight: editingPet.value.weight,
      unit_id: editingPet.value.unit_id,
    };

    if (isEditing.value && editingPet.value.id) {
      // Update existing pet via server endpoint
      await $fetch(`/api/directus/pets/${editingPet.value.id}`, {
        method: 'PATCH',
        body: petData,
      });

      toast.add({
        title: 'Pet Updated',
        description: `${editingPet.value.name || 'Pet'} has been updated and is pending approval.`,
        color: 'green',
      });
    } else {
      // Create new pet via server endpoint
      await $fetch('/api/directus/pets', {
        method: 'POST',
        body: petData,
      });

      toast.add({
        title: 'Pet Added',
        description: `${editingPet.value.name || 'Pet'} has been added and is pending approval.`,
        color: 'green',
      });
    }

    showModal.value = false;
    // Refresh data
    await refreshUnits();
  } catch (error: any) {
    console.error('Error saving pet:', error);
    toast.add({
      title: 'Error',
      description: error.data?.message || error.data?.errors?.[0]?.message || 'Failed to save pet',
      color: 'red',
    });
  } finally {
    loading.value = false;
  }
}

async function deletePet(pet: any) {
  if (!confirm(`Are you sure you want to remove ${pet.name || 'this pet'}?`)) {
    return;
  }

  loading.value = true;

  try {
    await $fetch(`/api/directus/pets/${pet.id}`, {
      method: 'DELETE',
    });

    toast.add({
      title: 'Pet Removed',
      description: `${pet.name || 'Pet'} has been removed.`,
      color: 'green',
    });

    await refreshUnits();
  } catch (error: any) {
    console.error('Error deleting pet:', error);
    toast.add({
      title: 'Error',
      description: error.data?.message || error.data?.errors?.[0]?.message || 'Failed to remove pet',
      color: 'red',
    });
  } finally {
    loading.value = false;
  }
}

function getPetIcon(category: string) {
  switch (category?.toLowerCase()) {
    case 'dog':
      return 'i-heroicons-face-smile';
    case 'cat':
      return 'i-heroicons-face-smile';
    case 'bird':
      return 'i-heroicons-sparkles';
    case 'fish':
      return 'i-heroicons-sparkles';
    default:
      return 'i-heroicons-heart';
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'published':
      return { color: 'green' as const, label: 'Approved' };
    case 'draft':
      return { color: 'yellow' as const, label: 'Pending Approval' };
    default:
      return { color: 'gray' as const, label: status };
  }
}
</script>

<template>
  <div class="w-full">
    <div class="flex items-center justify-between mb-6">
      <h2 class="!mt-0 !mb-0">My Pets</h2>
      <UButton
        v-if="defaultUnitId"
        icon="i-heroicons-plus"
        size="sm"
        @click="openAddModal">
        Add Pet
      </UButton>
    </div>

    <div v-if="unitsPending" class="text-center py-8 text-gray-500">
      <UIcon name="i-heroicons-arrow-path" class="w-12 h-12 mx-auto mb-4 opacity-50 animate-spin" />
      <p>Loading pets...</p>
    </div>

    <div v-else-if="pets.length === 0" class="text-center py-8 text-gray-500">
      <UIcon name="i-heroicons-heart" class="w-12 h-12 mx-auto mb-4 opacity-50" />
      <p>No pets registered yet.</p>
      <UButton
        v-if="defaultUnitId"
        variant="soft"
        class="mt-4"
        @click="openAddModal">
        Add Your First Pet
      </UButton>
    </div>

    <div v-else class="grid gap-4 md:grid-cols-2">
      <UCard v-for="pet in pets" :key="pet.id" class="relative">
        <div class="flex items-start gap-4">
          <div class="flex-shrink-0">
            <NuxtImg
              v-if="pet.image"
              :src="pet.image"
              provider="directus"
              width="80"
              height="80"
              class="w-20 h-20 rounded-lg object-cover" />
            <div v-else class="w-20 h-20 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <UIcon :name="getPetIcon(pet.category)" class="w-8 h-8 text-gray-400" />
            </div>
          </div>

          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <h3 class="font-semibold">{{ pet.name || 'Unnamed Pet' }}</h3>
              <UBadge
                :color="getStatusBadge(pet.status).color"
                variant="soft"
                size="xs">
                {{ getStatusBadge(pet.status).label }}
              </UBadge>
            </div>
            <p class="text-sm text-gray-500">{{ pet.category }} {{ pet.breed ? `- ${pet.breed}` : '' }}</p>
            <p v-if="pet.weight" class="text-xs text-gray-400">{{ pet.weight }}</p>
            <p class="text-xs text-gray-400 mt-1">Unit {{ pet.unit_number }}</p>
          </div>

          <UDropdown
            :items="[
              [
                { label: 'Edit', icon: 'i-heroicons-pencil', click: () => openEditModal(pet) },
                { label: 'Remove', icon: 'i-heroicons-trash', click: () => deletePet(pet) },
              ],
            ]">
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-ellipsis-vertical"
              size="xs" />
          </UDropdown>
        </div>
      </UCard>
    </div>

    <!-- Add/Edit Modal -->
    <UModal v-model="showModal">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="font-semibold">{{ isEditing ? 'Edit Pet' : 'Add Pet' }}</h3>
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark"
              @click="showModal = false" />
          </div>
        </template>

        <div class="space-y-4">
          <UFormGroup label="Name">
            <UInput v-model="editingPet.name" placeholder="Pet's name" />
          </UFormGroup>

          <UFormGroup label="Category">
            <USelectMenu v-model="editingPet.category" :options="petCategories" />
          </UFormGroup>

          <UFormGroup label="Breed">
            <UInput v-model="editingPet.breed" placeholder="e.g., Golden Retriever" />
          </UFormGroup>

          <UFormGroup label="Weight">
            <UInput v-model="editingPet.weight" placeholder="e.g., 25 lbs" />
          </UFormGroup>
        </div>

        <template #footer>
          <div class="flex flex-col gap-3">
            <p class="text-xs text-gray-500">
              New pets and updates require admin approval before they appear as approved.
            </p>
            <div class="flex justify-end gap-3">
              <UButton color="gray" variant="ghost" @click="showModal = false">
                Cancel
              </UButton>
              <UButton :loading="loading" @click="savePet">
                {{ isEditing ? 'Save Changes' : 'Add Pet' }}
              </UButton>
            </div>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>
