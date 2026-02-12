<template>
	<div class="container mx-auto min-h-svh p-6 space-y-6">
		<!-- Header -->
		<div class="bg-card rounded-lg shadow-sm border p-6">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-3xl font-bold uppercase tracking-wider mb-2 dark:text-white">
						DASHBOARD
					</h1>
					<p class="text-gray-600 dark:text-gray-400">
						Account transactions, budget analysis, and compliance monitoring
					</p>
				</div>
				<div class="flex items-center gap-3">
					<span class="text-sm uppercase tracking-wider text-gray-500">{{ getRangeDescription() }} {{ selectedYear }}</span>
				</div>
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

		<!-- Admin Actions Bar -->
		<div v-if="!loading && canReconcile" class="bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800 p-4">
			<div class="flex items-center justify-between flex-wrap gap-3">
				<div class="flex items-center gap-2">
					<Icon name="i-heroicons-shield-check" class="w-5 h-5 text-blue-600" />
					<span class="text-sm font-semibold text-blue-800 dark:text-blue-200 uppercase tracking-wide">Admin Actions</span>
				</div>
				<div class="flex flex-wrap gap-2">
					<NuxtLink
						to="/financials/reconciliation"
						class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 border border-blue-300 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors text-sm font-medium">
						<Icon name="i-heroicons-clipboard-document-check" class="w-4 h-4" />
						Reconcile Transactions
					</NuxtLink>
					<button
						@click="runAutoLinkTransfers"
						:disabled="autoLinking"
						class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 border border-blue-300 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors text-sm font-medium disabled:opacity-50">
						<Icon :name="autoLinking ? 'i-heroicons-arrow-path' : 'i-heroicons-link'" :class="{'animate-spin': autoLinking}" class="w-4 h-4" />
						{{ autoLinking ? 'Linking...' : 'Auto-Link Transfers' }}
					</button>
					<button
						@click="runAutoCategorize(false)"
						:disabled="autoCategorizing"
						class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 border border-blue-300 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors text-sm font-medium disabled:opacity-50">
						<Icon :name="autoCategorizing ? 'i-heroicons-arrow-path' : 'i-heroicons-tag'" :class="{'animate-spin': autoCategorizing}" class="w-4 h-4" />
						{{ autoCategorizing ? 'Categorizing...' : 'Auto-Categorize' }}
					</button>
					<button
						@click="runAutoCategorize(true)"
						:disabled="autoCategorizing"
						class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 border border-amber-300 text-amber-700 dark:text-amber-300 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900 transition-colors text-sm font-medium disabled:opacity-50">
						<Icon :name="autoCategorizing ? 'i-heroicons-arrow-path' : 'i-heroicons-arrow-path-rounded-square'" :class="{'animate-spin': autoCategorizing}" class="w-4 h-4" />
						{{ autoCategorizing ? 'Re-Categorizing...' : 'Re-Categorize All' }}
					</button>
					<NuxtLink
						to="/financials/import-center"
						class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 border border-blue-300 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors text-sm font-medium">
						<Icon name="i-heroicons-arrow-up-tray" class="w-4 h-4" />
						Import Center
					</NuxtLink>
				</div>
			</div>
			<!-- Auto-link / auto-categorize results -->
			<div v-if="autoLinkResults" class="mt-3 p-3 bg-green-50 dark:bg-green-950/30 rounded border border-green-200 dark:border-green-800 text-sm text-green-800 dark:text-green-200">
				Transfer linking complete: {{ autoLinkResults.linked }} linked, {{ autoLinkResults.categorized || 0 }} categorized
			</div>
			<div v-if="autoCategorizeResults" class="mt-3 p-3 bg-green-50 dark:bg-green-950/30 rounded border border-green-200 dark:border-green-800 text-sm text-green-800 dark:text-green-200">
				<div>Auto-Categorization: {{ autoCategorizeResults.categorized }} of {{ autoCategorizeResults.total_processed || autoCategorizeResults.total_uncategorized }} matched to budget categories</div>
				<div v-if="autoCategorizeResults.recategorized" class="mt-1 text-amber-700 dark:text-amber-300">
					{{ autoCategorizeResults.recategorized }} transactions re-categorized with updated rules
				</div>
				<div v-if="autoCategorizeResults.fund_mixing_flagged" class="mt-1 text-red-700 dark:text-red-300">
					{{ autoCategorizeResults.fund_mixing_flagged }} transactions flagged for fund mixing
				</div>
			</div>
		</div>

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
							<ClientOnly>
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
								<template #fallback>
									<div class="h-80 flex items-center justify-center text-muted-foreground">
										Loading chart...
									</div>
								</template>
							</ClientOnly>
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

				<!-- Documentation & Review Status -->
				<Card>
					<CardHeader>
						<CardTitle class="text-lg uppercase tracking-wide">DOCUMENTATION STATUS</CardTitle>
						<CardDescription>
							Transaction review and receipt tracking
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div class="grid grid-cols-2 md:grid-cols-4 gap-6">
							<div class="text-center p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
								<Icon name="i-heroicons-document-magnifying-glass" class="w-8 h-8 mx-auto text-red-600 mb-2" />
								<p class="text-sm uppercase tracking-wider text-gray-600 dark:text-gray-400">NEEDS RECEIPT</p>
								<p class="text-2xl font-bold text-red-600">{{ documentationStats.undocumentedCount }}</p>
								<p class="text-xs text-gray-500">{{ formatCurrency(documentationStats.undocumentedTotal) }} undocumented</p>
							</div>
							<div class="text-center p-4 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200 dark:border-yellow-800">
								<Icon name="i-heroicons-clock" class="w-8 h-8 mx-auto text-yellow-600 mb-2" />
								<p class="text-sm uppercase tracking-wider text-gray-600 dark:text-gray-400">PENDING REVIEW</p>
								<p class="text-2xl font-bold text-yellow-600">{{ documentationStats.pendingReview }}</p>
								<p class="text-xs text-gray-500">Awaiting treasurer review</p>
							</div>
							<div class="text-center p-4 rounded-lg border dark:border-gray-700">
								<Icon name="i-heroicons-flag" class="w-8 h-8 mx-auto text-red-500 mb-2" />
								<p class="text-sm uppercase tracking-wider text-gray-600 dark:text-gray-400">FLAGGED</p>
								<p class="text-2xl font-bold text-red-500">{{ documentationStats.flagged }}</p>
								<p class="text-xs text-gray-500">Requires attention</p>
							</div>
							<div class="text-center p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
								<Icon name="i-heroicons-check-badge" class="w-8 h-8 mx-auto text-green-600 mb-2" />
								<p class="text-sm uppercase tracking-wider text-gray-600 dark:text-gray-400">APPROVED</p>
								<p class="text-2xl font-bold text-green-600">{{ documentationStats.approved }}</p>
								<p class="text-xs text-gray-500">{{ documentationStats.reviewed }} reviewed</p>
							</div>
						</div>
						<div class="mt-4 flex items-center justify-end">
							<NuxtLink
								to="/financials/reconciliation"
								class="text-sm text-blue-600 hover:underline flex items-center gap-1"
							>
								View Reconciliation
								<Icon name="i-heroicons-arrow-right" class="w-4 h-4" />
							</NuxtLink>
						</div>
					</CardContent>
				</Card>

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
									<ClientOnly>
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
										<template #fallback>
											<div class="h-80 flex items-center justify-center text-muted-foreground">
												Loading chart...
											</div>
										</template>
									</ClientOnly>
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
						<div class="space-y-5">
							<!-- Search & Filter Bar -->
							<Card class="overflow-hidden">
								<CardContent class="pt-5 pb-4 space-y-4">
									<!-- Search Input -->
									<div class="relative group">
										<Icon name="i-heroicons-magnifying-glass" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 transition-colors group-focus-within:text-blue-500" />
										<Input
											v-model="searchQuery"
											placeholder="Search by description, vendor, amount, or category..."
											class="w-full h-10 pl-10 pr-10 rounded-xl bg-gray-50 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700 focus:bg-white dark:focus:bg-gray-800 transition-all" />
										<button
											v-if="searchQuery"
											@click="searchQuery = ''"
											class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-300 dark:bg-gray-600 text-white flex items-center justify-center hover:bg-gray-400 transition-colors">
											<Icon name="i-heroicons-x-mark" class="w-3 h-3" />
										</button>
									</div>

									<!-- Filter Controls -->
									<div class="flex flex-wrap gap-3 items-center">
										<!-- Transaction Type Pills -->
										<div class="flex items-center gap-1.5">
											<button
												v-for="opt in transactionTypeOptions"
												:key="opt.value"
												@click="txTypeFilter = opt.value"
												:class="[
													'px-3 py-1.5 text-xs font-semibold rounded-full transition-all duration-200',
													txTypeFilter === opt.value
														? 'bg-blue-600 text-white shadow-sm shadow-blue-200 dark:shadow-blue-900/30 scale-105'
														: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700',
												]">
												{{ opt.label }}
											</button>
										</div>

										<div class="w-px h-5 bg-gray-200 dark:bg-gray-700 hidden md:block"></div>

										<!-- Category -->
										<div class="flex items-center gap-1.5">
											<label class="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Category</label>
											<Select v-model="selectedCategory" :options="categoryOptions" class="w-36" />
										</div>

										<!-- Vendor -->
										<div class="flex items-center gap-1.5">
											<label class="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Vendor</label>
											<Select v-model="selectedVendor" :options="vendorOptions" class="w-36" />
										</div>

										<div class="w-px h-5 bg-gray-200 dark:bg-gray-700 hidden md:block"></div>

										<!-- Amount Range -->
										<div class="flex items-center gap-1.5">
											<label class="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Amount</label>
											<Input
												v-model="amountMin"
												type="number"
												placeholder="Min"
												class="w-20 h-8 text-xs rounded-lg" />
											<span class="text-gray-300 dark:text-gray-600">-</span>
											<Input
												v-model="amountMax"
												type="number"
												placeholder="Max"
												class="w-20 h-8 text-xs rounded-lg" />
										</div>

										<div class="w-px h-5 bg-gray-200 dark:bg-gray-700 hidden md:block"></div>

										<!-- Sort -->
										<div class="flex items-center gap-1.5">
											<label class="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Sort</label>
											<Select v-model="txSortBy" :options="sortOptions" class="w-36" />
										</div>
									</div>

									<!-- Active Filter Chips -->
									<div v-if="hasActiveFilters" class="flex items-center gap-2 flex-wrap pt-2 border-t border-gray-100 dark:border-gray-800">
										<span class="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Filters:</span>
										<span v-if="searchQuery" class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
											"{{ searchQuery }}"
											<button @click="searchQuery = ''" class="ml-0.5 hover:text-blue-900 dark:hover:text-blue-100 transition-colors"><Icon name="i-heroicons-x-mark" class="w-3 h-3" /></button>
										</span>
										<span v-if="txTypeFilter !== 'all'" class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
											{{ transactionTypeOptions.find(o => o.value === txTypeFilter)?.label }}
											<button @click="txTypeFilter = 'all'" class="ml-0.5 hover:text-purple-900 dark:hover:text-purple-100 transition-colors"><Icon name="i-heroicons-x-mark" class="w-3 h-3" /></button>
										</span>
										<span v-if="selectedCategory !== 'all'" class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
											{{ categoryOptions.find(o => o.value === selectedCategory)?.label }}
											<button @click="selectedCategory = 'all'" class="ml-0.5 hover:text-green-900 dark:hover:text-green-100 transition-colors"><Icon name="i-heroicons-x-mark" class="w-3 h-3" /></button>
										</span>
										<span v-if="selectedVendor !== 'all'" class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full">
											{{ selectedVendor === 'no_vendor' ? 'No Vendor' : selectedVendor }}
											<button @click="selectedVendor = 'all'" class="ml-0.5 hover:text-orange-900 dark:hover:text-orange-100 transition-colors"><Icon name="i-heroicons-x-mark" class="w-3 h-3" /></button>
										</span>
										<span v-if="amountMin || amountMax" class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full">
											${{ amountMin || '0' }} - ${{ amountMax || 'Any' }}
											<button @click="amountMin = ''; amountMax = ''" class="ml-0.5 hover:text-yellow-900 dark:hover:text-yellow-100 transition-colors"><Icon name="i-heroicons-x-mark" class="w-3 h-3" /></button>
										</span>
										<button
											@click="clearAllFilters"
											class="ml-auto text-xs text-gray-400 hover:text-red-500 font-medium flex items-center gap-1 transition-colors">
											<Icon name="i-heroicons-x-circle" class="w-3.5 h-3.5" />
											Clear All
										</button>
									</div>
								</CardContent>
							</Card>

							<!-- Filter Summary Metrics -->
							<div v-if="hasActiveFilters" class="grid grid-cols-2 md:grid-cols-4 gap-3">
								<Card class="filter-summary-card overflow-hidden">
									<CardContent class="pt-4 pb-3 text-center">
										<p class="text-2xl font-bold text-blue-600 tabular-nums">{{ displayTransactions.length }}</p>
										<p class="text-[10px] text-gray-500 uppercase tracking-wider font-medium mt-0.5">Matching</p>
									</CardContent>
								</Card>
								<Card class="filter-summary-card overflow-hidden">
									<CardContent class="pt-4 pb-3 text-center">
										<p class="text-2xl font-bold text-red-600 tabular-nums">{{ formatCurrency(displayExpenseTotal) }}</p>
										<p class="text-[10px] text-gray-500 uppercase tracking-wider font-medium mt-0.5">Expenses</p>
									</CardContent>
								</Card>
								<Card class="filter-summary-card overflow-hidden">
									<CardContent class="pt-4 pb-3 text-center">
										<p class="text-2xl font-bold text-green-600 tabular-nums">{{ formatCurrency(displayRevenueTotal) }}</p>
										<p class="text-[10px] text-gray-500 uppercase tracking-wider font-medium mt-0.5">Revenue</p>
									</CardContent>
								</Card>
								<Card class="filter-summary-card overflow-hidden">
									<CardContent class="pt-4 pb-3 text-center">
										<p class="text-2xl font-bold tabular-nums" :class="displayNetTotal >= 0 ? 'text-green-600' : 'text-red-600'">
											{{ displayNetTotal >= 0 ? '+' : '' }}{{ formatCurrency(displayNetTotal) }}
										</p>
										<p class="text-[10px] text-gray-500 uppercase tracking-wider font-medium mt-0.5">Net</p>
									</CardContent>
								</Card>
							</div>

							<!-- Transactions Table -->
							<Card>
								<CardHeader>
									<div class="flex items-center justify-between">
										<CardTitle class="text-lg uppercase tracking-wide">ALL TRANSACTIONS</CardTitle>
										<div class="flex items-center gap-2">
											<Badge v-if="hasActiveFilters" color="blue" variant="soft">
												{{ displayTransactions.length }} OF {{ allAccountTransactions.length }}
											</Badge>
											<Badge v-else color="primary" variant="soft">
												{{ allAccountTransactions.length }} TOTAL
											</Badge>
										</div>
									</div>
								</CardHeader>
								<CardContent>
									<!-- Empty State -->
									<div v-if="displayTransactions.length === 0" class="text-center py-16">
										<div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
											<Icon name="i-heroicons-magnifying-glass" class="w-8 h-8 text-gray-300 dark:text-gray-600" />
										</div>
										<p class="text-gray-500 dark:text-gray-400 font-medium mb-1">No transactions match your filters</p>
										<p class="text-sm text-gray-400 dark:text-gray-500">Try adjusting your search or filter criteria</p>
										<button @click="clearAllFilters" class="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">Clear all filters</button>
									</div>

									<Table v-else :rows="displayTransactions" :columns="transactionColumnsDetailed">
										<template #transaction_date-data="{row}">
											<span class="font-mono text-sm text-gray-700 dark:text-gray-300">{{ formatDate(row.transaction_date) }}</span>
										</template>
										<template #transaction_type-data="{row}">
											<Badge :color="getTransactionTypeColor(row.transaction_type)" variant="soft" size="xs">
												{{ (row.transaction_type || 'unknown').toUpperCase() }}
											</Badge>
										</template>
										<template #amount-data="{row}">
											<span class="font-bold tabular-nums" :class="getAmountColor(row.transaction_type, row.amount)">
												{{ getAmountDisplay(row.transaction_type, row.amount) }}
											</span>
										</template>
										<template #category_id-data="{row}">
											<div v-if="canReconcile" class="min-w-[140px]">
												<div class="flex items-center gap-1.5">
													<select
														:value="normalizeCategoryId(row.category_id)"
														@change="updateTransactionCategory(row.id, $event.target.value)"
														class="flex-1 text-xs border rounded-lg px-2 py-1.5 bg-white dark:bg-gray-800 transition-colors focus:border-blue-400 focus:ring-1 focus:ring-blue-200"
														:class="[
															normalizeCategoryId(row.category_id) ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400',
															row.auto_categorized === false && normalizeCategoryId(row.category_id)
																? 'border-amber-300 dark:border-amber-600'
																: 'border-gray-200 dark:border-gray-600',
														]">
														<option value="">Uncategorized</option>
														<option v-for="cat in budgetCategories" :key="cat.id" :value="cat.id">
															{{ cat.category_name }}
														</option>
													</select>
													<Icon
														v-if="row.auto_categorized === false && normalizeCategoryId(row.category_id)"
														name="i-heroicons-lock-closed"
														class="w-3.5 h-3.5 text-amber-500 flex-shrink-0"
														title="Manually categorized — protected from Re-Categorize All" />
												</div>
											</div>
											<div v-else>
												<div class="flex items-center gap-2" v-if="row.category_id">
													<div
														class="w-2.5 h-2.5 rounded-full"
														:style="{backgroundColor: getCategoryColor(row.category_id)}"></div>
													<span class="text-xs">{{ getCategoryName(row.category_id) }}</span>
													<Icon
														v-if="row.auto_categorized === false"
														name="i-heroicons-lock-closed"
														class="w-3 h-3 text-amber-500"
														title="Manually categorized" />
												</div>
												<span v-else class="text-xs text-gray-400 italic">Uncategorized</span>
											</div>
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
						<div class="space-y-5">
							<!-- Segmented Control for compliance views -->
							<Card class="overflow-hidden">
								<CardContent class="pt-5 pb-4">
									<div class="inline-flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 gap-1">
										<button
											@click="complianceView = 'transfers'"
											:class="[
												'relative flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
												complianceView === 'transfers'
													? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
													: 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
											]">
											<Icon name="i-heroicons-arrows-right-left" class="w-4 h-4" />
											Transfer Reconciliation
											<span v-if="transferActivity.unmatchedCount > 0"
												class="inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold bg-red-500 text-white rounded-full">
												{{ transferActivity.unmatchedCount }}
											</span>
										</button>
										<button
											@click="complianceView = 'clumped'"
											:class="[
												'relative flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
												complianceView === 'clumped'
													? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
													: 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
											]">
											<Icon name="i-heroicons-exclamation-triangle" class="w-4 h-4" />
											Payment Allocations
											<span v-if="clumpedPayments.length > 0"
												class="inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold bg-red-500 text-white rounded-full">
												{{ clumpedPayments.length }}
											</span>
										</button>
									</div>
								</CardContent>
							</Card>

							<!-- TRANSFERS VIEW -->
							<div v-show="complianceView === 'transfers'" class="space-y-5">
								<!-- Status Banner -->
								<div v-if="transferActivity.unmatchedCount > 0"
									class="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-4 flex items-start gap-3">
									<div class="w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center flex-shrink-0 mt-0.5">
										<Icon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-red-600" />
									</div>
									<div>
										<p class="font-semibold text-red-800 dark:text-red-200 text-sm">Transfer Reconciliation Required</p>
										<p class="text-sm text-red-600 dark:text-red-300 mt-0.5">
											{{ transferActivity.unmatchedCount }} unmatched transfer{{ transferActivity.unmatchedCount !== 1 ? 's' : '' }} detected that may indicate fund mixing violations or missing data.
										</p>
									</div>
								</div>

								<div v-else-if="transferActivity.totalTransfers > 0"
									class="rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-4 flex items-center gap-3">
									<div class="w-9 h-9 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center flex-shrink-0">
										<Icon name="i-heroicons-check-circle" class="w-5 h-5 text-green-600" />
									</div>
									<div>
										<p class="font-semibold text-green-800 dark:text-green-200 text-sm">All Transfers Reconciled</p>
										<p class="text-sm text-green-600 dark:text-green-300">All {{ transferActivity.totalTransfers }} transfers are properly matched and linked.</p>
									</div>
								</div>

								<!-- Transfer Metrics -->
								<div class="grid grid-cols-2 md:grid-cols-5 gap-3">
									<Card class="text-center overflow-hidden">
										<CardContent class="pt-4 pb-3">
											<div class="w-8 h-8 mx-auto mb-2 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
												<Icon name="i-heroicons-arrows-right-left" class="w-4 h-4 text-purple-600" />
											</div>
											<p class="text-xl font-bold text-purple-600 tabular-nums">{{ transferActivity.totalTransfers }}</p>
											<p class="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Total</p>
										</CardContent>
									</Card>

									<Card class="text-center overflow-hidden">
										<CardContent class="pt-4 pb-3">
											<div class="w-8 h-8 mx-auto mb-2 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
												<Icon name="i-heroicons-arrow-up-circle" class="w-4 h-4 text-green-600" />
											</div>
											<p class="text-xl font-bold text-green-600 tabular-nums">{{ formatCurrency(transferActivity.transfersIn) }}</p>
											<p class="text-[10px] text-gray-500 uppercase tracking-wider font-medium">In</p>
										</CardContent>
									</Card>

									<Card class="text-center overflow-hidden">
										<CardContent class="pt-4 pb-3">
											<div class="w-8 h-8 mx-auto mb-2 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
												<Icon name="i-heroicons-arrow-down-circle" class="w-4 h-4 text-red-600" />
											</div>
											<p class="text-xl font-bold text-red-600 tabular-nums">{{ formatCurrency(transferActivity.transfersOut) }}</p>
											<p class="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Out</p>
										</CardContent>
									</Card>

									<Card class="text-center overflow-hidden">
										<CardContent class="pt-4 pb-3">
											<div class="w-8 h-8 mx-auto mb-2 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
												<Icon name="i-heroicons-link" class="w-4 h-4 text-blue-600" />
											</div>
											<p class="text-xl font-bold text-blue-600 tabular-nums">{{ transferActivity.linkedCount }}</p>
											<p class="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Linked</p>
										</CardContent>
									</Card>

									<Card class="text-center overflow-hidden"
										:class="transferActivity.unmatchedCount > 0 ? 'ring-2 ring-red-400 dark:ring-red-600' : ''">
										<CardContent class="pt-4 pb-3">
											<div class="w-8 h-8 mx-auto mb-2 rounded-full flex items-center justify-center"
												:class="transferActivity.unmatchedCount > 0 ? 'bg-red-100 dark:bg-red-900/40' : 'bg-green-100 dark:bg-green-900/40'">
												<Icon :name="transferActivity.unmatchedCount > 0 ? 'i-heroicons-exclamation-triangle' : 'i-heroicons-check-circle'"
													class="w-4 h-4" :class="transferActivity.unmatchedCount > 0 ? 'text-red-600' : 'text-green-600'" />
											</div>
											<p class="text-xl font-bold tabular-nums"
												:class="transferActivity.unmatchedCount > 0 ? 'text-red-600' : 'text-green-600'">
												{{ transferActivity.unmatchedCount }}
											</p>
											<p class="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Unmatched</p>
										</CardContent>
									</Card>
								</div>

								<!-- Reconciliation Progress -->
								<Card v-if="transferActivity.totalTransfers > 0" class="overflow-hidden">
									<CardContent class="pt-4 pb-3">
										<div class="flex items-center justify-between mb-2">
											<span class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Reconciliation Progress</span>
											<span class="text-xs font-bold tabular-nums"
												:class="transferActivity.unmatchedCount === 0 ? 'text-green-600' : 'text-blue-600'">
												{{ Math.round((transferActivity.linkedCount / transferActivity.totalTransfers) * 100) }}%
											</span>
										</div>
										<div class="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
											<div
												class="h-full rounded-full transition-all duration-500"
												:class="transferActivity.unmatchedCount === 0 ? 'bg-green-500' : 'bg-blue-500'"
												:style="{ width: `${Math.round((transferActivity.linkedCount / transferActivity.totalTransfers) * 100)}%` }">
											</div>
										</div>
										<p class="text-[11px] text-gray-400 mt-1.5">
											{{ transferActivity.linkedCount }} of {{ transferActivity.totalTransfers }} transfers reconciled
										</p>
									</CardContent>
								</Card>

								<!-- Unmatched Transfers - Card-based layout -->
								<div v-if="unmatchedTransfers.length > 0" class="space-y-3">
									<div class="flex items-center justify-between">
										<h3 class="text-sm font-semibold text-red-700 dark:text-red-300 uppercase tracking-wide flex items-center gap-2">
											<Icon name="i-heroicons-exclamation-triangle" class="w-4 h-4" />
											Unmatched Transfers
										</h3>
										<Badge color="red" variant="soft">{{ unmatchedTransfers.length }} Action{{ unmatchedTransfers.length !== 1 ? 's' : '' }} Required</Badge>
									</div>

									<div class="space-y-2">
										<div
											v-for="transfer in unmatchedTransfers"
											:key="transfer.id"
											@click="expandedUnmatchedId = expandedUnmatchedId === transfer.id ? null : transfer.id"
											class="border rounded-xl p-4 cursor-pointer transition-all duration-200 hover:shadow-md"
											:class="transfer.transaction_type === 'withdrawal'
												? 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20 hover:border-red-300'
												: 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20 hover:border-green-300'">
											<div class="flex items-center justify-between">
												<div class="flex items-center gap-3">
													<div class="w-10 h-10 rounded-full flex items-center justify-center"
														:class="transfer.transaction_type === 'withdrawal'
															? 'bg-red-100 dark:bg-red-900/50'
															: 'bg-green-100 dark:bg-green-900/50'">
														<Icon
															:name="transfer.transaction_type === 'withdrawal' ? 'i-heroicons-arrow-up-right' : 'i-heroicons-arrow-down-left'"
															class="w-5 h-5"
															:class="transfer.transaction_type === 'withdrawal' ? 'text-red-600' : 'text-green-600'" />
													</div>
													<div>
														<p class="font-medium text-sm text-gray-900 dark:text-gray-100">{{ transfer.description }}</p>
														<p class="text-xs text-gray-500 dark:text-gray-400">{{ formatDate(transfer.transaction_date) }}</p>
													</div>
												</div>
												<div class="flex items-center gap-3">
													<div class="text-right">
														<p class="font-bold text-lg tabular-nums"
															:class="transfer.transaction_type === 'withdrawal' ? 'text-red-600' : 'text-green-600'">
															{{ transfer.transaction_type === 'withdrawal' ? '-' : '+' }}{{ formatCurrency(transfer.amount) }}
														</p>
														<Badge :color="transfer.transaction_type === 'withdrawal' ? 'red' : 'green'" variant="soft" size="xs">
															{{ transfer.transaction_type === 'withdrawal' ? 'OUT' : 'IN' }}
														</Badge>
													</div>
													<Icon
														name="i-heroicons-chevron-down"
														class="w-4 h-4 text-gray-400 transition-transform duration-200"
														:class="{ 'rotate-180': expandedUnmatchedId === transfer.id }" />
												</div>
											</div>

											<!-- Expandable Details -->
											<div v-if="expandedUnmatchedId === transfer.id" class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-sm space-y-1">
												<div class="flex justify-between">
													<span class="text-gray-500">Vendor</span>
													<span class="font-medium">{{ transfer.vendor || 'None' }}</span>
												</div>
												<div class="flex justify-between">
													<span class="text-gray-500">Type</span>
													<span class="font-medium">{{ transfer.transaction_type }}</span>
												</div>
												<div class="flex justify-between">
													<span class="text-gray-500">Status</span>
													<Badge color="yellow" variant="soft" size="xs">Needs Matching</Badge>
												</div>
											</div>
										</div>
									</div>
								</div>

								<!-- Linked Transfer Pairs - Visual flow -->
								<Card v-if="transferPairs.length > 0">
									<CardHeader>
										<div class="flex items-center justify-between">
											<CardTitle class="text-sm uppercase tracking-wide">Linked Transfer Pairs</CardTitle>
											<Badge color="green" variant="soft">{{ transferPairs.length }} Reconciled</Badge>
										</div>
									</CardHeader>
									<CardContent>
										<div class="space-y-3">
											<div
												v-for="pair in transferPairs"
												:key="pair.id"
												class="rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-sm transition-shadow">
												<!-- Amount & Date Header -->
												<div class="flex items-center justify-between mb-3">
													<div class="flex items-center gap-2">
														<div class="w-7 h-7 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
															<Icon name="i-heroicons-check" class="w-4 h-4 text-green-600" />
														</div>
														<span class="font-bold text-lg tabular-nums">{{ formatCurrency(pair.amount) }}</span>
													</div>
													<span class="text-xs text-gray-500 font-mono">{{ formatDate(pair.date) }}</span>
												</div>

												<!-- Flow Visualization -->
												<div class="flex items-center gap-2">
													<!-- Source Account -->
													<div class="flex-1 bg-red-50 dark:bg-red-950/20 rounded-lg p-3 border border-red-100 dark:border-red-900">
														<p class="text-[10px] font-semibold text-red-500 uppercase tracking-wider mb-1">From</p>
														<p class="font-medium text-sm text-gray-900 dark:text-gray-100">{{ pair.fromAccount?.account_name || 'Unknown' }}</p>
														<p class="text-[11px] text-gray-500 truncate">{{ pair.outTransfer.description }}</p>
													</div>

													<!-- Arrow -->
													<div class="flex-shrink-0 w-8 flex items-center justify-center">
														<Icon name="i-heroicons-arrow-right" class="w-5 h-5 text-gray-400" />
													</div>

													<!-- Destination Account -->
													<div class="flex-1 bg-green-50 dark:bg-green-950/20 rounded-lg p-3 border border-green-100 dark:border-green-900">
														<p class="text-[10px] font-semibold text-green-500 uppercase tracking-wider mb-1">To</p>
														<p class="font-medium text-sm text-gray-900 dark:text-gray-100">{{ pair.toAccount?.account_name || 'Unknown' }}</p>
														<p class="text-[11px] text-gray-500 truncate">{{ pair.inTransfer.description }}</p>
													</div>
												</div>
											</div>
										</div>
									</CardContent>
								</Card>
							</div>

							<!-- PAYMENT ALLOCATIONS VIEW -->
							<div v-show="complianceView === 'clumped'" class="space-y-5">
								<!-- Status Banner -->
								<div v-if="clumpedPayments.length > 0"
									class="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-4">
									<div class="flex items-start gap-3">
										<div class="w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center flex-shrink-0 mt-0.5">
											<Icon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-red-600" />
										</div>
										<div>
											<p class="font-semibold text-red-800 dark:text-red-200 text-sm">Fund Mixing Violations Detected</p>
											<p class="text-sm text-red-600 dark:text-red-300 mt-0.5">
												{{ clumpedPayments.length }} transaction{{ clumpedPayments.length !== 1 ? 's' : '' }} totaling
												<span class="font-semibold">{{ formatCurrency(clumpedPaymentTotal) }}</span>
												identified as potentially clumped payments.
											</p>
											<p class="text-xs text-red-500 dark:text-red-400 mt-2">
												These may combine HOA dues and special assessment fees into a single deposit, violating Florida HOA accounting requirements (FS 718.111(11)).
											</p>
										</div>
									</div>
								</div>

								<div v-else
									class="rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-4 flex items-center gap-3">
									<div class="w-9 h-9 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center flex-shrink-0">
										<Icon name="i-heroicons-check-circle" class="w-5 h-5 text-green-600" />
									</div>
									<div>
										<p class="font-semibold text-green-800 dark:text-green-200 text-sm">No Fund Mixing Issues</p>
										<p class="text-sm text-green-600 dark:text-green-300">All electronic payments appear to be properly allocated to their respective accounts.</p>
									</div>
								</div>

								<!-- Clumped Payment Cards -->
								<div v-if="clumpedPayments.length > 0" class="space-y-3">
									<div class="flex items-center justify-between">
										<h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
											Suspected Clumped Payments
										</h3>
										<Badge color="red" variant="soft">{{ clumpedPayments.length }}</Badge>
									</div>

									<div class="space-y-2">
										<div
											v-for="payment in clumpedPayments"
											:key="payment.id"
											class="rounded-xl border border-red-200 dark:border-red-800 bg-white dark:bg-gray-900 p-4 hover:shadow-md transition-all duration-200">
											<div class="flex items-center justify-between">
												<div class="flex items-center gap-3">
													<div class="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
														<Icon name="i-heroicons-banknotes" class="w-5 h-5 text-red-600" />
													</div>
													<div>
														<p class="font-medium text-sm text-gray-900 dark:text-gray-100">{{ payment.description }}</p>
														<div class="flex items-center gap-2 mt-0.5">
															<span class="text-xs text-gray-500 font-mono">{{ formatDate(payment.transaction_date) }}</span>
															<span class="text-xs text-gray-400">-</span>
															<span class="text-xs text-gray-500">{{ getAccountById(payment.account_id)?.account_name || 'Unknown' }}</span>
														</div>
													</div>
												</div>
												<p class="font-bold text-lg text-red-600 tabular-nums">{{ formatCurrency(payment.amount) }}</p>
											</div>
										</div>
									</div>
								</div>
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
definePageMeta({ layout: 'default' })

useSeoMeta({
	title: 'Dashboard',
});

import { VisXYContainer, VisLine, VisAxis, VisBulletLegend } from '@unovis/vue';
import { CurveType } from '@unovis/ts';
import { CardHeader, CardTitle, CardDescription, CardContent } from '~/components/ui/card';
import gsap from 'gsap';

// Admin permissions and reconciliation
const { canReconcile, canCreateNotes, fetchUserPermissions } = useReconciliationNotes();
const transactionsCollection = useDirectusItems('transactions');

onMounted(() => {
	fetchUserPermissions();
});

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

// Enhanced All Transactions filters
const txTypeFilter = ref('all');
const amountMin = ref('');
const amountMax = ref('');
const txSortBy = ref('date_desc');

const transactionTypeOptions = [
	{ label: 'All', value: 'all' },
	{ label: 'Deposits', value: 'deposit' },
	{ label: 'Withdrawals', value: 'withdrawal' },
	{ label: 'Fees', value: 'fee' },
	{ label: 'Transfers', value: 'transfer' },
];

const sortOptions = computed(() => [
	{ label: 'Date (Newest)', value: 'date_desc' },
	{ label: 'Date (Oldest)', value: 'date_asc' },
	{ label: 'Amount (High)', value: 'amount_desc' },
	{ label: 'Amount (Low)', value: 'amount_asc' },
]);

const hasActiveFilters = computed(() => {
	return searchQuery.value.trim() !== '' ||
		txTypeFilter.value !== 'all' ||
		selectedCategory.value !== 'all' ||
		selectedVendor.value !== 'all' ||
		amountMin.value !== '' ||
		amountMax.value !== '';
});

// Compliance: expanded unmatched transfer cards
const expandedUnmatchedId = ref(null);

// Documentation & review stats
const documentationStats = computed(() => {
	const allTxns = allAccountTransactions.value || [];
	const withdrawals = allTxns.filter((t) => t.transaction_type === 'withdrawal');
	const undocumented = withdrawals.filter((t) => {
		const hasFiles = t.files && Array.isArray(t.files) && t.files.length > 0;
		return !hasFiles && parseFloat(t.amount || 0) > 100;
	});
	const undocumentedTotal = undocumented.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
	const pendingReview = allTxns.filter((t) => !t.review_status || t.review_status === 'pending').length;
	const flagged = allTxns.filter((t) => t.review_status === 'flagged').length;
	const approved = allTxns.filter((t) => t.review_status === 'approved').length;
	const reviewed = allTxns.filter((t) => t.review_status === 'reviewed').length;
	return {
		undocumentedCount: undocumented.length,
		undocumentedTotal,
		pendingReview,
		flagged,
		approved,
		reviewed,
	};
});

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

		// Text search
		if (searchQuery.value.trim()) {
			const query = searchQuery.value.toLowerCase();
			transactions = transactions.filter((t) => {
				const searchable = [
					t.description || '',
					t.vendor || '',
					t.amount?.toString() || '',
					getCategoryName(t.category_id) || '',
				].join(' ').toLowerCase();
				return searchable.includes(query);
			});
		}

		// Transaction type filter
		if (txTypeFilter.value !== 'all') {
			if (txTypeFilter.value === 'transfer') {
				transactions = transactions.filter((t) => isTransferTransaction(t));
			} else {
				transactions = transactions.filter((t) => t.transaction_type === txTypeFilter.value && !isTransferTransaction(t));
			}
		}

		// Amount range filter
		if (amountMin.value !== '') {
			const min = parseFloat(amountMin.value);
			if (!isNaN(min)) {
				transactions = transactions.filter((t) => parseFloat(t.amount || 0) >= min);
			}
		}
		if (amountMax.value !== '') {
			const max = parseFloat(amountMax.value);
			if (!isNaN(max)) {
				transactions = transactions.filter((t) => parseFloat(t.amount || 0) <= max);
			}
		}

		// Sort
		const sorted = [...transactions];
		switch (txSortBy.value) {
			case 'date_asc':
				sorted.sort((a, b) => new Date(a.transaction_date) - new Date(b.transaction_date));
				break;
			case 'amount_desc':
				sorted.sort((a, b) => parseFloat(b.amount || 0) - parseFloat(a.amount || 0));
				break;
			case 'amount_asc':
				sorted.sort((a, b) => parseFloat(a.amount || 0) - parseFloat(b.amount || 0));
				break;
			default: // date_desc
				sorted.sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date));
				break;
		}

		return sorted;
	} catch (error) {
		console.error('Error in displayTransactions:', error);
		return [];
	}
});

// Computed totals for the filtered display
const displayExpenseTotal = computed(() => {
	return displayTransactions.value
		.filter((t) => t.transaction_type === 'withdrawal' || t.transaction_type === 'fee')
		.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
});

const displayRevenueTotal = computed(() => {
	return displayTransactions.value
		.filter((t) => t.transaction_type === 'deposit' || t.transaction_type === 'interest')
		.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
});

const displayNetTotal = computed(() => {
	return displayRevenueTotal.value - displayExpenseTotal.value;
});

const formatDate = (dateString) => {
	if (!dateString) return '';
	// Parse YYYY-MM-DD manually to avoid UTC midnight interpretation.
	// new Date("2025-01-02") → UTC midnight → displays as Jan 1 in US timezones.
	const [y, m, d] = dateString.substring(0, 10).split('-');
	return new Date(+y, +m - 1, +d).toLocaleDateString('en-US', {month: 'short', day: 'numeric'});
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
	// Handle expanded object (category_id returned as {id, category_name, ...})
	if (typeof categoryId === 'object' && categoryId !== null) {
		return categoryId.category_name || 'Unknown Category';
	}
	const category = budgetCategories.value.find((c) => c.id === categoryId);
	return category ? category.category_name : 'Unknown Category';
};

const getCategoryColor = (categoryId) => {
	if (!categoryId) return '#6B7280';
	// Handle expanded object (category_id returned as {id, category_name, color, ...})
	if (typeof categoryId === 'object' && categoryId !== null) {
		return categoryId.color || '#6B7280';
	}
	const category = budgetCategories.value.find((c) => c.id === categoryId);
	return category ? category.color : '#6B7280';
};

const clearAllFilters = () => {
	selectedCategory.value = 'all';
	selectedVendor.value = 'all';
	searchQuery.value = '';
	txTypeFilter.value = 'all';
	amountMin.value = '';
	amountMax.value = '';
	txSortBy.value = 'date_desc';
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

// Admin action state
const autoLinking = ref(false);
const autoLinkResults = ref(null);
const autoCategorizing = ref(false);
const autoCategorizeResults = ref(null);

// Normalize category_id (handles Directus expanded objects)
const normalizeCategoryId = (categoryId) => {
	if (!categoryId) return '';
	if (typeof categoryId === 'object' && categoryId !== null) return categoryId.id;
	return categoryId;
};

// Auto-link transfers
const runAutoLinkTransfers = async () => {
	autoLinking.value = true;
	autoLinkResults.value = null;
	try {
		const result = await $fetch('/api/admin/auto-link-transfers', {
			method: 'POST',
			body: { fiscal_year: selectedYear.value },
		});
		autoLinkResults.value = result;
		if (result.linked > 0) refreshAll();
	} catch (err) {
		console.error('Auto-link error:', err);
	} finally {
		autoLinking.value = false;
	}
};

// Auto-categorize transactions
const runAutoCategorize = async (recategorize = false) => {
	autoCategorizing.value = true;
	autoCategorizeResults.value = null;
	try {
		const result = await $fetch('/api/admin/auto-categorize-transactions', {
			method: 'POST',
			body: {
				fiscal_year: selectedYear.value,
				account_id: selectedAccount.value !== 'info' ? selectedAccount.value : undefined,
				recategorize,
			},
		});
		autoCategorizeResults.value = result;
		if (result.categorized > 0 || result.recategorized > 0) refreshAll();
	} catch (err) {
		console.error('Auto-categorize error:', err);
	} finally {
		autoCategorizing.value = false;
	}
};

// Update a transaction's category inline
const updateTransactionCategory = async (transactionId, categoryId) => {
	try {
		await transactionsCollection.update(transactionId, {
			category_id: categoryId || null,
			// Mark as manually categorized — Re-Categorize All will skip this transaction
			auto_categorized: false,
		});
		// Refresh to update all computed values
		refreshAll();
	} catch (err) {
		console.error('Failed to update transaction category:', err);
	}
};

// GSAP animation for tab content
const txListRef = ref(null);

watch(activeTab, () => {
	nextTick(() => {
		const container = document.querySelector('.tab-content-enter');
		if (container) {
			gsap.fromTo(container, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' });
		}
	});
});

// Animate filter summary cards when filters change
watch(hasActiveFilters, (val) => {
	if (val) {
		nextTick(() => {
			const cards = document.querySelectorAll('.filter-summary-card');
			if (cards.length) {
				gsap.fromTo(cards, { opacity: 0, y: 8, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.3, stagger: 0.05, ease: 'power2.out' });
			}
		});
	}
});

onMounted(() => {
	refreshAll();
});
</script>

<style scoped>
button:focus {
	outline: none;
}

/* Smooth transitions for filter chips */
.filter-summary-card {
	transition: all 0.2s ease;
}

/* Tabular numbers for financial data */
.tabular-nums {
	font-variant-numeric: tabular-nums;
}
</style>
