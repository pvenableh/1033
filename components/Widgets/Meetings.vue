<script setup lang="ts">
/**
 * MeetingsWidget - Displays board meeting frequency
 *
 * Shows meeting count and frequency to demonstrate
 * active board governance to prospective buyers.
 */

interface Props {
	variant?: 'compact' | 'standard' | 'detailed';
	animated?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	variant: 'standard',
	animated: false,
});

const meetingsCollection = useDirectusItems('meetings', {requireAuth: false});

// Fetch all published meetings
const meetings = await meetingsCollection
	.list({
		fields: ['id', 'date_created', 'status'],
		filter: {
			status: {_eq: 'published'},
		},
		sort: ['-date_created'],
		limit: -1,
	})
	.catch(() => []);

const hasData = computed(() => meetings !== null && meetings.length > 0);
const totalMeetings = computed(() => meetings?.length ?? 0);

// Get date range
const dateRange = computed(() => {
	if (!meetings?.length) return {start: new Date(), end: new Date()};
	const dates = meetings.map((m: any) => new Date(m.date_created)).sort((a, b) => a.getTime() - b.getTime());
	return {
		start: dates[0],
		end: dates[dates.length - 1],
	};
});

// Calculate total months
const totalMonths = computed(() => {
	const {start, end} = dateRange.value;
	const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
	return Math.max(1, months);
});

// Meetings per year average
const meetingsPerYear = computed(() => {
	if (!totalMeetings.value) return 0;
	const years = totalMonths.value / 12;
	return Math.round(totalMeetings.value / years);
});

// Meetings this year
const thisYearCount = computed(() => {
	if (!meetings?.length) return 0;
	const startOfYear = new Date(new Date().getFullYear(), 0, 1);
	return meetings.filter((m: any) => new Date(m.date_created) >= startOfYear).length;
});

// Format start date
const formattedStartDate = computed(() => {
	const {start} = dateRange.value;
	return start.toLocaleDateString('en-US', {month: 'short', year: 'numeric'});
});

function getIcon(): string {
	return props.animated ? 'i-meteocons-clear-day-fill' : 'i-heroicons-calendar-days';
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
			<span class="font-semibold">{{ meetingsPerYear }}</span>
			<span class="text-cream">/</span>
			<span class="text-cream">Board Meetings Yearly</span>
			<span
				class="glass-widget__icon h-8 w-8 rounded-full border border-cream/20 inline-flex items-center justify-center bg-cream/10 dark:bg-gray-700">
				<Icon :name="getIcon()" />
			</span>
		</div>

		<!-- Standard variant -->
		<div v-if="variant !== 'compact'" class="flex flex-col gap-0.5 text-[10px] text-cream uppercase">
			<span class="font-medium">{{ totalMeetings }} total since {{ formattedStartDate }}</span>
			<span class="text-cream/70">Active board governance</span>
		</div>

		<!-- Detailed variant -->
		<div
			v-if="variant === 'detailed'"
			class="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
			<div class="flex items-center gap-1.5 text-[11px]">
				<Icon name="i-heroicons-calendar" class="glass-widget__detail-icon text-sm shrink-0" />
				<span class="text-cream uppercase">This Year</span>
				<span class="ml-auto font-medium text-cream uppercase">{{ thisYearCount }}</span>
			</div>

			<div class="flex items-center gap-1.5 text-[11px]">
				<Icon name="i-heroicons-chart-bar" class="glass-widget__detail-icon text-sm shrink-0" />
				<span class="text-cream uppercase">Total</span>
				<span class="ml-auto font-medium text-cream uppercase">{{ totalMeetings }}</span>
			</div>

			<div class="flex items-center gap-1.5 text-[11px]">
				<Icon name="i-heroicons-clock" class="glass-widget__detail-icon text-sm shrink-0" />
				<span class="text-cream uppercase">Avg Per Year</span>
				<span class="ml-auto font-medium text-cream uppercase">{{ meetingsPerYear }}</span>
			</div>

			<div class="flex items-center gap-1.5 text-[11px]">
				<Icon name="i-heroicons-check-badge" class="glass-widget__detail-icon text-sm shrink-0" />
				<span class="text-cream uppercase">Governance</span>
				<span class="ml-auto font-medium text-cream uppercase">Active</span>
			</div>
		</div>
	</div>

	<!-- Error/Empty State -->
	<div v-else class="glass-widget flex flex-row items-center gap-2 text-cream uppercase px-8 py-4">
		<Icon name="i-heroicons-calendar-days" class="text-lg" />
		<span class="text-xs">Meeting data unavailable</span>
	</div>
</template>
