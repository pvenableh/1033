<template>
	<div class="container mx-auto p-6">
		<!-- Header -->
		<div class="mb-6">
			<h1 class="text-xl font-bold uppercase tracking-wider mb-2 text-center">{{ year }} OPERATING BUDGET</h1>
		</div>

		<!-- Loading -->
		<div v-if="loading" class="flex justify-center items-center py-20">
			<div class="text-center">
				<div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-400 mx-auto mb-4"></div>
				<p class="text-gray-600">Loading budget data...</p>
			</div>
		</div>

		<template v-else>
			<!-- Budget Overview Cards -->
			<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
				<!-- Revenue Card -->
				<UCard class="!rounded-[4px]">
					<template #header>
						<div class="flex items-center justify-between">
							<h3 class="text-lg font-semibold uppercase tracking-wide">ANNUAL REVENUE</h3>
							<UIcon name="i-heroicons-arrow-trending-up" class="w-6 h-6 text-green-600" />
						</div>
					</template>
					<div class="space-y-4">
						<div class="text-center">
							<p class="text-3xl font-bold text-green-700">{{ formatCurrency(budgetTotals.yearlyRevenue) }}</p>
							<p class="text-sm text-gray-600 mt-1">{{ formatCurrency(budgetTotals.monthlyRevenue) }}/month</p>
						</div>
						<div v-if="budgetTotals.unitCount && budgetTotals.monthlyAssessment" class="space-y-2 text-sm">
							<div class="flex justify-between">
								<span class="text-gray-600">Assessments (${{ budgetTotals.monthlyAssessment }} x {{ budgetTotals.unitCount }})</span>
								<span class="font-semibold">{{ formatCurrency(budgetTotals.monthlyAssessment * budgetTotals.unitCount * 12) }}</span>
							</div>
						</div>
					</div>
				</UCard>

				<!-- Expenses Card -->
				<UCard class="!rounded-[4px]">
					<template #header>
						<div class="flex items-center justify-between">
							<h3 class="text-lg font-semibold uppercase tracking-wide">ANNUAL EXPENSES</h3>
							<UIcon name="i-heroicons-arrow-trending-down" class="w-6 h-6 text-red-600" />
						</div>
					</template>
					<div class="space-y-4">
						<div class="text-center">
							<p class="text-3xl font-bold text-red-700">{{ formatCurrency(budgetTotals.yearlyExpenses) }}</p>
							<p class="text-sm text-gray-600 mt-1">{{ formatCurrency(budgetTotals.monthlyExpenses) }}/month</p>
						</div>
						<div class="space-y-2 text-sm">
							<div v-for="(cat, catId) in topCategories" :key="catId" class="flex justify-between">
								<span class="text-gray-600">{{ cat.category_name }}</span>
								<span class="font-semibold">{{ formatCurrency(cat.yearlyTotal) }}</span>
							</div>
						</div>
					</div>
				</UCard>

				<!-- Net Operating Card -->
				<UCard
					class="!rounded-[4px]"
					:class="budgetTotals.yearlyNet >= 0 ? 'border-2 border-green-300' : 'border-2 border-red-300'">
					<template #header>
						<div class="flex items-center justify-between">
							<h3 class="text-lg font-semibold uppercase tracking-wide">NET OPERATING</h3>
							<UIcon
								:name="budgetTotals.yearlyNet >= 0 ? 'i-heroicons-check-circle' : 'i-heroicons-exclamation-triangle'"
								:class="budgetTotals.yearlyNet >= 0 ? 'w-6 h-6 text-green-600' : 'w-6 h-6 text-yellow-600'" />
						</div>
					</template>
					<div class="space-y-4">
						<div class="text-center">
							<p :class="['text-3xl font-bold', budgetTotals.yearlyNet >= 0 ? 'text-green-700' : 'text-red-700']">
								{{ formatCurrency(budgetTotals.yearlyNet) }}
							</p>
							<p class="text-sm text-gray-600 mt-1">{{ formatCurrency(budgetTotals.monthlyNet) }}/month</p>
						</div>
						<div class="p-3 bg-blue-50 rounded text-center">
							<p class="text-xs uppercase tracking-wide text-blue-700 font-semibold">
								{{ budgetTotals.yearlyNet >= 0 ? 'BREAK-EVEN BUDGET' : 'DEFICIT BUDGET' }}
							</p>
						</div>
					</div>
				</UCard>
			</div>

			<!-- Main Content Tabs -->
			<Tabs v-model="activeTab" :items="tabs" class="space-y-6">
				<!-- Expenses Breakdown Tab -->
				<template #expenses>
					<div class="space-y-6">
						<div v-for="(catData, catId) in itemsByCategory" :key="catId">
							<UCard class="!rounded-[4px]">
								<template #header>
									<div class="flex justify-between items-center">
										<h3 class="text-lg font-semibold uppercase tracking-wide">{{ catData.category_name }}</h3>
										<div class="text-right">
											<p class="text-xl font-bold">{{ formatCurrency(categoryYearly(catData)) }}</p>
											<p class="text-sm text-gray-600">{{ formatCurrency(categoryMonthly(catData)) }}/month</p>
										</div>
									</div>
								</template>
								<div v-if="catData.items && catData.items.length > 0" class="overflow-x-auto">
									<table class="w-full text-sm">
										<thead>
											<tr class="border-b-2 border-gray-300">
												<th class="text-left py-3 px-4 uppercase tracking-wider text-xs font-semibold text-gray-600">Item</th>
												<th class="text-left py-3 px-4 uppercase tracking-wider text-xs font-semibold text-gray-600">Vendor</th>
												<th class="text-right py-3 px-4 uppercase tracking-wider text-xs font-semibold text-gray-600">Monthly</th>
												<th class="text-right py-3 px-4 uppercase tracking-wider text-xs font-semibold text-gray-600">Annual</th>
											</tr>
										</thead>
										<tbody>
											<tr
												v-for="item in catData.items"
												:key="item.id"
												class="border-b border-gray-200 hover:bg-gray-50">
												<td class="py-3 px-4 font-medium">{{ item.description || '—' }}</td>
												<td class="py-3 px-4 text-gray-600">{{ item.vendor_patterns?.[0] || (typeof item.vendor_id === 'object' ? item.vendor_id?.name : '') || '—' }}</td>
												<td class="py-3 px-4 text-right font-semibold">{{ formatCurrency(item.monthly_budget) }}</td>
												<td class="py-3 px-4 text-right font-semibold">{{ formatCurrency(item.yearly_budget) }}</td>
											</tr>
										</tbody>
										<tfoot>
											<tr class="bg-gray-50 font-bold">
												<td colspan="2" class="py-3 px-4 uppercase tracking-wide text-sm">Subtotal</td>
												<td class="py-3 px-4 text-right">{{ formatCurrency(categoryMonthly(catData)) }}</td>
												<td class="py-3 px-4 text-right">{{ formatCurrency(categoryYearly(catData)) }}</td>
											</tr>
										</tfoot>
									</table>
								</div>
								<div v-else class="py-4 text-center text-gray-400 text-sm">No line items defined for this category</div>
							</UCard>
						</div>
					</div>
				</template>

				<!-- Summary Tab -->
				<template #summary>
					<UCard class="!rounded-[4px]">
						<template #header>
							<h3 class="text-lg font-semibold uppercase tracking-wide">BUDGET SUMMARY</h3>
						</template>
						<div class="space-y-6">
							<div>
								<h4 class="font-bold text-lg mb-4 uppercase tracking-wide">Annual Budget</h4>
								<div class="overflow-x-auto">
									<table class="w-full">
										<thead>
											<tr class="border-b-2 border-gray-300">
												<th class="text-left py-3 px-4 uppercase tracking-wider text-xs font-semibold text-gray-600">Category</th>
												<th class="text-right py-3 px-4 uppercase tracking-wider text-xs font-semibold text-gray-600">Amount</th>
												<th class="text-right py-3 px-4 uppercase tracking-wider text-xs font-semibold text-gray-600">% of Revenue</th>
											</tr>
										</thead>
										<tbody>
											<tr class="border-b border-gray-200 bg-green-50">
												<td class="py-3 px-4 font-bold">TOTAL REVENUE</td>
												<td class="py-3 px-4 text-right font-bold text-green-700">
													{{ formatCurrency(budgetTotals.yearlyRevenue) }}
												</td>
												<td class="py-3 px-4 text-right font-bold">100%</td>
											</tr>
											<tr class="border-b-2 border-gray-400 bg-red-50">
												<td class="py-3 px-4 font-bold">TOTAL EXPENSES</td>
												<td class="py-3 px-4 text-right font-bold text-red-700">
													{{ formatCurrency(budgetTotals.yearlyExpenses) }}
												</td>
												<td class="py-3 px-4 text-right font-bold">
													{{ budgetTotals.yearlyRevenue > 0 ? ((budgetTotals.yearlyExpenses / budgetTotals.yearlyRevenue) * 100).toFixed(1) : '0.0' }}%
												</td>
											</tr>
											<tr v-for="(catData, catId) in itemsByCategory" :key="catId" class="border-b border-gray-200">
												<td class="py-3 px-4 pl-8">{{ catData.category_name }}</td>
												<td class="py-3 px-4 text-right">{{ formatCurrency(categoryYearly(catData)) }}</td>
												<td class="py-3 px-4 text-right">
													{{ budgetTotals.yearlyRevenue > 0 ? ((categoryYearly(catData) / budgetTotals.yearlyRevenue) * 100).toFixed(1) : '0.0' }}%
												</td>
											</tr>
											<tr :class="['bg-indigo-50 border-t-2 border-indigo-300']">
												<td class="py-3 px-4 font-bold uppercase tracking-wide">NET OPERATING INCOME</td>
												<td
													:class="[
														'py-3 px-4 text-right font-bold',
														budgetTotals.yearlyNet >= 0 ? 'text-green-700' : 'text-red-700',
													]">
													{{ formatCurrency(budgetTotals.yearlyNet) }}
												</td>
												<td
													:class="[
														'py-3 px-4 text-right font-bold',
														budgetTotals.yearlyNet >= 0 ? 'text-green-700' : 'text-red-700',
													]">
													{{ budgetTotals.yearlyRevenue > 0 ? ((budgetTotals.yearlyNet / budgetTotals.yearlyRevenue) * 100).toFixed(2) : '0.00' }}%
												</td>
											</tr>
										</tbody>
									</table>
								</div>
							</div>

							<!-- Account Information -->
							<div class="bg-blue-50 p-6 rounded-lg">
								<h4 class="font-bold text-lg mb-4 uppercase tracking-wide">Account Structure</h4>
								<div class="space-y-2 text-sm">
									<p>
										<strong>Operating Account (5129):</strong>
										Day-to-day expenses and revenue
									</p>
									<p>
										<strong>Reserve Account (7011):</strong>
										General reserves for future needs
									</p>
									<p>
										<strong>Special Assessment Account (5872):</strong>
										40-Year Recertification Project only
									</p>
								</div>
							</div>
						</div>
					</UCard>
				</template>
			</Tabs>

			<!-- Footer Notes -->
			<div class="mt-8 text-center text-sm text-gray-500">
				<p class="mb-2">{{ year }} Operating Budget | Lenox Plaza Association, Inc.</p>
				<p>Miami Beach, Florida | {{ budgetTotals.unitCount }} Units</p>
			</div>
		</template>
	</div>
</template>

<script setup lang="ts">
import { useBudgetManagement } from '~/composables/useBudgetManagement';

const props = defineProps<{
	year: number;
}>();

const {
	selectedYear,
	loading,
	budgetTotals,
	itemsByCategory,
	fetchBudgetData,
	safeParseFloat,
} = useBudgetManagement();

// Sync the year prop to the composable's selectedYear
watch(
	() => props.year,
	(newYear) => {
		selectedYear.value = newYear;
	},
	{ immediate: true }
);

// Fetch data on mount
onMounted(async () => {
	await fetchBudgetData();
});

const activeTab = ref(0);

const tabs = [
	{
		slot: 'expenses',
		label: 'EXPENSE BREAKDOWN',
		icon: 'i-heroicons-clipboard-document-list',
	},
	{
		slot: 'summary',
		label: 'BUDGET SUMMARY',
		icon: 'i-heroicons-document-chart-bar',
	},
];

// Top 3 categories by yearly amount for the overview card
const topCategories = computed(() => {
	const cats = Object.values(itemsByCategory.value || {}).map((cat: any) => ({
		...cat,
		yearlyTotal: (cat.items || []).reduce((sum: number, item: any) => sum + safeParseFloat(item.yearly_budget), 0),
	}));
	return cats.sort((a: any, b: any) => b.yearlyTotal - a.yearlyTotal).slice(0, 3);
});

const categoryYearly = (catData: any) => {
	return (catData.items || []).reduce((sum: number, item: any) => sum + safeParseFloat(item.yearly_budget), 0);
};

const categoryMonthly = (catData: any) => {
	return (catData.items || []).reduce((sum: number, item: any) => sum + safeParseFloat(item.monthly_budget), 0);
};

const formatCurrency = (amount: number) => {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(amount || 0);
};
</script>
