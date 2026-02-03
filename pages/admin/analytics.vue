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

const {isAdmin, isBoardMember} = useRoles();

const canAccessAnalytics = computed(() => isAdmin.value || isBoardMember.value);

// Date range filter
const dateRange = ref('7d');
const dateRangeOptions = [
	{label: 'Last 7 days', value: '7d'},
	{label: 'Last 30 days', value: '30d'},
	{label: 'Last 90 days', value: '90d'},
	{label: 'Year to date', value: 'ytd'},
];

// Sample metrics data (in production, this would come from GA4 API or your backend)
const overviewMetrics = ref([
	{
		label: 'Total Page Views',
		value: '12,847',
		change: '+12.5%',
		changeType: 'positive',
		icon: 'i-heroicons-eye',
	},
	{
		label: 'Unique Visitors',
		value: '3,421',
		change: '+8.2%',
		changeType: 'positive',
		icon: 'i-heroicons-users',
	},
	{
		label: 'Avg. Session Duration',
		value: '4m 32s',
		change: '+5.1%',
		changeType: 'positive',
		icon: 'i-heroicons-clock',
	},
	{
		label: 'Bounce Rate',
		value: '34.2%',
		change: '-2.3%',
		changeType: 'positive',
		icon: 'i-heroicons-arrow-uturn-left',
	},
]);

// Page views chart data
const pageViewsChartData = computed(() => ({
	labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
	datasets: [
		{
			label: 'Page Views',
			data: [1850, 2100, 1920, 2340, 2180, 1650, 1807],
			borderColor: themeColors.chart1Hex,
			backgroundColor: 'rgba(0, 240, 181, 0.1)',
			fill: true,
			tension: 0.4,
		},
	],
}));

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

// Top pages data
const topPages = ref([
	{path: '/', title: 'Home', views: 4521, avgTime: '3m 12s', bounceRate: '28%'},
	{path: '/dashboard', title: 'Dashboard', views: 2134, avgTime: '5m 45s', bounceRate: '15%'},
	{path: '/meetings', title: 'Meetings', views: 1876, avgTime: '4m 22s', bounceRate: '22%'},
	{path: '/documents', title: 'Documents', views: 1432, avgTime: '6m 18s', bounceRate: '18%'},
	{path: '/announcements', title: 'Announcements', views: 1287, avgTime: '2m 45s', bounceRate: '35%'},
	{path: '/projects', title: 'Projects', views: 984, avgTime: '4m 56s', bounceRate: '20%'},
	{path: '/feed', title: 'Before/After Gallery', views: 756, avgTime: '3m 33s', bounceRate: '25%'},
	{path: '/financials', title: 'Financials', views: 643, avgTime: '7m 12s', bounceRate: '12%'},
]);

// Scroll depth data
const scrollDepthData = computed(() => ({
	labels: ['25%', '50%', '75%', '90%', '100%'],
	datasets: [
		{
			label: 'Users Reached',
			data: [89, 72, 58, 41, 28],
			backgroundColor: [
				themeColors.chart1Hex,
				themeColors.chart2Hex,
				themeColors.chart4Hex,
				themeColors.chart5Hex,
				themeColors.chart3Hex,
			],
			borderWidth: 0,
		},
	],
}));

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

// User engagement metrics
const engagementMetrics = ref([
	{label: 'Avg. Page Depth', value: '3.2 pages', description: 'Average pages viewed per session'},
	{label: 'Scroll Engagement', value: '67%', description: 'Users who scroll past 50%'},
	{label: 'Click Rate', value: '4.8%', description: 'Click-through rate on CTAs'},
	{label: 'Form Completion', value: '72%', description: 'Form start to submit rate'},
]);

// Event tracking summary
const eventsSummary = ref([
	{event: 'user_identified', count: 1247, category: 'Users'},
	{event: 'button_click', count: 3421, category: 'Engagement'},
	{event: 'form_submit', count: 856, category: 'Conversion'},
	{event: 'outbound_click', count: 432, category: 'Navigation'},
	{event: 'file_download', count: 287, category: 'Content'},
	{event: 'user_logout', count: 234, category: 'Users'},
]);

// Device breakdown
const deviceData = computed(() => ({
	labels: ['Desktop', 'Mobile', 'Tablet'],
	datasets: [
		{
			data: [58, 35, 7],
			backgroundColor: [
				themeColors.chart1Hex,
				themeColors.chart2Hex,
				themeColors.chart4Hex,
			],
			borderWidth: 0,
		},
	],
}));

const deviceOptions = {
	responsive: true,
	maintainAspectRatio: false,
	plugins: {
		legend: {
			position: 'bottom' as const,
		},
	},
};

// Traffic sources
const trafficSources = ref([
	{source: 'Direct', sessions: 1842, percentage: 42},
	{source: 'Organic Search', sessions: 1256, percentage: 29},
	{source: 'Referral', sessions: 654, percentage: 15},
	{source: 'Social', sessions: 432, percentage: 10},
	{source: 'Email', sessions: 174, percentage: 4},
]);

// User activity data
const userActivity = ref([
	{
		id: '1',
		name: 'John Smith',
		email: 'john.smith@example.com',
		role: 'Board Member',
		lastActive: '2 minutes ago',
		pageViews: 47,
		sessionsToday: 3,
		lastPage: '/dashboard',
		status: 'online',
	},
	{
		id: '2',
		name: 'Sarah Johnson',
		email: 'sarah.j@example.com',
		role: 'Admin',
		lastActive: '15 minutes ago',
		pageViews: 28,
		sessionsToday: 2,
		lastPage: '/admin/users',
		status: 'online',
	},
	{
		id: '3',
		name: 'Michael Chen',
		email: 'mchen@example.com',
		role: 'Owner',
		lastActive: '1 hour ago',
		pageViews: 15,
		sessionsToday: 1,
		lastPage: '/financials',
		status: 'away',
	},
	{
		id: '4',
		name: 'Emily Davis',
		email: 'emily.d@example.com',
		role: 'Board Member',
		lastActive: '3 hours ago',
		pageViews: 12,
		sessionsToday: 1,
		lastPage: '/meetings',
		status: 'offline',
	},
	{
		id: '5',
		name: 'Robert Wilson',
		email: 'rwilson@example.com',
		role: 'Owner',
		lastActive: 'Yesterday',
		pageViews: 34,
		sessionsToday: 0,
		lastPage: '/documents',
		status: 'offline',
	},
]);

// User role breakdown for chart
const userRoleData = computed(() => ({
	labels: ['Board Members', 'Owners', 'Admins', 'Staff'],
	datasets: [
		{
			data: [8, 42, 3, 12],
			backgroundColor: [
				themeColors.chart1Hex,
				themeColors.chart2Hex,
				themeColors.chart4Hex,
				themeColors.chart5Hex,
			],
			borderWidth: 0,
		},
	],
}));

// User metrics summary
const userMetrics = ref([
	{label: 'Total Identified Users', value: '65', icon: 'i-heroicons-users', change: '+12%'},
	{label: 'Active Today', value: '23', icon: 'i-heroicons-user-circle', change: '+5%'},
	{label: 'Logins Today', value: '31', icon: 'i-heroicons-arrow-right-on-rectangle', change: '+8%'},
	{label: 'Avg. Pages/User', value: '4.2', icon: 'i-heroicons-document-duplicate', change: '+3%'},
]);

// Real-time stats (simulated)
const realtimeUsers = ref(12);
const realtimePageViews = ref(47);

// Simulate real-time updates
let realtimeInterval: ReturnType<typeof setInterval>;
onMounted(() => {
	realtimeInterval = setInterval(() => {
		realtimeUsers.value = Math.max(1, realtimeUsers.value + Math.floor(Math.random() * 5) - 2);
		realtimePageViews.value += Math.floor(Math.random() * 3);
	}, 5000);
});

onUnmounted(() => {
	if (realtimeInterval) {
		clearInterval(realtimeInterval);
	}
});
</script>

<template>
	<div class="admin-page bg-white dark:bg-gray-900 min-h-full">
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
				<!-- Real-time Stats Banner -->
				<div class="bg-gradient-to-r from-primary to-teal-400 rounded-lg p-4 mb-8 text-white">
					<div class="flex items-center justify-between">
						<div class="flex items-center space-x-6">
							<div class="flex items-center">
								<span class="relative flex h-3 w-3 mr-2">
									<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
									<span class="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
								</span>
								<span class="font-semibold">Real-time</span>
							</div>
							<div>
								<span class="text-2xl font-bold">{{ realtimeUsers }}</span>
								<span class="text-sm ml-1 opacity-80">active users</span>
							</div>
							<div>
								<span class="text-2xl font-bold">{{ realtimePageViews }}</span>
								<span class="text-sm ml-1 opacity-80">page views today</span>
							</div>
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
								:class="[
									'text-sm font-medium px-2 py-1 rounded',
									metric.changeType === 'positive'
										? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
										: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
								]">
								{{ metric.change }}
							</span>
						</div>
						<p class="text-2xl font-bold">{{ metric.value }}</p>
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
								<p class="text-xl font-bold text-primary-500">{{ metric.value }}</p>
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
									<tr
										v-for="page in topPages"
										:key="page.path"
										class="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700/50">
										<td class="py-3">
											<span class="font-medium">{{ page.title }}</span>
											<span class="block text-xs text-gray-500">{{ page.path }}</span>
										</td>
										<td class="text-right py-3 font-medium">{{ page.views.toLocaleString() }}</td>
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
							<div v-for="source in trafficSources" :key="source.source">
								<div class="flex justify-between text-sm mb-2">
									<span class="font-medium">{{ source.source }}</span>
									<span class="text-gray-600 dark:text-gray-400">
										{{ source.sessions.toLocaleString() }} ({{ source.percentage }}%)
									</span>
								</div>
								<Progress
									:model-value="source.percentage"
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
					<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
						<div
							v-for="event in eventsSummary"
							:key="event.event"
							class="bg-white dark:bg-gray-700 rounded-lg p-4 text-center">
							<p class="text-2xl font-bold text-primary-500">{{ event.count.toLocaleString() }}</p>
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
									<span class="font-medium">8</span>
								</div>
								<div class="flex items-center justify-between text-sm">
									<div class="flex items-center">
										<span class="w-3 h-3 rounded-full mr-2" :style="{backgroundColor: themeColors.chart2Hex}"></span>
										<span>Owners</span>
									</div>
									<span class="font-medium">42</span>
								</div>
								<div class="flex items-center justify-between text-sm">
									<div class="flex items-center">
										<span class="w-3 h-3 rounded-full mr-2" :style="{backgroundColor: themeColors.chart4Hex}"></span>
										<span>Admins</span>
									</div>
									<span class="font-medium">3</span>
								</div>
								<div class="flex items-center justify-between text-sm">
									<div class="flex items-center">
										<span class="w-3 h-3 rounded-full mr-2" :style="{backgroundColor: themeColors.chart5Hex}"></span>
										<span>Staff</span>
									</div>
									<span class="font-medium">12</span>
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
