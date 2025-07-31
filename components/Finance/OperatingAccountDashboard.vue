<template>
	<div class="space-y-6">
		<!-- Loading State -->
		<div v-if="loading" class="text-center py-8">
			<UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
			<p class="text-gray-600">Loading budget data...</p>
		</div>

		<!-- Error State -->
		<UAlert v-else-if="error" color="red" variant="soft" :title="'Error Loading Budget Data'" :description="error" />

		<!-- Dashboard Content -->
		<div v-else>
			<!-- Budget Summary Header -->
			<UCard>
				<template #header>
					<div class="flex items-center justify-between">
						<div class="flex items-center">
							<UIcon name="i-heroicons-calculator" class="w-6 h-6 text-blue-600 mr-3" />
							<h2 class="text-xl font-bold text-gray-900">Operating Account Dashboard</h2>
						</div>
						<div class="flex items-center space-x-2">
							<UButton @click="refreshData" size="sm" variant="outline" :loading="loading">
								<UIcon name="i-heroicons-arrow-path" class="w-4 h-4 mr-1" />
								Refresh
							</UButton>
							<div v-if="lastUpdated" class="text-xs text-gray-500">Updated: {{ formatTime(lastUpdated) }}</div>
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
				<div
					v-for="alert in criticalAlerts"
					:key="alert.id"
					class="border-l-4 border-red-500 bg-red-50 p-4 rounded-r-lg"
				>
					<div class="flex items-start">
						<UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-red-500 mt-0.5 mr-3" />
						<div>
							<h4 class="font-semibold text-red-800">{{ alert.title }}</h4>
							<p class="text-red-700 text-sm mt-1">{{ alert.message }}</p>
						</div>
					</div>
				</div>
			</div>

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
								<p class="text-sm text-gray-600">{{ category.count }} items</p>
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
								<div class="text-gray-600">Budget</div>
								<div class="font-semibold">${{ category.totalYearly.toLocaleString() }}</div>
							</div>
							<div>
								<div class="text-gray-600">Actual</div>
								<div class="font-semibold">${{ category.totalActual.toLocaleString() }}</div>
							</div>
							<div>
								<div class="text-gray-600">Remaining</div>
								<div class="font-semibold" :class="category.totalRemaining >= 0 ? 'text-green-600' : 'text-red-600'">
									{{ category.totalRemaining >= 0 ? '+' : '' }}${{ category.totalRemaining.toLocaleString() }}
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

						<!-- Top items in category -->
						<div v-if="category.items.length > 0" class="mt-3 space-y-1">
							<div
								v-for="item in category.items.slice(0, 2)"
								:key="item.id"
								class="flex justify-between items-center text-sm bg-gray-50 rounded p-2"
							>
								<span class="font-medium">{{ item.description }}</span>
								<div class="text-right">
									<div class="font-medium">${{ item.actualCost.toLocaleString() }}</div>
									<div class="text-xs text-gray-500">of ${{ item.yearly.toLocaleString() }}</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</UCard>

			<!-- Over Budget Items -->
			<UCard v-if="overBudgetItems.length > 0">
				<template #header>
					<div class="flex items-center">
						<UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-red-600 mr-2" />
						<h3 class="text-lg font-bold text-gray-900">Items Over Budget</h3>
					</div>
				</template>

				<div class="space-y-3">
					<div
						v-for="item in overBudgetItems"
						:key="item.id"
						class="flex items-start space-x-3 p-3 border border-red-200 rounded-lg bg-red-50"
					>
						<UIcon name="i-heroicons-exclamation-circle" class="w-5 h-5 text-red-600 mt-0.5" />
						<div class="flex-1">
							<h4 class="font-medium text-red-900">{{ item.description }}</h4>
							<p class="text-sm text-red-800 mt-1">
								Over budget by ${{ (item.actualCost - item.yearly).toLocaleString() }} ({{
									item.percentSpent.toFixed(1)
								}}% of budget)
							</p>
							<div v-if="item.comment" class="text-xs text-red-700 mt-1">
								{{ item.comment }}
							</div>
						</div>
						<UBadge color="red" variant="solid" size="sm">{{ item.percentSpent.toFixed(0) }}%</UBadge>
					</div>
				</div>
			</UCard>
		</div>
	</div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

// Use the CSV loader composable
const { budgetData, loading, error, loadBudgetCSV } = useBudgetCSV();

const lastUpdated = ref(null);

// Load data on component mount
onMounted(async () => {
	await refreshData();
});

// Refresh data function
const refreshData = async () => {
	try {
		await loadBudgetCSV('2025-operating-budget.csv');
		lastUpdated.value = new Date();
	} catch (err) {
		console.error('Failed to refresh data:', err);
	}
};

// Budget summary
const budgetSummary = computed(() => {
	if (!budgetData.value.length) {
		return { budget: 0, actual: 0, remaining: 0, percentSpent: 0 };
	}

	const summary = budgetData.value.reduce(
		(acc, item) => ({
			budget: acc.budget + item.yearly,
			actual: acc.actual + item.actualCost,
			remaining: acc.remaining + item.remaining,
		}),
		{ budget: 0, actual: 0, remaining: 0 },
	);

	return {
		...summary,
		percentSpent: (summary.actual / summary.budget) * 100,
	};
});

// Categorized budget
const categorizedBudget = computed(() => {
	const categories = {};

	budgetData.value.forEach((item) => {
		const category = item.category || 'Other';

		if (!categories[category]) {
			categories[category] = {
				name: category,
				items: [],
				totalYearly: 0,
				totalActual: 0,
				totalRemaining: 0,
				count: 0,
				percentSpent: 0,
			};
		}

		categories[category].items.push(item);
		categories[category].totalYearly += item.yearly;
		categories[category].totalActual += item.actualCost;
		categories[category].totalRemaining += item.remaining;
		categories[category].count++;
	});

	// Calculate percentages and sort items
	Object.values(categories).forEach((category) => {
		category.percentSpent = (category.totalActual / category.totalYearly) * 100;
		category.items.sort((a, b) => b.yearly - a.yearly);
	});

	return categories;
});

// Sorted categories by percent spent (highest first)
const sortedCategories = computed(() => {
	return Object.values(categorizedBudget.value).sort((a, b) => b.percentSpent - a.percentSpent);
});

// Over budget items
const overBudgetItems = computed(() => {
	return budgetData.value
		.filter((item) => item.actualCost > item.yearly)
		.sort((a, b) => b.percentSpent - a.percentSpent);
});

// Critical alerts
const criticalAlerts = computed(() => {
	const alerts = [];

	// Check for items significantly over budget
	const severeOverages = overBudgetItems.value.filter((item) => item.percentSpent > 200);
	if (severeOverages.length > 0) {
		alerts.push({
			id: 'severe-overage',
			title: 'Severe Budget Overages Detected',
			message: `${severeOverages.length} items are over 200% of budget, requiring immediate attention.`,
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

	return alerts;
});

// Utility functions
const formatTime = (date) => {
	return new Intl.DateTimeFormat('en-US', {
		hour: '2-digit',
		minute: '2-digit',
		month: 'short',
		day: 'numeric',
	}).format(date);
};

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
