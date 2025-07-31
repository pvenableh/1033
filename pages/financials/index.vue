<template>
	<div class="min-h-screen bg-gray-50">
		<!-- Critical Alert Banner -->
		<div v-if="showCriticalAlert" class="bg-red-900 text-white">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
				<div class="flex items-center justify-between">
					<div class="flex items-center">
						<UIcon name="i-heroicons-exclamation-triangle" class="w-6 h-6 mr-2 animate-pulse" />
						<span class="font-bold">
							CRITICAL: Reserve Account at ${{ reserveBalance.toLocaleString() }} -
							{{ complianceStatus.violationCount }} fund violations detected
						</span>
					</div>
					<UButton
						color="white"
						variant="ghost"
						size="sm"
						icon="i-heroicons-x-mark"
						@click="showCriticalAlert = false"
					/>
				</div>
			</div>
		</div>

		<!-- Header -->
		<div class="bg-white shadow-sm border-b">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
				<div class="flex items-center justify-between">
					<div>
						<h1 class="text-3xl font-bold text-gray-900">Financial Dashboard</h1>
						<p class="mt-2 text-gray-600">2025 HOA Budget Overview & Account Analytics</p>
					</div>
					<div class="flex space-x-3">
						<USelectMenu
							v-model="selectedMonth"
							:options="availableMonths"
							placeholder="Select Month"
							class="relative w-40"
						>
							<template #label>
								<span class="text-sm">{{ selectedMonth }}</span>
							</template>
						</USelectMenu>
					</div>
				</div>
			</div>
		</div>

		<!-- Main Content -->
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
			<!-- Budget Overview Section (Your Simple Hardcoded Data) -->
			<UCard class="mb-8">
				<template #header>
					<div class="flex items-center">
						<UIcon name="i-heroicons-chart-pie" class="w-6 h-6 mr-3 text-blue-600" />
						<h3 class="text-xl font-bold">2025 Budget Overview</h3>
					</div>
				</template>

				<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
					<!-- Revenue Breakdown -->
					<div class="space-y-4">
						<h4 class="font-semibold text-gray-900">Annual Revenue Breakdown</h4>
						<div
							v-for="item in revenueBreakdown"
							:key="item.label"
							class="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
						>
							<div class="flex items-center">
								<div :class="item.colorClass" class="w-4 h-4 rounded-full mr-3"></div>
								<div>
									<div class="font-semibold">{{ item.label }}</div>
									<div class="text-sm text-gray-600">{{ item.description }}</div>
								</div>
							</div>
							<div class="text-right">
								<div class="font-bold text-lg">${{ item.amount.toLocaleString() }}</div>
								<div class="text-sm text-gray-500">{{ item.percentage }}%</div>
							</div>
						</div>

						<div class="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
							<div class="text-2xl font-bold text-blue-600 mb-2">${{ totalBudget.toLocaleString() }}</div>
							<div class="text-sm text-gray-600">Total Annual Budget</div>
						</div>
					</div>

					<!-- Monthly Summary -->
					<div class="space-y-4">
						<h4 class="font-semibold text-gray-900">Monthly Income Target</h4>
						<div class="text-center p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
							<div class="text-3xl font-bold text-gray-900 mb-2">${{ monthlyTotal.toLocaleString() }}</div>
							<div class="text-sm text-gray-600 mb-4">Projected Monthly Income</div>
							<div class="grid grid-cols-3 gap-4 text-center">
								<div>
									<div class="text-lg font-semibold text-green-600">${{ monthlyHOAFees.toLocaleString() }}</div>
									<div class="text-xs text-gray-500">HOA Fees</div>
								</div>
								<div>
									<div class="text-lg font-semibold text-purple-600">${{ monthlyLaundryIncome }}</div>
									<div class="text-xs text-gray-500">Laundry</div>
								</div>
								<div>
									<div class="text-lg font-semibold text-yellow-600">${{ monthlyOtherIncome }}</div>
									<div class="text-xs text-gray-500">Other</div>
								</div>
							</div>
						</div>

						<div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
							<div class="flex items-center">
								<UIcon name="i-heroicons-information-circle" class="w-5 h-5 text-blue-600 mr-2" />
								<div class="text-sm text-blue-800">
									<strong>Budget Status:</strong>
									This represents the projected total income for 2025 based on current fee structure.
								</div>
							</div>
						</div>
					</div>
				</div>
			</UCard>

			<!-- Account Analysis Tabs -->
			<UTabs :items="accountTabs" class="space-y-6">
				<template #item="{ item }">
					<!-- Operating Account Tab -->
					<div v-if="item.key === 'operating'">
						<FinancialsOperatingAccountReconciliation :month="selectedMonth" />
					</div>

					<!-- Reserve Account Tab (Critical) -->
					<div v-if="item.key === 'reserve'">
						<FinancialsReserveAccountReconciliation :month="selectedMonth" />
					</div>

					<!-- Budget Analysis Tab -->
					<div v-if="item.key === 'budget'">
						<FinanceOperatingAccountDashboard />
					</div>

					<!-- Overview Tab -->
					<div v-if="item.key === 'overview'" class="space-y-6">
						<!-- Quick Account Balances -->
						<div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
							<!-- Operating Account -->
							<UCard :class="operatingBalance < 25000 ? 'border-red-500 bg-red-50' : 'border-gray-200'">
								<div class="flex items-center justify-between">
									<div>
										<p class="text-sm font-medium text-gray-600 uppercase tracking-wider">Operating</p>
										<p
											class="mt-2 text-2xl font-bold"
											:class="operatingBalance < 25000 ? 'text-red-600' : 'text-gray-900'"
										>
											${{ operatingBalance.toLocaleString() }}
										</p>
										<p class="mt-1 text-sm" :class="monthlyStats.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'">
											{{ monthlyStats.netCashFlow >= 0 ? '+' : '' }}${{ monthlyStats.netCashFlow.toLocaleString() }}
										</p>
									</div>
									<div :class="operatingBalance < 25000 ? 'bg-red-100' : 'bg-blue-100'" class="p-3 rounded-full">
										<UIcon
											name="i-heroicons-building-office"
											class="w-6 h-6"
											:class="operatingBalance < 25000 ? 'text-red-600' : 'text-blue-600'"
										/>
									</div>
								</div>
							</UCard>

							<!-- Reserve Account (Critical) -->
							<UCard class="border-red-500 bg-red-50">
								<div class="flex items-center justify-between">
									<div>
										<p class="text-sm font-medium text-gray-600 uppercase tracking-wider">Reserve</p>
										<p class="mt-2 text-2xl font-bold text-red-600">${{ reserveBalance.toLocaleString() }}</p>
										<p class="mt-1 text-sm text-red-600">${{ reserveShortfall.toLocaleString() }} shortfall</p>
									</div>
									<div class="p-3 rounded-full bg-red-100">
										<UIcon name="i-heroicons-shield-exclamation" class="w-6 h-6 text-red-600" />
									</div>
								</div>
							</UCard>

							<!-- Special Assessment -->
							<UCard>
								<div class="flex items-center justify-between">
									<div>
										<p class="text-sm font-medium text-gray-600 uppercase tracking-wider">Special</p>
										<p class="mt-2 text-2xl font-bold text-gray-900">${{ specialBalance.toLocaleString() }}</p>
										<p class="mt-1 text-sm text-purple-600">40-Year Project</p>
									</div>
									<div class="p-3 rounded-full bg-purple-100">
										<UIcon name="i-heroicons-wrench-screwdriver" class="w-6 h-6 text-purple-600" />
									</div>
								</div>
							</UCard>

							<!-- Total Cash -->
							<UCard>
								<div class="flex items-center justify-between">
									<div>
										<p class="text-sm font-medium text-gray-600 uppercase tracking-wider">Total Cash</p>
										<p class="mt-2 text-2xl font-bold text-gray-900">${{ totalCashPosition.toLocaleString() }}</p>
										<p class="mt-1 text-sm text-gray-500">All accounts</p>
									</div>
									<div class="p-3 rounded-full bg-green-100">
										<UIcon name="i-heroicons-banknotes" class="w-6 h-6 text-green-600" />
									</div>
								</div>
							</UCard>
						</div>

						<!-- Financial Health Summary -->
						<UCard>
							<template #header>
								<div class="flex items-center">
									<UIcon name="i-heroicons-heart" class="w-6 h-6 mr-3 text-red-600" />
									<h3 class="text-xl font-bold">Financial Health & Compliance</h3>
								</div>
							</template>

							<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
								<!-- Health Score -->
								<div class="text-center p-6 rounded-lg border-2" :class="getHealthCardClass(financialHealth.overall)">
									<div class="text-3xl font-bold mb-2" :class="getHealthTextClass(financialHealth.overall)">
										{{ financialHealth.score }}/100
									</div>
									<div class="text-lg font-semibold mb-3" :class="getHealthTextClass(financialHealth.overall)">
										{{ financialHealth.overall }}
									</div>
									<div class="w-full bg-gray-200 rounded-full h-3 mb-4">
										<div
											:class="getHealthBarClass(financialHealth.overall)"
											class="h-full rounded-full transition-all duration-500"
											:style="`width: ${financialHealth.score}%`"
										></div>
									</div>
								</div>

								<!-- Compliance Status -->
								<div class="space-y-4">
									<h4 class="font-semibold text-gray-900">Compliance Status</h4>
									<div class="space-y-3">
										<div
											class="flex items-center justify-between p-3 rounded-lg border"
											:class="
												complianceStatus.fundSegregation === 'COMPLIANT'
													? 'border-green-200 bg-green-50'
													: 'border-red-200 bg-red-50'
											"
										>
											<span class="text-sm font-medium">Fund Segregation</span>
											<span
												:class="complianceStatus.fundSegregation === 'COMPLIANT' ? 'text-green-600' : 'text-red-600'"
												class="font-bold"
											>
												{{ complianceStatus.fundSegregation === 'COMPLIANT' ? '✓' : '✗' }}
											</span>
										</div>
										<div class="flex items-center justify-between p-3 rounded-lg border border-red-200 bg-red-50">
											<span class="text-sm font-medium">Violations</span>
											<span class="font-bold text-red-600">{{ complianceStatus.violationCount }}</span>
										</div>
									</div>
								</div>

								<!-- Monthly Activity -->
								<div class="space-y-4">
									<h4 class="font-semibold text-gray-900">{{ selectedMonth }} Activity</h4>
									<div class="space-y-3">
										<div class="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
											<span class="text-sm font-medium">Deposits</span>
											<span class="font-bold text-green-600">${{ monthlyStats.totalDeposits.toLocaleString() }}</span>
										</div>
										<div class="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
											<span class="text-sm font-medium">Expenses</span>
											<span class="font-bold text-red-600">${{ monthlyStats.totalWithdrawals.toLocaleString() }}</span>
										</div>
										<div class="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
											<span class="text-sm font-medium">Net Flow</span>
											<span
												class="font-bold"
												:class="monthlyStats.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'"
											>
												{{ monthlyStats.netCashFlow >= 0 ? '+' : '' }}${{ monthlyStats.netCashFlow.toLocaleString() }}
											</span>
										</div>
									</div>
								</div>
							</div>

							<!-- Issues List -->
							<div v-if="financialHealth.issues.length > 0" class="mt-6 space-y-2">
								<h4 class="font-semibold text-gray-900">Current Issues:</h4>
								<div
									v-for="issue in financialHealth.issues"
									:key="issue"
									class="flex items-center text-sm text-red-600 bg-red-50 p-3 rounded"
								>
									<UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4 mr-2 flex-shrink-0" />
									{{ issue }}
								</div>
							</div>
						</UCard>
					</div>
				</template>
			</UTabs>
		</div>
	</div>
</template>

<script setup>
import { ref, computed } from 'vue';

// Import the reconciliation data composable
const {
	getMonthData,
	calculateFinancialHealth,
	checkCompliance,
	getOperatingData,
	getReserveData,
	getSpecialAssessmentData,
	calculateStatistics,
} = useReconciliationData();

// Budget constants (hardcoded as requested)
const monthlyHOAFees = 14364;
const monthlyLaundryIncome = 400;
const monthlyOtherIncome = 20;

// Available months for selection
const availableMonths = ['June 2025', 'May 2025', 'April 2025', 'March 2025', 'February 2025', 'January 2025'];

// Selected month (reactive)
const selectedMonth = ref('June 2025');

// Critical alert control
const showCriticalAlert = ref(true);

// Tab configuration
const accountTabs = [
	{ key: 'overview', label: 'Overview', icon: 'i-heroicons-squares-2x2' },
	{ key: 'operating', label: 'Operating Account', icon: 'i-heroicons-building-office' },
	{ key: 'reserve', label: 'Reserve (Critical)', icon: 'i-heroicons-shield-exclamation' },
	{ key: 'budget', label: 'Budget Analysis', icon: 'i-heroicons-chart-bar' },
];

// Annual calculations (computed from hardcoded values)
const annualHOAFees = computed(() => monthlyHOAFees * 12);
const annualLaundryIncome = computed(() => monthlyLaundryIncome * 12);
const annualOtherIncome = computed(() => monthlyOtherIncome * 12);
const totalBudget = computed(() => annualHOAFees.value + annualLaundryIncome.value + annualOtherIncome.value);
const monthlyTotal = computed(() => monthlyHOAFees + monthlyLaundryIncome + monthlyOtherIncome);

// Revenue breakdown for display
const revenueBreakdown = computed(() => [
	{
		label: 'HOA Monthly Fees',
		description: 'Regular assessments from homeowners',
		amount: annualHOAFees.value,
		percentage: ((annualHOAFees.value / totalBudget.value) * 100).toFixed(1),
		colorClass: 'bg-green-500',
	},
	{
		label: 'Laundry Income',
		description: 'Revenue from laundry facilities',
		amount: annualLaundryIncome.value,
		percentage: ((annualLaundryIncome.value / totalBudget.value) * 100).toFixed(1),
		colorClass: 'bg-purple-500',
	},
	{
		label: 'Other Income',
		description: 'Miscellaneous revenue sources',
		amount: annualOtherIncome.value,
		percentage: ((annualOtherIncome.value / totalBudget.value) * 100).toFixed(1),
		colorClass: 'bg-yellow-500',
	},
]);

// Real account data from reconciliation composable
const financialHealth = computed(() => calculateFinancialHealth(selectedMonth.value));
const complianceStatus = computed(() => checkCompliance(selectedMonth.value));
const monthlyStats = computed(() => calculateStatistics(selectedMonth.value));

// Account balances from real data
const operatingBalance = computed(() => {
	const data = getOperatingData(selectedMonth.value);
	return data?.endingBalance || 0;
});

const reserveBalance = computed(() => {
	const data = getReserveData(selectedMonth.value);
	return data?.endingBalance || 0;
});

const specialBalance = computed(() => {
	const data = getSpecialAssessmentData(selectedMonth.value);
	return data?.endingBalance || 0;
});

const totalCashPosition = computed(() => operatingBalance.value + reserveBalance.value + specialBalance.value);

const reserveShortfall = computed(() => {
	const data = getReserveData(selectedMonth.value);
	return data?.shortfall || 0;
});

// Helper functions for styling
const getHealthCardClass = (status) => {
	const classes = {
		HEALTHY: 'bg-green-50 border-green-200',
		MODERATE: 'bg-yellow-50 border-yellow-200',
		POOR: 'bg-orange-50 border-orange-200',
		CRITICAL: 'bg-red-50 border-red-200',
	};
	return classes[status] || 'bg-gray-50 border-gray-200';
};

const getHealthTextClass = (status) => {
	const classes = {
		HEALTHY: 'text-green-600',
		MODERATE: 'text-yellow-600',
		POOR: 'text-orange-600',
		CRITICAL: 'text-red-600',
	};
	return classes[status] || 'text-gray-600';
};

const getHealthBarClass = (status) => {
	const classes = {
		HEALTHY: 'bg-green-500',
		MODERATE: 'bg-yellow-500',
		POOR: 'bg-orange-500',
		CRITICAL: 'bg-red-500',
	};
	return classes[status] || 'bg-gray-500';
};

// Set page title
useHead({
	title: 'Financial Dashboard - HOA Management',
});
</script>
