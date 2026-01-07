<script setup lang="ts">
/**
 * ParkingWidget - Displays parking information
 *
 * Shows parking spots, vehicle count, and 1:1 ratio
 * which is a major selling point in Miami Beach.
 */

interface Props {
	variant?: 'compact' | 'standard' | 'detailed';
	animated?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	variant: 'standard',
	animated: false,
});

const unitsCollection = useDirectusItems('units', {requireAuth: false});
const vehiclesCollection = useDirectusItems('vehicles', {requireAuth: false});

// Fetch units with parking info
const units = await unitsCollection
	.list({
		fields: ['id', 'parking_spot'],
		filter: {
			status: {_eq: 'published'},
		},
		limit: -1,
	})
	.catch(() => []);

// Fetch registered vehicles
const vehicles = await vehiclesCollection
	.list({
		fields: ['id', 'category'],
		filter: {
			status: {_eq: 'published'},
		},
		limit: -1,
	})
	.catch(() => []);

const hasData = computed(() => units !== null && units.length > 0);

// Total units
const totalUnits = computed(() => units?.length ?? 28);

// Parking spots (count units with parking_spot assigned)
const totalSpots = computed(() => {
	if (!units?.length) return 28;
	return units.filter((u: any) => u.parking_spot).length;
});

// Total registered vehicles
const totalVehicles = computed(() => vehicles?.length ?? 0);

// Vehicle breakdown by category
const carCount = computed(() => {
	if (!vehicles?.length) return 0;
	return vehicles.filter((v: any) => v.category === 'Car' || !v.category).length;
});

const motorcycleCount = computed(() => {
	if (!vehicles?.length) return 0;
	return vehicles.filter((v: any) => v.category === 'Motorcycle' || v.category === 'Scooter').length;
});

// Parking ratio (spots per unit)
const parkingRatio = computed(() => {
	if (!totalUnits.value) return '1:1';
	const ratio = totalSpots.value / totalUnits.value;
	if (ratio >= 1) return '1:1';
	return `${Math.round(ratio * 10) / 10}:1`;
});

// Parking type
const parkingType = computed(() => 'Covered');

// Parking is secured
const isSecured = computed(() => true);

function getIcon(): string {
	return props.animated ? 'i-meteocons-clear-day-fill' : 'i-heroicons-truck';
}
</script>

<template>
	<div
		v-if="hasData"
		class="glass-widget flex flex-col px-8 py-4 text-cream uppercase"
		:class="{
			'gap-0': variant === 'compact',
			'gap-1': variant === 'standard',
			'gap-2 p-3': variant === 'detailed',
		}">
		<!-- Primary Stats Row -->
		<div class="relative text-xs uppercase tracking-wide flex items-center gap-1.5 text-cream">
			<span class="font-semibold">{{ totalSpots }}</span>
			<span class="text-cream">/</span>
			<span class="text-cream">Parking Spots</span>
			<span
				class="glass-widget__icon h-8 w-8 rounded-full border border-cream/20 inline-flex items-center justify-center bg-cream/10 dark:bg-gray-700">
				<Icon :name="getIcon()" />
			</span>
		</div>

		<!-- Standard variant -->
		<div v-if="variant !== 'compact'" class="flex flex-col gap-0.5 text-[10px] text-cream uppercase">
			<span class="font-medium">{{ parkingRatio }} ratio per unit</span>
			<span class="text-cream/70">Covered & secured</span>
		</div>

		<!-- Detailed variant -->
		<div
			v-if="variant === 'detailed'"
			class="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
			<div class="flex items-center gap-1.5 text-[11px]">
				<Icon name="i-heroicons-home" class="glass-widget__detail-icon text-sm shrink-0" />
				<span class="text-cream uppercase">Total Units</span>
				<span class="ml-auto font-medium text-cream uppercase">{{ totalUnits }}</span>
			</div>

			<div class="flex items-center gap-1.5 text-[11px]">
				<Icon name="i-heroicons-truck" class="glass-widget__detail-icon text-sm shrink-0" />
				<span class="text-cream uppercase">Total Spots</span>
				<span class="ml-auto font-medium text-cream uppercase">{{ totalSpots }}</span>
			</div>

			<div class="flex items-center gap-1.5 text-[11px]">
				<Icon name="i-heroicons-chart-pie" class="glass-widget__detail-icon text-sm shrink-0" />
				<span class="text-cream uppercase">Ratio</span>
				<span class="ml-auto font-medium text-cream uppercase">{{ parkingRatio }}</span>
			</div>

			<div class="flex items-center gap-1.5 text-[11px]">
				<Icon name="i-heroicons-shield-check" class="glass-widget__detail-icon text-sm shrink-0" />
				<span class="text-cream uppercase">Type</span>
				<span class="ml-auto font-medium text-cream uppercase">{{ parkingType }}</span>
			</div>

			<div class="flex items-center gap-1.5 text-[11px]">
				<Icon name="i-heroicons-key" class="glass-widget__detail-icon text-sm shrink-0" />
				<span class="text-cream uppercase">Registered</span>
				<span class="ml-auto font-medium text-cream uppercase">{{ totalVehicles }} vehicles</span>
			</div>

			<div class="flex items-center gap-1.5 text-[11px]">
				<Icon name="i-heroicons-lock-closed" class="glass-widget__detail-icon text-sm shrink-0" />
				<span class="text-cream uppercase">Security</span>
				<span class="ml-auto font-medium text-cream uppercase">{{ isSecured ? 'Gated' : 'Open' }}</span>
			</div>
		</div>
	</div>

	<!-- Empty State -->
	<div v-else class="glass-widget flex flex-row items-center gap-2 text-cream uppercase px-8 py-4">
		<Icon name="i-heroicons-truck" class="text-lg" />
		<span class="text-xs">Parking info unavailable</span>
	</div>
</template>
