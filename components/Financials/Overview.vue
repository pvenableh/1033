<template>
	<div class="space-y-6">
		<!-- Executive Summary -->
		<UCard>
			<template #header>
				<h3 class="text-lg font-bold text-gray-900 uppercase tracking-wider">Executive Summary</h3>
			</template>

			<div class="prose prose-sm max-w-none">
				<p class="text-gray-700">
					As of {{ currentDate }}, Lenox Plaza Association faces critical financial and compliance challenges requiring
					immediate board action:
				</p>

				<div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
					<div class="bg-red-50 border-l-4 border-red-500 p-4">
						<h4 class="font-bold text-red-900 mb-2">Critical Issues</h4>
						<ul class="space-y-1 text-sm text-red-800">
							<li>• Fund mixing violations totaling $10,771.71</li>
							<li>• Operating account 47% below January levels</li>
							<li>• Legal fees 193% over budget</li>
							<li>• Monthly burn rate unsustainable</li>
						</ul>
					</div>

					<div class="bg-green-50 border-l-4 border-green-500 p-4">
						<h4 class="font-bold text-green-900 mb-2">Positive Indicators</h4>
						<ul class="space-y-1 text-sm text-green-800">
							<li>• Reserve account stable at $95,037</li>
							<li>• Insurance costs below budget</li>
							<li>• Maintenance fee collections on track</li>
							<li>• 40-year project progressing</li>
						</ul>
					</div>
				</div>
			</div>
		</UCard>

		<!-- Cash Flow Analysis -->
		<UCard>
			<template #header>
				<h3 class="text-lg font-bold text-gray-900 uppercase tracking-wider">Cash Flow Trend Analysis</h3>
			</template>

			<div class="h-80">
				<Line :data="cashFlowData" :options="cashFlowOptions" />
			</div>

			<div class="mt-4 p-4 bg-yellow-50 rounded-lg">
				<div class="flex items-center space-x-2">
					<UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-yellow-600" />
					<p class="text-sm font-medium text-yellow-900">
						At current burn rate, operating account will fall below minimum balance in 2-3 months
					</p>
				</div>
			</div>
		</UCard>

		<!-- Account Health Indicators -->
		<UCard>
			<template #header>
				<h3 class="text-lg font-bold text-gray-900 uppercase tracking-wider">Account Health Indicators</h3>
			</template>

			<div class="space-y-4">
				<div v-for="indicator in healthIndicators" :key="indicator.account" class="space-y-2">
					<div class="flex items-center justify-between">
						<span class="font-semibold text-gray-900">{{ indicator.account }}</span>
						<UBadge :color="indicator.color" variant="subtle">
							{{ indicator.status }}
						</UBadge>
					</div>

					<div class="relative">
						<div class="bg-gray-200 rounded-full h-4 overflow-hidden">
							<div
								class="h-full transition-all duration-500"
								:class="indicator.barColor"
								:style="`width: ${indicator.healthScore}%`"
							/>
						</div>
						<div class="absolute inset-0 flex items-center justify-center">
							<span class="text-xs font-medium text-gray-700">{{ indicator.healthScore }}% Health Score</span>
						</div>
					</div>

					<p class="text-sm text-gray-600">{{ indicator.description }}</p>
				</div>
			</div>
		</UCard>

		<!-- Key Performance Metrics -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
			<UCard v-for="metric in keyMetrics" :key="metric.label">
				<div class="text-center">
					<UIcon :name="metric.icon" class="w-8 h-8 mx-auto mb-2" :class="metric.iconColor" />
					<p class="text-sm font-medium text-gray-600 uppercase tracking-wider">
						{{ metric.label }}
					</p>
					<p class="mt-2 text-2xl font-bold" :class="metric.valueColor">
						{{ metric.value }}
					</p>
					<p class="text-xs text-gray-500 mt-1">{{ metric.subtitle }}</p>
				</div>
			</UCard>
		</div>

		<!-- Priority Actions -->
		<UCard>
			<template #header>
				<div class="flex items-center justify-between">
					<h3 class="text-lg font-bold text-gray-900 uppercase tracking-wider">Priority Actions Required</h3>
					<UBadge color="red" variant="solid">Immediate</UBadge>
				</div>
			</template>

			<div class="space-y-3">
				<div v-for="(action, index) in priorityActions" :key="index" class="flex items-start space-x-3">
					<div
						class="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
						:class="action.priority === 'critical' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'"
					>
						{{ index + 1 }}
					</div>
					<div class="flex-1">
						<p class="font-medium text-gray-900">{{ action.title }}</p>
						<p class="text-sm text-gray-600 mt-1">{{ action.description }}</p>
					</div>
				</div>
			</div>
		</UCard>
	</div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { Line } from 'vue-chartjs';
import {
	Chart as ChartJS,
	Title,
	Tooltip,
	Legend,
	LineElement,
	CategoryScale,
	LinearScale,
	PointElement,
} from 'chart.js';
import { useReconciliationData } from '~/composables/useReconciliationData';

ChartJS.register(Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement);

// Get data from composable
const { operatingAccountData, getViolationCount } = useReconciliationData();

const currentDate = ref('June 30, 2025');
const currentMonth = ref('June 2025');

// Build cash flow data from operating account history
const cashFlowData = computed(() => {
	const months = ['January', 'February', 'March', 'April', 'May', 'June'];
	const balances = [64114, 54853, 44695, 40000, 35000, 33888];

	// Get actual balances from data where available
	const dataPoints = months.map((month, index) => {
		const monthYear = `${month} 2025`;
		const monthData = operatingAccountData.value[monthYear];
		return monthData ? monthData.endingBalance : balances[index];
	});

	return {
		labels: months,
		datasets: [
			{
				label: 'Operating Account Balance',
				data: dataPoints,
				borderColor: 'rgb(239, 68, 68)',
				backgroundColor: 'rgba(239, 68, 68, 0.1)',
				tension: 0.4,
			},
			{
				label: 'Minimum Balance',
				data: [25000, 25000, 25000, 25000, 25000, 25000],
				borderColor: 'rgb(245, 158, 11)',
				borderDash: [5, 5],
				fill: false,
			},
		],
	};
});

const cashFlowOptions = ref({
	responsive: true,
	maintainAspectRatio: false,
	plugins: {
		legend: {
			position: 'top',
		},
		tooltip: {
			callbacks: {
				label: function (context) {
					return context.dataset.label + ': ' + context.parsed.y.toLocaleString();
				},
			},
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

// Health indicators - reactive based on current data
const healthIndicators = computed(() => {
	const operatingCurrent = operatingAccountData.value[currentMonth.value] || operatingAccountData.value['June 2025'];
	const violations = getViolationCount(currentMonth.value);

	return [
		{
			account: 'Operating Account (5129)',
			healthScore: operatingCurrent.endingBalance < 35000 ? 35 : operatingCurrent.endingBalance < 50000 ? 60 : 80,
			status:
				operatingCurrent.endingBalance < 35000
					? 'Critical'
					: operatingCurrent.endingBalance < 50000
						? 'Warning'
						: 'Stable',
			color:
				operatingCurrent.endingBalance < 35000 ? 'red' : operatingCurrent.endingBalance < 50000 ? 'yellow' : 'green',
			barColor:
				operatingCurrent.endingBalance < 35000
					? 'bg-red-500'
					: operatingCurrent.endingBalance < 50000
						? 'bg-yellow-500'
						: 'bg-green-500',
			description:
				operatingCurrent.endingBalance < 35000
					? 'Rapid depletion, compliance violations, approaching minimum balance'
					: operatingCurrent.endingBalance < 50000
						? 'Declining balance, monitoring required'
						: 'Healthy balance, normal operations',
		},
		{
			account: 'Special Assessment (5872)',
			healthScore: violations > 0 ? 60 : 90,
			status: violations > 0 ? 'Warning' : 'Healthy',
			color: violations > 0 ? 'yellow' : 'green',
			barColor: violations > 0 ? 'bg-yellow-500' : 'bg-green-500',
			description:
				violations > 0
					? 'Improper fund mixing detected, but project progressing'
					: 'Properly segregated, project on track',
		},
		{
			account: 'Reserve Account (7011)',
			healthScore: 95,
			status: 'Healthy',
			color: 'green',
			barColor: 'bg-green-500',
			description: 'Properly segregated, stable balance, no unauthorized activity',
		},
	];
});

// Key metrics - reactive
const keyMetrics = computed(() => {
	const operatingCurrent = operatingAccountData.value[currentMonth.value] || operatingAccountData.value['June 2025'];
	const totalAssets = operatingCurrent.endingBalance + 95037.01 + 45000;
	const monthlyBurn = Math.abs(operatingCurrent.endingBalance - operatingCurrent.beginningBalance);
	const violations = getViolationCount(currentMonth.value);

	return [
		{
			label: 'Total Assets',
			value: `${totalAssets.toLocaleString()}`,
			subtitle: 'All accounts',
			icon: 'i-heroicons-currency-dollar',
			iconColor: 'text-blue-600',
			valueColor: 'text-gray-900',
		},
		{
			label: 'Monthly Burn',
			value: `${monthlyBurn.toLocaleString()}`,
			subtitle: 'Current month',
			icon: 'i-heroicons-arrow-trending-down',
			iconColor: 'text-red-600',
			valueColor: 'text-red-600',
		},
		{
			label: 'Budget Status',
			value: '75.5%',
			subtitle: 'YTD spent',
			icon: 'i-heroicons-chart-pie',
			iconColor: 'text-yellow-600',
			valueColor: 'text-yellow-600',
		},
		{
			label: 'Violations',
			value: violations.toString(),
			subtitle: 'Fund transfers',
			icon: 'i-heroicons-exclamation-triangle',
			iconColor: 'text-red-600',
			valueColor: 'text-red-600',
		},
	];
});

const priorityActions = ref([
	{
		priority: 'critical',
		title: 'Stop All Inter-Account Transfers',
		description: 'Immediately freeze transfers between 5129 and 5872 accounts',
	},
	{
		priority: 'critical',
		title: 'Emergency Board Meeting',
		description: 'Address fund mixing violations and implement controls within 7 days',
	},
	{
		priority: 'critical',
		title: 'Legal Fee Review',
		description: 'Investigate $11,600 budget overrun and control future expenses',
	},
	{
		priority: 'high',
		title: 'Cash Flow Stabilization',
		description: 'Implement expense controls to prevent operating account depletion',
	},
	{
		priority: 'high',
		title: 'Document Violations',
		description: 'Create detailed record of all improper transfers for correction',
	},
]);
</script>
