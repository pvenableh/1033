<script setup lang="ts">
/**
 * AnnouncementsWidget - Displays total announcements count since March 2023
 *
 * Fetches announcement data from Directus and displays a compact overview
 * with optional variants for different display contexts.
 */

interface Props {
	variant?: 'compact' | 'standard' | 'detailed';
	showSinceDate?: boolean;
	animated?: boolean;
	/** Compact mode for mobile */
	compact?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	variant: 'compact',
	showSinceDate: true,
	animated: false,
	compact: false,
});

// Directus items composable
const announcementsCollection = useDirectusItems('announcements', {requireAuth: false});

// Fetch all sent announcements since March 2023
const announcements = await announcementsCollection
	.list({
		fields: ['id', 'date_sent', 'status'],
		filter: {
			status: {_eq: 'sent'},
			date_sent: {_gte: '2023-03-01'},
		},
		sort: ['date_sent'],
		limit: -1,
	})
	.catch(() => []);

const hasData = computed(() => announcements !== null && announcements.length > 0);
const totalCount = computed(() => announcements?.length ?? 0);

// Get the actual date range from the data
const dateRange = computed(() => {
	if (!announcements?.length) return {start: new Date('2023-03-01'), end: new Date()};
	const dates = announcements.map((a: any) => new Date(a.date_sent)).sort((a, b) => a.getTime() - b.getTime());
	return {
		start: dates[0],
		end: dates[dates.length - 1],
	};
});

// Calculate total months in the data range
const totalMonths = computed(() => {
	const {start, end} = dateRange.value;
	const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
	return Math.max(1, months);
});

// Calculate average per month (with one decimal)
const avgPerMonth = computed(() => {
	if (!announcements?.length) return 0;
	return Math.round((totalCount.value / totalMonths.value) * 10) / 10;
});

// Calculate announcements this month
const thisMonthCount = computed(() => {
	if (!announcements?.length) return 0;
	const now = new Date();
	const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
	return announcements.filter((a: any) => new Date(a.date_sent) >= startOfMonth).length;
});

// Calculate announcements this year
const thisYearCount = computed(() => {
	if (!announcements?.length) return 0;
	const startOfYear = new Date(new Date().getFullYear(), 0, 1);
	return announcements.filter((a: any) => new Date(a.date_sent) >= startOfYear).length;
});

// Calculate last 3 months average for trend comparison
const recentAvg = computed(() => {
	if (!announcements?.length) return 0;
	const now = new Date();
	const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
	const recentAnnouncements = announcements.filter((a: any) => new Date(a.date_sent) >= threeMonthsAgo);
	return Math.round((recentAnnouncements.length / 3) * 10) / 10;
});

// Trend indicator: comparing recent 3-month avg to overall avg
const trend = computed(() => {
	if (recentAvg.value > avgPerMonth.value * 1.1) return 'up';
	if (recentAvg.value < avgPerMonth.value * 0.9) return 'down';
	return 'stable';
});

// Format the start date for display
const formattedStartDate = computed(() => {
	const {start} = dateRange.value;
	return start.toLocaleDateString('en-US', {month: 'short', year: 'numeric'});
});

/**
 * Returns the appropriate icon based on the animated prop
 */
function getIcon(): string {
	return props.animated ? 'i-meteocons-wind-fill' : 'i-heroicons-megaphone';
}

function getTrendIcon(): string {
	if (trend.value === 'up') return 'i-heroicons-arrow-trending-up';
	if (trend.value === 'down') return 'i-heroicons-arrow-trending-down';
	return 'i-heroicons-minus';
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
			<span class="font-semibold">{{ totalCount }}</span>
			<span class="text-cream">/</span>
			<span class="text-cream">Announcements</span>
			<span
				class="glass-widget__icon rounded-full border border-cream/20 inline-flex items-center justify-center bg-cream/10 dark:bg-gray-700"
				:class="compact ? 'h-6 w-6 text-xs' : 'h-8 w-8'">
				<Icon :name="getIcon()" />
			</span>
		</div>

		<!-- Standard variant: adds since date and average -->
		<div v-if="variant !== 'compact'" class="flex flex-col gap-0.5 text-[10px] text-cream uppercase">
			<span v-if="showSinceDate" class="font-medium">Since {{ formattedStartDate }}</span>
			<span class="text-cream/70">{{ avgPerMonth }} avg/mo</span>
		</div>

		<!-- Detailed variant: adds breakdown (hide on compact mobile) -->
		<div
			v-if="variant === 'detailed' && !compact"
			class="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
			<div class="flex items-center gap-1.5 text-[11px]">
				<Icon name="i-heroicons-calendar" class="glass-widget__detail-icon text-sm shrink-0" />
				<span class="text-cream uppercase">This Month</span>
				<span class="ml-auto font-medium text-cream uppercase">{{ thisMonthCount }}</span>
			</div>

			<div class="flex items-center gap-1.5 text-[11px]">
				<Icon name="i-heroicons-calendar-days" class="glass-widget__detail-icon text-sm shrink-0" />
				<span class="text-cream uppercase">This Year</span>
				<span class="ml-auto font-medium text-cream uppercase">{{ thisYearCount }}</span>
			</div>

			<div class="flex items-center gap-1.5 text-[11px]">
				<Icon name="i-heroicons-chart-bar" class="glass-widget__detail-icon text-sm shrink-0" />
				<span class="text-cream uppercase">Monthly Avg</span>
				<span class="ml-auto font-medium text-cream uppercase">{{ avgPerMonth }}</span>
			</div>

			<div class="flex items-center gap-1.5 text-[11px]">
				<Icon name="i-heroicons-clock" class="glass-widget__detail-icon text-sm shrink-0" />
				<span class="text-cream uppercase">Over</span>
				<span class="ml-auto font-medium text-cream uppercase">{{ totalMonths }} months</span>
			</div>

			<div class="flex items-center gap-1.5 text-[11px]">
				<Icon name="i-heroicons-arrow-path" class="glass-widget__detail-icon text-sm shrink-0" />
				<span class="text-cream uppercase">Recent Avg (3mo)</span>
				<span class="ml-auto font-medium text-cream uppercase">{{ recentAvg }}</span>
			</div>

			<div class="flex items-center gap-1.5 text-[11px]">
				<Icon :name="getTrendIcon()" class="glass-widget__detail-icon text-sm shrink-0" />
				<span class="text-cream uppercase">Trend</span>
				<span class="ml-auto font-medium text-cream uppercase capitalize">{{ trend }}</span>
			</div>
		</div>
	</div>

	<!-- Error State -->
	<div
		v-else
		class="glass-widget flex-row items-center gap-2 text-cream uppercase"
		:class="compact ? 'px-4 py-2' : 'px-8 py-4'">
		<Icon name="i-heroicons-exclamation-triangle" class="text-lg" />
		<span class="text-xs">Announcements unavailable</span>
	</div>
</template>
