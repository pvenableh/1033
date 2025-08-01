<template>
	<UCard>
		<template #header>
			<div class="flex items-center justify-between">
				<h3 class="text-lg font-semibold uppercase tracking-wide">{{ month }} SNAPSHOT</h3>
				<div class="flex gap-2">
					<UBadge v-if="complianceRisk.riskLevel === 'CRITICAL'" color="red" variant="solid" size="xs">
						FL VIOLATION
					</UBadge>
					<UButton size="xs" color="gray" variant="ghost" :to="`/financials/monthly-report/${month.toLowerCase()}`">
						VIEW DETAILS →
					</UButton>
				</div>
			</div>
		</template>

		<div class="space-y-4">
			<!-- Quick Metrics -->
			<div class="grid grid-cols-2 gap-4">
				<div class="text-center p-3 bg-gray-50 rounded-lg">
					<p class="text-2xl font-bold" :class="netFlow >= 0 ? 'text-green-600' : 'text-red-600'">
						{{ netFlow >= 0 ? '+' : '' }}${{ Math.abs(netFlow).toLocaleString() }}
					</p>
					<p class="text-xs uppercase tracking-wide text-gray-600 mt-1">NET CASH FLOW</p>
				</div>
				<div class="text-center p-3 bg-gray-50 rounded-lg">
					<p class="text-2xl font-bold" :class="endingBalance < 25000 ? 'text-red-600' : 'text-gray-900'">
						${{ endingBalance.toLocaleString() }}
					</p>
					<p class="text-xs uppercase tracking-wide text-gray-600 mt-1">ENDING BALANCE</p>
				</div>
			</div>

			<!-- Multi-Account Status -->
			<div class="grid grid-cols-3 gap-2 text-xs">
				<div
					class="text-center p-2 rounded"
					:class="endingBalance < 25000 ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'"
				>
					<div class="font-semibold">5129</div>
					<div>Operating</div>
				</div>
				<div class="text-center p-2 rounded bg-red-50 text-red-700">
					<div class="font-semibold">7011</div>
					<div>Reserves</div>
				</div>
				<div
					class="text-center p-2 rounded"
					:class="violations > 0 ? 'bg-orange-50 text-orange-700' : 'bg-blue-50 text-blue-700'"
				>
					<div class="font-semibold">5872</div>
					<div>40-Year</div>
				</div>
			</div>

			<!-- Income vs Expenses Bar -->
			<div class="space-y-2">
				<div class="flex justify-between text-sm">
					<span class="font-medium">Income</span>
					<span class="text-green-600">${{ income.toLocaleString() }}</span>
				</div>
				<div class="relative h-6 bg-gray-200 rounded-full overflow-hidden">
					<div
						class="absolute left-0 top-0 h-full bg-green-500 transition-all duration-500"
						:style="`width: ${(income / (income + expenses)) * 100}%`"
					/>
					<div
						class="absolute right-0 top-0 h-full bg-red-500 transition-all duration-500"
						:style="`width: ${(expenses / (income + expenses)) * 100}%`"
					/>
				</div>
				<div class="flex justify-between text-sm">
					<span class="font-medium">Expenses</span>
					<span class="text-red-600">${{ expenses.toLocaleString() }}</span>
				</div>
			</div>

			<!-- Critical Alerts -->
			<div v-if="alerts.length > 0" class="space-y-2">
				<div
					v-for="alert in alerts"
					:key="alert.id"
					class="flex items-center p-2 rounded-lg text-sm"
					:class="alert.type === 'critical' ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'"
				>
					<UIcon
						:name="alert.type === 'critical' ? 'i-heroicons-exclamation-circle' : 'i-heroicons-exclamation-triangle'"
						class="w-4 h-4 mr-2 flex-shrink-0"
					/>
					<span>{{ alert.message }}</span>
				</div>
			</div>

			<!-- Budget Performance (CORRECTED) -->
			<div class="pt-2 border-t">
				<div class="flex items-center justify-between mb-2">
					<span class="text-sm font-medium">Budget Performance</span>
					<span class="text-sm" :class="budgetVariance > 0 ? 'text-red-600' : 'text-green-600'">
						{{ budgetVariance > 0 ? '+' : '' }}{{ budgetVariance }}% vs Budget
					</span>
				</div>

				<!-- Correct Budget Categories with Real Numbers -->
				<div class="grid grid-cols-4 gap-1">
					<div v-for="category in budgetCategories" :key="category.name" class="relative group">
						<div class="h-8 rounded" :class="category.overBudget ? 'bg-red-200' : 'bg-green-200'" />
						<div
							class="absolute bottom-0 left-0 right-0 rounded transition-all duration-300"
							:class="category.overBudget ? 'bg-red-500' : 'bg-green-500'"
							:style="`height: ${Math.min(category.percent, 100)}%`"
						/>
						<UTooltip
							:text="`${category.name}: ${category.percent}% of budget ($${category.actual}/$${category.budget})`"
						>
							<div class="absolute inset-0" />
						</UTooltip>
					</div>
				</div>
				<div class="flex justify-between mt-1 text-xs text-gray-500">
					<span>INS</span>
					<span>PRO</span>
					<span>UTL</span>
					<span>MNT</span>
				</div>
			</div>

			<!-- Florida Compliance Status -->
			<div class="pt-2 border-t">
				<div class="flex items-center justify-between">
					<span class="text-sm font-medium">FL Compliance</span>
					<UBadge
						:color="
							complianceRisk.riskLevel === 'CRITICAL' ? 'red' : complianceRisk.riskLevel === 'HIGH' ? 'orange' : 'green'
						"
						variant="soft"
						size="xs"
					>
						{{ complianceRisk.riskLevel }}
					</UBadge>
				</div>

				<div
					v-if="complianceRisk.riskLevel !== 'LOW'"
					class="mt-2 p-2 rounded text-xs"
					:class="complianceRisk.riskLevel === 'CRITICAL' ? 'bg-red-50 text-red-700' : 'bg-orange-50 text-orange-700'"
				>
					<div class="flex items-center">
						<UIcon name="i-heroicons-exclamation-triangle" class="w-3 h-3 mr-1" />
						<span v-if="complianceRisk.personalLiability">Board liability risk</span>
						<span v-else>Compliance violations</span>
					</div>
				</div>
			</div>
		</div>
	</UCard>
</template>

<script lang="ts" setup>
import { useBudgetData } from '../../composables/useBudgetData';
import { useFloridaCompliance } from '../../composables/useFloridaCompliance';

interface Props {
	month: string;
	income: number;
	expenses: number;
	endingBalance: number;
	beginningBalance: number;
	violations?: number;
	insuranceExpense?: number;
	professionalExpense?: number;
	utilityExpense?: number;
	maintenanceExpense?: number;
	reserveBalance?: number;
	specialAssessmentBalance?: number;
}

const props = withDefaults(defineProps<Props>(), {
	violations: 0,
	insuranceExpense: 0,
	professionalExpense: 0,
	utilityExpense: 0,
	maintenanceExpense: 0,
	reserveBalance: 0,
	specialAssessmentBalance: 0,
});

// Initialize composables
const { budget2025: budget } = useBudgetData();
const { calculateLiabilityRisk } = useFloridaCompliance();

// Computed values
const netFlow = computed(() => props.income - props.expenses);

// CORRECTED budget variance calculation
const budgetVariance = computed(() => {
	const budgetTotal = budget.totals.monthly; // Correct total: 14779.09
	const actualTotal = props.expenses;
	return Math.round(((actualTotal - budgetTotal) / budgetTotal) * 100);
});

// Compliance risk assessment
const complianceRisk = computed(() => {
	const violations = [
		...(props.violations > 0
			? [
					{
						type: 'FUND_MIXING',
						severity: 'CRITICAL',
						boardLiability: true,
						criminalRisk: false,
					},
				]
			: []),
		...(props.endingBalance < 25000
			? [
					{
						type: 'OPERATING_INSUFFICIENT',
						severity: 'HIGH',
						boardLiability: true,
						criminalRisk: false,
					},
				]
			: []),
		...(props.reserveBalance < 75000
			? [
					{
						type: 'RESERVE_UNDERFUNDING',
						severity: 'CRITICAL',
						boardLiability: true,
						criminalRisk: false,
					},
				]
			: []),
	];

	return calculateLiabilityRisk(violations);
});

// Alerts based on conditions
const alerts = computed(() => {
	const alertList = [];

	if (props.endingBalance < 25000) {
		alertList.push({
			id: 1,
			type: 'critical',
			message: 'Balance below $25k minimum',
		});
	}

	if (props.violations > 0) {
		alertList.push({
			id: 2,
			type: 'critical',
			message: `${props.violations} fund mixing violations`,
		});
	}

	if (props.reserveBalance < 75000) {
		alertList.push({
			id: 3,
			type: 'critical',
			message: `Reserves $${((75000 - props.reserveBalance) / 1000).toFixed(0)}k short`,
		});
	}

	if (props.expenses > budget.totals.monthly * 1.2) {
		alertList.push({
			id: 4,
			type: 'warning',
			message: 'High expense month - monitor cash flow',
		});
	}

	if (complianceRisk.value.personalLiability) {
		alertList.push({
			id: 5,
			type: 'critical',
			message: 'Board liability risk under FL law',
		});
	}

	return alertList;
});

// Budget categories with CORRECTED budget numbers
const budgetCategories = computed(() => [
	{
		name: 'Insurance',
		actual: props.insuranceExpense,
		budget: budget.categories.Insurance.monthly, // Correct: 7131.59
		percent:
			props.insuranceExpense > 0 ? Math.round((props.insuranceExpense / budget.categories.Insurance.monthly) * 100) : 0,
		overBudget: props.insuranceExpense > budget.categories.Insurance.monthly,
	},
	{
		name: 'Professional',
		actual: props.professionalExpense,
		budget: budget.categories.Professional.monthly, // Correct: 1703.67
		percent:
			props.professionalExpense > 0
				? Math.round((props.professionalExpense / budget.categories.Professional.monthly) * 100)
				: 0,
		overBudget: props.professionalExpense > budget.categories.Professional.monthly,
	},
	{
		name: 'Utilities',
		actual: props.utilityExpense,
		budget: budget.categories.Utilities.monthly, // Correct: 2586.00
		percent:
			props.utilityExpense > 0 ? Math.round((props.utilityExpense / budget.categories.Utilities.monthly) * 100) : 0,
		overBudget: props.utilityExpense > budget.categories.Utilities.monthly,
	},
	{
		name: 'Maintenance',
		actual: props.maintenanceExpense,
		budget: budget.categories.Maintenance.monthly, // Correct: 2770.00
		percent:
			props.maintenanceExpense > 0
				? Math.round((props.maintenanceExpense / budget.categories.Maintenance.monthly) * 100)
				: 0,
		overBudget: props.maintenanceExpense > budget.categories.Maintenance.monthly,
	},
]);
</script>
