<script setup lang="ts">
import type {DirectusUser} from '~/types/directus';

const props = defineProps<{
	user: DirectusUser;
}>();

const {linkedPerson} = useRoles();

// Get lease info for the tenant
const activeLease = computed(() => {
	const person = linkedPerson.value as any;
	if (person?.leases) {
		const now = new Date();
		return person.leases.find((lease: any) => {
			const start = new Date(lease.start);
			const finish = new Date(lease.finish);
			return start <= now && finish >= now;
		});
	}
	return null;
});

// Calculate days until lease expires
const daysUntilLeaseExpires = computed(() => {
	if (activeLease.value?.finish) {
		const finish = new Date(activeLease.value.finish);
		const now = new Date();
		const diffTime = finish.getTime() - now.getTime();
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		return diffDays;
	}
	return null;
});

// Get unit info from user
const userUnits = computed(() => {
	const extUser = props.user as any;
	return extUser?.units || [];
});
</script>

<template>
	<div class="grid grid-flow-row-dense grid-cols-2 gap-x-4 gap-y-12 lg:gap-y-20 lg:gap-x-10 dashboard">
		<div class="col-span-2 mt-8">
			<h2 class="text-3xl">
				{{ greetUser() }}
				<span class="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-600 font-bold">
					{{ user.first_name }}.
				</span>
			</h2>
			<p class="text-sm opacity-75 mt-2 uppercase tracking-wide">Tenant Dashboard</p>
		</div>

		<!-- Lease Status Card -->
		<div class="col-span-2 lg:col-span-1 insight">
			<h1 class="insight__label mb-4">Lease Status</h1>
			<div v-if="activeLease" class="lease-status">
				<div class="mb-4">
					<span
						class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
						<Icon name="i-heroicons-check-circle" class="mr-1" />
						Active Lease
					</span>
				</div>
				<div class="grid grid-cols-2 gap-4 mb-4">
					<div>
						<p class="text-xs uppercase tracking-wide opacity-50">Start Date</p>
						<p class="font-bold">{{ getFriendlyDateTwo(activeLease.start) }}</p>
					</div>
					<div>
						<p class="text-xs uppercase tracking-wide opacity-50">End Date</p>
						<p class="font-bold">{{ getFriendlyDateTwo(activeLease.finish) }}</p>
					</div>
				</div>
				<div v-if="daysUntilLeaseExpires !== null" class="mb-4">
					<p class="text-xs uppercase tracking-wide opacity-50">Time Remaining</p>
					<p
						class="font-bold"
						:class="daysUntilLeaseExpires <= 30 ? 'text-orange-500' : daysUntilLeaseExpires <= 7 ? 'text-red-500' : ''">
						{{ daysUntilLeaseExpires }} days
						<span v-if="daysUntilLeaseExpires <= 30" class="text-xs font-normal opacity-75">
							- Contact your landlord about renewal
						</span>
					</p>
				</div>
				<a
					v-if="activeLease.file"
					:href="'https://admin.1033lenox.com/assets/' + activeLease.file"
					class="insight__link text-sm"
					target="_blank">
					View Lease Document
					<Icon name="i-heroicons-arrow-right" />
				</a>
			</div>
			<div v-else class="text-center py-8">
				<Icon name="i-heroicons-document-text" class="text-4xl opacity-25 mb-2" />
				<p class="text-sm text-red-500 font-bold uppercase tracking-wide">No Active Lease Found</p>
				<p class="text-xs opacity-75 mt-1">Please contact your landlord or property manager.</p>
			</div>
		</div>

		<!-- Unit Information -->
		<div class="col-span-2 lg:col-span-1 insight">
			<h1 class="insight__label mb-4">Your Unit</h1>
			<div v-if="userUnits.length" class="space-y-4">
				<div
					v-for="(unit, index) in userUnits"
					:key="index"
					class="unit-card p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
					<div class="flex items-center justify-between mb-3">
						<h3 class="text-2xl font-bold">Unit {{ unit.units_id?.number || 'N/A' }}</h3>
						<span class="text-xs uppercase tracking-wide px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">
							{{ unit.units_id?.occupant || 'N/A' }}-occupied
						</span>
					</div>
					<div v-if="unit.units_id?.parking_spot" class="mb-2">
						<p class="text-xs uppercase tracking-wide opacity-50">Parking Spot</p>
						<p class="font-medium">{{ unit.units_id.parking_spot }}</p>
					</div>
				</div>
			</div>
			<div v-else class="text-center py-8">
				<Icon name="i-heroicons-home" class="text-4xl opacity-25 mb-2" />
				<p class="text-sm opacity-75">No unit information available.</p>
			</div>
		</div>

		<!-- Registered Vehicles -->
		<div class="col-span-2 lg:col-span-1 insight">
			<h1 class="insight__label mb-4">Your Vehicles</h1>
			<div v-if="userUnits.length && userUnits.some((u) => u.units_id?.vehicles?.length)">
				<div v-for="(unit, index) in userUnits" :key="index">
					<div
						v-for="(vehicle, vIndex) in unit.units_id?.vehicles || []"
						:key="vIndex"
						class="mb-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
						<div class="flex items-center gap-3">
							<Icon name="i-heroicons-truck" class="text-2xl opacity-50" />
							<div>
								<p class="font-bold uppercase tracking-wide text-sm">
									{{ vehicle.year }} {{ vehicle.make }} {{ vehicle.model }}
								</p>
								<p class="text-xs opacity-75">
									<span v-if="vehicle.color">{{ vehicle.color }} &bull;</span>
									<span v-if="vehicle.license_plate">{{ vehicle.license_plate }}</span>
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div v-else class="text-center py-8">
				<Icon name="i-heroicons-truck" class="text-4xl opacity-25 mb-2" />
				<p class="text-sm opacity-75">No vehicles registered.</p>
				<nuxt-link to="/account" class="insight__link text-sm mt-3 inline-block">
					Register Vehicle
					<Icon name="i-heroicons-arrow-right" />
				</nuxt-link>
			</div>
		</div>

		<!-- Registered Pets -->
		<div class="col-span-2 lg:col-span-1 insight">
			<h1 class="insight__label mb-4">Your Pets</h1>
			<div v-if="userUnits.length && userUnits.some((u) => u.units_id?.pets?.length)">
				<div v-for="(unit, index) in userUnits" :key="index">
					<div
						v-for="(pet, pIndex) in unit.units_id?.pets || []"
						:key="pIndex"
						class="mb-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
						<div class="flex items-center gap-3">
							<Icon name="i-heroicons-heart" class="text-2xl opacity-50" />
							<div>
								<p class="font-bold uppercase tracking-wide text-sm">{{ pet.name }}</p>
								<p class="text-xs opacity-75">
									{{ pet.species || 'Pet' }}
									<span v-if="pet.breed">&bull; {{ pet.breed }}</span>
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div v-else class="text-center py-8">
				<Icon name="i-heroicons-heart" class="text-4xl opacity-25 mb-2" />
				<p class="text-sm opacity-75">No pets registered.</p>
				<nuxt-link to="/account" class="insight__link text-sm mt-3 inline-block">
					Register Pet
					<Icon name="i-heroicons-arrow-right" />
				</nuxt-link>
			</div>
		</div>

		<!-- Announcements -->
		<InsightsAnnouncements class="col-span-2 lg:col-span-1" />

		<!-- Newsletter -->
		<InsightsNewsletter class="col-span-2 lg:col-span-1" />

		<!-- Board of Directors -->
		<InsightsBoard class="col-span-2" />

		<!-- Help Section -->
		<div class="col-span-2 insight">
			<h1 class="insight__label mb-4">Need Help?</h1>
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
					<h3 class="uppercase tracking-wide text-sm font-bold mb-2">Building Management</h3>
					<p class="text-sm opacity-75">Contact for building-related issues.</p>
				</div>
				<div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
					<h3 class="uppercase tracking-wide text-sm font-bold mb-2">Your Landlord</h3>
					<p class="text-sm opacity-75">Contact for lease and unit issues.</p>
				</div>
				<div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
					<h3 class="uppercase tracking-wide text-sm font-bold mb-2">Submit a Request</h3>
					<nuxt-link to="/requests" class="insight__link text-sm">
						Submit Request
						<Icon name="i-heroicons-arrow-right" />
					</nuxt-link>
				</div>
			</div>
		</div>
	</div>
</template>

<style scoped>
@reference "~/assets/css/tailwind.css";
.lease-status {
	@apply p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg;
}
</style>
