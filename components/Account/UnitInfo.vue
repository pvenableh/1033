<script setup lang="ts">
// Fetch units from server endpoint
const {
	data: unitsData,
	pending,
	refresh,
	error,
} = useLazyFetch<{units: any[]}>('/api/directus/users/me/units', {
	server: false,
	default: () => ({units: []}),
});

const units = computed(() => {
	return unitsData.value?.units?.map((u: any) => u.units_id) || [];
});

// Get error message for display
const errorMessage = computed(() => {
	if (!error.value) return null;
	return error.value.data?.message || error.value.message || 'Failed to load unit information';
});

// Expose refresh for parent components to use
defineExpose({refresh});
</script>

<template>
	<div class="w-full">
		<h2 class="mb-6">My Unit</h2>

		<div v-if="pending" class="text-center py-8 text-gray-500">
			<Icon name="i-heroicons-arrow-path" class="w-12 h-12 mx-auto mb-4 opacity-50 animate-spin" />
			<p>Loading unit information...</p>
		</div>

		<div v-else-if="errorMessage" class="text-center py-8">
			<Icon name="i-heroicons-exclamation-triangle" class="w-12 h-12 mx-auto mb-4 text-red-400" />
			<p class="text-red-600 mb-2">{{ errorMessage }}</p>
			<Button variant="soft" size="sm" @click="refresh()">Try Again</Button>
		</div>

		<div v-else-if="units.length === 0" class="text-center py-8 text-gray-500">
			<Icon name="i-heroicons-home" class="w-12 h-12 mx-auto mb-4 opacity-50" />
			<p>No units assigned to your account.</p>
			<p class="text-sm">Contact an administrator if this is incorrect.</p>
		</div>

		<div v-else class="space-y-6">
			<Card v-for="unit in units" :key="unit.id">
				<template #header>
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-3">
							<Icon name="i-heroicons-home" class="w-6 h-6 text-primary" />
							<div>
								<h3 class="font-bold text-lg">Unit {{ unit.number }}</h3>
								<p class="text-sm text-gray-500">{{ unit.occupant }}</p>
							</div>
						</div>
						<Badge v-if="unit.parking_spot" color="gray" variant="soft">Parking: {{ unit.parking_spot }}</Badge>
					</div>
				</template>

				<div class="grid grid-cols-2 gap-4">
					<div>
						<h4 class="text-xs uppercase tracking-wide text-gray-500 mb-2">Residents</h4>
						<div v-if="unit.people?.length" class="space-y-2">
							<div v-for="person in unit.people" :key="person.people_id?.id" class="flex items-center gap-2">
								<Avatar size="xs" :alt="person.people_id?.first_name" />
								<span class="text-sm">{{ person.people_id?.first_name }} {{ person.people_id?.last_name }}</span>
							</div>
						</div>
						<p v-else class="text-sm text-gray-400">No residents listed</p>
					</div>

					<div>
						<h4 class="text-xs uppercase tracking-wide text-gray-500 mb-2">Summary</h4>
						<div class="space-y-1 text-sm">
							<p>
								<span class="text-gray-500">Pets:</span>
								{{ unit.pets?.length || 0 }}
							</p>
							<p>
								<span class="text-gray-500">Vehicles:</span>
								{{ unit.vehicles?.length || 0 }}
							</p>
						</div>
					</div>
				</div>
			</Card>
		</div>
	</div>
</template>
