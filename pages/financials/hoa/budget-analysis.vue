<template>
	<div class="min-h-screen bg-gray-50">
		<!-- Header -->
		<div class="bg-gradient-to-br from-purple-500 to-purple-600 text-white py-8 px-6">
			<div class="max-w-6xl mx-auto text-center">
				<div class="flex items-center justify-center mb-4">
					<UIcon name="i-heroicons-calculator" class="w-8 h-8 mr-3" />
					<h1 class="text-4xl font-bold">Budget vs Actual Analysis</h1>
				</div>
				<h2 class="text-2xl font-semibold mb-2">Lenox Plaza Association, Inc.</h2>
				<p class="text-xl">2025 Budget Performance Review</p>
			</div>
		</div>

		<div class="max-w-6xl mx-auto px-6 py-8">
			<!-- Performance Overview -->
			<UCard class="mb-8 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
				<template #header>
					<div class="flex items-center">
						<UIcon name="i-heroicons-chart-bar-square" class="w-6 h-6 mr-3 text-blue-600" />
						<h3 class="text-xl font-bold text-blue-800">📊 Budget Performance Overview</h3>
					</div>
				</template>

				<div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
					<div class="text-center p-4 bg-white rounded-lg shadow">
						<UIcon name="i-heroicons-arrow-trending-up" class="w-8 h-8 mx-auto mb-2 text-green-600" />
						<div class="text-sm text-gray-600">YTD Revenue</div>
						<div class="text-2xl font-bold text-green-600">${{ performanceMetrics.ytdRevenue.toLocaleString() }}</div>
						<div class="text-sm" :class="performanceMetrics.revenueVariance >= 0 ? 'text-green-600' : 'text-red-600'">
							{{ performanceMetrics.revenueVariance >= 0 ? '+' : '' }}{{ performanceMetrics.revenueVariance }}% vs
							Budget
						</div>
					</div>

					<div class="text-center p-4 bg-white rounded-lg shadow">
						<UIcon name="i-heroicons-arrow-trending-down" class="w-8 h-8 mx-auto mb-2 text-red-600" />
						<div class="text-sm text-gray-600">YTD Expenses</div>
						<div class="text-2xl font-bold text-red-600">${{ performanceMetrics.ytdExpenses.toLocaleString() }}</div>
						<div class="text-sm" :class="performanceMetrics.expenseVariance <= 0 ? 'text-green-600' : 'text-red-600'">
							{{ performanceMetrics.expenseVariance >= 0 ? '+' : '' }}{{ performanceMetrics.expenseVariance }}% vs
							Budget
						</div>
					</div>

					<div class="text-center p-4 bg-white rounded-lg shadow">
						<UIcon name="i-heroicons-scale" class="w-8 h-8 mx-auto mb-2 text-blue-600" />
						<div class="text-sm text-gray-600">Net Operating</div>
						<div
							class="text-2xl font-bold"
							:class="performanceMetrics.netOperating >= 0 ? 'text-green-600' : 'text-red-600'"
						>
							${{ performanceMetrics.netOperating.toLocaleString() }}
						</div>
						<div class="text-sm text-gray-600">YTD Result</div>
					</div>

					<div class="text-center p-4 bg-white rounded-lg shadow">
						<UIcon name="i-heroicons-exclamation-triangle" class="w-8 h-8 mx-auto mb-2 text-yellow-600" />
						<div class="text-sm text-gray-600">Budget Accuracy</div>
						<div class="text-2xl font-bold text-yellow-600">{{ performanceMetrics.accuracy }}%</div>
						<div class="text-sm text-yellow-600">Needs Improvement</div>
					</div>
				</div>

				<UAlert
					color="yellow"
					variant="soft"
					title="Budget Variance Alert"
					description="Several line items showing significant variances from budget projections. Immediate budget revision recommended."
				/>
			</UCard>

			<!-- Budget vs Actual Chart -->
			<UCard class="mb-8">
				<template #header>
					<div class="flex items-center justify-between">
						<div class="flex items-center">
							<UIcon name="i-heroicons-chart-bar" class="w-6 h-6 mr-3 text-purple-600" />
							<h3 class="text-xl font-bold">Budget vs Actual Comparison</h3>
						</div>
						<UButtonGroup size="sm">
							<UButton
								v-for="view in chartViews"
								:key="view.key"
								:variant="selectedView === view.key ? 'solid' : 'outline'"
								@click="selectedView = view.key"
							>
								{{ view.label }}
							</UButton>
						</UButtonGroup>
					</div>
				</template>

				<div class="h-96">
					<Bar :data="chartData" :options="chartOptions" />
				</div>
			</UCard>

			<!-- Detailed Budget Analysis -->
			<UCard class="mb-8">
				<template #header>
					<div class="flex items-center">
						<UIcon name="i-heroicons-table-cells" class="w-6 h-6 mr-3 text-green-600" />
						<h3 class="text-xl font-bold">Detailed Budget Analysis</h3>
					</div>
				</template>

				<UTable :rows="budgetAnalysis" :columns="budgetColumns" class="w-full">
					<template #variance-data="{ row }">
						<span :class="getVarianceColor(row.variance)" class="font-semibold">
							{{ row.variance >= 0 ? '+' : '' }}${{ row.variance.toLocaleString() }}
						</span>
					</template>

					<template #percent-data="{ row }">
						<span :class="getPercentColor(row.percent)" class="font-semibold">
							{{ row.percent >= 0 ? '+' : '' }}{{ row.percent }}%
						</span>
					</template>

					<template #status-data="{ row }">
						<UBadge :color="row.statusColor" variant="soft">
							{{ row.status }}
						</UBadge>
					</template>
				</UTable>
			</UCard>

			<!-- Category Analysis -->
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
				<!-- Revenue Analysis -->
				<UCard>
					<template #header>
						<div class="flex items-center">
							<UIcon name="i-heroicons-arrow-trending-up" class="w-6 h-6 mr-3 text-green-600" />
							<h3 class="text-xl font-bold">Revenue Analysis</h3>
						</div>
					</template>

					<div class="space-y-4">
						<div
							v-for="item in revenueAnalysis"
							:key="item.category"
							class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
						>
							<div>
								<div class="font-semibold">{{ item.category }}</div>
								<div class="text-sm text-gray-600">
									Budget: ${{ item.budget.toLocaleString() }} | Actual: ${{ item.actual.toLocaleString() }}
								</div>
							</div>
							<div class="text-right">
								<div :class="item.variance >= 0 ? 'text-green-600' : 'text-red-600'" class="font-bold">
									{{ item.variance >= 0 ? '+' : '' }}${{ item.variance.toLocaleString() }}
								</div>
								<div class="text-sm text-gray-600">{{ item.percent }}%</div>
							</div>
						</div>
					</div>
				</UCard>

				<!-- Expense Analysis -->
				<UCard>
					<template #header>
						<div class="flex items-center">
							<UIcon name="i-heroicons-arrow-trending-down" class="w-6 h-6 mr-3 text-red-600" />
							<h3 class="text-xl font-bold">Expense Analysis</h3>
						</div>
					</template>

					<div class="space-y-4">
						<div
							v-for="item in expenseAnalysis"
							:key="item.category"
							class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
						>
							<div>
								<div class="font-semibold">{{ item.category }}</div>
								<div class="text-sm text-gray-600">
									Budget: ${{ item.budget.toLocaleString() }} | Actual: ${{ item.actual.toLocaleString() }}
								</div>
							</div>
							<div class="text-right">
								<div :class="item.variance <= 0 ? 'text-green-600' : 'text-red-600'" class="font-bold">
									{{ item.variance >= 0 ? '+' : '' }}${{ item.variance.toLocaleString() }}
								</div>
								<div class="text-sm text-gray-600">{{ item.percent }}%</div>
							</div>
						</div>
					</div>
				</UCard>
			</div>

			<!-- Key Issues & Recommendations -->
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
				<!-- Budget Issues -->
				<UCard>
					<template #header>
						<div class="flex items-center">
							<UIcon name="i-heroicons-exclamation-triangle" class="w-6 h-6 mr-3 text-red-600" />
							<h3 class="text-xl font-bold text-red-800">Critical Budget Issues</h3>
						</div>
					</template>

					<div class="space-y-4">
						<UAlert
							v-for="issue in budgetIssues"
							:key="issue.title"
							:color="issue.color"
							variant="soft"
							:title="issue.title"
							:description="issue.description"
						/>
					</div>
				</UCard>

				<!-- Recommendations -->
				<UCard>
					<template #header>
						<div class="flex items-center">
							<UIcon name="i-heroicons-light-bulb" class="w-6 h-6 mr-3 text-blue-600" />
							<h3 class="text-xl font-bold text-blue-800">Budget Recommendations</h3>
						</div>
					</template>

					<div class="space-y-3">
						<div
							v-for="rec in budgetRecommendations"
							:key="rec.title"
							class="p-3 border-l-4 border-blue-500 bg-blue-50 rounded-r-lg"
						>
							<h4 class="font-semibold text-blue-800">{{ rec.title }}</h4>
							<p class="text-sm text-blue-700 mt-1">{{ rec.description }}</p>
							<div class="text-xs text-blue-600 mt-2">Impact: {{ rec.impact }}</div>
						</div>
					</div>
				</UCard>
			</div>

			<!-- Forecasting -->
			<UCard class="mb-8">
				<template #header>
					<div class="flex items-center">
						<UIcon name="i-heroicons-eye" class="w-6 h-6 mr-3 text-purple-600" />
						<h3 class="text-xl font-bold">Year-End Forecast</h3>
					</div>
				</template>

				<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
					<div class="text-center p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-lg">
						<h4 class="font-semibold text-red-800 mb-2">Pessimistic Scenario</h4>
						<div class="text-2xl font-bold text-red-600">${{ forecast.pessimistic.toLocaleString() }}</div>
						<div class="text-sm text-red-600">Operating Account Deficit</div>
					</div>

					<div class="text-center p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg">
						<h4 class="font-semibold text-yellow-800 mb-2">Realistic Scenario</h4>
						<div class="text-2xl font-bold text-yellow-600">${{ forecast.realistic.toLocaleString() }}</div>
						<div class="text-sm text-yellow-600">Break-even Point</div>
					</div>

					<div class="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
						<h4 class="font-semibold text-green-800 mb-2">Optimistic Scenario</h4>
						<div class="text-2xl font-bold text-green-600">${{ forecast.optimistic.toLocaleString() }}</div>
						<div class="text-sm text-green-600">With Cost Controls</div>
					</div>
				</div>

				<div class="mt-6 p-4 bg-gray-50 rounded-lg">
					<h4 class="font-semibold mb-2">Forecast Assumptions:</h4>
					<ul class="text-sm space-y-1 text-gray-700">
						<li>• Current spending patterns continue through year-end</li>
						<li>• Insurance payments remain at $6,053/month</li>
						<li>• No major unexpected expenses or emergency repairs</li>
						<li>• Assessment collections remain stable</li>
					</ul>
				</div>
			</UCard>

			<!-- Navigation -->
			<div class="mt-8 flex justify-center space-x-4">
				<UButton to="/financials/" color="blue" size="lg">
					<UIcon name="i-heroicons-arrow-left" class="w-5 h-5 mr-2" />
					Back to Dashboard
				</UButton>

				<UButton to="/financials/hoa/reconciliation" color="green" size="lg">
					<UIcon name="i-heroicons-document-text" class="w-5 h-5 mr-2" />
					Monthly Reports
				</UButton>
			</div>
		</div>
	</div>
</template>

<script setup>
import { Bar } from 'vue-chartjs';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// SEO
useHead({
	title: 'Budget Analysis - Lenox Plaza HOA',
	meta: [{ name: 'description', content: 'Comprehensive budget vs actual analysis for Lenox Plaza HOA 2025' }],
});

// Chart view selection
const selectedView = ref('major');
const chartViews = [
	{ key: 'major', label: 'Major Categories' },
	{ key: 'detailed', label: 'All Line Items' },
];

// Performance metrics
const performanceMetrics = ref({
	ytdRevenue: 213943,
	ytdExpenses: 195567,
	netOperating: 18376,
	revenueVariance: 2.1,
	expenseVariance: 8.3,
	accuracy: 72,
});

// Budget analysis data
const budgetAnalysis = ref([
	{
		category: 'Assessment Income',
		budget: 180000,
		actual: 168000,
		variance: -12000,
		percent: -6.7,
		status: 'Under Budget',
		statusColor: 'red',
	},
	{
		category: 'Insurance',
		budget: 12000,
		actual: 36318,
		variance: 24318,
		percent: 202.7,
		status: 'Over Budget',
		statusColor: 'red',
	},
	{
		category: 'Management Fees',
		budget: 8400,
		actual: 5600,
		variance: -2800,
		percent: -33.3,
		status: 'Under Budget',
		statusColor: 'green',
	},
	{
		category: 'Utilities',
		budget: 6000,
		actual: 8000,
		variance: 2000,
		percent: 33.3,
		status: 'Over Budget',
		statusColor: 'yellow',
	},
	{
		category: 'Maintenance & Repairs',
		budget: 15000,
		actual: 18500,
		variance: 3500,
		percent: 23.3,
		status: 'Over Budget',
		statusColor: 'yellow',
	},
	{
		category: 'Waste Management',
		budget: 5436,
		actual: 3851,
		variance: -1585,
		percent: -29.2,
		status: 'Under Budget',
		statusColor: 'green',
	},
]);

// Budget table columns
const budgetColumns = [
	{ key: 'category', label: 'Category', class: 'font-semibold' },
	{ key: 'budget', label: 'Budget', class: 'text-right' },
	{ key: 'actual', label: 'Actual YTD', class: 'text-right' },
	{ key: 'variance', label: 'Variance', class: 'text-right' },
	{ key: 'percent', label: '% Change', class: 'text-right' },
	{ key: 'status', label: 'Status', class: 'text-center' },
];

// Revenue analysis
const revenueAnalysis = ref([
	{
		category: 'Monthly Assessments',
		budget: 168000,
		actual: 156000,
		variance: -12000,
		percent: -7.1,
	},
	{
		category: 'Special Assessments',
		budget: 50000,
		actual: 46133,
		variance: -3867,
		percent: -7.7,
	},
	{
		category: 'Interest Income',
		budget: 500,
		actual: 818,
		variance: 318,
		percent: 63.6,
	},
	{
		category: 'Other Income',
		budget: 2000,
		actual: 10992,
		variance: 8992,
		percent: 449.6,
	},
]);

// Expense analysis
const expenseAnalysis = ref([
	{
		category: 'Insurance',
		budget: 12000,
		actual: 36318,
		variance: 24318,
		percent: 202.7,
	},
	{
		category: 'Utilities',
		budget: 6000,
		actual: 8000,
		variance: 2000,
		percent: 33.3,
	},
	{
		category: 'Maintenance',
		budget: 15000,
		actual: 18500,
		variance: 3500,
		percent: 23.3,
	},
	{
		category: 'Management',
		budget: 8400,
		actual: 5600,
		variance: -2800,
		percent: -33.3,
	},
]);

// Budget issues
const budgetIssues = ref([
	{
		title: 'Insurance Cost Explosion',
		description:
			'Insurance costs are 203% over budget at $36,318 vs budgeted $12,000. This is the single largest budget variance.',
		color: 'red',
	},
	{
		title: 'Assessment Collection Shortfall',
		description: 'Monthly assessments are $12,000 under budget, creating a revenue gap that compounds monthly.',
		color: 'yellow',
	},
	{
		title: 'Maintenance Overruns',
		description: 'Maintenance expenses are 23% over budget, indicating either underestimation or unexpected repairs.',
		color: 'orange',
	},
]);

// Budget recommendations
const budgetRecommendations = ref([
	{
		title: 'Emergency Budget Revision',
		description: 'Immediately revise 2025 budget to reflect actual insurance costs and spending patterns.',
		impact: 'Critical for accurate financial planning',
	},
	{
		title: 'Insurance Payment Restructure',
		description: 'Negotiate quarterly insurance payments to reduce monthly cash flow volatility.',
		impact: 'Improve cash flow predictability',
	},
	{
		title: '2026 Assessment Increase',
		description: 'Plan for 8-12% assessment increase to cover insurance cost increases and maintain reserves.',
		impact: 'Ensure long-term financial stability',
	},
	{
		title: 'Monthly Budget Reviews',
		description: 'Implement monthly budget vs actual reviews to catch variances early.',
		impact: 'Proactive financial management',
	},
]);

// Forecast data
const forecast = ref({
	pessimistic: -25000,
	realistic: 5000,
	optimistic: 15000,
});

// Chart data
const chartData = computed(() => {
	const majorCategories = [
		{ name: 'Insurance', budget: 12000, actual: 36318 },
		{ name: 'Assessments', budget: 168000, actual: 156000 },
		{ name: 'Utilities', budget: 6000, actual: 8000 },
		{ name: 'Maintenance', budget: 15000, actual: 18500 },
		{ name: 'Management', budget: 8400, actual: 5600 },
	];

	return {
		labels: majorCategories.map((cat) => cat.name),
		datasets: [
			{
				label: 'Budget',
				data: majorCategories.map((cat) => cat.budget),
				backgroundColor: 'rgba(59, 130, 246, 0.5)',
				borderColor: 'rgba(59, 130, 246, 1)',
				borderWidth: 1,
			},
			{
				label: 'Actual',
				data: majorCategories.map((cat) => cat.actual),
				backgroundColor: 'rgba(239, 68, 68, 0.5)',
				borderColor: 'rgba(239, 68, 68, 1)',
				borderWidth: 1,
			},
		],
	};
});

// Chart options
const chartOptions = ref({
	responsive: true,
	maintainAspectRatio: false,
	plugins: {
		legend: {
			position: 'top',
		},
		title: {
			display: true,
			text: 'Budget vs Actual Comparison - Major Categories',
		},
	},
	scales: {
		y: {
			beginAtZero: true,
			ticks: {
				callback: function (value) {
					return '$' + value.toLocaleString();
				},
			},
		},
	},
});

// Helper functions
const getVarianceColor = (variance) => {
	if (variance > 1000) return 'text-red-600';
	if (variance < -1000) return 'text-green-600';
	return 'text-gray-600';
};

const getPercentColor = (percent) => {
	if (Math.abs(percent) > 20) return 'text-red-600';
	if (Math.abs(percent) > 10) return 'text-yellow-600';
	return 'text-green-600';
};
</script>

<style scoped>
.transition-all {
	transition: all 0.2s ease-in-out;
}
</style>
