<template>
	<div class="min-h-screen bg-gray-50">
		<!-- Header -->
		<div class="bg-gradient-to-br from-green-500 to-green-600 text-white py-8 px-6">
			<div class="max-w-6xl mx-auto text-center">
				<div class="flex items-center justify-center mb-4">
					<UIcon name="i-heroicons-document-chart-bar" class="w-8 h-8 mr-3" />
					<h1 class="text-4xl font-bold">Monthly Reconciliation Reports</h1>
				</div>
				<h2 class="text-2xl font-semibold mb-2">Lenox Plaza Association, Inc. - 2025</h2>
				<p class="text-xl">Detailed Month-by-Month Financial Analysis</p>
			</div>
		</div>

		<div class="max-w-6xl mx-auto px-6 py-8">
			<!-- Year-to-Date Summary -->
			<UCard class="mb-8 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
				<template #header>
					<div class="flex items-center">
						<UIcon name="i-heroicons-chart-pie" class="w-6 h-6 mr-3 text-orange-600" />
						<h3 class="text-xl font-bold text-orange-800">🎯 Year-to-Date Summary (January - June 2025)</h3>
					</div>
				</template>

				<UTable :rows="ytdSummary" :columns="ytdColumns" class="w-full">
					<template #change-data="{ row }">
						<span :class="row.change < 0 ? 'text-red-600' : 'text-green-600'" class="font-semibold">
							{{ row.change < 0 ? '' : '+' }}${{ row.change.toLocaleString() }}
						</span>
					</template>

					<template #percent-data="{ row }">
						<span :class="row.percent < 0 ? 'text-red-600' : 'text-green-600'" class="font-semibold">
							{{ row.percent < 0 ? '' : '+' }}{{ row.percent }}%
						</span>
					</template>

					<template #trend-data="{ row }">
						<UIcon
							:name="row.trend === 'up' ? 'i-heroicons-arrow-trending-up' : 'i-heroicons-arrow-trending-down'"
							:class="row.trend === 'up' ? 'text-green-600' : 'text-red-600'"
							class="w-5 h-5"
						/>
					</template>
				</UTable>
			</UCard>

			<!-- Monthly Reports -->
			<div class="space-y-6">
				<div v-for="month in monthlyReports" :key="month.id" class="bg-white rounded-xl shadow-lg overflow-hidden">
					<div
						class="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 cursor-pointer flex justify-between items-center"
						@click="toggleMonth(month.id)"
					>
						<h3 class="text-xl font-bold">{{ month.title }}</h3>
						<UIcon
							:name="expandedMonths.includes(month.id) ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
							class="w-6 h-6 transition-transform duration-200"
						/>
					</div>

					<div v-show="expandedMonths.includes(month.id)" class="p-6">
						<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
							<!-- Operating Account -->
							<UCard>
								<template #header>
									<div class="text-white bg-red-500 px-4 py-2 -m-4 mb-4 font-bold">Operating Account (...5129)</div>
								</template>

								<div class="space-y-3">
									<div class="flex justify-between py-2 border-b border-gray-200">
										<span>Beginning Balance:</span>
										<span class="font-semibold">${{ month.operating.beginning.toLocaleString() }}</span>
									</div>
									<div class="flex justify-between py-2 border-b border-gray-200">
										<span>Deposits & Income:</span>
										<span class="font-semibold text-green-600">+${{ month.operating.deposits.toLocaleString() }}</span>
									</div>
									<div class="flex justify-between py-2 border-b border-gray-200">
										<span>Withdrawals & Expenses:</span>
										<span class="font-semibold text-red-600">-${{ month.operating.withdrawals.toLocaleString() }}</span>
									</div>
									<div class="flex justify-between py-2 font-bold text-lg">
										<span>Ending Balance:</span>
										<span>${{ month.operating.ending.toLocaleString() }}</span>
									</div>
								</div>

								<div class="mt-4 p-3 bg-gray-50 rounded-lg">
									<p class="text-sm font-semibold mb-2">Key Transactions:</p>
									<ul class="text-sm space-y-1">
										<li v-for="transaction in month.operating.keyTransactions" :key="transaction">
											• {{ transaction }}
										</li>
									</ul>
								</div>
							</UCard>

							<!-- Reserve Account -->
							<UCard>
								<template #header>
									<div class="text-white bg-green-500 px-4 py-2 -m-4 mb-4 font-bold">Reserve Account (...7011)</div>
								</template>

								<div class="space-y-3">
									<div class="flex justify-between py-2 border-b border-gray-200">
										<span>Beginning Balance:</span>
										<span class="font-semibold">${{ month.reserve.beginning.toLocaleString() }}</span>
									</div>
									<div class="flex justify-between py-2 border-b border-gray-200">
										<span>Transfers In:</span>
										<span class="font-semibold text-green-600">+${{ month.reserve.transfersIn.toLocaleString() }}</span>
									</div>
									<div class="flex justify-between py-2 border-b border-gray-200">
										<span>Interest Earned:</span>
										<span class="font-semibold text-green-600">+${{ month.reserve.interest.toFixed(2) }}</span>
									</div>
									<div class="flex justify-between py-2 font-bold text-lg">
										<span>Ending Balance:</span>
										<span>${{ month.reserve.ending.toLocaleString() }}</span>
									</div>
								</div>

								<div class="mt-4 p-3 bg-gray-50 rounded-lg">
									<p class="text-sm font-semibold">Status: {{ month.reserve.status }}</p>
								</div>
							</UCard>

							<!-- Special Assessment -->
							<UCard>
								<template #header>
									<div class="text-white bg-blue-500 px-4 py-2 -m-4 mb-4 font-bold">Special Assessment (...5872)</div>
								</template>

								<div class="space-y-3">
									<div class="flex justify-between py-2 border-b border-gray-200">
										<span>Beginning Balance:</span>
										<span class="font-semibold">${{ month.special.beginning.toLocaleString() }}</span>
									</div>
									<div class="flex justify-between py-2 border-b border-gray-200">
										<span>Collections:</span>
										<span class="font-semibold text-green-600">+${{ month.special.collections.toLocaleString() }}</span>
									</div>
									<div class="flex justify-between py-2 border-b border-gray-200">
										<span>Project Expenses:</span>
										<span class="font-semibold text-red-600">-${{ month.special.expenses.toLocaleString() }}</span>
									</div>
									<div class="flex justify-between py-2 font-bold text-lg">
										<span>Ending Balance:</span>
										<span>${{ month.special.ending.toLocaleString() }}</span>
									</div>
								</div>

								<div class="mt-4 p-3 bg-gray-50 rounded-lg">
									<p class="text-sm font-semibold">40-Year Project: {{ month.special.status }}</p>
								</div>
							</UCard>
						</div>

						<!-- Month Highlight -->
						<UAlert
							:color="month.highlight.type"
							variant="soft"
							:title="month.title + ' Highlight:'"
							:description="month.highlight.text"
						/>
					</div>
				</div>
			</div>

			<!-- Navigation -->
			<div class="mt-8 flex justify-center space-x-4">
				<UButton to="/hoa" color="blue" size="lg">
					<UIcon name="i-heroicons-arrow-left" class="w-5 h-5 mr-2" />
					Back to Dashboard
				</UButton>

				<UButton to="/hoa/budget-analysis" color="green" size="lg">
					<UIcon name="i-heroicons-calculator" class="w-5 h-5 mr-2" />
					Budget Analysis
				</UButton>
			</div>
		</div>
	</div>
</template>

<script setup>
// SEO
useHead({
	title: 'Monthly Reconciliation Reports - Lenox Plaza HOA',
	meta: [{ name: 'description', content: 'Detailed monthly financial reconciliation reports for Lenox Plaza HOA' }],
});

// Reactive state for expanded months
const expandedMonths = ref(['january']); // January expanded by default

// Year-to-Date Summary data
const ytdSummary = ref([
	{
		account: 'Operating (...5129)',
		jan1: 46087,
		jun30: 33472,
		change: -12615,
		percent: -27.4,
		trend: 'down',
	},
	{
		account: 'Reserve (...7011)',
		jan1: 12537,
		jun30: 14317,
		change: 1780,
		percent: 14.2,
		trend: 'up',
	},
	{
		account: 'Special Assessment (...5872)',
		jan1: 38844,
		jun30: 46133,
		change: 7289,
		percent: 18.8,
		trend: 'up',
	},
	{
		account: 'TOTAL CASH',
		jan1: 97468,
		jun30: 93922,
		change: -3546,
		percent: -3.6,
		trend: 'down',
	},
]);

// YTD Table columns
const ytdColumns = [
	{ key: 'account', label: 'Account', class: 'font-semibold' },
	{ key: 'jan1', label: 'Jan 1 Balance', class: 'text-right' },
	{ key: 'jun30', label: 'Jun 30 Balance', class: 'text-right' },
	{ key: 'change', label: 'Net Change', class: 'text-right' },
	{ key: 'percent', label: '% Change', class: 'text-right' },
	{ key: 'trend', label: 'Trend', class: 'text-center' },
];

// Monthly reports data
const monthlyReports = ref([
	{
		id: 'january',
		title: 'January 2025',
		operating: {
			beginning: 46087,
			deposits: 47012,
			withdrawals: 28984,
			ending: 64114,
			keyTransactions: [
				'Large insurance payment: $9,659',
				'Flood insurance: $9,329',
				'Monthly assessments collected',
				'Vendor payments for maintenance',
			],
		},
		reserve: {
			beginning: 12537,
			transfersIn: 0,
			interest: 0.1,
			ending: 12537,
			status: 'Minimal activity, earning interest',
		},
		special: {
			beginning: 38844,
			collections: 19650,
			expenses: 26509,
			ending: 31985,
			status: 'Collections ongoing, funds transferred for project expenses',
		},
		highlight: {
			type: 'yellow',
			text: 'Large insurance payments totaling $18,988 significantly impacted cash flow. Consider quarterly payment arrangements.',
		},
	},
	{
		id: 'february',
		title: 'February 2025',
		operating: {
			beginning: 64114,
			deposits: 16023,
			withdrawals: 25284,
			ending: 54853,
			keyTransactions: [
				'Insurance payment: $6,053',
				'Zelle payments from residents',
				'Regular contractor payments',
				'Utility payments',
			],
		},
		reserve: {
			beginning: 12537,
			transfersIn: 546,
			interest: 0.1,
			ending: 13083,
			status: 'Reserve funding from operating account',
		},
		special: {
			beginning: 31985,
			collections: 7812,
			expenses: 16721,
			ending: 23077,
			status: 'Continued collections and project expenditures',
		},
		highlight: {
			type: 'red',
			text: 'Operating balance declined by $9,261. Expense management needed to prevent further decline.',
		},
	},
	{
		id: 'march',
		title: 'March 2025',
		operating: {
			beginning: 54853,
			deposits: 40203,
			withdrawals: 50361,
			ending: 44695,
			keyTransactions: [
				'Large contractor payments',
				'Insurance: $6,053',
				'Zelle collections from residents',
				'High expense month',
			],
		},
		reserve: {
			beginning: 13083,
			transfersIn: 292,
			interest: 0.11,
			ending: 13376,
			status: 'Steady reserve growth',
		},
		special: {
			beginning: 23077,
			collections: 127165,
			expenses: 56965,
			ending: 93277,
			status: 'Major project funding received and initial expenses paid',
		},
		highlight: {
			type: 'blue',
			text: 'Major 40-year project activity with large deposits and initial project expenses. Operating account continues downward trend.',
		},
	},
	{
		id: 'april',
		title: 'April 2025',
		operating: {
			beginning: 44695,
			deposits: 40203,
			withdrawals: 32602,
			ending: 52296,
			keyTransactions: [
				'Insurance: $6,053',
				'Utility and maintenance payments',
				'Better expense control this month',
				'Zelle collections continuing',
			],
		},
		reserve: {
			beginning: 13376,
			transfersIn: 0,
			interest: 0.11,
			ending: 13376,
			status: 'Stable reserve account',
		},
		special: {
			beginning: 93277,
			collections: 26595,
			expenses: 36625,
			ending: 83247,
			status: 'Continued project expenses and resident payments',
		},
		highlight: {
			type: 'green',
			text: 'Operating account recovered slightly (+$7,601) due to better expense management. Special assessment project ongoing.',
		},
	},
	{
		id: 'may',
		title: 'May 2025',
		operating: {
			beginning: 52296,
			deposits: 22773,
			withdrawals: 41181,
			ending: 33888,
			keyTransactions: [
				'Insurance payment: $6,053',
				'Multiple contractor payments',
				'Lower income month',
				'High expense ratio',
			],
		},
		reserve: {
			beginning: 13376,
			transfersIn: 123,
			interest: 0.11,
			ending: 13499,
			status: 'Small reserve contribution',
		},
		special: {
			beginning: 83247,
			collections: 79833,
			expenses: 116947,
			ending: 46133,
			status: 'Heavy project activity with major expenses and collections',
		},
		highlight: {
			type: 'red',
			text: 'Operating account declined significantly (-$18,408). This is concerning and requires immediate attention. Major special assessment activity.',
		},
	},
	{
		id: 'june',
		title: 'June 2025',
		operating: {
			beginning: 33888,
			deposits: 52905,
			withdrawals: 53321,
			ending: 33472,
			keyTransactions: [
				'Large special assessment deposit: $35,398',
				'Insurance: $6,053',
				'High volume of resident payments',
				'Expenses nearly matched income',
			],
		},
		reserve: {
			beginning: 13499,
			transfersIn: 818,
			interest: 0.12,
			ending: 14317,
			status: 'Good reserve contribution this month',
		},
		special: {
			beginning: 46133,
			collections: 0,
			expenses: 0,
			ending: 46133,
			status: 'No activity this month - funds stable',
		},
		highlight: {
			type: 'yellow',
			text: 'Operating account remained flat despite high income due to matching expenses. Special assessment account stable at $46,133.',
		},
	},
]);

// Toggle month expansion
const toggleMonth = (monthId) => {
	const index = expandedMonths.value.indexOf(monthId);
	if (index > -1) {
		expandedMonths.value.splice(index, 1);
	} else {
		expandedMonths.value.push(monthId);
	}
};
</script>

<style scoped>
.transition-transform {
	transition: transform 0.2s ease-in-out;
}
</style>
