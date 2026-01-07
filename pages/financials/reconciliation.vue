<template>
	<div class="container mx-auto p-6 space-y-6">
		<!-- Header -->
		<div class="bg-white rounded-lg shadow-sm border p-6">
			<h1 class="text-3xl font-bold uppercase tracking-wider mb-2">ACCOUNT RECONCILIATION</h1>
			<p class="text-gray-600">Monthly and YTD reconciliation reports with transfer audit</p>
		</div>

		<!-- Filters -->
		<UCard>
			<div class="flex flex-wrap gap-4 items-center">
				<div class="flex items-center gap-2">
					<label class="text-sm font-medium text-gray-700 uppercase">Account:</label>
					<USelect v-model="selectedAccount" :options="accountOptions" size="sm" class="w-64" />
				</div>
				<div class="flex items-center gap-2">
					<label class="text-sm font-medium text-gray-700 uppercase">Month:</label>
					<USelect v-model="selectedMonth" :options="monthOptions" size="sm" class="w-32" />
				</div>
				<div class="flex items-center gap-2">
					<label class="text-sm font-medium text-gray-700 uppercase">Year:</label>
					<USelect v-model="selectedYear" :options="yearOptions" size="sm" class="w-24" />
				</div>
			</div>
		</UCard>

		<!-- Transfer Audit Alert -->
		<UAlert
			v-if="transferAudit?.hasIssues"
			icon="i-heroicons-exclamation-triangle"
			color="red"
			variant="soft"
			title="Transfer Issues Detected">
			<template #description>
				<ul class="list-disc list-inside space-y-1">
					<li v-if="transferAudit.unmatched.count > 0">{{ transferAudit.unmatched.count }} unmatched transfers</li>
					<li v-if="transferAudit.broken.count > 0">{{ transferAudit.broken.count }} broken transfer links</li>
					<li v-if="transferAudit.mismatches.count > 0">{{ transferAudit.mismatches.count }} amount mismatches</li>
				</ul>
			</template>
		</UAlert>

		<!-- Monthly Reconciliation -->
		<UCard v-if="monthlyReconciliation">
			<template #header>
				<div class="flex items-center justify-between">
					<h2 class="text-xl font-semibold uppercase tracking-wide">
						MONTHLY RECONCILIATION - {{ getAccountName(selectedAccount) }}
					</h2>
					<UBadge :color="monthlyReconciliation.isReconciled ? 'green' : 'red'" variant="soft" size="lg">
						{{ monthlyReconciliation.isReconciled ? 'RECONCILED ✓' : 'NOT RECONCILED ✗' }}
					</UBadge>
				</div>
			</template>

			<!-- Reconciliation Summary -->
			<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
				<div class="text-center p-4 bg-blue-50 rounded-lg">
					<p class="text-sm uppercase tracking-wide text-gray-600">BEGINNING BALANCE</p>
					<p class="text-2xl font-bold text-blue-900">
						{{ formatCurrency(monthlyReconciliation.beginningBalance) }}
					</p>
				</div>

				<div class="text-center p-4 bg-purple-50 rounded-lg">
					<p class="text-sm uppercase tracking-wide text-gray-600">NET CHANGE</p>
					<p
						class="text-2xl font-bold"
						:class="monthlyReconciliation.netChange >= 0 ? 'text-green-900' : 'text-red-900'">
						{{ monthlyReconciliation.netChange >= 0 ? '+' : '' }}{{ formatCurrency(monthlyReconciliation.netChange) }}
					</p>
				</div>

				<div class="text-center p-4 bg-green-50 rounded-lg">
					<p class="text-sm uppercase tracking-wide text-gray-600">ENDING BALANCE</p>
					<p class="text-2xl font-bold text-green-900">
						{{ formatCurrency(monthlyReconciliation.endingBalance) }}
					</p>
					<p class="text-xs text-gray-500 mt-1">
						Calculated: {{ formatCurrency(monthlyReconciliation.calculatedEnding) }}
					</p>
				</div>
			</div>

			<!-- Activity Breakdown -->
			<div class="space-y-4">
				<h3 class="font-semibold uppercase tracking-wide text-lg border-b pb-2">ACTIVITY BREAKDOWN</h3>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<!-- Operating Activity -->
					<div class="border rounded-lg p-4 bg-gray-50">
						<h4 class="font-semibold text-gray-900 mb-3">OPERATING ACTIVITY</h4>
						<div class="space-y-2 text-sm">
							<div class="flex justify-between">
								<span class="text-gray-600">Deposits ({{ monthlyReconciliation.deposits.count }}):</span>
								<span class="font-semibold text-green-600">
									+{{ formatCurrency(monthlyReconciliation.deposits.total) }}
								</span>
							</div>
							<div class="flex justify-between">
								<span class="text-gray-600">Withdrawals ({{ monthlyReconciliation.withdrawals.count }}):</span>
								<span class="font-semibold text-red-600">
									-{{ formatCurrency(monthlyReconciliation.withdrawals.total) }}
								</span>
							</div>
							<div class="flex justify-between">
								<span class="text-gray-600">Fees ({{ monthlyReconciliation.fees.count }}):</span>
								<span class="font-semibold text-red-600">-{{ formatCurrency(monthlyReconciliation.fees.total) }}</span>
							</div>
							<div class="flex justify-between pt-2 border-t">
								<span class="font-medium">Operating Net:</span>
								<span
									class="font-bold"
									:class="monthlyReconciliation.operatingNetChange >= 0 ? 'text-green-600' : 'text-red-600'">
									{{ monthlyReconciliation.operatingNetChange >= 0 ? '+' : ''
									}}{{ formatCurrency(monthlyReconciliation.operatingNetChange) }}
								</span>
							</div>
						</div>
					</div>

					<!-- Transfer Activity -->
					<div class="border rounded-lg p-4 bg-gray-50">
						<h4 class="font-semibold text-gray-900 mb-3">TRANSFER ACTIVITY</h4>
						<div class="space-y-2 text-sm">
							<div class="flex justify-between">
								<span class="text-gray-600">Transfers In ({{ monthlyReconciliation.transfersIn.count }}):</span>
								<span class="font-semibold text-purple-600">
									+{{ formatCurrency(monthlyReconciliation.transfersIn.total) }}
								</span>
							</div>
							<div class="flex justify-between">
								<span class="text-gray-600">Transfers Out ({{ monthlyReconciliation.transfersOut.count }}):</span>
								<span class="font-semibold text-orange-600">
									-{{ formatCurrency(monthlyReconciliation.transfersOut.total) }}
								</span>
							</div>
							<div class="flex justify-between pt-2 border-t">
								<span class="font-medium">Transfer Net:</span>
								<span
									class="font-bold"
									:class="monthlyReconciliation.transferNetChange >= 0 ? 'text-purple-600' : 'text-orange-600'">
									{{ monthlyReconciliation.transferNetChange >= 0 ? '+' : ''
									}}{{ formatCurrency(monthlyReconciliation.transferNetChange) }}
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Reconciliation Formula -->
			<div class="mt-6 p-4 bg-blue-50 rounded-lg">
				<h4 class="font-semibold text-blue-900 mb-2">RECONCILIATION FORMULA</h4>
				<div class="text-sm text-blue-800 space-y-1 font-mono">
					<div>Beginning Balance: {{ formatCurrency(monthlyReconciliation.beginningBalance) }}</div>
					<div>+ Deposits: {{ formatCurrency(monthlyReconciliation.deposits.total) }}</div>
					<div>+ Transfers In: {{ formatCurrency(monthlyReconciliation.transfersIn.total) }}</div>
					<div>- Withdrawals: {{ formatCurrency(monthlyReconciliation.withdrawals.total) }}</div>
					<div>- Transfers Out: {{ formatCurrency(monthlyReconciliation.transfersOut.total) }}</div>
					<div>- Fees: {{ formatCurrency(monthlyReconciliation.fees.total) }}</div>
					<div class="border-t border-blue-300 pt-1 mt-1">
						= Calculated Ending: {{ formatCurrency(monthlyReconciliation.calculatedEnding) }}
					</div>
					<div class="font-bold">Bank Statement Ending: {{ formatCurrency(monthlyReconciliation.endingBalance) }}</div>
					<div class="font-bold" :class="monthlyReconciliation.isReconciled ? 'text-green-700' : 'text-red-700'">
						Difference: {{ formatCurrency(Math.abs(monthlyReconciliation.difference)) }}
					</div>
				</div>
			</div>
		</UCard>

		<!-- YTD Reconciliation -->
		<UCard v-if="ytdReconciliation">
			<template #header>
				<h2 class="text-xl font-semibold uppercase tracking-wide">
					YEAR-TO-DATE RECONCILIATION - {{ getAccountName(selectedAccount) }}
				</h2>
			</template>

			<div class="space-y-6">
				<!-- Summary Grid -->
				<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
					<div class="text-center p-4 bg-green-50 rounded-lg">
						<p class="text-sm uppercase tracking-wide text-gray-600">OPERATING REVENUE</p>
						<p class="text-2xl font-bold text-green-700">
							{{ formatCurrency(ytdReconciliation.operatingRevenue) }}
						</p>
						<p class="text-xs text-gray-500">{{ ytdReconciliation.deposits.count }} deposits</p>
					</div>

					<div class="text-center p-4 bg-red-50 rounded-lg">
						<p class="text-sm uppercase tracking-wide text-gray-600">OPERATING EXPENSES</p>
						<p class="text-2xl font-bold text-red-700">
							{{ formatCurrency(ytdReconciliation.operatingExpenses) }}
						</p>
						<p class="text-xs text-gray-500">
							{{ ytdReconciliation.withdrawals.count + ytdReconciliation.fees.count }} transactions
						</p>
					</div>

					<div class="text-center p-4 bg-purple-50 rounded-lg">
						<p class="text-sm uppercase tracking-wide text-gray-600">TRANSFER NET</p>
						<p class="text-2xl font-bold text-purple-700">
							{{ ytdReconciliation.transferNetChange >= 0 ? '+' : ''
							}}{{ formatCurrency(ytdReconciliation.transferNetChange) }}
						</p>
						<p class="text-xs text-gray-500">
							In: {{ ytdReconciliation.transfersIn.count }} | Out: {{ ytdReconciliation.transfersOut.count }}
						</p>
					</div>

					<div class="text-center p-4 bg-blue-50 rounded-lg">
						<p class="text-sm uppercase tracking-wide text-gray-600">ACCOUNT GROWTH</p>
						<p class="text-2xl font-bold" :class="ytdReconciliation.netChange >= 0 ? 'text-blue-700' : 'text-red-700'">
							{{ ytdReconciliation.netChange >= 0 ? '+' : '' }}{{ formatCurrency(ytdReconciliation.netChange) }}
						</p>
						<p class="text-xs text-gray-500">
							{{
								ytdReconciliation.beginningBalance > 0
									? Math.round((ytdReconciliation.netChange / ytdReconciliation.beginningBalance) * 100)
									: 0
							}}% change
						</p>
					</div>
				</div>

				<!-- Detailed Breakdown -->
				<div class="border-t pt-4">
					<h3 class="font-semibold uppercase tracking-wide mb-3">DETAILED YTD ACTIVITY</h3>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div>
							<h4 class="text-sm font-semibold text-gray-700 mb-2">MONEY IN</h4>
							<div class="space-y-2 text-sm">
								<div class="flex justify-between p-2 bg-green-50 rounded">
									<span>Operating Deposits:</span>
									<span class="font-semibold">{{ formatCurrency(ytdReconciliation.operatingRevenue) }}</span>
								</div>
								<div class="flex justify-between p-2 bg-purple-50 rounded">
									<span>Transfers In:</span>
									<span class="font-semibold">{{ formatCurrency(ytdReconciliation.transfersIn.total) }}</span>
								</div>
								<div class="flex justify-between p-2 bg-gray-100 rounded font-bold">
									<span>Total In:</span>
									<span>
										{{ formatCurrency(ytdReconciliation.operatingRevenue + ytdReconciliation.transfersIn.total) }}
									</span>
								</div>
							</div>
						</div>

						<div>
							<h4 class="text-sm font-semibold text-gray-700 mb-2">MONEY OUT</h4>
							<div class="space-y-2 text-sm">
								<div class="flex justify-between p-2 bg-red-50 rounded">
									<span>Operating Expenses:</span>
									<span class="font-semibold">{{ formatCurrency(ytdReconciliation.operatingExpenses) }}</span>
								</div>
								<div class="flex justify-between p-2 bg-orange-50 rounded">
									<span>Transfers Out:</span>
									<span class="font-semibold">{{ formatCurrency(ytdReconciliation.transfersOut.total) }}</span>
								</div>
								<div class="flex justify-between p-2 bg-gray-100 rounded font-bold">
									<span>Total Out:</span>
									<span>
										{{ formatCurrency(ytdReconciliation.operatingExpenses + ytdReconciliation.transfersOut.total) }}
									</span>
								</div>
							</div>
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
	selectedMonth,
	loading,
	error,
	accounts,
	monthlyReconciliation,
	ytdReconciliation,
	transferAudit,
	monthOptions,
	fetchData,
	formatCurrency,
	getAccountName,
} = useHOAReconciliation();

const accountOptions = computed(() =>
	accounts.value.map((a) => ({
		label: `${a.account_name} (${a.account_number})`,
		value: a.id,
	}))
);

const yearOptions = [
	{label: '2024', value: 2024},
	{label: '2025', value: 2025},
];

onMounted(() => {
	fetchData();
});
</script>
