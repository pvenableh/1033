<script setup lang="ts">
/**
 * LocationWidget - Displays proximity to key landmarks
 *
 * Shows walking distances to Whole Foods, Flamingo Park,
 * beach, and other Miami Beach highlights.
 */

interface Props {
	variant?: 'compact' | 'standard' | 'detailed';
	animated?: boolean;
	/** Compact mode for mobile */
	compact?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	variant: 'standard',
	animated: false,
	compact: false,
});

// Static location data for 1033 Lenox Ave, Miami Beach
const landmarks = [
	{
		name: 'Flamingo Park',
		distance: '0.1 mi',
		walkTime: '2 min',
		icon: 'i-heroicons-sun',
		category: 'recreation',
	},
	{
		name: 'Whole Foods',
		distance: '0.2 mi',
		walkTime: '4 min',
		icon: 'i-heroicons-shopping-bag',
		category: 'grocery',
	},
	{
		name: 'Beach',
		distance: '0.5 mi',
		walkTime: '10 min',
		icon: 'i-heroicons-sun',
		category: 'beach',
	},
	{
		name: 'Lincoln Road',
		distance: '0.6 mi',
		walkTime: '12 min',
		icon: 'i-heroicons-building-storefront',
		category: 'shopping',
	},
	{
		name: 'Sunset Harbour',
		distance: '0.4 mi',
		walkTime: '8 min',
		icon: 'i-heroicons-cake',
		category: 'dining',
	},
	{
		name: 'Miami Beach Golf Club',
		distance: '0.3 mi',
		walkTime: '6 min',
		icon: 'i-heroicons-flag',
		category: 'recreation',
	},
];

// Neighborhood info
const neighborhood = 'Flamingo Park';
const zipCode = '33139';
const walkScore = 94;
const bikeScore = 89;

// Primary highlight for compact/standard
const primaryLandmark = landmarks[0]; // Flamingo Park
const secondaryLandmark = landmarks[1]; // Whole Foods

function getIcon(): string {
	return props.animated ? 'i-meteocons-clear-day-fill' : 'i-heroicons-map-pin';
}
</script>

<template>
	<div
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
			<span class="font-semibold">{{ walkScore }}</span>
			<span class="text-cream">/</span>
			<span class="text-cream">Walk Score</span>
			<span
				class="glass-widget__icon rounded-full border border-cream/20 inline-flex items-center justify-center bg-cream/10 dark:bg-gray-700"
				:class="compact ? 'h-6 w-6 text-xs' : 'h-8 w-8'">
				<UIcon :name="getIcon()" />
			</span>
		</div>

		<!-- Standard variant -->
		<div v-if="variant !== 'compact'" class="flex flex-col gap-0.5 text-[10px] text-cream uppercase">
			<span class="font-medium">{{ neighborhood }} neighborhood</span>
			<span class="text-cream/70">{{ primaryLandmark.walkTime }} to {{ primaryLandmark.name }}</span>
		</div>

		<!-- Detailed variant (hide on compact mobile) -->
		<div
			v-if="variant === 'detailed' && !compact"
			class="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
			<div v-for="landmark in landmarks" :key="landmark.name" class="flex items-center gap-1.5 text-[11px]">
				<UIcon :name="landmark.icon" class="glass-widget__detail-icon text-sm shrink-0" />
				<span class="text-cream uppercase truncate">{{ landmark.name }}</span>
				<span class="ml-auto font-medium text-cream uppercase shrink-0">{{ landmark.walkTime }}</span>
			</div>

			<div class="col-span-2 flex items-center gap-4 mt-1 pt-2 border-t border-cream/10">
				<div class="flex items-center gap-1.5 text-[11px]">
					<UIcon name="i-heroicons-map" class="glass-widget__detail-icon text-sm shrink-0" />
					<span class="text-cream uppercase">Walk Score</span>
					<span class="ml-1 font-medium text-cream uppercase">{{ walkScore }}</span>
				</div>
				<div class="flex items-center gap-1.5 text-[11px]">
					<UIcon name="i-heroicons-truck" class="glass-widget__detail-icon text-sm shrink-0" />
					<span class="text-cream uppercase">Bike Score</span>
					<span class="ml-1 font-medium text-cream uppercase">{{ bikeScore }}</span>
				</div>
			</div>
		</div>
	</div>
</template>
