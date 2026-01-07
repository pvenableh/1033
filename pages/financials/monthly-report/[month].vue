<template>
	<div class="max-w-7xl mx-auto p-6">
		<!-- Header -->
		<div class="mb-8">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-3xl font-bold uppercase tracking-wider mb-2">MONTHLY RECONCILIATION REPORT</h1>
					<p class="text-gray-600">{{ monthDisplay }} 2025 - All HOA Accounts</p>
					<div class="flex gap-4 mt-2">
						<span class="text-sm text-gray-500">Operating (5129)</span>
						<span class="text-sm text-gray-500">Reserves (7011)</span>
						<span class="text-sm text-gray-500">40-Year Special (5872)</span>
					</div>
				</div>
				<UButton color="gray" variant="ghost" icon="i-heroicons-arrow-left" to="/financials">BACK TO DASHBOARD</UButton>
			</div>
		</div>

		<!-- 🚨 FLORIDA COMPLIANCE ALERTS -->
		<div v-if="complianceViolations.length > 0" class="mb-8">
			<UAlert
				icon="i-heroicons-exclamation-triangle"
				color="red"
				variant="solid"
				title="🚨 FLORIDA STATUTE VIOLATIONS DETECTED"
				:description="`${totalViolationAmount.toLocaleString()} in unauthorized transfers between accounts`"
				class="mb-4" />

			<div class="grid gap-3">
				<UAlert
					v-for="violation in complianceViolations.slice(0, 3)"
					:key="violation.date"
					icon="i-heroicons-exclamation-circle"
					color="orange"
					variant="soft"
					:title="`${violation.accounts}: $${violation.amount.toLocaleString()}`"
					:description="violation.description" />
			</div>
		</div>

		<!-- Multi-Account Summary -->
		<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
			<!-- Operating Account (5129) -->
			<UCard>
				<template #header>
					<div class="flex items-center justify-between">
						<h3 class="font-semibold">Operating Account (5129)</h3>
						<UBadge :color="operatingData?.endingBalance < 25000 ? 'red' : 'green'" variant="soft" size="xs">
							{{ operatingData?.endingBalance < 25000 ? 'CRITICAL' : 'HEALTHY' }}
						</UBadge>
					</div>
				</template>

				<div class="space-y-3">
					<div class="grid grid-cols-2 gap-4 text-sm">
						<div>
							<p class="text-gray-600">Beginning</p>
							<p class="font-semibold">${{ operatingData?.beginningBalance?.toLocaleString() || '0' }}</p>
						</div>
						<div>
							<p class="text-gray-600">Ending</p>
							<p class="font-semibold" :class="operatingData?.endingBalance < 25000 ? 'text-red-600' : 'text-gray-900'">
								${{ operatingData?.endingBalance?.toLocaleString() || '0' }}
							</p>
						</div>
					</div>

					<div class="pt-2 border-t">
						<p class="text-gray-600 text-sm">Net Change</p>
						<p class="font-semibold" :class="operatingNetChange >= 0 ? 'text-green-600' : 'text-red-600'">
							{{ operatingNetChange >= 0 ? '+' : '' }}${{ Math.abs(operatingNetChange).toLocaleString() }}
						</p>
					</div>

					<div v-if="operatingViolations > 0" class="p-2 bg-red-50 rounded text-red-700 text-sm">
						⚠️ {{ operatingViolations }} fund mixing violations
					</div>
				</div>
			</UCard>

			<!-- Reserve Account (7011) -->
			<UCard>
				<template #header>
					<div class="flex items-center justify-between">
						<h3 class="font-semibold">Reserve Account (7011)</h3>
						<UBadge color="red" variant="soft" size="xs">CRITICAL</UBadge>
					</div>
				</template>

				<div class="space-y-3">
					<div class="grid grid-cols-2 gap-4 text-sm">
						<div>
							<p class="text-gray-600">Current Balance</p>
							<p class="font-semibold text-red-600">${{ reserveData?.endingBalance?.toLocaleString() || '0' }}</p>
						</div>
						<div>
							<p class="text-gray-600">Required Min</p>
							<p class="font-semibold">$75,000</p>
						</div>
					</div>

					<div class="pt-2 border-t">
						<p class="text-gray-600 text-sm">Shortfall</p>
						<p class="font-semibold text-red-600">
							-${{ (75000 - (reserveData?.endingBalance || 0)).toLocaleString() }}
						</p>
					</div>

					<div class="p-2 bg-red-50 rounded text-red-700 text-sm">
						🚨 {{ Math.round(((75000 - (reserveData?.endingBalance || 0)) / 75000) * 100) }}% underfunded
					</div>
				</div>
			</UCard>

			<!-- 40-Year Special Assessment (5872) -->
			<UCard>
				<template #header>
					<div class="flex items-center justify-between">
						<h3 class="font-semibold">40-Year Special (5872)</h3>
						<UBadge color="orange" variant="soft" size="xs">VIOLATIONS</UBadge>
					</div>
				</template>

				<div class="space-y-3">
					<div class="grid grid-cols-2 gap-4 text-sm">
						<div>
							<p class="text-gray-600">Project Balance</p>
							<p class="font-semibold">${{ specialAssessmentData?.endingBalance?.toLocaleString() || '0' }}</p>
						</div>
						<div>
							<p class="text-gray-600">Improper Transfers</p>
							<p class="font-semibold text-orange-600">{{ specialViolations }}</p>
						</div>
					</div>

					<div class="pt-2 border-t">
						<p class="text-gray-600 text-sm">Fund Purity</p>
						<p class="font-semibold text-orange-600">COMPROMISED</p>
					</div>

					<div class="p-2 bg-orange-50 rounded text-orange-700 text-sm">❌ Mixed with operating funds</div>
				</div>
			</UCard>
		</div>

		<!-- Budget vs Actual Analysis (Corrected) -->
		<UCard class="mb-8">
			<template #header>
				<div class="flex justify-between items-center">
					<h2 class="text-xl font-semibold uppercase tracking-wide">BUDGET VARIANCE ANALYSIS</h2>
					<UBadge color="blue" variant="soft">2025 Operating Budget</UBadge>
				</div>
			</template>

			<!-- Corrected Budget Summary -->
			<div class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6 p-4 bg-gray-50 rounded-lg">
				<div class="text-center">
					<p class="text-sm uppercase tracking-wide text-gray-600">MONTHLY BUDGET</p>
					<p class="text-2xl font-bold">${{ budget.totals.monthly.toLocaleString() }}</p>
				</div>
				<div class="text-center">
					<p class="text-sm uppercase tracking-wide text-gray-600">ACTUAL EXPENSES</p>
					<p class="text-2xl font-bold text-red-600">${{ totalWithdrawals.toLocaleString() }}</p>
				</div>
				<div class="text-center">
					<p class="text-sm uppercase tracking-wide text-gray-600">VARIANCE</p>
					<p class="text-2xl font-bold" :class="budgetVariance >= 0 ? 'text-red-600' : 'text-green-600'">
						{{ budgetVariance >= 0 ? '+' : '' }}${{ Math.abs(budgetVariance).toLocaleString() }}
					</p>
				</div>
				<div class="text-center">
					<p class="text-sm uppercase tracking-wide text-gray-600">% VARIANCE</p>
					<p class="text-2xl font-bold" :class="budgetVariancePercent >= 0 ? 'text-red-600' : 'text-green-600'">
						{{ budgetVariancePercent >= 0 ? '+' : '' }}{{ budgetVariancePercent }}%
					</p>
				</div>
			</div>

			<!-- Category Breakdown with Correct Budget Numbers -->
			<UTable :rows="varianceAnalysis" :columns="budgetColumns">
				<template #category-data="{row}">
					<span class="font-medium">{{ row.category }}</span>
				</template>
				<template #budgeted-data="{row}">
					<span class="text-gray-900">${{ row.budgeted.toLocaleString() }}</span>
				</template>
				<template #actual-data="{row}">
					<span class="font-semibold">${{ row.actual.toLocaleString() }}</span>
				</template>
				<template #variance-data="{row}">
					<span :class="row.variance >= 0 ? 'text-red-600' : 'text-green-600'" class="font-semibold">
						{{ row.variance >= 0 ? '+' : '' }}${{ Math.abs(row.variance).toLocaleString() }}
					</span>
				</template>
				<template #status-data="{row}">
					<UBadge :color="row.statusColor" variant="soft" size="xs">
						{{ row.status }}
					</UBadge>
				</template>
			</UTable>
		</UCard>

		<!-- Detailed Expense Categories -->
		<UCard class="mb-8">
			<template #header>
				<h2 class="text-xl font-semibold uppercase tracking-wide">EXPENSE BREAKDOWN</h2>
			</template>

			<UAccordion :items="expenseCategories" variant="soft" size="sm">
				<template #insurance="{item, index, open}">
					<div class="space-y-2">
						<div
							v-for="expense in insuranceExpenses"
							:key="expense.date"
							class="flex justify-between items-center p-2 bg-gray-50 rounded">
							<div>
								<span class="font-medium">{{ expense.vendor }}</span>
								<span class="text-sm text-gray-600 ml-2">{{ expense.date }}</span>
							</div>
							<span class="font-semibold">${{ expense.amount.toLocaleString() }}</span>
						</div>
						<div class="pt-2 border-t flex justify-between font-bold">
							<span>Total Insurance</span>
							<span>${{ insuranceTotal.toLocaleString() }}</span>
						</div>
					</div>
				</template>

				<template #professional="{item, index, open}">
					<div class="space-y-2">
						<div
							v-for="expense in professionalExpenses"
							:key="expense.date"
							class="flex justify-between items-center p-2 bg-gray-50 rounded">
							<div>
								<span class="font-medium">{{ expense.vendor }}</span>
								<span class="text-sm text-gray-600 ml-2">{{ expense.date }}</span>
							</div>
							<span class="font-semibold">${{ expense.amount.toLocaleString() }}</span>
						</div>
						<div class="pt-2 border-t flex justify-between font-bold">
							<span>Total Professional</span>
							<span>${{ professionalTotal.toLocaleString() }}</span>
						</div>
					</div>
				</template>

				<template #utilities="{item, index, open}">
					<div class="space-y-2">
						<div
							v-for="expense in utilityExpenses"
							:key="expense.date"
							class="flex justify-between items-center p-2 bg-gray-50 rounded">
							<div>
								<span class="font-medium">{{ expense.vendor }}</span>
								<span class="text-sm text-gray-600 ml-2">{{ expense.date }}</span>
							</div>
							<span class="font-semibold">${{ expense.amount.toLocaleString() }}</span>
						</div>
						<div class="pt-2 border-t flex justify-between font-bold">
							<span>Total Utilities</span>
							<span>${{ utilitiesTotal.toLocaleString() }}</span>
						</div>
					</div>
				</template>

				<template #maintenance="{item, index, open}">
					<div class="space-y-2">
						<div
							v-for="expense in maintenanceExpenses"
							:key="expense.date"
							class="flex justify-between items-center p-2 bg-gray-50 rounded">
							<div>
								<span class="font-medium">{{ expense.vendor }}</span>
								<span class="text-sm text-gray-600 ml-2">{{ expense.date }}</span>
							</div>
							<span class="font-semibold">${{ expense.amount.toLocaleString() }}</span>
						</div>
						<div class="pt-2 border-t flex justify-between font-bold">
							<span>Total Maintenance</span>
							<span>${{ maintenanceTotal.toLocaleString() }}</span>
						</div>
					</div>
				</template>

				<template #violations="{item, index, open}">
					<div class="space-y-2">
						<div
							v-for="violation in improperExpenses"
							:key="violation.date"
							class="flex justify-between items-center p-2 bg-red-50 rounded border border-red-200">
							<div>
								<span class="font-medium text-red-700">{{ violation.vendor }}</span>
								<span class="text-sm text-red-600 ml-2">{{ violation.date }}</span>
								<p class="text-xs text-red-600 mt-1">{{ violation.note || 'Fund segregation violation' }}</p>
							</div>
							<span class="font-semibold text-red-700">${{ violation.amount.toLocaleString() }}</span>
						</div>
						<div class="pt-2 border-t flex justify-between font-bold text-red-700">
							<span>Total Violations</span>
							<span>${{ totalViolationAmount.toLocaleString() }}</span>
						</div>
					</div>
				</template>
			</UAccordion>
		</UCard>

		<!-- Compliance Checklist -->
		<UCard class="mb-8">
			<template #header>
				<h2 class="text-xl font-semibold uppercase tracking-wide">FLORIDA COMPLIANCE CHECKLIST</h2>
			</template>

			<div class="space-y-4">
				<div v-for="item in certificationChecklist" :key="item.id" class="flex items-center space-x-3">
					<UCheckbox v-model="item.checked" :disabled="!item.compliant" :color="item.compliant ? 'green' : 'red'" />
					<label class="text-sm" :class="item.compliant ? 'text-gray-700' : 'text-red-700'">
						{{ item.label }}
					</label>
					<UIcon v-if="!item.compliant" name="i-heroicons-exclamation-triangle" class="text-red-500 w-4 h-4" />
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
					<p class="text-sm text-gray-600">Board Treasurer: _______________________</p>
					<p class="text-sm text-gray-600 mt-2">Date: _______________________</p>
					<p class="text-sm text-red-600 mt-2 font-medium">⚖️ Florida Chapter 720 Compliance Required</p>
				</div>
				<UButton color="primary" size="lg" icon="i-heroicons-document-arrow-down">EXPORT REPORT</UButton>
			</div>
		</UCard>
	</div>
</template>

<script setup>
import {ref, computed} from 'vue';

// Import composables
import {useReconciliationData} from '~/composables/useReconciliationData';
import {useBudgetData} from '~/composables/useBudgetData';
import {useFloridaCompliance} from '~/composables/useFloridaCompliance';

// Route params
const route = useRoute();
const monthParam = computed(() => {
	const param = route.params.month?.toUpperCase() || 'JUNE';
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

// Initialize composables
const {getOperatingData, getReserveData, getSpecialAssessmentData} = useReconciliationData();
const {budget2025: budget} = useBudgetData();
const {checkViolations} = useFloridaCompliance();

// Get account data
const operatingData = computed(() => getOperatingData(monthParam.value));
const reserveData = computed(() => getReserveData(monthParam.value));
const specialAssessmentData = computed(() => getSpecialAssessmentData(monthParam.value));

// Financial calculations
const operatingNetChange = computed(
	() => (operatingData.value?.endingBalance || 0) - (operatingData.value?.beginningBalance || 0)
);

const totalDeposits = computed(() => {
	const deposits = operatingData.value?.deposits || [];
	return deposits.reduce((sum, d) => sum + d.amount, 0);
});

const totalWithdrawals = computed(() => {
	const withdrawals = operatingData.value?.withdrawals || [];
	return withdrawals.reduce((sum, w) => sum + w.amount, 0);
});

// Violation tracking
const operatingViolations = computed(() => operatingData.value?.violations?.length || 0);
const specialViolations = computed(() => specialAssessmentData.value?.improperTransfers?.length || 0);

// Compliance violations
const complianceViolations = computed(() => {
	const rawViolations = [];

	// Violations from operating account - declared violations
	const opViolations = operatingData.value?.violations || [];
	opViolations.forEach((v) => {
		rawViolations.push({
			key: `${v.date}-${v.amount}`,
			date: v.date,
			amount: v.amount,
			accounts: v.accounts || '5129',
			description: v.description || 'Fund segregation violation',
			severity: v.severity || 'HIGH',
		});
	});

	// Violations from flagged withdrawals
	const flaggedWithdrawals = (operatingData.value?.withdrawals || []).filter((w) => w.violation === true);
	flaggedWithdrawals.forEach((v) => {
		rawViolations.push({
			key: `${v.date}-${v.amount}`,
			date: v.date,
			amount: v.amount,
			accounts: v.accounts || '5129',
			description: v.note || 'Fund segregation violation',
			severity: 'HIGH',
		});
	});

	// Special assessment violations
	const specialViolations = specialAssessmentData.value?.improperTransfers || [];
	specialViolations.forEach((v) => {
		rawViolations.push({
			key: `${v.date}-${v.amount}`,
			date: v.date,
			amount: v.amount,
			accounts: `${v.fromAccount} → ${v.toAccount}`,
			description: v.description || 'Improper transfer between accounts',
			severity: 'CRITICAL',
		});
	});

	// Deduplicate by `key` (date + amount)
	const deduped = Object.values(
		rawViolations.reduce((acc, item) => {
			acc[item.key] = item;
			return acc;
		}, {})
	);

	// Sort by amount descending
	return deduped.sort((a, b) => b.amount - a.amount);
});

const totalViolationAmount = computed(() => complianceViolations.value.reduce((sum, v) => sum + v.amount, 0));

// Budget calculations with CORRECT budget numbers
const budgetVariance = computed(() => totalWithdrawals.value - budget.totals.monthly);
const budgetVariancePercent = computed(() => Math.round((budgetVariance.value / budget.totals.monthly) * 100));

// Expense categorization
const expensesByCategory = computed(() => {
	const withdrawals = operatingData.value?.withdrawals || [];
	const categories = {Insurance: 0, Professional: 0, Utilities: 0, Maintenance: 0, Other: 0};

	withdrawals.forEach((w) => {
		if (w.violation) return; // Skip violations for budget analysis

		const category = w.category === 'Management' ? 'Professional' : w.category;
		if (categories.hasOwnProperty(category)) {
			categories[category] += w.amount;
		} else {
			categories.Other += w.amount;
		}
	});

	return categories;
});

// Variance analysis with CORRECT budget numbers
const varianceAnalysis = computed(() => [
	{
		category: 'Insurance',
		budgeted: budget.categories.Insurance.monthly,
		actual: expensesByCategory.value.Insurance,
		variance: expensesByCategory.value.Insurance - budget.categories.Insurance.monthly,
		status: expensesByCategory.value.Insurance > budget.categories.Insurance.monthly ? 'OVER BUDGET' : 'UNDER BUDGET',
		statusColor: expensesByCategory.value.Insurance > budget.categories.Insurance.monthly ? 'red' : 'green',
	},
	{
		category: 'Professional Fees',
		budgeted: budget.categories.Professional.monthly,
		actual: expensesByCategory.value.Professional,
		variance: expensesByCategory.value.Professional - budget.categories.Professional.monthly,
		status:
			expensesByCategory.value.Professional > budget.categories.Professional.monthly ? 'OVER BUDGET' : 'UNDER BUDGET',
		statusColor: expensesByCategory.value.Professional > budget.categories.Professional.monthly ? 'red' : 'green',
	},
	{
		category: 'Utilities',
		budgeted: budget.categories.Utilities.monthly,
		actual: expensesByCategory.value.Utilities,
		variance: expensesByCategory.value.Utilities - budget.categories.Utilities.monthly,
		status: expensesByCategory.value.Utilities > budget.categories.Utilities.monthly ? 'OVER BUDGET' : 'UNDER BUDGET',
		statusColor: expensesByCategory.value.Utilities > budget.categories.Utilities.monthly ? 'red' : 'green',
	},
	{
		category: 'Maintenance',
		budgeted: budget.categories.Maintenance.monthly,
		actual: expensesByCategory.value.Maintenance,
		variance: expensesByCategory.value.Maintenance - budget.categories.Maintenance.monthly,
		status:
			expensesByCategory.value.Maintenance > budget.categories.Maintenance.monthly ? 'OVER BUDGET' : 'UNDER BUDGET',
		statusColor: expensesByCategory.value.Maintenance > budget.categories.Maintenance.monthly ? 'red' : 'green',
	},
]);

const budgetColumns = [
	{key: 'category', label: 'CATEGORY'},
	{key: 'budgeted', label: 'BUDGET'},
	{key: 'actual', label: 'ACTUAL'},
	{key: 'variance', label: 'VARIANCE'},
	{key: 'status', label: 'STATUS'},
];

// Expense details by category
const insuranceExpenses = computed(() =>
	(operatingData.value?.withdrawals || []).filter((w) => w.category === 'Insurance' && !w.violation)
);
const professionalExpenses = computed(() =>
	(operatingData.value?.withdrawals || []).filter(
		(w) => ['Professional', 'Management'].includes(w.category) && !w.violation
	)
);
const utilityExpenses = computed(() =>
	(operatingData.value?.withdrawals || []).filter((w) => w.category === 'Utilities' && !w.violation)
);
const maintenanceExpenses = computed(() =>
	(operatingData.value?.withdrawals || []).filter((w) => w.category === 'Maintenance' && !w.violation)
);
const improperExpenses = computed(() => (operatingData.value?.withdrawals || []).filter((w) => w.violation === true));

// Totals
const insuranceTotal = computed(() => insuranceExpenses.value.reduce((sum, e) => sum + e.amount, 0));
const professionalTotal = computed(() => professionalExpenses.value.reduce((sum, e) => sum + e.amount, 0));
const utilitiesTotal = computed(() => utilityExpenses.value.reduce((sum, e) => sum + e.amount, 0));
const maintenanceTotal = computed(() => maintenanceExpenses.value.reduce((sum, e) => sum + e.amount, 0));

// Expense categories for accordion
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
		slot: 'violations',
		label: `IMPROPER EXPENSES ($${totalViolationAmount.value.toLocaleString()})`,
		icon: 'i-heroicons-exclamation-triangle',
		disabled: improperExpenses.value.length === 0,
	},
]);

// Compliance checklist
const certificationChecklist = ref([
	{
		id: 1,
		label: 'All income sources are legitimate operating revenue',
		checked: false,
		compliant: totalDeposits.value > 0 && improperExpenses.value.length === 0,
	},
	{
		id: 2,
		label: 'No money transferred between accounts 5129, 7011, 5872 without authorization',
		checked: false,
		compliant: complianceViolations.value.length === 0,
	},
	{
		id: 3,
		label: 'All expenses are proper operating costs',
		checked: false,
		compliant: improperExpenses.value.length === 0,
	},
	{
		id: 4,
		label: "Account balance sufficient for next month's expenses (>$25,000)",
		checked: false,
		compliant: (operatingData.value?.endingBalance || 0) >= 25000,
	},
	{
		id: 5,
		label: 'Reserve account (7011) meets minimum requirements',
		checked: false,
		compliant: (reserveData.value?.endingBalance || 0) >= 75000,
	},
	{
		id: 6,
		label: 'Florida Chapter 720 fund segregation compliance verified',
		checked: false,
		compliant: complianceViolations.value.length === 0,
	},
]);

const nextMonthFocus = [
	'Eliminate all fund mixing violations between accounts',
	'Monitor operating account minimum balance ($25,000)',
	'Plan special assessment for reserve funding compliance',
	'Implement dual approval for inter-account transfers',
	'Schedule emergency board meeting for violation remediation',
];
</script>
