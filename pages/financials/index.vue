<template>
	<div class="p-6 space-y-8">
		<!-- Header -->
		<div class="flex justify-between items-start">
			<div>
				<h1 class="text-3xl font-bold text-gray-900">Financial Dashboard</h1>
				<p class="text-gray-600 mt-1">Lenox Plaza Association - Miami Beach, Florida</p>
			</div>
			<div class="flex gap-3">
				<UBadge
					:color="
						complianceRisk.riskLevel === 'CRITICAL' ? 'red' : complianceRisk.riskLevel === 'HIGH' ? 'orange' : 'green'
					"
					size="lg"
					class="px-4 py-2"
				>
					FL Compliance: {{ complianceRisk.riskLevel }}
				</UBadge>
				<UBadge :color="financialHealth.color" size="lg" class="px-4 py-2">
					{{ financialHealth.status }}: {{ financialHealth.score }}/100
				</UBadge>
			</div>
		</div>

		<!-- 🚨 CRITICAL COMPLIANCE ALERTS - FLORIDA LAW -->
		<div v-if="criticalViolations.length > 0" class="space-y-4">
			<div class="bg-red-50 border-2 border-red-200 rounded-lg p-6">
				<div class="flex items-start gap-4">
					<UIcon name="i-heroicons-exclamation-triangle" class="text-red-600 text-2xl mt-1" />
					<div class="flex-1">
						<h2 class="text-2xl font-bold text-red-800 mb-4">🚨 FLORIDA STATUTE VIOLATIONS DETECTED</h2>
						<div class="bg-red-100 p-4 rounded-lg mb-4">
							<p class="text-red-800 text-lg font-semibold">⚖️ BOARD MEMBER PERSONAL LIABILITY RISK</p>
							<p class="text-red-700 mt-2">
								Under Florida Chapter 720, board members may face
								<strong>personal financial liability</strong>
								and
								<strong>criminal penalties</strong>
								for fund mixing violations.
							</p>
						</div>
					</div>
				</div>
			</div>

			<!-- Individual Violation Alerts -->
			<div class="grid grid-cols-1 gap-4">
				<UAlert
					v-for="violation in criticalViolations"
					:key="violation.type"
					:icon="
						violation.severity === 'CRITICAL' ? 'i-heroicons-exclamation-triangle' : 'i-heroicons-exclamation-circle'
					"
					:color="violation.severity === 'CRITICAL' ? 'red' : 'orange'"
					variant="solid"
					:title="violation.title"
					:description="violation.description"
				>
					<template #title>
						<div class="flex justify-between items-start">
							<span>{{ violation.title }}</span>
							<UBadge color="white" variant="solid" size="xs">
								{{ violation.statute }}
							</UBadge>
						</div>
					</template>

					<div class="mt-3 p-3 bg-white bg-opacity-20 rounded">
						<p class="text-sm font-semibold">⚖️ Legal Risk: {{ violation.legalRisk }}</p>
						<p class="text-sm mt-1">💰 Penalty: {{ violation.penalty }}</p>
						<p class="text-sm mt-1 font-semibold">🎯 Immediate Action: {{ violation.immediateAction }}</p>
					</div>
				</UAlert>
			</div>
		</div>

		<!-- EMERGENCY ACTIONS REQUIRED -->
		<UCard v-if="emergencyActions.length > 0" class="border-2 border-red-300">
			<template #header>
				<div class="flex items-center gap-3">
					<UIcon name="i-heroicons-fire" class="text-red-600 text-xl" />
					<h3 class="text-lg font-bold text-red-800">EMERGENCY ACTIONS REQUIRED</h3>
					<UBadge color="red" variant="solid">IMMEDIATE</UBadge>
				</div>
			</template>

			<div class="space-y-4">
				<div
					v-for="action in emergencyActions"
					:key="action.priority"
					class="flex items-start gap-4 p-4 bg-red-50 rounded-lg"
				>
					<div class="bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
						{{ action.priority }}
					</div>
					<div class="flex-1">
						<h4 class="font-bold text-red-800">{{ action.action.replace(/_/g, ' ') }}</h4>
						<p class="text-red-700 mt-1">{{ action.description }}</p>
						<div class="flex gap-4 mt-2">
							<UBadge :color="action.timeframe === 'IMMEDIATE' ? 'red' : 'orange'" variant="soft" size="xs">
								{{ action.timeframe.replace(/_/g, ' ') }}
							</UBadge>
							<span class="text-sm text-red-600">Responsible: {{ action.responsible }}</span>
						</div>
					</div>
				</div>
			</div>
		</UCard>

		<!-- Board Protection Actions -->
		<UCard class="border-2 border-blue-300">
			<template #header>
				<div class="flex items-center gap-3">
					<UIcon name="i-heroicons-shield-check" class="text-blue-600 text-xl" />
					<h3 class="text-lg font-bold text-blue-800">BOARD MEMBER PROTECTION ACTIONS</h3>
				</div>
			</template>

			<div class="space-y-4">
				<div
					v-for="protection in boardProtections"
					:key="protection.protection"
					class="p-4 border border-blue-200 rounded-lg"
				>
					<div class="flex justify-between items-start mb-2">
						<h4 class="font-bold text-blue-800">{{ protection.title }}</h4>
						<UBadge
							:color="
								protection.urgency === 'IMMEDIATE' ? 'red' : protection.urgency === 'THIS_WEEK' ? 'orange' : 'blue'
							"
							variant="soft"
							size="xs"
						>
							{{ protection.urgency.replace(/_/g, ' ') }}
						</UBadge>
					</div>
					<p class="text-blue-700 text-sm">{{ protection.description }}</p>
					<div v-if="protection.template" class="mt-3 p-3 bg-blue-50 rounded text-xs font-mono">
						{{ protection.template }}
					</div>
				</div>
			</div>
		</UCard>

		<!-- Florida Compliance Checklist -->
		<UCard>
			<template #header>
				<h3 class="text-lg font-semibold flex items-center gap-2">
					<UIcon name="i-heroicons-clipboard-document-check" />
					Florida Chapter 720 Compliance Status
				</h3>
			</template>

			<div class="space-y-4">
				<div
					v-for="item in complianceChecklist"
					:key="item.item"
					class="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
				>
					<div class="flex-1">
						<div class="flex items-center gap-3">
							<UIcon
								:name="
									item.compliant === true
										? 'i-heroicons-check-circle'
										: item.compliant === false
											? 'i-heroicons-x-circle'
											: 'i-heroicons-question-mark-circle'
								"
								:class="
									item.compliant === true
										? 'text-green-600'
										: item.compliant === false
											? 'text-red-600'
											: 'text-yellow-600'
								"
								class="text-xl"
							/>
							<div>
								<h4 class="font-semibold">{{ item.item }}</h4>
								<p class="text-sm text-gray-600">{{ item.requirement }}</p>
								<UBadge color="gray" variant="soft" size="xs" class="mt-1">{{ item.statute }}</UBadge>
							</div>
						</div>
					</div>
					<div class="text-right">
						<UBadge
							:color="item.compliant === true ? 'green' : item.compliant === false ? 'red' : 'yellow'"
							variant="soft"
						>
							{{ item.compliant === true ? 'COMPLIANT' : item.compliant === false ? 'VIOLATION' : 'UNKNOWN' }}
						</UBadge>
						<p v-if="item.action" class="text-xs text-gray-600 mt-1 max-w-48">{{ item.action }}</p>
					</div>
				</div>
			</div>
		</UCard>

		<!-- Account Balances Overview -->
		<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
			<UCard>
				<template #header>
					<h3 class="text-lg font-semibold flex items-center gap-2">
						<UIcon name="i-heroicons-banknotes" />
						Account Balances
					</h3>
				</template>

				<div class="space-y-4">
					<div v-for="account in accountBalances" :key="account.name" class="space-y-2">
						<div class="flex justify-between items-center">
							<span class="font-medium">{{ account.name }}</span>
							<span :class="account.color" class="font-bold">${{ account.balance.toLocaleString() }}</span>
						</div>
						<div class="w-full bg-gray-200 rounded-full h-2">
							<div
								:class="account.barClass"
								class="h-2 rounded-full transition-all duration-300"
								:style="{ width: `${Math.min(account.percent, 100)}%` }"
							></div>
						</div>
						<p class="text-sm text-gray-600">{{ account.note }}</p>
					</div>
				</div>
			</UCard>

			<!-- Cash Flow Summary -->
			<UCard>
				<template #header>
					<h3 class="text-lg font-semibold flex items-center gap-2">
						<UIcon name="i-heroicons-arrow-trending-up" />
						Cash Flow Analysis
					</h3>
				</template>

				<div class="space-y-4">
					<div class="grid grid-cols-2 gap-4">
						<div class="text-center">
							<p class="text-sm text-gray-600">Monthly Revenue</p>
							<p class="text-xl font-bold text-green-600">${{ monthlyRevenue.toLocaleString() }}</p>
						</div>
						<div class="text-center">
							<p class="text-sm text-gray-600">Monthly Expenses</p>
							<p class="text-xl font-bold text-red-600">${{ monthlyExpenses.toLocaleString() }}</p>
						</div>
					</div>

					<div class="text-center border-t pt-4">
						<p class="text-sm text-gray-600">Net Cash Flow</p>
						<p :class="monthlyChange >= 0 ? 'text-green-600' : 'text-red-600'" class="text-2xl font-bold">
							{{ monthlyChange >= 0 ? '+' : '' }}${{ monthlyChange.toLocaleString() }}
						</p>
					</div>

					<div class="grid grid-cols-2 gap-4 pt-4 border-t">
						<div class="text-center">
							<p class="text-sm text-gray-600">Burn Rate</p>
							<p class="text-lg font-semibold">${{ monthlyBurnRate.toLocaleString() }}/mo</p>
						</div>
						<div class="text-center">
							<p class="text-sm text-gray-600">Cash Runway</p>
							<p :class="cashRunway.color" class="text-lg font-semibold">{{ cashRunway.months }} months</p>
						</div>
					</div>
				</div>
			</UCard>
		</div>

		<!-- Budget vs Actual Analysis -->
		<UCard>
			<template #header>
				<div class="flex justify-between items-center">
					<h3 class="text-lg font-semibold flex items-center gap-2">
						<UIcon name="i-heroicons-calculator" />
						Budget vs Actual Analysis (Current Month)
					</h3>
					<UBadge color="blue" variant="soft">Based on 2025 Operating Budget</UBadge>
				</div>
			</template>

			<div class="space-y-6">
				<!-- Budget Overview -->
				<div class="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
					<div class="text-center">
						<p class="text-sm text-gray-600">Monthly Budget</p>
						<p class="text-xl font-bold">${{ budget.totals.monthly.toLocaleString() }}</p>
					</div>
					<div class="text-center">
						<p class="text-sm text-gray-600">Actual Expenses</p>
						<p class="text-xl font-bold text-red-600">${{ monthlyExpenses.toLocaleString() }}</p>
					</div>
					<div class="text-center">
						<p class="text-sm text-gray-600">Variance</p>
						<p :class="expenseVariance >= 0 ? 'text-red-600' : 'text-green-600'" class="text-xl font-bold">
							{{ expenseVariance >= 0 ? '+' : '' }}{{ expenseVariance }}%
						</p>
					</div>
				</div>

				<!-- Category Breakdown -->
				<UTable :rows="budgetVariances" :columns="budgetColumns">
					<template #category-data="{ row }">
						<span class="font-medium">{{ row.category }}</span>
					</template>
					<template #budgeted-data="{ row }">
						<span class="text-gray-900">${{ row.budgeted.toLocaleString() }}</span>
					</template>
					<template #actual-data="{ row }">
						<span class="font-semibold">${{ row.actual.toLocaleString() }}</span>
					</template>
					<template #variance-data="{ row }">
						<span :class="row.variance >= 0 ? 'text-red-600' : 'text-green-600'" class="font-semibold">
							{{ row.variance >= 0 ? '+' : '' }}${{ Math.abs(row.variance).toLocaleString() }}
						</span>
					</template>
					<template #percent-data="{ row }">
						<UBadge :color="row.variance > 10 ? 'red' : row.variance < -10 ? 'green' : 'gray'" variant="soft">
							{{ row.percent }}%
						</UBadge>
					</template>
				</UTable>
			</div>
		</UCard>

		<!-- YTD Performance Chart -->
		<UCard>
			<template #header>
				<h3 class="text-lg font-semibold flex items-center gap-2">
					<UIcon name="i-heroicons-chart-bar" />
					Year-to-Date Performance
				</h3>
			</template>

			<div class="space-y-6">
				<div class="grid grid-cols-1 md:grid-cols-4 gap-6">
					<div class="text-center">
						<p class="text-sm text-gray-600">YTD Cash Change</p>
						<p :class="ytdCashChange >= 0 ? 'text-green-600' : 'text-red-600'" class="text-2xl font-bold">
							{{ ytdCashChange >= 0 ? '+' : '' }}${{ ytdCashChange.toLocaleString() }}
						</p>
					</div>
					<div class="text-center">
						<p class="text-sm text-gray-600">Budget Utilization</p>
						<p class="text-2xl font-bold">{{ ytdBudgetUtilization.toFixed(1) }}%</p>
					</div>
					<div class="text-center">
						<p class="text-sm text-gray-600">Collection Rate</p>
						<p class="text-2xl font-bold text-green-600">{{ collectionRate }}%</p>
					</div>
					<div class="text-center">
						<p class="text-sm text-gray-600">Violations</p>
						<p class="text-2xl font-bold text-red-600">{{ ytdViolations }}</p>
					</div>
				</div>

				<div class="h-80">
					<Line :data="ytdCashFlowData" :options="ytdChartOptions" />
				</div>
			</div>
		</UCard>

		<!-- Emergency Contact Information -->
		<UCard class="border-2 border-yellow-300">
			<template #header>
				<div class="flex items-center gap-3">
					<UIcon name="i-heroicons-phone" class="text-yellow-600 text-xl" />
					<h3 class="text-lg font-bold text-yellow-800">Emergency Legal Contacts</h3>
				</div>
			</template>

			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div class="p-4 bg-yellow-50 rounded-lg">
					<h4 class="font-bold text-yellow-800">HOA Attorney</h4>
					<p class="text-yellow-700 text-sm">Consult your HOA attorney immediately for fund mixing violations</p>
				</div>
				<div class="p-4 bg-yellow-50 rounded-lg">
					<h4 class="font-bold text-yellow-800">DBPR</h4>
					<p class="text-yellow-700 text-sm">Department of Business and Professional Regulation</p>
					<p class="text-yellow-800 font-semibold">(850) 487-1395</p>
				</div>
				<div class="p-4 bg-yellow-50 rounded-lg">
					<h4 class="font-bold text-yellow-800">Emergency Meeting</h4>
					<p class="text-yellow-700 text-sm">Schedule emergency board meeting within 7 days per Florida statutes</p>
				</div>
			</div>
		</UCard>
	</div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { Line } from 'vue-chartjs';
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend,
} from 'chart.js';

// Import composables
import { useReconciliationData } from '~/composables/useReconciliationData';
import { useBudgetData } from '~/composables/useBudgetData';
import { useFloridaCompliance } from '~/composables/useFloridaCompliance';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// Initialize composables
const { getOperatingData, getReserveData, getSpecialAssessmentData } = useReconciliationData();
const { budget2025: budget } = useBudgetData();
const { checkViolations, getBoardProtections, calculateLiabilityRisk, getComplianceChecklist } = useFloridaCompliance();

// Get current month data (June 2025)
const currentMonth = 'June 2025';
const operatingData = computed(() => getOperatingData(currentMonth));
const reserveData = computed(() => getReserveData(currentMonth)); // Now using proper 7011 data

// Florida compliance monitoring with correct account structure
const { violations: criticalViolations, emergencyActions } = checkViolations(
	operatingData.value, // Account 5129
	reserveData.value, // Account 7011
	getSpecialAssessmentData(currentMonth), // Account 5872
);

const boardProtections = getBoardProtections();
const complianceRisk = calculateLiabilityRisk(criticalViolations);
const complianceChecklist = getComplianceChecklist();

// Account balances and financial calculations
const operatingBalance = computed(() => operatingData.value?.endingBalance || 33887.93);
const reserveBalance = computed(() => reserveData.value?.endingBalance || 14316.99); // Account 7011
const specialAssessmentBalance = computed(() => getSpecialAssessmentData(currentMonth)?.endingBalance || 31406.58); // Account 5872

const accountBalances = computed(() => [
	{
		name: 'Operating Account (5129)',
		balance: operatingBalance.value,
		percent: Math.max(0, Math.min(100, (operatingBalance.value / 50000) * 100)),
		status: operatingBalance.value < 25000 ? 'CRITICAL' : operatingBalance.value < 35000 ? 'WARNING' : 'HEALTHY',
		color:
			operatingBalance.value < 25000
				? 'text-red-600'
				: operatingBalance.value < 35000
					? 'text-yellow-600'
					: 'text-green-600',
		barClass:
			operatingBalance.value < 25000 ? 'bg-red-500' : operatingBalance.value < 35000 ? 'bg-yellow-500' : 'bg-green-500',
		note: operatingBalance.value < 25000 ? 'Below minimum required balance' : 'Day-to-day expenses only',
	},
	{
		name: 'Reserve Account (7011)',
		balance: reserveBalance.value,
		percent: Math.max(0, Math.min(100, (reserveBalance.value / 75000) * 100)), // Against recommended minimum
		status: 'CRITICAL',
		color: 'text-red-600',
		barClass: 'bg-red-500',
		note: `Critically underfunded - ${(75000 - reserveBalance.value).toLocaleString()} below recommended minimum`,
	},
	{
		name: '40-Year Special Assessment (5872)',
		balance: specialAssessmentBalance.value,
		percent: 50, // Arbitrary percentage for display
		status: 'VIOLATED',
		color: 'text-orange-600',
		barClass: 'bg-orange-500',
		note: 'Fund mixing violations detected - recertification project funds only',
	},
]);

// Cash flow calculations
const monthlyRevenue = computed(() => {
	const deposits = operatingData.value?.deposits || [];
	const actualRevenue = deposits.reduce((sum, item) => sum + item.amount, 0);
	return actualRevenue > 0 ? actualRevenue : budget.revenue.total.monthly;
});

const monthlyExpenses = computed(() => {
	const withdrawals = operatingData.value?.withdrawals || [];
	return withdrawals.reduce((sum, item) => sum + item.amount, 0);
});

const monthlyChange = computed(() => monthlyRevenue.value - monthlyExpenses.value);

// Calculate expense by category from actual data
const expensesByCategory = computed(() => {
	const withdrawals = operatingData.value?.withdrawals || [];
	const categories = {};

	withdrawals.forEach((withdrawal) => {
		const category = withdrawal.category === 'Management' ? 'Professional' : withdrawal.category;
		if (!categories[category]) categories[category] = 0;
		categories[category] += withdrawal.amount;
	});

	return categories;
});

// Budget variance calculations
const budgetVariances = computed(() => [
	{
		category: 'Insurance',
		budgeted: budget.categories.Insurance.monthly,
		actual: expensesByCategory.value.Insurance || 0,
		variance: (expensesByCategory.value.Insurance || 0) - budget.categories.Insurance.monthly,
		percent: expensesByCategory.value.Insurance
			? (
					((expensesByCategory.value.Insurance - budget.categories.Insurance.monthly) /
						budget.categories.Insurance.monthly) *
					100
				).toFixed(1)
			: '0.0',
	},
	{
		category: 'Professional Fees',
		budgeted: budget.categories.Professional.monthly,
		actual: expensesByCategory.value.Professional || 0,
		variance: (expensesByCategory.value.Professional || 0) - budget.categories.Professional.monthly,
		percent: expensesByCategory.value.Professional
			? (
					((expensesByCategory.value.Professional - budget.categories.Professional.monthly) /
						budget.categories.Professional.monthly) *
					100
				).toFixed(1)
			: '0.0',
	},
	{
		category: 'Utilities',
		budgeted: budget.categories.Utilities.monthly,
		actual: expensesByCategory.value.Utilities || 0,
		variance: (expensesByCategory.value.Utilities || 0) - budget.categories.Utilities.monthly,
		percent: expensesByCategory.value.Utilities
			? (
					((expensesByCategory.value.Utilities - budget.categories.Utilities.monthly) /
						budget.categories.Utilities.monthly) *
					100
				).toFixed(1)
			: '0.0',
	},
	{
		category: 'Maintenance',
		budgeted: budget.categories.Maintenance.monthly,
		actual: expensesByCategory.value.Maintenance || 0,
		variance: expensesByCategory.value.Maintenance - budget.categories.Maintenance.monthly,
		percent: expensesByCategory.value.Maintenance
			? (
					((expensesByCategory.value.Maintenance - budget.categories.Maintenance.monthly) /
						budget.categories.Maintenance.monthly) *
					100
				).toFixed(1)
			: '0.0',
	},
]);

const budgetColumns = [
	{ key: 'category', label: 'CATEGORY' },
	{ key: 'budgeted', label: 'BUDGET' },
	{ key: 'actual', label: 'ACTUAL' },
	{ key: 'variance', label: 'VARIANCE' },
	{ key: 'percent', label: '%' },
];

// Other computed values
const collectionRate = computed(() => 94);
const expenseVariance = computed(() =>
	(((monthlyExpenses.value - budget.totals.monthly) / budget.totals.monthly) * 100).toFixed(1),
);
const ytdCashChange = computed(() => -30226);
const monthlyBurnRate = computed(() => Math.abs(Math.round(ytdCashChange.value / 6)));
const cashRunway = computed(() => {
	const months = monthlyBurnRate.value > 0 ? operatingBalance.value / monthlyBurnRate.value : 999;
	return {
		months: Math.round(months * 10) / 10,
		status: months < 6 ? 'CRITICAL' : months < 12 ? 'WARNING' : 'HEALTHY',
		color: months < 6 ? 'text-red-600' : months < 12 ? 'text-yellow-600' : 'text-green-600',
	};
});

const ytdBudgetUtilization = computed(() => {
	const monthsElapsed = 6;
	const actualSpent = Math.abs(ytdCashChange.value);
	const annualBudget = budget.totals.yearly;
	const actualUtilization = (actualSpent / annualBudget) * 100;
	return actualUtilization;
});

const ytdViolations = computed(() => 15);

// Financial health score
const financialHealth = computed(() => {
	let score = 100;

	if (operatingBalance.value < 25000) score -= 40;
	else if (operatingBalance.value < 35000) score -= 20;

	if (ytdCashChange.value < -30000) score -= 30;
	else if (ytdCashChange.value < -20000) score -= 15;

	// Severe penalty for compliance violations
	if (complianceRisk.riskLevel === 'CRITICAL') score -= 50;
	else if (complianceRisk.riskLevel === 'HIGH') score -= 30;

	return {
		score: Math.max(score, 0),
		status:
			complianceRisk.riskLevel === 'CRITICAL'
				? 'CRITICAL'
				: score >= 80
					? 'EXCELLENT'
					: score >= 60
						? 'GOOD'
						: score >= 40
							? 'NEEDS ATTENTION'
							: 'CRITICAL',
		color:
			complianceRisk.riskLevel === 'CRITICAL'
				? 'red'
				: score >= 80
					? 'green'
					: score >= 60
						? 'blue'
						: score >= 40
							? 'yellow'
							: 'red',
	};
});

// Chart data
const ytdCashFlowData = computed(() => {
	const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN'];
	const balances = [64114, 54853, 44695, 52296, 33888, 33472];
	const revenueData = [14784, 14784, 14784, 14784, 14784, 14784];
	const expenseData = [25261, 25279, 79311, 18557, 41176, 14416];

	return {
		labels: months,
		datasets: [
			{
				label: 'Operating Balance',
				data: balances,
				borderColor: 'rgb(59, 130, 246)',
				backgroundColor: 'rgba(59, 130, 246, 0.1)',
				tension: 0.3,
			},
			{
				label: 'Monthly Revenue',
				data: revenueData,
				borderColor: 'rgb(34, 197, 94)',
				backgroundColor: 'rgba(34, 197, 94, 0.1)',
				tension: 0.3,
			},
			{
				label: 'Monthly Expenses',
				data: expenseData,
				borderColor: 'rgb(239, 68, 68)',
				backgroundColor: 'rgba(239, 68, 68, 0.1)',
				tension: 0.3,
			},
		],
	};
});

const ytdChartOptions = {
	responsive: true,
	maintainAspectRatio: false,
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
			beginAtZero: false,
			ticks: {
				callback: (value) => '$' + value.toLocaleString(),
			},
		},
	},
};
</script>
