<template>
	<div class="container mx-auto p-6">
		<!-- Header -->
		<div class="mb-8">
			<h1 class="text-3xl font-bold uppercase tracking-wider mb-2 text-center">2025 OPERATING BUDGET</h1>
			<p class="text-gray-600 text-center">LENOX PLAZA ASSOCIATION, INC. - MIAMI BEACH, FLORIDA</p>
		</div>

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
						<p class="text-3xl font-bold text-green-700">{{ formatCurrency(budget.revenue.total.yearly) }}</p>
						<p class="text-sm text-gray-600 mt-1">{{ formatCurrency(budget.revenue.total.monthly) }}/month</p>
					</div>
					<div class="space-y-2 text-sm">
						<div class="flex justify-between">
							<span class="text-gray-600">Assessments ($513 × 28)</span>
							<span class="font-semibold">{{ formatCurrency(budget.revenue.assessmentIncome.yearly) }}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-gray-600">Laundry Income</span>
							<span class="font-semibold">{{ formatCurrency(budget.revenue.laundryIncome.yearly) }}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-gray-600">Other Income</span>
							<span class="font-semibold">{{ formatCurrency(budget.revenue.otherIncome.yearly) }}</span>
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
						<p class="text-3xl font-bold text-red-700">{{ formatCurrency(budget.totals.yearly) }}</p>
						<p class="text-sm text-gray-600 mt-1">{{ formatCurrency(budget.totals.monthly) }}/month</p>
					</div>
					<div class="space-y-2 text-sm">
						<div class="flex justify-between">
							<span class="text-gray-600">Insurance</span>
							<span class="font-semibold">{{ formatCurrency(budget.categories.Insurance.yearly) }}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-gray-600">Utilities</span>
							<span class="font-semibold">{{ formatCurrency(budget.categories.Utilities.yearly) }}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-gray-600">All Other</span>
							<span class="font-semibold">
								{{
									formatCurrency(
										budget.totals.yearly - budget.categories.Insurance.yearly - budget.categories.Utilities.yearly
									)
								}}
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
							{{ formatCurrency(budget.netOperating.yearly) }}
						</p>
						<p class="text-sm text-gray-600 mt-1">{{ formatCurrency(budget.netOperating.monthly) }}/month</p>
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
										<p class="text-xl font-bold">{{ formatCurrency(category.yearly) }}</p>
										<p class="text-sm text-gray-600">{{ formatCurrency(category.monthly) }}/month</p>
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
											<td class="py-3 px-4 text-right font-semibold">{{ formatCurrency(item.monthly) }}</td>
											<td class="py-3 px-4 text-right font-semibold">{{ formatCurrency(item.yearly) }}</td>
										</tr>
									</tbody>
									<tfoot>
										<tr class="bg-gray-50 font-bold">
											<td colspan="2" class="py-3 px-4 uppercase tracking-wide text-sm">Subtotal</td>
											<td class="py-3 px-4 text-right">{{ formatCurrency(category.monthly) }}</td>
											<td class="py-3 px-4 text-right">{{ formatCurrency(category.yearly) }}</td>
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
										{{ formatCurrency(budget.revenue.assessmentIncome.yearly) }}
									</p>
									<p class="text-sm text-gray-600">
										{{ formatCurrency(budget.revenue.assessmentIncome.monthly) }}/month
									</p>
								</div>
							</div>
							<div class="bg-green-50 p-4 rounded">
								<p class="text-sm">
									<strong>Per Unit:</strong>
									$513/month × 28 units
								</p>
								<p class="text-sm">
									<strong>Annual Per Unit:</strong>
									$6,156
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
										{{ formatCurrency(budget.revenue.laundryIncome.yearly) }}
									</p>
									<p class="text-sm text-gray-600">{{ formatCurrency(budget.revenue.laundryIncome.monthly) }}/month</p>
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
										{{ formatCurrency(budget.revenue.otherIncome.yearly) }}
									</p>
									<p class="text-sm text-gray-600">{{ formatCurrency(budget.revenue.otherIncome.monthly) }}/month</p>
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
						<!-- Annual Summary -->
						<div>
							<h4 class="font-bold text-lg mb-4 uppercase tracking-wide">Annual Budget</h4>
							<div class="overflow-x-auto">
								<table class="w-full">
									<thead>
										<tr class="border-b-2 border-gray-300">
											<th class="text-left py-3 px-4 uppercase tracking-wider text-xs font-semibold text-gray-600">
												Category
											</th>
											<th class="text-right py-3 px-4 uppercase tracking-wider text-xs font-semibold text-gray-600">
												Amount
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
												{{ formatCurrency(budget.revenue.total.yearly) }}
											</td>
											<td class="py-3 px-4 text-right font-bold">100%</td>
										</tr>
										<tr class="border-b border-gray-200">
											<td class="py-3 px-4 pl-8">Assessment Income</td>
											<td class="py-3 px-4 text-right">{{ formatCurrency(budget.revenue.assessmentIncome.yearly) }}</td>
											<td class="py-3 px-4 text-right">
												{{ ((budget.revenue.assessmentIncome.yearly / budget.revenue.total.yearly) * 100).toFixed(1) }}%
											</td>
										</tr>
										<tr class="border-b border-gray-200">
											<td class="py-3 px-4 pl-8">Laundry Income</td>
											<td class="py-3 px-4 text-right">{{ formatCurrency(budget.revenue.laundryIncome.yearly) }}</td>
											<td class="py-3 px-4 text-right">
												{{ ((budget.revenue.laundryIncome.yearly / budget.revenue.total.yearly) * 100).toFixed(1) }}%
											</td>
										</tr>
										<tr class="border-b border-gray-200">
											<td class="py-3 px-4 pl-8">Other Income</td>
											<td class="py-3 px-4 text-right">{{ formatCurrency(budget.revenue.otherIncome.yearly) }}</td>
											<td class="py-3 px-4 text-right">
												{{ ((budget.revenue.otherIncome.yearly / budget.revenue.total.yearly) * 100).toFixed(1) }}%
											</td>
										</tr>
										<tr class="border-b-2 border-gray-400 bg-red-50">
											<td class="py-3 px-4 font-bold">TOTAL EXPENSES</td>
											<td class="py-3 px-4 text-right font-bold text-red-700">
												{{ formatCurrency(budget.totals.yearly) }}
											</td>
											<td class="py-3 px-4 text-right font-bold">
												{{ ((budget.totals.yearly / budget.revenue.total.yearly) * 100).toFixed(1) }}%
											</td>
										</tr>
										<tr v-for="(category, key) in budget.categories" :key="key" class="border-b border-gray-200">
											<td class="py-3 px-4 pl-8">{{ key }}</td>
											<td class="py-3 px-4 text-right">{{ formatCurrency(category.yearly) }}</td>
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
												{{ formatCurrency(budget.netOperating.yearly) }}
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

		<!-- Footer Notes -->
		<div class="mt-8 text-center text-sm text-gray-500">
			<p class="mb-2">2025 Operating Budget | Lenox Plaza Association, Inc.</p>
			<p>Miami Beach, Florida | 28 Units</p>
		</div>
	</div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

import {useBudgetData} from '~/composables/useBudgetData';

const {budget2025: budget} = useBudgetData();
const activeTab = ref(0);

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
	}).format(amount);
};
</script>
