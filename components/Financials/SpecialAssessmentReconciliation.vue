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
					<p class="text-sm font-medium text-gray-600 uppercase tracking-wider">Collections</p>
					<p class="mt-2 text-2xl font-bold text-green-600">+${{ totalCollections.toLocaleString() }}</p>
				</div>
			</UCard>

			<UCard>
				<div class="text-center">
					<p class="text-sm font-medium text-gray-600 uppercase tracking-wider">Project Expenses</p>
					<p class="mt-2 text-2xl font-bold text-blue-600">-${{ totalExpenses.toLocaleString() }}</p>
				</div>
			</UCard>

			<UCard>
				<div class="text-center">
					<p class="text-sm font-medium text-gray-600 uppercase tracking-wider">Ending Balance</p>
					<p class="mt-2 text-2xl font-bold text-gray-900">${{ endingBalance.toLocaleString() }}</p>
				</div>
			</UCard>
		</div>

		<!-- Critical Compliance Alert -->
		<UAlert
			color="red"
			variant="solid"
			title="CRITICAL: Special Assessment Fund Violations"
			icon="i-heroicons-shield-exclamation"
		>
			<template #description>
				<div class="mt-2 space-y-2 text-red-50">
					<p>This account is designated EXCLUSIVELY for 40-year recertification expenses.</p>
					<p class="font-semibold">Violations detected:</p>
					<ul class="list-disc list-inside ml-4">
						<li>Improper transfers to/from operating account</li>
						<li>Non-recertification expenses charged to this account</li>
						<li>Mixing of funds violates fiduciary duty</li>
					</ul>
				</div>
			</template>
		</UAlert>

		<!-- Special Assessment Collections -->
		<UCard>
			<template #header>
				<h3 class="text-lg font-bold text-gray-900 uppercase tracking-wider">Special Assessment Collections</h3>
			</template>

			<div class="space-y-4">
				<div class="bg-blue-50 rounded-lg p-4">
					<h4 class="font-semibold text-blue-900 mb-3">Assessment Details</h4>
					<div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
						<div>
							<p class="text-gray-600">Total Assessment</p>
							<p class="font-bold text-gray-900">${{ totalAssessment.toLocaleString() }}</p>
						</div>
						<div>
							<p class="text-gray-600">Collected to Date</p>
							<p class="font-bold text-green-600">${{ collectedToDate.toLocaleString() }}</p>
						</div>
						<div>
							<p class="text-gray-600">Outstanding</p>
							<p class="font-bold text-red-600">${{ outstanding.toLocaleString() }}</p>
						</div>
					</div>
				</div>

				<!-- Collection Details -->
				<div>
					<h4 class="font-semibold text-gray-900 mb-3">Recent Collections</h4>
					<div class="overflow-x-auto">
						<table class="min-w-full divide-y divide-gray-200">
							<thead class="bg-gray-50">
								<tr>
									<th class="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Date</th>
									<th class="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
										Unit/Source
									</th>
									<th class="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Amount</th>
									<th class="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
								</tr>
							</thead>
							<tbody class="bg-white divide-y divide-gray-200">
								<tr v-for="collection in collections" :key="collection.id">
									<td class="px-4 py-2 text-sm text-gray-900">{{ collection.date }}</td>
									<td class="px-4 py-2 text-sm text-gray-900">{{ collection.source }}</td>
									<td class="px-4 py-2 text-sm font-medium text-green-600">
										${{ collection.amount.toLocaleString() }}
									</td>
									<td class="px-4 py-2">
										<UBadge :color="collection.verified ? 'green' : 'yellow'" variant="subtle" size="sm">
											{{ collection.verified ? 'Verified' : 'Pending' }}
										</UBadge>
									</td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</UCard>

		<!-- 40-Year Recertification Expenses -->
		<UCard>
			<template #header>
				<h3 class="text-lg font-bold text-gray-900 uppercase tracking-wider">
					40-Year Recertification Project Expenses
				</h3>
			</template>

			<div class="space-y-4">
				<!-- Project Progress -->
				<div class="bg-blue-50 rounded-lg p-4">
					<div class="flex items-center justify-between mb-2">
						<h4 class="font-semibold text-blue-900">Project Progress</h4>
						<span class="text-2xl font-bold text-blue-600">{{ projectProgress }}%</span>
					</div>
					<div class="bg-blue-200 rounded-full h-3 overflow-hidden">
						<div class="h-full bg-blue-600 transition-all duration-500" :style="`width: ${projectProgress}%`" />
					</div>
				</div>

				<!-- Expense Categories -->
				<div>
					<h4 class="font-semibold text-gray-900 mb-3">Expense Breakdown</h4>
					<div class="space-y-3">
						<div v-for="category in expenseCategories" :key="category.name" class="border-l-4 border-blue-500 pl-4">
							<div class="flex justify-between items-start">
								<div>
									<p class="font-medium text-gray-900">{{ category.name }}</p>
									<p class="text-sm text-gray-600">{{ category.description }}</p>
								</div>
								<p class="font-bold text-gray-900">${{ category.amount.toLocaleString() }}</p>
							</div>
						</div>
					</div>
				</div>

				<!-- Recent Transactions -->
				<div>
					<h4 class="font-semibold text-gray-900 mb-3">Recent Transactions</h4>
					<div class="overflow-x-auto">
						<table class="min-w-full divide-y divide-gray-200">
							<thead class="bg-gray-50">
								<tr>
									<th class="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Date</th>
									<th class="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Vendor</th>
									<th class="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
										Description
									</th>
									<th class="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Amount</th>
									<th class="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
										Compliance
									</th>
								</tr>
							</thead>
							<tbody class="bg-white divide-y divide-gray-200">
								<tr v-for="expense in recentExpenses" :key="expense.id">
									<td class="px-4 py-2 text-sm text-gray-900">{{ expense.date }}</td>
									<td class="px-4 py-2 text-sm text-gray-900">{{ expense.vendor }}</td>
									<td class="px-4 py-2 text-sm text-gray-600">{{ expense.description }}</td>
									<td class="px-4 py-2 text-sm font-medium text-gray-900">${{ expense.amount.toLocaleString() }}</td>
									<td class="px-4 py-2">
										<UBadge :color="expense.compliant ? 'green' : 'red'" variant="subtle" size="sm">
											{{ expense.compliant ? 'Approved' : 'Violation' }}
										</UBadge>
									</td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</UCard>

		<!-- Improper Transfers -->
		<UCard>
			<template #header>
				<div class="flex items-center justify-between">
					<h3 class="text-lg font-bold text-red-900 uppercase tracking-wider">Improper Fund Transfers</h3>
					<UBadge color="red" variant="solid">Violations</UBadge>
				</div>
			</template>

			<div class="space-y-4">
				<p class="text-sm text-gray-700">
					The following transfers violate fund segregation requirements and must be reversed:
				</p>

				<div class="bg-red-50 rounded-lg p-4">
					<div class="overflow-x-auto">
						<table class="min-w-full divide-y divide-red-200">
							<thead>
								<tr>
									<th class="px-4 py-2 text-left text-xs font-medium text-red-800 uppercase tracking-wider">Date</th>
									<th class="px-4 py-2 text-left text-xs font-medium text-red-800 uppercase tracking-wider">
										Direction
									</th>
									<th class="px-4 py-2 text-left text-xs font-medium text-red-800 uppercase tracking-wider">Amount</th>
									<th class="px-4 py-2 text-left text-xs font-medium text-red-800 uppercase tracking-wider">
										Action Required
									</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-red-200">
								<tr v-for="transfer in improperTransfers" :key="transfer.id">
									<td class="px-4 py-2 text-sm text-gray-900">{{ transfer.date }}</td>
									<td class="px-4 py-2 text-sm text-gray-900">{{ transfer.direction }}</td>
									<td class="px-4 py-2 text-sm font-bold text-red-600">${{ transfer.amount.toLocaleString() }}</td>
									<td class="px-4 py-2 text-sm font-medium text-red-800">
										{{ transfer.action }}
									</td>
								</tr>
							</tbody>
							<tfoot>
								<tr class="bg-red-100">
									<td colspan="2" class="px-4 py-2 text-sm font-semibold text-gray-900">Total Violations</td>
									<td class="px-4 py-2 text-sm font-bold text-red-600">${{ totalViolations.toLocaleString() }}</td>
									<td class="px-4 py-2 text-sm font-bold text-red-800">Immediate Reversal</td>
								</tr>
							</tfoot>
						</table>
					</div>
				</div>

				<div class="border-l-4 border-red-500 pl-4 py-2 bg-red-50">
					<p class="text-sm font-semibold text-red-900">Legal Requirement:</p>
					<p class="text-sm text-red-800">
						Special assessment funds are legally restricted for their designated purpose. Using these funds for any
						other purpose violates fiduciary duty and may result in personal liability for board members.
					</p>
				</div>
			</div>
		</UCard>
	</div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useReconciliationData } from '~/composables/useReconciliationData';

const props = defineProps({
	month: {
		type: String,
		required: true,
	},
});

// Use the composable for data management
const { getSpecialAssessmentData, calculateTotals } = useReconciliationData();

// Get reactive data for current month
const currentMonthData = computed(() => getSpecialAssessmentData(props.month));

// Account balances - now reactive
const beginningBalance = computed(() => currentMonthData.value.beginningBalance);
const endingBalance = computed(() => currentMonthData.value.endingBalance);

// Calculate totals
const totals = computed(() => calculateTotals(currentMonthData.value));
const totalCollections = computed(() => totals.value.totalDeposits);
const totalExpenses = computed(() => totals.value.totalWithdrawals);

// Assessment tracking
const totalAssessment = ref(150000);
const collectedToDate = computed(() => {
	// Calculate based on month
	const monthProgress = {
		'June 2025': 95000,
		'May 2025': 86500,
		'April 2025': 84000,
		'March 2025': 80000,
		'February 2025': 75000,
		'January 2025': 70000,
	};
	return monthProgress[props.month] || 95000;
});
const outstanding = computed(() => totalAssessment.value - collectedToDate.value);

// Collections data - now reactive
const collections = computed(() => currentMonthData.value.collections || []);

// Project data - reactive to month
const projectProgress = computed(() => {
	const progress = {
		'June 2025': 35,
		'May 2025': 30,
		'April 2025': 25,
		'March 2025': 20,
		'February 2025': 15,
		'January 2025': 10,
	};
	return progress[props.month] || 35;
});

const expenseCategories = ref([
	{ name: 'Engineering & Inspection', description: 'Structural assessment and plans', amount: 25000 },
	{ name: 'Permits & Compliance', description: 'City permits and regulatory fees', amount: 8500 },
	{ name: 'Concrete Repairs', description: 'Balcony and structural repairs', amount: 45000 },
	{ name: 'Professional Services', description: 'Project management and oversight', amount: 12000 },
]);

// Recent expenses - now reactive
const recentExpenses = computed(() => currentMonthData.value.expenses || []);

// Improper transfers - now reactive
const improperTransfers = computed(() => currentMonthData.value.improperTransfers || []);

const totalViolations = computed(() => {
	return improperTransfers.value.reduce((sum, transfer) => sum + transfer.amount, 0);
});
</script>
