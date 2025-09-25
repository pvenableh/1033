<template>
	<div class="container mx-auto min-h-svh p-6">
		<!-- Header -->
		<div class="mb-8">
			<h1 class="text-3xl font-bold uppercase tracking-wider mb-2 text-center">HOA FINANCIAL DASHBOARD</h1>
			<div class="w-full text-center uppercase tracking-wider text-sm text-gray-600">
				<span>{{ getRangeDescription() }} {{ selectedYear }}</span>
			</div>
		</div>

		<!-- Loading State -->
		<div v-if="loading" class="flex justify-center items-center min-h-svh">
			<div class="text-center">
				<div class="animate-spin rounded-full h-10 w-10 border-b-2 border-black-400 mx-auto mb-4"></div>
				<p class="text-gray-600">Loading financial data...</p>
			</div>
		</div>

		<!-- Error State -->
		<UAlert
			v-if="error && !loading"
			icon="i-heroicons-exclamation-triangle"
			color="red"
			variant="soft"
			:title="error"
			class="mb-8" />

		<!-- Main Dashboard Content -->
		<div v-if="!loading && accounts.length > 0">
			<!-- Account Tabs -->
			<div class="mb-6">
				<div class="border-b border-gray-200">
					<nav class="-mb-px flex justify-between items-end">
						<div class="flex space-x-1">
							<button
								v-for="account in accounts"
								:key="account.id"
								@click="selectedAccount = account.id"
								:class="[
									'py-4 px-6 text-sm font-medium border-b-2 transition-all duration-200 ',
									selectedAccount === account.id
										? 'border-blue-500 text-blue-600 bg-blue-50 shadow'
										: 'bg-[rgba(0,0,0,0.025)] border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
								]">
								<div class="flex items-center gap-3">
									<!-- <div class="w-4 h-4 rounded-full" :style="{backgroundColor: account.color}"></div> -->
									<UIcon
										:name="
											account.id === 1
												? 'i-lucide:chart-column'
												: account.id === 3
													? 'i-lucide:building'
													: 'i-lucide:landmark'
										"
										class="w-6 h-6"
										:style="{color: account.color}" />
									<div class="text-left uppercase tracking-wide">
										<div class="font-semibold">{{ account.account_name }}</div>
										<div class="text-xs text-gray-500">#{{ account.account_number }}</div>
									</div>
									<!-- <UBadge color="primary" variant="soft" size="xs">
									{{ account }}
									{{ formatCurrency(currentAccountBalance.current) }}
								</UBadge> -->
								</div>
							</button>
						</div>
						<button
							@click="selectedAccount = 'info'"
							:class="[
								'py-4 px-6 text-sm font-medium border-b-2 transition-all duration-200 ',
								selectedAccount === 'info'
									? 'border-blue-500 text-blue-600 bg-blue-50 shadow'
									: 'bg-[rgba(0,0,0,0.025)] border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
							]">
							<div class="flex items-center gap-3">
								<!-- <div class="w-4 h-4 rounded-full bg-green-500"></div> -->
								<UIcon name="lucide:chart-pie" class="w-6 h-6 text-green-500" />
								<div class="text-left uppercase tracking-wide">
									<div class="font-semibold">Operating Budget</div>
									<div class="text-xs text-gray-500">2025</div>
								</div>
							</div>
						</button>
					</nav>
				</div>
			</div>
			<div v-if="selectedAccount !== 'info'">
				<div class="mb-6">
					<!-- Year and Time Period Filters -->
					<UCard>
						<div class="flex flex-wrap gap-4 items-center">
							<div class="flex items-center gap-2">
								<label class="text-sm font-medium text-gray-700 uppercase">Fiscal Year:</label>
								<USelect v-model="selectedYear" :options="yearOptions" size="sm" class="w-24" />
							</div>
							<div class="flex items-center gap-2">
								<label class="text-sm font-medium text-gray-700 uppercase">From Month:</label>
								<USelect v-model="selectedStartMonth" :options="monthOptions" size="sm" class="w-32" />
							</div>
							<div class="flex items-center gap-2">
								<label class="text-sm font-medium text-gray-700 uppercase">To Month:</label>
								<USelect
									v-model="selectedEndMonth"
									:options="monthOptions"
									size="sm"
									class="w-32"
									:ui="{
										option: {
											disabled: 'cursor-not-allowed opacity-50',
										},
									}" />
							</div>
							<!-- <UButton @click="setToCurrentPeriod" size="sm" variant="outline" icon="i-heroicons-calendar">
							Set to Current Period
						</UButton> -->
							<!-- <div class="text-sm text-gray-600">
							<span>{{ getRangeDescription() }} {{ selectedYear }}</span>
						</div> -->
							<!-- <UButton @click="refreshAll" :loading="loading" icon="i-heroicons-arrow-path" size="sm" variant="outline">
							Refresh
						</UButton>-->
						</div>
					</UCard>
				</div>

				<!-- Content Tabs -->
				<UTabs v-model="activeTab" :items="contentTabs" class="space-y-6">
					<!-- Overview Tab -->
					<template #overview>
						<div class="space-y-6">
							<div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
								<!-- Current Balance -->
								<UCard class="text-center">
									<div class="space-y-2">
										<UIcon name="i-heroicons-banknotes" class="w-8 h-8 mx-auto text-blue-600" />
										<p class="text-sm uppercase tracking-wider text-gray-600">CURRENT BALANCE</p>
										<p class="text-3xl font-bold text-blue-600">
											{{ formatCurrency(currentAccountBalance.current) }}
										</p>
										<p class="text-xs text-gray-500">FROM {{ formatCurrency(currentAccountBalance.previous) }}</p>
									</div>
								</UCard>

								<!-- YTD Revenue -->
								<UCard class="text-center">
									<div class="space-y-2">
										<UIcon name="i-heroicons-arrow-trending-up" class="w-8 h-8 mx-auto text-green-600" />
										<p class="text-sm uppercase tracking-wider text-gray-600">
											{{ accountMetrics?.isYTD ? 'YTD' : 'PERIOD' }} REVENUE
										</p>
										<p class="text-3xl font-bold text-green-600">
											{{ formatCurrency(accountMetrics?.revenue || 0) }}
										</p>
										<p class="text-xs text-gray-500">{{ accountMetrics?.monthsCount || 0 }} MONTHS</p>
									</div>
								</UCard>

								<!-- YTD Expenses -->
								<UCard class="text-center">
									<div class="space-y-2">
										<UIcon name="i-heroicons-arrow-trending-down" class="w-8 h-8 mx-auto text-red-600" />
										<p class="text-sm uppercase tracking-wider text-gray-600">
											{{ accountMetrics?.isYTD ? 'YTD' : 'PERIOD' }} EXPENSES
										</p>
										<p class="text-3xl font-bold text-red-600">
											{{ formatCurrency(accountMetrics?.expenses || 0) }}
										</p>
										<p class="text-xs text-gray-500">EXCLUDING TRANSFERS</p>
									</div>
								</UCard>

								<!-- Net Cash Flow -->
								<UCard class="text-center">
									<div class="space-y-2">
										<UIcon
											name="i-heroicons-scale"
											class="w-8 h-8 mx-auto"
											:class="(accountMetrics?.netCashFlow || 0) >= 0 ? 'text-green-600' : 'text-red-600'" />
										<p class="text-sm uppercase tracking-wider text-gray-600">NET CASH FLOW</p>
										<p
											class="text-3xl font-bold"
											:class="(accountMetrics?.netCashFlow || 0) >= 0 ? 'text-green-600' : 'text-red-600'">
											{{ (accountMetrics?.netCashFlow || 0) >= 0 ? '+' : '-'
											}}{{ formatCurrency(Math.abs(accountMetrics?.netCashFlow || 0)) }}
										</p>
										<p class="text-xs text-gray-500">REVENUE - EXPENSES</p>
									</div>
								</UCard>
							</div>
							<!-- Monthly Trend Chart -->
							<UCard>
								<template #header>
									<h3 class="text-lg font-semibold uppercase tracking-wide">MONTHLY CASH FLOW TREND</h3>
									<p class="text-sm text-gray-600 mt-2">
										Revenue, expenses, and balance progression for {{ currentAccountBalance.account?.account_name }}
									</p>
								</template>
								<div class="h-80">
									<Line :data="monthlyChartData" :options="chartOptions" />
								</div>
							</UCard>

							<!-- Category & Vendor Breakdown Grid -->
							<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
								<!-- Top Categories -->
								<UCard>
									<template #header>
										<h3 class="text-lg font-semibold uppercase tracking-wide">TOP CATEGORIES YTD</h3>
									</template>
									<div class="space-y-4">
										<div v-for="category in categoryBreakdown.slice(0, 8)" :key="category.id" class="space-y-2">
											<div class="flex items-center justify-between">
												<div class="flex items-center gap-2">
													<div class="w-4 h-4 rounded-full" :style="{backgroundColor: category.color}"></div>
													<span class="font-medium text-sm">{{ category.name }}</span>
												</div>
												<span class="text-xs text-gray-500">{{ category.transactionCount }} transactions</span>
											</div>
											<div class="flex items-center justify-between text-sm">
												<span class="text-green-600">+{{ formatCurrency(category.revenue) }}</span>
												<span class="text-red-600">-{{ formatCurrency(category.expenses) }}</span>
												<span class="font-semibold" :class="category.net >= 0 ? 'text-green-600' : 'text-red-600'">
													{{ category.net >= 0 ? '+' : '' }}{{ formatCurrency(Math.abs(category.net)) }}
												</span>
											</div>
										</div>
									</div>
								</UCard>

								<!-- Top Vendors -->
								<UCard>
									<template #header>
										<h3 class="text-lg font-semibold uppercase tracking-wide">TOP VENDORS YTD</h3>
									</template>
									<div class="space-y-4">
										<div v-for="vendor in vendorBreakdown.slice(0, 10)" :key="vendor.vendor" class="space-y-2">
											<div class="flex items-center justify-between">
												<span class="font-medium text-sm">{{ vendor.vendor }}</span>
												<span class="font-bold text-red-600">{{ formatCurrency(vendor.totalAmount) }}</span>
											</div>
											<div class="flex items-center justify-between text-xs text-gray-500">
												<span>{{ vendor.transactionCount }} transactions</span>
												<span>{{ vendor.categories.join(', ') }}</span>
											</div>
										</div>
									</div>
								</UCard>
							</div>
						</div>
					</template>
					<template #budget-analysis>
						<div v-if="selectedAccount === 1" class="space-y-6">
							<!-- Budget Summary Cards -->
							<div class="grid grid-cols-1 md:grid-cols-4 gap-6">
								<!-- Total Budget -->
								<UCard class="text-center">
									<div class="space-y-2">
										<UIcon name="i-heroicons-calculator" class="w-8 h-8 mx-auto text-blue-600" />
										<p class="text-sm uppercase tracking-wider text-gray-600">
											{{ budgetSummary.isYearToDate ? 'ANNUAL' : 'PERIOD' }} BUDGET
										</p>
										<p class="text-3xl font-bold text-blue-600">
											{{ formatCurrency(budgetSummary.totalBudgeted) }}
										</p>
										<p class="text-xs text-gray-500">{{ budgetSummary.monthsSelected }} MONTHS</p>
									</div>
								</UCard>

								<!-- Actual Spending -->
								<UCard class="text-center">
									<div class="space-y-2">
										<UIcon name="i-heroicons-banknotes" class="w-8 h-8 mx-auto text-red-600" />
										<p class="text-sm uppercase tracking-wider text-gray-600">ACTUAL SPENDING</p>
										<p class="text-3xl font-bold text-red-600">
											{{ formatCurrency(budgetSummary.totalActual) }}
										</p>
										<p class="text-xs text-gray-500">EXCLUDING TRANSFERS</p>
									</div>
								</UCard>

								<!-- Budget Variance -->
								<UCard class="text-center">
									<div class="space-y-2">
										<UIcon
											name="i-heroicons-scale"
											class="w-8 h-8 mx-auto"
											:class="budgetSummary.totalVariance >= 0 ? 'text-red-600' : 'text-green-600'" />
										<p class="text-sm uppercase tracking-wider text-gray-600">BUDGET VARIANCE</p>
										<p
											class="text-3xl font-bold"
											:class="budgetSummary.totalVariance >= 0 ? 'text-red-600' : 'text-green-600'">
											{{ budgetSummary.totalVariance >= 0 ? '+' : ''
											}}{{ formatCurrency(Math.abs(budgetSummary.totalVariance)) }}
										</p>
										<p
											class="text-xs font-semibold"
											:class="budgetSummary.totalVariance >= 0 ? 'text-red-500' : 'text-green-500'">
											{{ budgetSummary.percentVariance >= 0 ? '+' : '' }}{{ budgetSummary.percentVariance }}%
										</p>
									</div>
								</UCard>

								<!-- Overall Status -->
								<UCard class="text-center">
									<div class="space-y-2">
										<UIcon
											name="i-heroicons-chart-bar"
											class="w-8 h-8 mx-auto"
											:class="`text-${budgetSummary.statusColor}-600`" />
										<p class="text-sm uppercase tracking-wider text-gray-600">STATUS</p>
										<UBadge :color="budgetSummary.statusColor" variant="soft" size="lg" class="text-sm px-3 py-1">
											{{ budgetSummary.overallStatus }}
										</UBadge>
										<p class="text-xs text-gray-500">
											AVG: {{ formatCurrency(budgetSummary.averageMonthlyActual) }}/MONTH
										</p>
									</div>
								</UCard>
							</div>

							<!-- Budget vs Actual Comparison Table -->
							<UCard>
								<template #header>
									<div class="flex items-center justify-between">
										<h3 class="text-lg font-semibold uppercase tracking-wide">
											BUDGET VS ACTUAL BY CATEGORY - {{ getRangeDescription() }} {{ selectedYear }}
										</h3>
										<UBadge color="primary" variant="soft">
											{{ budgetSummary.monthsSelected }} MONTH{{ budgetSummary.monthsSelected !== 1 ? 'S' : '' }}
										</UBadge>
									</div>
								</template>

								<UTable :rows="budgetComparison" :columns="budgetComparisonColumns">
									<template #category-data="{row}">
										<div class="flex items-center gap-2">
											<div class="w-4 h-4 rounded-full bg-blue-500"></div>
											<span class="font-medium">{{ row.category }}</span>
										</div>
									</template>
									<template #monthlyBudget-data="{row}">
										<span class="text-gray-700">{{ formatCurrency(row.monthlyBudget) }}</span>
									</template>
									<template #proRatedBudget-data="{row}">
										<span class="text-gray-900 font-medium">{{ formatCurrency(row.proRatedBudget) }}</span>
									</template>
									<template #actualAmount-data="{row}">
										<span class="font-semibold text-red-600">{{ formatCurrency(row.actualAmount) }}</span>
									</template>
									<template #variance-data="{row}">
										<span :class="row.variance >= 0 ? 'text-red-600' : 'text-green-600'" class="font-semibold">
											{{ row.variance >= 0 ? '+' : '' }}{{ formatCurrency(Math.abs(row.variance)) }}
										</span>
									</template>
									<template #percentVariance-data="{row}">
										<span :class="row.variance >= 0 ? 'text-red-600' : 'text-green-600'" class="font-semibold">
											{{ row.percentVariance >= 0 ? '+' : '' }}{{ row.percentVariance }}%
										</span>
									</template>
									<template #status-data="{row}">
										<UBadge :color="row.statusColor" variant="soft" size="xs">
											{{ row.status }}
										</UBadge>
									</template>
									<template #transactionCount-data="{row}">
										<span class="text-xs text-gray-500">{{ row.transactionCount }}</span>
									</template>
								</UTable>
							</UCard>

							<!-- Year-End Projection (only show if not viewing full year) -->
							<UCard v-if="!budgetSummary.isYearToDate">
								<template #header>
									<h3 class="text-lg font-semibold uppercase tracking-wide">YEAR-END BUDGET PROJECTION</h3>
									<p class="text-sm text-gray-600 mt-2">
										Based on average monthly spending from {{ getRangeDescription() }}
									</p>
								</template>

								<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
									<div class="text-center p-6 bg-blue-50 rounded-lg">
										<p class="text-sm uppercase tracking-wide text-gray-600">PROJECTED YEAR-END</p>
										<p class="text-2xl font-bold text-blue-600">
											{{ formatCurrency(budgetProjection.projectedYearEnd) }}
										</p>
										<p class="text-xs text-gray-500">vs {{ formatCurrency(budget2025.totals.yearly) }} budgeted</p>
									</div>

									<div class="text-center p-6 bg-gray-50 rounded-lg">
										<p class="text-sm uppercase tracking-wide text-gray-600">PROJECTED VARIANCE</p>
										<p
											class="text-2xl font-bold"
											:class="budgetProjection.projectedVariance >= 0 ? 'text-red-600' : 'text-green-600'">
											{{ budgetProjection.projectedVariance >= 0 ? '+' : ''
											}}{{ formatCurrency(Math.abs(budgetProjection.projectedVariance)) }}
										</p>
										<p
											class="text-xs font-semibold"
											:class="budgetProjection.projectedVariance >= 0 ? 'text-red-500' : 'text-green-500'">
											{{ budgetProjection.projectedPercentVariance >= 0 ? '+' : ''
											}}{{ budgetProjection.projectedPercentVariance }}%
										</p>
									</div>

									<div class="text-center p-6 bg-green-50 rounded-lg">
										<p class="text-sm uppercase tracking-wide text-gray-600">RECOMMENDATION</p>
										<p class="text-sm text-gray-800 mt-2">{{ budgetProjection.recommendation }}</p>
									</div>
								</div>
							</UCard>

							<!-- Monthly Budget Tracking Chart -->
							<UCard>
								<template #header>
									<h3 class="text-lg font-semibold uppercase tracking-wide">BUDGET VS ACTUAL TREND</h3>
									<p class="text-sm text-gray-600 mt-2">Monthly comparison of budgeted vs actual spending</p>
								</template>
								<div class="h-80">
									<Line :data="budgetComparisonChartData" :options="budgetChartOptions" />
								</div>
							</UCard>

							<!-- Detailed Category Analysis -->
							<UCard>
								<template #header>
									<h3 class="text-lg font-semibold uppercase tracking-wide">DETAILED CATEGORY ANALYSIS</h3>
								</template>

								<div class="space-y-6">
									<div
										v-for="category in budgetComparison.filter((c) => c.actualAmount > 0)"
										:key="category.category"
										class="border-2 rounded-sm p-4"
										:class="{
											'border-red-200 ': category.statusColor === 'red', // Significantly Over Budget (>20%)
											'border-orange-200 ': category.statusColor === 'orange', // Over Budget (>10%)
											'border-yellow-200 ': category.statusColor === 'yellow', // Slightly Over Budget (≤10%)
											'border-green-200 ': category.statusColor === 'green', // On Track
											'border-blue-200 ': category.statusColor === 'blue', // Significantly Under Budget (<-20%)
										}">
										<div class="flex items-center justify-between mb-3">
											<h4 class="font-semibold text-lg uppercase tracking-wide">{{ category.category }}</h4>
											<UBadge :color="category.statusColor" variant="soft" class="uppercase font-semibold">
												{{ category.status }}
											</UBadge>
										</div>

										<div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm uppercase tracking-wide mb-5">
											<div>
												<p class="text-gray-600">Monthly Budget</p>
												<p class="font-semibold">{{ formatCurrency(category.monthlyBudget) }}</p>
											</div>
											<div>
												<p class="text-gray-600">Period Budget</p>
												<p class="font-semibold">{{ formatCurrency(category.proRatedBudget) }}</p>
											</div>
											<div>
												<p class="text-gray-600">Actual Spent</p>
												<p class="font-semibold text-red-600">{{ formatCurrency(category.actualAmount) }}</p>
											</div>
											<div>
												<p class="text-gray-600">Variance</p>
												<p class="font-semibold" :class="category.variance >= 0 ? 'text-red-600' : 'text-green-600'">
													{{ category.variance >= 0 ? '+' : '' }}{{ formatCurrency(Math.abs(category.variance)) }} ({{
														category.percentVariance >= 0 ? '+' : ''
													}}{{ category.percentVariance }}%)
												</p>
											</div>
										</div>
										<!-- Collapsible Transaction Details -->
										<UAccordion
											:items="[
												{
													label: `View ${category.transactionCount} Transactions`,
													slot: getCategorySlotName(category.category),
													defaultOpen: false,
												},
											]">
											<template #[getCategorySlotName(category.category)]>
												<div class="space-y-3 mt-4">
													<!-- Transaction Summary -->
													<div class="bg-white p-3 rounded uppercase tracking-widetext-sm">
														<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
															<div>
																<span class="text-gray-600">Total Transactions:</span>
																<span class="font-semibold ml-2">
																	{{ getCategoryTransactions(category.category).length }}
																</span>
															</div>
															<div>
																<span class="text-gray-600">Average per Transaction:</span>
																<span class="font-semibold ml-2">
																	{{ formatCurrency(category.actualAmount / category.transactionCount) }}
																</span>
															</div>
															<div>
																<span class="text-gray-600">Largest Transaction:</span>
																<span class="font-semibold ml-2 text-red-600">
																	{{ formatCurrency(getLargestTransaction(category.category)) }}
																</span>
															</div>
															<div>
																<span class="text-gray-600">Month Spread:</span>
																<span class="font-semibold ml-2">{{ getCategoryMonthSpread(category.category) }}</span>
															</div>
														</div>
													</div>

													<!-- Individual Transactions -->
													<div class="max-h-80 overflow-y-auto">
														<div class="space-y-2">
															<div
																v-for="transaction in getCategoryTransactions(category.category)"
																:key="transaction.id"
																class="flex items-center justify-between py-3 px-4 bg-white border rounded hover:bg-gray-50 transition-colors">
																<div class="flex items-center gap-4 flex-1">
																	<div class="text-xs font-mono text-gray-500 w-16">
																		{{ formatDate(transaction.transaction_date) }}
																	</div>
																	<div class="text-xs text-gray-400 w-12">
																		{{ transaction.statement_month }}
																	</div>
																	<div class="flex-1">
																		<div class="font-medium text-sm">
																			{{ transaction.description || 'No description' }}
																		</div>
																		<div class="text-xs text-gray-500">
																			{{ transaction.vendor || 'No vendor' }}
																			<span v-if="transaction.category_id" class="ml-2">
																				• {{ getCategoryName(transaction.category_id) }}
																			</span>
																		</div>
																	</div>
																</div>
																<div class="text-right">
																	<div class="font-bold text-red-600">
																		{{ formatCurrency(transaction.amount) }}
																	</div>
																	<div class="text-xs text-gray-400">
																		{{ getTransactionTypeColor(transaction.transaction_type) }}
																	</div>
																</div>
															</div>
														</div>
													</div>

													<!-- Running Total Footer -->
													<div class="bg-gray-100 p-3 rounded text-sm border-t">
														<div class="flex justify-between items-center">
															<span class="text-gray-600">Category Total:</span>
															<span class="font-bold text-red-600">{{ formatCurrency(category.actualAmount) }}</span>
														</div>
														<div class="flex justify-between items-center mt-1">
															<span class="text-gray-600">Budget Remaining:</span>
															<span
																class="font-bold"
																:class="category.variance <= 0 ? 'text-green-600' : 'text-red-600'">
																{{
																	category.variance <= 0
																		? formatCurrency(Math.abs(category.variance))
																		: 'Over by ' + formatCurrency(category.variance)
																}}
															</span>
														</div>
													</div>
												</div>
											</template>
										</UAccordion>

										<!-- <div class="mt-3 text-xs text-gray-600">
										{{ category.transactionCount }} transactions in this category
									</div> -->
									</div>
								</div>
							</UCard>
						</div>
						<div v-else class="space-y-6">
							<h3 class="uppercase tracking-wide text-center w-full py-20">
								Switch to
								<span @click="selectedAccount = 1" class="text-[var(--cyan)] cursor-pointer">operating account</span>
								to view budget analysis.
							</h3>
						</div>
					</template>
					<!-- Category Analysis Tab -->
					<template #categories>
						<div v-if="selectedAccount === 1" class="space-y-6">
							<!-- Filters -->
							<UCard>
								<div class="flex flex-wrap gap-4 items-center">
									<div class="flex items-center gap-2">
										<label class="text-sm font-medium text-gray-700">Category:</label>
										<USelect v-model="selectedCategory" :options="categoryOptions" size="sm" class="w-48" />
									</div>
									<UButton @click="selectedCategory = 'all'" size="sm" variant="outline">Clear Filter</UButton>
								</div>
							</UCard>

							<!-- Category Budget Comparison -->
							<UCard>
								<template #header>
									<h3 class="text-lg font-semibold uppercase tracking-wide">
										BUDGET VS ACTUAL [{{ accountMetrics.isYTD ? 'YTD' : getRangeDescription() }}]
									</h3>
									<p class="text-sm text-gray-600 mt-2" v-if="!accountMetrics.isYTD">
										Note: Budget figures are pro-rated for {{ getMonthsInRange().length }} month{{
											getMonthsInRange().length !== 1 ? 's' : ''
										}}. Actuals shown for the same period.
									</p>
								</template>
								<UTable :rows="accountBudgetComparison" :columns="budgetColumns">
									<template #category_name-data="{row}">
										<div class="flex items-center gap-2">
											<div class="w-4 h-4 rounded-full" :style="{backgroundColor: row.color}"></div>
											<span class="font-medium">{{ row.category_name }}</span>
										</div>
									</template>
									<template #monthlyBudget-data="{row}">
										<span class="text-sm text-gray-600">{{ formatCurrency(row.monthlyBudget) }}</span>
									</template>
									<template #budget-data="{row}">
										<span class="text-gray-900">{{ formatCurrency(row.budget) }}</span>
									</template>
									<template #actual-data="{row}">
										<span class="font-semibold">{{ formatCurrency(row.actual) }}</span>
									</template>
									<template #variance-data="{row}">
										<span :class="row.variance >= 0 ? 'text-red-600' : 'text-green-600'" class="font-semibold">
											{{ row.variance >= 0 ? '+' : '' }}{{ formatCurrency(Math.abs(row.variance)) }}
										</span>
									</template>
									<template #percentVariance-data="{row}">
										<span :class="row.percentVariance >= 0 ? 'text-red-600' : 'text-green-600'" class="font-semibold">
											{{ row.percentVariance >= 0 ? '+' : '' }}{{ row.percentVariance }}%
										</span>
									</template>
									<template #status-data="{row}">
										<UBadge :color="row.statusColor" variant="soft" size="xs">
											{{ row.status }}
										</UBadge>
									</template>
								</UTable>
							</UCard>

							<!-- Category Transactions -->
							<UCard v-if="selectedCategory !== 'all'">
								<template #header>
									<div class="flex items-center justify-between">
										<h3 class="text-lg font-semibold uppercase tracking-wide">
											{{ getCategoryDisplayName(selectedCategory) }} TRANSACTIONS
										</h3>
										<UBadge color="primary" variant="soft">{{ accountTransactions.length }} TRANSACTIONS</UBadge>
									</div>
								</template>
								<UTable :rows="accountTransactions.slice(0, 50)" :columns="transactionColumns">
									<template #transaction_date-data="{row}">
										<span class="font-mono text-sm">{{ formatDate(row.transaction_date) }}</span>
									</template>
									<template #transaction_type-data="{row}">
										<UBadge :color="getTransactionTypeColor(row.transaction_type)" variant="soft" size="xs">
											{{ (row.transaction_type || 'unknown').toUpperCase() }}
										</UBadge>
									</template>
									<template #amount-data="{row}">
										<span class="font-bold" :class="getAmountColor(row.transaction_type, row.amount)">
											{{ getAmountDisplay(row.transaction_type, row.amount) }}
										</span>
									</template>
									<template #vendor-data="{row}">
										<span class="text-sm">{{ row.vendor || 'N/A' }}</span>
									</template>
								</UTable>
							</UCard>
						</div>

						<div v-else class="space-y-6">
							<h3 class="uppercase tracking-wide text-center w-full py-20">
								Switch to
								<span @click="selectedAccount = 1" class="text-[var(--cyan)] cursor-pointer">operating account</span>
								to view category analysis.
							</h3>
						</div>
					</template>

					<!-- Vendor Analysis Tab -->
					<template #vendors>
						<div v-if="selectedAccount !== 1 || selectedAccount !== 3" class="space-y-6">
							<!-- Filters -->
							<UCard>
								<div class="flex flex-wrap gap-4 items-center">
									<div class="flex items-center gap-2">
										<label class="text-sm font-medium text-gray-700">Vendor:</label>
										<USelect v-model="selectedVendor" :options="vendorOptions" size="sm" class="w-48" />
									</div>
									<UButton @click="selectedVendor = 'all'" size="sm" variant="outline">Clear Filter</UButton>
								</div>
							</UCard>

							<!-- Vendor Summary -->
							<!-- <UCard>
							<template #header>
								<h3 class="text-lg font-semibold uppercase tracking-wide">VENDOR SPENDING ANALYSIS</h3>
							</template>
							<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
								<div class="text-center p-4">
									<p class="text-2xl font-bold text-red-600">{{ formatCurrency(getTotalVendorSpending()) }}</p>
									<p class="text-sm text-gray-500">Total Vendor Spending</p>
								</div>
								<div class="text-center p-4">
									<p class="text-2xl font-bold text-blue-600">{{ vendorBreakdown.length }}</p>
									<p class="text-sm text-gray-500">Unique Vendors</p>
								</div>
								<div class="text-center p-4">
									<p class="text-2xl font-bold text-green-600">{{ getLargestVendorAmount() }}</p>
									<p class="text-sm text-gray-500">Largest Vendor</p>
								</div>
								<div class="text-center p-4">
									<p class="text-2xl font-bold text-orange-600">{{ getAverageVendorSpending() }}</p>
									<p class="text-sm text-gray-500">Average per Vendor</p>
								</div>
							</div>
						</UCard> -->

							<!-- Grouped Vendor Transactions -->
							<UCard>
								<template #header>
									<h3 class="text-lg font-semibold uppercase tracking-wide">
										VENDOR TRANSACTIONS WITH TOTALS - {{ getRangeDescription() }}
									</h3>
									<p class="text-sm text-gray-600 mt-2">
										Each vendor shows individual transactions and totals. Only expense transactions are included.
									</p>
								</template>

								<div class="space-y-6">
									<div
										v-for="vendorGroup in groupedVendorTransactions.slice(0, 15)"
										:key="vendorGroup.vendor"
										class="border rounded-lg p-4 bg-gray-50">
										<!-- Vendor Header -->
										<div class="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
											<div class="flex items-center gap-3">
												<div class="w-3 h-3 rounded-full bg-red-600"></div>
												<div>
													<h4 class="font-semibold text-lg">{{ vendorGroup.vendor }}</h4>
													<div class="flex items-center gap-4 text-sm text-gray-600">
														<span>{{ vendorGroup.transactionCount }} transactions</span>
														<span>{{ vendorGroup.categories.join(', ') }}</span>
														<span>Months: {{ vendorGroup.monthSpread.join(', ') }}</span>
													</div>
												</div>
											</div>
											<div class="text-right">
												<div class="text-2xl font-bold text-red-600">{{ formatCurrency(vendorGroup.totalAmount) }}</div>
												<div class="text-xs text-gray-500">Total Spent</div>
											</div>
										</div>

										<!-- Individual Transactions -->
										<div class="space-y-2">
											<div
												v-for="transaction in vendorGroup.transactions"
												:key="transaction.id"
												class="flex items-center justify-between py-2 px-3 bg-white rounded border">
												<div class="flex items-center gap-3">
													<span class="font-mono text-sm text-gray-600">
														{{ formatDate(transaction.transaction_date) }}
													</span>
													<span class="text-sm">{{ transaction.description }}</span>
													<UBadge
														v-if="transaction.category_id"
														variant="soft"
														size="xs"
														:style="{
															backgroundColor: getCategoryColor(transaction.category_id) + '20',
															color: getCategoryColor(transaction.category_id),
														}">
														{{ getCategoryName(transaction.category_id) }}
													</UBadge>
												</div>
												<div class="text-right">
													<span class="font-bold text-red-600">{{ formatCurrency(transaction.amount) }}</span>
												</div>
											</div>
										</div>
									</div>

									<!-- Show More Link -->
									<div v-if="groupedVendorTransactions.length > 15" class="text-center py-4">
										<p class="text-sm text-gray-500">
											Showing top 15 vendors. Total of {{ groupedVendorTransactions.length }} vendors with transactions.
										</p>
									</div>
								</div>
							</UCard>

							<!-- Single Vendor Filter View -->
							<UCard v-if="selectedVendor !== 'all'">
								<template #header>
									<div class="flex items-center justify-between">
										<h3 class="text-lg font-semibold uppercase tracking-wide">
											{{ getVendorDisplayName(selectedVendor) }} TRANSACTIONS
										</h3>
										<UBadge color="primary" variant="soft">{{ accountTransactions.length }} TRANSACTIONS</UBadge>
									</div>
								</template>
								<UTable :rows="accountTransactions.slice(0, 50)" :columns="transactionColumns">
									<template #transaction_date-data="{row}">
										<span class="font-mono text-sm">{{ formatDate(row.transaction_date) }}</span>
									</template>
									<template #transaction_type-data="{row}">
										<UBadge :color="getTransactionTypeColor(row.transaction_type)" variant="soft" size="xs">
											{{ (row.transaction_type || 'unknown').toUpperCase() }}
										</UBadge>
									</template>
									<template #amount-data="{row}">
										<span class="font-bold" :class="getAmountColor(row.transaction_type, row.amount)">
											{{ getAmountDisplay(row.transaction_type, row.amount) }}
										</span>
									</template>
									<template #description-data="{row}">
										<span class="text-sm">{{ row.description }}</span>
									</template>
								</UTable>
							</UCard>
						</div>
					</template>

					<!-- Transactions Tab -->
					<template #transactions>
						<div class="space-y-6">
							<!-- Transaction Filters -->
							<UCard>
								<div class="flex flex-wrap gap-4 items-center">
									<div class="flex items-center gap-2">
										<label class="text-sm font-medium text-gray-700">Category:</label>
										<USelect v-model="selectedCategory" :options="categoryOptions" size="sm" class="w-40" />
									</div>
									<div class="flex items-center gap-2">
										<label class="text-sm font-medium text-gray-700">Vendor:</label>
										<USelect v-model="selectedVendor" :options="vendorOptions" size="sm" class="w-40" />
									</div>
									<UButton @click="clearAllFilters" size="sm" variant="outline">Clear All Filters</UButton>
									<UButton
										@click="refreshAll"
										:loading="loading"
										icon="i-heroicons-arrow-path"
										size="sm"
										variant="outline">
										Refresh
									</UButton>
								</div>
							</UCard>

							<!-- Filtered Transactions Summary -->
							<UCard v-if="selectedCategory !== 'all' || selectedVendor !== 'all'">
								<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
									<div class="text-center p-4">
										<p class="text-2xl font-bold text-blue-600">{{ accountTransactions.length }}</p>
										<p class="text-sm text-gray-500">Filtered Transactions</p>
									</div>
									<div class="text-center p-4">
										<p class="text-2xl font-bold text-red-600">{{ formatCurrency(getFilteredExpenseTotal()) }}</p>
										<p class="text-sm text-gray-500">Total Expenses</p>
									</div>
									<div class="text-center p-4">
										<p class="text-2xl font-bold text-green-600">{{ formatCurrency(getFilteredRevenueTotal()) }}</p>
										<p class="text-sm text-gray-500">Total Revenue</p>
									</div>
								</div>
							</UCard>

							<!-- All Transactions Table -->
							<UCard>
								<template #header>
									<div class="flex items-center justify-between">
										<h3 class="text-lg font-semibold uppercase tracking-wide">ALL TRANSACTIONS</h3>
										<UBadge color="primary" variant="soft">
											{{ accountTransactions.length }} OF {{ allAccountTransactions.length }} TOTAL
										</UBadge>
									</div>
								</template>
								<UTable :rows="displayTransactions" :columns="transactionColumnsDetailed">
									<template #transaction_date-data="{row}">
										<span class="font-mono text-sm">{{ formatDate(row.transaction_date) }}</span>
									</template>
									<template #transaction_type-data="{row}">
										<UBadge :color="getTransactionTypeColor(row.transaction_type)" variant="soft" size="xs">
											{{ (row.transaction_type || 'unknown').toUpperCase() }}
										</UBadge>
									</template>
									<template #amount-data="{row}">
										<span class="font-bold" :class="getAmountColor(row.transaction_type, row.amount)">
											{{ getAmountDisplay(row.transaction_type, row.amount) }}
										</span>
									</template>
									<template #category_id-data="{row}">
										<div class="flex items-center gap-2" v-if="row.category_id">
											<div
												class="w-3 h-3 rounded-full"
												:style="{backgroundColor: getCategoryColor(row.category_id)}"></div>
											<span class="text-xs">{{ getCategoryName(row.category_id) }}</span>
										</div>
										<span v-else class="text-xs text-gray-400">Uncategorized</span>
									</template>
									<template #is_violation-data="{row}">
										<UBadge v-if="row.is_violation" color="red" variant="solid" size="xs">VIOLATION</UBadge>
										<UBadge v-else-if="isTransferTransaction(row)" color="blue" variant="soft" size="xs">
											TRANSFER
										</UBadge>
										<UBadge v-else color="green" variant="soft" size="xs">NORMAL</UBadge>
									</template>
								</UTable>
							</UCard>
						</div>
					</template>
				</UTabs>
			</div>
			<div v-else-if="selectedAccount === 'info'" class="space-y-6">
				<FinancialsOperatingBudget />
			</div>
		</div>
	</div>
</template>

<script setup>
import {Line} from 'vue-chartjs';
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	BarElement,
	Title,
	Tooltip,
	Legend,
	Filler,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

// Use the enhanced composable
const {
	selectedYear,
	selectedAccount,
	selectedCategory,
	selectedVendor,
	selectedStartMonth,
	selectedEndMonth,
	loading,
	error,
	accounts,
	budgetCategories,
	accountTransactions,
	allAccountTransactions,
	accountMetrics,
	accountYTDMetrics,
	categoryBreakdown,
	vendorBreakdown,
	groupedVendorTransactions,
	accountMonthlyTrend,
	currentAccountBalance,
	accountBudgetComparison,
	yearOptions,
	monthOptions,
	categoryOptions,
	vendorOptions,
	budgetComparison,
	budgetSummary,
	budgetProjection,
	budget2025,
	latestMonthWithData,
	getMonthsInRange,
	getCategoryTransactions,
	getLargestTransaction,
	getCategoryMonthSpread,
	refreshAll,
	formatCurrency,
	getMonthName,
	getAccountById,
	isTransferTransaction,
	getRangeDescription,
} = useHOAFinancialsEnhanced();

// Component state
const activeTab = ref(0);

// Content tabs
const contentTabs = computed(() => [
	{
		slot: 'overview',
		label: 'OVERVIEW',
	},
	{
		slot: 'budget-analysis',
		label: 'BUDGET ANALYSIS',
		badge: budgetComparison.value.length || null,
	},
	{
		slot: 'categories',
		label: 'CATEGORY ANALYSIS',
	},
	{
		slot: 'vendors',
		label: 'VENDOR ANALYSIS',
	},
	{
		slot: 'transactions',
		label: 'ALL TRANSACTIONS',
		badge: accountTransactions.value.length || null,
	},
]);

const budgetComparisonColumns = [
	{key: 'category', label: 'CATEGORY'},
	{key: 'monthlyBudget', label: 'MONTHLY BUDGET'},
	{key: 'proRatedBudget', label: 'PERIOD BUDGET'},
	{key: 'actualAmount', label: 'ACTUAL SPENT'},
	{key: 'variance', label: 'VARIANCE'},
	{key: 'percentVariance', label: '%'},
	{key: 'status', label: 'STATUS'},
	{key: 'transactionCount', label: 'TRANSACTIONS'},
];

const budgetComparisonChartData = computed(() => {
	const monthlyTrend = accountMonthlyTrend.value;

	return {
		labels: monthlyTrend.map((d) => d.month),
		datasets: [
			{
				label: 'Monthly Budget',
				data: monthlyTrend.map(() => budget2025.totals.monthly),
				borderColor: 'rgb(59, 130, 246)',
				backgroundColor: 'rgba(59, 130, 246, 0.1)',
				borderDash: [5, 5],
				tension: 0,
			},
			{
				label: 'Actual Expenses',
				data: monthlyTrend.map((d) => d.expenses),
				borderColor: 'rgb(239, 68, 68)',
				backgroundColor: 'rgba(239, 68, 68, 0.1)',
				tension: 0.3,
			},
		],
	};
});

// Chart options for budget comparison
const budgetChartOptions = {
	responsive: true,
	maintainAspectRatio: false,
	plugins: {
		legend: {
			position: 'bottom',
		},
		tooltip: {
			callbacks: {
				label: (context) => `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`,
			},
		},
	},
	scales: {
		y: {
			beginAtZero: true,
			ticks: {
				callback: (value) => formatCurrency(value),
			},
		},
	},
};

const getCategorySlotName = (categoryName) => {
	return `transactions-${categoryName.toLowerCase().replace(/\s+/g, '-')}`;
};

// Chart data
const monthlyChartData = computed(() => ({
	labels: accountMonthlyTrend.value.map((d) => d.month),
	datasets: [
		{
			label: 'Revenue',
			data: accountMonthlyTrend.value.map((d) => d.revenue),
			borderColor: 'rgb(34, 197, 94)',
			backgroundColor: 'rgba(34, 197, 94, 0.1)',
			tension: 0.3,
			fill: false,
		},
		{
			label: 'Expenses',
			data: accountMonthlyTrend.value.map((d) => d.expenses),
			borderColor: 'rgb(239, 68, 68)',
			backgroundColor: 'rgba(239, 68, 68, 0.1)',
			tension: 0.3,
			fill: false,
		},
		{
			label: 'Account Balance',
			data: accountMonthlyTrend.value.map((d) => d.balance),
			borderColor: 'rgb(59, 130, 246)',
			backgroundColor: 'rgba(59, 130, 246, 0.1)',
			tension: 0.3,
			fill: false,
		},
	],
}));

// Chart options
const chartOptions = {
	responsive: true,
	maintainAspectRatio: false,
	plugins: {
		legend: {
			position: 'bottom',
		},
		tooltip: {
			callbacks: {
				label: (context) => `${context.dataset.label}: $${context.parsed.y.toLocaleString()}`,
			},
		},
	},
	scales: {
		y: {
			beginAtZero: true,
			ticks: {
				callback: (value) => '$' + value.toLocaleString(),
			},
		},
	},
};

const setToCurrentPeriod = () => {
	selectedStartMonth.value = 'all'; // From beginning of year
	selectedEndMonth.value = latestMonthWithData.value; // To latest month with data
};

// Table columns
const budgetColumns = [
	{key: 'category_name', label: 'CATEGORY'},
	{key: 'monthlyBudget', label: 'MONTHLY'}, // Add this
	{key: 'budget', label: 'PERIOD BUDGET'},
	{key: 'actual', label: 'ACTUAL'},
	{key: 'variance', label: 'VARIANCE'},
	{key: 'percentVariance', label: '%'},
	{key: 'status', label: 'STATUS'},
];

const transactionColumns = [
	{key: 'transaction_date', label: 'DATE'},
	{key: 'transaction_type', label: 'TYPE'},
	{key: 'description', label: 'DESCRIPTION'},
	{key: 'vendor', label: 'VENDOR'},
	{key: 'amount', label: 'AMOUNT'},
];

const transactionColumnsDetailed = [
	{key: 'transaction_date', label: 'DATE'},
	{key: 'transaction_type', label: 'TYPE'},
	{key: 'description', label: 'DESCRIPTION'},
	{key: 'vendor', label: 'VENDOR'},
	{key: 'category_id', label: 'CATEGORY'},
	{key: 'amount', label: 'AMOUNT'},
	{key: 'is_violation', label: 'STATUS'},
];

// Display data
// const displayTransactions = computed(() => accountTransactions.value.slice(0, 100) || []);

const displayTransactions = computed(() => {
	// For the "All Transactions" view, show unfiltered transactions when no filters are applied
	if (selectedCategory.value === 'all' && selectedVendor.value === 'all') {
		return allAccountTransactions.value.slice(0, 100) || [];
	}
	// Otherwise show filtered transactions
	return accountTransactions.value.slice(0, 100) || [];
});

// Helper functions
const formatDate = (dateString) => {
	return new Date(dateString).toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
	});
};

const getTransactionTypeColor = (type) => {
	const colors = {
		deposit: 'green',
		withdrawal: 'red',
		fee: 'orange',
		transfer_in: 'blue',
		transfer_out: 'blue',
		interest: 'green',
	};
	return colors[type] || 'gray';
};

const getAmountColor = (type, amount) => {
	if (type === 'deposit' || type === 'transfer_in' || type === 'interest') return 'text-green-600';
	if (type === 'withdrawal' || type === 'fee' || type === 'transfer_out') return 'text-red-600';
	return amount >= 0 ? 'text-green-600' : 'text-red-600';
};

const getAmountDisplay = (type, amount) => {
	const numAmount = Math.abs(parseFloat(amount) || 0);
	const formatted = formatCurrency(numAmount);

	if (type === 'deposit' || type === 'transfer_in' || type === 'interest') return `+${formatted}`;
	if (type === 'withdrawal' || type === 'fee' || type === 'transfer_out') return `-${formatted}`;
	return formatted;
};

const getCategoryDisplayName = (categoryValue) => {
	if (categoryValue === 'all') return 'All Categories';
	if (categoryValue === 'uncategorized') return 'Uncategorized';
	const category = budgetCategories.value.find((c) => c.id.toString() === categoryValue);
	return category ? category.category_name : 'Unknown Category';
};

const getVendorDisplayName = (vendorValue) => {
	if (vendorValue === 'all') return 'All Vendors';
	if (vendorValue === 'no_vendor') return 'No Vendor Listed';
	return vendorValue;
};

const getCategoryName = (categoryId) => {
	if (!categoryId) return 'Uncategorized';
	const category = budgetCategories.value.find((c) => c.id === categoryId);
	return category ? category.category_name : 'Unknown Category';
};

const getCategoryColor = (categoryId) => {
	if (!categoryId) return '#6B7280';
	const category = budgetCategories.value.find((c) => c.id === categoryId);
	return category ? category.color : '#6B7280';
};

const clearAllFilters = () => {
	selectedCategory.value = 'all';
	selectedVendor.value = 'all';
};

const getTotalVendorSpending = () => {
	return vendorBreakdown.value.reduce((sum, vendor) => sum + vendor.totalAmount, 0);
};

const getLargestVendorAmount = () => {
	if (vendorBreakdown.value.length === 0) return formatCurrency(0);
	return formatCurrency(vendorBreakdown.value[0].totalAmount);
};

const getAverageVendorSpending = () => {
	if (vendorBreakdown.value.length === 0) return formatCurrency(0);
	return formatCurrency(getTotalVendorSpending() / vendorBreakdown.value.length);
};

const getFilteredExpenseTotal = () => {
	return accountTransactions.value
		.filter((t) => t.transaction_type === 'withdrawal')
		.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
};

const getFilteredRevenueTotal = () => {
	return accountTransactions.value
		.filter((t) => t.transaction_type === 'deposit')
		.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
};

// Initialize
onMounted(() => {
	refreshAll();
});
</script>

<style scoped>
/* Custom styles for account tabs */
button:focus {
	outline: none;
}
</style>
