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
					<p class="text-sm font-medium text-gray-600 uppercase tracking-wider">Total Deposits</p>
					<p class="mt-2 text-2xl font-bold text-green-600">+${{ totalDeposits.toLocaleString() }}</p>
				</div>
			</UCard>

			<UCard>
				<div class="text-center">
					<p class="text-sm font-medium text-gray-600 uppercase tracking-wider">Total Withdrawals</p>
					<p class="mt-2 text-2xl font-bold text-red-600">-${{ totalWithdrawals.toLocaleString() }}</p>
				</div>
			</UCard>

			<UCard>
				<div class="text-center">
					<p class="text-sm font-medium text-gray-600 uppercase tracking-wider">Ending Balance</p>
					<p class="mt-2 text-2xl font-bold" :class="endingBalance < 35000 ? 'text-red-600' : 'text-gray-900'">
						${{ endingBalance.toLocaleString() }}
					</p>
				</div>
			</UCard>
		</div>

		<!-- Compliance Alerts -->
		<div v-if="complianceAlerts.length > 0" class="space-y-3">
			<UAlert
				v-for="alert in complianceAlerts"
				:key="alert.id"
				:color="alert.severity === 'critical' ? 'red' : 'yellow'"
				:title="alert.title"
				:description="alert.description"
				icon="i-heroicons-exclamation-triangle"
			/>
		</div>

		<!-- Revenue Analysis -->
		<UCard>
			<template #header>
				<h3 class="text-lg font-bold text-gray-900 uppercase tracking-wider">Revenue Analysis</h3>
			</template>

			<div class="space-y-4">
				<!-- Proper Operating Revenues -->
				<div>
					<h4 class="font-semibold text-green-900 mb-3 flex items-center">
						<UIcon name="i-heroicons-check-circle" class="w-5 h-5 mr-2 text-green-600" />
						Proper Operating Revenues
					</h4>
					<div class="overflow-x-auto">
						<table class="min-w-full divide-y divide-gray-200">
							<thead class="bg-green-50">
								<tr>
									<th class="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Source</th>
									<th class="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Amount</th>
									<th class="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Type</th>
								</tr>
							</thead>
							<tbody class="bg-white divide-y divide-gray-200">
								<tr v-for="revenue in properRevenues" :key="revenue.id">
									<td class="px-4 py-2 text-sm text-gray-900">{{ revenue.source }}</td>
									<td class="px-4 py-2 text-sm font-medium text-green-600">${{ revenue.amount.toLocaleString() }}</td>
									<td class="px-4 py-2 text-sm text-gray-600">{{ revenue.type }}</td>
								</tr>
							</tbody>
							<tfoot class="bg-green-50">
								<tr>
									<td class="px-4 py-2 text-sm font-semibold text-gray-900">Total Proper Revenue</td>
									<td class="px-4 py-2 text-sm font-bold text-green-600">${{ totalProperRevenue.toLocaleString() }}</td>
									<td></td>
								</tr>
							</tfoot>
						</table>
					</div>
				</div>

				<!-- Questionable Deposits -->
				<div v-if="questionableDeposits.length > 0">
					<h4 class="font-semibold text-red-900 mb-3 flex items-center">
						<UIcon name="i-heroicons-exclamation-circle" class="w-5 h-5 mr-2 text-red-600" />
						Questionable Deposits
					</h4>
					<div class="overflow-x-auto">
						<table class="min-w-full divide-y divide-gray-200">
							<thead class="bg-red-50">
								<tr>
									<th class="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Date</th>
									<th class="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
										Description
									</th>
									<th class="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Amount</th>
									<th class="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
										Action Required
									</th>
								</tr>
							</thead>
							<tbody class="bg-white divide-y divide-gray-200">
								<tr v-for="deposit in questionableDeposits" :key="deposit.id">
									<td class="px-4 py-2 text-sm text-gray-900">{{ deposit.date }}</td>
									<td class="px-4 py-2 text-sm text-gray-900">{{ deposit.description }}</td>
									<td class="px-4 py-2 text-sm font-medium text-red-600">${{ deposit.amount.toLocaleString() }}</td>
									<td class="px-4 py-2">
										<UBadge color="red" variant="subtle" size="sm">
											{{ deposit.action }}
										</UBadge>
									</td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</UCard>

		<!-- Expense Analysis -->
		<UCard>
			<template #header>
				<h3 class="text-lg font-bold text-gray-900 uppercase tracking-wider">Expense Analysis</h3>
			</template>

			<div class="space-y-6">
				<!-- Budget vs Actual Chart -->
				<div class="h-64">
					<Bar :data="budgetChartData" :options="budgetChartOptions" />
				</div>

				<!-- Expense Details -->
				<div>
					<h4 class="font-semibold text-gray-900 mb-3">Expense Details</h4>
					<div class="space-y-3">
						<div v-for="category in expenseCategories" :key="category.name" class="border rounded-lg p-4">
							<div class="flex items-center justify-between mb-2">
								<h5 class="font-medium text-gray-900">{{ category.name }}</h5>
								<span class="text-sm font-semibold" :class="category.variance > 0 ? 'text-red-600' : 'text-green-600'">
									{{ category.variance > 0 ? '+' : '' }}${{ Math.abs(category.variance).toLocaleString() }}
								</span>
							</div>
							<div class="bg-gray-200 rounded-full h-2 overflow-hidden">
								<div
									class="h-full transition-all duration-500"
									:class="
										category.percentSpent > 100
											? 'bg-red-500'
											: category.percentSpent > 75
												? 'bg-yellow-500'
												: 'bg-green-500'
									"
									:style="`width: ${Math.min(category.percentSpent, 100)}%`"
								/>
							</div>
							<div class="flex justify-between text-xs text-gray-500 mt-1">
								<span>Budget: ${{ category.budget.toLocaleString() }}</span>
								<span>Actual: ${{ category.actual.toLocaleString() }} ({{ category.percentSpent }}%)</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</UCard>

		<!-- Sign-off Section -->
		<UCard>
			<template #header>
				<h3 class="text-lg font-bold text-gray-900 uppercase tracking-wider">Reconciliation Sign-off</h3>
			</template>

			<div class="space-y-4">
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div class="border rounded-lg p-4 bg-gray-50">
						<p class="text-sm font-medium text-gray-700">Prepared By:</p>
						<p class="mt-1 font-semibold text-gray-900">{{ preparedBy }}</p>
						<p class="text-sm text-gray-600">{{ preparedDate }}</p>
					</div>
					<div class="border rounded-lg p-4 bg-gray-50">
						<p class="text-sm font-medium text-gray-700">Approved By:</p>
						<div v-if="approvedBy" class="mt-1">
							<p class="font-semibold text-gray-900">{{ approvedBy }}</p>
							<p class="text-sm text-gray-600">{{ approvedDate }}</p>
						</div>
						<div v-else class="mt-2">
							<UButton color="primary" size="sm">Approve Reconciliation</UButton>
						</div>
					</div>
				</div>

				<div class="border-t pt-4">
					<div class="flex items-start space-x-2">
						<UIcon name="i-heroicons-information-circle" class="w-5 h-5 text-blue-600 mt-0.5" />
						<p class="text-sm text-gray-600">
							This reconciliation must be reviewed and approved by the Board Treasurer within 15 days of month end. All
							identified violations must be addressed before approval.
						</p>
					</div>
				</div>
			</div>
		</UCard>
	</div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { Bar } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

const props = defineProps({
	month: {
		type: String,
		required: true,
	},
});

// Monthly data store - in a real app, this would come from an API
const monthlyData = ref({
	'June 2025': {
		beginningBalance: 52295.97,
		totalDeposits: 22773.13,
		totalWithdrawals: 41176.17,
		endingBalance: 33887.93,
		deposits: [
			{ id: 1, date: '05/01', description: 'Zelle Payment - Alexa Stylianou', amount: 600 },
			{ id: 2, date: '05/02', description: 'Remote Online Deposit', amount: 1500 },
			{ id: 3, date: '05/09', description: 'Sunshine Apts LLC', amount: 7000 },
			{ id: 4, date: '05/14', description: 'Sunshine Apts LLC', amount: 7252.14 },
			{ id: 5, date: '05/15', description: 'Online Transfer from ...5872', amount: 600 },
		],
		questionableDeposits: [
			{ id: 1, date: '05/15', description: 'Transfer from Account 5872', amount: 600, action: 'Investigate' },
			{ id: 2, date: '05/20', description: 'Large individual payment', amount: 5000, action: 'Verify source' },
		],
		violations: 2,
	},
	'May 2025': {
		beginningBalance: 54853.0,
		totalDeposits: 19420.0,
		totalWithdrawals: 21977.03,
		endingBalance: 52295.97,
		deposits: [
			{ id: 1, date: '05/01', description: 'Monthly Maintenance Fees', amount: 15000 },
			{ id: 2, date: '05/05', description: 'Late Fees', amount: 450 },
			{ id: 3, date: '05/10', description: 'Laundry Income', amount: 320 },
			{ id: 4, date: '05/15', description: 'Transfer from ...5872', amount: 3650 },
		],
		questionableDeposits: [
			{ id: 1, date: '05/15', description: 'Transfer from Account 5872', amount: 3650, action: 'Reverse' },
		],
		violations: 1,
	},
	'April 2025': {
		beginningBalance: 44695.0,
		totalDeposits: 23150.0,
		totalWithdrawals: 12992.0,
		endingBalance: 54853.0,
		deposits: [
			{ id: 1, date: '04/01', description: 'Monthly Maintenance Fees', amount: 22000 },
			{ id: 2, date: '04/15', description: 'Late Fees', amount: 750 },
			{ id: 3, date: '04/20', description: 'Laundry Income', amount: 400 },
		],
		questionableDeposits: [],
		violations: 0,
	},
});

// Get current month data
const currentMonthData = computed(() => {
	return monthlyData.value[props.month] || monthlyData.value['June 2025'];
});

// Reactive account balances
const beginningBalance = computed(() => currentMonthData.value.beginningBalance);
const totalDeposits = computed(() => currentMonthData.value.totalDeposits);
const totalWithdrawals = computed(() => currentMonthData.value.totalWithdrawals);
const endingBalance = computed(() => currentMonthData.value.endingBalance);

// Compliance alerts
const complianceAlerts = ref([
	{
		id: 1,
		severity: 'critical',
		title: 'Fund Mixing Violation',
		description: 'Multiple transfers totaling $4,852.71 detected between operating and special assessment accounts',
	},
	{
		id: 2,
		severity: 'warning',
		title: 'Low Balance Warning',
		description: 'Operating account balance is approaching minimum threshold of $25,000',
	},
]);

// Revenue data
const properRevenues = ref([
	{ id: 1, source: 'Monthly Maintenance Fees', amount: 15000, type: 'Regular fees' },
	{ id: 2, source: 'Late Fees', amount: 450, type: 'Penalty charges' },
	{ id: 3, source: 'Laundry Income', amount: 320, type: 'Operating income' },
	{ id: 4, source: 'Other Operating Income', amount: 200, type: 'Miscellaneous' },
]);

const totalProperRevenue = computed(() => {
	return properRevenues.value.reduce((sum, rev) => sum + rev.amount, 0);
});

const questionableDeposits = ref([
	{ id: 1, date: '05/15', description: 'Transfer from Account 5872', amount: 600, action: 'Investigate' },
	{ id: 2, date: '05/20', description: 'Large individual payment', amount: 5000, action: 'Verify source' },
]);

// Expense categories
const expenseCategories = computed(() => {
	const monthMap = {
		'June 2025': [
			{ name: 'Insurance', budget: 9659, actual: 9659, variance: 0, percentSpent: 100 },
			{ name: 'Professional Services', budget: 2050, actual: 4600, variance: 2550, percentSpent: 224 },
			{ name: 'Utilities', budget: 2339, actual: 1834, variance: -505, percentSpent: 78 },
			{ name: 'Maintenance', budget: 4379, actual: 5231, variance: 852, percentSpent: 119 },
			{ name: 'Contract Services', budget: 1813, actual: 1653, variance: -160, percentSpent: 91 },
		],
		'May 2025': [
			{ name: 'Insurance', budget: 9659, actual: 9659, variance: 0, percentSpent: 100 },
			{ name: 'Professional Services', budget: 2050, actual: 2200, variance: 150, percentSpent: 107 },
			{ name: 'Utilities', budget: 2339, actual: 1500, variance: -839, percentSpent: 64 },
			{ name: 'Maintenance', budget: 4379, actual: 3500, variance: -879, percentSpent: 80 },
			{ name: 'Contract Services', budget: 1813, actual: 1153, variance: -660, percentSpent: 64 },
		],
		'April 2025': [
			{ name: 'Insurance', budget: 9659, actual: 9659, variance: 0, percentSpent: 100 },
			{ name: 'Professional Services', budget: 2050, actual: 2200, variance: 150, percentSpent: 107 },
			{ name: 'Utilities', budget: 2339, actual: 1200, variance: -1139, percentSpent: 51 },
			{ name: 'Maintenance', budget: 4379, actual: 1500, variance: -2879, percentSpent: 34 },
			{ name: 'Contract Services', budget: 1813, actual: 700, variance: -1113, percentSpent: 39 },
		],
	};

	return monthMap[props.month] || monthMap['June 2025'];
});

// Chart data - reactive to month
const budgetChartData = computed(() => {
	const categories = expenseCategories.value;
	return {
		labels: categories.map((c) => c.name),
		datasets: [
			{
				label: 'Budget',
				data: categories.map((c) => c.budget),
				backgroundColor: 'rgba(59, 130, 246, 0.5)',
				borderColor: 'rgb(59, 130, 246)',
				borderWidth: 1,
			},
			{
				label: 'Actual',
				data: categories.map((c) => c.actual),
				backgroundColor: 'rgba(239, 68, 68, 0.5)',
				borderColor: 'rgb(239, 68, 68)',
				borderWidth: 1,
			},
		],
	};
});

const budgetChartOptions = ref({
	responsive: true,
	maintainAspectRatio: false,
	plugins: {
		legend: {
			position: 'top',
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

// Sign-off data - reactive to month
const preparedBy = computed(() => 'Management Company');
const preparedDate = computed(() => {
	const dateMap = {
		'June 2025': 'July 10, 2025',
		'May 2025': 'June 10, 2025',
		'April 2025': 'May 10, 2025',
		'March 2025': 'April 10, 2025',
		'February 2025': 'March 10, 2025',
		'January 2025': 'February 10, 2025',
	};
	return dateMap[props.month] || 'Pending';
});

const approvedBy = computed(() => {
	// Only April and earlier months are approved
	const approvedMonths = ['April 2025', 'March 2025', 'February 2025', 'January 2025'];
	return approvedMonths.includes(props.month) ? 'Board Treasurer' : null;
});

const approvedDate = computed(() => {
	const dateMap = {
		'April 2025': 'May 15, 2025',
		'March 2025': 'April 15, 2025',
		'February 2025': 'March 15, 2025',
		'January 2025': 'February 15, 2025',
	};
	return dateMap[props.month] || null;
});
</script>
