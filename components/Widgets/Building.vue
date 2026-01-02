<script setup lang="ts">
/**
 * BuildingWidget - Displays building overview with units and projects
 *
 * Shows total units, owner-occupied count, and active projects
 * from Directus data. Projects section hidden when count is 0.
 * Includes buyer-focused stats like parking ratio and pet count.
 */

interface Props {
	variant?: 'compact' | 'standard' | 'detailed';
	showProjects?: boolean;
	animated?: boolean;
	/** Compact mode for mobile */
	compact?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	variant: 'compact',
	showProjects: true,
	animated: false,
	compact: false,
});

// Directus items composables
const unitsCollection = useDirectusItems('units', {requireAuth: false});
const projectsCollection = useDirectusItems('projects', {requireAuth: false});
const petsCollection = useDirectusItems('pets', {requireAuth: false});

// Fetch all units with parking info
const units = await unitsCollection
	.list({
		fields: ['id', 'number', 'occupant', 'parking_spot'],
		filter: {
			status: {_eq: 'published'},
		},
		limit: -1,
	})
	.catch(() => []);

// Fetch active projects
const projects = await projectsCollection
	.list({
		fields: ['id', 'name', 'status'],
		filter: {
			status: {_in: ['published', 'active', 'in_progress']},
		},
		limit: -1,
	})
	.catch(() => []);

// Fetch pets count
const pets = await petsCollection
	.list({
		fields: ['id'],
		filter: {
			status: {_eq: 'published'},
		},
		limit: -1,
	})
	.catch(() => []);

const hasData = computed(() => units !== null && units.length > 0);

// Total units (should be 28)
const totalUnits = computed(() => units?.length ?? 28);

// Owner-occupied units
const ownerOccupied = computed(() => {
	if (!units?.length) return 0;
	return units.filter((u: any) => u.occupant === 'Owner').length;
});

// Tenant-occupied units
const tenantOccupied = computed(() => {
	if (!units?.length) return 0;
	return units.filter((u: any) => u.occupant === 'Tenant').length;
});

// Owner occupancy percentage
const ownerPercentage = computed(() => {
	if (!totalUnits.value) return 0;
	return Math.round((ownerOccupied.value / totalUnits.value) * 100);
});

// Active projects count
const projectCount = computed(() => projects?.length ?? 0);

// Pets count
const petsCount = computed(() => pets?.length ?? 0);

// Parking spots (1:1 ratio with units)
const parkingSpots = computed(() => {
	if (!units?.length) return 28;
	return units.filter((u: any) => u.parking_spot).length;
});

// Floors (derived from unit numbers: 2xx = floor 2, 3xx = floor 3)
const floors = computed(() => {
	if (!units?.length) return 2;
	const floorNumbers = new Set(units.map((u: any) => Math.floor(parseInt(u.number) / 100)));
	return floorNumbers.size;
});

// Units per floor
const unitsPerFloor = computed(() => {
	if (!totalUnits.value || !floors.value) return 14;
	return Math.round(totalUnits.value / floors.value);
});

// Show projects section only if there are projects and prop allows
const showProjectsSection = computed(() => props.showProjects && projectCount.value > 0);

/**
 * Returns the appropriate icon based on type and animated prop
 */
function getIcon(type: string): string {
	if (props.animated) {
		const animatedMap: Record<string, string> = {
			building: 'i-meteocons-clear-day-fill',
			owner: 'i-heroicons-user-circle',
			tenant: 'i-heroicons-users',
			project: 'i-heroicons-wrench-screwdriver',
			unit: 'i-heroicons-home',
			percentage: 'i-heroicons-chart-pie',
			parking: 'i-heroicons-truck',
			pets: 'i-heroicons-heart',
			floors: 'i-heroicons-building-office',
		};
		return animatedMap[type] || 'i-heroicons-building-office-2';
	}

	const staticMap: Record<string, string> = {
		building: 'i-heroicons-building-office-2',
		owner: 'i-heroicons-user-circle',
		tenant: 'i-heroicons-users',
		project: 'i-heroicons-wrench-screwdriver',
		unit: 'i-heroicons-home',
		percentage: 'i-heroicons-chart-pie',
		parking: 'i-heroicons-truck',
		pets: 'i-heroicons-heart',
		floors: 'i-heroicons-building-office',
	};
	return staticMap[type] || 'i-heroicons-building-office-2';
}
</script>

<template>
	<div
		v-if="hasData"
		class="glass-widget flex-col text-cream uppercase"
		:class="[
			compact ? 'px-4 py-2' : 'px-6 py-3',
			{
				'gap-0': variant === 'compact',
				'gap-1': variant === 'standard',
				'gap-2': variant === 'detailed',
			},
		]">
		<!-- Primary Stats Row -->
		<div
			class="relative uppercase tracking-wide flex items-center gap-1.5 text-cream"
			:class="compact ? 'text-[10px]' : 'text-xs'">
			<span class="font-semibold">{{ totalUnits }}</span>
			<span class="text-cream">/</span>
			<span class="text-cream">Units</span>
			<span
				class="glass-widget__icon rounded-full border border-cream/20 inline-flex items-center justify-center bg-cream/10 dark:bg-gray-700"
				:class="compact ? 'h-6 w-6 text-xs' : 'h-8 w-8'">
				<UIcon :name="getIcon('building')" />
			</span>
		</div>

		<!-- Standard variant: adds owner occupied -->
		<div v-if="variant !== 'compact'" class="flex flex-col gap-0.5 text-[10px] text-cream uppercase">
			<span class="font-medium">{{ ownerOccupied }} Owner-Occupied</span>
			<span class="text-cream/70">{{ ownerPercentage }}% ownership</span>
		</div>

		<!-- Projects indicator (only if projects exist, hide on compact mobile) -->
		<div
			v-if="variant !== 'compact' && showProjectsSection && !compact"
			class="flex items-center gap-1.5 text-[10px] text-cream/80 mt-1 pt-1 border-t border-cream/10">
			<UIcon :name="getIcon('project')" class="glass-widget__detail-icon text-sm" />
			<span>{{ projectCount }} Active Project{{ projectCount !== 1 ? 's' : '' }}</span>
		</div>

		<!-- Detailed variant: adds all building data (hide on compact mobile) -->
		<div
			v-if="variant === 'detailed' && !compact"
			class="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
			<div class="flex items-center gap-1.5 text-[11px]">
				<UIcon :name="getIcon('owner')" class="glass-widget__detail-icon text-sm shrink-0" />
				<span class="text-cream uppercase">Owner-Occupied</span>
				<span class="ml-auto font-medium text-cream uppercase">{{ ownerOccupied }}</span>
			</div>

			<div class="flex items-center gap-1.5 text-[11px]">
				<UIcon :name="getIcon('tenant')" class="glass-widget__detail-icon text-sm shrink-0" />
				<span class="text-cream uppercase">Tenant-Occupied</span>
				<span class="ml-auto font-medium text-cream uppercase">{{ tenantOccupied }}</span>
			</div>

			<div class="flex items-center gap-1.5 text-[11px]">
				<UIcon :name="getIcon('floors')" class="glass-widget__detail-icon text-sm shrink-0" />
				<span class="text-cream uppercase">Residential Floors</span>
				<span class="ml-auto font-medium text-cream uppercase">{{ floors }}</span>
			</div>

			<div class="flex items-center gap-1.5 text-[11px]">
				<UIcon :name="getIcon('unit')" class="glass-widget__detail-icon text-sm shrink-0" />
				<span class="text-cream uppercase">Units Per Floor</span>
				<span class="ml-auto font-medium text-cream uppercase">{{ unitsPerFloor }}</span>
			</div>

			<div class="flex items-center gap-1.5 text-[11px]">
				<UIcon :name="getIcon('parking')" class="glass-widget__detail-icon text-sm shrink-0" />
				<span class="text-cream uppercase">Parking Spots</span>
				<span class="ml-auto font-medium text-cream uppercase">{{ parkingSpots }} (1:1)</span>
			</div>

			<div class="flex items-center gap-1.5 text-[11px]">
				<UIcon :name="getIcon('pets')" class="glass-widget__detail-icon text-sm shrink-0" />
				<span class="text-cream uppercase">Registered Pets</span>
				<span class="ml-auto font-medium text-cream uppercase">{{ petsCount }}</span>
			</div>

			<div v-if="showProjectsSection" class="col-span-2 flex items-center gap-1.5 text-[11px]">
				<UIcon :name="getIcon('project')" class="glass-widget__detail-icon text-sm shrink-0" />
				<span class="text-cream uppercase">Active Projects</span>
				<span class="ml-auto font-medium text-cream uppercase">{{ projectCount }}</span>
			</div>
		</div>
	</div>

	<!-- Error State -->
	<div
		v-else
		class="glass-widget flex-row items-center gap-2 text-cream uppercase"
		:class="compact ? 'px-4 py-2' : 'px-8 py-4'">
		<UIcon name="i-heroicons-exclamation-triangle" class="text-lg" />
		<span class="text-xs">Building data unavailable</span>
	</div>
</template>
