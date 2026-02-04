<script setup>
definePageMeta({ layout: 'default' })

useSeoMeta({
	title: 'Financial Dashboard',
});

const { isAdmin, isBoardMember } = useRoles()
const { user } = useDirectusAuth()

// Financial composables
const {
	selectedYear: dashYear,
	selectedAccount,
	loading: dashLoading,
	error: dashError,
	fetchDashboardData,
	varianceAnalysis,
	varianceSummary,
	cashFlowSummary,
	generateCashFlowProjections,
	multiYearComparison,
	budgetTrendAnalysis,
	accountMetrics,
	financialHealthScore,
	formatCurrency,
	getMonthName,
	accounts,
	transactions,
} = useFinancialDashboard()

const {
	canReadFinancials,
	canCreateNotes,
	canUpdateNotes,
	canReconcile,
	transactionNotes,
	reconciliationReports,
	reconciliationStatusOptions,
	noteTypeOptions,
	initialize: initReconciliation,
	fetchTransactionNotes,
	createNote,
	resolveNote,
	updateTransactionReconciliation,
	bulkReconcileTransactions,
	createReconciliationReport,
	fetchReconciliationReports,
	completeReconciliationReport,
	generateMonthlyReport,
} = useReconciliationNotes()

const {
	selectedYear: budgetYear,
	loading: budgetLoading,
	budgetCategories,
	budgetItems,
	budgetTotals,
	budgetAmendments,
	itemsByCategory,
	itemsWithPendingAmendments,
	availableYears,
	yearOptions,
	fetchBudgetData,
	createBudgetAmendment,
	approveBudgetAmendment,
} = useBudgetManagement()

const {
	alerts,
	loading: alertsLoading,
	fetchAlerts,
	acknowledgeAlert,
	resolveAlert,
	unresolvedAlerts,
	criticalAlerts,
	boardActionRequired,
	alertCounts,
	getSeverityColor,
	getAlertTypeLabel,
} = useComplianceAlerts()

const {
	logs,
	loading: auditLoading,
	fetchLogs,
	getRecentActivity,
	formattedLogs,
	activitySummary,
	logReconcile,
	actionOptions,
	collectionOptions,
} = useAuditLog()

const {
	loading: assessmentLoading,
	ledgerEntries,
	units,
	fetchUnits,
	fetchLedgerEntries,
	agingReport,
	delinquentAccounts,
	totalOutstandingBalance,
	unitsWithBalances,
	formatCurrency: assessmentFormatCurrency,
	paymentStatusOptions,
} = useAssessmentLedger()

const {
	initializeMatching,
	batchAutoCategorize,
	batchApplyAutoCategorization,
	getUncategorizedTransactions,
	getMatchingStats,
} = useTransactionMatching()

// Local state
const activeTab = ref('overview')
const selectedTransaction = ref(null)
const showNoteDialog = ref(false)
const showReconcileDialog = ref(false)
const showReportDialog = ref(false)
const showAlertDialog = ref(false)
const selectedAlert = ref(null)
const reconcileSelectedIds = ref([])
const reportMonth = ref('')
const reportNotes = ref('')

// Note form
const newNote = ref({ note: '', note_type: 'general' })

// Alert resolution form
const alertResolution = ref({ notes: '', board_resolution: '' })

// Audit log filters
const auditActionFilter = ref(null)
const auditCollectionFilter = ref(null)

// Loading state
const initializing = ref(true)

// Tabs definition
const tabs = [
	{ value: 'overview', label: 'Overview' },
	{ value: 'reconciliation', label: 'Reconciliation' },
	{ value: 'budget', label: 'Budget' },
	{ value: 'compliance', label: 'Compliance' },
	{ value: 'assessments', label: 'Assessments' },
	{ value: 'audit', label: 'Audit Log' },
]

// Initialize all data
onMounted(async () => {
	try {
		await initReconciliation()
		budgetYear.value = dashYear.value

		await Promise.all([
			fetchDashboardData(),
			fetchBudgetData(),
			fetchAlerts({ unresolved: true }),
			getRecentActivity(50),
			fetchUnits(),
		])

		await fetchLedgerEntries(dashYear.value)
		await fetchReconciliationReports(dashYear.value)
		await initializeMatching(dashYear.value)
	} catch (e) {
		console.error('Error initializing financial dashboard:', e)
	} finally {
		initializing.value = false
	}
})

// Sync budget year with dashboard year
watch(dashYear, (newYear) => {
	budgetYear.value = newYear
	fetchLedgerEntries(newYear)
	fetchReconciliationReports(newYear)
	fetchAlerts({ unresolved: true })
	getRecentActivity(50)
	initializeMatching(newYear)
})

// Health score color
const healthScoreColor = computed(() => {
	const score = financialHealthScore.value?.score || 0
	if (score >= 80) return 'text-green-600 dark:text-green-400'
	if (score >= 60) return 'text-yellow-600 dark:text-yellow-400'
	return 'text-red-600 dark:text-red-400'
})

const healthScoreBg = computed(() => {
	const score = financialHealthScore.value?.score || 0
	if (score >= 80) return 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800'
	if (score >= 60) return 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800'
	return 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
})

// Transaction list for reconciliation tab
const accountTransactions = computed(() => {
	return (transactions.value || [])
		.filter((t) => t.account_id === selectedAccount.value)
		.sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date))
})

// Reconciliation stats
const reconciliationStats = computed(() => {
	const txns = accountTransactions.value
	const reconciled = txns.filter((t) => t.reconciliation_status === 'reconciled').length
	const pending = txns.filter((t) => !t.reconciliation_status || t.reconciliation_status === 'pending').length
	const disputed = txns.filter((t) => t.reconciliation_status === 'disputed').length
	return { total: txns.length, reconciled, pending, disputed }
})

// Select/deselect transaction for bulk reconciliation
const toggleReconcileSelection = (id) => {
	const idx = reconcileSelectedIds.value.indexOf(id)
	if (idx > -1) {
		reconcileSelectedIds.value.splice(idx, 1)
	} else {
		reconcileSelectedIds.value.push(id)
	}
}

const isSelected = (id) => reconcileSelectedIds.value.includes(id)

// Reconcile actions
const handleReconcileTransaction = async (transactionId, status) => {
	try {
		await updateTransactionReconciliation(transactionId, status)
		await logReconcile(transactionId, `Status changed to ${status}`)
		await fetchDashboardData()
	} catch (e) {
		console.error('Error reconciling transaction:', e)
	}
}

const handleBulkReconcile = async () => {
	if (reconcileSelectedIds.value.length === 0) return
	try {
		await bulkReconcileTransactions(reconcileSelectedIds.value, 'reconciled')
		for (const id of reconcileSelectedIds.value) {
			await logReconcile(id, 'Bulk reconciled')
		}
		reconcileSelectedIds.value = []
		await fetchDashboardData()
	} catch (e) {
		console.error('Error bulk reconciling:', e)
	}
}

// Note actions
const openNoteDialog = async (transaction) => {
	selectedTransaction.value = transaction
	await fetchTransactionNotes(transaction.id)
	showNoteDialog.value = true
}

const handleCreateNote = async () => {
	if (!selectedTransaction.value || !newNote.value.note.trim()) return
	try {
		await createNote(selectedTransaction.value.id, {
			note: newNote.value.note,
			note_type: newNote.value.note_type,
		})
		newNote.value = { note: '', note_type: 'general' }
		await fetchTransactionNotes(selectedTransaction.value.id)
	} catch (e) {
		console.error('Error creating note:', e)
	}
}

const handleResolveNote = async (noteId) => {
	try {
		await resolveNote(noteId)
		if (selectedTransaction.value) {
			await fetchTransactionNotes(selectedTransaction.value.id)
		}
	} catch (e) {
		console.error('Error resolving note:', e)
	}
}

// Report generation
const handleGenerateReport = async () => {
	if (!reportMonth.value) return
	try {
		const account = accounts.value.find((a) => a.id === selectedAccount.value)
		const stmts = (await fetchReconciliationReports(dashYear.value, selectedAccount.value)) || []
		const reportData = await generateMonthlyReport(
			dashYear.value,
			selectedAccount.value,
			reportMonth.value,
			transactions.value,
			stmts.find((s) => s.report_month === reportMonth.value) || {}
		)
		if (reportNotes.value) {
			reportData.notes = reportNotes.value
		}
		await createReconciliationReport(reportData)
		await fetchReconciliationReports(dashYear.value)
		showReportDialog.value = false
		reportMonth.value = ''
		reportNotes.value = ''
	} catch (e) {
		console.error('Error generating report:', e)
	}
}

// Alert actions
const openAlertDialog = (alert) => {
	selectedAlert.value = alert
	alertResolution.value = { notes: '', board_resolution: '' }
	showAlertDialog.value = true
}

const handleAcknowledgeAlert = async (alertId) => {
	try {
		await acknowledgeAlert(alertId)
		await fetchAlerts({ unresolved: true })
	} catch (e) {
		console.error('Error acknowledging alert:', e)
	}
}

const handleResolveAlert = async () => {
	if (!selectedAlert.value) return
	try {
		await resolveAlert(
			selectedAlert.value.id,
			alertResolution.value.notes,
			alertResolution.value.board_resolution || null
		)
		await fetchAlerts({ unresolved: true })
		showAlertDialog.value = false
		selectedAlert.value = null
	} catch (e) {
		console.error('Error resolving alert:', e)
	}
}

// Audit log filtering
const handleFetchAuditLogs = async () => {
	const filters = { limit: 100 }
	if (auditActionFilter.value) filters.action = auditActionFilter.value
	if (auditCollectionFilter.value) filters.collection = auditCollectionFilter.value
	await fetchLogs(filters)
}

watch([auditActionFilter, auditCollectionFilter], () => {
	handleFetchAuditLogs()
})

// Auto-categorize
const handleAutoCategorize = async () => {
	try {
		const uncategorized = await getUncategorizedTransactions(dashYear.value, selectedAccount.value)
		const categorized = batchAutoCategorize(uncategorized)
		await batchApplyAutoCategorization(categorized, 50)
		await fetchDashboardData()
	} catch (e) {
		console.error('Error auto-categorizing:', e)
	}
}

// Helpers
const reconciliationStatusColor = (status) => {
	switch (status) {
		case 'reconciled': return 'green'
		case 'disputed': return 'red'
		default: return 'yellow'
	}
}

const formatDate = (dateStr) => {
	if (!dateStr) return '—'
	return new Date(dateStr).toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	})
}

const formatDateTime = (dateStr) => {
	if (!dateStr) return '—'
	return new Date(dateStr).toLocaleString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
		hour: 'numeric',
		minute: '2-digit',
	})
}

const monthOptions = [
	{ label: 'January', value: '01' },
	{ label: 'February', value: '02' },
	{ label: 'March', value: '03' },
	{ label: 'April', value: '04' },
	{ label: 'May', value: '05' },
	{ label: 'June', value: '06' },
	{ label: 'July', value: '07' },
	{ label: 'August', value: '08' },
	{ label: 'September', value: '09' },
	{ label: 'October', value: '10' },
	{ label: 'November', value: '11' },
	{ label: 'December', value: '12' },
]
</script>

<template>
	<div class="min-h-screen">
		<!-- Loading state -->
		<div v-if="initializing" class="flex items-center justify-center py-32">
			<div class="text-center space-y-4">
				<div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
				<p class="text-sm text-muted-foreground">Loading financial data...</p>
			</div>
		</div>

		<template v-else>
			<!-- Header -->
			<div class="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
				<div class="max-w-[1400px] mx-auto px-4 sm:px-6 py-4 sm:py-6">
					<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
						<div>
							<h1 class="text-xl sm:text-2xl font-semibold tracking-tight">Financial Dashboard</h1>
							<p class="text-sm text-muted-foreground mt-1">
								Fiscal Year {{ dashYear }} &middot; Financial management and reporting
							</p>
						</div>
						<div class="flex items-center gap-3">
							<!-- Year selector -->
							<select
								v-model="dashYear"
								class="h-9 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
							>
								<option v-for="y in [2023, 2024, 2025, 2026]" :key="y" :value="y">
									FY {{ y }}
								</option>
							</select>
							<!-- Account selector -->
							<select
								v-model="selectedAccount"
								class="h-9 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
							>
								<option v-for="a in accounts" :key="a.id" :value="a.id">
									{{ a.name || `Account ${a.id}` }}
								</option>
							</select>
						</div>
					</div>

					<!-- Tabs -->
					<div class="mt-4 -mb-px flex gap-1 overflow-x-auto">
						<button
							v-for="tab in tabs"
							:key="tab.value"
							:class="[
								'px-3 py-2 text-sm font-medium rounded-t-md transition-colors whitespace-nowrap',
								activeTab === tab.value
									? 'bg-background text-foreground border border-b-background -mb-px shadow-sm'
									: 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
							]"
							@click="activeTab = tab.value"
						>
							{{ tab.label }}
							<Badge
								v-if="tab.value === 'compliance' && alertCounts.total > 0"
								variant="solid"
								color="red"
								size="xs"
								class="ml-1.5"
							>
								{{ alertCounts.total }}
							</Badge>
						</button>
					</div>
				</div>
			</div>

			<!-- Content -->
			<div class="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
				<!-- Error state -->
				<div v-if="dashError" class="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-4 mb-6">
					<p class="text-sm text-red-700 dark:text-red-400">{{ dashError }}</p>
				</div>

				<!-- ==================== OVERVIEW TAB ==================== -->
				<div v-if="activeTab === 'overview'" class="space-y-6">
					<!-- Health Score + Key Metrics -->
					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
						<!-- Health Score -->
						<Card :class="['border', healthScoreBg]">
							<CardHeader class="pb-2">
								<CardDescription>Financial Health</CardDescription>
							</CardHeader>
							<CardContent>
								<div class="flex items-baseline gap-2">
									<span :class="['text-3xl font-bold', healthScoreColor]">
										{{ financialHealthScore?.grade || '—' }}
									</span>
									<span :class="['text-lg font-semibold', healthScoreColor]">
										{{ financialHealthScore?.score || 0 }}/100
									</span>
								</div>
								<p class="text-xs text-muted-foreground mt-1 capitalize">
									{{ financialHealthScore?.status || 'Unknown' }}
								</p>
								<ul v-if="financialHealthScore?.issues?.length" class="mt-2 space-y-1">
									<li
										v-for="(issue, i) in financialHealthScore.issues"
										:key="i"
										class="text-xs text-muted-foreground"
									>
										&bull; {{ issue }}
									</li>
								</ul>
							</CardContent>
						</Card>

						<!-- Account Balances -->
						<Card v-for="metric in accountMetrics" :key="metric.id" class="border">
							<CardHeader class="pb-2">
								<CardDescription>{{ metric.name || `Account ${metric.id}` }}</CardDescription>
							</CardHeader>
							<CardContent>
								<p class="text-2xl font-bold tracking-tight">
									{{ formatCurrency(metric.currentBalance) }}
								</p>
								<div class="flex items-center gap-1 mt-1">
									<span
										:class="[
											'text-xs font-medium',
											metric.change >= 0
												? 'text-green-600 dark:text-green-400'
												: 'text-red-600 dark:text-red-400',
										]"
									>
										{{ metric.change >= 0 ? '+' : '' }}{{ formatCurrency(metric.change) }}
									</span>
									<span class="text-xs text-muted-foreground">
										({{ metric.changePercent >= 0 ? '+' : '' }}{{ metric.changePercent }}%)
									</span>
								</div>
							</CardContent>
						</Card>
					</div>

					<!-- Variance Summary + Cash Flow -->
					<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
						<!-- Budget Variance -->
						<Card class="border">
							<CardHeader>
								<CardTitle class="text-base">Budget vs Actual</CardTitle>
								<CardDescription>
									Category variance analysis for FY {{ dashYear }}
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div
									v-if="varianceSummary"
									class="grid grid-cols-3 gap-4 p-3 rounded-lg bg-muted/50 mb-4"
								>
									<div class="text-center">
										<p class="text-xs text-muted-foreground">Budget</p>
										<p class="text-sm font-semibold">{{ formatCurrency(varianceSummary.totalBudget) }}</p>
									</div>
									<div class="text-center">
										<p class="text-xs text-muted-foreground">Actual</p>
										<p class="text-sm font-semibold">{{ formatCurrency(varianceSummary.totalActual) }}</p>
									</div>
									<div class="text-center">
										<p class="text-xs text-muted-foreground">Variance</p>
										<p
											:class="[
												'text-sm font-semibold',
												varianceSummary.totalVariance > 0
													? 'text-red-600 dark:text-red-400'
													: 'text-green-600 dark:text-green-400',
											]"
										>
											{{ formatCurrency(varianceSummary.totalVariance) }}
										</p>
									</div>
								</div>

								<div class="space-y-3 max-h-[300px] overflow-y-auto">
									<div
										v-for="item in varianceAnalysis"
										:key="item.categoryId"
										class="flex items-center justify-between gap-4"
									>
										<div class="flex items-center gap-2 min-w-0">
											<div
												class="h-2.5 w-2.5 rounded-full shrink-0"
												:style="{ backgroundColor: item.color || '#6B7280' }"
											/>
											<span class="text-sm truncate">{{ item.category }}</span>
										</div>
										<div class="flex items-center gap-3 shrink-0">
											<span class="text-sm tabular-nums">{{ formatCurrency(item.actual) }}</span>
											<Badge
												:variant="'soft'"
												:color="item.status === 'over' ? 'red' : item.status === 'under' ? 'green' : 'gray'"
												size="xs"
											>
												{{ item.percentVariance > 0 ? '+' : '' }}{{ item.percentVariance }}%
											</Badge>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>

						<!-- Cash Flow -->
						<Card class="border">
							<CardHeader>
								<CardTitle class="text-base">Cash Flow Summary</CardTitle>
								<CardDescription>6-month projection for selected account</CardDescription>
							</CardHeader>
							<CardContent>
								<div v-if="cashFlowSummary" class="space-y-4">
									<div class="grid grid-cols-2 gap-4">
										<div class="p-3 rounded-lg bg-muted/50">
											<p class="text-xs text-muted-foreground">Current Balance</p>
											<p class="text-lg font-semibold">{{ formatCurrency(cashFlowSummary.currentBalance) }}</p>
										</div>
										<div class="p-3 rounded-lg bg-muted/50">
											<p class="text-xs text-muted-foreground">Projected (6 mo)</p>
											<p
												:class="[
													'text-lg font-semibold',
													cashFlowSummary.projectedBalance6Mo < 0
														? 'text-red-600 dark:text-red-400'
														: '',
												]"
											>
												{{ formatCurrency(cashFlowSummary.projectedBalance6Mo) }}
											</p>
										</div>
									</div>
									<div class="grid grid-cols-2 gap-4">
										<div class="p-3 rounded-lg bg-muted/50">
											<p class="text-xs text-muted-foreground">Avg Monthly Income</p>
											<p class="text-sm font-semibold text-green-600 dark:text-green-400">
												+{{ formatCurrency(cashFlowSummary.avgMonthlyIncome) }}
											</p>
										</div>
										<div class="p-3 rounded-lg bg-muted/50">
											<p class="text-xs text-muted-foreground">Avg Monthly Expenses</p>
											<p class="text-sm font-semibold text-red-600 dark:text-red-400">
												-{{ formatCurrency(cashFlowSummary.avgMonthlyExpenses) }}
											</p>
										</div>
									</div>
									<div
										v-if="cashFlowSummary.monthsUntilNegative"
										class="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-3"
									>
										<p class="text-xs font-medium text-red-700 dark:text-red-400">
											Warning: Account projected to go negative in {{ cashFlowSummary.monthsUntilNegative }} month(s)
										</p>
									</div>
									<div class="flex items-center gap-2">
										<span class="text-xs text-muted-foreground">Trend:</span>
										<Badge
											variant="soft"
											:color="cashFlowSummary.trend === 'positive' ? 'green' : cashFlowSummary.trend === 'negative' ? 'red' : 'gray'"
											size="xs"
										>
											{{ cashFlowSummary.trend }}
										</Badge>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>

					<!-- Multi-Year Comparison -->
					<Card class="border">
						<CardHeader>
							<CardTitle class="text-base">Multi-Year Budget Comparison</CardTitle>
							<CardDescription>Year-over-year budget changes</CardDescription>
						</CardHeader>
						<CardContent>
							<div v-if="multiYearComparison && multiYearComparison.categories?.length" class="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead class="min-w-[140px]">Category</TableHead>
											<TableHead v-for="yr in multiYearComparison.years" :key="yr" class="text-right min-w-[100px]">
												{{ yr }}
											</TableHead>
											<TableHead class="text-right min-w-[80px]">YoY Change</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										<TableRow v-for="row in multiYearComparison.categories" :key="row.category">
											<TableCell class="font-medium text-sm">{{ row.category }}</TableCell>
											<TableCell
												v-for="yr in multiYearComparison.years"
												:key="yr"
												class="text-right text-sm tabular-nums"
											>
												{{ formatCurrency(row[`year_${yr}`]) }}
											</TableCell>
											<TableCell class="text-right">
												<Badge
													variant="soft"
													:color="row.yoyPercent > 5 ? 'red' : row.yoyPercent < -5 ? 'green' : 'gray'"
													size="xs"
												>
													{{ row.yoyPercent > 0 ? '+' : '' }}{{ row.yoyPercent }}%
												</Badge>
											</TableCell>
										</TableRow>
										<!-- Totals row -->
										<TableRow v-if="multiYearComparison.totals" class="border-t-2 font-semibold">
											<TableCell class="text-sm">TOTAL</TableCell>
											<TableCell
												v-for="yr in multiYearComparison.years"
												:key="yr"
												class="text-right text-sm tabular-nums"
											>
												{{ formatCurrency(multiYearComparison.totals[`year_${yr}`]) }}
											</TableCell>
											<TableCell class="text-right">
												<Badge
													variant="soft"
													:color="multiYearComparison.totals.yoyPercent > 5 ? 'red' : multiYearComparison.totals.yoyPercent < -5 ? 'green' : 'gray'"
													size="xs"
												>
													{{ multiYearComparison.totals.yoyPercent > 0 ? '+' : '' }}{{ multiYearComparison.totals.yoyPercent }}%
												</Badge>
											</TableCell>
										</TableRow>
									</TableBody>
								</Table>
							</div>
							<p v-else class="text-sm text-muted-foreground py-4 text-center">
								No multi-year data available.
							</p>
						</CardContent>
					</Card>
				</div>

				<!-- ==================== RECONCILIATION TAB ==================== -->
				<div v-if="activeTab === 'reconciliation'" class="space-y-6">
					<!-- Reconciliation Stats -->
					<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
						<Card class="border">
							<CardContent class="pt-4 pb-3">
								<p class="text-xs text-muted-foreground">Total Transactions</p>
								<p class="text-2xl font-bold">{{ reconciliationStats.total }}</p>
							</CardContent>
						</Card>
						<Card class="border">
							<CardContent class="pt-4 pb-3">
								<p class="text-xs text-muted-foreground">Reconciled</p>
								<p class="text-2xl font-bold text-green-600 dark:text-green-400">
									{{ reconciliationStats.reconciled }}
								</p>
							</CardContent>
						</Card>
						<Card class="border">
							<CardContent class="pt-4 pb-3">
								<p class="text-xs text-muted-foreground">Pending</p>
								<p class="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
									{{ reconciliationStats.pending }}
								</p>
							</CardContent>
						</Card>
						<Card class="border">
							<CardContent class="pt-4 pb-3">
								<p class="text-xs text-muted-foreground">Disputed</p>
								<p class="text-2xl font-bold text-red-600 dark:text-red-400">
									{{ reconciliationStats.disputed }}
								</p>
							</CardContent>
						</Card>
					</div>

					<!-- Actions bar -->
					<div class="flex flex-wrap items-center gap-3">
						<button
							v-if="canReconcile && reconcileSelectedIds.length > 0"
							class="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
							@click="handleBulkReconcile"
						>
							Reconcile Selected ({{ reconcileSelectedIds.length }})
						</button>
						<button
							v-if="canCreateNotes"
							class="inline-flex items-center gap-2 h-9 px-4 rounded-md border border-input bg-background text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
							@click="showReportDialog = true"
						>
							Generate Report
						</button>
						<button
							v-if="isAdmin || isBoardMember"
							class="inline-flex items-center gap-2 h-9 px-4 rounded-md border border-input bg-background text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
							@click="handleAutoCategorize"
						>
							Auto-Categorize
						</button>
					</div>

					<!-- Transaction List -->
					<Card class="border">
						<CardHeader>
							<CardTitle class="text-base">Transactions</CardTitle>
							<CardDescription>
								Select transactions to reconcile, add notes, or change status
							</CardDescription>
						</CardHeader>
						<CardContent class="p-0">
							<div class="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead v-if="canReconcile" class="w-10">
												<span class="sr-only">Select</span>
											</TableHead>
											<TableHead class="min-w-[100px]">Date</TableHead>
											<TableHead class="min-w-[200px]">Description</TableHead>
											<TableHead class="min-w-[120px]">Vendor</TableHead>
											<TableHead class="text-right min-w-[100px]">Amount</TableHead>
											<TableHead class="min-w-[100px]">Status</TableHead>
											<TableHead class="min-w-[100px]">Actions</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										<TableRow
											v-for="txn in accountTransactions.slice(0, 100)"
											:key="txn.id"
											:class="{ 'bg-muted/30': isSelected(txn.id) }"
										>
											<TableCell v-if="canReconcile">
												<input
													type="checkbox"
													:checked="isSelected(txn.id)"
													class="h-4 w-4 rounded border-input"
													@change="toggleReconcileSelection(txn.id)"
												/>
											</TableCell>
											<TableCell class="text-sm tabular-nums">
												{{ formatDate(txn.transaction_date) }}
											</TableCell>
											<TableCell class="text-sm max-w-[250px] truncate">
												{{ txn.description || '—' }}
											</TableCell>
											<TableCell class="text-sm">
												{{ txn.vendor || '—' }}
											</TableCell>
											<TableCell class="text-right text-sm tabular-nums font-medium">
												<span
													:class="
														txn.transaction_type === 'deposit' || txn.transaction_type === 'transfer_in'
															? 'text-green-600 dark:text-green-400'
															: ''
													"
												>
													{{ formatCurrency(txn.amount) }}
												</span>
											</TableCell>
											<TableCell>
												<Badge
													variant="soft"
													:color="reconciliationStatusColor(txn.reconciliation_status)"
													size="xs"
												>
													{{ txn.reconciliation_status || 'pending' }}
												</Badge>
											</TableCell>
											<TableCell>
												<div class="flex items-center gap-1">
													<button
														v-if="canReconcile && txn.reconciliation_status !== 'reconciled'"
														class="inline-flex items-center h-7 px-2 rounded text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
														@click="handleReconcileTransaction(txn.id, 'reconciled')"
													>
														Reconcile
													</button>
													<button
														v-if="canCreateNotes"
														class="inline-flex items-center h-7 px-2 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
														@click="openNoteDialog(txn)"
													>
														Notes
													</button>
													<button
														v-if="canReconcile && txn.reconciliation_status !== 'disputed'"
														class="inline-flex items-center h-7 px-2 rounded text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
														@click="handleReconcileTransaction(txn.id, 'disputed')"
													>
														Dispute
													</button>
												</div>
											</TableCell>
										</TableRow>
										<TableRow v-if="accountTransactions.length === 0">
											<TableCell :colspan="canReconcile ? 7 : 6" class="text-center text-sm text-muted-foreground py-8">
												No transactions found for this account and fiscal year.
											</TableCell>
										</TableRow>
									</TableBody>
								</Table>
							</div>
						</CardContent>
					</Card>

					<!-- Reconciliation Reports -->
					<Card class="border">
						<CardHeader>
							<CardTitle class="text-base">Reconciliation Reports</CardTitle>
							<CardDescription>Monthly reconciliation reports for FY {{ dashYear }}</CardDescription>
						</CardHeader>
						<CardContent>
							<div v-if="reconciliationReports.length > 0" class="space-y-3">
								<div
									v-for="report in reconciliationReports"
									:key="report.id"
									class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg border bg-muted/30"
								>
									<div class="space-y-1">
										<div class="flex items-center gap-2">
											<span class="text-sm font-medium">
												{{ monthOptions.find((m) => m.value === report.report_month)?.label || report.report_month }}
											</span>
											<Badge
												variant="soft"
												:color="report.reconciliation_status === 'reconciled' ? 'green' : report.reconciliation_status === 'discrepency' ? 'red' : 'yellow'"
												size="xs"
											>
												{{ report.reconciliation_status }}
											</Badge>
										</div>
										<p class="text-xs text-muted-foreground">
											Difference: {{ formatCurrency(report.reconciliation_difference) }}
											&middot; Reconciled: {{ report.transactions_reconciled || 0 }}
											&middot; Pending: {{ report.transactions_pending || 0 }}
										</p>
									</div>
									<div class="flex items-center gap-2">
										<button
											v-if="canReconcile && report.reconciliation_status !== 'reconciled'"
											class="inline-flex items-center h-8 px-3 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
											@click="completeReconciliationReport(report.id)"
										>
											Mark Complete
										</button>
									</div>
								</div>
							</div>
							<p v-else class="text-sm text-muted-foreground text-center py-6">
								No reconciliation reports generated yet.
							</p>
						</CardContent>
					</Card>
				</div>

				<!-- ==================== BUDGET TAB ==================== -->
				<div v-if="activeTab === 'budget'" class="space-y-6">
					<!-- Budget Totals -->
					<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
						<Card class="border">
							<CardContent class="pt-4 pb-3">
								<p class="text-xs text-muted-foreground">Annual Revenue</p>
								<p class="text-2xl font-bold">{{ formatCurrency(budgetTotals.yearlyRevenue) }}</p>
							</CardContent>
						</Card>
						<Card class="border">
							<CardContent class="pt-4 pb-3">
								<p class="text-xs text-muted-foreground">Annual Expenses</p>
								<p class="text-2xl font-bold">{{ formatCurrency(budgetTotals.yearlyExpenses) }}</p>
							</CardContent>
						</Card>
						<Card class="border">
							<CardContent class="pt-4 pb-3">
								<p class="text-xs text-muted-foreground">Net Operating</p>
								<p
									:class="[
										'text-2xl font-bold',
										budgetTotals.yearlyNet >= 0
											? 'text-green-600 dark:text-green-400'
											: 'text-red-600 dark:text-red-400',
									]"
								>
									{{ formatCurrency(budgetTotals.yearlyNet) }}
								</p>
							</CardContent>
						</Card>
						<Card class="border">
							<CardContent class="pt-4 pb-3">
								<p class="text-xs text-muted-foreground">Monthly Assessment</p>
								<p class="text-2xl font-bold">{{ formatCurrency(budgetTotals.monthlyAssessment) }}</p>
								<p class="text-xs text-muted-foreground">per unit ({{ budgetTotals.unitCount }} units)</p>
							</CardContent>
						</Card>
					</div>

					<!-- Budget Categories -->
					<Card class="border">
						<CardHeader>
							<CardTitle class="text-base">Budget Categories &amp; Line Items</CardTitle>
							<CardDescription>FY {{ dashYear }} operating budget breakdown</CardDescription>
						</CardHeader>
						<CardContent>
							<div v-if="Object.keys(itemsByCategory).length > 0" class="space-y-4">
								<div
									v-for="(category, catId) in itemsByCategory"
									:key="catId"
									class="rounded-lg border"
								>
									<div class="flex items-center justify-between p-3 bg-muted/30">
										<div class="flex items-center gap-2">
											<div
												class="h-3 w-3 rounded-full"
												:style="{ backgroundColor: category.color || '#6B7280' }"
											/>
											<span class="text-sm font-medium">{{ category.category_name }}</span>
										</div>
										<div class="flex items-center gap-4 text-sm">
											<span class="text-muted-foreground">
												Monthly: {{ formatCurrency(category.monthly_budget) }}
											</span>
											<span class="font-medium">
												Annual: {{ formatCurrency(category.yearly_budget) }}
											</span>
										</div>
									</div>
									<div v-if="category.items?.length" class="divide-y">
										<div
											v-for="item in category.items"
											:key="item.id"
											class="flex items-center justify-between px-3 py-2 pl-8 text-sm"
										>
											<span class="text-muted-foreground">{{ item.description || item.item_code }}</span>
											<div class="flex items-center gap-4 tabular-nums">
												<span class="text-muted-foreground">{{ formatCurrency(item.monthly_budget) }}/mo</span>
												<span>{{ formatCurrency(item.yearly_budget) }}/yr</span>
											</div>
										</div>
									</div>
								</div>
							</div>
							<p v-else class="text-sm text-muted-foreground text-center py-6">
								No budget data available for FY {{ dashYear }}.
							</p>
						</CardContent>
					</Card>

					<!-- Pending Amendments -->
					<Card v-if="budgetAmendments.length > 0" class="border">
						<CardHeader>
							<CardTitle class="text-base">Budget Amendments</CardTitle>
							<CardDescription>Pending and approved amendments for FY {{ dashYear }}</CardDescription>
						</CardHeader>
						<CardContent class="p-0">
							<div class="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Item</TableHead>
											<TableHead>Effective Date</TableHead>
											<TableHead class="text-right">Original</TableHead>
											<TableHead class="text-right">Amended</TableHead>
											<TableHead>Reason</TableHead>
											<TableHead>Status</TableHead>
											<TableHead v-if="isAdmin">Actions</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										<TableRow v-for="amendment in budgetAmendments" :key="amendment.id">
											<TableCell class="text-sm">
												{{
													typeof amendment.budget_item_id === 'object'
														? amendment.budget_item_id?.description || amendment.budget_item_id?.item_code
														: amendment.budget_item_id
												}}
											</TableCell>
											<TableCell class="text-sm tabular-nums">
												{{ formatDate(amendment.effective_date) }}
											</TableCell>
											<TableCell class="text-right text-sm tabular-nums">
												{{ formatCurrency(amendment.original_annual_amount) }}
											</TableCell>
											<TableCell class="text-right text-sm tabular-nums font-medium">
												{{ formatCurrency(amendment.amended_annual_amount) }}
											</TableCell>
											<TableCell class="text-sm max-w-[200px] truncate">
												{{ amendment.reason || '—' }}
											</TableCell>
											<TableCell>
												<Badge
													variant="soft"
													:color="amendment.is_approved ? 'green' : 'yellow'"
													size="xs"
												>
													{{ amendment.is_approved ? 'Approved' : 'Pending' }}
												</Badge>
											</TableCell>
											<TableCell v-if="isAdmin">
												<button
													v-if="!amendment.is_approved"
													class="inline-flex items-center h-7 px-2 rounded text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
													@click="approveBudgetAmendment(amendment.id, user?.id)"
												>
													Approve
												</button>
											</TableCell>
										</TableRow>
									</TableBody>
								</Table>
							</div>
						</CardContent>
					</Card>

					<!-- Budget Trend -->
					<Card v-if="budgetTrendAnalysis" class="border">
						<CardHeader>
							<CardTitle class="text-base">Budget Trends</CardTitle>
							<CardDescription>Year-over-year category trend analysis</CardDescription>
						</CardHeader>
						<CardContent>
							<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
								<div class="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
									<p class="text-xs font-medium text-red-700 dark:text-red-400 mb-2">
										Increasing ({{ budgetTrendAnalysis.increasing.length }})
									</p>
									<ul class="space-y-1">
										<li
											v-for="cat in budgetTrendAnalysis.increasing.slice(0, 5)"
											:key="cat.category"
											class="text-xs text-red-600 dark:text-red-400"
										>
											{{ cat.category }}: +{{ cat.yoyPercent }}%
										</li>
									</ul>
								</div>
								<div class="p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
									<p class="text-xs font-medium text-green-700 dark:text-green-400 mb-2">
										Decreasing ({{ budgetTrendAnalysis.decreasing.length }})
									</p>
									<ul class="space-y-1">
										<li
											v-for="cat in budgetTrendAnalysis.decreasing.slice(0, 5)"
											:key="cat.category"
											class="text-xs text-green-600 dark:text-green-400"
										>
											{{ cat.category }}: {{ cat.yoyPercent }}%
										</li>
									</ul>
								</div>
								<div class="p-3 rounded-lg bg-muted/50 border">
									<p class="text-xs font-medium text-muted-foreground mb-2">
										Stable ({{ budgetTrendAnalysis.stable.length }})
									</p>
									<ul class="space-y-1">
										<li
											v-for="cat in budgetTrendAnalysis.stable.slice(0, 5)"
											:key="cat.category"
											class="text-xs text-muted-foreground"
										>
											{{ cat.category }}: {{ cat.yoyPercent }}%
										</li>
									</ul>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				<!-- ==================== COMPLIANCE TAB ==================== -->
				<div v-if="activeTab === 'compliance'" class="space-y-6">
					<!-- Alert Summary -->
					<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
						<Card class="border">
							<CardContent class="pt-4 pb-3">
								<p class="text-xs text-muted-foreground">Total Unresolved</p>
								<p class="text-2xl font-bold">{{ alertCounts.total }}</p>
							</CardContent>
						</Card>
						<Card class="border border-red-200 dark:border-red-800">
							<CardContent class="pt-4 pb-3">
								<p class="text-xs text-muted-foreground">Critical</p>
								<p class="text-2xl font-bold text-red-600 dark:text-red-400">{{ alertCounts.critical }}</p>
							</CardContent>
						</Card>
						<Card class="border border-yellow-200 dark:border-yellow-800">
							<CardContent class="pt-4 pb-3">
								<p class="text-xs text-muted-foreground">Warnings</p>
								<p class="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{{ alertCounts.warning }}</p>
							</CardContent>
						</Card>
						<Card class="border">
							<CardContent class="pt-4 pb-3">
								<p class="text-xs text-muted-foreground">Board Action Required</p>
								<p class="text-2xl font-bold">{{ boardActionRequired.length }}</p>
							</CardContent>
						</Card>
					</div>

					<!-- Alerts List -->
					<Card class="border">
						<CardHeader>
							<CardTitle class="text-base">Compliance Alerts</CardTitle>
							<CardDescription>Active compliance alerts and fund segregation issues</CardDescription>
						</CardHeader>
						<CardContent>
							<div v-if="unresolvedAlerts.length > 0" class="space-y-3">
								<div
									v-for="alert in unresolvedAlerts"
									:key="alert.id"
									:class="[
										'rounded-lg border p-4',
										alert.severity === 'critical'
											? 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20'
											: alert.severity === 'warning'
												? 'border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-950/20'
												: 'border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20',
									]"
								>
									<div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
										<div class="space-y-1 min-w-0">
											<div class="flex items-center gap-2 flex-wrap">
												<Badge
													variant="solid"
													:color="getSeverityColor(alert.severity)"
													size="xs"
												>
													{{ alert.severity }}
												</Badge>
												<Badge variant="soft" color="gray" size="xs">
													{{ getAlertTypeLabel(alert.alert_type) }}
												</Badge>
												<Badge v-if="alert.requires_board_action" variant="soft" color="purple" size="xs">
													Board Action
												</Badge>
											</div>
											<h4 class="text-sm font-medium">{{ alert.title }}</h4>
											<p class="text-xs text-muted-foreground">{{ alert.description }}</p>
											<p class="text-xs text-muted-foreground">
												Created: {{ formatDateTime(alert.date_created) }}
												<template v-if="alert.amount">
													&middot; Amount: {{ formatCurrency(alert.amount) }}
												</template>
											</p>
										</div>
										<div class="flex items-center gap-2 shrink-0">
											<button
												v-if="!alert.is_acknowledged && (isAdmin || isBoardMember)"
												class="inline-flex items-center h-8 px-3 rounded-md text-xs font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
												@click="handleAcknowledgeAlert(alert.id)"
											>
												Acknowledge
											</button>
											<button
												v-if="isAdmin || isBoardMember"
												class="inline-flex items-center h-8 px-3 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
												@click="openAlertDialog(alert)"
											>
												Resolve
											</button>
										</div>
									</div>
								</div>
							</div>
							<p v-else class="text-sm text-muted-foreground text-center py-8">
								No active compliance alerts. All clear.
							</p>
						</CardContent>
					</Card>
				</div>

				<!-- ==================== ASSESSMENTS TAB ==================== -->
				<div v-if="activeTab === 'assessments'" class="space-y-6">
					<!-- Aging Summary -->
					<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
						<Card
							v-for="(bucket, key) in agingReport"
							:key="key"
							:class="[
								'border',
								key === '90+'
									? 'border-red-200 dark:border-red-800'
									: key === '61-90'
										? 'border-orange-200 dark:border-orange-800'
										: key === '31-60'
											? 'border-yellow-200 dark:border-yellow-800'
											: '',
							]"
						>
							<CardContent class="pt-4 pb-3">
								<p class="text-xs text-muted-foreground">
									{{ key === 'current' ? 'Current' : `${key} Days` }}
								</p>
								<p class="text-lg font-bold">{{ assessmentFormatCurrency(bucket.amount) }}</p>
								<p class="text-xs text-muted-foreground">{{ bucket.count }} entries</p>
							</CardContent>
						</Card>
					</div>

					<!-- Total Outstanding -->
					<Card class="border">
						<CardContent class="pt-4 pb-3 flex items-center justify-between">
							<div>
								<p class="text-sm text-muted-foreground">Total Outstanding Balance</p>
								<p class="text-2xl font-bold">{{ assessmentFormatCurrency(totalOutstandingBalance) }}</p>
							</div>
							<Badge
								variant="soft"
								:color="delinquentAccounts.length > 0 ? 'red' : 'green'"
								size="sm"
							>
								{{ delinquentAccounts.length }} delinquent
							</Badge>
						</CardContent>
					</Card>

					<!-- Units with Balances -->
					<Card class="border">
						<CardHeader>
							<CardTitle class="text-base">Unit Assessment Status</CardTitle>
							<CardDescription>FY {{ dashYear }} assessment tracking by unit</CardDescription>
						</CardHeader>
						<CardContent class="p-0">
							<div class="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead class="min-w-[80px]">Unit</TableHead>
											<TableHead class="text-right min-w-[100px]">Total Due</TableHead>
											<TableHead class="text-right min-w-[100px]">Total Paid</TableHead>
											<TableHead class="text-right min-w-[100px]">Balance</TableHead>
											<TableHead class="text-center min-w-[80px]">Delinquent</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										<TableRow
											v-for="unit in unitsWithBalances"
											:key="unit.id"
											:class="{ 'bg-red-50/50 dark:bg-red-950/10': unit.isDelinquent }"
										>
											<TableCell class="font-medium text-sm">
												{{ unit.number || `#${unit.id}` }}
											</TableCell>
											<TableCell class="text-right text-sm tabular-nums">
												{{ assessmentFormatCurrency(unit.totalDue) }}
											</TableCell>
											<TableCell class="text-right text-sm tabular-nums">
												{{ assessmentFormatCurrency(unit.totalPaid) }}
											</TableCell>
											<TableCell
												:class="[
													'text-right text-sm tabular-nums font-medium',
													unit.balance > 0 ? 'text-red-600 dark:text-red-400' : '',
												]"
											>
												{{ assessmentFormatCurrency(unit.balance) }}
											</TableCell>
											<TableCell class="text-center">
												<Badge
													v-if="unit.isDelinquent"
													variant="soft"
													color="red"
													size="xs"
												>
													{{ unit.delinquentMonths }} mo
												</Badge>
												<span v-else class="text-xs text-muted-foreground">—</span>
											</TableCell>
										</TableRow>
										<TableRow v-if="unitsWithBalances.length === 0">
											<TableCell colspan="5" class="text-center text-sm text-muted-foreground py-8">
												No assessment data available.
											</TableCell>
										</TableRow>
									</TableBody>
								</Table>
							</div>
						</CardContent>
					</Card>
				</div>

				<!-- ==================== AUDIT LOG TAB ==================== -->
				<div v-if="activeTab === 'audit'" class="space-y-6">
					<!-- Filters -->
					<div class="flex flex-wrap items-center gap-3">
						<select
							v-model="auditActionFilter"
							class="h-9 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
						>
							<option v-for="opt in actionOptions" :key="opt.value" :value="opt.value">
								{{ opt.label }}
							</option>
						</select>
						<select
							v-model="auditCollectionFilter"
							class="h-9 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
						>
							<option v-for="opt in collectionOptions" :key="opt.value" :value="opt.value">
								{{ opt.label }}
							</option>
						</select>
					</div>

					<!-- Activity Summary -->
					<div v-if="activitySummary" class="grid grid-cols-1 sm:grid-cols-3 gap-4">
						<Card class="border">
							<CardContent class="pt-4 pb-3">
								<p class="text-xs text-muted-foreground">Total Log Entries</p>
								<p class="text-2xl font-bold">{{ activitySummary.total }}</p>
							</CardContent>
						</Card>
						<Card class="border">
							<CardContent class="pt-4 pb-3">
								<p class="text-xs text-muted-foreground">Actions Breakdown</p>
								<div class="flex flex-wrap gap-1.5 mt-1">
									<Badge
										v-for="(count, action) in activitySummary.byAction"
										:key="action"
										variant="soft"
										color="gray"
										size="xs"
									>
										{{ action }}: {{ count }}
									</Badge>
								</div>
							</CardContent>
						</Card>
						<Card class="border">
							<CardContent class="pt-4 pb-3">
								<p class="text-xs text-muted-foreground">Collections Modified</p>
								<div class="flex flex-wrap gap-1.5 mt-1">
									<Badge
										v-for="(count, coll) in activitySummary.byCollection"
										:key="coll"
										variant="soft"
										color="blue"
										size="xs"
									>
										{{ coll }}: {{ count }}
									</Badge>
								</div>
							</CardContent>
						</Card>
					</div>

					<!-- Audit Log Table -->
					<Card class="border">
						<CardHeader>
							<CardTitle class="text-base">Audit Trail</CardTitle>
							<CardDescription>Complete audit log of financial operations</CardDescription>
						</CardHeader>
						<CardContent class="p-0">
							<div class="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead class="min-w-[140px]">Timestamp</TableHead>
											<TableHead class="min-w-[80px]">Action</TableHead>
											<TableHead class="min-w-[120px]">Collection</TableHead>
											<TableHead class="min-w-[100px]">User</TableHead>
											<TableHead class="min-w-[200px]">Notes</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										<TableRow v-for="log in formattedLogs.slice(0, 100)" :key="log.id">
											<TableCell class="text-sm tabular-nums text-muted-foreground">
												{{ formatDateTime(log.timestamp) }}
											</TableCell>
											<TableCell>
												<Badge
													variant="soft"
													:color="
														log.action === 'Created'
															? 'green'
															: log.action === 'Deleted'
																? 'red'
																: log.action === 'Reconciled'
																	? 'blue'
																	: log.action === 'Approved'
																		? 'purple'
																		: 'gray'
													"
													size="xs"
												>
													{{ log.action }}
												</Badge>
											</TableCell>
											<TableCell class="text-sm">{{ log.collection }}</TableCell>
											<TableCell class="text-sm">{{ log.user }}</TableCell>
											<TableCell class="text-sm text-muted-foreground max-w-[250px] truncate">
												{{ log.notes || '—' }}
											</TableCell>
										</TableRow>
										<TableRow v-if="formattedLogs.length === 0">
											<TableCell colspan="5" class="text-center text-sm text-muted-foreground py-8">
												No audit log entries found.
											</TableCell>
										</TableRow>
									</TableBody>
								</Table>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</template>

		<!-- ==================== DIALOGS ==================== -->

		<!-- Note Dialog -->
		<Dialog v-model:open="showNoteDialog">
			<DialogContent class="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Transaction Notes</DialogTitle>
					<DialogDescription v-if="selectedTransaction">
						{{ selectedTransaction.description || 'Transaction' }} &middot;
						{{ formatCurrency(selectedTransaction.amount) }}
					</DialogDescription>
				</DialogHeader>

				<!-- Existing notes -->
				<div class="max-h-[240px] overflow-y-auto space-y-3">
					<div
						v-for="note in transactionNotes"
						:key="note.id"
						class="rounded-lg border p-3 space-y-1"
					>
						<div class="flex items-center justify-between gap-2">
							<div class="flex items-center gap-2">
								<Badge variant="soft" color="gray" size="xs">{{ note.note_type }}</Badge>
								<Badge v-if="note.is_resolved" variant="soft" color="green" size="xs">Resolved</Badge>
							</div>
							<span class="text-xs text-muted-foreground">
								{{ formatDateTime(note.date_created) }}
							</span>
						</div>
						<p class="text-sm">{{ note.note }}</p>
						<div class="flex items-center justify-between">
							<span class="text-xs text-muted-foreground">
								By {{ note.user_created?.first_name || 'Unknown' }}
								{{ note.user_created?.last_name || '' }}
							</span>
							<button
								v-if="!note.is_resolved && canUpdateNotes"
								class="text-xs text-primary hover:underline"
								@click="handleResolveNote(note.id)"
							>
								Mark Resolved
							</button>
						</div>
					</div>
					<p v-if="transactionNotes.length === 0" class="text-sm text-muted-foreground text-center py-4">
						No notes yet.
					</p>
				</div>

				<!-- Add note form -->
				<div v-if="canCreateNotes" class="border-t pt-4 space-y-3">
					<div>
						<label class="text-sm font-medium">Note Type</label>
						<select
							v-model="newNote.note_type"
							class="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
						>
							<option v-for="opt in noteTypeOptions" :key="opt.value" :value="opt.value">
								{{ opt.label }}
							</option>
						</select>
					</div>
					<div>
						<label class="text-sm font-medium">Note</label>
						<textarea
							v-model="newNote.note"
							placeholder="Add a note about this transaction..."
							class="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-ring"
						/>
					</div>
					<button
						class="w-full inline-flex items-center justify-center h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
						:disabled="!newNote.note.trim()"
						@click="handleCreateNote"
					>
						Add Note
					</button>
				</div>
			</DialogContent>
		</Dialog>

		<!-- Generate Report Dialog -->
		<Dialog v-model:open="showReportDialog">
			<DialogContent class="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Generate Reconciliation Report</DialogTitle>
					<DialogDescription>
						Create a monthly reconciliation report for the selected account.
					</DialogDescription>
				</DialogHeader>
				<div class="space-y-4">
					<div>
						<label class="text-sm font-medium">Month</label>
						<select
							v-model="reportMonth"
							class="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
						>
							<option value="" disabled>Select month...</option>
							<option v-for="m in monthOptions" :key="m.value" :value="m.value">
								{{ m.label }}
							</option>
						</select>
					</div>
					<div>
						<label class="text-sm font-medium">Notes (optional)</label>
						<textarea
							v-model="reportNotes"
							placeholder="Any additional notes for this report..."
							class="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-ring"
						/>
					</div>
				</div>
				<DialogFooter>
					<button
						class="inline-flex items-center justify-center h-9 px-4 rounded-md border border-input bg-background text-sm font-medium hover:bg-accent transition-colors"
						@click="showReportDialog = false"
					>
						Cancel
					</button>
					<button
						class="inline-flex items-center justify-center h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
						:disabled="!reportMonth"
						@click="handleGenerateReport"
					>
						Generate
					</button>
				</DialogFooter>
			</DialogContent>
		</Dialog>

		<!-- Alert Resolution Dialog -->
		<Dialog v-model:open="showAlertDialog">
			<DialogContent class="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Resolve Alert</DialogTitle>
					<DialogDescription v-if="selectedAlert">
						{{ selectedAlert.title }}
					</DialogDescription>
				</DialogHeader>
				<div class="space-y-4">
					<div v-if="selectedAlert" class="rounded-lg border p-3 bg-muted/30">
						<p class="text-sm">{{ selectedAlert.description }}</p>
						<div class="flex items-center gap-2 mt-2">
							<Badge variant="solid" :color="getSeverityColor(selectedAlert.severity)" size="xs">
								{{ selectedAlert.severity }}
							</Badge>
							<Badge variant="soft" color="gray" size="xs">
								{{ getAlertTypeLabel(selectedAlert.alert_type) }}
							</Badge>
						</div>
					</div>
					<div>
						<label class="text-sm font-medium">Resolution Notes</label>
						<textarea
							v-model="alertResolution.notes"
							placeholder="Describe how this was resolved..."
							class="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-ring"
						/>
					</div>
					<div v-if="selectedAlert?.requires_board_action">
						<label class="text-sm font-medium">Board Resolution Reference</label>
						<input
							v-model="alertResolution.board_resolution"
							placeholder="e.g., Board Resolution 2025-03"
							class="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
						/>
					</div>
				</div>
				<DialogFooter>
					<button
						class="inline-flex items-center justify-center h-9 px-4 rounded-md border border-input bg-background text-sm font-medium hover:bg-accent transition-colors"
						@click="showAlertDialog = false"
					>
						Cancel
					</button>
					<button
						class="inline-flex items-center justify-center h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
						:disabled="!alertResolution.notes.trim()"
						@click="handleResolveAlert"
					>
						Resolve Alert
					</button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	</div>
</template>
