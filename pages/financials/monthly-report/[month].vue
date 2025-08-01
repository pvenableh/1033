<template>
	<div class="max-w-7xl mx-auto p-6">
		<!-- Header -->
		<div class="mb-8">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-3xl font-bold uppercase tracking-wider mb-2">MONTHLY RECONCILIATION REPORT</h1>
					<p class="text-gray-600">{{ monthDisplay }} 2025 - CHASE ACCOUNT 5129 (OPERATING)</p>
				</div>
				<UButton color="gray" variant="ghost" icon="i-heroicons-arrow-left" to="/financials">BACK TO DASHBOARD</UButton>
			</div>
		</div>

		<!-- Account Summary Card -->
		<UCard class="mb-8">
			<template #header>
				<h2 class="text-xl font-semibold uppercase tracking-wide">ACCOUNT SUMMARY</h2>
			</template>
			<div class="grid grid-cols-2 md:grid-cols-4 gap-6">
				<div>
					<p class="text-sm uppercase tracking-wide text-gray-600">BEGINNING BALANCE</p>
					<p class="text-2xl font-bold text-gray-900">${{ beginningBalance.toLocaleString() }}</p>
				</div>
				<div>
					<p class="text-sm uppercase tracking-wide text-gray-600">TOTAL DEPOSITS</p>
					<p class="text-2xl font-bold text-green-600">+${{ totalDeposits.toLocaleString() }}</p>
				</div>
				<div>
					<p class="text-sm uppercase tracking-wide text-gray-600">TOTAL WITHDRAWALS</p>
					<p class="text-2xl font-bold text-red-600">-${{ totalWithdrawals.toLocaleString() }}</p>
				</div>
				<div>
					<p class="text-sm uppercase tracking-wide text-gray-600">ENDING BALANCE</p>
					<p class="text-2xl font-bold" :class="endingBalance < 25000 ? 'text-red-600' : 'text-gray-900'">
						${{ endingBalance.toLocaleString() }}
					</p>
					<p v-if="endingBalance < 25000" class="text-xs text-red-600 mt-1">BELOW MINIMUM</p>
				</div>
			</div>
		</UCard>

		<!-- Compliance Alerts -->
		<div v-if="complianceIssues.length > 0" class="mb-8">
			<UAlert
				title="COMPLIANCE VIOLATIONS DETECTED"
				:description="`${complianceIssues.length} fund segregation violations require immediate attention`"
				color="red"
				variant="subtle"
			>
				<template #icon>
					<UIcon name="i-heroicons-shield-exclamation" />
				</template>
			</UAlert>
		</div>

		<!-- Main Content Tabs -->
		<UTabs :items="tabs" class="space-y-6">
			<!-- Transactions Tab -->
			<template #transactions>
				<div class="space-y-6">
					<!-- Income Section -->
					<UCard>
						<template #header>
							<div class="flex items-center justify-between">
								<h3 class="text-lg font-semibold uppercase tracking-wide">DEPOSITS & INCOME</h3>
								<span class="text-lg font-bold text-green-600">${{ totalDeposits.toLocaleString() }}</span>
							</div>
						</template>

						<!-- Proper Operating Revenues -->
						<div class="mb-6">
							<h4 class="font-medium text-sm uppercase tracking-wide text-gray-700 mb-3">
								✓ PROPER OPERATING REVENUES
							</h4>
							<UTable :rows="properDeposits" :columns="depositColumns" />
						</div>

						<!-- Questionable Deposits -->
						<div v-if="improperDeposits.length > 0">
							<h4 class="font-medium text-sm uppercase tracking-wide text-red-600 mb-3">✗ QUESTIONABLE DEPOSITS</h4>
							<UTable :rows="improperDeposits" :columns="depositColumns" class="border-2 border-red-200" />
						</div>
					</UCard>

					<!-- Expenses Section -->
					<UCard>
						<template #header>
							<div class="flex items-center justify-between">
								<h3 class="text-lg font-semibold uppercase tracking-wide">WITHDRAWALS & EXPENSES</h3>
								<span class="text-lg font-bold text-red-600">${{ totalWithdrawals.toLocaleString() }}</span>
							</div>
						</template>

						<!-- Expense Categories -->
						<UAccordion :items="expenseCategories" :default-open="['insurance', 'maintenance']">
							<template #insurance>
								<div class="space-y-2">
									<div class="flex justify-between text-sm font-medium mb-2">
										<span>BUDGET: $9,659</span>
										<span :class="insuranceVariance > 0 ? 'text-red-600' : 'text-green-600'">
											VARIANCE: {{ insuranceVariance > 0 ? '+' : '' }}${{
												Math.abs(insuranceVariance).toLocaleString()
											}}
										</span>
									</div>
									<UTable :rows="insuranceExpenses" :columns="expenseColumns" />
								</div>
							</template>

							<template #professional>
								<div class="space-y-2">
									<div class="flex justify-between text-sm font-medium mb-2">
										<span>BUDGET: $700</span>
										<span :class="professionalVariance > 0 ? 'text-red-600' : 'text-green-600'">
											VARIANCE: {{ professionalVariance > 0 ? '+' : '' }}${{
												Math.abs(professionalVariance).toLocaleString()
											}}
										</span>
									</div>
									<UTable :rows="professionalExpenses" :columns="expenseColumns" />
								</div>
							</template>

							<template #utilities>
								<div class="space-y-2">
									<div class="flex justify-between text-sm font-medium mb-2">
										<span>BUDGET: $2,339</span>
										<span :class="utilitiesVariance > 0 ? 'text-red-600' : 'text-green-600'">
											VARIANCE: {{ utilitiesVariance > 0 ? '+' : '' }}${{
												Math.abs(utilitiesVariance).toLocaleString()
											}}
										</span>
									</div>
									<UTable :rows="utilityExpenses" :columns="expenseColumns" />
								</div>
							</template>

							<template #maintenance>
								<div class="space-y-2">
									<div class="flex justify-between text-sm font-medium mb-2">
										<span>BUDGET: $4,379</span>
										<span :class="maintenanceVariance > 0 ? 'text-red-600' : 'text-green-600'">
											VARIANCE: {{ maintenanceVariance > 0 ? '+' : '' }}${{
												Math.abs(maintenanceVariance).toLocaleString()
											}}
										</span>
									</div>
									<UTable :rows="maintenanceExpenses" :columns="expenseColumns" />
								</div>
							</template>

							<template #improper v-if="improperExpenses.length > 0">
								<div class="space-y-2">
									<div class="text-sm font-medium text-red-600 mb-2">
										THESE EXPENSES DO NOT BELONG IN OPERATING ACCOUNT
									</div>
									<UTable :rows="improperExpenses" :columns="expenseColumns" class="border-2 border-red-200" />
								</div>
							</template>
						</UAccordion>
					</UCard>
				</div>
			</template>

			<!-- Analysis Tab -->
			<template #analysis>
				<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
					<!-- Budget vs Actual Chart -->
					<UCard>
						<template #header>
							<h3 class="text-lg font-semibold uppercase tracking-wide">BUDGET VS ACTUAL</h3>
						</template>
						<div class="h-80">
							<Bar :data="budgetChartData" :options="budgetChartOptions" />
						</div>
					</UCard>

					<!-- Expense Breakdown Chart -->
					<UCard>
						<template #header>
							<h3 class="text-lg font-semibold uppercase tracking-wide">EXPENSE BREAKDOWN</h3>
						</template>
						<div class="h-80">
							<Doughnut :data="expenseChartData" :options="expenseChartOptions" />
						</div>
					</UCard>

					<!-- Variance Analysis -->
					<UCard class="lg:col-span-2">
						<template #header>
							<h3 class="text-lg font-semibold uppercase tracking-wide">VARIANCE ANALYSIS</h3>
						</template>
						<UTable :rows="varianceAnalysis" :columns="varianceColumns">
							<template #variance-data="{ row }">
								<span :class="row.variance > 0 ? 'text-red-600' : 'text-green-600'" class="font-medium">
									{{ row.variance > 0 ? '+' : '' }}${{ Math.abs(row.variance).toLocaleString() }}
								</span>
							</template>
							<template #percent-data="{ row }">
								<span :class="row.percent > 0 ? 'text-red-600' : 'text-green-600'" class="font-medium">
									{{ row.percent > 0 ? '+' : '' }}{{ row.percent }}%
								</span>
							</template>
							<template #status-data="{ row }">
								<UBadge :color="row.statusColor" variant="subtle">{{ row.status }}</UBadge>
							</template>
						</UTable>
					</UCard>
				</div>
			</template>

			<!-- Action Items Tab -->
			<template #actions>
				<div class="space-y-6">
					<!-- Immediate Actions -->
					<UCard v-if="endingBalance < 30000 || complianceIssues.length > 0" class="border-2 border-red-200">
						<template #header>
							<h3 class="text-lg font-semibold uppercase tracking-wide text-red-600">IMMEDIATE ACTION REQUIRED</h3>
						</template>
						<div class="space-y-4">
							<div v-if="endingBalance < 30000" class="p-4 bg-red-50 rounded-lg">
								<h4 class="font-semibold mb-2">LOW BALANCE ALERT</h4>
								<ul class="space-y-1 text-sm">
									<li>• Alert board treasurer immediately</li>
									<li>• Review upcoming large expenses</li>
									<li>• Plan cash flow for next 30 days</li>
									<li>• Consider deferring non-essential expenses</li>
								</ul>
							</div>
							<div v-if="complianceIssues.length > 0" class="p-4 bg-red-50 rounded-lg">
								<h4 class="font-semibold mb-2">FUND SEGREGATION VIOLATIONS</h4>
								<ul class="space-y-1 text-sm">
									<li>• Document all transfers between accounts</li>
									<li>• Stop any planned future transfers</li>
									<li>• Get board approval for reversals</li>
									<li>• Schedule emergency board meeting</li>
								</ul>
							</div>
						</div>
					</UCard>

					<!-- Monthly Certification -->
					<UCard>
						<template #header>
							<h3 class="text-lg font-semibold uppercase tracking-wide">MONTH-END CERTIFICATION</h3>
						</template>
						<div class="space-y-4">
							<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div v-for="item in certificationChecklist" :key="item.id" class="flex items-start space-x-3">
									<UCheckbox v-model="item.checked" />
									<label class="text-sm">{{ item.label }}</label>
								</div>
							</div>

							<div class="mt-6 p-4 bg-gray-50 rounded-lg">
								<p class="text-sm font-medium mb-2">NEXT MONTH FOCUS AREAS:</p>
								<ul class="space-y-1 text-sm">
									<li v-for="focus in nextMonthFocus" :key="focus">• {{ focus }}</li>
								</ul>
							</div>

							<div class="flex items-center justify-between mt-6">
								<div>
									<p class="text-sm text-gray-600">Prepared by: _______________________</p>
									<p class="text-sm text-gray-600 mt-2">Date: _______________________</p>
								</div>
								<UButton color="primary" size="lg" icon="i-heroicons-document-arrow-down">EXPORT REPORT</UButton>
							</div>
						</div>
					</UCard>
				</div>
			</template>
		</UTabs>
	</div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { Bar, Doughnut } from 'vue-chartjs';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

// Route params
const route = useRoute();
const monthParam = computed(() => {
	const param = route.params.month?.toUpperCase() || 'JUNE';
	// Convert URL param to composable format
	const monthMap = {
		JANUARY: 'January 2025',
		FEBRUARY: 'February 2025',
		MARCH: 'March 2025',
		APRIL: 'April 2025',
		MAY: 'May 2025',
		JUNE: 'June 2025',
	};
	return monthMap[param] || 'June 2025';
});
const monthDisplay = computed(() => monthParam.value.replace('2025', '').trim());

// Composables
const { getOperatingData, calculateTotals } = useReconciliationData();

// Get account data
const accountData = computed(() => getOperatingData(monthParam.value));

// Summary data
const beginningBalance = computed(() => accountData.value?.beginningBalance || 0);
const endingBalance = computed(() => accountData.value?.endingBalance || 0);
const totals = computed(() => calculateTotals(accountData.value));
const totalDeposits = computed(() => totals.value?.totalDeposits || 0);
const totalWithdrawals = computed(() => totals.value?.totalWithdrawals || 0);

// Tabs - FIXED: Changed 'key' to 'slot' to work with NuxtUI UTabs
const tabs = [
	{ slot: 'transactions', label: 'TRANSACTIONS', icon: 'i-heroicons-document-text' },
	{ slot: 'analysis', label: 'ANALYSIS & CHARTS', icon: 'i-heroicons-chart-bar' },
	{ slot: 'actions', label: 'ACTION ITEMS', icon: 'i-heroicons-clipboard-document-check' },
];

// Compliance issues
const complianceIssues = computed(() => accountData.value?.violations || []);

// Transaction columns
const depositColumns = [
	{ key: 'date', label: 'DATE' },
	{ key: 'description', label: 'DESCRIPTION' },
	{ key: 'amount', label: 'AMOUNT', class: 'text-right' },
];

const expenseColumns = [
	{ key: 'date', label: 'DATE' },
	{ key: 'vendor', label: 'VENDOR' },
	{ key: 'description', label: 'DESCRIPTION' },
	{ key: 'amount', label: 'AMOUNT', class: 'text-right' },
];

// Transaction data from composable
const deposits = computed(() => accountData.value?.deposits || []);
const withdrawals = computed(() => accountData.value?.withdrawals || []);

// Separate proper and improper deposits
const properDeposits = computed(() => {
	return deposits.value
		.filter((d) => d.source !== 'Special Assessment' && d.source !== 'Reserve Account')
		.map((d) => ({
			date: d.date,
			description: `${d.description} - ${d.source}`,
			amount: `$${d.amount.toLocaleString()}`,
		}));
});

const improperDeposits = computed(() => {
	return deposits.value
		.filter((d) => d.source === 'Special Assessment' || d.source === 'Reserve Account')
		.map((d) => ({
			date: d.date,
			description: `${d.description} - ${d.source}`,
			amount: `$${d.amount.toLocaleString()}`,
		}));
});

// Categorize expenses
const insuranceExpenses = computed(() => {
	return withdrawals.value
		.filter((w) => w.category === 'Insurance' || w.vendor?.toLowerCase().includes('insurance'))
		.map((w) => ({
			date: w.date,
			vendor: w.vendor,
			description: w.category,
			amount: `$${w.amount.toLocaleString()}`,
		}));
});

const professionalExpenses = computed(() => {
	return withdrawals.value
		.filter(
			(w) =>
				w.category === 'Professional' ||
				w.vendor?.toLowerCase().includes('consult') ||
				w.vendor?.toLowerCase().includes('vte'),
		)
		.map((w) => ({
			date: w.date,
			vendor: w.vendor,
			description: w.category,
			amount: `$${w.amount.toLocaleString()}`,
		}));
});

const utilityExpenses = computed(() => {
	return withdrawals.value
		.filter(
			(w) =>
				w.category === 'Utilities' ||
				w.vendor?.toLowerCase().includes('teco') ||
				w.vendor?.toLowerCase().includes('fpl') ||
				w.vendor?.toLowerCase().includes('gas') ||
				w.vendor?.toLowerCase().includes('elevator') ||
				w.vendor?.toLowerCase().includes('breezeline'),
		)
		.map((w) => ({
			date: w.date,
			vendor: w.vendor,
			description: w.category || 'Utility Service',
			amount: `$${w.amount.toLocaleString()}`,
		}));
});

const maintenanceExpenses = computed(() => {
	return withdrawals.value
		.filter(
			(w) =>
				w.category === 'Maintenance' ||
				w.category === 'Repairs' ||
				(!w.category &&
					!insuranceExpenses.value.find((i) => i.vendor === w.vendor) &&
					!professionalExpenses.value.find((p) => p.vendor === w.vendor) &&
					!utilityExpenses.value.find((u) => u.vendor === w.vendor)),
		)
		.map((w) => ({
			date: w.date,
			vendor: w.vendor,
			description: w.category || 'Maintenance',
			amount: `$${w.amount.toLocaleString()}`,
		}));
});

// Improper expenses (transfers to other accounts)
const improperExpenses = computed(() => {
	const violations = accountData.value?.violations || [];
	return violations
		.filter((v) => v.type === 'outgoing')
		.map((v) => ({
			date: v.date,
			vendor: 'Transfer TO 5872',
			description: v.description,
			amount: `$${v.amount.toLocaleString()}`,
		}));
});

// Calculate variances
const insuranceTotal = computed(() =>
	insuranceExpenses.value.reduce((sum, e) => sum + parseFloat(e.amount.replace(/[$,]/g, '')), 0),
);
const professionalTotal = computed(() =>
	professionalExpenses.value.reduce((sum, e) => sum + parseFloat(e.amount.replace(/[$,]/g, '')), 0),
);
const utilitiesTotal = computed(() =>
	utilityExpenses.value.reduce((sum, e) => sum + parseFloat(e.amount.replace(/[$,]/g, '')), 0),
);
const maintenanceTotal = computed(() =>
	maintenanceExpenses.value.reduce((sum, e) => sum + parseFloat(e.amount.replace(/[$,]/g, '')), 0),
);

const insuranceVariance = computed(() => insuranceTotal.value - 9659);
const professionalVariance = computed(() => professionalTotal.value - 700);
const utilitiesVariance = computed(() => utilitiesTotal.value - 2339);
const maintenanceVariance = computed(() => maintenanceTotal.value - 4379);

// Expense categories with accordion items - FIXED: Changed 'key' to 'slot' for UAccordion
const expenseCategories = computed(() => [
	{
		slot: 'insurance',
		label: `INSURANCE ($${insuranceTotal.value.toLocaleString()})`,
		icon: 'i-heroicons-shield-check',
		defaultOpen: true,
	},
	{
		slot: 'professional',
		label: `PROFESSIONAL FEES ($${professionalTotal.value.toLocaleString()})`,
		icon: 'i-heroicons-briefcase',
	},
	{
		slot: 'utilities',
		label: `UTILITIES ($${utilitiesTotal.value.toLocaleString()})`,
		icon: 'i-heroicons-bolt',
	},
	{
		slot: 'maintenance',
		label: `MAINTENANCE & REPAIRS ($${maintenanceTotal.value.toLocaleString()})`,
		icon: 'i-heroicons-wrench-screwdriver',
	},
	{
		slot: 'improper',
		label: 'IMPROPER EXPENSES (VIOLATIONS)',
		icon: 'i-heroicons-exclamation-triangle',
		disabled: improperExpenses.value?.length === 0,
	},
]);

// Variance analysis data
const varianceAnalysis = computed(() => [
	{
		category: 'Insurance',
		budgeted: 9659,
		actual: insuranceTotal.value,
		variance: insuranceVariance.value,
		percent: insuranceTotal.value > 0 ? ((insuranceVariance.value / 9659) * 100).toFixed(1) : '0.0',
		status: insuranceVariance.value > 0 ? 'OVER BUDGET' : insuranceVariance.value < 0 ? 'UNDER BUDGET' : 'ON TARGET',
		statusColor: insuranceVariance.value > 0 ? 'red' : insuranceVariance.value < 0 ? 'green' : 'gray',
	},
	{
		category: 'Professional Fees',
		budgeted: 700,
		actual: professionalTotal.value,
		variance: professionalVariance.value,
		percent: professionalTotal.value > 0 ? ((professionalVariance.value / 700) * 100).toFixed(1) : '0.0',
		status:
			professionalVariance.value > 0 ? 'OVER BUDGET' : professionalVariance.value < 0 ? 'UNDER BUDGET' : 'ON TARGET',
		statusColor: professionalVariance.value > 0 ? 'red' : professionalVariance.value < 0 ? 'green' : 'gray',
	},
	{
		category: 'Utilities',
		budgeted: 2339,
		actual: utilitiesTotal.value,
		variance: utilitiesVariance.value,
		percent: utilitiesTotal.value > 0 ? ((utilitiesVariance.value / 2339) * 100).toFixed(1) : '0.0',
		status: utilitiesVariance.value > 0 ? 'OVER BUDGET' : utilitiesVariance.value < 0 ? 'UNDER BUDGET' : 'ON TARGET',
		statusColor: utilitiesVariance.value > 0 ? 'red' : utilitiesVariance.value < 0 ? 'green' : 'gray',
	},
	{
		category: 'Maintenance',
		budgeted: 4379,
		actual: maintenanceTotal.value,
		variance: maintenanceVariance.value,
		percent: maintenanceTotal.value > 0 ? ((maintenanceVariance.value / 4379) * 100).toFixed(1) : '0.0',
		status:
			maintenanceVariance.value > 0 ? 'OVER BUDGET' : maintenanceVariance.value < 0 ? 'UNDER BUDGET' : 'ON TARGET',
		statusColor: maintenanceVariance.value > 0 ? 'red' : maintenanceVariance.value < 0 ? 'green' : 'gray',
	},
	{
		category: 'TOTAL',
		budgeted: 17077,
		actual: insuranceTotal.value + professionalTotal.value + utilitiesTotal.value + maintenanceTotal.value,
		variance: insuranceTotal.value + professionalTotal.value + utilitiesTotal.value + maintenanceTotal.value - 17077,
		percent: (
			((insuranceTotal.value + professionalTotal.value + utilitiesTotal.value + maintenanceTotal.value - 17077) /
				17077) *
			100
		).toFixed(1),
		status:
			insuranceTotal.value + professionalTotal.value + utilitiesTotal.value + maintenanceTotal.value - 17077 > 0
				? 'OVER BUDGET'
				: 'UNDER BUDGET',
		statusColor:
			insuranceTotal.value + professionalTotal.value + utilitiesTotal.value + maintenanceTotal.value - 17077 > 0
				? 'red'
				: 'green',
	},
]);

const varianceColumns = [
	{ key: 'category', label: 'CATEGORY' },
	{ key: 'budgeted', label: 'BUDGETED', class: 'text-right' },
	{ key: 'actual', label: 'ACTUAL', class: 'text-right' },
	{ key: 'variance', label: 'VARIANCE', class: 'text-right' },
	{ key: 'percent', label: '%', class: 'text-right' },
	{ key: 'status', label: 'STATUS' },
];

// Chart data
const budgetChartData = computed(() => ({
	labels: ['Insurance', 'Professional', 'Utilities', 'Maintenance'],
	datasets: [
		{
			label: 'Budgeted',
			data: [9659, 700, 2339, 4379],
			backgroundColor: 'rgba(156, 163, 175, 0.8)',
		},
		{
			label: 'Actual',
			data: [insuranceTotal.value, professionalTotal.value, utilitiesTotal.value, maintenanceTotal.value],
			backgroundColor: [
				insuranceVariance.value > 0 ? 'rgba(239, 68, 68, 0.8)' : 'rgba(34, 197, 94, 0.8)',
				professionalVariance.value > 0
					? 'rgba(239, 68, 68, 0.8)'
					: professionalVariance.value < 0
						? 'rgba(34, 197, 94, 0.8)'
						: 'rgba(156, 163, 175, 0.8)',
				utilitiesVariance.value > 0 ? 'rgba(239, 68, 68, 0.8)' : 'rgba(34, 197, 94, 0.8)',
				maintenanceVariance.value > 0 ? 'rgba(239, 68, 68, 0.8)' : 'rgba(34, 197, 94, 0.8)',
			],
		},
	],
}));

const budgetChartOptions = {
	responsive: true,
	maintainAspectRatio: false,
	plugins: {
		legend: {
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

const expenseChartData = computed(() => ({
	labels: ['Insurance', 'Professional', 'Utilities', 'Maintenance', 'Other'],
	datasets: [
		{
			data: [
				insuranceTotal.value,
				professionalTotal.value,
				utilitiesTotal.value,
				maintenanceTotal.value,
				Math.max(
					0,
					totalWithdrawals.value -
						(insuranceTotal.value + professionalTotal.value + utilitiesTotal.value + maintenanceTotal.value),
				),
			],
			backgroundColor: [
				'rgba(239, 68, 68, 0.8)',
				'rgba(59, 130, 246, 0.8)',
				'rgba(34, 197, 94, 0.8)',
				'rgba(251, 191, 36, 0.8)',
				'rgba(156, 163, 175, 0.8)',
			],
		},
	],
}));

const expenseChartOptions = {
	responsive: true,
	maintainAspectRatio: false,
	plugins: {
		legend: {
			position: 'right',
		},
	},
};

// Certification checklist
const certificationChecklist = ref([
	{ id: 1, label: 'All income sources are legitimate operating revenue', checked: false },
	{ id: 2, label: 'No money transferred to/from 40-year recert account (5872)', checked: false },
	{ id: 3, label: 'All expenses are proper operating costs', checked: false },
	{ id: 4, label: "Account balance sufficient for next month's expenses", checked: false },
	{ id: 5, label: 'Any expenses >$2,000 have board approval', checked: false },
	{ id: 6, label: 'Monthly reconciliation completed accurately', checked: false },
]);

const nextMonthFocus = [
	'Monitor insurance payment impact on cash flow',
	'Enforce no inter-account transfers policy',
	'Review and approve maintenance expenses over $2,000',
	'Ensure minimum balance of $25,000 maintained',
];
</script>
