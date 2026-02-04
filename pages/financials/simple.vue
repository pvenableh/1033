<template>
	<div class="max-w-7xl mx-auto p-6">
		<!-- Header -->
		<div class="mb-8">
			<h1 class="text-3xl font-bold uppercase tracking-wider mb-2">FINANCIAL DASHBOARD</h1>
			<p class="text-gray-600">LENOX PLAZA ASSOCIATION - 2025 OPERATING BUDGET</p>
		</div>

		<!-- Executive Summary Section -->
		<div class="mb-8">
			<h2 class="text-2xl font-bold uppercase tracking-wide mb-6 flex items-center">
				<UIcon name="i-heroicons-chart-bar-square" class="w-6 h-6 mr-3 text-blue-600" />
				EXECUTIVE SUMMARY (YEAR-TO-DATE)
			</h2>

			<!-- Key Performance Indicators -->
			<div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
				<!-- Financial Health Score -->
				<UCard
					class="text-center rounded-[4px] shadow"
					:class="financialHealth.score < 60 ? 'border  border-red-500' : ''">
					<div class="space-y-2">
						<UIcon name="i-heroicons-gauge" class="w-8 h-8 mx-auto" :class="financialHealth.color" />
						<p class="text-sm uppercase tracking-wider text-gray-600">FINANCIAL HEALTH</p>
						<p class="text-3xl font-bold" :class="financialHealth.color">{{ financialHealth.score }}%</p>
						<p class="text-xs font-medium" :class="financialHealth.color">{{ financialHealth.status }}</p>
					</div>
				</UCard>

				<!-- YTD Cash Decline -->
				<UCard class="text-center rounded-[4px] shadow" :class="ytdCashChange < 0 ? 'border border-red-500' : ''">
					<div class="space-y-2">
						<UIcon
							name="i-heroicons-arrow-trending-down"
							class="w-8 h-8 mx-auto"
							:class="ytdCashChange < 0 ? 'text-red-600' : 'text-green-600'" />
						<p class="text-sm uppercase tracking-wider text-gray-600">YTD CASH CHANGE</p>
						<p class="text-3xl font-bold" :class="ytdCashChange < 0 ? 'text-red-600' : 'text-green-600'">
							{{ ytdCashChange >= 0 ? '+' : '' }}${{ ytdCashChange.toLocaleString() }}
						</p>
						<p class="text-xs text-gray-500">JAN - {{ selectedMonth.replace(' 2025', '').toUpperCase() }}</p>
					</div>
				</UCard>

				<!-- Monthly Burn Rate -->
				<UCard class="text-center rounded-[4px] shadow" :class="monthlyBurnRate > 5000 ? 'border border-red-500' : ''">
					<div class="space-y-2">
						<UIcon
							name="i-heroicons-fire"
							class="w-8 h-8 mx-auto"
							:class="monthlyBurnRate > 5000 ? 'text-red-600' : 'text-yellow-600'" />
						<p class="text-sm uppercase tracking-wider text-gray-600">AVG MONTHLY BURN</p>
						<p class="text-3xl font-bold" :class="monthlyBurnRate > 5000 ? 'text-red-600' : 'text-yellow-600'">
							${{ monthlyBurnRate.toLocaleString() }}
						</p>
						<p class="text-xs text-gray-500">6-MONTH AVERAGE</p>
					</div>
				</UCard>

				<!-- Cash Runway -->
				<UCard class="text-center rounded-[4px] shadow" :class="cashRunway.months < 12 ? 'border border-red-500' : ''">
					<div class="space-y-2">
						<UIcon name="i-heroicons-clock" class="w-8 h-8 mx-auto" :class="cashRunway.color" />
						<p class="text-sm uppercase tracking-wider text-gray-600">CASH RUNWAY</p>
						<p class="text-3xl font-bold" :class="cashRunway.color">{{ cashRunway.months }} mo</p>
						<p class="text-xs font-medium" :class="cashRunway.color">{{ cashRunway.status }}</p>
					</div>
				</UCard>
			</div>

			<!-- YTD Trends Chart -->
			<UCard class="mb-6">
				<template #header>
					<h3 class="text-lg font-semibold uppercase tracking-wide">YTD CASH FLOW TRENDS</h3>
				</template>
				<div class="h-80">
					<Line :data="ytdCashFlowData" :options="ytdChartOptions" />
				</div>
			</UCard>

			<!-- Budget Performance YTD -->
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
				<UCard>
					<template #header>
						<h3 class="text-lg font-semibold uppercase tracking-wide">YTD BUDGET PERFORMANCE</h3>
					</template>
					<div class="space-y-4">
						<div class="text-center mb-4">
							<p class="text-3xl font-bold" :class="ytdBudgetUtilization > 85 ? 'text-red-600' : 'text-green-600'">
								{{ ytdBudgetUtilization.toFixed(1) }}%
							</p>
							<p class="text-sm text-gray-600">BUDGET UTILIZED</p>
						</div>
						<div class="space-y-3">
							<div v-for="category in ytdBudgetCategories" :key="category.name" class="space-y-2">
								<div class="flex justify-between text-sm">
									<span class="font-medium">{{ category.name }}</span>
									<span :class="category.variance > 0 ? 'text-red-600' : 'text-green-600'">
										{{ category.variance > 0 ? '+' : '' }}{{ category.variance.toFixed(1) }}%
									</span>
								</div>
								<div class="w-full bg-gray-200 rounded-full h-2">
									<div
										class="h-2 rounded-full transition-all duration-300"
										:class="category.variance > 0 ? 'bg-red-500' : 'bg-green-500'"
										:style="`width: ${Math.min(category.utilization, 100)}%`" />
								</div>
							</div>
						</div>
					</div>
				</UCard>

				<UCard>
					<template #header>
						<h3 class="text-lg font-semibold uppercase tracking-wide">COMPLIANCE STATUS</h3>
					</template>
					<div class="space-y-4">
						<div class="text-center mb-4">
							<UIcon
								:name="complianceStatus.compliant ? 'i-heroicons-shield-check' : 'i-heroicons-shield-exclamation'"
								class="w-12 h-12 mx-auto mb-2"
								:class="complianceStatus.compliant ? 'text-green-600' : 'text-red-600'" />
							<p class="text-lg font-bold" :class="complianceStatus.compliant ? 'text-green-600' : 'text-red-600'">
								{{ complianceStatus.compliant ? 'COMPLIANT' : 'VIOLATIONS DETECTED' }}
							</p>
						</div>
						<div class="space-y-2">
							<div class="flex justify-between p-3 bg-gray-50 rounded-lg">
								<span class="font-medium">YTD Fund Segregation</span>
								<span :class="ytdViolations === 0 ? 'text-green-600' : 'text-red-600'">
									{{ ytdViolations === 0 ? '✓ Clean' : `${ytdViolations} Issues` }}
								</span>
							</div>
							<div class="flex justify-between p-3 bg-gray-50 rounded-lg">
								<span class="font-medium">Operating Balance</span>
								<span :class="operatingBalance < 25000 ? 'text-red-600' : 'text-green-600'">
									{{ operatingBalance < 25000 ? '⚠ Below Min' : '✓ Adequate' }}
								</span>
							</div>
							<div class="flex justify-between p-3 bg-gray-50 rounded-lg">
								<span class="font-medium">Budget Compliance</span>
								<span :class="ytdBudgetUtilization > 100 ? 'text-red-600' : 'text-green-600'">
									{{ ytdBudgetUtilization > 100 ? '⚠ Over Budget' : '✓ On Track' }}
								</span>
							</div>
						</div>
					</div>
				</UCard>
			</div>
		</div>

		<!-- Month Selector for Details -->
		<div class="mb-6">
			<SelectMenu
				v-model="selectedMonth"
				:options="monthOptions"
				option-attribute="label"
				value-attribute="value"
				class="relative w-48">
				<template #label>
					<span class="uppercase tracking-wide">{{ selectedMonth.replace('2025', '').trim() }} DETAILS</span>
				</template>
			</SelectMenu>
		</div>

		<!-- Monthly Summary Cards -->
		<div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
			<!-- Operating Balance -->
			<UCard :class="operatingBalance < 25000 ? 'border-2 border-red-500' : ''">
				<div class="space-y-2">
					<p class="text-sm uppercase tracking-wider text-gray-600">OPERATING BALANCE</p>
					<p class="text-2xl font-bold" :class="operatingBalance < 25000 ? 'text-red-600' : 'text-gray-900'">
						${{ operatingBalance.toLocaleString() }}
					</p>
					<div class="flex items-center text-sm" :class="monthlyChange >= 0 ? 'text-green-600' : 'text-red-600'">
						<UIcon
							:name="monthlyChange >= 0 ? 'i-heroicons-arrow-up' : 'i-heroicons-arrow-down'"
							class="w-4 h-4 mr-1" />
						<span>${{ Math.abs(monthlyChange).toLocaleString() }} MTD</span>
					</div>
				</div>
			</UCard>

			<!-- Reserve Balance -->
			<UCard>
				<div class="space-y-2">
					<p class="text-sm uppercase tracking-wider text-gray-600">RESERVE BALANCE</p>
					<p class="text-2xl font-bold text-gray-900">${{ reserveBalance.toLocaleString() }}</p>
					<p class="text-xs text-gray-500">40-YEAR RECERT FUND</p>
				</div>
			</UCard>

			<!-- Monthly Revenue -->
			<UCard>
				<div class="space-y-2">
					<p class="text-sm uppercase tracking-wider text-gray-600">MONTHLY REVENUE</p>
					<p class="text-2xl font-bold text-green-600">${{ monthlyRevenue.toLocaleString() }}</p>
					<div class="text-xs text-gray-500">
						<span class="font-medium">{{ collectionRate }}%</span>
						COLLECTION RATE
					</div>
				</div>
			</UCard>

			<!-- Monthly Expenses -->
			<UCard>
				<div class="space-y-2">
					<p class="text-sm uppercase tracking-wider text-gray-600">MONTHLY EXPENSES</p>
					<p class="text-2xl font-bold text-gray-900">${{ monthlyExpenses.toLocaleString() }}</p>
					<div class="text-xs" :class="expenseVariance > 0 ? 'text-red-600' : 'text-green-600'">
						<span class="font-medium">{{ Math.abs(expenseVariance) }}%</span>
						{{ expenseVariance > 0 ? 'OVER' : 'UNDER' }} BUDGET
					</div>
				</div>
			</UCard>
		</div>

		<!-- Critical Alerts -->
		<div v-if="criticalAlerts.length > 0" class="mb-8">
			<Alert
				v-for="alert in criticalAlerts"
				:key="alert.id"
				:title="alert.title"
				:description="alert.description"
				color="red"
				variant="subtle"
				class="mb-3">
				<template #icon>
					<UIcon name="i-heroicons-exclamation-triangle" />
				</template>
				<template #actions>
					<UButton
						color="red"
						variant="soft"
						size="xs"
						:to="`/financials/monthly-report/${selectedMonth.replace(' 2025', '').toLowerCase()}`">
						VIEW DETAILS
					</UButton>
				</template>
			</Alert>
		</div>

		<!-- Main Content Tabs -->
		<Tabs :items="tabs" class="space-y-6">
			<!-- Overview Tab -->
			<template #overview>
				<div class="space-y-6 grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
					<!-- Monthly Summary Component -->
					<FinancialsMonthlySummary
						:month="selectedMonth.replace(' 2025', '')"
						:income="monthlyRevenue"
						:expenses="monthlyExpenses"
						:ending-balance="operatingBalance"
						:beginning-balance="beginningBalance"
						:violations="fundSegregationStatus.violations"
						:insurance-expense="insuranceExpense"
						:professional-expense="professionalExpense"
						:utility-expense="utilityExpense"
						:maintenance-expense="maintenanceExpense" />

					<!-- Account Health Status -->
					<UCard>
						<template #header>
							<h3 class="text-lg font-semibold uppercase tracking-wide">ACCOUNT HEALTH STATUS</h3>
						</template>
						<div class="space-y-4">
							<div v-for="account in accountHealth" :key="account.name" class="space-y-2">
								<div class="flex items-center justify-between">
									<span class="font-medium">{{ account.name }}</span>
									<UBadge :color="account.color" variant="subtle">{{ account.status }}</UBadge>
								</div>
								<div class="w-full bg-gray-200 rounded-full h-2">
									<div
										class="h-2 rounded-full transition-all duration-500"
										:class="account.barClass"
										:style="`width: ${account.percent}%`" />
								</div>
								<p class="text-xs text-gray-600">{{ account.note }}</p>
							</div>
						</div>
					</UCard>

					<!-- Monthly Cash Flow -->
					<UCard>
						<template #header>
							<h3 class="text-lg font-semibold uppercase tracking-wide">MONTHLY BREAKDOWN</h3>
						</template>
						<div class="h-64">
							<Bar :data="monthlyBreakdownData" :options="chartOptions" />
						</div>
					</UCard>
				</div>

				<!-- Quick Actions -->
				<div class="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
					<UCard
						class="hover:shadow-lg transition-shadow cursor-pointer"
						@click="navigateTo(`/financials/monthly-report/${selectedMonth.replace(' 2025', '').toLowerCase()}`)">
						<div class="flex items-center space-x-3">
							<div class="p-3 bg-blue-100 rounded-lg">
								<UIcon name="i-heroicons-document-text" class="w-6 h-6 text-blue-600" />
							</div>
							<div>
								<p class="font-semibold uppercase tracking-wide">MONTHLY RECONCILIATION</p>
								<p class="text-sm text-gray-600">View detailed transactions</p>
							</div>
						</div>
					</UCard>

					<UCard class="hover:shadow-lg transition-shadow cursor-pointer">
						<div class="flex items-center space-x-3">
							<div class="p-3 bg-green-100 rounded-lg">
								<UIcon name="i-heroicons-chart-bar" class="w-6 h-6 text-green-600" />
							</div>
							<div>
								<p class="font-semibold uppercase tracking-wide">BUDGET ANALYSIS</p>
								<p class="text-sm text-gray-600">Compare budget vs actual</p>
							</div>
						</div>
					</UCard>

					<UCard class="hover:shadow-lg transition-shadow cursor-pointer">
						<div class="flex items-center space-x-3">
							<div class="p-3 bg-purple-100 rounded-lg">
								<UIcon name="i-heroicons-shield-check" class="w-6 h-6 text-purple-600" />
							</div>
							<div>
								<p class="font-semibold uppercase tracking-wide">COMPLIANCE CHECK</p>
								<p class="text-sm text-gray-600">Fund segregation status</p>
							</div>
						</div>
					</UCard>
				</div>
			</template>

			<!-- Budget Analysis Tab -->
			<template #budget>
				<UCard>
					<template #header>
						<h3 class="text-lg font-semibold uppercase tracking-wide">BUDGET VS ACTUAL - {{ selectedMonth }}</h3>
					</template>
					<div class="space-y-6">
						<!-- Summary Metrics -->
						<div class="grid grid-cols-3 gap-4 text-center">
							<div>
								<p class="text-sm uppercase tracking-wide text-gray-600">YTD VARIANCE</p>
								<p class="text-2xl font-bold" :class="ytdVariance > 0 ? 'text-red-600' : 'text-green-600'">
									{{ ytdVariance > 0 ? '+' : '' }}{{ ytdVariance }}%
								</p>
							</div>
							<div>
								<p class="text-sm uppercase tracking-wide text-gray-600">BUDGET ACCURACY</p>
								<p class="text-2xl font-bold text-gray-900">{{ budgetAccuracy }}%</p>
							</div>
							<div>
								<p class="text-sm uppercase tracking-wide text-gray-600">PROJECTED YEAR-END</p>
								<p class="text-2xl font-bold text-gray-900">${{ projectedYearEnd.toLocaleString() }}</p>
							</div>
						</div>

						<!-- Budget Chart -->
						<div class="h-80">
							<Bar :data="budgetChartData" :options="budgetChartOptions" />
						</div>

						<!-- Variance Table -->
						<Table :rows="budgetVariances" :columns="budgetColumns" />
					</div>
				</UCard>
			</template>

			<!-- Compliance Tab -->
			<template #compliance>
				<div class="space-y-6">
					<!-- Compliance Status -->
					<UCard>
						<template #header>
							<h3 class="text-lg font-semibold uppercase tracking-wide">FUND SEGREGATION COMPLIANCE</h3>
						</template>
						<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div class="space-y-4">
								<div
									class="flex items-center justify-between p-4 rounded-lg"
									:class="
										fundSegregationStatus.compliant
											? 'bg-green-50 border border-green-200'
											: 'bg-red-50 border border-red-200'
									">
									<span class="font-medium">FUND SEGREGATION</span>
									<span class="font-bold" :class="fundSegregationStatus.compliant ? 'text-green-600' : 'text-red-600'">
										{{ fundSegregationStatus.compliant ? '✓ COMPLIANT' : '✗ VIOLATION' }}
									</span>
								</div>
								<div class="flex items-center justify-between p-4 rounded-lg bg-gray-50 border border-gray-200">
									<span class="font-medium">VIOLATIONS THIS MONTH</span>
									<span
										class="font-bold"
										:class="fundSegregationStatus.violations > 0 ? 'text-red-600' : 'text-gray-900'">
										{{ fundSegregationStatus.violations }}
									</span>
								</div>
							</div>
							<div v-if="fundSegregationStatus.violations > 0" class="space-y-2">
								<p class="text-sm font-medium text-red-600 uppercase tracking-wide">REQUIRED ACTIONS:</p>
								<ul class="space-y-1 text-sm">
									<li v-for="action in requiredActions" :key="action" class="flex items-start">
										<UIcon name="i-heroicons-exclamation-circle" class="w-4 h-4 text-red-500 mr-2 mt-0.5" />
										<span>{{ action }}</span>
									</li>
								</ul>
							</div>
						</div>
					</UCard>

					<!-- 30-60-90 Day Action Plan -->
					<UCard>
						<template #header>
							<h3 class="text-lg font-semibold uppercase tracking-wide">30-60-90 DAY ACTION PLAN</h3>
						</template>
						<div class="space-y-4">
							<div v-for="phase in actionPlan" :key="phase.period" class="border-l-4 pl-4" :class="phase.borderClass">
								<h4 class="font-semibold text-lg mb-2">{{ phase.period }}</h4>
								<ul class="space-y-1 text-sm">
									<li v-for="item in phase.items" :key="item" class="flex items-start">
										<UIcon name="i-heroicons-check-circle" class="w-4 h-4 mr-2 mt-0.5" :class="phase.iconClass" />
										<span>{{ item }}</span>
									</li>
								</ul>
							</div>
						</div>
					</UCard>
				</div>
			</template>
		</Tabs>
	</div>
</template>

<script setup>
useSeoMeta({
	title: 'Financial Overview',
});

import {ref, computed} from 'vue';
import {Line, Bar} from 'vue-chartjs';
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	BarElement,
	Title,
	Tooltip,
	Legend,
	Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

// Composables
const {getOperatingData, getReserveData, calculateFinancialHealth, checkCompliance, getViolationCount} =
	useReconciliationData();

// State
const selectedMonth = ref('June 2025');

// Tabs
const tabs = [
	{slot: 'overview', label: 'OVERVIEW', icon: 'i-heroicons-home'},
	{slot: 'budget', label: 'BUDGET ANALYSIS', icon: 'i-heroicons-chart-bar'},
	{slot: 'compliance', label: 'COMPLIANCE', icon: 'i-heroicons-shield-check'},
];

// Month options
const monthOptions = [
	{label: 'JUNE 2025', value: 'June 2025'},
	{label: 'MAY 2025', value: 'May 2025'},
	{label: 'APRIL 2025', value: 'April 2025'},
	{label: 'MARCH 2025', value: 'March 2025'},
	{label: 'FEBRUARY 2025', value: 'February 2025'},
	{label: 'JANUARY 2025', value: 'January 2025'},
];

// Get account data
const operatingData = computed(() => getOperatingData(selectedMonth.value));
const reserveData = computed(() => getReserveData(selectedMonth.value));
const healthStatus = computed(() => calculateFinancialHealth(selectedMonth.value));
const complianceStatus = computed(() => checkCompliance(selectedMonth.value));

// Current month metrics
const operatingBalance = computed(() => operatingData.value?.endingBalance || 0);
const beginningBalance = computed(() => operatingData.value?.beginningBalance || 0);
const reserveBalance = computed(() => reserveData.value?.endingBalance || 13499);
const monthlyRevenue = computed(() => {
	const deposits = operatingData.value?.deposits || [];
	return deposits.reduce((sum, item) => sum + item.amount, 0);
});
const monthlyExpenses = computed(() => {
	const withdrawals = operatingData.value?.withdrawals || [];
	return withdrawals.reduce((sum, item) => sum + item.amount, 0);
});
const monthlyChange = computed(() => monthlyRevenue.value - monthlyExpenses.value);
const collectionRate = computed(() => 94);
const expenseVariance = computed(() => (((monthlyExpenses.value - 17165) / 17165) * 100).toFixed(1));

// YTD Analytics - NEW SECTION
const allMonthsData = computed(() => {
	const months = ['January 2025', 'February 2025', 'March 2025', 'April 2025', 'May 2025', 'June 2025'];
	return months
		.map((month) => ({
			month,
			data: getOperatingData(month),
		}))
		.filter((item) => item.data);
});

const ytdCashChange = computed(() => {
	if (allMonthsData.value.length < 2) return 0;
	const firstMonth = allMonthsData.value[0].data;
	const currentMonth = allMonthsData.value[allMonthsData.value.length - 1].data;
	return (currentMonth?.endingBalance || 0) - (firstMonth?.beginningBalance || 0);
});

const monthlyBurnRate = computed(() => {
	if (ytdCashChange.value >= 0 || allMonthsData.value.length === 0) return 0;
	return Math.abs(Math.round(ytdCashChange.value / allMonthsData.value.length));
});

const cashRunway = computed(() => {
	const months = monthlyBurnRate.value > 0 ? operatingBalance.value / monthlyBurnRate.value : 999;
	return {
		months: Math.round(months * 10) / 10,
		status: months < 6 ? 'CRITICAL' : months < 12 ? 'WARNING' : 'HEALTHY',
		color: months < 6 ? 'text-red-600' : months < 12 ? 'text-yellow-600' : 'text-green-600',
	};
});

const financialHealth = computed(() => {
	let score = 100;

	// Operating balance health (40% weight)
	if (operatingBalance.value < 25000) score -= 40;
	else if (operatingBalance.value < 35000) score -= 20;

	// Cash trend health (30% weight)
	if (ytdCashChange.value < -20000) score -= 30;
	else if (ytdCashChange.value < -10000) score -= 15;

	// Budget compliance (30% weight)
	const budgetUtil = Math.abs(ytdBudgetUtilization.value);
	if (budgetUtil > 110) score -= 30;
	else if (budgetUtil > 100) score -= 15;

	return {
		score: Math.max(score, 0),
		status: score >= 80 ? 'EXCELLENT' : score >= 60 ? 'GOOD' : score >= 40 ? 'NEEDS ATTENTION' : 'CRITICAL',
		color:
			score >= 80 ? 'text-green-600' : score >= 60 ? 'text-blue-600' : score >= 40 ? 'text-yellow-600' : 'text-red-600',
	};
});

const ytdBudgetUtilization = computed(() => {
	// Rough calculation based on 6 months
	const monthsElapsed = 6;
	const expectedUtilization = (monthsElapsed / 12) * 100; // ~50% by June
	const actualSpent = Math.abs(ytdCashChange.value);
	const annualBudget = 206000; // Rough estimate
	const actualUtilization = (actualSpent / annualBudget) * 100;

	return actualUtilization;
});

const ytdBudgetCategories = computed(() => [
	{
		name: 'Insurance',
		utilization: 85,
		variance: 15.2,
	},
	{
		name: 'Professional',
		utilization: 45,
		variance: -10.5,
	},
	{
		name: 'Utilities',
		utilization: 52,
		variance: 8.3,
	},
	{
		name: 'Maintenance',
		utilization: 68,
		variance: 22.1,
	},
]);

const ytdViolations = computed(() => {
	return allMonthsData.value.reduce((total, monthData) => {
		return total + (monthData.data?.violations?.length || 0);
	}, 0);
});

// YTD Cash Flow Chart Data
const ytdCashFlowData = computed(() => {
	const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN'];
	const balances = [64114, 54853, 44695, 52296, 33888, 33472]; // Sample data
	const revenueData = [14000, 14000, 14000, 14000, 14000, 14000];
	const expenseData = [23261, 23408, 9842, 6557, 32408, 14416];

	return {
		labels: months,
		datasets: [
			{
				label: 'Operating Balance',
				data: balances,
				borderColor: 'rgb(59, 130, 246)',
				backgroundColor: 'rgba(59, 130, 246, 0.1)',
				tension: 0.3,
				yAxisID: 'y',
			},
			{
				label: 'Monthly Revenue',
				data: revenueData,
				borderColor: 'rgb(34, 197, 94)',
				backgroundColor: 'rgba(34, 197, 94, 0.1)',
				tension: 0.3,
				yAxisID: 'y1',
			},
			{
				label: 'Monthly Expenses',
				data: expenseData,
				borderColor: 'rgb(239, 68, 68)',
				backgroundColor: 'rgba(239, 68, 68, 0.1)',
				tension: 0.3,
				yAxisID: 'y1',
			},
		],
	};
});

const ytdChartOptions = {
	responsive: true,
	maintainAspectRatio: false,
	interaction: {
		mode: 'index',
		intersect: false,
	},
	plugins: {
		legend: {
			position: 'bottom',
		},
		tooltip: {
			callbacks: {
				label: (context) => `${context.dataset.label}: $${context.parsed.y.toLocaleString()}`,
			},
		},
	},
	scales: {
		y: {
			type: 'linear',
			display: true,
			position: 'left',
			title: {
				display: true,
				text: 'Account Balance ($)',
			},
			ticks: {
				callback: (value) => '$' + value.toLocaleString(),
			},
		},
		y1: {
			type: 'linear',
			display: true,
			position: 'right',
			title: {
				display: true,
				text: 'Monthly Cash Flow ($)',
			},
			ticks: {
				callback: (value) => '$' + value.toLocaleString(),
			},
			grid: {
				drawOnChartArea: false,
			},
		},
	},
};

// Monthly breakdown chart for current month
const monthlyBreakdownData = computed(() => ({
	labels: ['Revenue', 'Insurance', 'Professional', 'Utilities', 'Maintenance', 'Other'],
	datasets: [
		{
			data: [
				monthlyRevenue.value,
				insuranceExpense.value,
				professionalExpense.value,
				utilityExpense.value,
				maintenanceExpense.value,
				Math.max(
					0,
					monthlyExpenses.value -
						(insuranceExpense.value + professionalExpense.value + utilityExpense.value + maintenanceExpense.value)
				),
			],
			backgroundColor: [
				'rgba(34, 197, 94, 0.8)',
				'rgba(239, 68, 68, 0.8)',
				'rgba(59, 130, 246, 0.8)',
				'rgba(251, 191, 36, 0.8)',
				'rgba(156, 163, 175, 0.8)',
				'rgba(139, 69, 19, 0.8)',
			],
		},
	],
}));

// Existing computed properties and data remain the same...
const criticalAlerts = computed(() => {
	const alerts = [];

	if (operatingBalance.value < 25000) {
		alerts.push({
			id: 1,
			title: 'LOW OPERATING BALANCE',
			description: `Operating account below $25,000 minimum. Current balance: ${operatingBalance.value.toLocaleString()}`,
		});
	}

	if (cashRunway.value.months < 12) {
		alerts.push({
			id: 2,
			title: 'CASH RUNWAY WARNING',
			description: `At current burn rate, funds will be depleted in ${cashRunway.value.months} months`,
		});
	}

	const violationCount = operatingData.value?.violations?.length || 0;
	if (violationCount > 0) {
		alerts.push({
			id: 3,
			title: 'FUND MIXING VIOLATION',
			description: `${violationCount} improper transfers detected between operating and reserve accounts`,
		});
	}

	return alerts;
});

// All other existing computed properties remain the same...
const insuranceExpense = computed(() => {
	const withdrawals = operatingData.value?.withdrawals || [];
	return withdrawals
		.filter((w) => w.category === 'Insurance' || w.vendor?.toLowerCase().includes('insurance'))
		.reduce((sum, w) => sum + w.amount, 0);
});

const professionalExpense = computed(() => {
	const withdrawals = operatingData.value?.withdrawals || [];
	return withdrawals
		.filter(
			(w) =>
				w.category === 'Professional' ||
				w.vendor?.toLowerCase().includes('consult') ||
				w.vendor?.toLowerCase().includes('vte')
		)
		.reduce((sum, w) => sum + w.amount, 0);
});

const utilityExpense = computed(() => {
	const withdrawals = operatingData.value?.withdrawals || [];
	return withdrawals
		.filter(
			(w) =>
				w.category === 'Utilities' ||
				w.vendor?.toLowerCase().includes('teco') ||
				w.vendor?.toLowerCase().includes('fpl') ||
				w.vendor?.toLowerCase().includes('gas') ||
				w.vendor?.toLowerCase().includes('elevator') ||
				w.vendor?.toLowerCase().includes('breezeline')
		)
		.reduce((sum, w) => sum + w.amount, 0);
});

const maintenanceExpense = computed(() => {
	const withdrawals = operatingData.value?.withdrawals || [];
	return withdrawals
		.filter((w) => w.category === 'Maintenance' || w.category === 'Repairs')
		.reduce((sum, w) => sum + w.amount, 0);
});

const accountHealth = computed(() => [
	{
		name: 'Operating Account (5129)',
		balance: operatingBalance.value,
		percent: Math.min((operatingBalance.value / 50000) * 100, 100),
		status: operatingBalance.value < 25000 ? 'CRITICAL' : operatingBalance.value < 35000 ? 'WARNING' : 'HEALTHY',
		color: operatingBalance.value < 25000 ? 'red' : operatingBalance.value < 35000 ? 'yellow' : 'green',
		barClass:
			operatingBalance.value < 25000 ? 'bg-red-500' : operatingBalance.value < 35000 ? 'bg-yellow-500' : 'bg-green-500',
		note: operatingBalance.value < 25000 ? 'Below minimum required balance' : 'Sufficient for operations',
	},
	{
		name: 'Reserve Account (5872)',
		balance: reserveBalance.value,
		percent: 100,
		status: 'RESTRICTED',
		color: 'blue',
		barClass: 'bg-blue-500',
		note: '40-year recertification funds only',
	},
]);

const chartOptions = {
	responsive: true,
	maintainAspectRatio: false,
	plugins: {
		legend: {
			display: false,
		},
	},
};

// Budget analysis
const ytdVariance = ref(8.3);
const budgetAccuracy = ref(72);
const projectedYearEnd = ref(245000);

const budgetVariances = computed(() => [
	{
		category: 'Insurance',
		budgeted: 9659,
		actual: insuranceExpense.value || 0,
		variance: (insuranceExpense.value || 0) - 9659,
		percent: insuranceExpense.value ? (((insuranceExpense.value - 9659) / 9659) * 100).toFixed(1) : '0.0',
	},
	{
		category: 'Professional Fees',
		budgeted: 700,
		actual: professionalExpense.value || 0,
		variance: (professionalExpense.value || 0) - 700,
		percent: professionalExpense.value ? (((professionalExpense.value - 700) / 700) * 100).toFixed(1) : '0.0',
	},
	{
		category: 'Utilities',
		budgeted: 2339,
		actual: utilityExpense.value || 0,
		variance: (utilityExpense.value || 0) - 2339,
		percent: utilityExpense.value ? (((utilityExpense.value - 2339) / 2339) * 100).toFixed(1) : '0.0',
	},
	{
		category: 'Maintenance',
		budgeted: 4379,
		actual: maintenanceExpense.value || 0,
		variance: (maintenanceExpense.value || 0) - 4379,
		percent: maintenanceExpense.value ? (((maintenanceExpense.value - 4379) / 4379) * 100).toFixed(1) : '0.0',
	},
]);

const budgetColumns = [
	{key: 'category', label: 'CATEGORY'},
	{key: 'budgeted', label: 'BUDGET'},
	{key: 'actual', label: 'ACTUAL'},
	{key: 'variance', label: 'VARIANCE'},
	{key: 'percent', label: '%'},
];

const budgetChartData = computed(() => ({
	labels: budgetVariances.value.map((v) => v.category),
	datasets: [
		{
			label: 'Budgeted',
			data: budgetVariances.value.map((v) => v.budgeted),
			backgroundColor: 'rgba(156, 163, 175, 0.8)',
		},
		{
			label: 'Actual',
			data: budgetVariances.value.map((v) => v.actual),
			backgroundColor: budgetVariances.value.map((v) =>
				v.variance > 0 ? 'rgba(239, 68, 68, 0.8)' : 'rgba(34, 197, 94, 0.8)'
			),
		},
	],
}));

const budgetChartOptions = {
	responsive: true,
	maintainAspectRatio: false,
	plugins: {
		legend: {
			display: true,
			position: 'bottom',
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
};

// Compliance
const fundSegregationStatus = computed(() => ({
	compliant: (operatingData.value?.violations?.length || 0) === 0,
	violations: operatingData.value?.violations?.length || 0,
}));

const requiredActions = [
	'Stop all inter-account transfers immediately',
	'Document and reverse improper transfers',
	'Implement dual approval for all transfers',
	'Schedule emergency board meeting',
];

const actionPlan = [
	{
		period: '30 DAYS - IMMEDIATE ACTIONS',
		borderClass: 'border-red-500',
		iconClass: 'text-red-500',
		items: [
			'Freeze inter-account transfers',
			'Document all violations',
			'Emergency board meeting',
			'Implement expense controls',
		],
	},
	{
		period: '60 DAYS - CORRECTIVE MEASURES',
		borderClass: 'border-yellow-500',
		iconClass: 'text-yellow-500',
		items: [
			'Establish fund segregation policy',
			'Renegotiate insurance payment schedule',
			'Audit all legal expenses',
			'Train management company',
		],
	},
	{
		period: '90 DAYS - LONG-TERM CONTROLS',
		borderClass: 'border-green-500',
		iconClass: 'text-green-500',
		items: [
			'Monthly reconciliation process',
			'Quarterly compliance audits',
			'Vendor management system',
			'Board approval workflow',
		],
	},
];

// Navigation helper
const router = useRouter();
const navigateTo = (path) => router.push(path);
</script>
