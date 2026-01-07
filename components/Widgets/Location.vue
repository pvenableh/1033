<script setup lang="ts">
/**
 * LocationWidget - Displays proximity to key landmarks
 *
 * Shows walking distances to Whole Foods, Flamingo Park,
 * beach, and other Miami Beach highlights.
 *
 * Address: 1033 Lenox Ave, Miami Beach FL 33139
 */

interface Props {
	variant?: 'compact' | 'standard' | 'detailed' | 'narrow';
	animated?: boolean;
	/** Compact mode for mobile */
	compact?: boolean;
	/** Maximum number of locations to display in detailed/narrow views */
	maxLocations?: number;
}

const props = withDefaults(defineProps<Props>(), {
	variant: 'standard',
	animated: false,
	compact: false,
	maxLocations: 6,
});

// Static location data for 1033 Lenox Ave, Miami Beach FL 33139
const landmarks = [
	{
		name: 'Flamingo Park',
		distance: '0.1 mi',
		walkTime: '1 min',
		icon: 'i-heroicons-sun',
		category: 'recreation',
	},
	{
		name: 'Whole Foods',
		distance: '0.1 mi',
		walkTime: '1 min',
		icon: 'i-lucide-apple',
		category: 'grocery',
	},
	{
		name: 'The Beach',
		distance: '0.5 mi',
		walkTime: '6 min',
		icon: 'i-heroicons-sun',
		category: 'beach',
	},
	{
		name: 'Lincoln Road',
		distance: '0.6 mi',
		walkTime: '7 min',
		icon: 'i-heroicons-building-storefront',
		category: 'shopping',
	},
	{
		name: 'Ocean Drive',
		distance: '0.4 mi',
		walkTime: '5 min',
		icon: 'i-lucide-tree-palm',
		category: 'dining',
	},
	{
		name: 'The Bay',
		distance: '0.2 mi',
		walkTime: '2 min',
		icon: 'i-heroicons-sparkles',
		category: 'waterfront',
	},
];

// Neighborhood info
const address = '1033 Lenox Ave';
const neighborhood = 'Flamingo Park';
const city = 'Miami Beach';
const state = 'FL';
const zipCode = '33139';
const walkScore = 94;
const bikeScore = 89;

// Primary highlight for compact/standard
const primaryLandmark = landmarks[0]; // Flamingo Park
const secondaryLandmark = landmarks[1]; // Whole Foods

// Compute visible landmarks based on maxLocations
const visibleLandmarks = computed(() => landmarks.slice(0, props.maxLocations));

function getIcon(): string {
	return props.animated ? 'i-meteocons-clear-day-fill' : 'i-heroicons-map-pin';
}
</script>

<template>
	<div
		class="glass-widget flex-col text-cream uppercase"
		:class="[
			compact ? 'px-4 py-2' : 'px-4 py-2',
			{
				'gap-1': variant === 'compact' || variant === 'standard',
				'gap-2': variant === 'detailed' || variant === 'narrow',
			},
		]">
		<!-- Primary Stats Row -->
		<div
			class="relative uppercase tracking-wide flex items-center gap-1.5 text-cream"
			:class="compact ? 'text-[10px]' : 'text-[10px]'">
			<span class="font-semibold">{{ walkScore }}</span>
			<span class="text-cream">/</span>
			<span class="text-cream">Walk Score</span>
			<span
				class="glass-widget__icon rounded-full border border-cream/20 inline-flex items-center justify-center bg-cream/10 dark:bg-gray-700"
				:class="compact ? 'h-6 w-6 text-xs' : 'h-6 w-6 text-xs'">
				<Icon :name="getIcon()" />
			</span>
		</div>

		<!-- Standard variant -->
		<div v-if="variant === 'standard'" class="flex flex-col gap-0.5 text-[10px] text-cream uppercase">
			<span class="font-medium">{{ neighborhood }} neighborhood</span>
			<span class="text-cream/70">{{ primaryLandmark.walkTime }} to {{ primaryLandmark.name }}</span>
		</div>

		<!-- Narrow variant - single column layout for sidebar use -->
		<div v-if="variant === 'narrow' && !compact" class="flex flex-col gap-0.5 text-[10px] text-cream uppercase">
			<div v-for="landmark in visibleLandmarks" :key="landmark.name" class="flex items-center">
				<!-- <Icon :name="landmark.icon" class="glass-widget__detail-icon text-xs shrink-0" /> -->
				<span class="text-cream uppercase truncate">{{ landmark.name }}</span>
				<span class="ml-auto font-medium text-cream uppercase shrink-0">{{ landmark.walkTime }}</span>
			</div>
		</div>

		<!-- Detailed variant - two column layout (hide on compact mobile) -->
		<div v-if="variant === 'detailed' && !compact" class="grid grid-cols-2 gap-2 mt-2 pt-2">
			<div v-for="landmark in visibleLandmarks" :key="landmark.name" class="flex items-center gap-1.5 text-[11px]">
				<!-- <Icon :name="landmark.icon" class="glass-widget__detail-icon text-sm shrink-0" /> -->
				<span class="text-cream uppercase truncate">{{ landmark.name }}</span>
				<span class="ml-auto font-medium text-cream uppercase shrink-0">{{ landmark.walkTime }}</span>
			</div>

			<div class="col-span-2 flex items-center gap-4 mt-1 pt-2 border-t border-cream/10">
				<div class="flex items-center gap-1.5 text-[11px]">
					<Icon name="i-heroicons-map" class="glass-widget__detail-icon text-sm shrink-0" />
					<span class="text-cream uppercase">Walk Score</span>
					<span class="ml-1 font-medium text-cream uppercase">{{ walkScore }}</span>
				</div>
				<div class="flex items-center gap-1.5 text-[11px]">
					<Icon name="i-heroicons-truck" class="glass-widget__detail-icon text-sm shrink-0" />
					<span class="text-cream uppercase">Bike Score</span>
					<span class="ml-1 font-medium text-cream uppercase">{{ bikeScore }}</span>
				</div>
			</div>
		</div>
	</div>
</template>
