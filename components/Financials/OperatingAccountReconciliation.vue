<template>
	<div class="space-y-6">
		<!-- Month Header with Budget vs Actual Summary -->
		<UCard>
			<template #header>
				<div class="flex items-center justify-between">
					<h2 class="text-xl font-bold text-gray-900">Operating Account Reconciliation - {{ month }}</h2>
					<div class="flex items-center space-x-4">
						<div class="text-right text-sm">
							<div class="text-gray-600">Budget vs Actual</div>
							<div :class="monthlyVarianceColor" class="font-semibold">
								{{ monthlyVariancePercent >= 0 ? '+' : '' }}{{ monthlyVariancePercent.toFixed(1) }}%
							</div>
						</div>
						<UBadge :color="reconciliationStatus.color" variant="soft">
							{{ reconciliationStatus.label }}
						</UBadge>
					</div>
				</div>
			</template>

			<!-- Balance Summary with Budget Context -->
			<div class="grid grid-cols-1 md:grid-cols-4 gap-6">
				<div class="text-center">
					<div class="text-2xl font-bold text-gray-900">${{ beginningBalance.toLocaleString() }}</div>
					<div class="text-sm text-gray-600">Beginning Balance</div>
				</div>
				<div class="text-center">
					<div class="text-2xl font-bold text-green-600">${{ totalDeposits.toLocaleString() }}</div>
					<div class="text-sm text-gray-600">Total Deposits</div>
				</div>
				<div class="text-center">
					<div class="text-2xl font-bold text-red-600">${{ totalWithdrawals.toLocaleString() }}</div>
					<div class="text-sm text-gray-600">Total Withdrawals</div>
					<div class="text-xs text-gray-500">Budget: ${{ monthlyBudgetedExpenses.toLocaleString() }}</div>
				</div>
				<div class="text-center">
					<div class="text-2xl font-bold text-gray-900">${{ endingBalance.toLocaleString() }}</div>
					<div class="text-sm text-gray-600">Ending Balance</div>
					<div class="text-xs" :class="balanceHealthColor">{{ balanceHealthStatus }}</div>
				</div>
			</div>
		</UCard>

		<!-- Expense Analysis by Category -->
		<UCard>
			<template #header>
				<h3 class="text-lg font-bold text-gray-900">Expense Analysis - Budget vs Actual</h3>
			</template>

			<div class="space-y-4">
				<div
					v-for="category in expenseAnalysis"
					:key="category.name"
					class="border rounded-lg p-4"
					:class="category.variance < 0 ? 'border-red-200 bg-red-50' : 'border-gray-200'"
				>
					<div class="flex items-center justify-between mb-3">
						<div>
							<h4 class="font-semibold text-gray-900">{{ category.name }}</h4>
							<p class="text-sm text-gray-600">{{ category.transactionCount }} transactions this month</p>
						</div>
						<div class="text-right">
							<UBadge
								:color="category.variance < 0 ? 'red' : category.variance === 0 ? 'green' : 'blue'"
								variant="soft"
								size="sm"
							>
								{{ category.status }}
							</UBadge>
							<div class="text-sm text-gray-600 mt-1">{{ category.variancePercent.toFixed(1) }}% vs budget</div>
						</div>
					</div>

					<div class="grid grid-cols-4 gap-4 mb-3 text-sm">
						<div>
							<div class="text-gray-600">Monthly Budget</div>
							<div class="font-semibold">${{ category.monthlyBudget.toLocaleString() }}</div>
						</div>
						<div>
							<div class="text-gray-600">Actual Spent</div>
							<div class="font-semibold">${{ category.actualSpent.toLocaleString() }}</div>
						</div>
						<div>
							<div class="text-gray-600">Variance</div>
							<div class="font-semibold" :class="category.variance >= 0 ? 'text-green-600' : 'text-red-600'">
								{{ category.variance >= 0 ? '+' : '' }}${{ category.variance.toLocaleString() }}
							</div>
						</div>
						<div>
							<div class="text-gray-600">YTD Budget</div>
							<div class="font-semibold text-gray-700">${{ category.ytdBudget.toLocaleString() }}</div>
						</div>
					</div>

					<!-- Progress bar -->
					<div class="w-full bg-gray-200 rounded-full h-3 mb-2">
						<div
							class="h-3 rounded-full transition-all duration-500"
							:class="category.actualSpent > category.monthlyBudget ? 'bg-red-500' : 'bg-green-500'"
							:style="`width: ${Math.min((category.actualSpent / category.monthlyBudget) * 100, 100)}%`"
						></div>
					</div>

					<!-- Show major transactions in this category -->
					<div v-if="category.majorTransactions.length > 0" class="mt-3">
						<h5 class="text-xs font-medium text-gray-700 mb-2">Major Transactions:</h5>
						<div class="space-y-1">
							<div
								v-for="txn in category.majorTransactions"
								:key="`${txn.date}-${txn.amount}`"
								class="flex justify-between items-center text-xs bg-gray-50 rounded p-2"
							>
								<div>
									<span class="font-medium">{{ txn.vendor }}</span>
									<span class="text-gray-500 ml-2">{{ txn.date }}</span>
								</div>
								<span class="font-medium">${{ txn.amount.toLocaleString() }}</span>
							</div>
						</div>
					</div>

					<!-- Budget item details -->
					<div v-if="category.budgetItems.length > 0" class="mt-3 pt-3 border-t border-gray-200">
						<h5 class="text-xs font-medium text-gray-700 mb-2">Related Budget Items:</h5>
						<div class="space-y-1">
							<div
								v-for="item in category.budgetItems"
								:key="item.description"
								class="flex justify-between items-center text-xs"
							>
								<span>{{ item.description }}</span>
								<div class="text-right">
									<div>${{ item.actualCost.toLocaleString() }} / ${{ item.yearly.toLocaleString() }}</div>
									<div class="text-gray-500">{{ ((item.actualCost / item.yearly) * 100).toFixed(0) }}% used</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</UCard>

		<!-- Transaction Details with Budget Impact -->
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<!-- Deposits -->
			<UCard>
				<template #header>
					<h3 class="text-lg font-bold text-gray-900">Deposits ({{ deposits.length }})</h3>
				</template>
				<div class="space-y-2 max-h-96 overflow-y-auto">
					<div
						v-for="deposit in deposits"
						:key="`deposit-${deposit.date}-${deposit.amount}`"
						class="flex justify-between items-center p-2 border-b border-gray-100"
					>
						<div>
							<div class="font-medium text-sm">{{ deposit.description }}</div>
							<div class="text-xs text-gray-500">{{ deposit.date }}</div>
						</div>
						<div class="text-right">
							<div class="font-semibold text-green-600">${{ deposit.amount.toLocaleString() }}</div>
							<div v-if="deposit.source" class="text-xs text-gray-500">{{ deposit.source }}</div>
						</div>
					</div>
				</div>
			</UCard>

			<!-- Withdrawals with Budget Context -->
			<UCard>
				<template #header>
					<h3 class="text-lg font-bold text-gray-900">Withdrawals ({{ withdrawals.length }})</h3>
				</template>
				<div class="space-y-2 max-h-96 overflow-y-auto">
					<div
						v-for="withdrawal in withdrawalsWithBudgetContext"
						:key="`withdrawal-${withdrawal.date}-${withdrawal.amount}`"
						class="flex justify-between items-start p-2 border-b border-gray-100"
						:class="
							withdrawal.budgetImpact === 'high'
								? 'bg-red-50'
								: withdrawal.budgetImpact === 'medium'
									? 'bg-yellow-50'
									: ''
						"
					>
						<div class="flex-1">
							<div class="font-medium text-sm">{{ withdrawal.vendor }}</div>
							<div class="text-xs text-gray-500">{{ withdrawal.category }} • {{ withdrawal.date }}</div>
							<div v-if="withdrawal.budgetItem" class="text-xs text-blue-600 mt-1">
								Budget: {{ withdrawal.budgetItem.description }} (${{
									withdrawal.budgetItem.monthly.toLocaleString()
								}}/month)
							</div>
							<div
								v-if="withdrawal.budgetVariance"
								class="text-xs mt-1"
								:class="withdrawal.budgetVariance > 0 ? 'text-red-600' : 'text-green-600'"
							>
								{{ withdrawal.budgetVariance > 0 ? 'Over' : 'Under' }} budget by ${{
									Math.abs(withdrawal.budgetVariance).toLocaleString()
								}}
							</div>
						</div>
						<div class="text-right">
							<div class="font-semibold text-red-600">${{ withdrawal.amount.toLocaleString() }}</div>
							<UBadge
								v-if="withdrawal.budgetImpact !== 'low'"
								:color="withdrawal.budgetImpact === 'high' ? 'red' : 'yellow'"
								variant="soft"
								size="sm"
								class="mt-1"
							>
								{{ withdrawal.budgetImpact.toUpperCase() }}
							</UBadge>
						</div>
					</div>
				</div>
			</UCard>
		</div>

		<!-- Violations and Issues -->
		<UCard v-if="violations.length > 0 || monthlyBudgetIssues.length > 0">
			<template #header>
				<div class="flex items-center">
					<UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-red-600 mr-2" />
					<h3 class="text-lg font-bold text-gray-900">Issues & Violations</h3>
				</div>
			</template>

			<div class="space-y-4">
				<!-- Fund Segregation Violations -->
				<div v-if="violations.length > 0">
					<h4 class="font-medium text-red-900 mb-2">Fund Segregation Violations ({{ violations.length }})</h4>
					<div class="space-y-2">
						<div
							v-for="violation in violations"
							:key="`violation-${violation.date}-${violation.amount}`"
							class="flex justify-between items-center p-2 bg-red-50 border border-red-200 rounded"
						>
							<div>
								<div class="font-medium text-red-900">{{ violation.description }}</div>
								<div class="text-sm text-red-700">{{ violation.date }}</div>
							</div>
							<div class="text-red-900 font-semibold">${{ violation.amount.toLocaleString() }}</div>
						</div>
					</div>
				</div>

				<!-- Budget Issues -->
				<div v-if="monthlyBudgetIssues.length > 0">
					<h4 class="font-medium text-yellow-900 mb-2">Budget Issues ({{ monthlyBudgetIssues.length }})</h4>
					<div class="space-y-2">
						<div
							v-for="issue in monthlyBudgetIssues"
							:key="issue.category"
							class="flex justify-between items-center p-2 bg-yellow-50 border border-yellow-200 rounded"
						>
							<div>
								<div class="font-medium text-yellow-900">{{ issue.title }}</div>
								<div class="text-sm text-yellow-700">{{ issue.description }}</div>
							</div>
							<UBadge color="yellow" variant="soft" size="sm">{{ issue.severity }}</UBadge>
						</div>
					</div>
				</div>
			</div>
		</UCard>

		<!-- Recommendations -->
		<UCard>
			<template #header>
				<div class="flex items-center">
					<UIcon name="i-heroicons-light-bulb" class="w-5 h-5 text-blue-600 mr-2" />
					<h3 class="text-lg font-bold text-gray-900">Recommendations</h3>
				</div>
			</template>
			<div class="space-y-3">
				<div v-for="rec in recommendations" :key="rec.id" class="flex items-start space-x-3">
					<UIcon :name="rec.icon" class="w-5 h-5 mt-0.5" :class="rec.color" />
					<div>
						<h4 class="font-medium text-gray-900">{{ rec.title }}</h4>
						<p class="text-sm text-gray-600 mt-1">{{ rec.description }}</p>
						<div class="mt-2">
							<UBadge :color="rec.priority === 'high' ? 'red' : 'yellow'" variant="soft" size="sm">
								{{ rec.priority.toUpperCase() }} PRIORITY
							</UBadge>
						</div>
					</div>
				</div>
			</div>
		</UCard>
	</div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useReconciliationData } from '~/composables/useReconciliationData';

const props = defineProps({
	month: {
		type: String,
		required: true,
	},
});

// Use both composables
const { getOperatingData, calculateTotals } = useReconciliationData();
const { budgetItems, categorizedBudget, loadOperatingBudget } = useBudgetData();

// Load budget data on mount
onMounted(async () => {
	await loadOperatingBudget();
});

// Get data for current month
const currentMonthData = computed(() => getOperatingData(props.month));
const totals = computed(() => calculateTotals(currentMonthData.value));

// Basic reconciliation data
const beginningBalance = computed(() => currentMonthData.value?.beginningBalance || 0);
const endingBalance = computed(() => currentMonthData.value?.endingBalance || 0);
const totalDeposits = computed(() => totals.value.totalDeposits);
const totalWithdrawals = computed(() => totals.value.totalWithdrawals);
const deposits = computed(() => currentMonthData.value?.deposits || []);
const withdrawals = computed(() => currentMonthData.value?.withdrawals || []);
const violations = computed(() => currentMonthData.value?.violations || []);

// Monthly budgeted expenses (rough calculation)
const monthlyBudgetedExpenses = computed(() => {
	if (!budgetItems.value.length) return 0;
	return Math.round(budgetItems.value.reduce((sum, item) => sum + item.monthly, 0));
});

// Monthly variance
const monthlyVariancePercent = computed(() => {
	if (monthlyBudgetedExpenses.value === 0) return 0;
	return ((totalWithdrawals.value - monthlyBudgetedExpenses.value) / monthlyBudgetedExpenses.value) * 100;
});

const monthlyVarianceColor = computed(() =>
	monthlyVariancePercent.value > 25
		? 'text-red-600'
		: monthlyVariancePercent.value > 10
			? 'text-yellow-600'
			: 'text-green-600',
);

// Balance health
const balanceHealthStatus = computed(() => {
	if (endingBalance.value < 25000) return 'CRITICAL';
	if (endingBalance.value < 40000) return 'LOW';
	return 'STABLE';
});

const balanceHealthColor = computed(() =>
	balanceHealthStatus.value === 'CRITICAL'
		? 'text-red-600'
		: balanceHealthStatus.value === 'LOW'
			? 'text-yellow-600'
			: 'text-green-600',
);

// Reconciliation status
const reconciliationStatus = computed(() => {
	const hasViolations = violations.value.length > 0;
	const overBudget = monthlyVariancePercent.value > 25;
	const balanceCritical = balanceHealthStatus.value === 'CRITICAL';

	if (hasViolations || balanceCritical) {
		return { label: 'CRITICAL ISSUES', color: 'red' };
	} else if (overBudget) {
		return { label: 'BUDGET CONCERNS', color: 'yellow' };
	} else {
		return { label: 'RECONCILED', color: 'green' };
	}
});

// Expense analysis by category
const expenseAnalysis = computed(() => {
	if (!budgetItems.value.length || !withdrawals.value.length) return [];

	// Create category mapping
	const categories = {};

	// Initialize with budget categories
	Object.values(categorizedBudget.value).forEach((budgetCat) => {
		categories[budgetCat.name] = {
			name: budgetCat.name,
			monthlyBudget: Math.round(budgetCat.totalYearly / 12),
			ytdBudget: budgetCat.totalYearly,
			actualSpent: 0,
			transactionCount: 0,
			majorTransactions: [],
			budgetItems: budgetCat.items || [],
		};
	});

	// Map transactions to categories (simplified mapping)
	withdrawals.value.forEach((txn) => {
		let categoryName = 'Other';

		// Simple category mapping based on vendor/description
		if (txn.vendor?.toLowerCase().includes('insurance') || txn.category?.toLowerCase().includes('insurance')) {
			categoryName = 'Insurance';
		} else if (txn.vendor?.toLowerCase().includes('vte') || txn.vendor?.toLowerCase().includes('management')) {
			categoryName = 'Contract Services';
		} else if (
			txn.category?.toLowerCase().includes('utilities') ||
			txn.vendor?.toLowerCase().includes('fpl') ||
			txn.vendor?.toLowerCase().includes('teco')
		) {
			categoryName = 'Utilities';
		} else if (txn.vendor?.toLowerCase().includes('tempkins') || txn.category?.toLowerCase().includes('legal')) {
			categoryName = 'Administrative';
		} else if (txn.category?.toLowerCase().includes('maintenance') || txn.vendor?.toLowerCase().includes('repair')) {
			categoryName = 'Maintenance';
		}

		if (!categories[categoryName]) {
			categories[categoryName] = {
				name: categoryName,
				monthlyBudget: 0,
				ytdBudget: 0,
				actualSpent: 0,
				transactionCount: 0,
				majorTransactions: [],
				budgetItems: [],
			};
		}

		categories[categoryName].actualSpent += txn.amount;
		categories[categoryName].transactionCount++;

		if (txn.amount > 1000) {
			categories[categoryName].majorTransactions.push(txn);
		}
	});

	// Calculate variances and status
	return Object.values(categories)
		.filter((cat) => cat.monthlyBudget > 0 || cat.actualSpent > 0)
		.map((category) => {
			const variance = category.monthlyBudget - category.actualSpent;
			const variancePercent = category.monthlyBudget
				? ((category.actualSpent - category.monthlyBudget) / category.monthlyBudget) * 100
				: 0;

			let status = 'On Track';
			if (variancePercent > 50) status = 'Severely Over';
			else if (variancePercent > 20) status = 'Over Budget';
			else if (variancePercent > 10) status = 'At Risk';
			else if (variancePercent < -50) status = 'Under Utilized';

			return {
				...category,
				variance,
				variancePercent,
				status,
				majorTransactions: category.majorTransactions.slice(0, 3), // Top 3
			};
		})
		.sort((a, b) => Math.abs(b.variancePercent) - Math.abs(a.variancePercent));
});

// Withdrawals with budget context
const withdrawalsWithBudgetContext = computed(() => {
	return withdrawals.value.map((withdrawal) => {
		// Try to match with budget items
		const budgetItem = budgetItems.value.find(
			(item) =>
				item.description.toLowerCase().includes(withdrawal.vendor?.toLowerCase() || '') ||
				withdrawal.vendor?.toLowerCase().includes(item.description.toLowerCase().split(' ')[0] || ''),
		);

		let budgetImpact = 'low';
		let budgetVariance = null;

		if (budgetItem) {
			const monthlyBudget = budgetItem.monthly;
			budgetVariance = withdrawal.amount - monthlyBudget;

			if (Math.abs(budgetVariance) > monthlyBudget * 0.5) {
				budgetImpact = 'high';
			} else if (Math.abs(budgetVariance) > monthlyBudget * 0.2) {
				budgetImpact = 'medium';
			}
		} else if (withdrawal.amount > 2000) {
			budgetImpact = 'high';
		} else if (withdrawal.amount > 1000) {
			budgetImpact = 'medium';
		}

		return {
			...withdrawal,
			budgetItem,
			budgetVariance,
			budgetImpact,
		};
	});
});

// Monthly budget issues
const monthlyBudgetIssues = computed(() => {
	const issues = [];

	expenseAnalysis.value.forEach((category) => {
		if (category.variancePercent > 50) {
			issues.push({
				category: category.name,
				title: `${category.name} Severely Over Budget`,
				description: `${category.variancePercent.toFixed(0)}% over monthly budget`,
				severity: 'HIGH',
			});
		} else if (category.variancePercent > 20) {
			issues.push({
				category: category.name,
				title: `${category.name} Over Budget`,
				description: `${category.variancePercent.toFixed(0)}% over monthly budget`,
				severity: 'MEDIUM',
			});
		}
	});

	return issues;
});

// Recommendations
const recommendations = computed(() => {
	const recs = [];

	if (violations.value.length > 0) {
		recs.push({
			id: 1,
			title: 'Address Fund Segregation Violations',
			description: `${violations.value.length} violations detected. Implement proper fund segregation procedures immediately.`,
			priority: 'high',
			icon: 'i-heroicons-shield-exclamation',
			color: 'text-red-600',
		});
	}

	if (monthlyVariancePercent.value > 25) {
		recs.push({
			id: 2,
			title: 'Budget Revision Required',
			description: 'Monthly expenses are significantly over budget. Review and revise budget assumptions.',
			priority: 'high',
			icon: 'i-heroicons-pencil-square',
			color: 'text-red-600',
		});
	}

	if (balanceHealthStatus.value === 'CRITICAL') {
		recs.push({
			id: 3,
			title: 'Cash Flow Emergency Plan',
			description: 'Operating balance is critically low. Develop emergency cash flow plan.',
			priority: 'high',
			icon: 'i-heroicons-exclamation-triangle',
			color: 'text-red-600',
		});
	}

	// Add more recommendations based on analysis
	const overBudgetCategories = expenseAnalysis.value.filter((cat) => cat.variancePercent > 20);
	if (overBudgetCategories.length > 0) {
		recs.push({
			id: 4,
			title: 'Category Spending Controls',
			description: `Implement spending controls for ${overBudgetCategories.length} over-budget categories.`,
			priority: 'medium',
			icon: 'i-heroicons-lock-closed',
			color: 'text-yellow-600',
		});
	}

	return recs;
});
</script>

<style scoped>
.transition-all {
	transition: all 0.3s ease-in-out;
}
</style>
