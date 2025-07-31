<template>
	<div class="space-y-6">
		<!-- Month Selector -->
		<div class="flex items-center justify-between">
			<h3 class="text-lg font-bold text-gray-900 uppercase tracking-wider">Monthly Reconciliation Report</h3>
			<USelectMenu v-model="selectedMonth" :options="availableMonths" placeholder="Select month" class="w-48" />
		</div>

		<!-- Account Reconciliation Tabs -->
		<UTabs :items="accountTabs">
			<template #item="{ item }">
				<!-- Operating Account (5129) -->
				<div v-if="item.key === 'operating'" class="space-y-6">
					<ReconciliationSummary :account="operatingAccount" :month="selectedMonth" />

					<!-- Transaction Categories -->
					<UCard>
						<template #header>
							<h4 class="font-bold text-gray-900 uppercase tracking-wider">Transaction Analysis</h4>
						</template>

						<div class="space-y-4">
							<!-- Deposits -->
							<div>
								<h5 class="font-semibold text-gray-900 mb-3">Deposits & Additions</h5>
								<div class="bg-green-50 rounded-lg p-4">
									<div class="space-y-2">
										<div
											v-for="deposit in operatingDeposits"
											:key="deposit.id"
											class="flex justify-between items-center"
										>
											<div>
												<span class="text-sm font-medium text-gray-900">{{ deposit.description }}</span>
												<span class="text-xs text-gray-500 ml-2">{{ deposit.date }}</span>
											</div>
											<span class="font-semibold text-green-600">+${{ deposit.amount.toLocaleString() }}</span>
										</div>
									</div>
									<div class="mt-3 pt-3 border-t border-green-200 flex justify-between">
										<span class="font-semibold text-gray-900">Total Deposits</span>
										<span class="font-bold text-green-600">+${{ totalDeposits.toLocaleString() }}</span>
									</div>
								</div>
							</div>

							<!-- Withdrawals -->
							<div>
								<h5 class="font-semibold text-gray-900 mb-3">Withdrawals & Expenses</h5>
								<div class="bg-red-50 rounded-lg p-4">
									<div class="space-y-2">
										<div
											v-for="expense in operatingExpenses"
											:key="expense.id"
											class="flex justify-between items-center"
										>
											<div>
												<span class="text-sm font-medium text-gray-900">{{ expense.description }}</span>
												<span class="text-xs text-gray-500 ml-2">{{ expense.category }}</span>
											</div>
											<span class="font-semibold text-red-600">-${{ expense.amount.toLocaleString() }}</span>
										</div>
									</div>
									<div class="mt-3 pt-3 border-t border-red-200 flex justify-between">
										<span class="font-semibold text-gray-900">Total Withdrawals</span>
										<span class="font-bold text-red-600">-${{ totalWithdrawals.toLocaleString() }}</span>
									</div>
								</div>
							</div>
						</div>
					</UCard>

					<!-- Compliance Issues -->
					<UCard>
						<template #header>
							<h4 class="font-bold text-gray-900 uppercase tracking-wider">Compliance Issues Detected</h4>
						</template>

						<div class="space-y-3">
							<UAlert
								v-for="issue in complianceIssues"
								:key="issue.id"
								:color="issue.severity === 'critical' ? 'red' : 'yellow'"
								:title="issue.title"
								:description="issue.description"
							/>
						</div>
					</UCard>
				</div>

				<!-- Special Assessment Account (5872) -->
				<div v-else-if="item.key === 'special'" class="space-y-6">
					<ReconciliationSummary :account="specialAccount" :month="selectedMonth" />

					<UCard>
						<template #header>
							<h4 class="font-bold text-gray-900 uppercase tracking-wider">40-Year Recertification Expenses</h4>
						</template>

						<div class="space-y-4">
							<div v-for="expense in recertExpenses" :key="expense.id" class="border-l-4 border-blue-500 pl-4">
								<div class="flex justify-between items-start">
									<div>
										<p class="font-semibold text-gray-900">{{ expense.vendor }}</p>
										<p class="text-sm text-gray-600">{{ expense.description }}</p>
										<p class="text-xs text-gray-500 mt-1">{{ expense.date }}</p>
									</div>
									<p class="font-bold text-gray-900">${{ expense.amount.toLocaleString() }}</p>
								</div>
							</div>
						</div>
					</UCard>
				</div>

				<!-- Reserve Account (7011) -->
				<div v-else-if="item.key === 'reserve'" class="space-y-6">
					<ReconciliationSummary :account="reserveAccount" :month="selectedMonth" />

					<UCard>
						<template #header>
							<h4 class="font-bold text-gray-900 uppercase tracking-wider">Reserve Account Activity</h4>
						</template>

						<div class="text-center py-8 text-gray-500">
							<UIcon name="i-heroicons-check-circle" class="w-16 h-16 mx-auto text-green-500 mb-4" />
							<p class="text-lg font-medium">No activity this month</p>
							<p class="text-sm mt-2">Reserve account properly segregated</p>
						</div>
					</UCard>
				</div>
			</template>
		</UTabs>
	</div>
</template>

<script setup>
import { ref, computed } from 'vue';

const selectedMonth = ref('June 2025');
const availableMonths = ref(['June 2025', 'May 2025', 'April 2025', 'March 2025', 'February 2025', 'January 2025']);

const accountTabs = ref([
	{
		key: 'operating',
		label: 'Operating (5129)',
		icon: 'i-heroicons-banknotes',
	},
	{
		key: 'special',
		label: 'Special Assessment (5872)',
		icon: 'i-heroicons-exclamation-triangle',
	},
	{
		key: 'reserve',
		label: 'Reserve (7011)',
		icon: 'i-heroicons-shield-check',
	},
]);

const operatingAccount = ref({
	name: 'Operating Account',
	number: '...5129',
	beginningBalance: 52295.97,
	endingBalance: 33887.93,
	netChange: -18408.04,
});

const specialAccount = ref({
	name: 'Special Assessment',
	number: '...5872',
	beginningBalance: 50000,
	endingBalance: 45000,
	netChange: -5000,
});

const reserveAccount = ref({
	name: 'Reserve Account',
	number: '...7011',
	beginningBalance: 95037.01,
	endingBalance: 95037.01,
	netChange: 0,
});

const operatingDeposits = ref([
	{ id: 1, date: '05/01', description: 'Zelle Payment - Alexa Stylianou', amount: 600 },
	{ id: 2, date: '05/02', description: 'Remote Online Deposit', amount: 1500 },
	{ id: 3, date: '05/09', description: 'Sunshine Apts LLC', amount: 7000 },
	{ id: 4, date: '05/14', description: 'Sunshine Apts LLC', amount: 7252.14 },
	{ id: 5, date: '05/15', description: 'Online Transfer from ...5872', amount: 600 },
]);

const totalDeposits = computed(() => {
	return operatingDeposits.value.reduce((sum, deposit) => sum + deposit.amount, 0);
});

const operatingExpenses = ref([
	{ id: 1, description: 'First Insurance Funding', category: 'Insurance', amount: 9659.42 },
	{ id: 2, description: 'VTE Consulting LLC', category: 'Management', amount: 700 },
	{ id: 3, description: 'ACE Engineering', category: 'Maintenance', amount: 2500 },
	{ id: 4, description: 'Harry Tempkins', category: 'Maintenance', amount: 1200 },
	{ id: 5, description: 'FPL Electric', category: 'Utilities', amount: 197.38 },
	{ id: 6, description: 'Transfer to ...5872', category: 'VIOLATION', amount: 4852.71 },
]);

const totalWithdrawals = computed(() => {
	return operatingExpenses.value.reduce((sum, expense) => sum + expense.amount, 0);
});

const complianceIssues = ref([
	{
		id: 1,
		severity: 'critical',
		title: 'Improper Transfer Detected',
		description: 'Transfer of $4,852.71 to Special Assessment account violates fund segregation requirements',
	},
	{
		id: 2,
		severity: 'warning',
		title: 'Below Minimum Balance',
		description: 'Operating account balance of $33,887.93 is approaching minimum threshold of $25,000',
	},
]);

const recertExpenses = ref([
	{ id: 1, vendor: 'ACE Engineering', description: '40-year structural inspection', date: '05/15/2025', amount: 5000 },
	{ id: 2, vendor: 'Permit Services', description: 'Building permit fees', date: '05/20/2025', amount: 1200 },
	{ id: 3, vendor: 'Concrete Solutions', description: 'Balcony repairs - Phase 1', date: '05/25/2025', amount: 8500 },
]);
</script>
