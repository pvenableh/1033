<template>
	<div class="container mx-auto p-6 space-y-6">
		<!-- Financial Sub-Navigation -->
		<FinancialsSubNav />

		<!-- Header -->
		<div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-3xl font-bold uppercase tracking-wider mb-2 dark:text-white">
						YEARLY RECONCILIATION
					</h1>
					<p class="text-gray-600 dark:text-gray-400">
						Annual reconciliation overview with month-by-month certified status
					</p>
				</div>
				<div class="flex items-center gap-3">
					<UBadge v-if="yearCertified" color="green" variant="solid" size="lg">
						<UIcon name="i-heroicons-shield-check" class="w-5 h-5 mr-1" />
						YEAR CERTIFIED CLOSED
					</UBadge>
					<UBadge v-else-if="certifiedMonthCount > 0" color="yellow" variant="soft" size="lg">
						{{ certifiedMonthCount }}/{{ activeMonthCount }} Months Certified
					</UBadge>
					<UBadge v-else color="gray" variant="soft" size="lg">
						No Months Certified
					</UBadge>
				</div>
			</div>
		</div>

		<!-- Filters -->
		<UCard>
			<div class="flex flex-wrap gap-4 items-center">
				<div class="flex items-center gap-2">
					<label class="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase">Year:</label>
					<USelectMenu v-model="selectedYear" :options="yearOptions" size="sm" class="w-24" />
				</div>
				<div class="flex items-center gap-2">
					<label class="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase">Account:</label>
					<USelectMenu v-model="selectedAccount" :options="accountOptions" size="sm" class="w-64" />
				</div>
				<div class="ml-auto flex gap-2">
					<UButton
						color="gray"
						variant="soft"
						size="sm"
						icon="i-heroicons-arrow-path"
						:loading="loading"
						@click="loadAllData">
						Refresh
					</UButton>
				</div>
			</div>
		</UCard>

		<!-- Annual Summary -->
		<div class="grid grid-cols-1 md:grid-cols-5 gap-4">
			<UCard class="text-center">
				<p class="text-xs uppercase tracking-wide text-gray-600 dark:text-gray-400">YTD Revenue</p>
				<p class="text-xl font-bold text-green-700 dark:text-green-400">
					{{ formatCurrency(annualTotals.totalDeposits) }}
				</p>
			</UCard>
			<UCard class="text-center">
				<p class="text-xs uppercase tracking-wide text-gray-600 dark:text-gray-400">YTD Expenses</p>
				<p class="text-xl font-bold text-red-700 dark:text-red-400">
					{{ formatCurrency(annualTotals.totalWithdrawals + annualTotals.totalFees) }}
				</p>
			</UCard>
			<UCard class="text-center">
				<p class="text-xs uppercase tracking-wide text-gray-600 dark:text-gray-400">Net Transfers</p>
				<p class="text-xl font-bold text-purple-700 dark:text-purple-400">
					{{ annualTotals.netTransfers >= 0 ? '+' : '' }}{{ formatCurrency(annualTotals.netTransfers) }}
				</p>
			</UCard>
			<UCard class="text-center">
				<p class="text-xs uppercase tracking-wide text-gray-600 dark:text-gray-400">Annual Net</p>
				<p class="text-xl font-bold" :class="annualTotals.annualNet >= 0 ? 'text-blue-700 dark:text-blue-400' : 'text-red-700 dark:text-red-400'">
					{{ annualTotals.annualNet >= 0 ? '+' : '' }}{{ formatCurrency(annualTotals.annualNet) }}
				</p>
			</UCard>
			<UCard class="text-center">
				<p class="text-xs uppercase tracking-wide text-gray-600 dark:text-gray-400">Transactions</p>
				<p class="text-xl font-bold text-gray-700 dark:text-gray-300">
					{{ annualTotals.totalTransactions }}
				</p>
			</UCard>
		</div>

		<!-- Month-by-Month Grid -->
		<UCard>
			<template #header>
				<h2 class="text-xl font-semibold uppercase tracking-wide dark:text-white">
					{{ selectedYear }} - {{ getAccountName(selectedAccount) }}
				</h2>
			</template>

			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b-2 border-gray-300 dark:border-gray-600">
							<th class="py-3 px-4 text-left uppercase tracking-wider text-xs font-semibold text-gray-600 dark:text-gray-400">Month</th>
							<th class="py-3 px-4 text-right uppercase tracking-wider text-xs font-semibold text-gray-600 dark:text-gray-400">Beginning</th>
							<th class="py-3 px-4 text-right uppercase tracking-wider text-xs font-semibold text-green-600 dark:text-green-400">Deposits</th>
							<th class="py-3 px-4 text-right uppercase tracking-wider text-xs font-semibold text-red-600 dark:text-red-400">Withdrawals</th>
							<th class="py-3 px-4 text-right uppercase tracking-wider text-xs font-semibold text-purple-600 dark:text-purple-400">Transfers In</th>
							<th class="py-3 px-4 text-right uppercase tracking-wider text-xs font-semibold text-orange-600 dark:text-orange-400">Transfers Out</th>
							<th class="py-3 px-4 text-right uppercase tracking-wider text-xs font-semibold text-gray-600 dark:text-gray-400">Fees</th>
							<th class="py-3 px-4 text-right uppercase tracking-wider text-xs font-semibold text-gray-600 dark:text-gray-400">Ending</th>
							<th class="py-3 px-4 text-right uppercase tracking-wider text-xs font-semibold text-blue-600 dark:text-blue-400">Difference</th>
							<th class="py-3 px-4 text-center uppercase tracking-wider text-xs font-semibold text-gray-600 dark:text-gray-400">TXNs</th>
							<th class="py-3 px-4 text-center uppercase tracking-wider text-xs font-semibold text-gray-600 dark:text-gray-400">Status</th>
							<th class="py-3 px-4 text-center uppercase tracking-wider text-xs font-semibold text-gray-600 dark:text-gray-400">Actions</th>
						</tr>
					</thead>
					<tbody>
						<tr
							v-for="row in monthRows"
							:key="row.month"
							class="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
							:class="{
								'bg-green-50/50 dark:bg-green-900/10': row.reportStatus === 'reconciled',
								'opacity-40': !row.hasData,
							}">
							<td class="py-3 px-4 font-medium dark:text-white">
								{{ row.monthName }}
							</td>
							<td class="py-3 px-4 text-right font-mono text-gray-900 dark:text-gray-100">
								{{ row.hasData ? formatCurrency(row.beginningBalance) : '-' }}
							</td>
							<td class="py-3 px-4 text-right font-mono text-green-600 dark:text-green-400">
								{{ row.hasData && row.totalDeposits > 0 ? '+' + formatCurrency(row.totalDeposits) : '-' }}
							</td>
							<td class="py-3 px-4 text-right font-mono text-red-600 dark:text-red-400">
								{{ row.hasData && row.totalWithdrawals > 0 ? '-' + formatCurrency(row.totalWithdrawals) : '-' }}
							</td>
							<td class="py-3 px-4 text-right font-mono text-purple-600 dark:text-purple-400">
								{{ row.hasData && row.totalTransfersIn > 0 ? '+' + formatCurrency(row.totalTransfersIn) : '-' }}
							</td>
							<td class="py-3 px-4 text-right font-mono text-orange-600 dark:text-orange-400">
								{{ row.hasData && row.totalTransfersOut > 0 ? '-' + formatCurrency(row.totalTransfersOut) : '-' }}
							</td>
							<td class="py-3 px-4 text-right font-mono text-gray-600 dark:text-gray-400">
								{{ row.hasData && row.totalFees > 0 ? '-' + formatCurrency(row.totalFees) : '-' }}
							</td>
							<td class="py-3 px-4 text-right font-mono font-semibold text-gray-900 dark:text-gray-100">
								{{ row.hasData ? formatCurrency(row.endingBalance) : '-' }}
							</td>
							<td class="py-3 px-4 text-right font-mono" :class="row.hasData && Math.abs(row.difference) < 0.01 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
								{{ row.hasData ? formatCurrency(Math.abs(row.difference)) : '-' }}
							</td>
							<td class="py-3 px-4 text-center text-gray-600 dark:text-gray-400">
								{{ row.transactionCount || '-' }}
							</td>
							<td class="py-3 px-4 text-center">
								<template v-if="row.reportStatus === 'reconciled'">
									<UBadge color="green" variant="solid" size="sm">
										<UIcon name="i-heroicons-shield-check" class="w-3 h-3 mr-1" />
										CERTIFIED
									</UBadge>
								</template>
								<template v-else-if="row.reportStatus === 'pending' || row.reportStatus === 'in_progress'">
									<UBadge color="yellow" variant="soft" size="sm">
										{{ row.reportStatus?.toUpperCase() }}
									</UBadge>
								</template>
								<template v-else-if="row.reportStatus === 'discrepency'">
									<UBadge color="red" variant="soft" size="sm">
										DISCREPANCY
									</UBadge>
								</template>
								<template v-else-if="row.hasData">
									<UBadge color="gray" variant="outline" size="sm">
										OPEN
									</UBadge>
								</template>
								<template v-else>
									<span class="text-xs text-gray-400">-</span>
								</template>
							</td>
							<td class="py-3 px-4 text-center">
								<div class="flex items-center justify-center gap-1">
									<UButton
										v-if="row.hasData && canReconcile && row.reportStatus !== 'reconciled'"
										color="green"
										variant="soft"
										size="xs"
										icon="i-heroicons-check-badge"
										:loading="reconcilingMonthKey === row.month"
										@click="reconcileMonth(row.month)">
										{{ row.reportStatus ? 'Certify' : 'Reconcile' }}
									</UButton>
									<NuxtLink :to="`/financials/reconciliation?year=${selectedYear}&account=${selectedAccount}&month=${row.month}`">
										<UButton
											v-if="row.hasData"
											color="gray"
											variant="ghost"
											size="xs"
											icon="i-heroicons-arrow-top-right-on-square" />
									</NuxtLink>
								</div>
							</td>
						</tr>
					</tbody>
					<!-- Totals Row -->
					<tfoot>
						<tr class="border-t-2 border-gray-400 dark:border-gray-500 bg-gray-100 dark:bg-gray-800 font-bold">
							<td class="py-3 px-4 uppercase text-gray-900 dark:text-white">Annual Total</td>
							<td class="py-3 px-4 text-right font-mono text-gray-900 dark:text-gray-100">
								{{ monthRows[0]?.hasData ? formatCurrency(monthRows[0].beginningBalance) : '-' }}
							</td>
							<td class="py-3 px-4 text-right font-mono text-green-600 dark:text-green-400">
								+{{ formatCurrency(annualTotals.totalDeposits) }}
							</td>
							<td class="py-3 px-4 text-right font-mono text-red-600 dark:text-red-400">
								-{{ formatCurrency(annualTotals.totalWithdrawals) }}
							</td>
							<td class="py-3 px-4 text-right font-mono text-purple-600 dark:text-purple-400">
								+{{ formatCurrency(annualTotals.totalTransfersIn) }}
							</td>
							<td class="py-3 px-4 text-right font-mono text-orange-600 dark:text-orange-400">
								-{{ formatCurrency(annualTotals.totalTransfersOut) }}
							</td>
							<td class="py-3 px-4 text-right font-mono text-gray-600 dark:text-gray-400">
								-{{ formatCurrency(annualTotals.totalFees) }}
							</td>
							<td class="py-3 px-4 text-right font-mono text-gray-900 dark:text-gray-100">
								{{ lastMonthWithData ? formatCurrency(lastMonthWithData.endingBalance) : '-' }}
							</td>
							<td class="py-3 px-4 text-right font-mono" :class="Math.abs(annualTotals.totalDifference) < 0.01 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
								{{ formatCurrency(Math.abs(annualTotals.totalDifference)) }}
							</td>
							<td class="py-3 px-4 text-center text-gray-900 dark:text-gray-100">
								{{ annualTotals.totalTransactions }}
							</td>
							<td class="py-3 px-4 text-center">
								<UBadge v-if="yearCertified" color="green" variant="solid" size="sm">ALL CERTIFIED</UBadge>
								<UBadge v-else color="gray" variant="outline" size="sm">{{ certifiedMonthCount }}/{{ activeMonthCount }}</UBadge>
							</td>
							<td class="py-3 px-4"></td>
						</tr>
					</tfoot>
				</table>
			</div>
		</UCard>

		<!-- Year-End Certification -->
		<UCard v-if="yearCertified">
			<div class="text-center py-8">
				<UIcon name="i-heroicons-shield-check" class="w-20 h-20 mx-auto mb-4 text-green-500" />
				<h2 class="text-2xl font-bold text-green-800 dark:text-green-300 mb-2">
					{{ selectedYear }} FISCAL YEAR - CERTIFIED CLOSED
				</h2>
				<p class="text-gray-600 dark:text-gray-400 max-w-lg mx-auto">
					All {{ activeMonthCount }} months with activity have been reconciled and certified for the
					{{ getAccountName(selectedAccount) }} account. This fiscal year's records are complete.
				</p>
				<div class="mt-4 text-sm text-gray-500 dark:text-gray-400">
					Last certified: {{ lastCertifiedDate }}
				</div>
			</div>
		</UCard>

		<!-- Multi-Account Summary -->
		<UCard v-if="allAccountsSummary.length > 1">
			<template #header>
				<h2 class="text-xl font-semibold uppercase tracking-wide dark:text-white">
					ALL ACCOUNTS SUMMARY - {{ selectedYear }}
				</h2>
			</template>

			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div
					v-for="acctSummary in allAccountsSummary"
					:key="acctSummary.id"
					class="border dark:border-gray-700 rounded-lg p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
					:class="{ 'ring-2 ring-blue-500': acctSummary.id === selectedAccount }"
					@click="selectedAccount = acctSummary.id">
					<div class="flex items-center justify-between mb-3">
						<h3 class="font-semibold dark:text-white">{{ acctSummary.name }}</h3>
						<UBadge
							:color="acctSummary.allCertified ? 'green' : acctSummary.certifiedCount > 0 ? 'yellow' : 'gray'"
							variant="soft" size="sm">
							{{ acctSummary.allCertified ? 'CERTIFIED' : `${acctSummary.certifiedCount}/${acctSummary.activeMonths}` }}
						</UBadge>
					</div>
					<div class="space-y-1 text-sm">
						<div class="flex justify-between">
							<span class="text-gray-500 dark:text-gray-400">Revenue:</span>
							<span class="font-semibold text-green-600 dark:text-green-400">{{ formatCurrency(acctSummary.totalRevenue) }}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-gray-500 dark:text-gray-400">Expenses:</span>
							<span class="font-semibold text-red-600 dark:text-red-400">{{ formatCurrency(acctSummary.totalExpenses) }}</span>
						</div>
						<div class="flex justify-between border-t dark:border-gray-600 pt-1">
							<span class="text-gray-500 dark:text-gray-400">Net:</span>
							<span class="font-bold" :class="acctSummary.net >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'">
								{{ acctSummary.net >= 0 ? '+' : '' }}{{ formatCurrency(acctSummary.net) }}
							</span>
						</div>
					</div>
					<!-- Progress bar -->
					<div class="mt-3">
						<div class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
							<div
								class="h-full rounded-full transition-all"
								:class="acctSummary.allCertified ? 'bg-green-500' : 'bg-yellow-500'"
								:style="{ width: `${acctSummary.activeMonths > 0 ? (acctSummary.certifiedCount / acctSummary.activeMonths) * 100 : 0}%` }"></div>
						</div>
					</div>
				</div>
			</div>
		</UCard>
	</div>
</template>

<script setup>
const {
	selectedYear,
	selectedAccount,
	loading,
	accounts,
	transactions,
	monthlyStatements,
	fetchData,
	formatCurrency,
	getAccountName,
} = useHOAReconciliation();

const {
	canReconcile,
	createReconciliationReport,
	fetchReconciliationReports,
	completeReconciliationReport,
	generateMonthlyReport,
	bulkReconcileTransactions,
	initialize: initializeNotes,
} = useReconciliationNotes();

// State
const allReports = ref([]);
const reconcilingMonthKey = ref(null);

const yearOptions = [
	{ label: '2024', value: 2024 },
	{ label: '2025', value: 2025 },
	{ label: '2026', value: 2026 },
];

const accountOptions = computed(() =>
	accounts.value.map((a) => ({
		label: `${a.account_name} (${a.account_number})`,
		value: a.id,
	}))
);

const monthNames = {
	'01': 'January', '02': 'February', '03': 'March', '04': 'April',
	'05': 'May', '06': 'June', '07': 'July', '08': 'August',
	'09': 'September', '10': 'October', '11': 'November', '12': 'December',
};

const safeParseFloat = (v) => {
	const p = parseFloat(v);
	return isNaN(p) ? 0 : p;
};

// Compute month-by-month data for the selected account
const monthRows = computed(() => {
	const accountId = selectedAccount.value;
	const year = selectedYear.value;

	return Object.entries(monthNames).map(([monthKey, monthName]) => {
		const stmt = monthlyStatements.value.find(
			(s) => s.account_id === accountId && s.statement_month === monthKey
		);

		const monthTx = transactions.value.filter(
			(t) => t.account_id === accountId && t.statement_month === monthKey
		);

		const totalDeposits = monthTx
			.filter((t) => t.transaction_type === 'deposit' && !t.linked_transfer_id)
			.reduce((sum, t) => sum + safeParseFloat(t.amount), 0);
		const totalWithdrawals = monthTx
			.filter((t) => t.transaction_type === 'withdrawal' && !t.linked_transfer_id)
			.reduce((sum, t) => sum + safeParseFloat(t.amount), 0);
		const totalTransfersIn = monthTx
			.filter((t) => t.transaction_type === 'transfer_in')
			.reduce((sum, t) => sum + safeParseFloat(t.amount), 0);
		const totalTransfersOut = monthTx
			.filter((t) => t.transaction_type === 'transfer_out')
			.reduce((sum, t) => sum + safeParseFloat(t.amount), 0);
		const totalFees = monthTx
			.filter((t) => t.transaction_type === 'fee')
			.reduce((sum, t) => sum + safeParseFloat(t.amount), 0);

		const beginningBalance = stmt ? safeParseFloat(stmt.beginning_balance) : 0;
		const endingBalance = stmt ? safeParseFloat(stmt.ending_balance) : 0;
		const calculatedEnding = beginningBalance + totalDeposits + totalTransfersIn - totalWithdrawals - totalTransfersOut - totalFees;
		const difference = endingBalance - calculatedEnding;

		// Find report for this month
		const report = allReports.value.find((r) => {
			const rAcctId = typeof r.account_id === 'object' ? r.account_id?.id : r.account_id;
			return r.report_month === monthKey && rAcctId === accountId;
		});

		return {
			month: monthKey,
			monthName,
			hasData: monthTx.length > 0 || (stmt && stmt.beginning_balance !== null),
			beginningBalance,
			endingBalance,
			calculatedEnding,
			difference,
			totalDeposits,
			totalWithdrawals,
			totalTransfersIn,
			totalTransfersOut,
			totalFees,
			transactionCount: monthTx.length,
			report,
			reportStatus: report?.reconciliation_status || null,
		};
	});
});

const lastMonthWithData = computed(() => {
	return [...monthRows.value].reverse().find((r) => r.hasData);
});

const annualTotals = computed(() => {
	const rows = monthRows.value.filter((r) => r.hasData);
	return {
		totalDeposits: rows.reduce((sum, r) => sum + r.totalDeposits, 0),
		totalWithdrawals: rows.reduce((sum, r) => sum + r.totalWithdrawals, 0),
		totalTransfersIn: rows.reduce((sum, r) => sum + r.totalTransfersIn, 0),
		totalTransfersOut: rows.reduce((sum, r) => sum + r.totalTransfersOut, 0),
		totalFees: rows.reduce((sum, r) => sum + r.totalFees, 0),
		totalDifference: rows.reduce((sum, r) => sum + r.difference, 0),
		totalTransactions: rows.reduce((sum, r) => sum + r.transactionCount, 0),
		netTransfers: rows.reduce((sum, r) => sum + r.totalTransfersIn - r.totalTransfersOut, 0),
		annualNet: rows.reduce((sum, r) => sum + r.totalDeposits + r.totalTransfersIn - r.totalWithdrawals - r.totalTransfersOut - r.totalFees, 0),
	};
});

const activeMonthCount = computed(() => monthRows.value.filter((r) => r.hasData).length);
const certifiedMonthCount = computed(() => monthRows.value.filter((r) => r.reportStatus === 'reconciled').length);
const yearCertified = computed(() => activeMonthCount.value > 0 && certifiedMonthCount.value === activeMonthCount.value);

const lastCertifiedDate = computed(() => {
	const certified = allReports.value
		.filter((r) => r.reconciliation_status === 'reconciled' && r.completed_date)
		.sort((a, b) => b.completed_date.localeCompare(a.completed_date));
	if (certified.length === 0) return 'N/A';
	return new Date(certified[0].completed_date).toLocaleDateString('en-US', {
		month: 'long', day: 'numeric', year: 'numeric',
	});
});

// Multi-account summary
const allAccountsSummary = computed(() => {
	return accounts.value.map((acct) => {
		const acctTx = transactions.value.filter((t) => t.account_id === acct.id);
		const acctReports = allReports.value.filter((r) => {
			const rAcctId = typeof r.account_id === 'object' ? r.account_id?.id : r.account_id;
			return rAcctId === acct.id;
		});

		const monthsWithData = new Set(acctTx.map((t) => t.statement_month).filter(Boolean));
		const certifiedReports = acctReports.filter((r) => r.reconciliation_status === 'reconciled');

		const totalRevenue = acctTx
			.filter((t) => t.transaction_type === 'deposit' && !t.linked_transfer_id)
			.reduce((sum, t) => sum + safeParseFloat(t.amount), 0);
		const totalExpenses = acctTx
			.filter((t) => (t.transaction_type === 'withdrawal' && !t.linked_transfer_id) || t.transaction_type === 'fee')
			.reduce((sum, t) => sum + safeParseFloat(t.amount), 0);

		return {
			id: acct.id,
			name: acct.account_name,
			type: acct.account_type,
			activeMonths: monthsWithData.size,
			certifiedCount: certifiedReports.length,
			allCertified: monthsWithData.size > 0 && certifiedReports.length >= monthsWithData.size,
			totalRevenue,
			totalExpenses,
			net: totalRevenue - totalExpenses,
		};
	});
});

// Methods
const loadAllData = async () => {
	await fetchData();
	allReports.value = await fetchReconciliationReports(selectedYear.value) || [];
};

const reconcileMonth = async (month) => {
	reconcilingMonthKey.value = month;

	try {
		const row = monthRows.value.find((r) => r.month === month);
		if (!row) return;

		const accountId = selectedAccount.value;
		const stmt = row.report ? null : monthlyStatements.value.find(
			(s) => s.account_id === accountId && s.statement_month === month
		);

		const monthTx = transactions.value.filter(
			(t) => t.account_id === accountId && t.statement_month === month
		);

		if (row.report) {
			// Report exists - certify it
			await completeReconciliationReport(row.report.id);
		} else {
			// Generate report then certify
			const reportData = await generateMonthlyReport(
				selectedYear.value,
				accountId,
				month,
				monthTx,
				stmt
			);

			const report = await createReconciliationReport(reportData);

			if (report && Math.abs(row.difference) < 0.01) {
				await completeReconciliationReport(report.id);
			}
		}

		// Bulk reconcile pending transactions
		const pendingTxIds = monthTx
			.filter((t) => !t.reconciliation_status || t.reconciliation_status === 'pending')
			.map((t) => t.id);

		if (pendingTxIds.length > 0) {
			await bulkReconcileTransactions(pendingTxIds, 'reconciled');
		}

		await loadAllData();
	} catch (err) {
		console.error('Error reconciling month:', err);
	} finally {
		reconcilingMonthKey.value = null;
	}
};

// Initialize
onMounted(async () => {
	await initializeNotes();
	await loadAllData();
});

// Watch for year/account changes
watch([selectedYear, selectedAccount], async () => {
	allReports.value = await fetchReconciliationReports(selectedYear.value) || [];
});
</script>
