<script setup lang="ts">
/**
 * BuildingWidget - Displays building overview with units and projects
 *
 * Shows total units, owner-occupied count, and active projects
 * from Directus data. Projects section hidden when count is 0.
 */

interface Props {
	variant?: 'compact' | 'standard' | 'detailed';
	showProjects?: boolean;
	animated?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	variant: 'compact',
	showProjects: true,
	animated: false,
});

// Directus items composables
const unitsCollection = useDirectusItems('units', {requireAuth: false});
const projectsCollection = useDirectusItems('projects', {requireAuth: false});

// Fetch all units
const units = await unitsCollection
	.list({
		fields: ['id', 'number', 'occupant'],
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
	};
	return staticMap[type] || 'i-heroicons-building-office-2';
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
			<span class="font-semibold">{{ totalUnits }}</span>
			<span class="text-cream">/</span>
			<span class="text-cream">Units</span>
			<span
				class="glass-widget__icon h-8 w-8 rounded-full border border-cream/20 inline-flex items-center justify-center bg-cream/10 dark:bg-gray-700">
				<Icon :name="getIcon('building')" />
			</span>
		</div>

		<!-- Standard variant: adds owner occupied -->
		<div v-if="variant !== 'compact'" class="flex flex-col gap-0.5 text-[10px] text-cream uppercase">
			<span class="font-medium">{{ ownerOccupied }} Owner-Occupied</span>
			<span class="text-cream/70">{{ ownerPercentage }}% ownership</span>
		</div>

		<!-- Projects indicator (only if projects exist) -->
		<div
			v-if="variant !== 'compact' && showProjectsSection"
			class="flex items-center gap-1.5 text-[10px] text-cream/80 mt-1 pt-1 border-t border-cream/10">
			<Icon :name="getIcon('project')" class="glass-widget__detail-icon text-sm" />
			<span>{{ projectCount }} Active Project{{ projectCount !== 1 ? 's' : '' }}</span>
		</div>

		<!-- Detailed variant: adds all building data -->
		<div
			v-if="variant === 'detailed'"
			class="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
			<div class="flex items-center gap-1.5 text-[11px]">
				<Icon :name="getIcon('unit')" class="glass-widget__detail-icon text-sm shrink-0" />
				<span class="text-cream uppercase">Total Units</span>
				<span class="ml-auto font-medium text-cream uppercase">{{ totalUnits }}</span>
			</div>

			<div class="flex items-center gap-1.5 text-[11px]">
				<Icon :name="getIcon('owner')" class="glass-widget__detail-icon text-sm shrink-0" />
				<span class="text-cream uppercase">Owner-Occupied</span>
				<span class="ml-auto font-medium text-cream uppercase">{{ ownerOccupied }}</span>
			</div>

			<div class="flex items-center gap-1.5 text-[11px]">
				<Icon :name="getIcon('tenant')" class="glass-widget__detail-icon text-sm shrink-0" />
				<span class="text-cream uppercase">Tenant-Occupied</span>
				<span class="ml-auto font-medium text-cream uppercase">{{ tenantOccupied }}</span>
			</div>

			<div class="flex items-center gap-1.5 text-[11px]">
				<Icon :name="getIcon('percentage')" class="glass-widget__detail-icon text-sm shrink-0" />
				<span class="text-cream uppercase">Owner %</span>
				<span class="ml-auto font-medium text-cream uppercase">{{ ownerPercentage }}%</span>
			</div>

			<div v-if="showProjectsSection" class="col-span-2 flex items-center gap-1.5 text-[11px]">
				<Icon :name="getIcon('project')" class="glass-widget__detail-icon text-sm shrink-0" />
				<span class="text-cream uppercase">Active Projects</span>
				<span class="ml-auto font-medium text-cream uppercase">{{ projectCount }}</span>
			</div>
		</div>
	</div>

	<!-- Error State -->
	<div v-else class="glass-widget flex flex-row items-center gap-2 text-cream uppercase px-8 py-4">
		<Icon name="i-heroicons-exclamation-triangle" class="text-lg" />
		<span class="text-xs">Building data unavailable</span>
	</div>
</template>
