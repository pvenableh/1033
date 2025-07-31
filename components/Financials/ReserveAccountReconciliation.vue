<template>
	<div class="space-y-6">
		<!-- Account Summary -->
		<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
			<UCard>
				<div class="text-center">
					<p class="text-sm font-medium text-gray-600 uppercase tracking-wider">Beginning Balance</p>
					<p class="mt-2 text-2xl font-bold text-gray-900">${{ beginningBalance.toLocaleString() }}</p>
				</div>
			</UCard>

			<UCard>
				<div class="text-center">
					<p class="text-sm font-medium text-gray-600 uppercase tracking-wider">Contributions</p>
					<p class="mt-2 text-2xl font-bold text-green-600">+${{ totalContributions.toLocaleString() }}</p>
				</div>
			</UCard>

			<UCard>
				<div class="text-center">
					<p class="text-sm font-medium text-gray-600 uppercase tracking-wider">Interest Earned</p>
					<p class="mt-2 text-2xl font-bold text-green-600">+${{ interestEarned.toLocaleString() }}</p>
				</div>
			</UCard>

			<UCard>
				<div class="text-center">
					<p class="text-sm font-medium text-gray-600 uppercase tracking-wider">Ending Balance</p>
					<p class="mt-2 text-2xl font-bold text-gray-900">${{ endingBalance.toLocaleString() }}</p>
				</div>
			</UCard>
		</div>

		<!-- Compliance Status -->
		<UAlert color="green" variant="subtle" title="Reserve Account Properly Segregated" icon="i-heroicons-shield-check">
			<template #description>
				<div class="mt-2 space-y-1">
					<p>✓ No unauthorized withdrawals detected</p>
					<p>✓ No improper transfers to/from other accounts</p>
					<p>✓ Account maintained above minimum reserve requirement</p>
					<p>✓ Interest properly credited and tracked</p>
				</div>
			</template>
		</UAlert>

		<!-- Reserve Fund Analysis -->
		<UCard>
			<template #header>
				<h3 class="text-lg font-bold text-gray-900 uppercase tracking-wider">Reserve Fund Analysis</h3>
			</template>

			<div class="space-y-6">
				<!-- Reserve Study Compliance -->
				<div class="bg-green-50 rounded-lg p-4">
					<h4 class="font-semibold text-green-900 mb-3">Reserve Study Compliance</h4>
					<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div>
							<p class="text-sm text-gray-600">Current Balance</p>
							<p class="text-xl font-bold text-gray-900">${{ endingBalance.toLocaleString() }}</p>
						</div>
						<div>
							<p class="text-sm text-gray-600">Required Minimum</p>
							<p class="text-xl font-bold text-gray-900">${{ requiredMinimum.toLocaleString() }}</p>
						</div>
						<div>
							<p class="text-sm text-gray-600">Funding Level</p>
							<p class="text-xl font-bold text-green-600">{{ fundingLevel }}%</p>
						</div>
					</div>
					<div class="mt-4">
						<div class="bg-green-200 rounded-full h-3 overflow-hidden">
							<div
								class="h-full bg-green-600 transition-all duration-500"
								:style="`width: ${Math.min(fundingLevel, 100)}%`"
							/>
						</div>
						<p class="text-sm text-green-800 mt-2">
							Reserve account is {{ fundingLevel >= 100 ? 'fully funded' : 'adequately funded' }} per the most recent
							reserve study
						</p>
					</div>
				</div>

				<!-- Reserve Components -->
				<div>
					<h4 class="font-semibold text-gray-900 mb-3">Reserve Component Allocation</h4>
					<div class="space-y-3">
						<div v-for="component in reserveComponents" :key="component.name" class="border rounded-lg p-4">
							<div class="flex justify-between items-start mb-2">
								<div>
									<p class="font-medium text-gray-900">{{ component.name }}</p>
									<p class="text-sm text-gray-600">{{ component.description }}</p>
								</div>
								<div class="text-right">
									<p class="font-bold text-gray-900">${{ component.allocated.toLocaleString() }}</p>
									<p class="text-xs text-gray-500">{{ component.lifeRemaining }} years remaining</p>
								</div>
							</div>
							<div class="bg-gray-200 rounded-full h-2 overflow-hidden">
								<div class="h-full bg-blue-500" :style="`width: ${component.fundingPercent}%`" />
							</div>
							<div class="flex justify-between text-xs text-gray-500 mt-1">
								<span>Funding: {{ component.fundingPercent }}%</span>
								<span>Next scheduled: {{ component.nextScheduled }}</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</UCard>

		<!-- Investment Summary -->
		<UCard>
			<template #header>
				<h3 class="text-lg font-bold text-gray-900 uppercase tracking-wider">Investment Summary</h3>
			</template>

			<div class="space-y-4">
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div class="bg-gray-50 rounded-lg p-4">
						<h4 class="font-semibold text-gray-900 mb-2">Account Details</h4>
						<dl class="space-y-2">
							<div class="flex justify-between text-sm">
								<dt class="text-gray-600">Account Type:</dt>
								<dd class="font-medium text-gray-900">{{ accountType }}</dd>
							</div>
							<div class="flex justify-between text-sm">
								<dt class="text-gray-600">Interest Rate:</dt>
								<dd class="font-medium text-gray-900">{{ interestRate }}% APY</dd>
							</div>
							<div class="flex justify-between text-sm">
								<dt class="text-gray-600">FDIC Insured:</dt>
								<dd class="font-medium text-green-600">Yes</dd>
							</div>
						</dl>
					</div>

					<div class="bg-gray-50 rounded-lg p-4">
						<h4 class="font-semibold text-gray-900 mb-2">Interest Income</h4>
						<dl class="space-y-2">
							<div class="flex justify-between text-sm">
								<dt class="text-gray-600">This Month:</dt>
								<dd class="font-medium text-green-600">+${{ monthlyInterest.toFixed(2) }}</dd>
							</div>
							<div class="flex justify-between text-sm">
								<dt class="text-gray-600">Year to Date:</dt>
								<dd class="font-medium text-green-600">+${{ yearToDateInterest.toFixed(2) }}</dd>
							</div>
							<div class="flex justify-between text-sm">
								<dt class="text-gray-600">Projected Annual:</dt>
								<dd class="font-medium text-gray-900">${{ projectedAnnualInterest.toFixed(2) }}</dd>
							</div>
						</dl>
					</div>
				</div>

				<!-- Interest History Chart -->
				<div>
					<h4 class="font-semibold text-gray-900 mb-3">Interest Income Trend</h4>
					<div class="h-48">
						<Line :data="interestChartData" :options="interestChartOptions" />
					</div>
				</div>
			</div>
		</UCard>

		<!-- Activity Log -->
		<UCard>
			<template #header>
				<h3 class="text-lg font-bold text-gray-900 uppercase tracking-wider">Account Activity</h3>
			</template>

			<div class="space-y-4">
				<div v-if="transactions.length === 0" class="text-center py-12">
					<UIcon name="i-heroicons-check-circle" class="w-16 h-16 text-green-500 mx-auto mb-4" />
					<p class="text-lg font-medium text-gray-900">No Activity This Month</p>
					<p class="text-sm text-gray-600 mt-2">Reserve account properly maintained with no withdrawals or transfers</p>
				</div>

				<div v-else class="overflow-x-auto">
					<table class="min-w-full divide-y divide-gray-200">
						<thead class="bg-gray-50">
							<tr>
								<th class="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Date</th>
								<th class="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
									Description
								</th>
								<th class="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Amount</th>
								<th class="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Balance</th>
							</tr>
						</thead>
						<tbody class="bg-white divide-y divide-gray-200">
							<tr v-for="transaction in transactions" :key="transaction.id">
								<td class="px-4 py-2 text-sm text-gray-900">{{ transaction.date }}</td>
								<td class="px-4 py-2 text-sm text-gray-900">{{ transaction.description }}</td>
								<td
									class="px-4 py-2 text-sm font-medium"
									:class="transaction.amount > 0 ? 'text-green-600' : 'text-red-600'"
								>
									{{ transaction.amount > 0 ? '+' : '' }}${{ Math.abs(transaction.amount).toFixed(2) }}
								</td>
								<td class="px-4 py-2 text-sm text-gray-900">${{ transaction.balance.toLocaleString() }}</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
		</UCard>

		<!-- Recommendations -->
		<UCard>
			<template #header>
				<h3 class="text-lg font-bold text-gray-900 uppercase tracking-wider">Reserve Fund Recommendations</h3>
			</template>

			<div class="space-y-3">
				<div v-for="(rec, index) in recommendations" :key="index" class="flex items-start space-x-3">
					<div class="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
						<span class="text-xs font-bold text-green-600">{{ index + 1 }}</span>
					</div>
					<div class="flex-1">
						<p class="text-sm text-gray-700">{{ rec }}</p>
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

const props = defineProps({
	month: {
		type: String,
		required: true,
	},
});

// Use the composable for data management
const { getReserveData } = useReconciliationData();

// Get reactive data for current month
const currentMonthData = computed(() => getReserveData(props.month));

// Account balances - now reactive
const beginningBalance = computed(() => currentMonthData.value.beginningBalance);
const totalContributions = computed(() => currentMonthData.value.contributions);
const interestEarned = computed(() => currentMonthData.value.interest);
const endingBalance = computed(() => currentMonthData.value.endingBalance);

// Reserve study data remains constant
const requiredMinimum = ref(75000);
const fundingLevel = computed(() => Math.round((endingBalance.value / requiredMinimum.value) * 100));

// Reserve components
const reserveComponents = ref([
	{
		name: 'Roof Replacement',
		description: 'Complete roof replacement and repairs',
		allocated: 35000,
		lifeRemaining: 8,
		fundingPercent: 85,
		nextScheduled: '2033',
	},
	{
		name: 'Elevator Modernization',
		description: 'Major elevator upgrades and modernization',
		allocated: 25000,
		lifeRemaining: 5,
		fundingPercent: 92,
		nextScheduled: '2030',
	},
	{
		name: 'Painting & Waterproofing',
		description: 'Exterior painting and waterproofing',
		allocated: 20000,
		lifeRemaining: 3,
		fundingPercent: 95,
		nextScheduled: '2028',
	},
	{
		name: 'Parking Lot Resurfacing',
		description: 'Asphalt repair and resurfacing',
		allocated: 15037,
		lifeRemaining: 4,
		fundingPercent: 88,
		nextScheduled: '2029',
	},
]);

// Investment data
const accountType = ref('High-Yield Savings');
const interestRate = ref(4.25);
const monthlyInterest = ref(0);
const yearToDateInterest = ref(0);
const projectedAnnualInterest = computed(() => endingBalance.value * (interestRate.value / 100));

// Transaction history - reactive to month
const transactions = computed(() => currentMonthData.value.transactions || []);

// Interest chart data - reactive to month
const interestChartData = computed(() => {
	// Get historical data based on selected month
	const monthIndex = months.findIndex((m) => m === props.month);
	const monthsToShow = months.slice(monthIndex, monthIndex + 6).reverse();

	return {
		labels: monthsToShow.map((m) => m.split(' ')[0].slice(0, 3)),
		datasets: [
			{
				label: 'Monthly Interest',
				data: monthsToShow.map(() => 0), // No interest in this scenario
				borderColor: 'rgb(34, 197, 94)',
				backgroundColor: 'rgba(34, 197, 94, 0.1)',
				tension: 0.4,
			},
		],
	};
});

// Month list for chart
const months = ['January 2025', 'February 2025', 'March 2025', 'April 2025', 'May 2025', 'June 2025'];

const interestChartOptions = ref({
	responsive: true,
	maintainAspectRatio: false,
	plugins: {
		legend: {
			display: false,
		},
	},
	scales: {
		y: {
			beginAtZero: true,
			ticks: {
				callback: function (value) {
					return '$' + value;
				},
			},
		},
	},
});

// Recommendations
const recommendations = ref([
	'Continue maintaining reserve balance above minimum requirement',
	'Consider laddering CDs to maximize interest income while maintaining liquidity',
	'Update reserve study in 2026 to ensure funding targets remain accurate',
	'Review investment options quarterly to optimize returns within FDIC limits',
	'Maintain strict segregation - no transfers to operating or special assessment accounts',
]);
</script>
