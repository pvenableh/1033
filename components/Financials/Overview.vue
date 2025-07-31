<template>
	<div class="space-y-6">
		<!-- Critical Financial Status Alert -->
		<UAlert
			color="red"
			variant="soft"
			title="Multiple Critical Financial Issues Detected"
			description="Operating account declining rapidly, budget variances exceeding 100%, and compliance violations require immediate board attention."
		/>

		<!-- Budget vs Actual Summary Cards -->
		<div class="grid grid-cols-1 md:grid-cols-4 gap-6">
			<UCard class="text-center">
				<div class="space-y-2">
					<UIcon name="i-heroicons-calculator" class="w-8 h-8 mx-auto text-blue-600" />
					<div class="text-2xl font-bold text-gray-900">${{ budgetSummary.budget.toLocaleString() }}</div>
					<div class="text-sm text-gray-600">Annual Budget</div>
					<div class="text-xs text-blue-600">{{ budgetSummary.itemCount }} line items</div>
				</div>
			</UCard>

			<UCard class="text-center">
				<div class="space-y-2">
					<UIcon name="i-heroicons-banknotes" class="w-8 h-8 mx-auto text-green-600" />
					<div class="text-2xl font-bold text-gray-900">${{ actualYTDTotal.toLocaleString() }}</div>
					<div class="text-sm text-gray-600">Actual Spent YTD</div>
					<div class="text-xs" :class="varianceColor">{{ budgetVariancePercent.toFixed(1) }}% vs budget</div>
				</div>
			</UCard>

			<UCard class="text-center">
				<div class="space-y-2">
					<UIcon name="i-heroicons-exclamation-triangle" class="w-8 h-8 mx-auto text-red-600" />
					<div class="text-2xl font-bold text-red-600">${{ Math.abs(budgetVariance).toLocaleString() }}</div>
					<div class="text-sm text-gray-600">Budget {{ budgetVariance >= 0 ? 'Surplus' : 'Shortfall' }}</div>
					<div class="text-xs text-red-600">{{ overBudgetCategories }} categories over</div>
				</div>
			</UCard>

			<UCard class="text-center">
				<div class="space-y-2">
					<UIcon name="i-heroicons-chart-bar" class="w-8 h-8 mx-auto text-purple-600" />
					<div class="text-2xl font-bold text-gray-900">{{ currentOperatingBalance.toLocaleString() }}</div>
					<div class="text-sm text-gray-600">Operating Balance</div>
					<div class="text-xs" :class="operatingHealthColor">
						{{ operatingTrend >= 0 ? '+' : '' }}{{ operatingTrend.toLocaleString() }} trend
					</div>
				</div>
			</UCard>
		</div>

		<!-- Budget vs Actual Category Analysis -->
		<UCard>
			<template #header>
				<div class="flex items-center justify-between">
					<h3 class="text-lg font-bold text-gray-900">Budget vs Actual by Category</h3>
					<UButton @click="refreshAnalysis" size="sm" variant="outline">
						<UIcon name="i-heroicons-arrow-path" class="w-4 h-4 mr-1" />
						Refresh Analysis
					</UButton>
				</div>
			</template>

			<div class="space-y-4">
				<div
					v-for="category in categoryComparison"
					:key="category.name"
					class="border rounded-lg p-4"
					:class="getCategoryBorderClass(category.variance)"
				>
					<div class="flex items-center justify-between mb-3">
						<div>
							<h4 class="font-semibold text-gray-900">{{ category.name }}</h4>
							<p class="text-sm text-gray-600">{{ category.actualTransactions }} transactions</p>
						</div>
						<div class="text-right">
							<UBadge :color="getCategoryBadgeColor(category.variance)" variant="soft" size="sm">
								{{ getCategoryStatus(category.variance) }}
							</UBadge>
							<div class="text-sm text-gray-600 mt-1">{{ category.variancePercent.toFixed(1) }}% variance</div>
						</div>
					</div>

					<div class="grid grid-cols-4 gap-4 mb-3 text-sm">
						<div>
							<div class="text-gray-600">Budget</div>
							<div class="font-semibold">${{ category.budget.toLocaleString() }}</div>
						</div>
						<div>
							<div class="text-gray-600">Actual</div>
							<div class="font-semibold">${{ category.actual.toLocaleString() }}</div>
						</div>
						<div>
							<div class="text-gray-600">Variance</div>
							<div class="font-semibold" :class="category.variance >= 0 ? 'text-green-600' : 'text-red-600'">
								{{ category.variance >= 0 ? '+' : '' }}${{ category.variance.toLocaleString() }}
							</div>
						</div>
						<div>
							<div class="text-gray-600">Remaining</div>
							<div class="font-semibold" :class="category.remaining >= 0 ? 'text-green-600' : 'text-red-600'">
								${{ category.remaining.toLocaleString() }}
							</div>
						</div>
					</div>

					<!-- Progress bar showing budget utilization -->
					<div class="w-full bg-gray-200 rounded-full h-3 mb-2">
						<div
							class="h-3 rounded-full transition-all duration-500"
							:class="getProgressBarClass(category.utilizationPercent)"
							:style="`width: ${Math.min(category.utilizationPercent, 100)}%`"
						></div>
					</div>

					<!-- Show specific problem items -->
					<div v-if="category.problemItems.length > 0" class="mt-3">
						<h5 class="text-xs font-medium text-gray-700 mb-2">Issues:</h5>
						<div class="space-y-1">
							<div
								v-for="item in category.problemItems.slice(0, 2)"
								:key="item.description"
								class="text-xs bg-red-50 text-red-800 rounded p-2"
							>
								<strong>{{ item.description }}:</strong>
								${{ item.actual.toLocaleString() }} vs ${{ item.budget.toLocaleString() }} budget ({{
									item.overPercent.toFixed(0)
								}}% over)
							</div>
						</div>
					</div>
				</div>
			</div>
		</UCard>

		<!-- Account Health Status -->
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<UCard>
				<template #header>
					<h3 class="text-lg font-bold text-gray-900">Operating Account Health</h3>
				</template>
				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<span class="text-gray-600">Current Balance</span>
						<span class="font-semibold text-gray-900">${{ currentOperatingBalance.toLocaleString() }}</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-gray-600">Monthly Burn Rate</span>
						<span class="font-semibold text-red-600">${{ monthlyBurnRate.toLocaleString() }}</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-gray-600">Months Remaining</span>
						<span class="font-semibold" :class="monthsRemainingColor">{{ monthsRemaining.toFixed(1) }}</span>
					</div>
					<div class="flex items-center justify-between pt-2 border-t">
						<span class="text-gray-600">Health Status</span>
						<UBadge :color="operatingHealthBadge" variant="solid">{{ operatingHealthStatus }}</UBadge>
					</div>
				</div>
			</UCard>

			<UCard>
				<template #header>
					<h3 class="text-lg font-bold text-gray-900">Budget Compliance</h3>
				</template>
				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<span class="text-gray-600">Items Over Budget</span>
						<span class="font-semibold text-red-600">{{ overBudgetItemsCount }}</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-gray-600">Severe Overages</span>
						<span class="font-semibold text-red-600">{{ severeOveragesCount }}</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-gray-600">Fund Violations</span>
						<span class="font-semibold text-red-600">{{ totalViolations }}</span>
					</div>
					<div class="flex items-center justify-between pt-2 border-t">
						<span class="text-gray-600">Compliance Status</span>
						<UBadge color="red" variant="solid">NON-COMPLIANT</UBadge>
					</div>
				</div>
			</UCard>

			<UCard>
				<template #header>
					<h3 class="text-lg font-bold text-gray-900">Action Required</h3>
				</template>
				<div class="space-y-3">
					<div v-for="action in priorityActions" :key="action.id" class="flex items-start space-x-2">
						<UIcon :name="action.icon" class="w-4 h-4 mt-0.5" :class="action.color" />
						<div>
							<div class="text-sm font-medium text-gray-900">{{ action.title }}</div>
							<div class="text-xs text-gray-600">{{ action.deadline }}</div>
						</div>
					</div>
				</div>
			</UCard>
		</div>

		<!-- Recent Transaction Highlights -->
		<UCard>
			<template #header>
				<h3 class="text-lg font-bold text-gray-900">Recent High-Impact Transactions</h3>
			</template>
			<div class="space-y-3">
				<div
					v-for="transaction in recentHighImpactTransactions"
					:key="`${transaction.date}-${transaction.amount}`"
					class="flex items-center justify-between p-3 border rounded-lg"
					:class="transaction.impact === 'high' ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'"
				>
					<div>
						<h4 class="font-medium text-gray-900">{{ transaction.vendor || transaction.description }}</h4>
						<p class="text-sm text-gray-600">{{ transaction.category }} • {{ transaction.date }}</p>
						<p v-if="transaction.budgetItem" class="text-xs text-gray-500">
							Budget: ${{ transaction.budgetItem.yearly.toLocaleString() }} | YTD: ${{
								transaction.budgetItem.actualCost.toLocaleString()
							}}
						</p>
					</div>
					<div class="text-right">
						<div class="font-semibold" :class="transaction.impact === 'high' ? 'text-red-600' : 'text-yellow-600'">
							${{ transaction.amount.toLocaleString() }}
						</div>
						<UBadge :color="transaction.impact === 'high' ? 'red' : 'yellow'" variant="soft" size="sm">
							{{ transaction.impact.toUpperCase() }}
						</UBadge>
					</div>
				</div>
			</div>
		</UCard>
	</div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useReconciliationData } from '~/composables/useReconciliationData';

// Use both composables
const { getOperatingData, getViolationCount } = useReconciliationData();
const { budgetItems, budgetSummary, loadOperatingBudget } = useBudgetData();

const currentMonth = ref('June 2025');

// Load budget data on mount
onMounted(async () => {
	await loadOperatingBudget();
});

// Get current operating data
const currentOperatingData = computed(() => getOperatingData(currentMonth.value));
const currentOperatingBalance = computed(() => currentOperatingData.value?.endingBalance || 0);
const totalViolations = computed(() => getViolationCount(currentMonth.value));

// Calculate actual YTD spending by mapping budget categories to transaction categories
const actualYTDTotal = computed(() => {
	if (!budgetItems.value.length) return 0;

	// Sum up actual costs from budget data (this comes from CSV)
	return budgetItems.value.reduce((sum, item) => sum + item.actualCost, 0);
});

// Budget variance calculations
const budgetVariance = computed(() => budgetSummary.value.remaining);
const budgetVariancePercent = computed(() =>
	budgetSummary.value.budget ? (actualYTDTotal.value / budgetSummary.value.budget) * 100 : 0,
);
const varianceColor = computed(() =>
	budgetVariancePercent.value > 100
		? 'text-red-600'
		: budgetVariancePercent.value > 85
			? 'text-yellow-600'
			: 'text-green-600',
);

// Operating account health metrics
const operatingTrend = computed(() => {
	// Simple trend calculation - would need multiple months for accurate trend
	return currentOperatingBalance.value - 50000; // Rough estimate vs target
});

const monthlyBurnRate = computed(() => {
	// Calculate based on 6 months of data
	return Math.round((64114 - currentOperatingBalance.value) / 6);
});

const monthsRemaining = computed(() =>
	monthlyBurnRate.value > 0 ? currentOperatingBalance.value / monthlyBurnRate.value : 999,
);

const operatingHealthColor = computed(() => (operatingTrend.value >= 0 ? 'text-green-600' : 'text-red-600'));

const monthsRemainingColor = computed(() =>
	monthsRemaining.value < 6 ? 'text-red-600' : monthsRemaining.value < 12 ? 'text-yellow-600' : 'text-green-600',
);

const operatingHealthStatus = computed(() => {
	if (currentOperatingBalance.value < 25000) return 'CRITICAL';
	if (currentOperatingBalance.value < 40000) return 'AT RISK';
	if (operatingTrend.value < 0) return 'DECLINING';
	return 'STABLE';
});

const operatingHealthBadge = computed(() => {
	switch (operatingHealthStatus.value) {
		case 'CRITICAL':
			return 'red';
		case 'AT RISK':
			return 'yellow';
		case 'DECLINING':
			return 'orange';
		default:
			return 'green';
	}
});

// Budget compliance metrics
const overBudgetItemsCount = computed(() => budgetItems.value.filter((item) => item.actualCost > item.yearly).length);

const severeOveragesCount = computed(() => budgetItems.value.filter((item) => item.percentSpent > 200).length);

const overBudgetCategories = computed(() => {
	// Count categories that are over budget
	const categories = {};
	budgetItems.value.forEach((item) => {
		const cat = item.category || 'Other';
		if (!categories[cat]) categories[cat] = { budget: 0, actual: 0 };
		categories[cat].budget += item.yearly;
		categories[cat].actual += item.actualCost;
	});

	return Object.values(categories).filter((cat) => cat.actual > cat.budget).length;
});

// Category comparison (Budget vs Actual)
const categoryComparison = computed(() => {
	if (!budgetItems.value.length) return [];

	const categories = {};

	// Group budget items by category
	budgetItems.value.forEach((item) => {
		const cat = item.category || 'Other';
		if (!categories[cat]) {
			categories[cat] = {
				name: cat,
				budget: 0,
				actual: 0,
				items: [],
				actualTransactions: 0,
			};
		}
		categories[cat].budget += item.yearly;
		categories[cat].actual += item.actualCost;
		categories[cat].items.push(item);
	});

	// Calculate variance and status for each category
	return Object.values(categories)
		.map((category) => {
			const variance = category.budget - category.actual;
			const variancePercent = category.budget ? ((category.actual - category.budget) / category.budget) * 100 : 0;
			const utilizationPercent = category.budget ? (category.actual / category.budget) * 100 : 0;
			const remaining = category.budget - category.actual;

			// Find problem items (over budget)
			const problemItems = category.items
				.filter((item) => item.actualCost > item.yearly)
				.map((item) => ({
					description: item.description,
					budget: item.yearly,
					actual: item.actualCost,
					overPercent: ((item.actualCost - item.yearly) / item.yearly) * 100,
				}))
				.sort((a, b) => b.overPercent - a.overPercent);

			return {
				...category,
				variance,
				variancePercent,
				utilizationPercent,
				remaining,
				problemItems,
				actualTransactions: category.items.length, // Approximation
			};
		})
		.sort((a, b) => Math.abs(b.variancePercent) - Math.abs(a.variancePercent));
});

// Recent high-impact transactions
const recentHighImpactTransactions = computed(() => {
	const transactions = [];
	const operatingData = currentOperatingData.value;

	if (operatingData?.withdrawals) {
		operatingData.withdrawals.forEach((txn) => {
			if (txn.amount > 2000) {
				// High-impact threshold
				// Try to match with budget item
				const budgetItem = budgetItems.value.find(
					(item) =>
						item.description.toLowerCase().includes(txn.vendor?.toLowerCase() || '') ||
						item.category.toLowerCase().includes(txn.category?.toLowerCase() || ''),
				);

				transactions.push({
					...txn,
					impact: txn.amount > 5000 ? 'high' : 'medium',
					budgetItem,
				});
			}
		});
	}

	return transactions.slice(0, 5); // Show top 5
});

// Priority actions
const priorityActions = ref([
	{
		id: 1,
		title: 'Legal Fee Review',
		deadline: 'This Week',
		icon: 'i-heroicons-exclamation-triangle',
		color: 'text-red-600',
	},
	{
		id: 2,
		title: 'Budget Revision',
		deadline: 'Next Board Meeting',
		icon: 'i-heroicons-pencil-square',
		color: 'text-yellow-600',
	},
	{
		id: 3,
		title: 'Cash Flow Plan',
		deadline: 'Within 30 days',
		icon: 'i-heroicons-chart-line',
		color: 'text-blue-600',
	},
]);

// Helper functions
const getCategoryStatus = (variancePercent) => {
	if (variancePercent < -50) return 'Severely Over';
	if (variancePercent < -20) return 'Over Budget';
	if (variancePercent < -10) return 'At Risk';
	if (variancePercent > 50) return 'Under Utilized';
	return 'On Track';
};

const getCategoryBadgeColor = (variancePercent) => {
	if (variancePercent < -50) return 'red';
	if (variancePercent < -20) return 'red';
	if (variancePercent < -10) return 'yellow';
	if (variancePercent > 50) return 'blue';
	return 'green';
};

const getCategoryBorderClass = (variancePercent) => {
	if (variancePercent < -20) return 'border-red-300';
	if (variancePercent < -10) return 'border-yellow-300';
	return 'border-gray-200';
};

const getProgressBarClass = (utilizationPercent) => {
	if (utilizationPercent > 100) return 'bg-red-600';
	if (utilizationPercent > 90) return 'bg-red-500';
	if (utilizationPercent > 80) return 'bg-yellow-500';
	return 'bg-green-500';
};

const refreshAnalysis = async () => {
	await loadOperatingBudget();
};
</script>

<style scoped>
.transition-all {
	transition: all 0.3s ease-in-out;
}
</style>
