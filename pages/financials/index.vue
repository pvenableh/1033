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
		<Alert v-if="error && !loading" variant="destructive" class="mb-8">
			<Icon name="i-heroicons-exclamation-triangle" class="h-4 w-4" />
			<h5 class="mb-1 font-medium leading-none tracking-tight">{{ error }}</h5>
		</Alert>

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
									'py-4 px-6 text-sm font-medium border-b-2 transition-all duration-200',
									selectedAccount === account.id
										? 'border-blue-500 text-blue-600 bg-blue-50 shadow'
										: 'bg-[rgba(0,0,0,0.025)] border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
								]">
								<div class="flex items-center gap-3">
									<Icon
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
								</div>
							</button>
						</div>
						<button
							@click="selectedAccount = 'info'"
							:class="[
								'py-4 px-6 text-sm font-medium border-b-2 transition-all duration-200',
								selectedAccount === 'info'
									? 'border-blue-500 text-blue-600 bg-blue-50 shadow'
									: 'bg-[rgba(0,0,0,0.025)] border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
							]">
							<div class="flex items-center gap-3">
								<Icon name="lucide:chart-pie" class="w-6 h-6 text-[var(--cyan)]" />
								<div class="text-left uppercase tracking-wide">
									<div class="font-semibold">Operating Budget</div>
									<div class="text-xs text-gray-500">{{ selectedYear }}</div>
								</div>
							</div>
						</button>
					</nav>
				</div>
			</div>

			<!-- Account-Specific Content -->
			<div v-if="selectedAccount !== 'info'">
				<!-- Filters -->
				<div class="mb-6">
					<Card>
						<CardContent class="pt-6">
							<div class="flex flex-wrap gap-4 items-center">
								<div class="flex items-center gap-2">
									<label class="text-sm font-medium text-gray-700 uppercase">Fiscal Year:</label>
									<Select v-model="selectedYear" :options="yearOptions" class="w-24" />
								</div>
								<div class="flex items-center gap-2">
									<label class="text-sm font-medium text-gray-700 uppercase">From Month:</label>
									<Select v-model="selectedStartMonth" :options="monthOptions" class="w-32" />
								</div>
								<div class="flex items-center gap-2">
									<label class="text-sm font-medium text-gray-700 uppercase">To Month:</label>
									<Select v-model="selectedEndMonth" :options="monthOptions" class="w-32" />
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				<!-- OVERVIEW SECTION (Always Visible) -->
				<div class="space-y-6 mb-8">
					<div class="border-b pb-2">
						<h2 class="text-2xl font-bold uppercase tracking-wide">OVERVIEW</h2>
					</div>

					<!-- Key Metrics Cards -->
					<div class="grid grid-cols-1 md:grid-cols-4 gap-6">
						<Card class="text-center">
							<CardContent class="pt-6">
								<div class="space-y-2">
									<Icon name="i-heroicons-banknotes" class="w-8 h-8 mx-auto text-blue-600" />
									<p class="text-sm uppercase tracking-wider text-gray-600">CURRENT BALANCE</p>
									<p class="text-3xl font-bold text-blue-600">
										{{ formatCurrency(currentAccountBalance.current) }}
									</p>
									<p class="text-xs text-gray-500">FROM {{ formatCurrency(currentAccountBalance.previous) }}</p>
								</div>
							</CardContent>
						</Card>

						<Card class="text-center">
							<CardContent class="pt-6">
								<div class="space-y-2">
									<Icon name="i-heroicons-arrow-trending-up" class="w-8 h-8 mx-auto text-green-600" />
									<p class="text-sm uppercase tracking-wider text-gray-600">
										{{ accountMetrics?.isYTD ? 'YTD' : 'PERIOD' }} REVENUE
									</p>
									<p class="text-3xl font-bold text-green-600">
										{{ formatCurrency(accountMetrics?.revenue || 0) }}
									</p>
									<p class="text-xs text-gray-500">{{ accountMetrics?.monthsCount || 0 }} MONTHS</p>
								</div>
							</CardContent>
						</Card>

						<Card class="text-center">
							<CardContent class="pt-6">
								<div class="space-y-2">
									<Icon name="i-heroicons-arrow-trending-down" class="w-8 h-8 mx-auto text-red-600" />
									<p class="text-sm uppercase tracking-wider text-gray-600">
										{{ accountMetrics?.isYTD ? 'YTD' : 'PERIOD' }} EXPENSES
									</p>
									<p class="text-3xl font-bold text-red-600">
										{{ formatCurrency(accountMetrics?.expenses || 0) }}
									</p>
									<p class="text-xs text-gray-500">EXCLUDING TRANSFERS</p>
								</div>
							</CardContent>
						</Card>

						<Card class="text-center">
							<CardContent class="pt-6">
								<div class="space-y-2">
									<Icon
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
							</CardContent>
						</Card>
					</div>

					<!-- Monthly Cash Flow Chart -->
					<Card>
						<CardHeader>
							<CardTitle class="text-lg uppercase tracking-wide">MONTHLY CASH FLOW TREND</CardTitle>
							<CardDescription>
								Revenue, expenses, and balance progression for {{ currentAccountBalance.account?.account_name }}
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div class="flex items-center gap-4 mb-4">
								<VisBulletLegend :items="cashFlowLegendItems" />
							</div>
							<VisXYContainer
								v-if="accountMonthlyTrend.length > 0"
								:data="accountMonthlyTrend"
								:height="320"
								:margin="{ left: 60, right: 20, top: 10, bottom: 30 }">
								<VisLine
									:x="(d, i) => i"
									:y="[(d) => d.revenue, (d) => d.expenses, (d) => d.balance]"
									:color="['rgb(34, 197, 94)', 'rgb(239, 68, 68)', 'rgb(59, 130, 246)']"
									:curveType="CurveType.MonotoneX" />
								<VisAxis
									type="x"
									:tickFormat="(v) => accountMonthlyTrend[Math.round(v)]?.month || ''"
									:tickValues="accountMonthlyTrend.map((d, i) => i)"
									:tickLine="false"
									:domainLine="false" />
								<VisAxis
									type="y"
									:tickFormat="(v) => '$' + Math.round(v).toLocaleString()"
									:gridLine="true"
									:tickLine="false"
									:domainLine="false" />
							</VisXYContainer>
							<div v-else class="h-80 flex items-center justify-center text-muted-foreground">
								No monthly data available
							</div>
						</CardContent>
					</Card>

					<!-- Top Categories & Vendors Grid -->
					<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
						<Card>
							<CardHeader>
								<CardTitle class="text-lg uppercase tracking-wide">TOP CATEGORIES</CardTitle>
							</CardHeader>
							<CardContent>
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
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle class="text-lg uppercase tracking-wide">TOP VENDORS</CardTitle>
							</CardHeader>
							<CardContent>
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
							</CardContent>
						</Card>
					</div>
				</div>

				<!-- ANALYSIS TABS -->
				<Tabs v-model="activeTab" :items="contentTabs" class="space-y-6">
					<!-- Budget & Categories Tab -->
					<template #budget-categories>
						<div v-if="selectedAccount === 1" class="space-y-6">
							<!-- Budget Summary Cards -->
							<div class="grid grid-cols-1 md:grid-cols-4 gap-6">
								<Card class="text-center">
									<CardContent class="pt-6">
										<div class="space-y-2">
											<Icon name="i-heroicons-calculator" class="w-8 h-8 mx-auto text-blue-600" />
											<p class="text-sm uppercase tracking-wider text-gray-600">
												{{ budgetSummary.isYearToDate ? 'ANNUAL' : 'PERIOD' }} BUDGET
											</p>
											<p class="text-3xl font-bold text-blue-600">
												{{ formatCurrency(budgetSummary.totalBudgeted) }}
											</p>
											<p class="text-xs text-gray-500">{{ budgetSummary.monthsSelected }} MONTHS</p>
										</div>
									</CardContent>
								</Card>

								<Card class="text-center">
									<CardContent class="pt-6">
										<div class="space-y-2">
											<Icon name="i-heroicons-banknotes" class="w-8 h-8 mx-auto text-red-600" />
											<p class="text-sm uppercase tracking-wider text-gray-600">ACTUAL SPENDING</p>
											<p class="text-3xl font-bold text-red-600">
												{{ formatCurrency(budgetSummary.totalActual) }}
											</p>
											<p class="text-xs text-gray-500">EXCLUDING TRANSFERS</p>
										</div>
									</CardContent>
								</Card>

								<Card class="text-center">
									<CardContent class="pt-6">
										<div class="space-y-2">
											<Icon
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
									</CardContent>
								</Card>

								<Card class="text-center">
									<CardContent class="pt-6">
										<div class="space-y-2">
											<Icon
												name="i-heroicons-chart-bar"
												class="w-8 h-8 mx-auto"
												:class="`text-${budgetSummary.statusColor}-600`" />
											<p class="text-sm uppercase tracking-wider text-gray-600">STATUS</p>
											<Badge :color="budgetSummary.statusColor" variant="soft" size="lg" class="text-sm px-3 py-1">
												{{ budgetSummary.overallStatus }}
											</Badge>
											<p class="text-xs text-gray-500">
												AVG: {{ formatCurrency(budgetSummary.averageMonthlyActual) }}/MONTH
											</p>
										</div>
									</CardContent>
								</Card>
							</div>

							<!-- Budget vs Actual Table -->
							<Card>
								<CardHeader>
									<div class="flex items-center justify-between">
										<CardTitle class="text-lg uppercase tracking-wide">
											BUDGET VS ACTUAL BY CATEGORY [{{ getRangeDescription() }} {{ selectedYear }}]
										</CardTitle>
										<Badge color="primary" variant="soft">
											{{ budgetSummary.monthsSelected }} MONTH{{ budgetSummary.monthsSelected !== 1 ? 'S' : '' }}
										</Badge>
									</div>
								</CardHeader>
								<CardContent>
									<Table :rows="budgetComparison" :columns="budgetComparisonColumns">
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
											<Badge :color="row.statusColor" variant="soft" size="xs">
												{{ row.status }}
											</Badge>
										</template>
										<template #transactionCount-data="{row}">
											<span class="text-xs text-gray-500">{{ row.transactionCount }}</span>
										</template>
									</Table>
								</CardContent>
							</Card>

							<!-- Budget vs Actual Chart -->
							<Card>
								<CardHeader>
									<CardTitle class="text-lg uppercase tracking-wide">BUDGET VS ACTUAL TREND</CardTitle>
									<CardDescription>Monthly comparison of budgeted vs actual spending</CardDescription>
								</CardHeader>
								<CardContent>
									<div class="flex items-center gap-4 mb-4">
										<VisBulletLegend :items="budgetChartLegendItems" />
									</div>
									<VisXYContainer
										v-if="accountMonthlyTrend.length > 0"
										:data="accountMonthlyTrend"
										:height="320"
										:margin="{ left: 60, right: 20, top: 10, bottom: 30 }">
										<VisLine
											:x="(d, i) => i"
											:y="(d) => budget2025.totals.monthly"
											color="rgb(59, 130, 246)"
											:lineWidth="2"
											:lineDashArray="[5, 5]" />
										<VisLine
											:x="(d, i) => i"
											:y="(d) => d.expenses"
											color="rgb(239, 68, 68)"
											:lineWidth="2"
											:curveType="CurveType.MonotoneX" />
										<VisAxis
											type="x"
											:tickFormat="(v) => accountMonthlyTrend[Math.round(v)]?.month || ''"
											:tickValues="accountMonthlyTrend.map((d, i) => i)"
											:tickLine="false"
											:domainLine="false" />
										<VisAxis
											type="y"
											:tickFormat="(v) => formatCurrency(v)"
											:gridLine="true"
											:tickLine="false"
											:domainLine="false" />
									</VisXYContainer>
									<div v-else class="h-80 flex items-center justify-center text-muted-foreground">
										No monthly data available
									</div>
								</CardContent>
							</Card>

							<!-- Detailed Category Analysis -->
							<Card>
								<CardHeader>
									<CardTitle class="text-lg uppercase tracking-wide">DETAILED CATEGORY ANALYSIS</CardTitle>
								</CardHeader>
								<CardContent>
									<div class="space-y-6">
										<div
											v-for="category in budgetComparison.filter((c) => c.actualAmount > 0)"
											:key="category.category"
											class="border-2 rounded-sm p-4"
											:class="{
												'border-red-200': category.statusColor === 'red',
												'border-orange-200': category.statusColor === 'orange',
												'border-yellow-200': category.statusColor === 'yellow',
												'border-green-200': category.statusColor === 'green',
												'border-blue-200': category.statusColor === 'blue',
											}">
											<div class="flex items-center justify-between mb-3">
												<h4 class="font-semibold text-lg uppercase tracking-wide">{{ category.category }}</h4>
												<Badge :color="category.statusColor" variant="soft" class="uppercase font-semibold">
													{{ category.status }}
												</Badge>
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

											<Accordion
												:items="[
													{
														label: `View ${category.transactionCount} Transactions`,
														slot: getCategorySlotName(category.category),
														defaultOpen: false,
													},
												]">
												<template #[getCategorySlotName(category.category)]>
													<div class="space-y-3 mt-4">
														<div class="bg-white p-3 rounded uppercase tracking-wide text-sm">
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
																	</div>
																</div>
															</div>
														</div>

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
											</Accordion>
										</div>
									</div>
								</CardContent>
							</Card>
						</div>
						<div v-else class="text-center py-20">
							<p class="text-gray-600">
								Switch to
								<span @click="selectedAccount = 1" class="text-blue-600 cursor-pointer hover:underline">
									operating account
								</span>
								to view budget analysis.
							</p>
						</div>
					</template>

					<!-- Vendor Analysis Tab -->
					<template #vendors>
						<div class="space-y-6">
							<Card>
								<CardContent class="pt-6">
									<div class="flex flex-wrap gap-4 items-center">
										<div class="flex items-center gap-2">
											<label class="text-sm font-medium text-gray-700">Vendor:</label>
											<Select v-model="selectedVendor" :options="vendorOptions" class="w-48" />
										</div>
										<Button @click="selectedVendor = 'all'" size="sm" variant="outline">Clear Filter</Button>
									</div>
								</CardContent>
							</Card>

							<Card>
								<CardHeader>
									<CardTitle class="text-lg uppercase tracking-wide">
										VENDOR TRANSACTIONS WITH TOTALS [{{ getRangeDescription() }}]
									</CardTitle>
									<CardDescription>
										Each vendor shows individual transactions and totals. Only expense transactions are included.
									</CardDescription>
								</CardHeader>
								<CardContent>
									<div class="space-y-6">
										<div
											v-for="vendorGroup in groupedVendorTransactions.slice(0, 15)"
											:key="vendorGroup.vendor"
											class="border rounded-lg p-4 bg-gray-50">
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
														<Badge
															v-if="transaction.category_id"
															variant="soft"
															size="xs"
															:style="{
																backgroundColor: getCategoryColor(transaction.category_id) + '20',
																color: getCategoryColor(transaction.category_id),
															}">
															{{ getCategoryName(transaction.category_id) }}
														</Badge>
													</div>
													<div class="text-right">
														<span class="font-bold text-red-600">{{ formatCurrency(transaction.amount) }}</span>
													</div>
												</div>
											</div>
										</div>

										<div v-if="groupedVendorTransactions.length > 15" class="text-center py-4">
											<p class="text-sm text-gray-500">
												Showing top 15 vendors. Total of {{ groupedVendorTransactions.length }} vendors with transactions.
											</p>
										</div>
									</div>
								</CardContent>
							</Card>

							<Card v-if="selectedVendor !== 'all'">
								<CardHeader>
									<div class="flex items-center justify-between">
										<CardTitle class="text-lg uppercase tracking-wide">
											{{ getVendorDisplayName(selectedVendor) }} TRANSACTIONS
										</CardTitle>
										<Badge color="primary" variant="soft">{{ accountTransactions.length }} TRANSACTIONS</Badge>
									</div>
								</CardHeader>
								<CardContent>
									<Table :rows="accountTransactions.slice(0, 50)" :columns="transactionColumns">
										<template #transaction_date-data="{row}">
											<span class="font-mono text-sm">{{ formatDate(row.transaction_date) }}</span>
										</template>
										<template #transaction_type-data="{row}">
											<Badge :color="getTransactionTypeColor(row.transaction_type)" variant="soft" size="xs">
												{{ (row.transaction_type || 'unknown').toUpperCase() }}
											</Badge>
										</template>
										<template #amount-data="{row}">
											<span class="font-bold" :class="getAmountColor(row.transaction_type, row.amount)">
												{{ getAmountDisplay(row.transaction_type, row.amount) }}
											</span>
										</template>
										<template #description-data="{row}">
											<span class="text-sm">{{ row.description }}</span>
										</template>
									</Table>
								</CardContent>
							</Card>
						</div>
					</template>

					<!-- All Transactions Tab -->
					<template #transactions>
						<div class="space-y-6">
							<Card>
								<CardContent class="pt-6">
									<div class="flex flex-wrap gap-4 items-center">
										<div class="flex items-center gap-2">
											<label class="text-sm font-medium text-gray-700 uppercase">Search:</label>
											<Input
												v-model="searchQuery"
												placeholder="Search description, vendor, amount..."
												class="w-64 h-9" />
										</div>
										<div class="flex items-center gap-2">
											<label class="text-sm font-medium text-gray-700 uppercase">Category:</label>
											<Select v-model="selectedCategory" :options="categoryOptions" class="w-40" />
										</div>
										<div class="flex items-center gap-2">
											<label class="text-sm font-medium text-gray-700 uppercase">Vendor:</label>
											<Select v-model="selectedVendor" :options="vendorOptions" class="w-40" />
										</div>
										<Button @click="clearAllFilters" size="sm" variant="outline">Clear All Filters</Button>
									</div>
								</CardContent>
							</Card>

							<Card v-if="selectedCategory !== 'all' || selectedVendor !== 'all'">
								<CardContent class="pt-6">
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
								</CardContent>
							</Card>

							<Card>
								<CardHeader>
									<div class="flex items-center justify-between">
										<CardTitle class="text-lg uppercase tracking-wide">ALL TRANSACTIONS</CardTitle>
										<Badge color="primary" variant="soft">
											{{ accountTransactions.length }} OF {{ allAccountTransactions.length }} TOTAL
										</Badge>
									</div>
								</CardHeader>
								<CardContent>
									<Table :rows="displayTransactions" :columns="transactionColumnsDetailed">
										<template #transaction_date-data="{row}">
											<span class="font-mono text-sm">{{ formatDate(row.transaction_date) }}</span>
										</template>
										<template #transaction_type-data="{row}">
											<Badge :color="getTransactionTypeColor(row.transaction_type)" variant="soft" size="xs">
												{{ (row.transaction_type || 'unknown').toUpperCase() }}
											</Badge>
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
											<Badge v-if="row.is_violation" color="red" variant="solid" size="xs">VIOLATION</Badge>
											<Badge v-else-if="isTransferTransaction(row)" color="blue" variant="soft" size="xs">TRANSFER</Badge>
											<Badge v-else color="green" variant="soft" size="xs">NORMAL</Badge>
										</template>
									</Table>
								</CardContent>
							</Card>
						</div>
					</template>

					<!-- Compliance Tab -->
					<template #compliance>
						<div class="space-y-6">
							<Card>
								<CardContent class="pt-6">
									<div class="flex gap-2">
										<Button
											@click="complianceView = 'transfers'"
											:variant="complianceView === 'transfers' ? 'default' : 'outline'"
											size="sm">
											<Icon name="i-heroicons-arrows-right-left" class="w-4 h-4 mr-2" />
											Transfer Reconciliation
											<Badge v-if="transferActivity.unmatchedCount > 0" color="red" class="ml-2">
												{{ transferActivity.unmatchedCount }}
											</Badge>
										</Button>
										<Button
											@click="complianceView = 'clumped'"
											:variant="complianceView === 'clumped' ? 'default' : 'outline'"
											size="sm">
											<Icon name="i-heroicons-exclamation-triangle" class="w-4 h-4 mr-2" />
											Fund Mixing Issues
											<Badge v-if="clumpedPayments.length > 0" color="red" class="ml-2">
												{{ clumpedPayments.length }}
											</Badge>
										</Button>
									</div>
								</CardContent>
							</Card>

							<!-- Transfers View -->
							<div v-show="complianceView === 'transfers'" class="space-y-6">
								<Alert v-if="transferActivity.unmatchedCount > 0" variant="destructive">
									<Icon name="i-heroicons-exclamation-triangle" class="h-4 w-4" />
									<h5 class="mb-1 font-bold leading-none tracking-tight">TRANSFER RECONCILIATION REQUIRED</h5>
									<div class="text-sm">
										{{ transferActivity.unmatchedCount }} unmatched transfer{{
											transferActivity.unmatchedCount !== 1 ? 's' : ''
										}}
										detected. These may represent fund mixing violations or missing data.
									</div>
								</Alert>

								<Alert
									v-else-if="transferActivity.totalTransfers > 0"
									variant="success"
									title="All Transfers Reconciled">
									<div class="text-sm">
										All {{ transferActivity.totalTransfers }} transfers are properly matched and linked.
									</div>
								</Alert>

								<div class="grid grid-cols-1 md:grid-cols-5 gap-6">
									<Card class="text-center">
										<CardContent class="pt-6">
											<div class="space-y-2">
												<Icon name="i-heroicons-arrows-right-left" class="w-8 h-8 mx-auto text-purple-600" />
												<p class="text-sm uppercase tracking-wider text-gray-600">TOTAL TRANSFERS</p>
												<p class="text-2xl font-bold text-purple-600">{{ transferActivity.totalTransfers }}</p>
											</div>
										</CardContent>
									</Card>

									<Card class="text-center">
										<CardContent class="pt-6">
											<div class="space-y-2">
												<Icon name="i-heroicons-arrow-up-circle" class="w-8 h-8 mx-auto text-green-600" />
												<p class="text-sm uppercase tracking-wider text-gray-600">TRANSFERS IN</p>
												<p class="text-2xl font-bold text-green-600">
													{{ formatCurrency(transferActivity.transfersIn) }}
												</p>
											</div>
										</CardContent>
									</Card>

									<Card class="text-center">
										<CardContent class="pt-6">
											<div class="space-y-2">
												<Icon name="i-heroicons-arrow-down-circle" class="w-8 h-8 mx-auto text-red-600" />
												<p class="text-sm uppercase tracking-wider text-gray-600">TRANSFERS OUT</p>
												<p class="text-2xl font-bold text-red-600">{{ formatCurrency(transferActivity.transfersOut) }}</p>
											</div>
										</CardContent>
									</Card>

									<Card class="text-center">
										<CardContent class="pt-6">
											<div class="space-y-2">
												<Icon name="i-heroicons-link" class="w-8 h-8 mx-auto text-blue-600" />
												<p class="text-sm uppercase tracking-wider text-gray-600">LINKED</p>
												<p class="text-2xl font-bold text-blue-600">{{ transferActivity.linkedCount }}</p>
											</div>
										</CardContent>
									</Card>

									<Card
										class="text-center"
										:class="transferActivity.unmatchedCount > 0 ? 'ring-2 ring-red-500 ring-offset-2' : ''">
										<CardContent class="pt-6">
											<div class="space-y-2">
												<Icon
													name="i-heroicons-exclamation-triangle"
													class="w-8 h-8 mx-auto"
													:class="
														transferActivity.unmatchedCount > 0 ? 'text-red-600 animate-pulse' : 'text-green-600'
													" />
												<p class="text-sm uppercase tracking-wider text-gray-600">UNMATCHED</p>
												<p
													class="text-2xl font-bold"
													:class="transferActivity.unmatchedCount > 0 ? 'text-red-600' : 'text-green-600'">
													{{ transferActivity.unmatchedCount }}
												</p>
											</div>
										</CardContent>
									</Card>
								</div>

								<Card v-if="unmatchedTransfers.length > 0" class="border-2 border-red-500">
									<CardHeader>
										<div class="flex items-center justify-between">
											<div class="flex items-center gap-3">
												<Icon name="i-heroicons-exclamation-triangle" class="w-6 h-6 text-red-600 animate-pulse" />
												<div>
													<CardTitle class="text-lg uppercase tracking-wide text-red-800">
														UNMATCHED TRANSFERS - ACTION REQUIRED
													</CardTitle>
													<p class="text-sm text-red-600 mt-1 font-medium">
														These transfers don't have matching counterparts
													</p>
												</div>
											</div>
											<Badge color="red" variant="solid" size="lg">{{ unmatchedTransfers.length }}</Badge>
										</div>
									</CardHeader>
									<CardContent>
										<Table
											:rows="unmatchedTransfers"
											:columns="[
												{key: 'transaction_date', label: 'DATE'},
												{key: 'transaction_type', label: 'TYPE'},
												{key: 'description', label: 'DESCRIPTION'},
												{key: 'amount', label: 'AMOUNT'},
											]">
											<template #transaction_date-data="{row}">
												<span class="font-mono text-sm">{{ formatDate(row.transaction_date) }}</span>
											</template>
											<template #transaction_type-data="{row}">
												<Badge :color="row.transaction_type === 'withdrawal' ? 'red' : 'green'" variant="solid" size="sm">
													{{ row.transaction_type === 'withdrawal' ? 'OUT' : 'IN' }}
												</Badge>
											</template>
											<template #amount-data="{row}">
												<span
													class="font-bold text-lg"
													:class="row.transaction_type === 'withdrawal' ? 'text-red-600' : 'text-green-600'">
													{{ formatCurrency(row.amount) }}
												</span>
											</template>
										</Table>
									</CardContent>
								</Card>

								<Card v-if="transferPairs.length > 0">
									<CardHeader>
										<CardTitle class="text-lg uppercase tracking-wide">LINKED TRANSFER PAIRS</CardTitle>
										<CardDescription>Properly matched transfers across accounts</CardDescription>
									</CardHeader>
									<CardContent>
										<div class="space-y-4">
											<div
												v-for="pair in transferPairs"
												:key="pair.id"
												class="border border-green-200 bg-green-50 rounded-lg p-4">
												<div class="flex items-center justify-between mb-3">
													<div class="flex items-center gap-3">
														<Icon name="i-heroicons-link" class="w-5 h-5 text-green-600" />
														<span class="font-mono text-sm text-gray-600">{{ formatDate(pair.date) }}</span>
														<span class="font-bold text-lg text-green-700">{{ formatCurrency(pair.amount) }}</span>
													</div>
													<Badge color="green" variant="soft">RECONCILED</Badge>
												</div>

												<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
													<div class="bg-white p-3 rounded border border-red-200">
														<div class="flex items-center justify-between mb-2">
															<p class="text-xs font-semibold text-red-600 uppercase">Transfer Out</p>
															<Icon name="i-heroicons-arrow-right" class="w-4 h-4 text-red-600" />
														</div>
														<p class="font-semibold text-sm">{{ pair.fromAccount?.account_name || 'Unknown' }}</p>
														<p class="text-xs text-gray-500">Account #{{ pair.fromAccount?.account_number || 'N/A' }}</p>
														<p class="text-xs text-gray-600 mt-2">{{ pair.outTransfer.description }}</p>
													</div>

													<div class="bg-white p-3 rounded border border-green-200">
														<div class="flex items-center justify-between mb-2">
															<p class="text-xs font-semibold text-green-600 uppercase">Transfer In</p>
															<Icon name="i-heroicons-arrow-left" class="w-4 h-4 text-green-600" />
														</div>
														<p class="font-semibold text-sm">{{ pair.toAccount?.account_name || 'Unknown' }}</p>
														<p class="text-xs text-gray-500">Account #{{ pair.toAccount?.account_number || 'N/A' }}</p>
														<p class="text-xs text-gray-600 mt-2">{{ pair.inTransfer.description }}</p>
													</div>
												</div>
											</div>
										</div>
									</CardContent>
								</Card>
							</div>

							<!-- Clumped Payments View -->
							<div v-show="complianceView === 'clumped'" class="space-y-6">
								<Alert v-if="clumpedPayments.length > 0" variant="destructive">
									<Icon name="i-heroicons-exclamation-triangle" class="h-4 w-4" />
									<h5 class="mb-1 font-bold leading-none tracking-tight">FUND MIXING VIOLATIONS DETECTED</h5>
									<div class="text-sm space-y-2">
										<p class="font-semibold">
											{{ clumpedPayments.length }} transaction(s) identified as potentially clumped payments totaling
											{{ formatCurrency(clumpedPaymentTotal) }}.
										</p>
										<p>
											These payments likely combine HOA dues and special assessment fees but were deposited into a
											single account, violating Florida HOA accounting requirements (FS 718.111(11)).
										</p>
									</div>
								</Alert>

								<Alert v-else variant="success" title="No Fund Mixing Issues Detected">
									<div class="text-sm">
										All electronic payments appear to be properly allocated to their respective accounts.
									</div>
								</Alert>

								<Card v-if="clumpedPayments.length > 0">
									<CardHeader>
										<CardTitle class="text-lg uppercase tracking-wide text-red-800">
											SUSPECTED CLUMPED PAYMENTS
										</CardTitle>
									</CardHeader>
									<CardContent>
										<Table
											:rows="clumpedPayments"
											:columns="[
												{key: 'transaction_date', label: 'DATE'},
												{key: 'description', label: 'DESCRIPTION'},
												{key: 'amount', label: 'AMOUNT'},
												{key: 'account_id', label: 'DEPOSITED TO'},
											]">
											<template #transaction_date-data="{row}">
												<span class="font-mono text-sm">{{ formatDate(row.transaction_date) }}</span>
											</template>
											<template #amount-data="{row}">
												<span class="font-bold text-lg text-red-600">{{ formatCurrency(row.amount) }}</span>
											</template>
											<template #account_id-data="{row}">
												<span class="text-sm">{{ getAccountById(row.account_id)?.account_name || 'Unknown' }}</span>
											</template>
										</Table>
									</CardContent>
								</Card>
							</div>
						</div>
					</template>
				</Tabs>
			</div>

			<!-- Budget Info View -->
			<div v-else-if="selectedAccount === 'info'" class="space-y-6">
				<FinancialsOperatingBudget />
			</div>
		</div>
	</div>
</template>

<script setup>
import { VisXYContainer, VisLine, VisAxis, VisBulletLegend } from '@unovis/vue';
import { CurveType } from '@unovis/ts';
import { CardHeader, CardTitle, CardDescription, CardContent } from '~/components/ui/card';

const {
	selectedYear,
	selectedAccount,
	selectedCategory,
	selectedVendor,
	selectedStartMonth,
	selectedEndMonth,
	searchQuery,
	loading,
	error,
	accounts,
	budgetCategories,
	accountTransactions,
	allAccountTransactions,
	accountMetrics,
	categoryBreakdown,
	vendorBreakdown,
	groupedVendorTransactions,
	accountMonthlyTrend,
	currentAccountBalance,
	budgetComparison,
	budgetSummary,
	budgetProjection,
	budget2025,
	accountTransferTransactions,
	transferActivity,
	transferPairs,
	unmatchedTransfers,
	isClumpedPayment,
	clumpedPayments,
	clumpedPaymentTotal,
	getCategoryTransactions,
	getLargestTransaction,
	getCategoryMonthSpread,
	refreshAll,
	formatCurrency,
	getAccountById,
	isTransferTransaction,
	getRangeDescription,
	yearOptions,
	monthOptions,
	categoryOptions,
	vendorOptions,
} = useHOAFinancialsEnhanced();

const activeTab = ref(0);
const complianceView = ref('transfers');

const contentTabs = computed(() => [
	{
		slot: 'budget-categories',
		label: 'BUDGET & CATEGORIES',
	},
	{
		slot: 'vendors',
		label: 'VENDOR ANALYSIS',
	},
	{
		slot: 'transactions',
		label: 'ALL TRANSACTIONS',
	},
	{
		slot: 'compliance',
		label: 'COMPLIANCE',
	},
]);

// Chart legend items
const cashFlowLegendItems = [
	{ name: 'Revenue', color: 'rgb(34, 197, 94)' },
	{ name: 'Expenses', color: 'rgb(239, 68, 68)' },
	{ name: 'Balance', color: 'rgb(59, 130, 246)' },
];

const budgetChartLegendItems = [
	{ name: 'Monthly Budget', color: 'rgb(59, 130, 246)' },
	{ name: 'Actual Expenses', color: 'rgb(239, 68, 68)' },
];

const budgetComparisonColumns = [
	{key: 'category', label: 'CATEGORY'},
	{key: 'monthlyBudget', label: 'MONTHLY'},
	{key: 'proRatedBudget', label: 'PERIOD'},
	{key: 'actualAmount', label: 'ACTUAL'},
	{key: 'variance', label: 'VARIANCE'},
	{key: 'percentVariance', label: '%'},
	{key: 'status', label: 'STATUS'},
	{key: 'transactionCount', label: 'TXNS'},
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

const displayTransactions = computed(() => {
	try {
		let transactions =
			selectedCategory.value === 'all' && selectedVendor.value === 'all'
				? allAccountTransactions.value || []
				: accountTransactions.value || [];

		if (searchQuery.value.trim()) {
			const query = searchQuery.value.toLowerCase();
			transactions = transactions.filter((t) => {
				const searchable = [t.description || '', t.vendor || '', t.amount?.toString() || ''].join(' ').toLowerCase();
				return searchable.includes(query);
			});
		}
		return transactions;
	} catch (error) {
		console.error('Error in displayTransactions:', error);
		return [];
	}
});

const formatDate = (dateString) => {
	return new Date(dateString).toLocaleDateString('en-US', {month: 'short', day: 'numeric'});
};

const getTransactionTypeColor = (type) => {
	const colors = {
		deposit: 'green',
		withdrawal: 'red',
		fee: 'orange',
		interest: 'green',
	};
	return colors[type] || 'gray';
};

const getAmountColor = (type, amount) => {
	if (type === 'deposit' || type === 'interest') return 'text-green-600';
	if (type === 'withdrawal' || type === 'fee') return 'text-red-600';
	return amount >= 0 ? 'text-green-600' : 'text-red-600';
};

const getAmountDisplay = (type, amount) => {
	const numAmount = Math.abs(parseFloat(amount) || 0);
	const formatted = formatCurrency(numAmount);
	if (type === 'deposit' || type === 'interest') return `+${formatted}`;
	if (type === 'withdrawal' || type === 'fee') return `-${formatted}`;
	return formatted;
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
	searchQuery.value = '';
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

const getCategorySlotName = (categoryName) => {
	return `transactions-${categoryName.toLowerCase().replace(/\s+/g, '-')}`;
};

onMounted(() => {
	refreshAll();
});
</script>

<style scoped>
button:focus {
	outline: none;
}
</style>
