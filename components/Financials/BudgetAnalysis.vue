<template>
	<div class="space-y-6">
		<!-- Budget Overview -->
		<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
			<UCard v-for="metric in budgetMetrics" :key="metric.label">
				<div class="text-center">
					<p class="text-sm font-medium text-gray-600 uppercase tracking-wider">{{ metric.label }}</p>
					<p class="mt-2 text-2xl font-bold" :class="metric.color">
						{{ metric.prefix }}{{ metric.value }}{{ metric.suffix }}
					</p>
				</div>
			</UCard>
		</div>

		<!-- Budget Status Chart -->
		<UCard>
			<template #header>
				<h3 class="text-lg font-bold text-gray-900 uppercase tracking-wider">Budget Status by Category</h3>
			</template>

			<div class="h-80">
				<Bar :data="chartData" :options="chartOptions" />
			</div>
		</UCard>

		<!-- Over Budget Items -->
		<UCard>
			<template #header>
				<div class="flex items-center justify-between">
					<h3 class="text-lg font-bold text-gray-900 uppercase tracking-wider">Budget Overruns</h3>
					<UBadge color="red" variant="solid">{{ overBudgetItems.length }} Items</UBadge>
				</div>
			</template>

			<div class="space-y-4">
				<div v-for="item in overBudgetItems" :key="item.name" class="border-l-4 border-red-500 pl-4">
					<div class="flex justify-between items-start">
						<div class="flex-1">
							<h4 class="font-semibold text-gray-900">{{ item.name }}</h4>
							<p class="text-sm text-gray-600 mt-1">{{ item.category }}</p>
						</div>
						<div class="text-right">
							<p class="text-lg font-bold text-red-600">+${{ item.overAmount.toLocaleString() }}</p>
							<p class="text-sm text-gray-500">{{ item.percentOver }}% over</p>
						</div>
					</div>
					<div class="mt-2 bg-gray-100 rounded-full h-2 overflow-hidden">
						<div class="h-full bg-red-500" :style="`width: ${Math.min(item.percentSpent, 100)}%`" />
					</div>
					<div class="mt-1 flex justify-between text-xs text-gray-500">
						<span>Budget: ${{ item.budget.toLocaleString() }}</span>
						<span>Actual: ${{ item.actual.toLocaleString() }}</span>
					</div>
				</div>
			</div>
		</UCard>

		<!-- High Risk Items (>75% spent) -->
		<UCard>
			<template #header>
				<div class="flex items-center justify-between">
					<h3 class="text-lg font-bold text-gray-900 uppercase tracking-wider">High Risk Items</h3>
					<UBadge color="yellow" variant="subtle">>75% Spent</UBadge>
				</div>
			</template>

			<div class="space-y-4">
				<div v-for="item in highRiskItems" :key="item.name" class="border-l-4 border-yellow-500 pl-4">
					<div class="flex justify-between items-start">
						<div class="flex-1">
							<h4 class="font-semibold text-gray-900">{{ item.name }}</h4>
							<p class="text-sm text-gray-600 mt-1">{{ item.category }}</p>
						</div>
						<div class="text-right">
							<p class="text-lg font-bold text-yellow-600">{{ item.percentSpent }}% spent</p>
							<p class="text-sm text-gray-500">${{ item.remaining.toLocaleString() }} left</p>
						</div>
					</div>
					<div class="mt-2 bg-gray-100 rounded-full h-2 overflow-hidden">
						<div class="h-full bg-yellow-500" :style="`width: ${item.percentSpent}%`" />
					</div>
					<div class="mt-1 flex justify-between text-xs text-gray-500">
						<span>Budget: ${{ item.budget.toLocaleString() }}</span>
						<span>Spent: ${{ item.actual.toLocaleString() }}</span>
					</div>
				</div>
			</div>
		</UCard>

		<!-- Budget Recommendations -->
		<UCard>
			<template #header>
				<h3 class="text-lg font-bold text-gray-900 uppercase tracking-wider">Budget Recommendations</h3>
			</template>

			<UAccordion :items="recommendations" />
		</UCard>
	</div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { Bar } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';
import { useReconciliationData } from '~/composables/useReconciliationData';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

// Get data from composable
const { getOperatingData, calculateTotals } = useReconciliationData();

// Current period for budget analysis
const currentMonth = ref('June 2025');
const currentData = computed(() => getOperatingData(currentMonth.value));

// Calculate YTD totals (would need all months' data in real app)
const yearToDateSpent = ref(133894);
const yearlyBudget = ref(177296);
const remainingBudget = computed(() => yearlyBudget.value - yearToDateSpent.value);
const burnRate = computed(() => ((yearToDateSpent.value / yearlyBudget.value) * 100).toFixed(1));

const budgetMetrics = computed(() => [
	{
		label: 'Total Budget',
		value: yearlyBudget.value.toLocaleString(),
		prefix: '$',
		suffix: '',
		color: 'text-gray-900',
	},
	{
		label: 'Spent YTD',
		value: yearToDateSpent.value.toLocaleString(),
		prefix: '$',
		suffix: '',
		color: 'text-yellow-600',
	},
	{
		label: 'Remaining',
		value: remainingBudget.value.toLocaleString(),
		prefix: '$',
		suffix: '',
		color: 'text-green-600',
	},
	{ label: 'Burn Rate', value: burnRate.value, prefix: '', suffix: '%', color: 'text-red-600' },
]);

const overBudgetItems = ref([
	{
		name: 'Legal Fees',
		category: 'Professional Services',
		budget: 6000,
		actual: 17600,
		overAmount: 11600,
		percentOver: 193.3,
		percentSpent: 293.3,
	},
	{
		name: 'Elevator Fixes',
		category: 'Maintenance',
		budget: 1000,
		actual: 2900,
		overAmount: 1900,
		percentOver: 190,
		percentSpent: 290,
	},
	{
		name: 'Plumbing Repairs',
		category: 'Maintenance',
		budget: 1000,
		actual: 1580,
		overAmount: 580,
		percentOver: 58,
		percentSpent: 158,
	},
	{
		name: 'Miscellaneous Expenses',
		category: 'Other',
		budget: 1200,
		actual: 2034,
		overAmount: 834,
		percentOver: 69.5,
		percentSpent: 169.5,
	},
]);

const highRiskItems = ref([
	{
		name: 'Building Insurance',
		category: 'Insurance',
		budget: 76250,
		actual: 58084,
		remaining: 18166,
		percentSpent: 76.2,
	},
	{
		name: 'CPA Tax Filing',
		category: 'Professional Services',
		budget: 1350,
		actual: 1343,
		remaining: 7,
		percentSpent: 99.5,
	},
]);

const chartData = ref({
	labels: ['Insurance', 'Utilities', 'Maintenance', 'Professional', 'Contract Services', 'Other'],
	datasets: [
		{
			label: 'Budget',
			data: [85579, 31296, 25600, 21150, 10416, 3255],
			backgroundColor: 'rgba(59, 130, 246, 0.5)',
			borderColor: 'rgb(59, 130, 246)',
			borderWidth: 1,
		},
		{
			label: 'Actual',
			data: [67413, 18539, 29831, 26543, 7646, 3922],
			backgroundColor: 'rgba(239, 68, 68, 0.5)',
			borderColor: 'rgb(239, 68, 68)',
			borderWidth: 1,
		},
	],
});

const chartOptions = ref({
	responsive: true,
	maintainAspectRatio: false,
	plugins: {
		legend: {
			position: 'top',
		},
		title: {
			display: false,
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

const recommendations = ref([
	{
		label: 'Immediate Cost Control Measures',
		content: `• Freeze all non-essential spending immediately
• Require board approval for any expense over $500
• Renegotiate legal services contract or seek new counsel
• Implement emergency budget review process`,
	},
	{
		label: 'Revenue Enhancement',
		content: `• Review and potentially increase monthly maintenance fees
• Pursue collection of delinquent accounts aggressively
• Consider special assessment for budget shortfall
• Explore cost-sharing opportunities with commercial tenants`,
	},
	{
		label: 'Expense Reduction Strategies',
		content: `• Defer non-critical maintenance projects
• Consolidate vendor contracts for better pricing
• Review insurance policies for cost savings
• Implement energy-saving measures to reduce utilities`,
	},
	{
		label: 'Long-term Budget Planning',
		content: `• Develop 3-year budget forecast
• Build operating reserves to 3-6 months expenses
• Implement quarterly budget review process
• Create contingency fund for unexpected expenses`,
	},
]);
</script>
