<template>
	<div class="space-y-6">
		<!-- Budget Summary Header -->
		<UCard>
			<template #header>
				<div class="flex items-center justify-between">
					<div class="flex items-center">
						<UIcon name="i-heroicons-calculator" class="w-6 h-6 text-blue-600 mr-3" />
						<h2 class="text-xl font-bold text-gray-900">2025 Operating Budget Tracker</h2>
					</div>
					<div class="flex items-center space-x-4">
						<UButton @click="refreshData" size="sm" variant="outline">
							<UIcon name="i-heroicons-arrow-path" class="w-4 h-4 mr-1" />
							Refresh
						</UButton>
						<UButton @click="exportReport" size="sm" color="green">
							<UIcon name="i-heroicons-document-arrow-down" class="w-4 h-4 mr-1" />
							Export
						</UButton>
					</div>
				</div>
			</template>

			<div class="grid grid-cols-1 md:grid-cols-4 gap-6">
				<div class="text-center">
					<div class="text-2xl font-bold text-gray-900">${{ totalBudget.toLocaleString() }}</div>
					<div class="text-sm text-gray-600">Total Annual Budget</div>
				</div>
				<div class="text-center">
					<div class="text-2xl font-bold text-orange-600">${{ totalSpent.toLocaleString() }}</div>
					<div class="text-sm text-gray-600">Spent YTD</div>
					<div class="text-xs text-orange-600">{{ spentPercentage.toFixed(1) }}% utilized</div>
				</div>
				<div class="text-center">
					<div class="text-2xl font-bold text-green-600">${{ totalRemaining.toLocaleString() }}</div>
					<div class="text-sm text-gray-600">Remaining Budget</div>
				</div>
				<div class="text-center">
					<div class="text-2xl font-bold" :class="projectionColor">${{ projectedOverrun.toLocaleString() }}</div>
					<div class="text-sm text-gray-600">Year-End Projection</div>
					<div class="text-xs" :class="projectionColor">
						{{ projectedOverrun >= 0 ? 'Surplus' : 'Deficit' }}
					</div>
				</div>
			</div>
		</UCard>

		<!-- Category Breakdown -->
		<UCard>
			<template #header>
				<div class="flex items-center justify-between">
					<h3 class="text-lg font-bold text-gray-900">Budget by Category</h3>
					<div class="flex space-x-2">
						<UButton
							v-for="view in ['All', 'Over Budget', 'At Risk']"
							:key="view"
							:variant="selectedView === view ? 'solid' : 'outline'"
							size="sm"
							@click="selectedView = view"
						>
							{{ view }}
						</UButton>
					</div>
				</div>
			</template>

			<div class="space-y-4">
				<div
					v-for="category in filteredCategories"
					:key="category.name"
					class="border rounded-lg p-4"
					:class="getCategoryBorderColor(category)"
				>
					<div class="flex items-center justify-between mb-3">
						<div>
							<h4 class="font-semibold text-gray-900">{{ category.name }}</h4>
							<p class="text-sm text-gray-600">{{ category.items.length }} line items</p>
						</div>
						<div class="text-right">
							<UBadge :color="getCategoryStatusColor(category)" variant="soft" size="sm">
								{{ getCategoryStatus(category) }}
							</UBadge>
							<div class="text-sm text-gray-600 mt-1">{{ category.percentSpent.toFixed(1) }}% spent</div>
						</div>
					</div>

					<div class="grid grid-cols-3 gap-4 mb-3 text-sm">
						<div>
							<div class="text-gray-600">Budget</div>
							<div class="font-semibold">${{ category.totalYearly.toLocaleString() }}</div>
						</div>
						<div>
							<div class="text-gray-600">Actual</div>
							<div class="font-semibold">${{ category.totalActual.toLocaleString() }}</div>
						</div>
						<div>
							<div class="text-gray-600">Variance</div>
							<div class="font-semibold" :class="category.totalRemaining >= 0 ? 'text-green-600' : 'text-red-600'">
								{{ category.totalRemaining >= 0 ? '+' : '' }}${{ category.totalRemaining.toLocaleString() }}
							</div>
						</div>
					</div>

					<div class="w-full bg-gray-200 rounded-full h-3 mb-3">
						<div
							class="h-3 rounded-full transition-all duration-500"
							:class="getProgressBarColor(category.percentSpent)"
							:style="`width: ${Math.min(category.percentSpent, 100)}%`"
						></div>
					</div>

					<!-- Top Items in Category -->
					<div class="space-y-2">
						<div
							v-for="item in category.topItems"
							:key="item.description"
							class="flex justify-between items-center text-sm bg-gray-50 rounded p-2"
						>
							<div>
								<span class="font-medium">{{ item.description }}</span>
								<div class="text-xs text-gray-500">${{ item.monthly.toLocaleString() }}/month</div>
							</div>
							<div class="text-right">
								<div class="font-medium">${{ item.actualCost.toLocaleString() }}</div>
								<div class="text-xs" :class="item.actualCost > item.yearly ? 'text-red-600' : 'text-gray-500'">
									of ${{ item.yearly.toLocaleString() }}
								</div>
							</div>
						</div>
					</div>

					<!-- Show All Items Toggle -->
					<div v-if="category.items.length > 3" class="mt-3">
						<UButton @click="toggleCategoryExpanded(category.name)" variant="ghost" size="sm" class="w-full">
							{{ expandedCategories.has(category.name) ? 'Show Less' : `Show All ${category.items.length} Items` }}
							<UIcon
								:name="expandedCategories.has(category.name) ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
								class="w-4 h-4 ml-1"
							/>
						</UButton>
					</div>

					<!-- Expanded Items -->
					<div v-if="expandedCategories.has(category.name)" class="mt-3 space-y-2">
						<div
							v-for="item in category.items.slice(3)"
							:key="item.description"
							class="flex justify-between items-center text-sm bg-gray-50 rounded p-2"
						>
							<div>
								<span class="font-medium">{{ item.description }}</span>
								<div class="text-xs text-gray-500">
									{{ item.comment ? item.comment.slice(0, 50) + '...' : 'No notes' }}
								</div>
							</div>
							<div class="text-right">
								<div class="font-medium">${{ item.actualCost.toLocaleString() }}</div>
								<div class="text-xs" :class="item.actualCost > item.yearly ? 'text-red-600' : 'text-gray-500'">
									of ${{ item.yearly.toLocaleString() }}
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</UCard>

		<!-- Critical Items Requiring Attention -->
		<UCard>
			<template #header>
				<div class="flex items-center">
					<UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-red-600 mr-2" />
					<h3 class="text-lg font-bold text-gray-900">Items Requiring Immediate Attention</h3>
				</div>
			</template>

			<div class="space-y-3">
				<div
					v-for="item in criticalItems"
					:key="item.description"
					class="flex items-start space-x-3 p-3 border border-red-200 rounded-lg bg-red-50"
				>
					<UIcon name="i-heroicons-exclamation-circle" class="w-5 h-5 text-red-600 mt-0.5" />
					<div class="flex-1">
						<h4 class="font-medium text-red-900">{{ item.description }}</h4>
						<p class="text-sm text-red-800 mt-1">
							{{ item.actualCost > item.yearly ? 'Over budget by' : 'At' }}
							${{ Math.abs(item.actualCost - item.yearly).toLocaleString() }} ({{
								((item.actualCost / item.yearly) * 100).toFixed(1)
							}}% of budget)
						</p>
						<div v-if="item.comment" class="text-xs text-red-700 mt-1 font-medium">Note: {{ item.comment }}</div>
					</div>
					<div class="text-right">
						<UBadge color="red" variant="solid" size="sm">
							{{ item.actualCost > item.yearly ? 'OVER' : 'CRITICAL' }}
						</UBadge>
					</div>
				</div>
			</div>
		</UCard>

		<!-- Budget Projections -->
		<UCard>
			<template #header>
				<h3 class="text-lg font-bold text-gray-900">Year-End Projections</h3>
			</template>

			<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<div>
					<h4 class="font-medium text-gray-900 mb-3">Spending Trends</h4>
					<div class="space-y-3">
						<div v-for="trend in spendingTrends" :key="trend.category" class="flex justify-between">
							<span class="text-sm text-gray-600">{{ trend.category }}</span>
							<div class="text-right">
								<span
									class="text-sm font-medium"
									:class="trend.projected > trend.budget ? 'text-red-600' : 'text-green-600'"
								>
									${{ trend.projected.toLocaleString() }}
								</span>
								<div class="text-xs text-gray-500">projected</div>
							</div>
						</div>
					</div>
				</div>

				<div>
					<h4 class="font-medium text-gray-900 mb-3">Recommendations</h4>
					<div class="space-y-2">
						<div v-for="rec in budgetRecommendations" :key="rec.id" class="text-sm">
							<div class="flex items-start space-x-2">
								<UIcon :name="rec.icon" class="w-4 h-4 mt-0.5" :class="rec.color" />
								<div>
									<span class="font-medium">{{ rec.title }}:</span>
									<span class="text-gray-600">{{ rec.description }}</span>
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

// Props for data input (could be from CSV or API)
const props = defineProps({
	budgetData: {
		type: Array,
		default: () => [],
	},
	currentMonth: {
		type: String,
		default: 'June',
	},
});

// Component state
const selectedView = ref('All');
const expandedCategories = ref(new Set());

// Budget data (based on CSV analysis)
const budgetCategories = ref([
	{
		name: 'Insurance',
		totalYearly: 85579,
		totalActual: 67413,
		totalRemaining: 18166,
		percentSpent: 78.8,
		items: [
			{
				description: 'Building Insurance',
				yearly: 76250,
				actualCost: 58084,
				monthly: 6354,
				comment: 'Major annual expense, paid in installments',
			},
			{
				description: 'Flood Insurance',
				yearly: 9329,
				actualCost: 9329,
				monthly: 777,
				comment: 'Fully paid for year',
			},
		],
		topItems: [],
	},
	{
		name: 'Contract Services',
		totalYearly: 36036,
		totalActual: 16251,
		totalRemaining: 19785,
		percentSpent: 45.1,
		items: [
			{
				description: 'Janitorial Services',
				yearly: 10800,
				actualCost: 2700,
				monthly: 900,
				comment: 'Engaged cleaning company at $450/month',
			},
			{
				description: 'Management Fees - VTE',
				yearly: 8400,
				actualCost: 5600,
				monthly: 700,
				comment: 'Monthly management fees',
			},
			{
				description: 'Waste/Trash Removal',
				yearly: 5436,
				actualCost: 3851,
				monthly: 453,
				comment: 'Monthly waste management service',
			},
		],
		topItems: [],
	},
	{
		name: 'Utilities',
		totalYearly: 31032,
		totalActual: 18301,
		totalRemaining: 12731,
		percentSpent: 59.0,
		items: [
			{
				description: 'Water & Sewer',
				yearly: 24000,
				actualCost: 14213,
				monthly: 2000,
				comment: 'Miami Beach Water utility',
			},
			{
				description: 'Gas - Teco',
				yearly: 3840,
				actualCost: 1946,
				monthly: 320,
				comment: 'Natural gas service',
			},
			{
				description: 'Electricity - FPL',
				yearly: 2640,
				actualCost: 1779,
				monthly: 220,
				comment: 'Electrical service',
			},
		],
		topItems: [],
	},
	{
		name: 'Administrative',
		totalYearly: 12720,
		totalActual: 19714,
		totalRemaining: -6994,
		percentSpent: 155.0,
		items: [
			{
				description: 'Legal Fees',
				yearly: 6000,
				actualCost: 17600,
				monthly: 500,
				comment: 'CRITICAL: 293% over budget - immediate review required',
			},
			{
				description: 'CPA Audit & Review',
				yearly: 5040,
				actualCost: 0,
				monthly: 420,
				comment: 'Annual CPA services - not yet incurred',
			},
			{
				description: 'Misc Expenses',
				yearly: 1200,
				actualCost: 2034,
				monthly: 100,
				comment: 'General miscellaneous expenses',
			},
		],
		topItems: [],
	},
	{
		name: 'Maintenance',
		totalYearly: 9180,
		totalActual: 8680,
		totalRemaining: 500,
		percentSpent: 94.6,
		items: [
			{
				description: 'Security Cameras',
				yearly: 7500,
				actualCost: 7500,
				monthly: 625,
				comment: 'Security system upgrade completed',
			},
			{
				description: 'Plumbing Repairs',
				yearly: 600,
				actualCost: 1180,
				monthly: 50,
				comment: 'Over budget due to emergency repairs',
			},
		],
		topItems: [],
	},
]);

// Initialize top items for each category
budgetCategories.value.forEach((category) => {
	category.topItems = category.items.sort((a, b) => b.yearly - a.yearly).slice(0, 3);
});

// Computed values
const totalBudget = computed(() => budgetCategories.value.reduce((sum, cat) => sum + cat.totalYearly, 0));

const totalSpent = computed(() => budgetCategories.value.reduce((sum, cat) => sum + cat.totalActual, 0));

const totalRemaining = computed(() => totalBudget.value - totalSpent.value);

const spentPercentage = computed(() => (totalSpent.value / totalBudget.value) * 100);

const projectedOverrun = computed(() => {
	// Simple projection based on current burn rate
	const monthsElapsed = 6; // Through June
	const remainingMonths = 6;
	const currentBurnRate = totalSpent.value / monthsElapsed;
	const projectedTotal = totalSpent.value + currentBurnRate * remainingMonths;
	return totalBudget.value - projectedTotal;
});

const projectionColor = computed(() => (projectedOverrun.value >= 0 ? 'text-green-600' : 'text-red-600'));

const filteredCategories = computed(() => {
	let categories = budgetCategories.value;

	if (selectedView.value === 'Over Budget') {
		categories = categories.filter((cat) => cat.percentSpent > 100);
	} else if (selectedView.value === 'At Risk') {
		categories = categories.filter((cat) => cat.percentSpent > 80 && cat.percentSpent <= 100);
	}

	return categories.sort((a, b) => b.percentSpent - a.percentSpent);
});

const criticalItems = computed(() => {
	const items = [];
	budgetCategories.value.forEach((category) => {
		category.items.forEach((item) => {
			if (item.actualCost > item.yearly || item.actualCost / item.yearly > 0.9) {
				items.push(item);
			}
		});
	});
	return items.sort((a, b) => b.actualCost / b.yearly - a.actualCost / a.yearly);
});

const spendingTrends = computed(() => {
	return budgetCategories.value.map((category) => ({
		category: category.name,
		budget: category.totalYearly,
		projected: category.totalActual + (category.totalActual / 6) * 6, // Simple projection
	}));
});

const budgetRecommendations = ref([
	{
		id: 1,
		title: 'Legal Fees',
		description: 'Immediate review of all legal matters to control costs',
		icon: 'i-heroicons-exclamation-triangle',
		color: 'text-red-600',
	},
	{
		id: 2,
		title: 'Budget Revision',
		description: 'Update budget to reflect actual spending patterns',
		icon: 'i-heroicons-pencil-square',
		color: 'text-yellow-600',
	},
	{
		id: 3,
		title: 'Spending Controls',
		description: 'Implement approval process for large expenses',
		icon: 'i-heroicons-shield-check',
		color: 'text-blue-600',
	},
	{
		id: 4,
		title: 'Monthly Reviews',
		description: 'Conduct monthly budget vs actual analysis',
		icon: 'i-heroicons-chart-bar',
		color: 'text-green-600',
	},
]);

// Methods
const getCategoryStatus = (category) => {
	if (category.percentSpent > 100) return 'Over Budget';
	if (category.percentSpent > 80) return 'At Risk';
	if (category.percentSpent < 50) return 'Under Utilized';
	return 'On Track';
};

const getCategoryStatusColor = (category) => {
	if (category.percentSpent > 100) return 'red';
	if (category.percentSpent > 80) return 'yellow';
	if (category.percentSpent < 50) return 'blue';
	return 'green';
};

const getCategoryBorderColor = (category) => {
	if (category.percentSpent > 100) return 'border-red-200';
	if (category.percentSpent > 80) return 'border-yellow-200';
	return 'border-gray-200';
};

const getProgressBarColor = (percentage) => {
	if (percentage > 100) return 'bg-red-500';
	if (percentage > 80) return 'bg-yellow-500';
	return 'bg-green-500';
};

const toggleCategoryExpanded = (categoryName) => {
	if (expandedCategories.value.has(categoryName)) {
		expandedCategories.value.delete(categoryName);
	} else {
		expandedCategories.value.add(categoryName);
	}
};

const refreshData = () => {
	// Implementation for refreshing data from CSV or API
	console.log('Refreshing budget data...');
};

const exportReport = () => {
	// Implementation for exporting budget report
	console.log('Exporting budget report...');
};
</script>

<style scoped>
.transition-all {
	transition: all 0.3s ease-in-out;
}
</style>
