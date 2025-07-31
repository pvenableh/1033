<template>
	<div class="space-y-6">
		<!-- Budget Performance Header -->
		<UCard>
			<template #header>
				<div class="flex items-center justify-between">
					<div class="flex items-center">
						<UIcon name="i-heroicons-chart-bar-square" class="w-6 h-6 text-purple-600 mr-3" />
						<h2 class="text-xl font-bold text-gray-900">2025 Budget Analysis</h2>
					</div>
					<div class="flex items-center space-x-4">
						<div class="text-right text-sm">
							<div class="text-gray-600">Last Updated</div>
							<div class="font-medium">{{ lastUpdated?.toLocaleDateString() || 'Not loaded' }}</div>
						</div>
						<UButton @click="refreshAnalysis" size="sm" variant="outline" :loading="loading">
							<UIcon name="i-heroicons-arrow-path" class="w-4 h-4 mr-1" />
							Refresh
						</UButton>
					</div>
				</div>
			</template>

			<!-- Performance Metrics -->
			<div class="grid grid-cols-1 md:grid-cols-5 gap-6">
				<div class="text-center">
					<div class="text-2xl font-bold text-gray-900">${{ budgetSummary.budget.toLocaleString() }}</div>
					<div class="text-sm text-gray-600">Total Budget</div>
					<div class="text-xs text-gray-500">Annual allocation</div>
				</div>
				<div class="text-center">
					<div class="text-2xl font-bold text-orange-600">${{ budgetSummary.actual.toLocaleString() }}</div>
					<div class="text-sm text-gray-600">Actual Spent</div>
					<div class="text-xs text-orange-600">{{ budgetSummary.percentSpent.toFixed(1) }}% utilized</div>
				</div>
				<div class="text-center">
					<div class="text-2xl font-bold" :class="remainingColor">${{ budgetSummary.remaining.toLocaleString() }}</div>
					<div class="text-sm text-gray-600">{{ budgetSummary.remaining >= 0 ? 'Remaining' : 'Over Budget' }}</div>
					<div class="text-xs" :class="remainingColor">{{ monthsRemaining.toFixed(1) }} months left</div>
				</div>
				<div class="text-center">
					<div class="text-2xl font-bold text-red-600">{{ overBudgetItemsCount }}</div>
					<div class="text-sm text-gray-600">Items Over Budget</div>
					<div class="text-xs text-red-600">${{ totalOverageAmount.toLocaleString() }} excess</div>
				</div>
				<div class="text-center">
					<div class="text-2xl font-bold" :class="projectionColor">${{ yearEndProjection.toLocaleString() }}</div>
					<div class="text-sm text-gray-600">Year-End Projection</div>
					<div class="text-xs" :class="projectionColor">{{ projectionStatus }}</div>
				</div>
			</div>
		</UCard>

		<!-- Budget Alerts -->
		<div v-if="budgetAlerts.length > 0" class="space-y-3">
			<div v-for="alert in budgetAlerts.slice(0, 3)" :key="`${alert.type}-${alert.title}`">
				<UAlert
					:color="alert.severity === 'critical' ? 'red' : 'yellow'"
					variant="soft"
					:title="alert.title"
					:description="alert.message"
				/>
			</div>
		</div>

		<!-- Budget vs Actual Chart -->
		<UCard>
			<template #header>
				<div class="flex items-center justify-between">
					<h3 class="text-lg font-bold text-gray-900">Budget vs Actual Comparison</h3>
					<div class="flex space-x-2">
						<UButton
							v-for="view in chartViews"
							:key="view"
							:variant="selectedChartView === view ? 'solid' : 'outline'"
							size="sm"
							@click="selectedChartView = view"
						>
							{{ view }}
						</UButton>
					</div>
				</div>
			</template>
			<div class="h-80">
				<Bar :data="chartData" :options="chartOptions" />
			</div>
		</UCard>

		<!-- Detailed Category Analysis -->
		<UCard>
			<template #header>
				<div class="flex items-center justify-between">
					<h3 class="text-lg font-bold text-gray-900">Category Performance Analysis</h3>
					<USelectMenu
						v-model="selectedCategoryFilter"
						:options="categoryFilterOptions"
						placeholder="Filter categories"
					/>
				</div>
			</template>

			<div class="space-y-4">
				<div
					v-for="category in filteredCategoryAnalysis"
					:key="category.name"
					class="border rounded-lg p-4"
					:class="getCategoryBorderClass(category)"
				>
					<!-- Category Header -->
					<div class="flex items-center justify-between mb-4">
						<div>
							<h4 class="text-lg font-semibold text-gray-900">{{ category.name }}</h4>
							<p class="text-sm text-gray-600">
								{{ category.count }} budget items • {{ category.actualTransactionCount }} transactions YTD
							</p>
						</div>
						<div class="text-right">
							<UBadge :color="getCategoryBadgeColor(category)" variant="soft" size="sm">
								{{ getCategoryStatus(category) }}
							</UBadge>
							<div class="text-sm text-gray-600 mt-1">{{ category.percentSpent.toFixed(1) }}% of budget spent</div>
						</div>
					</div>

					<!-- Category Metrics -->
					<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
						<div class="text-center p-3 bg-gray-50 rounded">
							<div class="text-lg font-bold text-gray-900">${{ category.totalYearly.toLocaleString() }}</div>
							<div class="text-xs text-gray-600">Annual Budget</div>
						</div>
						<div class="text-center p-3 bg-blue-50 rounded">
							<div class="text-lg font-bold text-blue-600">${{ category.totalActual.toLocaleString() }}</div>
							<div class="text-xs text-gray-600">Actual YTD</div>
						</div>
						<div class="text-center p-3" :class="category.totalRemaining >= 0 ? 'bg-green-50' : 'bg-red-50'">
							<div class="text-lg font-bold" :class="category.totalRemaining >= 0 ? 'text-green-600' : 'text-red-600'">
								${{ Math.abs(category.totalRemaining).toLocaleString() }}
							</div>
							<div class="text-xs text-gray-600">{{ category.totalRemaining >= 0 ? 'Remaining' : 'Over Budget' }}</div>
						</div>
						<div class="text-center p-3 bg-purple-50 rounded">
							<div class="text-lg font-bold text-purple-600">${{ category.projectedYearEnd.toLocaleString() }}</div>
							<div class="text-xs text-gray-600">Projected Total</div>
						</div>
					</div>

					<!-- Progress Bar -->
					<div class="w-full bg-gray-200 rounded-full h-4 mb-4">
						<div
							class="h-4 rounded-full transition-all duration-500"
							:class="getProgressBarClass(category.percentSpent)"
							:style="`width: ${Math.min(category.percentSpent, 100)}%`"
						></div>
					</div>

					<!-- Budget Items in Category -->
					<div class="space-y-3">
						<h5 class="font-medium text-gray-900">Budget Items:</h5>
						<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
							<div
								v-for="item in category.items.slice(0, showAllItems[category.name] ? category.items.length : 4)"
								:key="item.id"
								class="border rounded p-3"
								:class="getItemBorderClass(item)"
							>
								<div class="flex justify-between items-start mb-2">
									<div class="flex-1">
										<h6 class="font-medium text-sm text-gray-900">{{ item.description }}</h6>
										<p class="text-xs text-gray-500">${{ item.monthly.toLocaleString() }}/month budgeted</p>
									</div>
									<UBadge :color="getItemBadgeColor(item)" variant="soft" size="sm">
										{{ getItemStatus(item) }}
									</UBadge>
								</div>

								<div class="grid grid-cols-2 gap-2 text-xs">
									<div>
										<span class="text-gray-500">Budget:</span>
										<span class="font-medium ml-1">${{ item.yearly.toLocaleString() }}</span>
									</div>
									<div>
										<span class="text-gray-500">Actual:</span>
										<span class="font-medium ml-1">${{ item.actualCost.toLocaleString() }}</span>
									</div>
								</div>

								<div class="w-full bg-gray-200 rounded-full h-2 mt-2">
									<div
										class="h-2 rounded-full transition-all duration-300"
										:class="getItemProgressBarClass(item.percentSpent)"
										:style="`width: ${Math.min(item.percentSpent, 100)}%`"
									></div>
								</div>

								<!-- Recent transactions for this item -->
								<div v-if="item.recentTransactions?.length > 0" class="mt-2 pt-2 border-t">
									<p class="text-xs text-gray-600 mb-1">Recent activity:</p>
									<div class="space-y-1">
										<div
											v-for="txn in item.recentTransactions.slice(0, 2)"
											:key="`${txn.date}-${txn.amount}`"
											class="flex justify-between text-xs"
										>
											<span class="text-gray-600">{{ txn.date }}</span>
											<span class="font-medium">${{ txn.amount.toLocaleString() }}</span>
										</div>
									</div>
								</div>

								<!-- Comments/Notes -->
								<div v-if="item.comment" class="mt-2 pt-2 border-t">
									<p class="text-xs text-gray-600 italic">{{ item.comment }}</p>
								</div>
							</div>
						</div>

						<!-- Show More/Less Button -->
						<div v-if="category.items.length > 4" class="text-center">
							<UButton @click="toggleShowAllItems(category.name)" variant="ghost" size="sm">
								{{ showAllItems[category.name] ? 'Show Less' : `Show All ${category.items.length} Items` }}
								<UIcon
									:name="showAllItems[category.name] ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
									class="w-4 h-4 ml-1"
								/>
							</UButton>
						</div>
					</div>

					<!-- Category Recommendations -->
					<div v-if="category.recommendations?.length > 0" class="mt-4 pt-4 border-t">
						<h5 class="font-medium text-gray-900 mb-2">Recommendations:</h5>
						<div class="space-y-2">
							<div
								v-for="rec in category.recommendations"
								:key="rec.id"
								class="flex items-start space-x-2 p-2 bg-blue-50 rounded"
							>
								<UIcon :name="rec.icon" class="w-4 h-4 mt-0.5 text-blue-600" />
								<div>
									<p class="text-sm font-medium text-blue-900">{{ rec.title }}</p>
									<p class="text-xs text-blue-700">{{ rec.description }}</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</UCard>

		<!-- Year-End Projections -->
		<UCard>
			<template #header>
				<h3 class="text-lg font-bold text-gray-900">Year-End Financial Projections</h3>
			</template>
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<div>
					<h4 class="font-medium text-gray-900 mb-4">Spending Scenarios</h4>
					<div class="space-y-3">
						<div
							v-for="scenario in spendingScenarios"
							:key="scenario.name"
							class="flex justify-between items-center p-3 border rounded"
							:class="scenario.realistic ? 'border-blue-200 bg-blue-50' : 'border-gray-200'"
						>
							<div>
								<div class="font-medium">{{ scenario.name }}</div>
								<div class="text-sm text-gray-600">{{ scenario.description }}</div>
							</div>
							<div class="text-right">
								<div
									class="font-semibold"
									:class="scenario.projected > budgetSummary.budget ? 'text-red-600' : 'text-green-600'"
								>
									${{ scenario.projected.toLocaleString() }}
								</div>
								<div class="text-xs text-gray-500">projected total</div>
							</div>
						</div>
					</div>
				</div>

				<div>
					<h4 class="font-medium text-gray-900 mb-4">Action Plan</h4>
					<div class="space-y-3">
						<div v-for="action in actionPlan" :key="action.id" class="flex items-start space-x-3">
							<UIcon :name="action.icon" class="w-5 h-5 mt-0.5" :class="action.color" />
							<div>
								<h5 class="font-medium text-gray-900">{{ action.title }}</h5>
								<p class="text-sm text-gray-600 mt-1">{{ action.description }}</p>
								<div class="flex items-center mt-2 space-x-2">
									<UBadge
										:color="action.priority === 'critical' ? 'red' : action.priority === 'high' ? 'yellow' : 'blue'"
										variant="soft"
										size="sm"
									>
										{{ action.priority.toUpperCase() }}
									</UBadge>
									<span class="text-xs text-gray-500">{{ action.timeline }}</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</UCard>
	</div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { Bar } from 'vue-chartjs';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { useReconciliationData } from '~/composables/useReconciliationData';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Use both composables
const { getOperatingData } = useReconciliationData();
const {
	budgetItems,
	budgetSummary,
	categorizedBudget,
	overBudgetItems,
	budgetAlerts,
	loadOperatingBudget,
	loading,
	lastUpdated,
} = useBudgetData();

// Component state
const selectedChartView = ref('Budget vs Actual');
const selectedCategoryFilter = ref('');
const showAllItems = ref({});

const chartViews = ['Budget vs Actual', 'YTD Spending', 'Variance Analysis'];

onMounted(async () => {
	await loadOperatingBudget();
});

// Get current operating data for transaction mapping
const currentOperatingData = computed(() => getOperatingData('June 2025'));

// Budget metrics
const overBudgetItemsCount = computed(() => overBudgetItems.value.length);

const totalOverageAmount = computed(() =>
	overBudgetItems.value.reduce((sum, item) => sum + (item.actualCost - item.yearly), 0),
);

const remainingColor = computed(() => (budgetSummary.value.remaining < 0 ? 'text-red-600' : 'text-green-600'));

const monthsRemaining = computed(() => {
	// Assuming we're 6 months into the year
	return 6;
});

// Year-end projections
const yearEndProjection = computed(() => {
	// Simple linear projection based on 6 months of data
	const currentSpent = budgetSummary.value.actual;
	const monthsElapsed = 6;
	const remainingMonths = 6;
	const avgMonthlySpend = currentSpent / monthsElapsed;
	return currentSpent + avgMonthlySpend * remainingMonths;
});

const projectionStatus = computed(() =>
	yearEndProjection.value > budgetSummary.value.budget ? 'Over Budget' : 'Under Budget',
);

const projectionColor = computed(() =>
	yearEndProjection.value > budgetSummary.value.budget ? 'text-red-600' : 'text-green-600',
);

// Category analysis with reconciliation data
const categoryAnalysis = computed(() => {
	return Object.values(categorizedBudget.value)
		.map((category) => {
			// Calculate projections and add transaction data
			const avgMonthlySpend = category.totalActual / 6;
			const projectedYearEnd = category.totalActual + avgMonthlySpend * 6;

			// Try to match transactions (simplified)
			let actualTransactionCount = 0;
			if (currentOperatingData.value?.withdrawals) {
				actualTransactionCount = currentOperatingData.value.withdrawals.filter((txn) => {
					// Simple category matching logic
					return matchTransactionToCategory(txn, category.name);
				}).length;
			}

			// Generate recommendations based on performance
			const recommendations = generateCategoryRecommendations(category);

			// Add recent transaction data to items
			const itemsWithTransactions = category.items.map((item) => ({
				...item,
				recentTransactions: findRecentTransactionsForItem(item),
			}));

			return {
				...category,
				projectedYearEnd,
				actualTransactionCount,
				recommendations,
				items: itemsWithTransactions,
			};
		})
		.sort((a, b) => Math.abs(b.percentSpent - 100) - Math.abs(a.percentSpent - 100));
});

// Filter options
const categoryFilterOptions = computed(() => [
	{ label: 'All Categories', value: '' },
	{ label: 'Over Budget', value: 'over' },
	{ label: 'At Risk', value: 'risk' },
	{ label: 'Under Utilized', value: 'under' },
]);

const filteredCategoryAnalysis = computed(() => {
	let categories = categoryAnalysis.value;

	switch (selectedCategoryFilter.value) {
		case 'over':
			categories = categories.filter((cat) => cat.percentSpent > 100);
			break;
		case 'risk':
			categories = categories.filter((cat) => cat.percentSpent > 80 && cat.percentSpent <= 100);
			break;
		case 'under':
			categories = categories.filter((cat) => cat.percentSpent < 50);
			break;
		default:
			// All categories
			break;
	}

	return categories;
});

// Chart data
const chartData = computed(() => {
	const categories = Object.values(categorizedBudget.value);
	const labels = categories.map((cat) => cat.name);

	const datasets = [];

	if (selectedChartView.value === 'Budget vs Actual') {
		datasets.push(
			{
				label: 'Budget',
				data: categories.map((cat) => cat.totalYearly),
				backgroundColor: 'rgba(59, 130, 246, 0.5)',
				borderColor: 'rgb(59, 130, 246)',
				borderWidth: 1,
			},
			{
				label: 'Actual',
				data: categories.map((cat) => cat.totalActual),
				backgroundColor: 'rgba(239, 68, 68, 0.5)',
				borderColor: 'rgb(239, 68, 68)',
				borderWidth: 1,
			},
		);
	} else if (selectedChartView.value === 'Variance Analysis') {
		datasets.push({
			label: 'Variance',
			data: categories.map((cat) => cat.totalRemaining),
			backgroundColor: categories.map((cat) =>
				cat.totalRemaining < 0 ? 'rgba(239, 68, 68, 0.5)' : 'rgba(34, 197, 94, 0.5)',
			),
			borderColor: categories.map((cat) => (cat.totalRemaining < 0 ? 'rgb(239, 68, 68)' : 'rgb(34, 197, 94)')),
			borderWidth: 1,
		});
	}

	return { labels, datasets };
});

const chartOptions = ref({
	responsive: true,
	maintainAspectRatio: false,
	plugins: {
		legend: {
			position: 'top',
		},
	},
	scales: {
		y: {
			beginAtZero: true,
			ticks: {
				callback: (value) => '$' + value.toLocaleString(),
			},
		},
	},
});

// Spending scenarios
const spendingScenarios = computed(() => [
	{
		name: 'Conservative',
		description: 'Maintain current spending pace',
		projected: yearEndProjection.value,
		realistic: false,
	},
	{
		name: 'Likely',
		description: 'Account for seasonal increases',
		projected: yearEndProjection.value * 1.1,
		realistic: true,
	},
	{
		name: 'Worst Case',
		description: 'Include all pending expenses',
		projected: yearEndProjection.value * 1.25,
		realistic: false,
	},
]);

// Action plan
const actionPlan = ref([
	{
		id: 1,
		title: 'Legal Fee Investigation',
		description: 'Conduct immediate review of all legal expenses and pending matters',
		priority: 'critical',
		timeline: 'This week',
		icon: 'i-heroicons-scale',
		color: 'text-red-600',
	},
	{
		id: 2,
		title: 'Budget Revision',
		description: 'Revise 2025 budget to reflect actual spending patterns',
		priority: 'high',
		timeline: 'Within 30 days',
		icon: 'i-heroicons-pencil-square',
		color: 'text-yellow-600',
	},
	{
		id: 3,
		title: 'Spending Controls',
		description: 'Implement approval procedures for expenses over $1,000',
		priority: 'high',
		timeline: 'Next board meeting',
		icon: 'i-heroicons-lock-closed',
		color: 'text-yellow-600',
	},
	{
		id: 4,
		title: 'Monthly Reviews',
		description: 'Establish monthly budget vs actual review process',
		priority: 'medium',
		timeline: 'Ongoing',
		icon: 'i-heroicons-calendar',
		color: 'text-blue-600',
	},
]);

// Helper functions
const matchTransactionToCategory = (transaction, categoryName) => {
	// Simplified matching logic
	const vendor = transaction.vendor?.toLowerCase() || '';
	const category = transaction.category?.toLowerCase() || '';

	switch (categoryName) {
		case 'Insurance':
			return vendor.includes('insurance') || category.includes('insurance');
		case 'Contract Services':
			return vendor.includes('vte') || vendor.includes('management') || category.includes('service');
		case 'Utilities':
			return (
				vendor.includes('fpl') || vendor.includes('teco') || vendor.includes('water') || category.includes('utilities')
			);
		case 'Administrative':
			return vendor.includes('tempkins') || category.includes('legal') || category.includes('admin');
		case 'Maintenance':
			return category.includes('maintenance') || vendor.includes('repair');
		default:
			return false;
	}
};

const findRecentTransactionsForItem = (item) => {
	// Try to find recent transactions related to this budget item
	const withdrawals = currentOperatingData.value?.withdrawals || [];
	return withdrawals
		.filter((txn) => {
			const vendor = txn.vendor?.toLowerCase() || '';
			const description = item.description.toLowerCase();
			return vendor.includes(description.split(' ')[0]) || description.includes(vendor.split(' ')[0]);
		})
		.slice(0, 3);
};

const generateCategoryRecommendations = (category) => {
	const recs = [];

	if (category.percentSpent > 150) {
		recs.push({
			id: 1,
			title: 'Emergency Review Required',
			description: 'Category is severely over budget and requires immediate attention',
			icon: 'i-heroicons-exclamation-triangle',
		});
	} else if (category.percentSpent > 100) {
		recs.push({
			id: 2,
			title: 'Budget Adjustment Needed',
			description: 'Consider revising budget allocation for this category',
			icon: 'i-heroicons-adjustments-horizontal',
		});
	} else if (category.percentSpent < 25) {
		recs.push({
			id: 3,
			title: 'Review Budget Allocation',
			description: 'Category appears over-budgeted, consider reallocation',
			icon: 'i-heroicons-arrow-path',
		});
	}

	return recs;
};

const toggleShowAllItems = (categoryName) => {
	showAllItems.value[categoryName] = !showAllItems.value[categoryName];
};

const refreshAnalysis = async () => {
	await loadOperatingBudget();
};

// Status and styling functions
const getCategoryStatus = (category) => {
	if (category.percentSpent > 150) return 'Critical';
	if (category.percentSpent > 100) return 'Over Budget';
	if (category.percentSpent > 80) return 'At Risk';
	if (category.percentSpent < 25) return 'Under Utilized';
	return 'On Track';
};

const getCategoryBadgeColor = (category) => {
	if (category.percentSpent > 150) return 'red';
	if (category.percentSpent > 100) return 'red';
	if (category.percentSpent > 80) return 'yellow';
	if (category.percentSpent < 25) return 'blue';
	return 'green';
};

const getCategoryBorderClass = (category) => {
	if (category.percentSpent > 150) return 'border-red-300';
	if (category.percentSpent > 100) return 'border-red-200';
	if (category.percentSpent > 80) return 'border-yellow-200';
	return 'border-gray-200';
};

const getProgressBarClass = (percentSpent) => {
	if (percentSpent > 150) return 'bg-red-600';
	if (percentSpent > 100) return 'bg-red-500';
	if (percentSpent > 80) return 'bg-yellow-500';
	return 'bg-green-500';
};

const getItemStatus = (item) => {
	if (item.percentSpent > 100) return 'Over';
	if (item.percentSpent > 90) return 'Critical';
	if (item.percentSpent > 80) return 'High';
	return 'Normal';
};

const getItemBadgeColor = (item) => {
	if (item.percentSpent > 100) return 'red';
	if (item.percentSpent > 90) return 'red';
	if (item.percentSpent > 80) return 'yellow';
	return 'green';
};

const getItemBorderClass = (item) => {
	if (item.percentSpent > 100) return 'border-red-200';
	if (item.percentSpent > 90) return 'border-red-100';
	if (item.percentSpent > 80) return 'border-yellow-100';
	return 'border-gray-200';
};

const getItemProgressBarClass = (percentSpent) => {
	if (percentSpent > 100) return 'bg-red-500';
	if (percentSpent > 90) return 'bg-red-400';
	if (percentSpent > 80) return 'bg-yellow-400';
	return 'bg-green-400';
};
</script>

<style scoped>
.transition-all {
	transition: all 0.3s ease-in-out;
}
</style>
