<script setup lang="ts">
const toast = useToast();

// Fetch units with vehicles from server endpoint
const {
	data: unitsData,
	pending: unitsPending,
	refresh: refreshUnits,
	error: fetchError,
} = useLazyFetch<{units: any[]}>('/api/directus/users/me/units', {
	server: false,
	default: () => ({units: []}),
});

// Get error message for display
const errorMessage = computed(() => {
	if (!fetchError.value) return null;
	return fetchError.value.data?.message || fetchError.value.message || 'Failed to load vehicles';
});

// Get all vehicles from user's units
const vehicles = computed(() => {
	const allVehicles: any[] = [];
	const units = unitsData.value?.units || [];

	for (const unit of units) {
		if (unit.units_id?.vehicles) {
			for (const vehicle of unit.units_id.vehicles) {
				allVehicles.push({
					...vehicle,
					unit_number: unit.units_id.number,
					unit_id: unit.units_id.id,
				});
			}
		}
	}

	return allVehicles;
});

// Get first unit ID for creating new vehicles
const defaultUnitId = computed(() => {
	const units = unitsData.value?.units || [];
	return units[0]?.units_id?.id || null;
});

// Modal state
const showModal = ref(false);
const isEditing = ref(false);
const loading = ref(false);

const emptyVehicle = {
	id: null as number | null,
	make: '',
	model: '',
	year: '',
	image: null as string | null,
	color: '',
	license_plate: '',
	state: '',
	unit_id: null as number | null,
};

const editingVehicle = ref({...emptyVehicle});

const commonColors = ['Black', 'White', 'Silver', 'Gray', 'Red', 'Blue', 'Green', 'Brown', 'Beige', 'Other'];

function openAddModal() {
	editingVehicle.value = {...emptyVehicle, unit_id: defaultUnitId.value};
	isEditing.value = false;
	showModal.value = true;
}

function openEditModal(vehicle: any) {
	editingVehicle.value = {
		id: vehicle.id,
		make: vehicle.make || '',
		model: vehicle.model || '',
		year: vehicle.year || '',
		color: vehicle.color || '',
		license_plate: vehicle.license_plate || '',
		state: vehicle.state || '',
		unit_id: vehicle.unit_id,
	};
	isEditing.value = true;
	showModal.value = true;
}

async function saveVehicle() {
	loading.value = true;

	try {
		const vehicleData = {
			make: editingVehicle.value.make,
			model: editingVehicle.value.model,
			year: editingVehicle.value.year,
			color: editingVehicle.value.color,
			license_plate: editingVehicle.value.license_plate,
			state: editingVehicle.value.state,
			unit_id: editingVehicle.value.unit_id,
		};

		if (isEditing.value && editingVehicle.value.id) {
			// Update existing vehicle via server endpoint
			await $fetch(`/api/directus/vehicles/${editingVehicle.value.id}`, {
				method: 'PATCH',
				body: vehicleData,
			});

			toast.add({
				title: 'Vehicle Updated',
				description: `${editingVehicle.value.make} ${editingVehicle.value.model} has been updated and is pending approval.`,
				color: 'green',
			});
		} else {
			// Create new vehicle via server endpoint
			await $fetch('/api/directus/vehicles', {
				method: 'POST',
				body: vehicleData,
			});

			toast.add({
				title: 'Vehicle Added',
				description: `${editingVehicle.value.make} ${editingVehicle.value.model} has been added and is pending approval.`,
				color: 'green',
			});
		}

		showModal.value = false;
		// Refresh data
		await refreshUnits();
	} catch (error: any) {
		console.error('Error saving vehicle:', error);
		toast.add({
			title: 'Error',
			description: error.data?.message || error.data?.errors?.[0]?.message || 'Failed to save vehicle',
			color: 'red',
		});
	} finally {
		loading.value = false;
	}
}

async function deleteVehicle(vehicle: any) {
	if (!confirm(`Are you sure you want to remove the ${vehicle.make} ${vehicle.model}?`)) {
		return;
	}

	loading.value = true;

	try {
		await $fetch(`/api/directus/vehicles/${vehicle.id}`, {
			method: 'DELETE',
		});

		toast.add({
			title: 'Vehicle Removed',
			description: `${vehicle.make || ''} ${vehicle.model || 'Vehicle'} has been removed.`,
			color: 'green',
		});

		await refreshUnits();
	} catch (error: any) {
		console.error('Error deleting vehicle:', error);
		toast.add({
			title: 'Error',
			description: error.data?.message || error.data?.errors?.[0]?.message || 'Failed to remove vehicle',
			color: 'red',
		});
	} finally {
		loading.value = false;
	}
}

function getStatusBadge(status: string) {
	switch (status) {
		case 'published':
			return {color: 'green' as const, label: 'Approved'};
		case 'draft':
			return {color: 'yellow' as const, label: 'Pending Approval'};
		default:
			return {color: 'gray' as const, label: status};
	}
}
</script>

<template>
	<div class="w-full">
		<div class="flex items-center justify-between mb-6">
			<h2 class="!mt-0 !mb-0">My Vehicles</h2>
			<Button v-if="defaultUnitId" icon="i-heroicons-plus" size="sm" @click="openAddModal">Add Vehicle</UButton>
		</div>

		<div v-if="unitsPending" class="text-center py-8 text-gray-500">
			<Icon name="i-heroicons-arrow-path" class="w-12 h-12 mx-auto mb-4 opacity-50 animate-spin" />
			<p>Loading vehicles...</p>
		</div>

		<div v-else-if="errorMessage" class="text-center py-8">
			<Icon name="i-heroicons-exclamation-triangle" class="w-12 h-12 mx-auto mb-4 text-red-400" />
			<p class="text-red-600 mb-2">{{ errorMessage }}</p>
			<Button variant="soft" size="sm" @click="refreshUnits()">Try Again</UButton>
		</div>

		<div v-else-if="vehicles.length === 0" class="text-center py-8 text-gray-500">
			<Icon name="i-heroicons-truck" class="w-12 h-12 mx-auto mb-4 opacity-50" />
			<p>No vehicles registered yet.</p>
			<Button v-if="defaultUnitId" variant="soft" class="mt-4" @click="openAddModal">Add Your First Vehicle</UButton>
		</div>

		<div v-else class="grid gap-4 md:grid-cols-2">
			<Card v-for="vehicle in vehicles" :key="vehicle.id" class="relative">
				<div class="flex items-start gap-4">
					<div class="flex-shrink-0">
						<div class="w-16 h-16 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
							<img
								v-if="vehicle.image"
								:src="'https://admin.1033lenox.com/assets/' + vehicle.image + '?key=small'"
								alt="Vehicle Image"
								class="w-full h-full object-cover" />
							<Icon v-else name="i-lucide-car" class="w-8 h-8 text-gray-400" />
						</div>
					</div>

					<div class="flex-1 min-w-0">
						<div class="flex items-center gap-2 mb-1">
							<h3 class="font-semibold">{{ vehicle.year }} {{ vehicle.make }} {{ vehicle.model }}</h3>
							<Badge :color="getStatusBadge(vehicle.status).color" variant="soft" size="xs">
								{{ getStatusBadge(vehicle.status).label }}
							</UBadge>
						</div>
						<p v-if="vehicle.color" class="text-sm text-gray-500">{{ vehicle.color }}</p>
						<p v-if="vehicle.license_plate" class="text-sm font-mono text-gray-600 dark:text-gray-400">
							{{ vehicle.license_plate }}
							<span v-if="vehicle.state" class="text-gray-400">({{ vehicle.state }})</span>
						</p>
						<p class="text-xs text-gray-400 mt-1">Unit {{ vehicle.unit_number }}</p>
					</div>

					<UDropdown
						:items="[
							[
								{label: 'Edit', icon: 'i-heroicons-pencil', click: () => openEditModal(vehicle)},
								{label: 'Remove', icon: 'i-heroicons-trash', click: () => deleteVehicle(vehicle)},
							],
						]">
						<Button color="gray" variant="ghost" icon="i-heroicons-ellipsis-vertical" size="xs" />
					</UDropdown>
				</div>
			</UCard>
		</div>

		<!-- Add/Edit Modal -->
		<UModal v-model="showModal">
			<Card>
				<template #header>
					<div class="flex items-center justify-between">
						<h3 class="font-semibold">{{ isEditing ? 'Edit Vehicle' : 'Add Vehicle' }}</h3>
						<Button color="gray" variant="ghost" icon="i-heroicons-x-mark" @click="showModal = false" />
					</div>
				</template>

				<div class="space-y-4">
					<div class="grid grid-cols-2 gap-4">
						<FormGroup label="Make">
							<Input v-model="editingVehicle.make" placeholder="e.g., Toyota" />
						</UFormGroup>

						<FormGroup label="Model">
							<Input v-model="editingVehicle.model" placeholder="e.g., Camry" />
						</UFormGroup>
					</div>

					<div class="grid grid-cols-2 gap-4">
						<FormGroup label="Year">
							<Input v-model="editingVehicle.year" placeholder="e.g., 2022" />
						</UFormGroup>

						<FormGroup label="Color">
							<USelectMenu v-model="editingVehicle.color" :options="commonColors" placeholder="Select color" />
						</UFormGroup>
					</div>

					<div class="grid grid-cols-2 gap-4">
						<FormGroup label="License Plate">
							<Input v-model="editingVehicle.license_plate" placeholder="ABC-1234" />
						</UFormGroup>

						<FormGroup label="State">
							<Input v-model="editingVehicle.state" placeholder="GA" maxlength="2" />
						</UFormGroup>
					</div>
				</div>

				<template #footer>
					<div class="flex flex-col gap-3">
						<p class="text-xs text-gray-500">
							New vehicles and updates require admin approval before they appear as approved.
						</p>
						<div class="flex justify-end gap-3">
							<Button color="gray" variant="ghost" @click="showModal = false">Cancel</UButton>
							<Button :loading="loading" @click="saveVehicle">
								{{ isEditing ? 'Save Changes' : 'Add Vehicle' }}
							</UButton>
						</div>
					</div>
				</template>
			</UCard>
		</UModal>
	</div>
</template>
