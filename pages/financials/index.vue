<template>
	<div class="min-h-screen bg-gray-50">
		<!-- Header -->
		<div class="bg-white shadow-sm border-b">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
				<h1 class="text-3xl font-bold text-gray-900 tracking-wider uppercase">HOA FINANCIAL DASHBOARD</h1>
				<p class="mt-2 text-gray-600">Lenox Plaza Association - Financial Health Monitor</p>
			</div>
		</div>

		<!-- Alert Banner for Critical Issues -->
		<div v-if="criticalIssues.length > 0" class="bg-red-50 border-b border-red-200">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
				<UAlert
					color="red"
					variant="subtle"
					:title="`${criticalIssues.length} Critical Issues Require Immediate Attention`"
				>
					<template #description>
						<ul class="mt-2 space-y-1">
							<li v-for="issue in criticalIssues" :key="issue" class="flex items-start">
								<span class="text-red-600 mr-2">•</span>
								<span>{{ issue }}</span>
							</li>
						</ul>
					</template>
				</UAlert>
			</div>
		</div>

		<!-- Main Content -->
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
			<!-- Account Summary Cards -->
			<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
				<FinancialsAccountSummaryCard v-for="account in accounts" :key="account.number" :account="account" />
			</div>

			<!-- Tabs for Different Views -->
			<UTabs :items="tabs" class="mt-8">
				<template #item="{ item }">
					<div v-if="item.key === 'overview'">
						<FinancialsOverview />
					</div>
					<div v-else-if="item.key === 'violations'">
						<FinancialsComplianceViolations />
					</div>
					<div v-else-if="item.key === 'budget'">
						<FinancialsBudgetAnalysis />
					</div>
					<div v-else-if="item.key === 'reconciliation'">
						<div class="text-center py-8">
							<p class="text-gray-600 mb-4">View detailed monthly reconciliation reports</p>
							<NuxtLink to="/financials/hoa/reconciliation">
								<UButton color="primary" size="lg" icon="i-heroicons-arrow-right">Go to Reconciliation</UButton>
							</NuxtLink>
						</div>
					</div>
					<div v-else-if="item.key === 'action-plan'">
						<FinancialsCorrectiveActionPlan />
					</div>
				</template>
			</UTabs>
		</div>
	</div>
</template>

<script setup>
// Get data from composable
const { getOperatingData, getSpecialAssessmentData, getReserveData, getViolationCount } = useReconciliationData();

// Current month for dashboard
const currentMonth = ref('June 2025');

// Get current data
const operatingData = computed(() => getOperatingData(currentMonth.value));
const specialData = computed(() => getSpecialAssessmentData(currentMonth.value));
const reserveData = computed(() => getReserveData(currentMonth.value));

// Critical issues - now reactive
const criticalIssues = computed(() => {
	const issues = [];
	const violations = getViolationCount(currentMonth.value);

	if (violations > 0) {
		const totalAmount = (specialData.value.improperTransfers || []).reduce((sum, t) => sum + t.amount, 0);
		issues.push(`Fund Mixing Violation: ${totalAmount.toLocaleString()} in improper transfers between accounts`);
	}

	if (operatingData.value.endingBalance < 40000) {
		const decline = operatingData.value.beginningBalance - operatingData.value.endingBalance;
		const percent = ((decline / operatingData.value.beginningBalance) * 100).toFixed(1);
		issues.push(`Operating account ${percent}% below previous levels`);
	}

	// Check for budget overruns
	const overBudgetItems = [
		{ name: 'Legal fees', percent: 293 },
		{ name: 'Professional services', percent: 224 },
	].filter((item) => item.percent > 150);

	overBudgetItems.forEach((item) => {
		issues.push(`${item.name} exceeded budget by ${item.percent - 100}%`);
	});

	if (operatingData.value.endingBalance < 35000) {
		issues.push('Monthly burn rate unsustainable - account depletion imminent');
	}

	return issues;
});

// Account summaries - now reactive
const accounts = computed(() => [
	{
		name: 'Operating Account',
		number: '...5129',
		balance: operatingData.value.endingBalance,
		previousBalance: operatingData.value.beginningBalance,
		change: operatingData.value.endingBalance - operatingData.value.beginningBalance,
		changePercent:
			((operatingData.value.endingBalance - operatingData.value.beginningBalance) /
				operatingData.value.beginningBalance) *
			100,
		status:
			operatingData.value.endingBalance < 35000
				? 'critical'
				: operatingData.value.endingBalance < 50000
					? 'warning'
					: 'stable',
		minBalance: 25000,
		icon: 'i-heroicons-banknotes',
	},
	{
		name: 'Reserve Account',
		number: '...7011',
		balance: reserveData.value.endingBalance,
		previousBalance: reserveData.value.beginningBalance,
		change: reserveData.value.endingBalance - reserveData.value.beginningBalance,
		changePercent: 0,
		status: 'stable',
		minBalance: 75000,
		icon: 'i-heroicons-shield-check',
	},
	{
		name: 'Special Assessment',
		number: '...5872',
		balance: specialData.value.endingBalance,
		previousBalance: specialData.value.beginningBalance,
		change: specialData.value.endingBalance - specialData.value.beginningBalance,
		changePercent:
			((specialData.value.endingBalance - specialData.value.beginningBalance) / specialData.value.beginningBalance) *
			100,
		status: getViolationCount(currentMonth.value) > 0 ? 'warning' : 'stable',
		minBalance: 40000,
		icon: 'i-heroicons-exclamation-triangle',
	},
]);

// Tab configuration with reactive badges
const tabs = computed(() => [
	{
		key: 'overview',
		label: 'Overview',
		icon: 'i-heroicons-chart-pie',
	},
	{
		key: 'violations',
		label: 'Compliance Violations',
		icon: 'i-heroicons-exclamation-circle',
		badge: getViolationCount(currentMonth.value) || undefined,
	},
	{
		key: 'budget',
		label: 'Budget Analysis',
		icon: 'i-heroicons-calculator',
	},
	{
		key: 'reconciliation',
		label: 'Monthly Reconciliation',
		icon: 'i-heroicons-document-check',
	},
	{
		key: 'action-plan',
		label: 'Action Plan',
		icon: 'i-heroicons-clipboard-document-check',
	},
]);
</script>
