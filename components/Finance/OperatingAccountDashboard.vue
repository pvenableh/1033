<template>
	<div class="space-y-6">
		<!-- Budget Summary Header -->
		<UCard>
			<template #header>
				<div class="flex items-center justify-between">
					<div class="flex items-center">
						<UIcon name="i-heroicons-calculator" class="w-6 h-6 text-blue-600 mr-3" />
						<h2 class="text-xl font-bold text-gray-900">Operating Account Dashboard</h2>
					</div>
					<div class="flex items-center space-x-2">
						<UButton @click="refreshData" size="sm" variant="outline">
							<UIcon name="i-heroicons-arrow-path" class="w-4 h-4 mr-1" />
							Refresh
						</UButton>
						<div class="text-xs text-gray-500">Data: {{ selectedMonth }}</div>
					</div>
				</div>
			</template>

			<div class="grid grid-cols-1 md:grid-cols-4 gap-6">
				<div class="text-center">
					<div class="text-2xl font-bold text-gray-900">${{ budgetSummary.budget.toLocaleString() }}</div>
					<div class="text-sm text-gray-600">Total Annual Budget</div>
				</div>
				<div class="text-center">
					<div class="text-2xl font-bold text-orange-600">${{ budgetSummary.actual.toLocaleString() }}</div>
					<div class="text-sm text-gray-600">Spent YTD</div>
					<div class="text-xs text-orange-600">{{ budgetSummary.percentSpent.toFixed(1) }}% utilized</div>
				</div>
				<div class="text-center">
					<div class="text-2xl font-bold text-green-600">${{ budgetSummary.remaining.toLocaleString() }}</div>
					<div class="text-sm text-gray-600">Remaining Budget</div>
				</div>
				<div class="text-center">
					<div class="text-2xl font-bold" :class="getHealthColor(budgetSummary.percentSpent)">
						{{ getHealthStatus(budgetSummary.percentSpent) }}
					</div>
					<div class="text-sm text-gray-600">Budget Health</div>
				</div>
			</div>
		</UCard>

		<!-- Critical Alerts -->
		<div v-if="criticalAlerts.length > 0" class="space-y-3">
			<div v-for="alert in criticalAlerts" :key="alert.id" class="border-l-4 border-red-500 bg-red-50 p-4 rounded-r-lg">
				<div class="flex items-start">
					<UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-red-500 mt-0.5 mr-3" />
					<div>
						<h4 class="font-semibold text-red-800">{{ alert.title }}</h4>
						<p class="text-red-700 text-sm mt-1">{{ alert.message }}</p>
					</div>
				</div>
			</div>
		</div>

		<!-- Current Month Activity -->
		<UCard>
			<template #header>
				<div class="flex items-center">
					<UIcon name="i-heroicons-chart-bar" class="w-6 h-6 text-blue-600 mr-3" />
					<h3 class="text-lg font-bold text-gray-900">{{ selectedMonth }} Activity vs Budget</h3>
				</div>
			</template>

			<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
				<div class="text-center p-4 bg-green-50 rounded-lg border border-green-200">
					<div class="text-2xl font-bold text-green-600">${{ monthlyStats.totalDeposits.toLocaleString() }}</div>
					<div class="text-sm text-gray-600">Total Deposits</div>
					<div class="text-xs text-gray-500">vs ${{ monthlyBudgetTarget.toLocaleString() }} target</div>
				</div>
				<div class="text-center p-4 bg-red-50 rounded-lg border border-red-200">
					<div class="text-2xl font-bold text-red-600">${{ monthlyStats.totalWithdrawals.toLocaleString() }}</div>
					<div class="text-sm text-gray-600">Total Expenses</div>
					<div class="text-xs text-gray-500">Burn rate: ${{ monthlyStats.burnRate.toFixed(0) }}/day</div>
				</div>
				<div class="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
					<div class="text-2xl font-bold" :class="monthlyStats.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'">
						{{ monthlyStats.netCashFlow >= 0 ? '+' : '' }}${{ monthlyStats.netCashFlow.toLocaleString() }}
					</div>
					<div class="text-sm text-gray-600">Net Cash Flow</div>
					<div class="text-xs text-gray-500">{{ monthlyStats.runwayDays }} days runway</div>
				</div>
			</div>
		</UCard>

		<!-- Category Breakdown -->
		<UCard>
			<template #header>
				<h3 class="text-lg font-bold text-gray-900">Budget by Category</h3>
			</template>

			<div class="space-y-4">
				<div
					v-for="category in sortedCategories"
					:key="category.name"
					class="border rounded-lg p-4"
					:class="getCategoryBorderClass(category.percentSpent)"
				>
					<div class="flex items-center justify-between mb-3">
						<div>
							<h4 class="font-semibold text-gray-900">{{ category.name }}</h4>
							<p class="text-sm text-gray-600">{{ category.description }}</p>
						</div>
						<div class="text-right">
							<UBadge :color="getCategoryBadgeColor(category.percentSpent)" variant="soft" size="sm">
								{{ getCategoryStatus(category.percentSpent) }}
							</UBadge>
							<div class="text-sm text-gray-600 mt-1">{{ category.percentSpent.toFixed(1) }}% spent</div>
						</div>
					</div>

					<div class="grid grid-cols-3 gap-4 mb-3 text-sm">
						<div>
							<div class="text-gray-600">Annual Budget</div>
							<div class="font-semibold">${{ category.annualBudget.toLocaleString() }}</div>
						</div>
						<div>
							<div class="text-gray-600">Actual Spent</div>
							<div class="font-semibold">${{ category.actualSpent.toLocaleString() }}</div>
						</div>
						<div>
							<div class="text-gray-600">Remaining</div>
							<div class="font-semibold" :class="category.remaining >= 0 ? 'text-green-600' : 'text-red-600'">
								{{ category.remaining >= 0 ? '+' : '' }}${{ category.remaining.toLocaleString() }}
							</div>
						</div>
					</div>

					<div class="w-full bg-gray-200 rounded-full h-3">
						<div
							class="h-3 rounded-full transition-all duration-500"
							:class="getProgressBarClass(category.percentSpent)"
							:style="`width: ${Math.min(category.percentSpent, 100)}%`"
						></div>
					</div>

					<!-- Monthly breakdown for this category -->
					<div class="mt-3 text-sm">
						<div class="flex justify-between items-center bg-gray-50 rounded p-2">
							<span class="font-medium">{{ selectedMonth }} Activity</span>
							<div class="text-right">
								<div class="font-medium">${{ category.monthlyActual.toLocaleString() }}</div>
								<div class="text-xs text-gray-500">
									of ${{ category.monthlyBudget.toLocaleString() }} monthly budget
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</UCard>

		<!-- Over Budget Categories -->
		<UCard v-if="overBudgetCategories.length > 0">
			<template #header>
				<div class="flex items-center">
					<UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-red-600 mr-2" />
					<h3 class="text-lg font-bold text-gray-900">Categories Over Budget</h3>
				</div>
			</template>

			<div class="space-y-3">
				<div
					v-for="category in overBudgetCategories"
					:key="category.name"
					class="flex items-start space-x-3 p-3 border border-red-200 rounded-lg bg-red-50"
				>
					<UIcon name="i-heroicons-exclamation-circle" class="w-5 h-5 text-red-600 mt-0.5" />
					<div class="flex-1">
						<h4 class="font-medium text-red-900">{{ category.name }}</h4>
						<p class="text-sm text-red-800 mt-1">
							Over budget by ${{ Math.abs(category.remaining).toLocaleString() }} ({{
								category.percentSpent.toFixed(1)
							}}% of budget)
						</p>
						<div class="text-xs text-red-700 mt-1">
							Monthly: ${{ category.monthlyActual.toLocaleString() }} vs ${{
								category.monthlyBudget.toLocaleString()
							}}
							budgeted
						</div>
					</div>
					<UBadge color="red" variant="solid" size="sm">{{ category.percentSpent.toFixed(0) }}%</UBadge>
				</div>
			</div>
		</UCard>

		<!-- Expense Analysis -->
		<UCard>
			<template #header>
				<div class="flex items-center">
					<UIcon name="i-heroicons-chart-pie" class="w-6 h-6 text-purple-600 mr-3" />
					<h3 class="text-lg font-bold text-gray-900">Expense Breakdown</h3>
				</div>
			</template>

			<div class="space-y-4">
				<div v-if="Object.keys(monthlyStats.expensesByCategory || {}).length > 0">
					<div
						v-for="(amount, category) in monthlyStats.expensesByCategory"
						:key="category"
						class="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
					>
						<div>
							<div class="font-semibold">{{ category }}</div>
							<div class="text-sm text-gray-600">
								{{ ((amount / monthlyStats.totalWithdrawals) * 100).toFixed(1) }}% of total expenses
							</div>
						</div>
						<div class="text-right">
							<div class="font-bold text-lg">${{ amount.toLocaleString() }}</div>
							<div class="text-sm text-gray-500">this month</div>
						</div>
					</div>
				</div>
				<div v-else class="text-center py-8 text-gray-500">
					<p>No expense data available for {{ selectedMonth }}</p>
				</div>
			</div>
		</UCard>
	</div>
</template>

<script setup>
import { ref, computed, inject } from 'vue';

// Import the reconciliation data composable
const { calculateStatistics, getOperatingData, calculateFinancialHealth } = useReconciliationData();

// Get the selected month from parent component
const selectedMonth = inject('selectedMonth', ref('June 2025'));

// Hardcoded budget data (your simple approach)
const annualBudgetData = [
	{
		name: 'Revenue',
		description: 'HOA fees, laundry, and other income',
		annualBudget: 177408, // Total annual budget
		monthlyBudget: 14784, // Monthly target
		category: 'Income',
	},
	{
		name: 'Insurance',
		description: 'Property and liability insurance',
		annualBudget: 72636, // Estimated based on $6,053/month
		monthlyBudget: 6053,
		category: 'Insurance',
	},
	{
		name: 'Utilities',
		description: 'Electric, water, gas, internet, waste',
		annualBudget: 36000, // Estimated
		monthlyBudget: 3000,
		category: 'Utilities',
	},
	{
		name: 'Management',
		description: 'Property management fees',
		annualBudget: 8400, // $700/month
		monthlyBudget: 700,
		category: 'Management',
	},
	{
		name: 'Maintenance',
		description: 'Repairs, maintenance, and improvements',
		annualBudget: 45000, // Estimated
		monthlyBudget: 3750,
		category: 'Maintenance',
	},
	{
		name: 'Professional Services',
		description: 'Legal, accounting, engineering',
		annualBudget: 12000, // Estimated
		monthlyBudget: 1000,
		category: 'Professional',
	},
	{
		name: 'Regulatory',
		description: 'Government fees and compliance',
		annualBudget: 3000, // Estimated
		monthlyBudget: 250,
		category: 'Regulatory',
	},
];

// Get current month data from reconciliation
const monthlyStats = computed(() => calculateStatistics(selectedMonth.value));
const operatingData = computed(() => getOperatingData(selectedMonth.value));
const financialHealth = computed(() => calculateFinancialHealth(selectedMonth.value));

// Calculate monthly budget target
const monthlyBudgetTarget = computed(() => {
	return Math.round(177408 / 12); // $14,784 monthly
});

// Budget summary
const budgetSummary = computed(() => {
	const totalAnnualBudget = annualBudgetData.reduce(
		(sum, item) => (item.category !== 'Income' ? sum + item.annualBudget : sum),
		0,
	);

	// Calculate YTD actual based on 6 months (through June)
	const monthsElapsed = 6;
	const ytdActual = monthlyStats.value.totalWithdrawals * monthsElapsed;

	return {
		budget: totalAnnualBudget,
		actual: ytdActual,
		remaining: totalAnnualBudget - ytdActual,
		percentSpent: (ytdActual / totalAnnualBudget) * 100,
	};
});

// Categorized budget with actual spending
const categorizedBudget = computed(() => {
	const expensesByCategory = monthlyStats.value.expensesByCategory || {};

	return annualBudgetData
		.filter((item) => item.category !== 'Income')
		.map((budgetItem) => {
			// Get actual spending for this category (monthly)
			const monthlyActual = expensesByCategory[budgetItem.category] || 0;

			// Estimate YTD actual (6 months)
			const actualSpent = monthlyActual * 6;

			return {
				...budgetItem,
				actualSpent,
				monthlyActual,
				remaining: budgetItem.annualBudget - actualSpent,
				percentSpent: (actualSpent / budgetItem.annualBudget) * 100,
			};
		});
});

// Sorted categories by percent spent (highest first)
const sortedCategories = computed(() => {
	return [...categorizedBudget.value].sort((a, b) => b.percentSpent - a.percentSpent);
});

// Over budget categories
const overBudgetCategories = computed(() => {
	return categorizedBudget.value.filter((category) => category.percentSpent > 100);
});

// Critical alerts
const criticalAlerts = computed(() => {
	const alerts = [];

	// Check for categories significantly over budget
	const severeOverages = overBudgetCategories.value.filter((cat) => cat.percentSpent > 150);
	if (severeOverages.length > 0) {
		alerts.push({
			id: 'severe-overage',
			title: 'Severe Budget Overages Detected',
			message: `${severeOverages.length} categories are over 150% of budget, requiring immediate attention.`,
		});
	}

	// Check overall budget health
	if (budgetSummary.value.percentSpent > 85) {
		alerts.push({
			id: 'budget-health',
			title: 'High Budget Utilization',
			message: `${budgetSummary.value.percentSpent.toFixed(1)}% of annual budget spent. Monitor remaining expenses carefully.`,
		});
	}

	// Check operating account balance
	if (operatingData.value?.endingBalance < 25000) {
		alerts.push({
			id: 'low-balance',
			title: 'Low Operating Account Balance',
			message: `Operating account at $${operatingData.value.endingBalance.toLocaleString()}. Critical cash flow risk.`,
		});
	}

	// Check for financial health issues
	if (financialHealth.value.overall === 'CRITICAL') {
		alerts.push({
			id: 'financial-health',
			title: 'Critical Financial Health',
			message: `Financial health score: ${financialHealth.value.score}/100. Multiple issues detected.`,
		});
	}

	return alerts;
});

// Refresh data function
const refreshData = () => {
	// Since we're using composables, data refreshes automatically
	// This is mainly for UI feedback
	console.log('Data refreshed for', selectedMonth.value);
};

// Utility functions
const getHealthStatus = (percentage) => {
	if (percentage > 90) return 'Critical';
	if (percentage > 80) return 'At Risk';
	if (percentage > 70) return 'Caution';
	return 'Healthy';
};

const getHealthColor = (percentage) => {
	if (percentage > 90) return 'text-red-600';
	if (percentage > 80) return 'text-yellow-600';
	if (percentage > 70) return 'text-orange-600';
	return 'text-green-600';
};

const getCategoryStatus = (percentage) => {
	if (percentage > 100) return 'Over Budget';
	if (percentage > 90) return 'Critical';
	if (percentage > 80) return 'At Risk';
	return 'On Track';
};

const getCategoryBadgeColor = (percentage) => {
	if (percentage > 100) return 'red';
	if (percentage > 90) return 'red';
	if (percentage > 80) return 'yellow';
	return 'green';
};

const getCategoryBorderClass = (percentage) => {
	if (percentage > 100) return 'border-red-300';
	if (percentage > 90) return 'border-red-200';
	if (percentage > 80) return 'border-yellow-200';
	return 'border-gray-200';
};

const getProgressBarClass = (percentage) => {
	if (percentage > 100) return 'bg-red-600';
	if (percentage > 90) return 'bg-red-500';
	if (percentage > 80) return 'bg-yellow-500';
	return 'bg-green-500';
};
</script>
