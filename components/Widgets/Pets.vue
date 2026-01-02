<script setup lang="ts">
/**
 * PetsWidget - Displays pet-friendly building information
 *
 * Shows pet count breakdown by type, signaling a welcoming
 * but not overcrowded pet environment.
 */

interface Props {
	variant?: 'compact' | 'standard' | 'detailed';
	animated?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	variant: 'standard',
	animated: false,
});

const petsCollection = useDirectusItems('pets', {requireAuth: false});
const unitsCollection = useDirectusItems('units', {requireAuth: false});

// Fetch all published pets
const pets = await petsCollection
	.list({
		fields: ['id', 'category', 'name'],
		filter: {
			status: {_eq: 'published'},
		},
		limit: -1,
	})
	.catch(() => []);

// Fetch units for ratio calculation
const units = await unitsCollection
	.list({
		fields: ['id'],
		filter: {
			status: {_eq: 'published'},
		},
		limit: -1,
	})
	.catch(() => []);

const hasData = computed(() => pets !== null);
const totalPets = computed(() => pets?.length ?? 0);
const totalUnits = computed(() => units?.length ?? 28);

// Count by category
const dogCount = computed(() => {
	if (!pets?.length) return 0;
	return pets.filter((p: any) => p.category === 'Dog').length;
});

const catCount = computed(() => {
	if (!pets?.length) return 0;
	return pets.filter((p: any) => p.category === 'Cat').length;
});

// Pet-to-unit ratio
const petRatio = computed(() => {
	if (!totalUnits.value) return 0;
	return Math.round((totalPets.value / totalUnits.value) * 100);
});

// Units with pets (approximate - assumes 1 pet per unit for simplicity)
const unitsWithPets = computed(() => {
	return Math.min(totalPets.value, totalUnits.value);
});

function getIcon(): string {
	return props.animated ? 'i-meteocons-clear-day-fill' : 'i-heroicons-heart';
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
			<span class="font-semibold">{{ totalPets }}</span>
			<span class="text-cream">/</span>
			<span class="text-cream">Registered Pets</span>
			<span
				class="glass-widget__icon h-8 w-8 rounded-full border border-cream/20 inline-flex items-center justify-center bg-cream/10 dark:bg-gray-700">
				<UIcon :name="getIcon()" />
			</span>
		</div>

		<!-- Standard variant -->
		<div v-if="variant !== 'compact'" class="flex flex-col gap-0.5 text-[10px] text-cream uppercase">
			<span class="font-medium">{{ dogCount }} dogs, {{ catCount }} cats</span>
			<span class="text-cream/70">Pet-friendly building</span>
		</div>

		<!-- Detailed variant -->
		<div
			v-if="variant === 'detailed'"
			class="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
			<div class="flex items-center gap-1.5 text-[11px]">
				<UIcon name="i-heroicons-heart" class="glass-widget__detail-icon text-sm shrink-0" />
				<span class="text-cream uppercase">Dogs</span>
				<span class="ml-auto font-medium text-cream uppercase">{{ dogCount }}</span>
			</div>

			<div class="flex items-center gap-1.5 text-[11px]">
				<UIcon name="i-heroicons-heart" class="glass-widget__detail-icon text-sm shrink-0" />
				<span class="text-cream uppercase">Cats</span>
				<span class="ml-auto font-medium text-cream uppercase">{{ catCount }}</span>
			</div>

			<div class="flex items-center gap-1.5 text-[11px]">
				<UIcon name="i-heroicons-home" class="glass-widget__detail-icon text-sm shrink-0" />
				<span class="text-cream uppercase">Pet Density</span>
				<span class="ml-auto font-medium text-cream uppercase">{{ petRatio }}%</span>
			</div>

			<div class="flex items-center gap-1.5 text-[11px]">
				<UIcon name="i-heroicons-check-badge" class="glass-widget__detail-icon text-sm shrink-0" />
				<span class="text-cream uppercase">Policy</span>
				<span class="ml-auto font-medium text-cream uppercase">Allowed</span>
			</div>
		</div>
	</div>

	<!-- Empty State (still show pet-friendly status) -->
	<div v-else class="glass-widget flex flex-col gap-1 px-8 py-4 text-cream uppercase">
		<div class="relative text-xs uppercase tracking-wide flex items-center gap-1.5 text-cream">
			<span class="font-semibold">Pet-Friendly</span>
			<span
				class="glass-widget__icon h-8 w-8 rounded-full border border-cream/20 inline-flex items-center justify-center bg-cream/10 dark:bg-gray-700">
				<UIcon :name="getIcon()" />
			</span>
		</div>
		<span class="text-[10px] text-cream/70">Dogs and cats welcome</span>
	</div>
</template>
