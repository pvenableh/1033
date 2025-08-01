<template>
	<UCard>
		<template #header>
			<div class="flex items-center justify-between">
				<h3 class="text-lg font-semibold uppercase tracking-wide">{{ month }} SNAPSHOT</h3>
				<UButton size="xs" color="gray" variant="ghost" :to="`/financials/monthly-report/${month.toLowerCase()}`">
					VIEW DETAILS →
				</UButton>
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

			<!-- Key Alerts -->
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

			<!-- Budget Performance -->
			<div class="pt-2 border-t">
				<div class="flex items-center justify-between mb-2">
					<span class="text-sm font-medium">Budget Performance</span>
					<span class="text-sm" :class="budgetVariance > 0 ? 'text-red-600' : 'text-green-600'">
						{{ budgetVariance > 0 ? '+' : '' }}{{ budgetVariance }}% vs Budget
					</span>
				</div>
				<div class="grid grid-cols-4 gap-1">
					<div v-for="category in budgetCategories" :key="category.name" class="relative group">
						<div class="h-8 rounded" :class="category.overBudget ? 'bg-red-200' : 'bg-green-200'" />
						<div
							class="absolute bottom-0 left-0 right-0 rounded transition-all duration-300"
							:class="category.overBudget ? 'bg-red-500' : 'bg-green-500'"
							:style="`height: ${Math.min(category.percent, 100)}%`"
						/>
						<UTooltip :text="`${category.name}: ${category.percent}% of budget`">
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
		</div>
	</UCard>
</template>

<script lang="ts" setup>
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
}

const props = withDefaults(defineProps<Props>(), {
	violations: 0,
	insuranceExpense: 0,
	professionalExpense: 0,
	utilityExpense: 0,
	maintenanceExpense: 0,
});

// Computed values
const netFlow = computed(() => props.income - props.expenses);

const budgetVariance = computed(() => {
	const budgetTotal = 17165;
	const actualTotal = props.expenses;
	return Math.round(((actualTotal - budgetTotal) / budgetTotal) * 100);
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

	if (props.expenses > 20000) {
		alertList.push({
			id: 3,
			type: 'warning',
			message: 'High expense month - monitor cash flow',
		});
	}

	return alertList;
});

// Budget categories for mini chart
const budgetCategories = computed(() => [
	{
		name: 'Insurance',
		actual: props.insuranceExpense,
		budget: 9659,
		percent: Math.round((props.insuranceExpense / 9659) * 100),
		overBudget: props.insuranceExpense > 9659,
	},
	{
		name: 'Professional',
		actual: props.professionalExpense,
		budget: 700,
		percent: Math.round((props.professionalExpense / 700) * 100),
		overBudget: props.professionalExpense > 700,
	},
	{
		name: 'Utilities',
		actual: props.utilityExpense,
		budget: 2339,
		percent: Math.round((props.utilityExpense / 2339) * 100),
		overBudget: props.utilityExpense > 2339,
	},
	{
		name: 'Maintenance',
		actual: props.maintenanceExpense,
		budget: 4379,
		percent: Math.round((props.maintenanceExpense / 4379) * 100),
		overBudget: props.maintenanceExpense > 4379,
	},
]);
</script>
