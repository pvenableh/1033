<template>
	<div class="container mx-auto p-6 space-y-6">
		<!-- Header -->
		<div class="bg-card rounded-lg shadow-sm border p-6">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-3xl font-bold uppercase tracking-wider mb-2 dark:text-white">
						OPERATING BUDGET
					</h1>
					<p class="text-gray-600 dark:text-gray-400">
						Lenox Plaza Association, Inc. - Miami Beach, Florida
					</p>
				</div>
				<div class="flex items-center gap-4">
					<div class="flex items-center gap-2">
						<UToggle v-model="showMonthly" size="sm" />
						<span class="text-sm font-medium text-gray-600 dark:text-gray-400">Monthly</span>
					</div>
					<USelectMenu
						v-model="selectedYear"
						:options="yearOptions"
						value-attribute="value"
						option-attribute="label"
						size="lg"
						class="w-32"
						placeholder="Select Year" />
				</div>
			</div>
		</div>

		<!-- Loading State -->
		<div v-if="loading" class="flex justify-center items-center py-16">
			<UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-gray-400" />
			<span class="ml-3 text-gray-500">Loading budget data...</span>
		</div>

		<!-- No Data State -->
		<div v-else-if="!budget" class="text-center py-16">
			<UIcon name="i-heroicons-document-magnifying-glass" class="w-16 h-16 text-gray-300 mx-auto mb-4" />
			<h3 class="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">No Budget Data Available</h3>
			<p class="text-gray-500 dark:text-gray-400">No budget has been created for FY {{ selectedYear }}.</p>
		</div>

		<template v-else>
			<!-- Monthly Cost Summary Banner -->
			<div v-if="showMonthly" class="bg-indigo-50 dark:bg-indigo-950/30 rounded-lg border border-indigo-200 dark:border-indigo-800 p-6">
				<h3 class="text-sm font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300 mb-4">
					Monthly Cost Breakdown
				</h3>
				<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
					<div
						v-for="(category, key) in budget.categories"
						:key="key"
						class="bg-white dark:bg-gray-800 rounded-lg p-3 text-center shadow-sm">
						<p class="text-xs text-gray-500 uppercase tracking-wide">{{ key }}</p>
						<p class="text-lg font-bold text-gray-900 dark:text-white">{{ formatCurrency(category.monthly) }}</p>
					</div>
				</div>
				<div class="mt-4 pt-4 border-t border-indigo-200 dark:border-indigo-700 flex flex-wrap justify-between items-center gap-4">
					<div>
						<span class="text-sm font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">Total Monthly Expenses</span>
						<span class="ml-3 text-xl font-bold text-red-700">{{ formatCurrency(budget.totals.monthly) }}</span>
					</div>
					<div>
						<span class="text-sm font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">Monthly Revenue</span>
						<span class="ml-3 text-xl font-bold text-green-700">{{ formatCurrency(budget.revenue.total.monthly) }}</span>
					</div>
					<div>
						<span class="text-sm font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">Monthly Net</span>
						<span :class="['ml-3 text-xl font-bold', budget.netOperating.monthly >= 0 ? 'text-green-700' : 'text-red-700']">
							{{ formatCurrency(budget.netOperating.monthly) }}
						</span>
					</div>
				</div>
			</div>

			<!-- Budget Overview Cards -->
			<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
				<!-- Revenue Card -->
				<UCard class="!rounded-[4px]">
					<template #header>
						<div class="flex items-center justify-between">
							<h3 class="text-lg font-semibold uppercase tracking-wide">{{ showMonthly ? 'MONTHLY REVENUE' : 'ANNUAL REVENUE' }}</h3>
							<UIcon name="i-heroicons-arrow-trending-up" class="w-6 h-6 text-green-600" />
						</div>
					</template>
					<div class="space-y-4">
						<div class="text-center">
							<p class="text-3xl font-bold text-green-700">
								{{ showMonthly ? formatCurrency(budget.revenue.total.monthly) : formatCurrency(budget.revenue.total.yearly) }}
							</p>
							<p class="text-sm text-gray-600 mt-1">
								{{ showMonthly ? formatCurrency(budget.revenue.total.yearly) + '/year' : formatCurrency(budget.revenue.total.monthly) + '/month' }}
							</p>
						</div>
						<div class="space-y-2 text-sm">
							<div class="flex justify-between">
								<span class="text-gray-600">Assessments (${{ budget.monthlyAssessment }} &times; {{ budget.unitCount }})</span>
								<span class="font-semibold">
									{{ showMonthly ? formatCurrency(budget.revenue.assessmentIncome.monthly) : formatCurrency(budget.revenue.assessmentIncome.yearly) }}
								</span>
							</div>
							<div class="flex justify-between">
								<span class="text-gray-600">Laundry Income</span>
								<span class="font-semibold">
									{{ showMonthly ? formatCurrency(budget.revenue.laundryIncome.monthly) : formatCurrency(budget.revenue.laundryIncome.yearly) }}
								</span>
							</div>
							<div class="flex justify-between">
								<span class="text-gray-600">Other Income</span>
								<span class="font-semibold">
									{{ showMonthly ? formatCurrency(budget.revenue.otherIncome.monthly) : formatCurrency(budget.revenue.otherIncome.yearly) }}
								</span>
							</div>
						</div>
					</div>
				</UCard>

				<!-- Expenses Card -->
				<UCard class="!rounded-[4px]">
					<template #header>
						<div class="flex items-center justify-between">
							<h3 class="text-lg font-semibold uppercase tracking-wide">{{ showMonthly ? 'MONTHLY EXPENSES' : 'ANNUAL EXPENSES' }}</h3>
							<UIcon name="i-heroicons-arrow-trending-down" class="w-6 h-6 text-red-600" />
						</div>
					</template>
					<div class="space-y-4">
						<div class="text-center">
							<p class="text-3xl font-bold text-red-700">
								{{ showMonthly ? formatCurrency(budget.totals.monthly) : formatCurrency(budget.totals.yearly) }}
							</p>
							<p class="text-sm text-gray-600 mt-1">
								{{ showMonthly ? formatCurrency(budget.totals.yearly) + '/year' : formatCurrency(budget.totals.monthly) + '/month' }}
							</p>
						</div>
						<div class="space-y-2 text-sm">
							<div v-for="cat in topExpenseCategories" :key="cat.name" class="flex justify-between">
								<span class="text-gray-600">{{ cat.name }}</span>
								<span class="font-semibold">
									{{ showMonthly ? formatCurrency(cat.monthly) : formatCurrency(cat.yearly) }}
								</span>
							</div>
						</div>
					</div>
				</UCard>

				<!-- Net Operating Card -->
				<UCard
					class="!rounded-[4px]"
					:class="budget.netOperating.yearly >= 0 ? 'border-2 border-green-300' : 'border-2 border-red-300'">
					<template #header>
						<div class="flex items-center justify-between">
							<h3 class="text-lg font-semibold uppercase tracking-wide">NET OPERATING</h3>
							<UIcon
								:name="budget.netOperating.yearly >= 0 ? 'i-heroicons-check-circle' : 'i-heroicons-exclamation-triangle'"
								:class="budget.netOperating.yearly >= 0 ? 'w-6 h-6 text-green-600' : 'w-6 h-6 text-yellow-600'" />
						</div>
					</template>
					<div class="space-y-4">
						<div class="text-center">
							<p :class="['text-3xl font-bold', budget.netOperating.yearly >= 0 ? 'text-green-700' : 'text-red-700']">
								{{ showMonthly ? formatCurrency(budget.netOperating.monthly) : formatCurrency(budget.netOperating.yearly) }}
							</p>
							<p class="text-sm text-gray-600 mt-1">
								{{ showMonthly ? formatCurrency(budget.netOperating.yearly) + '/year' : formatCurrency(budget.netOperating.monthly) + '/month' }}
							</p>
						</div>
						<div class="p-3 bg-blue-50 rounded text-center">
							<p class="text-xs uppercase tracking-wide text-blue-700 font-semibold">
								{{ budget.netOperating.yearly >= 0 ? 'BREAK-EVEN BUDGET' : 'DEFICIT BUDGET' }}
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
						<!-- Expense Category Cards -->
						<div v-for="(category, key) in budget.categories" :key="key">
							<UCard class="!rounded-[4px]">
								<template #header>
									<div class="flex justify-between items-center">
										<h3 class="text-lg font-semibold uppercase tracking-wide">{{ key }}</h3>
										<div class="text-right">
											<p class="text-xl font-bold">
												{{ showMonthly ? formatCurrency(category.monthly) : formatCurrency(category.yearly) }}
											</p>
											<p class="text-sm text-gray-600">
												{{ showMonthly ? formatCurrency(category.yearly) + '/year' : formatCurrency(category.monthly) + '/month' }}
											</p>
										</div>
									</div>
								</template>
								<div class="overflow-x-auto">
									<table class="w-full text-sm">
										<thead>
											<tr class="border-b-2 border-gray-300">
												<th class="text-left py-3 px-4 uppercase tracking-wider text-xs font-semibold text-gray-600">
													Item
												</th>
												<th class="text-left py-3 px-4 uppercase tracking-wider text-xs font-semibold text-gray-600">
													Vendor
												</th>
												<th class="text-right py-3 px-4 uppercase tracking-wider text-xs font-semibold text-gray-600">
													Monthly
												</th>
												<th class="text-right py-3 px-4 uppercase tracking-wider text-xs font-semibold text-gray-600">
													Annual
												</th>
											</tr>
										</thead>
										<tbody>
											<tr
												v-for="(item, idx) in category.items"
												:key="idx"
												class="border-b border-gray-200 hover:bg-gray-50">
												<td class="py-3 px-4 font-medium">{{ item.name }}</td>
												<td class="py-3 px-4 text-gray-600">{{ item.vendor }}</td>
												<td :class="['py-3 px-4 text-right', showMonthly ? 'font-bold text-gray-900 dark:text-white' : 'font-semibold']">
													{{ formatCurrency(item.monthly) }}
												</td>
												<td :class="['py-3 px-4 text-right', !showMonthly ? 'font-bold text-gray-900 dark:text-white' : 'font-semibold text-gray-500']">
													{{ formatCurrency(item.yearly) }}
												</td>
											</tr>
										</tbody>
										<tfoot>
											<tr class="bg-gray-50 font-bold">
												<td colspan="2" class="py-3 px-4 uppercase tracking-wide text-sm">Subtotal</td>
												<td :class="['py-3 px-4 text-right', showMonthly ? 'text-gray-900 dark:text-white' : '']">
													{{ formatCurrency(category.monthly) }}
												</td>
												<td :class="['py-3 px-4 text-right', !showMonthly ? 'text-gray-900 dark:text-white' : 'text-gray-500']">
													{{ formatCurrency(category.yearly) }}
												</td>
											</tr>
										</tfoot>
									</table>
								</div>
							</UCard>
						</div>
					</div>
				</template>

				<!-- Revenue Breakdown Tab -->
				<template #revenue>
					<UCard class="!rounded-[4px]">
						<template #header>
							<h3 class="text-lg font-semibold uppercase tracking-wide">REVENUE SOURCES</h3>
						</template>
						<div class="space-y-6">
							<!-- Assessment Income -->
							<div class="border-b pb-6">
								<div class="flex justify-between items-start mb-4">
									<div>
										<h4 class="font-bold text-lg">Assessment Income</h4>
										<p class="text-sm text-gray-600">{{ budget.revenue.assessmentIncome.description }}</p>
									</div>
									<div class="text-right">
										<p class="text-2xl font-bold text-green-700">
											{{ showMonthly ? formatCurrency(budget.revenue.assessmentIncome.monthly) : formatCurrency(budget.revenue.assessmentIncome.yearly) }}
										</p>
										<p class="text-sm text-gray-600">
											{{ showMonthly ? formatCurrency(budget.revenue.assessmentIncome.yearly) + '/year' : formatCurrency(budget.revenue.assessmentIncome.monthly) + '/month' }}
										</p>
									</div>
								</div>
								<div class="bg-green-50 p-4 rounded">
									<p class="text-sm">
										<strong>Per Unit:</strong>
										${{ budget.monthlyAssessment }}/month &times; {{ budget.unitCount }} units
									</p>
									<p class="text-sm">
										<strong>Annual Per Unit:</strong>
										{{ formatCurrency(budget.monthlyAssessment * 12) }}
									</p>
								</div>
							</div>

							<!-- Laundry Income -->
							<div class="border-b pb-6">
								<div class="flex justify-between items-start mb-4">
									<div>
										<h4 class="font-bold text-lg">Laundry Income</h4>
										<p class="text-sm text-gray-600">{{ budget.revenue.laundryIncome.description }}</p>
									</div>
									<div class="text-right">
										<p class="text-2xl font-bold text-green-700">
											{{ showMonthly ? formatCurrency(budget.revenue.laundryIncome.monthly) : formatCurrency(budget.revenue.laundryIncome.yearly) }}
										</p>
										<p class="text-sm text-gray-600">
											{{ showMonthly ? formatCurrency(budget.revenue.laundryIncome.yearly) + '/year' : formatCurrency(budget.revenue.laundryIncome.monthly) + '/month' }}
										</p>
									</div>
								</div>
							</div>

							<!-- Other Income -->
							<div>
								<div class="flex justify-between items-start mb-4">
									<div>
										<h4 class="font-bold text-lg">Other Income</h4>
										<p class="text-sm text-gray-600">{{ budget.revenue.otherIncome.description }}</p>
									</div>
									<div class="text-right">
										<p class="text-2xl font-bold text-green-700">
											{{ showMonthly ? formatCurrency(budget.revenue.otherIncome.monthly) : formatCurrency(budget.revenue.otherIncome.yearly) }}
										</p>
										<p class="text-sm text-gray-600">
											{{ showMonthly ? formatCurrency(budget.revenue.otherIncome.yearly) + '/year' : formatCurrency(budget.revenue.otherIncome.monthly) + '/month' }}
										</p>
									</div>
								</div>
							</div>
						</div>
					</UCard>
				</template>

				<!-- Summary Tab -->
				<template #summary>
					<UCard class="!rounded-[4px]">
						<template #header>
							<h3 class="text-lg font-semibold uppercase tracking-wide">BUDGET SUMMARY</h3>
						</template>
						<div class="space-y-6">
							<!-- Summary Table -->
							<div>
								<h4 class="font-bold text-lg mb-4 uppercase tracking-wide">{{ showMonthly ? 'Monthly Budget' : 'Annual Budget' }}</h4>
								<div class="overflow-x-auto">
									<table class="w-full">
										<thead>
											<tr class="border-b-2 border-gray-300">
												<th class="text-left py-3 px-4 uppercase tracking-wider text-xs font-semibold text-gray-600">
													Category
												</th>
												<th class="text-right py-3 px-4 uppercase tracking-wider text-xs font-semibold text-gray-600">
													{{ showMonthly ? 'Monthly' : 'Annual' }}
												</th>
												<th class="text-right py-3 px-4 uppercase tracking-wider text-xs font-semibold text-gray-600">
													% of Total
												</th>
											</tr>
										</thead>
										<tbody>
											<tr class="border-b border-gray-200 bg-green-50">
												<td class="py-3 px-4 font-bold">TOTAL REVENUE</td>
												<td class="py-3 px-4 text-right font-bold text-green-700">
													{{ showMonthly ? formatCurrency(budget.revenue.total.monthly) : formatCurrency(budget.revenue.total.yearly) }}
												</td>
												<td class="py-3 px-4 text-right font-bold">100%</td>
											</tr>
											<tr class="border-b border-gray-200">
												<td class="py-3 px-4 pl-8">Assessment Income</td>
												<td class="py-3 px-4 text-right">
													{{ showMonthly ? formatCurrency(budget.revenue.assessmentIncome.monthly) : formatCurrency(budget.revenue.assessmentIncome.yearly) }}
												</td>
												<td class="py-3 px-4 text-right">
													{{ ((budget.revenue.assessmentIncome.yearly / budget.revenue.total.yearly) * 100).toFixed(1) }}%
												</td>
											</tr>
											<tr class="border-b border-gray-200">
												<td class="py-3 px-4 pl-8">Laundry Income</td>
												<td class="py-3 px-4 text-right">
													{{ showMonthly ? formatCurrency(budget.revenue.laundryIncome.monthly) : formatCurrency(budget.revenue.laundryIncome.yearly) }}
												</td>
												<td class="py-3 px-4 text-right">
													{{ ((budget.revenue.laundryIncome.yearly / budget.revenue.total.yearly) * 100).toFixed(1) }}%
												</td>
											</tr>
											<tr class="border-b border-gray-200">
												<td class="py-3 px-4 pl-8">Other Income</td>
												<td class="py-3 px-4 text-right">
													{{ showMonthly ? formatCurrency(budget.revenue.otherIncome.monthly) : formatCurrency(budget.revenue.otherIncome.yearly) }}
												</td>
												<td class="py-3 px-4 text-right">
													{{ ((budget.revenue.otherIncome.yearly / budget.revenue.total.yearly) * 100).toFixed(1) }}%
												</td>
											</tr>
											<tr class="border-b-2 border-gray-400 bg-red-50">
												<td class="py-3 px-4 font-bold">TOTAL EXPENSES</td>
												<td class="py-3 px-4 text-right font-bold text-red-700">
													{{ showMonthly ? formatCurrency(budget.totals.monthly) : formatCurrency(budget.totals.yearly) }}
												</td>
												<td class="py-3 px-4 text-right font-bold">
													{{ ((budget.totals.yearly / budget.revenue.total.yearly) * 100).toFixed(1) }}%
												</td>
											</tr>
											<tr v-for="(category, key) in budget.categories" :key="key" class="border-b border-gray-200">
												<td class="py-3 px-4 pl-8">{{ key }}</td>
												<td class="py-3 px-4 text-right">
													{{ showMonthly ? formatCurrency(category.monthly) : formatCurrency(category.yearly) }}
												</td>
												<td class="py-3 px-4 text-right">
													{{ ((category.yearly / budget.revenue.total.yearly) * 100).toFixed(1) }}%
												</td>
											</tr>
											<tr :class="['bg-indigo-50 border-t-2 border-indigo-300']">
												<td class="py-3 px-4 font-bold uppercase tracking-wide">NET OPERATING INCOME</td>
												<td
													:class="[
														'py-3 px-4 text-right font-bold',
														budget.netOperating.yearly >= 0 ? 'text-green-700' : 'text-red-700',
													]">
													{{ showMonthly ? formatCurrency(budget.netOperating.monthly) : formatCurrency(budget.netOperating.yearly) }}
												</td>
												<td
													:class="[
														'py-3 px-4 text-right font-bold',
														budget.netOperating.yearly >= 0 ? 'text-green-700' : 'text-red-700',
													]">
													{{ ((budget.netOperating.yearly / budget.revenue.total.yearly) * 100).toFixed(2) }}%
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
		</template>

		<!-- Footer Notes -->
		<div class="mt-8 text-center text-sm text-gray-500">
			<p class="mb-2">{{ selectedYear }} Operating Budget | Lenox Plaza Association, Inc.</p>
			<p>Miami Beach, Florida | {{ budget?.unitCount || 28 }} Units</p>
		</div>
	</div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

import { useBudgetData } from '~/composables/useBudgetData';
import { useBudgetManagement } from '~/composables/useBudgetManagement';

const {
	selectedYear,
	loading,
	budgetCategories,
	budgetItems,
	budgetTotals,
	fiscalYearBudget,
	yearOptions: dynamicYearOptions,
	fetchBudgetData,
	safeParseFloat,
} = useBudgetManagement();

const { budget2025: staticBudget2025 } = useBudgetData();

const showMonthly = ref(false);
const activeTab = ref(0);
const currentYear = new Date().getFullYear();

// Merge dynamic available years with a static range that includes 2023
const yearOptions = computed(() => {
	const years = new Set<number>();
	for (let y = 2023; y <= currentYear + 1; y++) {
		years.add(y);
	}
	dynamicYearOptions.value.forEach((opt: { value: number }) => years.add(opt.value));
	return Array.from(years)
		.sort((a, b) => b - a)
		.map((y) => ({ label: `FY ${y}`, value: y }));
});

// Transform dynamic Directus data into the display format, fall back to static 2025
const budget = computed(() => {
	const hasDynamicData = budgetCategories.value.length > 0;

	if (!hasDynamicData) {
		// Fall back to static 2025 data when viewing 2025 with no Directus data
		if (selectedYear.value === 2025) {
			return { ...staticBudget2025, monthlyAssessment: 513, unitCount: 28 };
		}
		return null;
	}

	// Build categories object keyed by category_name
	const categories: Record<string, { monthly: number; yearly: number; items: Array<{ name: string; vendor: string; monthly: number; yearly: number }> }> = {};
	for (const cat of budgetCategories.value) {
		const catItems = budgetItems.value
			.filter((item: any) => {
				const catId = typeof item.category_id === 'object' ? item.category_id?.id : item.category_id;
				return catId === cat.id;
			})
			.map((item: any) => ({
				name: item.description,
				vendor: item.vendor_patterns?.[0] || (typeof item.vendor_id === 'object' ? item.vendor_id?.name : '') || '',
				monthly: safeParseFloat(item.monthly_budget),
				yearly: safeParseFloat(item.yearly_budget),
			}));

		categories[cat.category_name] = {
			monthly: safeParseFloat(cat.monthly_budget),
			yearly: safeParseFloat(cat.yearly_budget),
			items: catItems,
		};
	}

	// Build revenue from fiscal year budget config
	const fyb: any = fiscalYearBudget.value || {};
	const unitCount = safeParseFloat(fyb.unit_count) || 28;
	const monthlyAssessment = safeParseFloat(fyb.monthly_assessment) || 0;
	const assessmentMonthly = unitCount * monthlyAssessment;
	const assessmentYearly = assessmentMonthly * 12;
	const totalRevenueYearly = safeParseFloat(fyb.total_revenue) || assessmentYearly;
	const totalRevenueMonthly = totalRevenueYearly / 12;
	const otherRevenueYearly = Math.max(0, totalRevenueYearly - assessmentYearly);

	return {
		categories,
		totals: {
			monthly: budgetTotals.value.monthlyExpenses,
			yearly: budgetTotals.value.yearlyExpenses,
		},
		revenue: {
			assessmentIncome: {
				monthly: assessmentMonthly,
				yearly: assessmentYearly,
				description: `Regular HOA assessments: $${monthlyAssessment}/unit × ${unitCount} units`,
			},
			laundryIncome: {
				monthly: 0,
				yearly: 0,
				description: 'Laundry machine revenue',
			},
			otherIncome: {
				monthly: otherRevenueYearly / 12,
				yearly: otherRevenueYearly,
				description: 'Other income sources',
			},
			total: {
				monthly: totalRevenueMonthly,
				yearly: totalRevenueYearly,
			},
		},
		netOperating: {
			monthly: budgetTotals.value.monthlyNet,
			yearly: budgetTotals.value.yearlyNet,
		},
		monthlyAssessment,
		unitCount,
	};
});

// Top expense categories for the overview card (top 2 + all other)
const topExpenseCategories = computed(() => {
	if (!budget.value) return [];
	const entries = Object.entries(budget.value.categories)
		.map(([name, data]: [string, any]) => ({ name, monthly: data.monthly, yearly: data.yearly }))
		.sort((a, b) => b.yearly - a.yearly);

	if (entries.length <= 3) return entries;

	const top2 = entries.slice(0, 2);
	const rest = entries.slice(2);
	const restYearly = rest.reduce((sum, c) => sum + c.yearly, 0);
	const restMonthly = rest.reduce((sum, c) => sum + c.monthly, 0);
	return [...top2, { name: 'All Other', yearly: restYearly, monthly: restMonthly }];
});

useSeoMeta({
	title: computed(() => `${selectedYear.value} Operating Budget`),
});

const tabs = [
	{
		slot: 'expenses',
		label: 'EXPENSE BREAKDOWN',
		icon: 'i-heroicons-clipboard-document-list',
	},
	{
		slot: 'revenue',
		label: 'REVENUE SOURCES',
		icon: 'i-heroicons-currency-dollar',
	},
	{
		slot: 'summary',
		label: 'BUDGET SUMMARY',
		icon: 'i-heroicons-document-chart-bar',
	},
];

const formatCurrency = (amount: number) => {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(amount || 0);
};

// Fetch budget data on mount
onMounted(() => {
	fetchBudgetData();
});
</script>
