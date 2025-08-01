<template>
	<div class="container mx-auto p-6">
		<!-- Header -->
		<div class="mb-8">
			<h1 class="text-3xl font-bold uppercase tracking-wider mb-2">FINANCIAL DASHBOARD</h1>
			<p class="text-gray-600">LENOX PLAZA ASSOCIATION - 2025 OPERATING BUDGET</p>
		</div>

		<!-- Executive Summary Section -->
		<div class="mb-8">
			<h2 class="text-2xl font-bold uppercase tracking-wide mb-6 flex items-center">
				<UIcon name="i-heroicons-chart-bar-square" class="w-6 h-6 mr-3 text-[var(--cyan)]" />
				EXECUTIVE SUMMARY (YEAR-TO-DATE)
			</h2>

			<!-- Key Performance Indicators -->
			<div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
				<!-- Financial Health Score -->
				<UCard
					class="text-center rounded-[4px] shadow"
					:class="realYtdData.financialHealthScore < 60 ? 'border border-red-500' : ''"
				>
					<div class="space-y-2">
						<UIcon name="i-lucide-gauge" class="w-8 h-8 mx-auto" :class="financialHealthColor" />
						<p class="text-sm uppercase tracking-wider text-gray-600">FINANCIAL HEALTH</p>
						<p class="text-3xl font-bold" :class="financialHealthColor">{{ realYtdData.financialHealthScore }}%</p>
						<p class="text-xs font-medium" :class="financialHealthColor">{{ realYtdData.financialHealthStatus }}</p>
					</div>
				</UCard>

				<!-- YTD Cash Decline -->
				<UCard
					class="text-center rounded-[4px] shadow"
					:class="realYtdData.ytdCashChange < 0 ? 'border border-red-500' : ''"
				>
					<div class="space-y-2">
						<UIcon
							name="i-heroicons-arrow-trending-down"
							class="w-8 h-8 mx-auto"
							:class="realYtdData.ytdCashChange < 0 ? 'text-red-600' : 'text-green-600'"
						/>
						<p class="text-sm uppercase tracking-wider text-gray-600">YTD CASH CHANGE</p>
						<p class="text-3xl font-bold" :class="realYtdData.ytdCashChange < 0 ? 'text-red-600' : 'text-green-600'">
							{{ realYtdData.ytdCashChange >= 0 ? '+' : '' }}${{ Math.abs(realYtdData.ytdCashChange).toLocaleString() }}
						</p>
						<p class="text-xs text-gray-500">JAN - {{ selectedMonth.replace(' 2025', '').toUpperCase() }}</p>
					</div>
				</UCard>

				<!-- Monthly Burn Rate -->
				<UCard
					class="text-center rounded-[4px] shadow"
					:class="realYtdData.monthlyBurnRate > 5000 ? 'border border-red-500' : ''"
				>
					<div class="space-y-2">
						<UIcon
							name="i-heroicons-fire"
							class="w-8 h-8 mx-auto"
							:class="realYtdData.monthlyBurnRate > 5000 ? 'text-red-600' : 'text-yellow-600'"
						/>
						<p class="text-sm uppercase tracking-wider text-gray-600">AVG MONTHLY BURN</p>
						<p
							class="text-3xl font-bold"
							:class="realYtdData.monthlyBurnRate > 5000 ? 'text-red-600' : 'text-yellow-600'"
						>
							${{ realYtdData.monthlyBurnRate.toLocaleString() }}
						</p>
						<p class="text-xs text-gray-500">6-MONTH AVERAGE</p>
					</div>
				</UCard>

				<!-- Cash Runway -->
				<UCard
					class="text-center rounded-[4px] shadow"
					:class="realYtdData.cashRunwayMonths < 12 ? 'border border-red-500' : ''"
				>
					<div class="space-y-2">
						<UIcon name="i-heroicons-clock" class="w-8 h-8 mx-auto" :class="cashRunwayColor" />
						<p class="text-sm uppercase tracking-wider text-gray-600">CASH RUNWAY</p>
						<p class="text-3xl font-bold" :class="cashRunwayColor">{{ realYtdData.cashRunwayMonths }} mo</p>
						<p class="text-xs font-medium" :class="cashRunwayColor">{{ cashRunwayStatus }}</p>
					</div>
				</UCard>
			</div>

			<!-- YTD Trends Chart -->
			<UCard class="mb-6">
				<template #header>
					<h3 class="text-lg font-semibold uppercase tracking-wide">YTD CASH FLOW TRENDS</h3>
				</template>
				<div class="h-80">
					<Line :data="realYtdCashFlowData" :options="ytdChartOptions" />
				</div>
			</UCard>

			<!-- Budget Performance YTD -->
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
				<UCard>
					<template #header>
						<h3 class="text-lg font-semibold uppercase tracking-wide">YTD BUDGET PERFORMANCE</h3>
					</template>
					<div class="space-y-4">
						<div class="text-center mb-4">
							<p
								class="text-3xl font-bold"
								:class="realYtdData.ytdBudgetUtilization > 85 ? 'text-red-600' : 'text-green-600'"
							>
								{{ realYtdData.ytdBudgetUtilization }}%
							</p>
							<p class="text-sm text-gray-600">BUDGET UTILIZED</p>
						</div>
						<div class="space-y-3">
							<div v-for="category in realYtdBudgetCategories" :key="category.name" class="space-y-2">
								<div class="flex justify-between text-sm">
									<span class="font-medium">{{ category.name }}</span>
									<span :class="category.variance > 0 ? 'text-red-600' : 'text-green-600'">
										{{ category.variance > 0 ? '+' : '' }}{{ category.variance }}%
									</span>
								</div>
								<div class="w-full bg-gray-200 rounded-full h-2">
									<div
										class="h-2 rounded-full transition-all duration-300"
										:class="category.variance > 0 ? 'bg-red-500' : 'bg-green-500'"
										:style="`width: ${Math.min(category.utilization, 100)}%`"
									/>
								</div>
							</div>
						</div>
					</div>
				</UCard>

				<UCard>
					<template #header>
						<h3 class="text-lg font-semibold uppercase tracking-wide">COMPLIANCE STATUS</h3>
					</template>
					<div class="space-y-4">
						<div class="text-center mb-4">
							<UIcon
								:name="complianceStatus.compliant ? 'i-heroicons-shield-check' : 'i-heroicons-shield-exclamation'"
								class="w-12 h-12 mx-auto mb-2"
								:class="complianceStatus.compliant ? 'text-green-600' : 'text-red-600'"
							/>
							<p class="text-lg font-bold" :class="complianceStatus.compliant ? 'text-green-600' : 'text-red-600'">
								{{ complianceStatus.compliant ? 'COMPLIANT' : 'VIOLATIONS DETECTED' }}
							</p>
						</div>
						<div class="space-y-2">
							<div class="flex justify-between p-3 bg-gray-50 rounded-lg">
								<span class="font-medium">YTD Fund Segregation</span>
								<span :class="realYtdViolations === 0 ? 'text-green-600' : 'text-red-600'">
									{{ realYtdViolations === 0 ? '✓ Clean' : `${realYtdViolations} Issues` }}
								</span>
							</div>
							<div class="flex justify-between p-3 bg-gray-50 rounded-lg">
								<span class="font-medium">Operating Balance</span>
								<span :class="operatingBalance < 25000 ? 'text-red-600' : 'text-green-600'">
									{{ operatingBalance < 25000 ? '⚠ Below Min' : '✓ Adequate' }}
								</span>
							</div>
							<div class="flex justify-between p-3 bg-gray-50 rounded-lg">
								<span class="font-medium">Budget Compliance</span>
								<span :class="realYtdData.ytdBudgetUtilization > 100 ? 'text-red-600' : 'text-green-600'">
									{{ realYtdData.ytdBudgetUtilization > 100 ? '⚠ Over Budget' : '✓ On Track' }}
								</span>
							</div>
						</div>
					</div>
				</UCard>
			</div>
		</div>
		<div class="w-full grid grid-cols-3 md:grid-cols-6 gap-4 mb-20">
			<nuxt-link
				v-for="month in monthOptions"
				:to="`/financials/monthly-report/${month.label.replace(' 2025', '').toLowerCase()}`"
				class="rounded-md py-6 text-sm font-medium text-gray-900 bg-gray-50/20 hover:bg-gray-300 focus:outline-none flex flex-row items-center justify-center border border-gray-200"
			>
				{{ month.label }}
				<UIcon name="i-heroicons-chevron-right" class="w-4 h-4 ml-2" />
			</nuxt-link>
		</div>
		<!-- Month Selection and Summary Cards -->
		<div class="w-full mt-20 mb-6 flex flex-col md:flex-row items-center justify-between">
			<h2 class="text-2xl font-bold uppercase tracking-wide mb-6 flex items-center relative">
				<UIcon name="i-heroicons-calendar" class="w-6 h-6 mr-3 text-[var(--cyan)]" />
				MONTHLY REPORT [{{ selectedMonth.replace('2025', '').trim() }}]
				<nuxt-link
					:to="`/financials/monthly-report/${selectedMonth.replace(' 2025', '').toLowerCase()}`"
					class="absolute right-0 -bottom-[35px] text-[10px] uppercase tracking-wider flex items-center text-[var(--cyan)] justify-center flex-row py-2"
				>
					Full Details
					<UIcon name="i-heroicons-chevron-right" class="w-3 h-3 ml-1" />
				</nuxt-link>
			</h2>
			<USelect v-model="selectedMonth" :options="monthOptions" size="lg" class="w-48 relative" />
		</div>
		<!-- <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
			<UCard>
				<div class="text-center">
					<p class="text-3xl font-bold" :class="operatingBalance < 25000 ? 'text-red-600' : 'text-gray-900'">
						${{ operatingBalance.toLocaleString() }}
					</p>
					<p class="text-sm text-gray-600 uppercase tracking-wide mt-1">OPERATING BALANCE</p>
				</div>
			</UCard>

			<UCard>
				<div class="text-center">
					<p class="text-3xl font-bold" :class="monthlyChange >= 0 ? 'text-green-600' : 'text-red-600'">
						{{ monthlyChange >= 0 ? '+' : '' }}${{ Math.abs(monthlyChange).toLocaleString() }}
					</p>
					<p class="text-sm text-gray-600 uppercase tracking-wide mt-1">NET CASH FLOW</p>
				</div>
			</UCard>

			<UCard>
				<div class="text-center">
					<p class="text-3xl font-bold" :class="expenseVariance > 0 ? 'text-red-600' : 'text-green-600'">
						<span class="font-medium">{{ Math.abs(expenseVariance) }}%</span>
						{{ expenseVariance > 0 ? 'OVER' : 'UNDER' }} BUDGET
					</p>
				</div>
			</UCard>

			<UCard>
				<div class="text-center">
					<p
						class="text-3xl font-bold"
						:class="fundSegregationStatus.violations > 0 ? 'text-red-600' : 'text-green-600'"
					>
						{{ fundSegregationStatus.violations }}
					</p>
					<p class="text-sm text-gray-600 uppercase tracking-wide mt-1">VIOLATIONS</p>
				</div>
			</UCard>
		</div> -->

		<!-- Critical Alerts -->
		<div v-if="criticalAlerts.length > 0" class="mb-8">
			<UAlert
				v-for="alert in criticalAlerts"
				:key="alert.id"
				:title="alert.title"
				:description="alert.description"
				color="red"
				variant="subtle"
				class="mb-3"
			>
				<template #icon>
					<UIcon name="i-heroicons-exclamation-triangle" />
				</template>
				<template #actions>
					<UButton color="red" variant="soft" size="xs" @click="activeTab = 2">VIEW VIOLATIONS</UButton>
				</template>
			</UAlert>
		</div>

		<!-- Main Content Tabs -->
		<UTabs v-model="activeTab" :items="tabs" class="space-y-6">
			<!-- Overview Tab -->
			<template #overview>
				<div class="space-y-6 lg:space-y-0 grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
					<!-- Monthly Summary Component -->
					<FinancialsMonthlySummary
						:month="selectedMonth.replace(' 2025', '')"
						:income="monthlyRevenue"
						:expenses="monthlyExpenses"
						:ending-balance="operatingBalance"
						:beginning-balance="beginningBalance"
						:violations="fundSegregationStatus.violations"
						:insurance-expense="insuranceExpense"
						:professional-expense="professionalExpense"
						:utility-expense="utilityExpense"
						:maintenance-expense="maintenanceExpense"
					/>

					<!-- Account Health Status -->
					<UCard>
						<template #header>
							<h3 class="text-lg font-semibold uppercase tracking-wide">ACCOUNT HEALTH STATUS</h3>
						</template>
						<div class="space-y-4">
							<div v-for="account in accountHealth" :key="account.name" class="space-y-2">
								<div class="flex items-center justify-between">
									<span class="font-medium">{{ account.name }}</span>
									<UBadge :color="account.color" variant="subtle">{{ account.status }}</UBadge>
								</div>
								<div class="w-full bg-gray-200 rounded-full h-2">
									<div
										class="h-2 rounded-full transition-all duration-500"
										:class="account.barClass"
										:style="`width: ${account.percent}%`"
									/>
								</div>
								<p class="text-xs text-gray-600">{{ account.note }}</p>
							</div>
						</div>
					</UCard>

					<!-- Monthly Cash Flow -->
					<UCard>
						<template #header>
							<h3 class="text-lg font-semibold uppercase tracking-wide">MONTHLY BREAKDOWN</h3>
						</template>
						<div class="h-64">
							<Bar :data="monthlyBreakdownData" :options="chartOptions" />
						</div>
					</UCard>
				</div>
			</template>

			<!-- Budget Analysis Tab -->
			<template #budget>
				<UCard>
					<template #header>
						<h3 class="text-lg font-semibold uppercase tracking-wide">BUDGET VS ACTUAL - {{ selectedMonth }}</h3>
					</template>
					<div class="space-y-6">
						<!-- Monthly Summary Metrics -->
						<div class="grid grid-cols-4 gap-4 text-center">
							<div>
								<p class="text-sm uppercase tracking-wide text-gray-600">BUDGETED REVENUE</p>
								<p class="text-2xl font-bold text-gray-900">${{ budgetedRevenue.toLocaleString() }}</p>
							</div>
							<div>
								<p class="text-sm uppercase tracking-wide text-gray-600">ACTUAL REVENUE</p>
								<p class="text-2xl font-bold" :class="revenueVariance >= 0 ? 'text-green-600' : 'text-red-600'">
									${{ monthlyRevenue.toLocaleString() }}
								</p>
							</div>
							<div>
								<p class="text-sm uppercase tracking-wide text-gray-600">REVENUE VARIANCE</p>
								<p class="text-2xl font-bold" :class="revenueVariance >= 0 ? 'text-green-600' : 'text-red-600'">
									{{ revenueVariance >= 0 ? '+' : '' }}{{ revenueVariance }}%
								</p>
							</div>
							<div>
								<p class="text-sm uppercase tracking-wide text-gray-600">NET BUDGET VARIANCE</p>
								<p class="text-2xl font-bold" :class="netBudgetVariance >= 0 ? 'text-red-600' : 'text-green-600'">
									{{ netBudgetVariance >= 0 ? '+' : '' }}{{ netBudgetVariance }}%
								</p>
							</div>
						</div>

						<!-- Year-to-Date Analytics - UPDATED WITH REAL DATA -->
						<div class="grid grid-cols-3 gap-4 text-center p-6 bg-gray-50 rounded-lg">
							<div>
								<p class="text-sm uppercase tracking-wide text-gray-600">YTD VARIANCE</p>
								<p class="text-2xl font-bold" :class="realYtdData.ytdVariance > 0 ? 'text-red-600' : 'text-green-600'">
									{{ realYtdData.ytdVariance > 0 ? '+' : '' }}{{ realYtdData.ytdVariance }}%
								</p>
							</div>
							<div>
								<p class="text-sm uppercase tracking-wide text-gray-600">BUDGET ACCURACY</p>
								<p class="text-2xl font-bold text-gray-900">{{ realYtdData.budgetAccuracy }}%</p>
							</div>
							<div>
								<p class="text-sm uppercase tracking-wide text-gray-600">PROJECTED YEAR-END</p>
								<p class="text-2xl font-bold text-gray-900">${{ projectedYearEnd.toLocaleString() }}</p>
							</div>
						</div>

						<!-- Budget Chart -->
						<div class="h-80">
							<Bar :data="budgetChartData" :options="budgetChartOptions" />
						</div>

						<!-- Variance Table -->
						<UTable :rows="budgetVariances" :columns="budgetColumns">
							<template #category-data="{ row }">
								<span class="font-medium">{{ row.category }}</span>
							</template>
							<template #budgeted-data="{ row }">
								<span class="text-gray-900">${{ row.budgeted.toLocaleString() }}</span>
							</template>
							<template #actual-data="{ row }">
								<span class="font-semibold">${{ row.actual.toLocaleString() }}</span>
							</template>
							<template #variance-data="{ row }">
								<span :class="row.variance >= 0 ? 'text-red-600' : 'text-green-600'" class="font-semibold">
									{{ row.variance >= 0 ? '+' : '' }}${{ Math.abs(row.variance).toLocaleString() }}
								</span>
							</template>
							<template #percent-data="{ row }">
								<span :class="row.percentVariance >= 0 ? 'text-red-600' : 'text-green-600'" class="font-semibold">
									{{ row.percentVariance >= 0 ? '+' : '' }}{{ row.percentVariance }}%
								</span>
							</template>
							<template #status-data="{ row }">
								<UBadge :color="row.statusColor" variant="soft" size="xs">
									{{ row.status }}
								</UBadge>
							</template>
						</UTable>
					</div>
				</UCard>
			</template>

			<!-- Violations Tab -->
			<template #violations>
				<div class="space-y-6">
					<!-- Compliance Status Overview -->
					<UCard>
						<template #header>
							<div class="flex items-center justify-between">
								<h3 class="text-lg font-semibold uppercase tracking-wide">COMPLIANCE STATUS</h3>
								<UBadge :color="fundSegregationStatus.compliant ? 'green' : 'red'" variant="solid">
									{{ fundSegregationStatus.compliant ? 'COMPLIANT' : 'VIOLATIONS DETECTED' }}
								</UBadge>
							</div>
						</template>

						<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div class="space-y-4">
								<div
									class="flex items-center justify-between p-4 rounded-lg"
									:class="fundSegregationStatus.compliant ? 'bg-green-50' : 'bg-red-50'"
								>
									<div class="flex items-center space-x-3">
										<UIcon
											:name="
												fundSegregationStatus.compliant
													? 'i-heroicons-check-circle'
													: 'i-heroicons-exclamation-triangle'
											"
											:class="fundSegregationStatus.compliant ? 'text-green-600' : 'text-red-600'"
											class="w-6 h-6"
										/>
										<span class="font-semibold">Fund Segregation</span>
									</div>
									<UBadge :color="fundSegregationStatus.compliant ? 'green' : 'red'" variant="subtle">
										{{ fundSegregationStatus.violations }} Violations
									</UBadge>
								</div>
							</div>

							<div class="space-y-4">
								<h4 class="font-semibold text-gray-900">Required Actions</h4>
								<ul class="space-y-2">
									<li v-for="action in requiredActions" :key="action" class="flex items-start space-x-2">
										<UIcon name="i-heroicons-arrow-right" class="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
										<span class="text-sm text-gray-700">{{ action }}</span>
									</li>
								</ul>
							</div>
						</div>
					</UCard>

					<!-- Individual Violation Details -->
					<div v-if="criticalViolations.length > 0" class="space-y-4">
						<h3 class="text-xl font-semibold text-red-800 flex items-center gap-2">
							<UIcon name="i-heroicons-exclamation-triangle" class="text-red-600" />
							CRITICAL VIOLATIONS DETECTED
						</h3>

						<div class="grid grid-cols-1 gap-4">
							<UAlert
								v-for="violation in criticalViolations"
								:key="violation.type"
								:color="violation.severity === 'CRITICAL' ? 'red' : 'orange'"
								variant="solid"
								:title="violation.title"
								:description="violation.description"
							>
								<template #icon>
									<UIcon
										:name="
											violation.severity === 'CRITICAL'
												? 'i-heroicons-exclamation-triangle'
												: 'i-heroicons-exclamation-circle'
										"
									/>
								</template>

								<template #title>
									<div class="flex justify-between items-start">
										<span>{{ violation.title }}</span>
										<UBadge color="white" variant="solid" size="xs">
											{{ violation.statute }}
										</UBadge>
									</div>
								</template>

								<div class="mt-3 p-3 bg-white bg-opacity-20 rounded">
									<p class="text-sm font-semibold">< Legal Risk: {{ violation.legalRisk }}</p>
									<p class="text-sm mt-1">💰 Penalty: {{ violation.penalty }}</p>
									<p class="text-sm mt-1 font-semibold">🎯 Immediate Action: {{ violation.immediateAction }}</p>
								</div>
							</UAlert>
						</div>
					</div>

					<!-- Emergency Actions Required -->
					<UCard v-if="emergencyActions.length > 0" class="border-2 border-red-300">
						<template #header>
							<div class="flex items-center gap-3">
								<UIcon name="i-heroicons-fire" class="text-red-600 text-xl" />
								<h3 class="text-lg font-bold text-red-800">EMERGENCY ACTIONS REQUIRED</h3>
								<UBadge color="red" variant="solid">IMMEDIATE</UBadge>
							</div>
						</template>

						<div class="space-y-4">
							<div
								v-for="action in emergencyActions"
								:key="action.priority"
								class="flex items-start gap-4 p-4 bg-red-50 rounded-lg"
							>
								<div
									class="bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold"
								>
									{{ action.priority }}
								</div>
								<div class="flex-1">
									<h4 class="font-bold text-red-800">{{ action.action.replace(/_/g, ' ') }}</h4>
									<p class="text-red-700 mt-1">{{ action.description }}</p>
									<div class="flex gap-4 mt-2">
										<UBadge :color="action.timeframe === 'IMMEDIATE' ? 'red' : 'orange'" variant="soft" size="xs">
											{{ action.timeframe }}
										</UBadge>
										<UBadge color="gray" variant="soft" size="xs">
											{{ action.responsible }}
										</UBadge>
									</div>
								</div>
							</div>
						</div>
					</UCard>

					<!-- Action Plan Timeline -->
					<div class="space-y-6">
						<h3 class="text-xl font-semibold text-gray-900">CORRECTIVE ACTION PLAN</h3>
						<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
							<div
								v-for="period in actionPlan"
								:key="period.period"
								class="p-6 border-l-4 bg-gray-50 rounded-r-lg"
								:class="period.borderClass"
							>
								<div class="flex items-center gap-3 mb-4">
									<UIcon name="i-heroicons-clock" :class="period.iconClass" class="w-5 h-5" />
									<h4 class="font-bold text-gray-900">{{ period.period }}</h4>
								</div>
								<ul class="space-y-2">
									<li v-for="item in period.items" :key="item" class="flex items-start gap-2">
										<UIcon name="i-heroicons-check-circle" class="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
										<span class="text-sm text-gray-700">{{ item }}</span>
									</li>
								</ul>
							</div>
						</div>
					</div>

					<!-- Compliance Checklist -->
					<UCard>
						<template #header>
							<h3 class="text-lg font-semibold uppercase tracking-wide">FLORIDA COMPLIANCE CHECKLIST</h3>
						</template>

						<div class="space-y-4">
							<div v-for="item in certificationChecklist" :key="item.id" class="flex items-start space-x-3">
								<UCheckbox
									v-model="item.checked"
									:disabled="!item.compliant"
									:color="item.compliant ? 'green' : 'red'"
									class="mt-1"
								/>
								<div class="flex-1">
									<div class="flex items-center justify-between">
										<label class="text-sm font-medium" :class="item.compliant ? 'text-gray-900' : 'text-red-700'">
											{{ item.requirement }}
										</label>
										<UBadge
											:color="item.compliant === true ? 'green' : item.compliant === false ? 'red' : 'yellow'"
											variant="soft"
										>
											{{ item.compliant === true ? 'COMPLIANT' : item.compliant === false ? 'VIOLATION' : 'UNKNOWN' }}
										</UBadge>
									</div>
									<p v-if="item.action" class="text-xs text-gray-600 mt-1">{{ item.action }}</p>
								</div>
							</div>
						</div>
					</UCard>
				</div>
			</template>
		</UTabs>
		<!-- Quick Actions -->
		<div class="w-full mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
			<UCard
				class="hover:shadow-lg transition-shadow cursor-pointer"
				@click="navigateTo(`/financials/monthly-report/${selectedMonth.replace(' 2025', '').toLowerCase()}`)"
			>
				<div class="flex items-center space-x-3">
					<div class="p-3 bg-gray-50 rounded-lg">
						<UIcon name="i-heroicons-document-text" class="w-6 h-6 text-[var(--cyan)]" />
					</div>
					<div>
						<p class="font-semibold uppercase tracking-wide">MONTHLY RECONCILIATION</p>
						<p class="text-sm text-gray-600">View detailed transactions</p>
					</div>
				</div>
			</UCard>

			<UCard class="hover:shadow-lg transition-shadow cursor-pointer" @click="activeTab = 1">
				<div class="flex items-center space-x-3">
					<div class="p-3 bg-green-100 rounded-lg">
						<UIcon name="i-heroicons-chart-bar" class="w-6 h-6 text-green-600" />
					</div>
					<div>
						<p class="font-semibold uppercase tracking-wide">BUDGET ANALYSIS</p>
						<p class="text-sm text-gray-600">Compare budget vs actual</p>
					</div>
				</div>
			</UCard>

			<UCard class="hover:shadow-lg transition-shadow cursor-pointer" @click="activeTab = 2">
				<div class="flex items-center space-x-3">
					<div class="p-3 bg-purple-100 rounded-lg">
						<UIcon name="i-heroicons-shield-check" class="w-6 h-6 text-purple-600" />
					</div>
					<div>
						<p class="font-semibold uppercase tracking-wide">COMPLIANCE CHECK</p>
						<p class="text-sm text-gray-600">Fund segregation status</p>
						<UBadge v-if="fundSegregationStatus.violations > 0" color="red" variant="solid" size="xs" class="ml-2">
							{{ fundSegregationStatus.violations }}
						</UBadge>
					</div>
				</div>
			</UCard>
		</div>
	</div>
</template>

<script setup>
import { Line, Bar } from 'vue-chartjs';
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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

// Composables
const {
	getOperatingData,
	getReserveData,
	calculateFinancialHealth,
	getSpecialAssessmentData,
	checkCompliance,
	getViolationCount,
} = useReconciliationData();

const { budget2025, getTotalBudget, calculateVariance, getBudgetUtilization } = useBudgetData();

// State
const selectedMonth = ref('June 2025');
const activeTab = ref(0);

// REAL YTD DATA FROM CSV ANALYSIS
const realYtdData = {
	ytdBudgetUtilization: 75.5,
	ytdVariance: 51,
	budgetAccuracy: 74.5,
	ytdCashChange: -30642,
	monthlyBurnRate: 6128,
	cashRunwayMonths: 5.5,
	financialHealthScore: 50,
	financialHealthStatus: 'NEEDS ATTENTION',
	categoryBreakdown: [
		{ name: 'Utilities', utilization: 45.1, variance: -9.8 },
		{ name: 'Other', utilization: 71, variance: 42.1 },
		{ name: 'Professional', utilization: 155, variance: 210 },
		{ name: 'Insurance', utilization: 78.8, variance: 57.5 },
	],
	monthlyBalancesTrend: [64114, 54853, 44695, 52296, 33888, 33472],
	totalYearlyBudget: 177296,
	totalActualSpent: 133893.93,
	expectedYtdSpend: 88648,
};

// Computed properties for YTD data
const financialHealthColor = computed(() => {
	const score = realYtdData.financialHealthScore;
	return score >= 80
		? 'text-green-600'
		: score >= 60
			? 'text-[var(--cyan)]'
			: score >= 40
				? 'text-yellow-600'
				: 'text-red-600';
});

const cashRunwayColor = computed(() => {
	const months = realYtdData.cashRunwayMonths;
	return months < 6 ? 'text-red-600' : months < 12 ? 'text-yellow-600' : 'text-green-600';
});

const cashRunwayStatus = computed(() => {
	const months = realYtdData.cashRunwayMonths;
	return months < 6 ? 'CRITICAL' : months < 12 ? 'WARNING' : 'HEALTHY';
});

const realYtdBudgetCategories = computed(() => realYtdData.categoryBreakdown);

const realYtdViolations = computed(() => {
	// Calculate YTD violations from all months
	const months = ['January 2025', 'February 2025', 'March 2025', 'April 2025', 'May 2025', 'June 2025'];
	return months.reduce((total, month) => {
		const monthData = getOperatingData(month);
		return total + (monthData?.violations?.length || 0);
	}, 0);
});

// Real YTD Cash Flow Chart Data
const realYtdCashFlowData = computed(() => {
	const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN'];
	const balances = realYtdData.monthlyBalancesTrend;
	const revenueData = [14000, 14000, 14000, 14000, 14000, 14000]; // Approximate from maintenance fees
	const expenseData = [23261, 23408, 9842, 6557, 32408, 14416]; // From composable data

	return {
		labels: months,
		datasets: [
			{
				label: 'Operating Balance',
				data: balances,
				borderColor: 'rgb(59, 130, 246)',
				backgroundColor: 'rgba(59, 130, 246, 0.1)',
				tension: 0.3,
				yAxisID: 'y',
			},
			{
				label: 'Monthly Revenue',
				data: revenueData,
				borderColor: 'rgb(34, 197, 94)',
				backgroundColor: 'rgba(34, 197, 94, 0.1)',
				tension: 0.3,
				yAxisID: 'y1',
			},
			{
				label: 'Monthly Expenses',
				data: expenseData,
				borderColor: 'rgb(239, 68, 68)',
				backgroundColor: 'rgba(239, 68, 68, 0.1)',
				tension: 0.3,
				yAxisID: 'y1',
			},
		],
	};
});

// Tabs configuration
const tabs = [
	{
		slot: 'overview',
		label: 'OVERVIEW',
		icon: 'i-heroicons-home',
	},
	{
		slot: 'budget',
		label: 'BUDGET ANALYSIS',
		icon: 'i-heroicons-chart-bar',
	},
	{
		slot: 'violations',
		label: 'COMPLIANCE & VIOLATIONS',
		icon: 'i-heroicons-shield-exclamation',
		badge: computed(() => (fundSegregationStatus.value.violations > 0 ? fundSegregationStatus.value.violations : null)),
	},
];

// Month options
const monthOptions = [
	{ label: 'JUNE 2025', value: 'June 2025' },
	{ label: 'MAY 2025', value: 'May 2025' },
	{ label: 'APRIL 2025', value: 'April 2025' },
	{ label: 'MARCH 2025', value: 'March 2025' },
	{ label: 'FEBRUARY 2025', value: 'February 2025' },
	{ label: 'JANUARY 2025', value: 'January 2025' },
];

// Get account data
const operatingData = computed(() => getOperatingData(selectedMonth.value));
const reserveData = computed(() => getReserveData(selectedMonth.value));
const healthStatus = computed(() => calculateFinancialHealth(selectedMonth.value));
const complianceStatus = computed(() => checkCompliance(selectedMonth.value));

// Current month metrics
const operatingBalance = computed(() => operatingData.value?.endingBalance || 0);
const beginningBalance = computed(() => operatingData.value?.beginningBalance || 0);
const monthlyRevenue = computed(() => operatingData.value?.deposits?.reduce((sum, d) => sum + d.amount, 0) || 0);
const monthlyExpenses = computed(
	() => (operatingData.value?.withdrawals || []).filter((w) => !w.violation).reduce((sum, w) => sum + w.amount, 0) || 0,
);
const monthlyChange = computed(() => monthlyRevenue.value - monthlyExpenses.value);

// Budget data
const budgetedRevenue = computed(() => budget2025.revenue.total.monthly);
const budgetedExpenses = computed(() => budget2025.totals.monthly);

// Budget variance calculations
const expenseVariance = computed(() => {
	if (budgetedExpenses.value === 0) return 0;
	return Math.round(((monthlyExpenses.value - budgetedExpenses.value) / budgetedExpenses.value) * 100);
});

const revenueVariance = computed(() => {
	if (budgetedRevenue.value === 0) return 0;
	return Math.round(((monthlyRevenue.value - budgetedRevenue.value) / budgetedRevenue.value) * 100);
});

const netBudgetVariance = computed(() => {
	const budgetedNet = budgetedRevenue.value - budgetedExpenses.value;
	const actualNet = monthlyRevenue.value - monthlyExpenses.value;
	if (budgetedNet === 0) return 0;
	return Math.round(((actualNet - budgetedNet) / Math.abs(budgetedNet)) * 100);
});

const projectedYearEnd = computed(() => {
	// Project year-end balance based on current trends
	const monthsElapsed = selectedMonth.value === 'June 2025' ? 6 : 5;
	const monthsRemaining = 12 - monthsElapsed;
	const avgMonthlyChange = monthlyChange.value;

	return Math.round(operatingBalance.value + avgMonthlyChange * monthsRemaining);
});

// Expense categorization
const expensesByCategory = computed(() => {
	const withdrawals = operatingData.value?.withdrawals || [];
	const categories = {
		Insurance: 0,
		Professional: 0,
		Utilities: 0,
		Maintenance: 0,
		Regulatory: 0,
		Banking: 0,
		Other: 0,
	};

	withdrawals.forEach((w) => {
		if (w.violation) return;

		const category = w.category === 'Management' ? 'Professional' : w.category;
		if (categories.hasOwnProperty(category)) {
			categories[category] += w.amount;
		} else {
			categories.Other += w.amount;
		}
	});

	return categories;
});

// Individual expense amounts for component props
const insuranceExpense = computed(() => expensesByCategory.value.Insurance);
const professionalExpense = computed(() => expensesByCategory.value.Professional);
const utilityExpense = computed(() => expensesByCategory.value.Utilities);
const maintenanceExpense = computed(() => expensesByCategory.value.Maintenance);

// Budget variance analysis
const budgetVariances = computed(() => {
	return Object.keys(budget2025.categories).map((categoryKey) => {
		const categoryBudget = budget2025.categories[categoryKey];
		const actualAmount = expensesByCategory.value[categoryKey] || 0;
		const variance = calculateVariance(categoryKey, actualAmount);

		return {
			category: categoryKey,
			budgeted: categoryBudget.monthly,
			actual: actualAmount,
			variance: variance.variance,
			percentVariance: variance.percentVariance,
			status: variance.status,
			statusColor: variance.statusColor,
		};
	});
});

const budgetColumns = [
	{ key: 'category', label: 'CATEGORY' },
	{ key: 'budgeted', label: 'BUDGET' },
	{ key: 'actual', label: 'ACTUAL' },
	{ key: 'variance', label: 'VARIANCE' },
	{ key: 'percent', label: 'PERCENT' },
	{ key: 'status', label: 'STATUS' },
];

// Account health data
// Make sure you have the necessary composable imported at the top of your file:
// const { getOperatingData, getReserveData, getSpecialAssessmentData } = useReconciliationData();

const accountHealth = computed(() => [
	{
		name: 'Operating Account (5129)',
		status: operatingBalance.value < 25000 ? 'CRITICAL' : 'HEALTHY',
		color: operatingBalance.value < 25000 ? 'red' : 'green',
		barClass: operatingBalance.value < 25000 ? 'bg-red-500' : 'bg-green-500',
		percent: Math.min((operatingBalance.value / 100000) * 100, 100),
		note: 'Improper transfers detected',
	},
	{
		name: 'Reserve Account (7011)',
		// Fix: Use actual reserve balance and calculate status dynamically
		status: (reserveData.value?.endingBalance || 0) < 75000 ? 'CRITICAL' : 'HEALTHY',
		color: (reserveData.value?.endingBalance || 0) < 75000 ? 'red' : 'green',
		barClass: (reserveData.value?.endingBalance || 0) < 75000 ? 'bg-red-500' : 'bg-green-500',
		// Fix: Use the actual ending balance instead of the entire reserveData object
		percent: Math.min(((reserveData.value?.endingBalance || 0) / 75000) * 100, 100),
		// Fix: More accurate note based on actual shortfall amount
		note:
			(reserveData.value?.endingBalance || 0) < 75000
				? `${(75000 - (reserveData.value?.endingBalance || 0)).toLocaleString()} below minimum threshold`
				: 'Adequate reserves',
	},
	{
		name: '40-Year Reserve (5872)',
		status: fundSegregationStatus.value.violations > 0 ? 'VIOLATION' : 'COMPLIANT',
		color: fundSegregationStatus.value.violations > 0 ? 'orange' : 'blue',
		barClass: fundSegregationStatus.value.violations > 0 ? 'bg-orange-500' : 'bg-[var(--cyan)]',
		// Fix: Calculate actual percentage based on special assessment account data
		// Using a realistic target of $100,000 for 40-year project funds
		percent: Math.min(((getSpecialAssessmentData(selectedMonth.value)?.endingBalance || 0) / 100000) * 100, 100),
		note:
			fundSegregationStatus.value.violations > 0
				? `${fundSegregationStatus.value.violations} fund segregation violations detected`
				: 'Properly segregated',
	},
]);

// Compliance and violations
const fundSegregationStatus = computed(() => ({
	compliant: (operatingData.value?.violations?.length || 0) === 0,
	violations: operatingData.value?.violations?.length || 0,
}));

// Critical alerts
const criticalAlerts = computed(() => {
	const alerts = [];

	if (fundSegregationStatus.value.violations > 0) {
		alerts.push({
			id: 'fund-segregation',
			title: 'Fund Segregation Violations Detected',
			description: `${fundSegregationStatus.value.violations} violations found requiring immediate attention.`,
		});
	}

	if (operatingBalance.value < 25000) {
		alerts.push({
			id: 'low-balance',
			title: 'Operating Balance Below Minimum',
			description: 'Account balance is critically low and may affect operations.',
		});
	}

	return alerts;
});

// Mock violations data
const criticalViolations = computed(() => [
	{
		type: 'FUND_SEGREGATION',
		severity: 'CRITICAL',
		title: 'Improper Inter-Account Transfers',
		description: 'Operating funds used for reserve account expenses',
		statute: 'FS 718.111(11)',
		legalRisk: 'Board liability, potential fines',
		penalty: '$5,000 - $50,000 per violation',
		immediateAction: 'Freeze all inter-account transfers',
	},
]);

const emergencyActions = computed(() => [
	{
		priority: 1,
		action: 'FREEZE_TRANSFERS',
		description: 'Stop all inter-account transfers immediately',
		timeframe: 'IMMEDIATE',
		responsible: 'Management Company',
	},
	{
		priority: 2,
		action: 'DOCUMENT_VIOLATIONS',
		description: 'Document all improper transfers for reversal',
		timeframe: '24 HOURS',
		responsible: 'Board Secretary',
	},
]);

const requiredActions = [
	'Stop all inter-account transfers immediately',
	'Document and reverse improper transfers',
	'Implement dual approval for all transfers',
	'Schedule emergency board meeting',
];

const actionPlan = [
	{
		period: '30 DAYS - IMMEDIATE ACTIONS',
		borderClass: 'border-red-500',
		iconClass: 'text-red-500',
		items: [
			'Freeze inter-account transfers',
			'Document all violations',
			'Emergency board meeting',
			'Implement expense controls',
		],
	},
	{
		period: '60 DAYS - CORRECTIVE MEASURES',
		borderClass: 'border-yellow-500',
		iconClass: 'text-yellow-500',
		items: [
			'Establish fund segregation policy',
			'Renegotiate insurance payment schedule',
			'Audit all legal expenses',
			'Train management company',
		],
	},
	{
		period: '90 DAYS - LONG-TERM CONTROLS',
		borderClass: 'border-green-500',
		iconClass: 'text-green-500',
		items: [
			'Monthly reconciliation process',
			'Quarterly compliance audits',
			'Vendor management system',
			'Board approval workflow',
		],
	},
];

const certificationChecklist = computed(() => [
	{
		id: 1,
		requirement: 'Operating funds properly segregated',
		compliant: fundSegregationStatus.value.compliant,
		checked: fundSegregationStatus.value.compliant,
		action: fundSegregationStatus.value.compliant ? null : 'Review and correct all improper transfers',
	},
	{
		id: 2,
		requirement: 'Reserve fund transfers properly authorized',
		compliant: false,
		checked: false,
		action: 'Implement board approval process for reserve transfers',
	},
	{
		id: 3,
		requirement: 'Monthly financial statements prepared',
		compliant: true,
		checked: true,
		action: null,
	},
]);

// Chart data
const monthlyBreakdownData = computed(() => ({
	labels: ['Income', 'Insurance', 'Professional', 'Utilities', 'Maintenance', 'Regulatory', 'Banking', 'Other'],
	datasets: [
		{
			label: 'Amount ($)',
			data: [
				monthlyRevenue.value,
				expensesByCategory.value.Insurance,
				expensesByCategory.value.Professional,
				expensesByCategory.value.Utilities,
				expensesByCategory.value.Maintenance,
				expensesByCategory.value.Regulatory,
				expensesByCategory.value.Banking,
				expensesByCategory.value.Other,
			],
			backgroundColor: [
				'rgba(34, 197, 94, 0.8)',
				'rgba(239, 68, 68, 0.8)',
				'rgba(59, 130, 246, 0.8)',
				'rgba(245, 158, 11, 0.8)',
				'rgba(139, 92, 246, 0.8)',
				'rgba(168, 85, 247, 0.8)',
				'rgba(236, 72, 153, 0.8)',
				'rgba(107, 114, 128, 0.8)',
			],
		},
	],
}));

const budgetChartData = computed(() => {
	const categories = Object.keys(budget2025.categories);
	const budgetData = categories.map((cat) => budget2025.categories[cat].monthly);
	const actualData = categories.map((cat) => expensesByCategory.value[cat] || 0);

	return {
		labels: categories,
		datasets: [
			{
				label: 'Budget',
				data: budgetData,
				backgroundColor: 'rgba(107, 114, 128, 0.8)',
			},
			{
				label: 'Actual',
				data: actualData,
				backgroundColor: 'rgba(239, 68, 68, 0.8)',
			},
		],
	};
});

const chartOptions = {
	responsive: true,
	maintainAspectRatio: false,
	plugins: {
		legend: {
			display: true,
			position: 'bottom',
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

const budgetChartOptions = {
	responsive: true,
	maintainAspectRatio: false,
	plugins: {
		legend: {
			display: true,
			position: 'bottom',
		},
	},
	scales: {
		y: {
			beginAtZero: true,
			ticks: {
				callback: (value) => '$' + value.toLocaleString(),
			},
		},
		x: {
			ticks: {
				maxRotation: 45,
			},
		},
	},
};

const ytdChartOptions = {
	responsive: true,
	maintainAspectRatio: false,
	interaction: {
		mode: 'index',
		intersect: false,
	},
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
			type: 'linear',
			display: true,
			position: 'left',
			title: {
				display: true,
				text: 'Account Balance ($)',
			},
			ticks: {
				callback: (value) => '$' + value.toLocaleString(),
			},
		},
		y1: {
			type: 'linear',
			display: true,
			position: 'right',
			title: {
				display: true,
				text: 'Monthly Cash Flow ($)',
			},
			ticks: {
				callback: (value) => '$' + value.toLocaleString(),
			},
			grid: {
				drawOnChartArea: false,
			},
		},
	},
};

// Navigation helper
const router = useRouter();
const navigateTo = (path) => router.push(path);

// Watch for violations and auto-switch to violations tab if there are critical issues
watch(
	() => fundSegregationStatus.value.violations,
	(newViolations) => {
		if (newViolations > 0 && criticalAlerts.value.length > 0) {
			// Could auto-switch to violations tab, but let user control this
			// activeTab.value = 2;
		}
	},
);
</script>
