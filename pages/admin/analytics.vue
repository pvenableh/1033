<script setup lang="ts">
import {Line, Bar, Doughnut} from 'vue-chartjs';
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	BarElement,
	ArcElement,
	Title,
	Tooltip,
	Legend,
	Filler,
} from 'chart.js';
import {Progress} from '~/components/ui/progress';
import {ChartContainer, type ChartConfig} from '~/components/ui/chart';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

// Theme colors (matching CSS variables)
const themeColors = {
	primary: 'hsl(166, 100%, 47%)',
	primaryHex: '#00F0B5',
	chart1: 'hsl(166, 100%, 47%)',
	chart2: 'hsl(173, 58%, 39%)',
	chart3: 'hsl(197, 37%, 24%)',
	chart4: 'hsl(43, 74%, 66%)',
	chart5: 'hsl(27, 87%, 67%)',
	// Hex equivalents for Chart.js
	chart1Hex: '#00F0B5',
	chart2Hex: '#2A9D8F',
	chart3Hex: '#264653',
	chart4Hex: '#E9C46A',
	chart5Hex: '#F4A261',
	turquoise: '#00efd1',
	gold: '#C9A96E',
};

// Chart configuration for ChartContainer
const chartConfig: ChartConfig = {
	pageViews: {
		label: 'Page Views',
		color: themeColors.chart1Hex,
	},
	desktop: {
		label: 'Desktop',
		color: themeColors.chart1Hex,
	},
	mobile: {
		label: 'Mobile',
		color: themeColors.chart2Hex,
	},
	tablet: {
		label: 'Tablet',
		color: themeColors.chart4Hex,
	},
};

definePageMeta({
	layout: 'default',
	middleware: ['auth', 'role'],
});

useSeoMeta({
	title: 'Analytics Dashboard - Admin',
	description: 'View site analytics, user engagement, and tracking metrics',
});

const {isAdmin} = useRoles();

const canAccessAnalytics = computed(() => isAdmin.value);

// Date range filter
const dateRange = ref('7d');
const dateRangeOptions = [
	{label: 'Last 7 days', value: '7d'},
	{label: 'Last 30 days', value: '30d'},
	{label: 'Last 90 days', value: '90d'},
	{label: 'Year to date', value: 'ytd'},
];

// Loading states
const analyticsLoading = ref(true);
const ga4Configured = ref<boolean | null>(null); // null = unknown, true = configured, false = not configured

// GA4 data refs
const overviewData = ref<any>(null);
const pageViewsData = ref<any>(null);
const topPagesData = ref<any[]>([]);
const devicesData = ref<any>(null);
const trafficSourcesData = ref<any[]>([]);
const engagementData = ref<any>(null);
const eventsData = ref<any>(null);
const realtimeData = ref<any>(null);

// Check if GA4 needs configuration
const needsConfiguration = computed(() => ga4Configured.value === false);

// Overview metrics computed from API data
const overviewMetrics = computed(() => {
	const notConfiguredValue = needsConfiguration.value ? 'Not configured' : '-';
	if (!overviewData.value?.metrics) {
		return [
			{ label: 'Total Page Views', value: notConfiguredValue, change: '', changeType: 'neutral', icon: 'i-heroicons-eye' },
			{ label: 'Unique Visitors', value: notConfiguredValue, change: '', changeType: 'neutral', icon: 'i-heroicons-users' },
			{ label: 'Avg. Session Duration', value: notConfiguredValue, change: '', changeType: 'neutral', icon: 'i-heroicons-clock' },
			{ label: 'Bounce Rate', value: notConfiguredValue, change: '', changeType: 'neutral', icon: 'i-heroicons-arrow-uturn-left' },
		];
	}
	return overviewData.value.metrics;
});

// Page views chart data - from API
const pageViewsChartData = computed(() => {
	if (!pageViewsData.value?.chart) {
		return {
			labels: [],
			datasets: [{
				label: 'Page Views',
				data: [],
				borderColor: themeColors.chart1Hex,
				backgroundColor: 'rgba(0, 240, 181, 0.1)',
				fill: true,
				tension: 0.4,
			}],
		};
	}
	// API returns chart.datasets.pageViews array
	const chartData = pageViewsData.value.chart.datasets?.pageViews || pageViewsData.value.chart.data || [];
	return {
		labels: pageViewsData.value.chart.labels,
		datasets: [{
			label: 'Page Views',
			data: chartData,
			borderColor: themeColors.chart1Hex,
			backgroundColor: 'rgba(0, 240, 181, 0.1)',
			fill: true,
			tension: 0.4,
		}],
	};
});

const pageViewsChartOptions = {
	responsive: true,
	maintainAspectRatio: false,
	plugins: {
		legend: {
			display: false,
		},
	},
	scales: {
		y: {
			beginAtZero: true,
			grid: {
				color: 'rgba(0, 0, 0, 0.05)',
			},
		},
		x: {
			grid: {
				display: false,
			},
		},
	},
};

// Top pages data - from API
const topPages = computed(() => {
	if (!topPagesData.value?.length) {
		return [];
	}
	return topPagesData.value;
});

// Scroll depth data - from engagement API
const scrollDepthData = computed(() => {
	const defaultData = [0, 0, 0, 0, 0];
	const data = engagementData.value?.scrollDepth?.data || defaultData;
	return {
		labels: ['25%', '50%', '75%', '90%', '100%'],
		datasets: [{
			label: 'Users Reached',
			data,
			backgroundColor: [
				themeColors.chart1Hex,
				themeColors.chart2Hex,
				themeColors.chart4Hex,
				themeColors.chart5Hex,
				themeColors.chart3Hex,
			],
			borderWidth: 0,
		}],
	};
});

const scrollDepthOptions = {
	responsive: true,
	maintainAspectRatio: false,
	indexAxis: 'y' as const,
	plugins: {
		legend: {
			display: false,
		},
	},
	scales: {
		x: {
			beginAtZero: true,
			max: 100,
			ticks: {
				callback: (value: number) => `${value}%`,
			},
		},
	},
};

// User engagement metrics - from API
const engagementMetrics = computed(() => {
	const notConfiguredValue = needsConfiguration.value ? 'Not configured' : '-';
	if (!engagementData.value?.metrics) {
		return [
			{ label: 'Avg. Page Depth', value: notConfiguredValue, description: 'Average pages viewed per session' },
			{ label: 'Scroll Engagement', value: notConfiguredValue, description: 'Users who scroll past 50%' },
			{ label: 'Engagement Rate', value: notConfiguredValue, description: 'Sessions with engagement' },
			{ label: 'Form Completion', value: notConfiguredValue, description: 'Form start to submit rate' },
		];
	}
	return engagementData.value.metrics;
});

// Event tracking summary - from API
const eventsSummary = computed(() => {
	if (!eventsData.value?.events) {
		return [];
	}
	return eventsData.value.events;
});

// Device breakdown - from API
const deviceData = computed(() => {
	// API returns devices.{desktop,mobile,tablet}.percentage or chart.data array
	const devices = devicesData.value?.devices;
	const chartData = devicesData.value?.chart?.data;

	let desktopPct = 0, mobilePct = 0, tabletPct = 0;

	if (chartData && Array.isArray(chartData)) {
		// Use chart data if available
		[desktopPct, mobilePct, tabletPct] = chartData;
	} else if (devices) {
		// Use devices object
		desktopPct = devices.desktop?.percentage || 0;
		mobilePct = devices.mobile?.percentage || 0;
		tabletPct = devices.tablet?.percentage || 0;
	}

	return {
		labels: ['Desktop', 'Mobile', 'Tablet'],
		datasets: [{
			data: [desktopPct, mobilePct, tabletPct],
			backgroundColor: [
				themeColors.chart1Hex,
				themeColors.chart2Hex,
				themeColors.chart4Hex,
			],
			borderWidth: 0,
		}],
	};
});

const deviceOptions = {
	responsive: true,
	maintainAspectRatio: false,
	plugins: {
		legend: {
			position: 'bottom' as const,
		},
	},
};

// Traffic sources - from API
const trafficSources = computed(() => {
	if (!trafficSourcesData.value?.length) {
		return [];
	}
	return trafficSourcesData.value;
});

// Fetch real user data
const users = ref<any[]>([]);
const usersLoading = ref(true);
const ga4Metrics = ref<Record<string, any>>({});
const ga4Error = ref<string | null>(null);

async function fetchUsers() {
	usersLoading.value = true;
	try {
		const response: any = await $fetch('/api/directus/users', {
			method: 'POST',
			body: {
				operation: 'list',
				query: {
					fields: ['id', 'first_name', 'last_name', 'email', 'status', 'role.id', 'role.name', 'last_access'],
					filter: {
						status: { _eq: 'active' },
					},
					sort: ['-last_access'],
					limit: -1,
				},
			},
		});
		users.value = response || [];
	} catch (error) {
		console.error('Failed to fetch users:', error);
	} finally {
		usersLoading.value = false;
	}
}

// Fetch GA4 user metrics
async function fetchGA4Metrics() {
	ga4Error.value = null;
	try {
		const response: any = await $fetch('/api/analytics/user-metrics', {
			query: { dateRange: dateRange.value },
		});
		if (response.success) {
			// Store the totals and daily data for display
			// Note: Per-user metrics require custom dimension setup in GA4
			ga4Metrics.value = {
				totals: response.totals,
				dailyData: response.dailyData,
				today: response.today,
			};
		}
	} catch (error: any) {
		// GA4 API not configured - silently fail and use fallback
		console.warn('GA4 API not available:', error.message);
		ga4Error.value = error.data?.message || 'GA4 API not configured';
	}
}

// User activity data derived from real users + GA4 metrics
const userActivity = computed(() => {
	return users.value.slice(0, 10).map((user) => {
		const lastAccess = user.last_access ? new Date(user.last_access) : null;
		const now = new Date();
		let lastActive = 'Never';
		let status = 'offline';

		if (lastAccess) {
			const diffMinutes = Math.floor((now.getTime() - lastAccess.getTime()) / (1000 * 60));
			if (diffMinutes < 5) {
				lastActive = 'Just now';
				status = 'online';
			} else if (diffMinutes < 60) {
				lastActive = `${diffMinutes} minutes ago`;
				status = diffMinutes < 15 ? 'online' : 'away';
			} else if (diffMinutes < 1440) {
				const hours = Math.floor(diffMinutes / 60);
				lastActive = `${hours} hour${hours > 1 ? 's' : ''} ago`;
				status = 'away';
			} else if (diffMinutes < 2880) {
				lastActive = 'Yesterday';
			} else {
				lastActive = lastAccess.toLocaleDateString();
			}
		}

		const roleName = typeof user.role === 'object' ? user.role?.name : 'No Role';

		// Per-user GA4 metrics require custom dimension setup
		// Show dash placeholder as individual tracking isn't available
		return {
			id: user.id,
			name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown',
			email: user.email,
			role: roleName,
			lastActive,
			pageViews: '-',
			sessionsToday: '-',
			lastPage: '/dashboard',
			status,
		};
	});
});

// User role breakdown for chart - computed from real data
const userRoleData = computed(() => {
	const roleCounts: Record<string, number> = {
		'Board Member': 0,
		'Owner': 0,
		'Administrator': 0,
		'Staff': 0,
	};

	users.value.forEach((user) => {
		const roleName = typeof user.role === 'object' ? user.role?.name : '';
		if (roleName.includes('Board')) {
			roleCounts['Board Member']++;
		} else if (roleName.includes('Owner') || roleName.includes('Resident')) {
			roleCounts['Owner']++;
		} else if (roleName.includes('Admin')) {
			roleCounts['Administrator']++;
		} else if (roleName) {
			roleCounts['Staff']++;
		}
	});

	return {
		labels: ['Board Members', 'Owners', 'Admins', 'Staff'],
		datasets: [
			{
				data: [roleCounts['Board Member'], roleCounts['Owner'], roleCounts['Administrator'], roleCounts['Staff']],
				backgroundColor: [
					themeColors.chart1Hex,
					themeColors.chart2Hex,
					themeColors.chart4Hex,
					themeColors.chart5Hex,
				],
				borderWidth: 0,
			},
		],
	};
});

// User metrics summary - computed from real data
const userMetrics = computed(() => {
	const totalUsers = users.value.length;
	const now = new Date();
	const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

	const activeToday = users.value.filter((user) => {
		if (!user.last_access) return false;
		return new Date(user.last_access) >= todayStart;
	}).length;

	return [
		{label: 'Total Active Users', value: String(totalUsers), icon: 'i-heroicons-users', change: ''},
		{label: 'Active Today', value: String(activeToday), icon: 'i-heroicons-user-circle', change: ''},
		{label: 'Board Members', value: String(userRoleData.value.datasets[0].data[0]), icon: 'i-heroicons-building-office', change: ''},
		{label: 'Owners/Residents', value: String(userRoleData.value.datasets[0].data[1]), icon: 'i-heroicons-home', change: ''},
	];
});

// Real-time stats - from API
const realtimeUsers = computed(() => realtimeData.value?.activeUsers ?? 0);
const realtimePageViews = computed(() => realtimeData.value?.recentPageViews ?? 0);

// Fetch all GA4 analytics data
async function fetchAnalyticsData() {
	analyticsLoading.value = true;
	const query = { dateRange: dateRange.value };

	try {
		const [overview, pageViews, pages, devices, traffic, engagement, events] = await Promise.allSettled([
			$fetch('/api/analytics/overview', { query }),
			$fetch('/api/analytics/pageviews-chart', { query }),
			$fetch('/api/analytics/top-pages', { query }),
			$fetch('/api/analytics/devices', { query }),
			$fetch('/api/analytics/traffic-sources', { query }),
			$fetch('/api/analytics/engagement', { query }),
			$fetch('/api/analytics/events', { query }),
		]);

		// Check if any API call succeeded to determine if GA4 is configured
		const anySuccess = [overview, pageViews, pages, devices, traffic, engagement, events]
			.some(result => result.status === 'fulfilled' && (result.value as any)?.success);

		// Check if all failed due to configuration issues
		const allFailed = [overview, pageViews, pages, devices, traffic, engagement, events]
			.every(result => result.status === 'rejected');

		if (anySuccess) {
			ga4Configured.value = true;
		} else if (allFailed) {
			ga4Configured.value = false;
		}

		if (overview.status === 'fulfilled') overviewData.value = overview.value;
		if (pageViews.status === 'fulfilled') pageViewsData.value = pageViews.value;
		if (pages.status === 'fulfilled' && (pages.value as any)?.pages) {
			topPagesData.value = (pages.value as any).pages;
		}
		if (devices.status === 'fulfilled') devicesData.value = devices.value;
		if (traffic.status === 'fulfilled' && (traffic.value as any)?.sources) {
			trafficSourcesData.value = (traffic.value as any).sources;
		}
		if (engagement.status === 'fulfilled') engagementData.value = engagement.value;
		if (events.status === 'fulfilled') eventsData.value = events.value;
	} catch (error) {
		console.error('Failed to fetch analytics data:', error);
		ga4Configured.value = false;
	} finally {
		analyticsLoading.value = false;
	}
}

// Fetch real-time data separately (can be called more frequently)
async function fetchRealtimeData() {
	try {
		const response: any = await $fetch('/api/analytics/realtime');
		if (response.success) {
			realtimeData.value = response;
		}
	} catch (error) {
		console.warn('Failed to fetch realtime data:', error);
	}
}

// Refresh real-time data periodically
let realtimeInterval: ReturnType<typeof setInterval>;

onMounted(async () => {
	// Fetch all data in parallel
	await Promise.all([
		fetchUsers(),
		fetchGA4Metrics(),
		fetchAnalyticsData(),
		fetchRealtimeData(),
	]);

	// Refresh real-time data every 30 seconds
	realtimeInterval = setInterval(() => {
		fetchRealtimeData();
	}, 30000);
});

// Refetch data when date range changes
watch(dateRange, () => {
	fetchGA4Metrics();
	fetchAnalyticsData();
});

onUnmounted(() => {
	if (realtimeInterval) {
		clearInterval(realtimeInterval);
	}
});
</script>

<template>
	<div class="admin-page t-bg min-h-full">
		<div class="container mx-auto px-6 py-8">
			<!-- Header -->
			<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
				<div>
					<h1 class="text-2xl font-bold">Analytics Dashboard</h1>
					<p class="text-gray-600 dark:text-gray-400 mt-2">Track user interactions, page performance, and engagement metrics</p>
				</div>
				<div class="mt-4 sm:mt-0">
					<select
						v-model="dateRange"
						class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm">
						<option v-for="option in dateRangeOptions" :key="option.value" :value="option.value">
							{{ option.label }}
						</option>
					</select>
				</div>
			</div>

			<div v-if="!canAccessAnalytics" class="text-center py-12">
				<UIcon name="i-heroicons-shield-exclamation" class="w-16 h-16 text-red-500 mx-auto mb-4" />
				<h2 class="text-xl font-semibold mb-2">Access Denied</h2>
				<p class="text-gray-600 dark:text-gray-400">You do not have permission to view analytics.</p>
			</div>

			<div v-else>
				<!-- Configuration Required Notice -->
				<div v-if="needsConfiguration" class="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-6 mb-8 border border-amber-200 dark:border-amber-700">
					<div class="flex items-start">
						<UIcon name="i-heroicons-exclamation-triangle" class="w-6 h-6 text-amber-500 mr-4 flex-shrink-0 mt-0.5" />
						<div class="flex-1">
							<h3 class="text-lg font-semibold text-amber-900 dark:text-amber-100 mb-2">
								GA4 Data API Not Configured
							</h3>
							<p class="text-sm text-amber-800 dark:text-amber-200 mb-4">
								The Google Analytics 4 Data API needs to be configured to display live analytics data.
								Follow the setup guide to connect your GA4 property.
							</p>
							<NuxtLink
								to="/admin/analytics/setup"
								class="inline-flex items-center px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors">
								<UIcon name="i-heroicons-cog-6-tooth" class="w-4 h-4 mr-2" />
								View Setup Guide
							</NuxtLink>
						</div>
					</div>
				</div>

				<!-- Real-time Stats Banner -->
				<div class="bg-gradient-to-r from-primary to-teal-400 rounded-lg p-4 mb-8 text-white">
					<div class="flex items-center justify-between">
						<div class="flex items-center space-x-6">
							<div class="flex items-center">
								<span class="relative flex h-3 w-3 mr-2">
									<span v-if="!needsConfiguration" class="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
									<span class="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
								</span>
								<span class="font-semibold">Real-time</span>
							</div>
							<div v-if="needsConfiguration" class="text-sm opacity-80">
								Not configured
							</div>
							<template v-else>
								<div>
									<span class="text-2xl font-bold">{{ realtimeUsers }}</span>
									<span class="text-sm ml-1 opacity-80">active users</span>
								</div>
								<div>
									<span class="text-2xl font-bold">{{ realtimePageViews }}</span>
									<span class="text-sm ml-1 opacity-80">page views today</span>
								</div>
							</template>
						</div>
						<a
							href="https://analytics.google.com"
							target="_blank"
							class="flex items-center text-sm bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors">
							<UIcon name="i-heroicons-arrow-top-right-on-square" class="w-4 h-4 mr-2" />
							Open GA4
						</a>
					</div>
				</div>

				<!-- Overview Metrics -->
				<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
					<div
						v-for="metric in overviewMetrics"
						:key="metric.label"
						class="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
						<div class="flex items-center justify-between mb-4">
							<UIcon :name="metric.icon" class="w-8 h-8 text-primary-500" />
							<span
								v-if="metric.change"
								:class="[
									'text-sm font-medium px-2 py-1 rounded',
									metric.changeType === 'positive'
										? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
										: metric.changeType === 'negative'
											? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
											: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
								]">
								{{ metric.change }}
							</span>
						</div>
						<p class="text-2xl font-bold" :class="{ 'text-amber-600 dark:text-amber-400': metric.value === 'Not configured' }">{{ metric.value }}</p>
						<p class="text-sm text-gray-600 dark:text-gray-400 mt-1">{{ metric.label }}</p>
					</div>
				</div>

				<!-- Charts Row -->
				<div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
					<!-- Page Views Chart -->
					<div class="lg:col-span-2 bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
						<h3 class="text-lg font-semibold mb-4">Page Views Over Time</h3>
						<ChartContainer :config="chartConfig" class="h-64">
							<Line :data="pageViewsChartData" :options="pageViewsChartOptions" />
						</ChartContainer>
					</div>

					<!-- Device Breakdown -->
					<div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
						<h3 class="text-lg font-semibold mb-4">Device Breakdown</h3>
						<ChartContainer :config="chartConfig" class="h-64">
							<Doughnut :data="deviceData" :options="deviceOptions" />
						</ChartContainer>
					</div>
				</div>

				<!-- Scroll Depth & Engagement -->
				<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
					<!-- Scroll Depth -->
					<div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
						<h3 class="text-lg font-semibold mb-4">Scroll Depth Analysis</h3>
						<p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
							Percentage of users reaching each scroll threshold
						</p>
						<ChartContainer :config="chartConfig" class="h-48">
							<Bar :data="scrollDepthData" :options="scrollDepthOptions" />
						</ChartContainer>
					</div>

					<!-- User Engagement -->
					<div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
						<h3 class="text-lg font-semibold mb-4">User Engagement</h3>
						<div class="grid grid-cols-2 gap-4">
							<div
								v-for="metric in engagementMetrics"
								:key="metric.label"
								class="bg-white dark:bg-gray-700 rounded-lg p-4">
								<p class="text-xl font-bold" :class="metric.value === 'Not configured' ? 'text-amber-600 dark:text-amber-400' : 'text-primary-500'">{{ metric.value }}</p>
								<p class="text-sm font-medium">{{ metric.label }}</p>
								<p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ metric.description }}</p>
							</div>
						</div>
					</div>
				</div>

				<!-- Top Pages & Traffic Sources -->
				<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
					<!-- Top Pages -->
					<div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
						<h3 class="text-lg font-semibold mb-4">Top Pages</h3>
						<div class="overflow-x-auto">
							<table class="w-full text-sm">
								<thead>
									<tr class="border-b border-gray-200 dark:border-gray-600">
										<th class="text-left py-2 font-medium">Page</th>
										<th class="text-right py-2 font-medium">Views</th>
										<th class="text-right py-2 font-medium hidden sm:table-cell">Avg. Time</th>
										<th class="text-right py-2 font-medium hidden sm:table-cell">Bounce</th>
									</tr>
								</thead>
								<tbody>
									<tr v-if="topPages.length === 0">
										<td colspan="4" class="py-6 text-center text-gray-500 dark:text-gray-400">
											{{ analyticsLoading ? 'Loading...' : (needsConfiguration ? 'GA4 not configured' : 'No page data available') }}
										</td>
									</tr>
									<tr
										v-for="page in topPages"
										:key="page.path"
										class="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700/50">
										<td class="py-3">
											<span class="font-medium">{{ page.title }}</span>
											<span class="block text-xs text-gray-500">{{ page.path }}</span>
										</td>
										<td class="text-right py-3 font-medium">{{ (page.views || 0).toLocaleString() }}</td>
										<td class="text-right py-3 hidden sm:table-cell">{{ page.avgTime }}</td>
										<td class="text-right py-3 hidden sm:table-cell">{{ page.bounceRate }}</td>
									</tr>
								</tbody>
							</table>
						</div>
					</div>

					<!-- Traffic Sources -->
					<div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
						<h3 class="text-lg font-semibold mb-4">Traffic Sources</h3>
						<div class="space-y-4">
							<div v-if="trafficSources.length === 0" class="py-6 text-center text-gray-500 dark:text-gray-400">
								{{ analyticsLoading ? 'Loading...' : (needsConfiguration ? 'GA4 not configured' : 'No traffic data available') }}
							</div>
							<div v-for="source in trafficSources" :key="source.source">
								<div class="flex justify-between text-sm mb-2">
									<span class="font-medium">{{ source.source }}</span>
									<span class="text-gray-600 dark:text-gray-400">
										{{ (source.sessions || 0).toLocaleString() }} ({{ source.percentage || 0 }}%)
									</span>
								</div>
								<Progress
									:model-value="source.percentage || 0"
									color="primary"
									class="h-2"
								/>
							</div>
						</div>
					</div>
				</div>

				<!-- Events Tracking -->
				<div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 mb-8">
					<h3 class="text-lg font-semibold mb-4">Event Tracking Summary</h3>
					<p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
						Custom events tracked via the analytics system
					</p>
					<div v-if="eventsSummary.length === 0" class="py-6 text-center text-gray-500 dark:text-gray-400">
						{{ analyticsLoading ? 'Loading...' : (needsConfiguration ? 'GA4 not configured' : 'No event data available') }}
					</div>
					<div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
						<div
							v-for="event in eventsSummary"
							:key="event.event"
							class="bg-white dark:bg-gray-700 rounded-lg p-4 text-center">
							<p class="text-2xl font-bold text-primary-500">{{ (event.count || 0).toLocaleString() }}</p>
							<p class="text-sm font-medium mt-1">{{ event.event.replace('_', ' ') }}</p>
							<span class="inline-block mt-2 text-xs bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded">
								{{ event.category }}
							</span>
						</div>
					</div>
				</div>

				<!-- User Activity Section -->
				<div class="mb-8">
					<h3 class="text-lg font-semibold mb-4">User Activity Tracking</h3>
					<p class="text-sm text-gray-600 dark:text-gray-400 mb-6">
						Track individual user behavior by email, ID, and name
					</p>

					<!-- User Metrics -->
					<div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
						<div
							v-for="metric in userMetrics"
							:key="metric.label"
							class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
							<div class="flex items-center justify-between mb-2">
								<UIcon :name="metric.icon" class="w-6 h-6 text-primary-500" />
								<span class="text-xs font-medium text-green-500">{{ metric.change }}</span>
							</div>
							<p class="text-2xl font-bold">{{ metric.value }}</p>
							<p class="text-xs text-gray-600 dark:text-gray-400 mt-1">{{ metric.label }}</p>
						</div>
					</div>

					<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
						<!-- User Activity Table -->
						<div class="lg:col-span-2 bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
							<h4 class="font-semibold mb-4">Recent User Activity</h4>
							<div class="overflow-x-auto">
								<table class="w-full text-sm">
									<thead>
										<tr class="text-left text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
											<th class="pb-3 font-medium">User</th>
											<th class="pb-3 font-medium">Role</th>
											<th class="pb-3 font-medium">Last Active</th>
											<th class="pb-3 font-medium text-right">Page Views</th>
											<th class="pb-3 font-medium">Last Page</th>
										</tr>
									</thead>
									<tbody>
										<tr
											v-for="userItem in userActivity"
											:key="userItem.id"
											class="border-b border-gray-100 dark:border-gray-700 last:border-0">
											<td class="py-3">
												<div class="flex items-center">
													<span
														class="w-2 h-2 rounded-full mr-2"
														:class="{
															'bg-green-500': userItem.status === 'online',
															'bg-yellow-500': userItem.status === 'away',
															'bg-gray-400': userItem.status === 'offline',
														}"></span>
													<div>
														<p class="font-medium">{{ userItem.name }}</p>
														<p class="text-xs text-gray-500">{{ userItem.email }}</p>
													</div>
												</div>
											</td>
											<td class="py-3">
												<span
													class="inline-block px-2 py-1 text-xs rounded"
													:class="{
														'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400':
															userItem.role === 'Admin',
														'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400':
															userItem.role === 'Board Member',
														'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400':
															userItem.role === 'Owner',
													}">
													{{ userItem.role }}
												</span>
											</td>
											<td class="py-3 text-gray-600 dark:text-gray-400">
												{{ userItem.lastActive }}
											</td>
											<td class="py-3 text-right font-medium">
												{{ userItem.pageViews }}
											</td>
											<td class="py-3">
												<code class="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
													{{ userItem.lastPage }}
												</code>
											</td>
										</tr>
									</tbody>
								</table>
							</div>
						</div>

						<!-- User Role Breakdown -->
						<div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
							<h4 class="font-semibold mb-4">Users by Role</h4>
							<ChartContainer :config="chartConfig" class="h-48">
								<Doughnut :data="userRoleData" :options="deviceOptions" />
							</ChartContainer>
							<div class="mt-4 space-y-2">
								<div class="flex items-center justify-between text-sm">
									<div class="flex items-center">
										<span class="w-3 h-3 rounded-full mr-2" :style="{backgroundColor: themeColors.chart1Hex}"></span>
										<span>Board Members</span>
									</div>
									<span class="font-medium">{{ userRoleData.datasets[0].data[0] }}</span>
								</div>
								<div class="flex items-center justify-between text-sm">
									<div class="flex items-center">
										<span class="w-3 h-3 rounded-full mr-2" :style="{backgroundColor: themeColors.chart2Hex}"></span>
										<span>Owners</span>
									</div>
									<span class="font-medium">{{ userRoleData.datasets[0].data[1] }}</span>
								</div>
								<div class="flex items-center justify-between text-sm">
									<div class="flex items-center">
										<span class="w-3 h-3 rounded-full mr-2" :style="{backgroundColor: themeColors.chart4Hex}"></span>
										<span>Admins</span>
									</div>
									<span class="font-medium">{{ userRoleData.datasets[0].data[2] }}</span>
								</div>
								<div class="flex items-center justify-between text-sm">
									<div class="flex items-center">
										<span class="w-3 h-3 rounded-full mr-2" :style="{backgroundColor: themeColors.chart5Hex}"></span>
										<span>Staff</span>
									</div>
									<span class="font-medium">{{ userRoleData.datasets[0].data[3] }}</span>
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Setup Instructions -->
				<div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
					<div class="flex items-start">
						<UIcon name="i-heroicons-information-circle" class="w-6 h-6 text-blue-500 mr-4 flex-shrink-0 mt-0.5" />
						<div>
							<h3 class="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
								Google Analytics 4 Dashboard Setup
							</h3>
							<p class="text-sm text-blue-800 dark:text-blue-200 mb-4">
								To view live data and create custom reports, follow these steps in GA4:
							</p>
							<ol class="text-sm text-blue-800 dark:text-blue-200 space-y-2 list-decimal list-inside">
								<li>
									Go to
									<a href="https://analytics.google.com" target="_blank" class="underline font-medium">
										analytics.google.com
									</a>
								</li>
								<li>Navigate to Reports > Engagement > Events to see all tracked events</li>
								<li>Create custom explorations for scroll depth and form analytics</li>
								<li>Set up conversions for form_submit and other key events</li>
								<li>Configure audiences based on user engagement levels</li>
							</ol>
							<div class="mt-4 flex flex-wrap gap-2">
								<a
									href="https://analytics.google.com"
									target="_blank"
									class="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors">
									<UIcon name="i-heroicons-arrow-top-right-on-square" class="w-4 h-4 mr-2" />
									Open Google Analytics
								</a>
								<NuxtLink
									to="/admin/analytics/setup"
									class="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-medium border border-blue-300 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors">
									<UIcon name="i-heroicons-document-text" class="w-4 h-4 mr-2" />
									View Setup Guide
								</NuxtLink>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>
