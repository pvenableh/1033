<template>
	<div class="container mx-auto p-6 space-y-6">
		<!-- Header -->
		<div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-3xl font-bold uppercase tracking-wider mb-2 dark:text-white">
						FINANCIAL ANALYSIS
					</h1>
					<p class="text-gray-600 dark:text-gray-400">
						Comprehensive financial analytics and projections
					</p>
				</div>
				<div class="flex items-center gap-3">
					<Select
						v-model="selectedFiscalYear"
						:options="yearOptions"
						placeholder="Fiscal Year"
						class="w-32"
					/>
					<UButton
						icon="i-heroicons-arrow-path"
						:loading="loading"
						@click="refreshData"
					>
						Refresh
					</UButton>
				</div>
			</div>
		</div>

		<!-- Main Content -->
		<div>
			<!-- Financial Health Score -->
			<div class="mb-8">
				<UCard>
					<template #header>
						<div class="flex items-center justify-between">
							<h2 class="text-lg font-semibold text-gray-900 dark:text-white">
								Financial Health Score
							</h2>
							<UBadge
								:color="healthScoreColor"
								size="lg"
							>
								{{ financialHealthScore.score }}/100
							</UBadge>
						</div>
					</template>

					<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div class="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
							<div class="text-2xl font-bold" :class="getScoreColor(financialHealthScore.score)">
								{{ financialHealthScore.score }}
							</div>
							<div class="text-sm text-gray-600 dark:text-gray-300">Score</div>
						</div>
						<div class="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
							<div class="text-2xl font-bold" :class="getScoreColor(financialHealthScore.score)">
								{{ financialHealthScore.grade }}
							</div>
							<div class="text-sm text-gray-600 dark:text-gray-300">Grade</div>
						</div>
						<div class="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
							<div class="text-2xl font-bold capitalize" :class="{
								'text-green-600': financialHealthScore.status === 'healthy',
								'text-yellow-600': financialHealthScore.status === 'caution',
								'text-red-600': financialHealthScore.status === 'critical'
							}">
								{{ financialHealthScore.status }}
							</div>
							<div class="text-sm text-gray-600 dark:text-gray-300">Status</div>
						</div>
					</div>

					<div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
						<div class="flex items-center gap-2">
							<UIcon
								:name="financialHealthScore.score >= 70 ? 'i-heroicons-check-circle' : 'i-heroicons-exclamation-triangle'"
								:class="financialHealthScore.score >= 70 ? 'text-green-500' : 'text-yellow-500'"
							/>
							<span class="text-sm text-gray-600 dark:text-gray-300">
								{{ getHealthSummary() }}
							</span>
						</div>
						<div v-if="financialHealthScore.issues.length > 0" class="mt-2 space-y-1">
							<div v-for="(issue, idx) in financialHealthScore.issues" :key="idx" class="text-sm text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
								<UIcon name="i-heroicons-exclamation-circle" class="w-4 h-4" />
								{{ issue }}
							</div>
						</div>
					</div>
				</UCard>
			</div>

			<!-- Key Metrics Row -->
			<div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
				<!-- Cash Position -->
				<UCard>
					<div class="text-center">
						<UIcon name="i-heroicons-banknotes" class="w-8 h-8 text-green-500 mx-auto mb-2" />
						<div class="text-2xl font-bold text-gray-900 dark:text-white">
							{{ formatCurrency(cashFlowSummary.currentBalance) }}
						</div>
						<div class="text-sm text-gray-500 dark:text-gray-400">Total Cash Position</div>
						<div class="mt-2 text-xs" :class="cashFlowSummary.avgNetCashFlow >= 0 ? 'text-green-600' : 'text-red-600'">
							{{ cashFlowSummary.avgNetCashFlow >= 0 ? '+' : '' }}{{ formatCurrency(cashFlowSummary.avgNetCashFlow) }}/mo
						</div>
					</div>
				</UCard>

				<!-- Reserve Fund -->
				<UCard>
					<div class="text-center">
						<UIcon name="i-heroicons-shield-check" class="w-8 h-8 text-blue-500 mx-auto mb-2" />
						<div class="text-2xl font-bold text-gray-900 dark:text-white">
							{{ reserveFundingStatus.percentFunded }}%
						</div>
						<div class="text-sm text-gray-500 dark:text-gray-400">Reserve Funded</div>
						<UBadge :color="reserveFundingStatus.color" size="sm" class="mt-2">
							{{ reserveFundingStatus.label }}
						</UBadge>
					</div>
				</UCard>

				<!-- Budget Variance -->
				<UCard>
					<div class="text-center">
						<UIcon name="i-heroicons-chart-bar" class="w-8 h-8 text-purple-500 mx-auto mb-2" />
						<div class="text-2xl font-bold" :class="varianceSummary.totalVariance >= 0 ? 'text-green-600' : 'text-red-600'">
							{{ varianceSummary.totalVariance >= 0 ? '+' : '' }}{{ formatCurrency(varianceSummary.totalVariance) }}
						</div>
						<div class="text-sm text-gray-500 dark:text-gray-400">YTD Budget Variance</div>
						<div class="mt-2 text-xs text-gray-600 dark:text-gray-300">
							{{ varianceSummary.overBudgetCount }} categories over budget
						</div>
					</div>
				</UCard>

				<!-- Delinquencies -->
				<UCard>
					<div class="text-center">
						<UIcon name="i-heroicons-exclamation-circle" class="w-8 h-8 text-orange-500 mx-auto mb-2" />
						<div class="text-2xl font-bold text-gray-900 dark:text-white">
							{{ formatCurrency(totalOutstandingBalance) }}
						</div>
						<div class="text-sm text-gray-500 dark:text-gray-400">Outstanding Assessments</div>
						<div class="mt-2 text-xs text-gray-600 dark:text-gray-300">
							{{ delinquentAccounts.length }} delinquent accounts
						</div>
					</div>
				</UCard>
			</div>

			<!-- Compliance Alerts -->
			<div v-if="unresolvedAlerts.length > 0" class="mb-8">
				<UCard>
					<template #header>
						<div class="flex items-center justify-between">
							<h2 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
								<UIcon name="i-heroicons-bell-alert" class="text-red-500" />
								Compliance Alerts
							</h2>
							<UBadge color="red">{{ alertCounts.total }} Active</UBadge>
						</div>
					</template>

					<div class="space-y-3">
						<div
							v-for="alert in unresolvedAlerts.slice(0, 5)"
							:key="alert.id"
							class="flex items-start gap-3 p-3 rounded-lg"
							:class="{
								'bg-red-50 dark:bg-red-900/20': alert.severity === 'critical',
								'bg-yellow-50 dark:bg-yellow-900/20': alert.severity === 'warning',
								'bg-blue-50 dark:bg-blue-900/20': alert.severity === 'info'
							}"
						>
							<UIcon
								:name="alert.severity === 'critical' ? 'i-heroicons-exclamation-triangle' : 'i-heroicons-information-circle'"
								:class="{
									'text-red-500': alert.severity === 'critical',
									'text-yellow-500': alert.severity === 'warning',
									'text-blue-500': alert.severity === 'info'
								}"
								class="w-5 h-5 mt-0.5"
							/>
							<div class="flex-1 min-w-0">
								<div class="font-medium text-gray-900 dark:text-white">{{ alert.title }}</div>
								<div class="text-sm text-gray-600 dark:text-gray-300 truncate">{{ alert.description }}</div>
							</div>
							<UBadge :color="getSeverityColor(alert.severity)" size="sm">
								{{ alert.severity }}
							</UBadge>
						</div>
					</div>

					<template #footer v-if="unresolvedAlerts.length > 5">
						<NuxtLink to="/financials/compliance" class="text-primary-600 hover:text-primary-700 text-sm font-medium">
							View all {{ unresolvedAlerts.length }} alerts &rarr;
						</NuxtLink>
					</template>
				</UCard>
			</div>

			<!-- Main Dashboard Tabs -->
			<Tabs :items="dashboardTabs" class="mb-8">
				<!-- Variance Analysis Tab -->
				<template #variance>
					<UCard class="mt-4">
						<template #header>
							<h3 class="font-semibold text-gray-900 dark:text-white">Budget Variance Analysis</h3>
						</template>

						<div class="overflow-x-auto">
							<table class="w-full text-sm">
								<thead>
									<tr class="border-b border-gray-200 dark:border-gray-700">
										<th class="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Category</th>
										<th class="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Budgeted</th>
										<th class="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Actual</th>
										<th class="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Variance</th>
										<th class="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-300">% Variance</th>
										<th class="text-center py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Status</th>
									</tr>
								</thead>
								<tbody>
									<tr
										v-for="item in varianceAnalysis"
										:key="item.categoryId"
										class="border-b border-gray-100 dark:border-gray-800"
									>
										<td class="py-3 px-4 font-medium text-gray-900 dark:text-white">
											{{ item.category }}
										</td>
										<td class="py-3 px-4 text-right text-gray-600 dark:text-gray-300">
											{{ formatCurrency(item.budget) }}
										</td>
										<td class="py-3 px-4 text-right text-gray-600 dark:text-gray-300">
											{{ formatCurrency(item.actual) }}
										</td>
										<td class="py-3 px-4 text-right" :class="item.variance >= 0 ? 'text-green-600' : 'text-red-600'">
											{{ item.variance >= 0 ? '+' : '' }}{{ formatCurrency(item.variance) }}
										</td>
										<td class="py-3 px-4 text-right" :class="item.percentVariance >= 0 ? 'text-green-600' : 'text-red-600'">
											{{ item.percentVariance >= 0 ? '+' : '' }}{{ item.percentVariance.toFixed(1) }}%
										</td>
										<td class="py-3 px-4 text-center">
											<UBadge :color="getVarianceStatusColor(item.status)" size="sm">
												{{ item.status }}
											</UBadge>
										</td>
									</tr>
								</tbody>
								<tfoot>
									<tr class="bg-gray-50 dark:bg-gray-800 font-semibold">
										<td class="py-3 px-4 text-gray-900 dark:text-white">Total</td>
										<td class="py-3 px-4 text-right text-gray-900 dark:text-white">
											{{ formatCurrency(varianceSummary.totalBudget) }}
										</td>
										<td class="py-3 px-4 text-right text-gray-900 dark:text-white">
											{{ formatCurrency(varianceSummary.totalActual) }}
										</td>
										<td class="py-3 px-4 text-right" :class="varianceSummary.totalVariance >= 0 ? 'text-green-600' : 'text-red-600'">
											{{ varianceSummary.totalVariance >= 0 ? '+' : '' }}{{ formatCurrency(varianceSummary.totalVariance) }}
										</td>
										<td class="py-3 px-4 text-right" :class="varianceSummary.percentVariance >= 0 ? 'text-green-600' : 'text-red-600'">
											{{ varianceSummary.percentVariance >= 0 ? '+' : '' }}{{ varianceSummary.percentVariance.toFixed(1) }}%
										</td>
										<td></td>
									</tr>
								</tfoot>
							</table>
						</div>
					</UCard>
				</template>

				<!-- Cash Flow Tab -->
				<template #cashflow>
					<UCard class="mt-4">
						<template #header>
							<h3 class="font-semibold text-gray-900 dark:text-white">Cash Flow Projections</h3>
						</template>

						<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
							<div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
								<div class="text-sm text-green-600 dark:text-green-400">Avg Monthly Income</div>
								<div class="text-2xl font-bold text-green-700 dark:text-green-300">
									{{ formatCurrency(cashFlowSummary.avgMonthlyIncome) }}
								</div>
							</div>
							<div class="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
								<div class="text-sm text-red-600 dark:text-red-400">Avg Monthly Expenses</div>
								<div class="text-2xl font-bold text-red-700 dark:text-red-300">
									{{ formatCurrency(cashFlowSummary.avgMonthlyExpenses) }}
								</div>
							</div>
							<div class="p-4 rounded-lg" :class="cashFlowSummary.projectedBalance6Mo >= 0 ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-orange-50 dark:bg-orange-900/20'">
								<div class="text-sm" :class="cashFlowSummary.projectedBalance6Mo >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'">
									6-Month Projected Balance
								</div>
								<div class="text-2xl font-bold" :class="cashFlowSummary.projectedBalance6Mo >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-orange-700 dark:text-orange-300'">
									{{ formatCurrency(cashFlowSummary.projectedBalance6Mo) }}
								</div>
							</div>
						</div>

						<div class="overflow-x-auto">
							<table class="w-full text-sm">
								<thead>
									<tr class="border-b border-gray-200 dark:border-gray-700">
										<th class="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Month</th>
										<th class="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Beginning</th>
										<th class="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Inflows</th>
										<th class="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Outflows</th>
										<th class="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Ending</th>
									</tr>
								</thead>
								<tbody>
									<tr
										v-for="projection in cashFlowProjectionsData"
										:key="projection.month"
										class="border-b border-gray-100 dark:border-gray-800"
									>
										<td class="py-3 px-4 font-medium text-gray-900 dark:text-white">
											{{ getMonthName(projection.month) }}
										</td>
										<td class="py-3 px-4 text-right text-gray-600 dark:text-gray-300">
											{{ formatCurrency(projection.beginningBalance) }}
										</td>
										<td class="py-3 px-4 text-right text-green-600">
											+{{ formatCurrency(projection.projectedIncome) }}
										</td>
										<td class="py-3 px-4 text-right text-red-600">
											-{{ formatCurrency(projection.projectedExpenses) }}
										</td>
										<td class="py-3 px-4 text-right font-medium" :class="projection.endingBalance >= 0 ? 'text-gray-900 dark:text-white' : 'text-red-600'">
											{{ formatCurrency(projection.endingBalance) }}
										</td>
									</tr>
								</tbody>
							</table>
						</div>
					</UCard>
				</template>

				<!-- Multi-Year Comparison Tab -->
				<template #comparison>
					<UCard class="mt-4">
						<template #header>
							<h3 class="font-semibold text-gray-900 dark:text-white">Multi-Year Budget Comparison</h3>
						</template>

						<div class="overflow-x-auto">
							<table class="w-full text-sm">
								<thead>
									<tr class="border-b border-gray-200 dark:border-gray-700">
										<th class="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Category</th>
										<th
											v-for="year in multiYearComparison.years"
											:key="year"
											class="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-300"
										>
											FY {{ year }}
										</th>
										<th class="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-300">YoY Change</th>
									</tr>
								</thead>
								<tbody>
									<tr
										v-for="cat in multiYearComparison.categories"
										:key="cat.category"
										class="border-b border-gray-100 dark:border-gray-800"
									>
										<td class="py-3 px-4 font-medium text-gray-900 dark:text-white">
											{{ cat.category }}
										</td>
										<td
											v-for="year in multiYearComparison.years"
											:key="year"
											class="py-3 px-4 text-right text-gray-600 dark:text-gray-300"
										>
											{{ formatCurrency(cat[`year_${year}`] || 0) }}
										</td>
										<td class="py-3 px-4 text-right" :class="cat.yoyPercent >= 0 ? 'text-red-600' : 'text-green-600'">
											{{ cat.yoyPercent >= 0 ? '+' : '' }}{{ cat.yoyPercent.toFixed(1) }}%
										</td>
									</tr>
								</tbody>
								<tfoot>
									<tr class="bg-gray-50 dark:bg-gray-800 font-semibold">
										<td class="py-3 px-4 text-gray-900 dark:text-white">{{ multiYearComparison.totals.category }}</td>
										<td
											v-for="year in multiYearComparison.years"
											:key="year"
											class="py-3 px-4 text-right text-gray-900 dark:text-white"
										>
											{{ formatCurrency(multiYearComparison.totals[`year_${year}`] || 0) }}
										</td>
										<td class="py-3 px-4 text-right" :class="multiYearComparison.totals.yoyPercent >= 0 ? 'text-red-600' : 'text-green-600'">
											{{ multiYearComparison.totals.yoyPercent >= 0 ? '+' : '' }}{{ multiYearComparison.totals.yoyPercent.toFixed(1) }}%
										</td>
									</tr>
								</tfoot>
							</table>
						</div>

						<!-- Budget Trend Analysis -->
						<div class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
							<h4 class="font-medium text-gray-900 dark:text-white mb-4">Budget Trend Analysis</h4>
							<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
								<div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
									<div class="text-sm text-gray-600 dark:text-gray-300">YoY Budget Change</div>
									<div class="text-xl font-bold" :class="budgetTrendAnalysis.totalChangePercent <= 0 ? 'text-green-600' : 'text-red-600'">
										{{ budgetTrendAnalysis.totalChangePercent >= 0 ? '+' : '' }}{{ budgetTrendAnalysis.totalChangePercent.toFixed(1) }}%
									</div>
								</div>
								<div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
									<div class="text-sm text-gray-600 dark:text-gray-300">Net Change Amount</div>
									<div class="text-xl font-bold" :class="budgetTrendAnalysis.totalChange <= 0 ? 'text-green-600' : 'text-red-600'">
										{{ formatCurrency(budgetTrendAnalysis.totalChange) }}
									</div>
								</div>
								<div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
									<div class="text-sm text-gray-600 dark:text-gray-300">Trend</div>
									<div class="text-xl font-bold capitalize" :class="{
										'text-green-600': budgetTrendAnalysis.overallTrend === 'decreasing',
										'text-yellow-600': budgetTrendAnalysis.overallTrend === 'stable',
										'text-red-600': budgetTrendAnalysis.overallTrend === 'increasing'
									}">
										{{ budgetTrendAnalysis.overallTrend }}
									</div>
								</div>
							</div>
						</div>
					</UCard>
				</template>

				<!-- Aging Report Tab -->
				<template #aging>
					<UCard class="mt-4">
						<template #header>
							<h3 class="font-semibold text-gray-900 dark:text-white">Assessment Aging Report</h3>
						</template>

						<div class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
							<div
								v-for="(bucket, key) in agingReport"
								:key="key"
								class="p-4 rounded-lg text-center"
								:class="getAgingBucketClass(key)"
							>
								<div class="text-2xl font-bold">{{ formatCurrency(bucket.amount) }}</div>
								<div class="text-sm font-medium">{{ getAgingLabel(key) }}</div>
								<div class="text-xs mt-1">{{ bucket.count }} accounts</div>
							</div>
						</div>

						<div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
							<div class="flex items-center justify-between">
								<div>
									<div class="text-sm text-gray-600 dark:text-gray-300">Total Outstanding</div>
									<div class="text-2xl font-bold text-gray-900 dark:text-white">
										{{ formatCurrency(totalOutstandingBalance) }}
									</div>
								</div>
								<NuxtLink to="/financials/assessments">
									<UButton variant="outline">
										View Details
									</UButton>
								</NuxtLink>
							</div>
						</div>
					</UCard>
				</template>

				<!-- Reserve Status Tab -->
				<template #reserves>
					<UCard class="mt-4">
						<template #header>
							<div class="flex items-center justify-between">
								<h3 class="font-semibold text-gray-900 dark:text-white">Reserve Fund Status</h3>
								<UBadge :color="fundingStatus.color" size="lg">
									{{ fundingStatus.label }}
								</UBadge>
							</div>
						</template>

						<div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
							<div class="text-center">
								<div class="text-sm text-gray-600 dark:text-gray-300">Current Balance</div>
								<div class="text-2xl font-bold text-gray-900 dark:text-white">
									{{ formatCurrency(reserveAccountBalance) }}
								</div>
							</div>
							<div class="text-center">
								<div class="text-sm text-gray-600 dark:text-gray-300">Recommended</div>
								<div class="text-2xl font-bold text-gray-900 dark:text-white">
									{{ formatCurrency(currentStudy?.recommended_balance || 0) }}
								</div>
							</div>
							<div class="text-center">
								<div class="text-sm text-gray-600 dark:text-gray-300">Percent Funded</div>
								<div class="text-2xl font-bold" :class="getPercentFundedColor(percentFunded)">
									{{ percentFunded }}%
								</div>
							</div>
							<div class="text-center">
								<div class="text-sm text-gray-600 dark:text-gray-300">Annual Contribution</div>
								<div class="text-2xl font-bold text-gray-900 dark:text-white">
									{{ formatCurrency(currentStudy?.annual_contribution || 0) }}
								</div>
							</div>
						</div>

						<!-- Critical Components -->
						<div v-if="criticalComponents.length > 0" class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
							<h4 class="font-medium text-gray-900 dark:text-white mb-4">
								Critical Components ({{ criticalComponents.length }})
							</h4>
							<div class="space-y-2">
								<div
									v-for="component in criticalComponents.slice(0, 5)"
									:key="component.id"
									class="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg"
								>
									<div>
										<div class="font-medium text-gray-900 dark:text-white">{{ component.name }}</div>
										<div class="text-sm text-gray-600 dark:text-gray-300">
											Replacement: {{ component.replacement_year }} | Condition: {{ component.condition }}
										</div>
									</div>
									<div class="text-right">
										<div class="font-bold text-red-600">{{ formatCurrency(component.replacement_cost) }}</div>
									</div>
								</div>
							</div>
						</div>
					</UCard>
				</template>
			</Tabs>

			<!-- Quick Actions -->
			<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
				<NuxtLink to="/financials/reconciliation">
					<UCard class="hover:shadow-lg transition-shadow cursor-pointer">
						<div class="text-center">
							<UIcon name="i-heroicons-document-check" class="w-8 h-8 text-primary-500 mx-auto mb-2" />
							<div class="font-medium text-gray-900 dark:text-white">Reconciliation</div>
						</div>
					</UCard>
				</NuxtLink>
				<NuxtLink to="/financials/budget-management">
					<UCard class="hover:shadow-lg transition-shadow cursor-pointer">
						<div class="text-center">
							<UIcon name="i-heroicons-calculator" class="w-8 h-8 text-primary-500 mx-auto mb-2" />
							<div class="font-medium text-gray-900 dark:text-white">Budget Management</div>
						</div>
					</UCard>
				</NuxtLink>
				<NuxtLink to="/financials/budget">
					<UCard class="hover:shadow-lg transition-shadow cursor-pointer">
						<div class="text-center">
							<UIcon name="i-heroicons-chart-pie" class="w-8 h-8 text-primary-500 mx-auto mb-2" />
							<div class="font-medium text-gray-900 dark:text-white">Budget Overview</div>
						</div>
					</UCard>
				</NuxtLink>
				<NuxtLink to="/financials">
					<UCard class="hover:shadow-lg transition-shadow cursor-pointer">
						<div class="text-center">
							<UIcon name="i-heroicons-chart-bar" class="w-8 h-8 text-primary-500 mx-auto mb-2" />
							<div class="font-medium text-gray-900 dark:text-white">Dashboard</div>
						</div>
					</UCard>
				</NuxtLink>
			</div>
		</div>
	</div>
</template>

<script setup>
definePageMeta({
	layout: 'default',
	middleware: ['auth'],
});

useSeoMeta({
	title: 'Financial Analysis',
});

const currentYear = new Date().getFullYear();
const selectedFiscalYear = ref(currentYear);

const yearOptions = computed(() => {
	const years = [];
	for (let y = currentYear - 3; y <= currentYear + 1; y++) {
		years.push({ label: `FY ${y}`, value: y });
	}
	return years;
});

// Composables
const {
	loading: dashboardLoading,
	varianceAnalysis,
	varianceSummary,
	generateCashFlowProjections,
	cashFlowSummary,
	multiYearComparison,
	budgetTrendAnalysis,
	financialHealthScore,
	fetchDashboardData,
	formatCurrency,
	selectedAccount,
} = useFinancialDashboard();

// Local computed for cash flow projections table
const cashFlowProjectionsData = computed(() => {
	return generateCashFlowProjections(selectedAccount.value || 1, 12);
});

const {
	loading: alertsLoading,
	unresolvedAlerts,
	alertCounts,
	fetchAlerts,
} = useComplianceAlerts();

const {
	loading: ledgerLoading,
	agingReport,
	totalOutstandingBalance,
	delinquentAccounts,
	fetchLedgerEntries,
	fetchUnits,
} = useAssessmentLedger();

const {
	loading: reserveLoading,
	currentStudy,
	criticalComponents,
	percentFunded,
	fundingStatus,
	reserveAccountBalance,
	fetchCurrentStudy,
	fetchReserveBalance,
} = useReserveStudy();

// Combined loading state
const loading = computed(() => {
	return dashboardLoading.value || alertsLoading.value || ledgerLoading.value || reserveLoading.value;
});

// Reserve funding status for card display
const reserveFundingStatus = computed(() => {
	return {
		percentFunded: percentFunded.value,
		...fundingStatus.value,
	};
});

// Dashboard tabs
const dashboardTabs = [
	{ label: 'Variance Analysis', slot: 'variance' },
	{ label: 'Cash Flow', slot: 'cashflow' },
	{ label: 'Multi-Year', slot: 'comparison' },
	{ label: 'Aging Report', slot: 'aging' },
	{ label: 'Reserve Status', slot: 'reserves' },
];

// Health score color
const healthScoreColor = computed(() => {
	const score = financialHealthScore.value.score;
	if (score >= 80) return 'green';
	if (score >= 60) return 'yellow';
	if (score >= 40) return 'orange';
	return 'red';
});

// Helper functions
const getScoreColor = (score) => {
	if (score >= 80) return 'text-green-600';
	if (score >= 60) return 'text-yellow-600';
	if (score >= 40) return 'text-orange-600';
	return 'text-red-600';
};

const getHealthSummary = () => {
	const score = financialHealthScore.value.score;
	if (score >= 80) return 'Excellent financial health. Keep up the good work!';
	if (score >= 60) return 'Good financial standing with some areas for improvement.';
	if (score >= 40) return 'Financial health needs attention. Review budget variances and delinquencies.';
	return 'Critical financial concerns. Immediate action recommended.';
};

const getSeverityColor = (severity) => {
	const colors = { critical: 'red', warning: 'yellow', info: 'blue' };
	return colors[severity] || 'gray';
};

const getVarianceStatusColor = (status) => {
	const colors = {
		'under': 'green',
		'on_target': 'blue',
		'over': 'red',
	};
	return colors[status] || 'gray';
};

const getMonthName = (month) => {
	const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
	return months[parseInt(month) - 1] || month;
};

const getAgingBucketClass = (key) => {
	const classes = {
		current: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300',
		'1-30': 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300',
		'31-60': 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300',
		'61-90': 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300',
		'90+': 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300',
	};
	return classes[key] || '';
};

const getAgingLabel = (key) => {
	const labels = {
		current: 'Current',
		'1-30': '1-30 Days',
		'31-60': '31-60 Days',
		'61-90': '61-90 Days',
		'90+': '90+ Days',
	};
	return labels[key] || key;
};

const getPercentFundedColor = (percent) => {
	if (percent >= 70) return 'text-green-600';
	if (percent >= 50) return 'text-yellow-600';
	if (percent >= 30) return 'text-orange-600';
	return 'text-red-600';
};

// Refresh all data
const refreshData = async () => {
	await Promise.all([
		fetchDashboardData(selectedFiscalYear.value),
		fetchAlerts({ unresolved: true }),
		fetchUnits(),
		fetchLedgerEntries(selectedFiscalYear.value),
		fetchCurrentStudy(selectedFiscalYear.value),
		fetchReserveBalance(selectedFiscalYear.value),
	]);
};

// Watch fiscal year changes
watch(selectedFiscalYear, () => {
	refreshData();
});

// Initial load
onMounted(() => {
	refreshData();
});
</script>
