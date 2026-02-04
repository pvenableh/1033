<template>
	<div class="container mx-auto p-6 space-y-6">
		<!-- Header -->
		<div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-3xl font-bold uppercase tracking-wider mb-2 dark:text-white">
						ACCOUNT RECONCILIATION
					</h1>
					<p class="text-gray-600 dark:text-gray-400">
						Monthly and YTD reconciliation reports with transaction notes and budget tracking
					</p>
				</div>
				<div class="flex items-center gap-2">
					<UBadge v-if="canReconcile" color="green" variant="soft">
						<UIcon name="i-heroicons-check-circle" class="w-4 h-4 mr-1" />
						Reconcile Access
					</UBadge>
					<UBadge v-else color="gray" variant="soft">
						<UIcon name="i-heroicons-eye" class="w-4 h-4 mr-1" />
						View Only
					</UBadge>
				</div>
			</div>
		</div>

		<!-- Filters -->
		<UCard>
			<div class="flex flex-wrap gap-4 items-center">
				<div class="flex items-center gap-2">
					<label class="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase">Account:</label>
					<USelectMenu v-model="selectedAccount" :options="accountOptions" value-attribute="value" option-attribute="label" size="sm" class="w-64" />
				</div>
				<div class="flex items-center gap-2">
					<label class="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase">Month:</label>
					<USelectMenu v-model="selectedMonth" :options="monthOptions" value-attribute="value" option-attribute="label" size="sm" class="w-32" />
				</div>
				<div class="flex items-center gap-2">
					<label class="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase">Year:</label>
					<USelectMenu v-model="selectedYear" :options="yearOptions" value-attribute="value" option-attribute="label" size="sm" class="w-24" />
				</div>
				<div class="ml-auto flex gap-2">
					<UButton
						v-if="canReconcile"
						color="primary"
						variant="soft"
						size="sm"
						icon="i-heroicons-document-chart-bar"
						@click="showGenerateReportModal = true">
						Generate Report
					</UButton>
					<UButton
						color="gray"
						variant="soft"
						size="sm"
						icon="i-heroicons-arrow-path"
						:loading="loading"
						@click="fetchData">
						Refresh
					</UButton>
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
				<div class="mt-3">
					<UButton
						v-if="canReconcile"
						color="red"
						variant="soft"
						size="sm"
						icon="i-heroicons-link"
						:loading="autoLinking"
						@click="runAutoLinkTransfers">
						Auto-Link Transfers
					</UButton>
				</div>
			</template>
		</UAlert>

		<!-- Auto-Link Results -->
		<UAlert
			v-if="autoLinkResults"
			icon="i-heroicons-check-circle"
			color="green"
			variant="soft"
			title="Transfer Linking Complete">
			<template #description>
				<p>Linked {{ autoLinkResults.linked }} transfer pairs. Categorized {{ autoLinkResults.categorized }} transactions. Skipped {{ autoLinkResults.skipped }}.</p>
				<div v-if="autoLinkResults.results.length > 0" class="mt-2 space-y-1 text-xs">
					<div v-for="r in autoLinkResults.results" :key="r.transfer_out_id" class="flex gap-2">
						<span class="font-mono">${{ r.amount.toFixed(2) }}</span>
						<span>{{ r.from_account }} → {{ r.to_account }}</span>
						<UBadge v-if="r.category_assigned" color="blue" variant="soft" size="xs">{{ r.category_assigned }}</UBadge>
					</div>
				</div>
			</template>
		</UAlert>

		<!-- Reconciliation Status Summary -->
		<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
			<UCard class="text-center">
				<p class="text-sm uppercase tracking-wide text-gray-600 dark:text-gray-400">Total Transactions</p>
				<p class="text-2xl font-bold text-blue-700 dark:text-blue-400">
					{{ reconciliationSummary.total }}
				</p>
			</UCard>
			<UCard class="text-center">
				<p class="text-sm uppercase tracking-wide text-gray-600 dark:text-gray-400">Reconciled</p>
				<p class="text-2xl font-bold text-green-700 dark:text-green-400">
					{{ reconciliationSummary.reconciled }}
				</p>
			</UCard>
			<UCard class="text-center">
				<p class="text-sm uppercase tracking-wide text-gray-600 dark:text-gray-400">Pending</p>
				<p class="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
					{{ reconciliationSummary.pending }}
				</p>
			</UCard>
			<UCard class="text-center">
				<p class="text-sm uppercase tracking-wide text-gray-600 dark:text-gray-400">Disputed</p>
				<p class="text-2xl font-bold text-red-700 dark:text-red-400">
					{{ reconciliationSummary.disputed }}
				</p>
			</UCard>
		</div>

		<!-- Main Content Tabs -->
		<UTabs :items="tabs" class="w-full">
			<!-- Monthly Reconciliation Tab -->
			<template #monthly>
				<UCard v-if="monthlyReconciliation" class="mt-4">
					<template #header>
						<div class="flex items-center justify-between">
							<h2 class="text-xl font-semibold uppercase tracking-wide dark:text-white">
								MONTHLY RECONCILIATION - {{ getAccountName(selectedAccount) }}
							</h2>
							<div class="flex items-center gap-2">
								<UBadge :color="monthlyReconciliation.isReconciled ? 'green' : 'red'" variant="soft" size="lg">
									{{ monthlyReconciliation.isReconciled ? 'RECONCILED' : 'NOT RECONCILED' }}
								</UBadge>
								<UBadge v-if="currentMonthReportStatus" :color="currentMonthReportStatus === 'reconciled' ? 'green' : currentMonthReportStatus === 'in_progress' ? 'yellow' : 'gray'" variant="outline" size="lg">
									{{ currentMonthReportStatus === 'reconciled' ? 'CERTIFIED CLOSED' : currentMonthReportStatus?.toUpperCase() }}
								</UBadge>
								<UButton
									v-if="canReconcile && currentMonthReportStatus !== 'reconciled'"
									color="green"
									variant="solid"
									size="sm"
									icon="i-heroicons-check-badge"
									:loading="reconcilingMonth"
									@click="reconcileCurrentMonth">
									{{ currentMonthReport ? 'Certify & Close Month' : 'Reconcile Month' }}
								</UButton>
							</div>
						</div>
					</template>

					<!-- Reconciliation Summary -->
					<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
						<div class="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
							<p class="text-sm uppercase tracking-wide text-gray-600 dark:text-gray-400">BEGINNING BALANCE</p>
							<p class="text-2xl font-bold text-blue-900 dark:text-blue-300">
								{{ formatCurrency(monthlyReconciliation.beginningBalance) }}
							</p>
						</div>

						<div class="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
							<p class="text-sm uppercase tracking-wide text-gray-600 dark:text-gray-400">NET CHANGE</p>
							<p
								class="text-2xl font-bold"
								:class="monthlyReconciliation.netChange >= 0 ? 'text-green-900 dark:text-green-400' : 'text-red-900 dark:text-red-400'">
								{{ monthlyReconciliation.netChange >= 0 ? '+' : '' }}{{ formatCurrency(monthlyReconciliation.netChange) }}
							</p>
						</div>

						<div class="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
							<p class="text-sm uppercase tracking-wide text-gray-600 dark:text-gray-400">ENDING BALANCE</p>
							<p class="text-2xl font-bold text-green-900 dark:text-green-300">
								{{ formatCurrency(monthlyReconciliation.endingBalance) }}
							</p>
							<p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
								Calculated: {{ formatCurrency(monthlyReconciliation.calculatedEnding) }}
							</p>
						</div>
					</div>

					<!-- Activity Breakdown -->
					<div class="space-y-4">
						<h3 class="font-semibold uppercase tracking-wide text-lg border-b dark:border-gray-700 pb-2 dark:text-white">
							ACTIVITY BREAKDOWN
						</h3>

						<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
							<!-- Operating Activity -->
							<div class="border dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
								<h4 class="font-semibold text-gray-900 dark:text-white mb-3">OPERATING ACTIVITY</h4>
								<div class="space-y-2 text-sm">
									<div class="flex justify-between">
										<span class="text-gray-600 dark:text-gray-400">Deposits ({{ monthlyReconciliation.deposits.count }}):</span>
										<span class="font-semibold text-green-600 dark:text-green-400">
											+{{ formatCurrency(monthlyReconciliation.deposits.total) }}
										</span>
									</div>
									<div class="flex justify-between">
										<span class="text-gray-600 dark:text-gray-400">Withdrawals ({{ monthlyReconciliation.withdrawals.count }}):</span>
										<span class="font-semibold text-red-600 dark:text-red-400">
											-{{ formatCurrency(monthlyReconciliation.withdrawals.total) }}
										</span>
									</div>
									<div class="flex justify-between">
										<span class="text-gray-600 dark:text-gray-400">Fees ({{ monthlyReconciliation.fees.count }}):</span>
										<span class="font-semibold text-red-600 dark:text-red-400">
											-{{ formatCurrency(monthlyReconciliation.fees.total) }}
										</span>
									</div>
									<div class="flex justify-between pt-2 border-t dark:border-gray-600">
										<span class="font-medium dark:text-white">Operating Net:</span>
										<span
											class="font-bold"
											:class="monthlyReconciliation.operatingNetChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
											{{ monthlyReconciliation.operatingNetChange >= 0 ? '+' : '' }}{{ formatCurrency(monthlyReconciliation.operatingNetChange) }}
										</span>
									</div>
								</div>
							</div>

							<!-- Transfer Activity -->
							<div class="border dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
								<h4 class="font-semibold text-gray-900 dark:text-white mb-3">TRANSFER ACTIVITY</h4>
								<div class="space-y-2 text-sm">
									<div class="flex justify-between">
										<span class="text-gray-600 dark:text-gray-400">Transfers In ({{ monthlyReconciliation.transfersIn.count }}):</span>
										<span class="font-semibold text-purple-600 dark:text-purple-400">
											+{{ formatCurrency(monthlyReconciliation.transfersIn.total) }}
										</span>
									</div>
									<div class="flex justify-between">
										<span class="text-gray-600 dark:text-gray-400">Transfers Out ({{ monthlyReconciliation.transfersOut.count }}):</span>
										<span class="font-semibold text-orange-600 dark:text-orange-400">
											-{{ formatCurrency(monthlyReconciliation.transfersOut.total) }}
										</span>
									</div>
									<div class="flex justify-between pt-2 border-t dark:border-gray-600">
										<span class="font-medium dark:text-white">Transfer Net:</span>
										<span
											class="font-bold"
											:class="monthlyReconciliation.transferNetChange >= 0 ? 'text-purple-600 dark:text-purple-400' : 'text-orange-600 dark:text-orange-400'">
											{{ monthlyReconciliation.transferNetChange >= 0 ? '+' : '' }}{{ formatCurrency(monthlyReconciliation.transferNetChange) }}
										</span>
									</div>
								</div>
							</div>
						</div>
					</div>

					<!-- Reconciliation Formula -->
					<div class="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
						<h4 class="font-semibold text-blue-900 dark:text-blue-300 mb-2">RECONCILIATION FORMULA</h4>
						<div class="text-sm text-blue-800 dark:text-blue-200 space-y-1 font-mono">
							<div>Beginning Balance: {{ formatCurrency(monthlyReconciliation.beginningBalance) }}</div>
							<div>+ Deposits: {{ formatCurrency(monthlyReconciliation.deposits.total) }}</div>
							<div>+ Transfers In: {{ formatCurrency(monthlyReconciliation.transfersIn.total) }}</div>
							<div>- Withdrawals: {{ formatCurrency(monthlyReconciliation.withdrawals.total) }}</div>
							<div>- Transfers Out: {{ formatCurrency(monthlyReconciliation.transfersOut.total) }}</div>
							<div>- Fees: {{ formatCurrency(monthlyReconciliation.fees.total) }}</div>
							<div class="border-t border-blue-300 dark:border-blue-600 pt-1 mt-1">
								= Calculated Ending: {{ formatCurrency(monthlyReconciliation.calculatedEnding) }}
							</div>
							<div class="font-bold">Bank Statement Ending: {{ formatCurrency(monthlyReconciliation.endingBalance) }}</div>
							<div class="font-bold" :class="monthlyReconciliation.isReconciled ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'">
								Difference: {{ formatCurrency(Math.abs(monthlyReconciliation.difference)) }}
							</div>
						</div>
					</div>
				</UCard>
			</template>

			<!-- Transactions Tab -->
			<template #transactions>
				<UCard class="mt-4">
					<template #header>
						<div class="flex items-center justify-between">
							<h2 class="text-xl font-semibold uppercase tracking-wide dark:text-white">
								TRANSACTIONS - {{ getMonthName(selectedMonth) }} {{ selectedYear }}
							</h2>
							<div class="flex gap-2">
								<UButton
									v-if="canReconcile && selectedTransactions.length > 0"
									color="green"
									variant="soft"
									size="sm"
									icon="i-heroicons-check"
									@click="bulkReconcile('reconciled')">
									Mark Selected Reconciled ({{ selectedTransactions.length }})
								</UButton>
							</div>
						</div>
					</template>

					<!-- Transaction Table -->
					<div class="overflow-x-auto">
						<table class="w-full text-sm">
							<thead>
								<tr class="border-b-2 border-gray-300 dark:border-gray-600">
									<th v-if="canReconcile" class="py-3 px-2 text-left">
										<UCheckbox v-model="selectAll" @change="toggleSelectAll" />
									</th>
									<th class="py-3 px-4 text-left uppercase tracking-wider text-xs font-semibold text-gray-600 dark:text-gray-400">
										Date
									</th>
									<th class="py-3 px-4 text-left uppercase tracking-wider text-xs font-semibold text-gray-600 dark:text-gray-400">
										Description
									</th>
									<th class="py-3 px-4 text-left uppercase tracking-wider text-xs font-semibold text-gray-600 dark:text-gray-400">
										Budget Item
									</th>
									<th class="py-3 px-4 text-right uppercase tracking-wider text-xs font-semibold text-gray-600 dark:text-gray-400">
										Amount
									</th>
									<th class="py-3 px-4 text-center uppercase tracking-wider text-xs font-semibold text-gray-600 dark:text-gray-400">
										Status
									</th>
									<th class="py-3 px-4 text-center uppercase tracking-wider text-xs font-semibold text-gray-600 dark:text-gray-400">
										Actions
									</th>
								</tr>
							</thead>
							<tbody>
								<tr
									v-for="transaction in monthlyReconciliation?.allTransactions || []"
									:key="transaction.id"
									class="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
									<td v-if="canReconcile" class="py-3 px-2">
										<UCheckbox
											:model-value="selectedTransactions.includes(transaction.id)"
											@update:model-value="toggleTransaction(transaction.id)" />
									</td>
									<td class="py-3 px-4 text-gray-900 dark:text-gray-100">
										{{ formatDate(transaction.transaction_date) }}
									</td>
									<td class="py-3 px-4">
										<div class="font-medium text-gray-900 dark:text-gray-100">{{ transaction.description }}</div>
										<div v-if="transaction.vendor" class="text-xs text-gray-500 dark:text-gray-400">
											{{ transaction.vendor }}
										</div>
									</td>
									<td class="py-3 px-4 text-gray-600 dark:text-gray-400">
										<span v-if="transaction.budget_item_id" class="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
											{{ getBudgetItemName(transaction.budget_item_id) }}
										</span>
										<span v-else class="text-xs text-gray-400 dark:text-gray-500">Unassigned</span>
									</td>
									<td class="py-3 px-4 text-right font-semibold" :class="getAmountClass(transaction)">
										{{ getAmountDisplay(transaction) }}
									</td>
									<td class="py-3 px-4 text-center">
										<UBadge
											:color="getReconciliationStatusColor(transaction.reconciliation_status)"
											variant="soft"
											size="sm">
											{{ transaction.reconciliation_status || 'pending' }}
										</UBadge>
									</td>
									<td class="py-3 px-4 text-center">
										<div class="flex items-center justify-center gap-1">
											<UButton
												color="gray"
												variant="ghost"
												size="xs"
												icon="i-heroicons-chat-bubble-left-ellipsis"
												:class="{ 'text-blue-600': hasNotes(transaction.id) }"
												@click="openNotesPanel(transaction)" />
											<UDropdown v-if="canReconcile" :items="getTransactionActions(transaction)">
												<UButton color="gray" variant="ghost" size="xs" icon="i-heroicons-ellipsis-vertical" />
											</UDropdown>
										</div>
									</td>
								</tr>
							</tbody>
						</table>
					</div>
				</UCard>
			</template>

			<!-- Claude Assistant Tab -->
			<template #assistant>
				<UCard class="mt-4">
					<template #header>
						<div class="flex items-center justify-between">
							<h2 class="text-xl font-semibold uppercase tracking-wide dark:text-white">
								CLAUDE RECONCILIATION ASSISTANT
							</h2>
							<UButton
								v-if="canReconcile"
								color="violet"
								variant="soft"
								size="sm"
								icon="i-heroicons-sparkles"
								:loading="assistantLoading"
								@click="runReconciliationAssistant">
								{{ assistantAnalysis ? 'Re-Analyze' : 'Analyze Transactions' }}
							</UButton>
						</div>
					</template>

					<!-- Pre-analysis state -->
					<div v-if="!assistantAnalysis && !assistantLoading" class="text-center py-12">
						<UIcon name="i-heroicons-sparkles" class="w-16 h-16 mx-auto mb-4 text-violet-400" />
						<h3 class="text-lg font-semibold dark:text-white mb-2">AI-Powered Reconciliation</h3>
						<p class="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
							Claude will analyze all transactions for {{ getMonthName(selectedMonth) }} {{ selectedYear }},
							suggest categories for uncategorized items, flag entries needing notes,
							and identify potential issues.
						</p>
						<UButton
							v-if="canReconcile"
							color="violet"
							size="lg"
							icon="i-heroicons-sparkles"
							:loading="assistantLoading"
							@click="runReconciliationAssistant">
							Start Analysis
						</UButton>
					</div>

					<!-- Loading state -->
					<div v-if="assistantLoading" class="text-center py-12">
						<div class="animate-pulse">
							<UIcon name="i-heroicons-sparkles" class="w-16 h-16 mx-auto mb-4 text-violet-400" />
							<p class="text-gray-600 dark:text-gray-400">Analyzing {{ reconciliationSummary.total }} transactions...</p>
						</div>
					</div>

					<!-- Analysis Results -->
					<div v-if="assistantAnalysis && !assistantLoading" class="space-y-6">
						<!-- Summary -->
						<div class="p-4 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
							<h3 class="font-semibold text-violet-900 dark:text-violet-300 mb-2">ANALYSIS SUMMARY</h3>
							<p class="text-sm text-violet-800 dark:text-violet-200">{{ assistantAnalysis.analysis?.summary }}</p>
						</div>

						<!-- Reconciliation Assessment -->
						<div v-if="assistantAnalysis.analysis?.reconciliation_assessment"
							class="p-4 rounded-lg"
							:class="{
								'bg-green-50 dark:bg-green-900/20': assistantAnalysis.analysis.reconciliation_assessment.status === 'ready',
								'bg-yellow-50 dark:bg-yellow-900/20': assistantAnalysis.analysis.reconciliation_assessment.status === 'needs_review',
								'bg-red-50 dark:bg-red-900/20': assistantAnalysis.analysis.reconciliation_assessment.status === 'issues_found',
							}">
							<div class="flex items-center gap-2 mb-2">
								<UBadge
									:color="assistantAnalysis.analysis.reconciliation_assessment.status === 'ready' ? 'green' : assistantAnalysis.analysis.reconciliation_assessment.status === 'needs_review' ? 'yellow' : 'red'"
									variant="soft" size="lg">
									{{ assistantAnalysis.analysis.reconciliation_assessment.status?.replace('_', ' ').toUpperCase() }}
								</UBadge>
							</div>
							<div v-if="assistantAnalysis.analysis.reconciliation_assessment.issues?.length" class="mb-3">
								<h4 class="text-sm font-semibold mb-1 dark:text-white">Issues:</h4>
								<ul class="list-disc list-inside text-sm space-y-1 text-gray-700 dark:text-gray-300">
									<li v-for="(issue, idx) in assistantAnalysis.analysis.reconciliation_assessment.issues" :key="idx">{{ issue }}</li>
								</ul>
							</div>
							<div v-if="assistantAnalysis.analysis.reconciliation_assessment.recommendations?.length">
								<h4 class="text-sm font-semibold mb-1 dark:text-white">Recommendations:</h4>
								<ul class="list-disc list-inside text-sm space-y-1 text-gray-700 dark:text-gray-300">
									<li v-for="(rec, idx) in assistantAnalysis.analysis.reconciliation_assessment.recommendations" :key="idx">{{ rec }}</li>
								</ul>
							</div>
						</div>

						<!-- Action Items -->
						<div v-if="assistantAnalysis.analysis?.items?.length > 0">
							<h3 class="font-semibold uppercase tracking-wide text-lg border-b dark:border-gray-700 pb-2 mb-4 dark:text-white">
								ACTION ITEMS ({{ assistantAnalysis.analysis.items.length }})
							</h3>

							<!-- Step-through UI -->
							<div class="space-y-3">
								<div
									v-for="(item, idx) in assistantAnalysis.analysis.items"
									:key="idx"
									class="border dark:border-gray-700 rounded-lg p-4"
									:class="{
										'border-l-4 border-l-green-500': item.action === 'categorize',
										'border-l-4 border-l-yellow-500': item.action === 'add_note' || item.action === 'flag_review',
										'border-l-4 border-l-purple-500': item.action === 'link_transfer',
										'border-l-4 border-l-blue-500': item.action === 'mark_future_period',
										'opacity-50': assistantApplied[item.transaction_id + '_' + idx],
									}">
									<div class="flex items-start justify-between gap-4">
										<div class="flex-1">
											<div class="flex items-center gap-2 mb-1">
												<UBadge
													:color="item.action === 'categorize' ? 'green' : item.action === 'add_note' ? 'yellow' : item.action === 'link_transfer' ? 'violet' : item.action === 'mark_future_period' ? 'blue' : 'red'"
													variant="soft" size="sm">
													{{ item.action.replace('_', ' ') }}
												</UBadge>
												<UBadge
													:color="item.confidence === 'high' ? 'green' : item.confidence === 'medium' ? 'yellow' : 'gray'"
													variant="outline" size="xs">
													{{ item.confidence }} confidence
												</UBadge>
												<span class="text-xs text-gray-400">TX #{{ item.transaction_id }}</span>
											</div>
											<p class="text-sm font-medium dark:text-white">{{ item.suggestion }}</p>
											<p v-if="item.category_name" class="text-xs text-green-700 dark:text-green-400 mt-1">
												Category: {{ item.category_name }}
											</p>
											<p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ item.reasoning }}</p>
										</div>
										<div class="flex gap-1">
											<UButton
												v-if="canReconcile && !assistantApplied[item.transaction_id + '_' + idx]"
												color="green"
												variant="soft"
												size="xs"
												icon="i-heroicons-check"
												:loading="applyingItem === idx"
												@click="applyAssistantItem(item, idx)">
												Apply
											</UButton>
											<UButton
												v-if="assistantApplied[item.transaction_id + '_' + idx]"
												color="green"
												variant="ghost"
												size="xs"
												icon="i-heroicons-check-circle"
												disabled>
												Applied
											</UButton>
											<UButton
												v-if="canReconcile && !assistantApplied[item.transaction_id + '_' + idx]"
												color="gray"
												variant="ghost"
												size="xs"
												icon="i-heroicons-x-mark"
												@click="dismissAssistantItem(item, idx)">
											</UButton>
										</div>
									</div>
								</div>
							</div>

							<!-- Bulk Apply -->
							<div v-if="unappliedHighConfidenceCount > 0" class="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-between">
								<p class="text-sm text-green-800 dark:text-green-200">
									{{ unappliedHighConfidenceCount }} high-confidence suggestions ready to apply
								</p>
								<UButton
									v-if="canReconcile"
									color="green"
									variant="soft"
									size="sm"
									icon="i-heroicons-check-badge"
									:loading="bulkApplying"
									@click="bulkApplyHighConfidence">
									Apply All High-Confidence
								</UButton>
							</div>
						</div>

						<!-- Token Usage -->
						<div v-if="assistantAnalysis.token_usage" class="text-xs text-gray-400 dark:text-gray-500 text-right">
							Claude tokens: {{ assistantAnalysis.token_usage.input_tokens }} in / {{ assistantAnalysis.token_usage.output_tokens }} out
						</div>
					</div>
				</UCard>
			</template>

			<!-- YTD Reconciliation Tab -->
			<template #ytd>
				<UCard v-if="ytdReconciliation" class="mt-4">
					<template #header>
						<h2 class="text-xl font-semibold uppercase tracking-wide dark:text-white">
							YEAR-TO-DATE RECONCILIATION - {{ getAccountName(selectedAccount) }}
						</h2>
					</template>

					<div class="space-y-6">
						<!-- Summary Grid -->
						<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
							<div class="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
								<p class="text-sm uppercase tracking-wide text-gray-600 dark:text-gray-400">OPERATING REVENUE</p>
								<p class="text-2xl font-bold text-green-700 dark:text-green-400">
									{{ formatCurrency(ytdReconciliation.operatingRevenue) }}
								</p>
								<p class="text-xs text-gray-500 dark:text-gray-400">{{ ytdReconciliation.deposits.count }} deposits</p>
							</div>

							<div class="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
								<p class="text-sm uppercase tracking-wide text-gray-600 dark:text-gray-400">OPERATING EXPENSES</p>
								<p class="text-2xl font-bold text-red-700 dark:text-red-400">
									{{ formatCurrency(ytdReconciliation.operatingExpenses) }}
								</p>
								<p class="text-xs text-gray-500 dark:text-gray-400">
									{{ ytdReconciliation.withdrawals.count + ytdReconciliation.fees.count }} transactions
								</p>
							</div>

							<div class="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
								<p class="text-sm uppercase tracking-wide text-gray-600 dark:text-gray-400">TRANSFER NET</p>
								<p class="text-2xl font-bold text-purple-700 dark:text-purple-400">
									{{ ytdReconciliation.transferNetChange >= 0 ? '+' : '' }}{{ formatCurrency(ytdReconciliation.transferNetChange) }}
								</p>
								<p class="text-xs text-gray-500 dark:text-gray-400">
									In: {{ ytdReconciliation.transfersIn.count }} | Out: {{ ytdReconciliation.transfersOut.count }}
								</p>
							</div>

							<div class="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
								<p class="text-sm uppercase tracking-wide text-gray-600 dark:text-gray-400">ACCOUNT GROWTH</p>
								<p class="text-2xl font-bold" :class="ytdReconciliation.netChange >= 0 ? 'text-blue-700 dark:text-blue-400' : 'text-red-700 dark:text-red-400'">
									{{ ytdReconciliation.netChange >= 0 ? '+' : '' }}{{ formatCurrency(ytdReconciliation.netChange) }}
								</p>
								<p class="text-xs text-gray-500 dark:text-gray-400">
									{{ ytdReconciliation.beginningBalance > 0 ? Math.round((ytdReconciliation.netChange / ytdReconciliation.beginningBalance) * 100) : 0 }}% change
								</p>
							</div>
						</div>

						<!-- Detailed Breakdown -->
						<div class="border-t dark:border-gray-700 pt-4">
							<h3 class="font-semibold uppercase tracking-wide mb-3 dark:text-white">DETAILED YTD ACTIVITY</h3>
							<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div>
									<h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">MONEY IN</h4>
									<div class="space-y-2 text-sm">
										<div class="flex justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded">
											<span class="dark:text-gray-300">Operating Deposits:</span>
											<span class="font-semibold dark:text-white">{{ formatCurrency(ytdReconciliation.operatingRevenue) }}</span>
										</div>
										<div class="flex justify-between p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
											<span class="dark:text-gray-300">Transfers In:</span>
											<span class="font-semibold dark:text-white">{{ formatCurrency(ytdReconciliation.transfersIn.total) }}</span>
										</div>
										<div class="flex justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded font-bold">
											<span class="dark:text-white">Total In:</span>
											<span class="dark:text-white">
												{{ formatCurrency(ytdReconciliation.operatingRevenue + ytdReconciliation.transfersIn.total) }}
											</span>
										</div>
									</div>
								</div>

								<div>
									<h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">MONEY OUT</h4>
									<div class="space-y-2 text-sm">
										<div class="flex justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded">
											<span class="dark:text-gray-300">Operating Expenses:</span>
											<span class="font-semibold dark:text-white">{{ formatCurrency(ytdReconciliation.operatingExpenses) }}</span>
										</div>
										<div class="flex justify-between p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
											<span class="dark:text-gray-300">Transfers Out:</span>
											<span class="font-semibold dark:text-white">{{ formatCurrency(ytdReconciliation.transfersOut.total) }}</span>
										</div>
										<div class="flex justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded font-bold">
											<span class="dark:text-white">Total Out:</span>
											<span class="dark:text-white">
												{{ formatCurrency(ytdReconciliation.operatingExpenses + ytdReconciliation.transfersOut.total) }}
											</span>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</UCard>
			</template>

			<!-- Budget Tracking Tab -->
			<template #budget>
				<UCard class="mt-4">
					<template #header>
						<h2 class="text-xl font-semibold uppercase tracking-wide dark:text-white">
							BUDGET VS ACTUAL - {{ getMonthName(selectedMonth) }} {{ selectedYear }}
						</h2>
					</template>

					<div class="space-y-4">
						<div v-for="category in budgetComparison" :key="category.id" class="border dark:border-gray-700 rounded-lg p-4">
							<div class="flex items-center justify-between mb-2">
								<h4 class="font-semibold dark:text-white">{{ category.category_name }}</h4>
								<UBadge :color="category.variance > 0 ? 'red' : 'green'" variant="soft">
									{{ category.variance > 0 ? 'Over' : 'Under' }} Budget
								</UBadge>
							</div>
							<div class="grid grid-cols-3 gap-4 text-sm">
								<div>
									<p class="text-gray-500 dark:text-gray-400">Budgeted</p>
									<p class="font-semibold dark:text-white">{{ formatCurrency(category.budget) }}</p>
								</div>
								<div>
									<p class="text-gray-500 dark:text-gray-400">Actual</p>
									<p class="font-semibold dark:text-white">{{ formatCurrency(category.actual) }}</p>
								</div>
								<div>
									<p class="text-gray-500 dark:text-gray-400">Variance</p>
									<p :class="category.variance > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'" class="font-semibold">
										{{ category.variance > 0 ? '+' : '' }}{{ formatCurrency(category.variance) }}
									</p>
								</div>
							</div>
							<!-- Progress bar -->
							<div class="mt-2">
								<div class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
									<div
										class="h-full rounded-full"
										:class="category.percentVariance > 100 ? 'bg-red-500' : 'bg-green-500'"
										:style="{ width: `${Math.min(category.percentVariance, 100)}%` }"></div>
								</div>
								<p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
									{{ Math.round(category.percentVariance) }}% of budget used
								</p>
							</div>
						</div>
					</div>
				</UCard>
			</template>

			<!-- Reports Tab -->
			<template #reports>
				<UCard class="mt-4">
					<template #header>
						<div class="flex items-center justify-between">
							<h2 class="text-xl font-semibold uppercase tracking-wide dark:text-white">
								RECONCILIATION REPORTS - {{ selectedYear }}
							</h2>
							<UButton
								v-if="canReconcile"
								color="primary"
								variant="soft"
								size="sm"
								icon="i-heroicons-plus"
								@click="showGenerateReportModal = true">
								New Report
							</UButton>
						</div>
					</template>

					<div v-if="savedReports.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
						<UIcon name="i-heroicons-document-chart-bar" class="w-12 h-12 mx-auto mb-2" />
						<p>No reconciliation reports found for {{ selectedYear }}</p>
						<p class="text-sm">Generate a report to track monthly reconciliation status</p>
					</div>

					<div v-else class="space-y-4">
						<div
							v-for="report in savedReports"
							:key="report.id"
							class="border dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800">
							<div class="flex items-center justify-between">
								<div>
									<h4 class="font-semibold dark:text-white">
										{{ getMonthName(report.report_month) }} {{ report.fiscal_year }}
									</h4>
									<p class="text-sm text-gray-500 dark:text-gray-400">
										{{ getAccountNameById(report.account_id) }}
									</p>
								</div>
								<div class="flex items-center gap-2">
									<UBadge :color="getReportStatusColor(report.reconciliation_status)" variant="soft">
										{{ report.reconciliation_status }}
									</UBadge>
									<span class="text-sm text-gray-500 dark:text-gray-400">
										Diff: {{ formatCurrency(report.reconciliation_difference) }}
									</span>
								</div>
							</div>
						</div>
					</div>
				</UCard>
			</template>
		</UTabs>

		<!-- Transaction Notes Sheet -->
		<Sheet :open="showNotesPanel" @update:open="showNotesPanel = $event">
			<SheetContent side="right" class="w-full sm:max-w-md overflow-y-auto">
				<SheetHeader>
					<SheetTitle>Transaction Notes</SheetTitle>
				</SheetHeader>

				<div class="space-y-4 py-4">
					<div v-if="selectedTransaction" class="border-b dark:border-gray-700 pb-4">
						<p class="text-sm text-gray-500 dark:text-gray-400">{{ formatDate(selectedTransaction.transaction_date) }}</p>
						<p class="font-medium dark:text-white">{{ selectedTransaction.description }}</p>
						<p class="text-lg font-bold" :class="getAmountClass(selectedTransaction)">
							{{ getAmountDisplay(selectedTransaction) }}
						</p>
					</div>

					<!-- Add Note Form -->
					<div v-if="canCreateNotes" class="space-y-2">
						<UFormGroup label="Add Note">
							<UTextarea v-model="newNoteContent" placeholder="Enter your note..." rows="3" />
						</UFormGroup>
						<UFormGroup label="Note Type">
							<USelectMenu v-model="newNoteType" :options="noteTypeOptions" />
						</UFormGroup>
						<UButton
							color="primary"
							:loading="savingNote"
							:disabled="!newNoteContent.trim()"
							@click="addNote">
							Add Note
						</UButton>
					</div>

					<!-- Notes List -->
					<div class="space-y-3 mt-4">
						<h4 class="font-medium text-sm uppercase tracking-wide text-gray-500 dark:text-gray-400">Notes History</h4>
						<div
							v-for="note in transactionNotes"
							:key="note.id"
							class="border dark:border-gray-700 rounded-lg p-3"
							:class="{ 'opacity-50': note.is_resolved }">
							<div class="flex items-start justify-between">
								<div class="flex-1">
									<p class="text-sm dark:text-white">{{ note.note }}</p>
									<div class="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
										<UBadge :color="getNoteTypeColor(note.note_type)" variant="soft" size="xs">
											{{ note.note_type }}
										</UBadge>
										<span>{{ formatDate(note.date_created) }}</span>
										<span v-if="note.user_created?.first_name">
											by {{ note.user_created.first_name }} {{ note.user_created.last_name }}
										</span>
									</div>
								</div>
								<div v-if="canUpdateNotes && !note.is_resolved" class="flex gap-1">
									<UButton
										color="green"
										variant="ghost"
										size="xs"
										icon="i-heroicons-check"
										@click="resolveNoteHandler(note.id)" />
								</div>
							</div>
						</div>
						<p v-if="transactionNotes.length === 0" class="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
							No notes for this transaction
						</p>
					</div>
				</div>
			</SheetContent>
		</Sheet>

		<!-- Generate Report Modal -->
		<UModal v-model="showGenerateReportModal">
			<UCard>
				<template #header>
					<h3 class="text-lg font-semibold dark:text-white">Generate Reconciliation Report</h3>
				</template>

				<div class="space-y-4">
					<p class="text-sm text-gray-600 dark:text-gray-400">
						Generate a reconciliation report for {{ getMonthName(selectedMonth) }} {{ selectedYear }} - {{ getAccountName(selectedAccount) }}
					</p>

					<UFormGroup label="Notes (optional)">
						<UTextarea v-model="reportNotes" placeholder="Add any notes about this reconciliation..." rows="3" />
					</UFormGroup>
				</div>

				<template #footer>
					<div class="flex justify-end gap-2">
						<UButton color="gray" variant="ghost" @click="showGenerateReportModal = false">Cancel</UButton>
						<UButton color="primary" :loading="generatingReport" @click="generateReport">
							Generate Report
						</UButton>
					</div>
				</template>
			</UCard>
		</UModal>
	</div>
</template>

<script setup>
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '~/components/ui/sheet'

definePageMeta({ layout: 'default' })

useSeoMeta({
	title: 'Account Reconciliation',
});

const {
	selectedYear,
	selectedAccount,
	selectedMonth,
	loading,
	accounts,
	monthlyReconciliation,
	ytdReconciliation,
	transferAudit,
	monthOptions,
	fetchData,
	formatCurrency,
	getAccountName,
} = useHOAReconciliation();

const {
	canReadFinancials,
	canCreateNotes,
	canUpdateNotes,
	canReconcile,
	transactionNotes,
	fetchTransactionNotes,
	createNote,
	resolveNote,
	updateTransactionReconciliation,
	bulkReconcileTransactions,
	createReconciliationReport,
	fetchReconciliationReports,
	generateMonthlyReport,
	noteTypeOptions,
	initialize: initializeNotes,
} = useReconciliationNotes();

const { budgetCategories, fetchBudgetData } = useBudgetManagement();

// Local state
const showNotesPanel = ref(false);
const selectedTransaction = ref(null);
const selectedTransactions = ref([]);
const selectAll = ref(false);
const newNoteContent = ref('');
const newNoteType = ref('general');
const savingNote = ref(false);
const showGenerateReportModal = ref(false);
const reportNotes = ref('');
const generatingReport = ref(false);
const savedReports = ref([]);
const transactionNotesMap = ref({});

// Auto-link transfers state
const autoLinking = ref(false);
const autoLinkResults = ref(null);

// Claude Assistant state
const assistantLoading = ref(false);
const assistantAnalysis = ref(null);
const assistantApplied = ref({});
const applyingItem = ref(null);
const bulkApplying = ref(false);

const reconcilingMonth = ref(false);

const transactionsCollection = useDirectusItems('transactions');
const budgetCategoriesCollection = useDirectusItems('budget_categories');
const reconciliationNotesCollection = useDirectusItems('reconciliation_notes');

// Find the current month's reconciliation report
const currentMonthReport = computed(() => {
	return savedReports.value.find(
		(r) => r.report_month === selectedMonth.value &&
			(typeof r.account_id === 'object' ? r.account_id?.id : r.account_id) === selectedAccount.value
	);
});

const currentMonthReportStatus = computed(() => {
	return currentMonthReport.value?.reconciliation_status || null;
});

const unappliedHighConfidenceCount = computed(() => {
	if (!assistantAnalysis.value?.analysis?.items) return 0;
	return assistantAnalysis.value.analysis.items.filter(
		(item, idx) => item.confidence === 'high' && !assistantApplied.value[item.transaction_id + '_' + idx]
	).length;
});

// Tabs configuration
const tabs = [
	{ slot: 'monthly', label: 'Monthly', icon: 'i-heroicons-calendar' },
	{ slot: 'transactions', label: 'Transactions', icon: 'i-heroicons-list-bullet' },
	{ slot: 'assistant', label: 'Claude Assistant', icon: 'i-heroicons-sparkles' },
	{ slot: 'ytd', label: 'Year-to-Date', icon: 'i-heroicons-chart-bar' },
	{ slot: 'budget', label: 'Budget Tracking', icon: 'i-heroicons-currency-dollar' },
	{ slot: 'reports', label: 'Reports', icon: 'i-heroicons-document-chart-bar' },
];

// Computed
const accountOptions = computed(() =>
	accounts.value.map((a) => ({
		label: `${a.account_name} (${a.account_number})`,
		value: a.id,
	}))
);

const yearOptions = [
	{ label: '2024', value: 2024 },
	{ label: '2025', value: 2025 },
	{ label: '2026', value: 2026 },
];

const reconciliationSummary = computed(() => {
	const transactions = monthlyReconciliation.value?.allTransactions || [];
	return {
		total: transactions.length,
		reconciled: transactions.filter((t) => t.reconciliation_status === 'reconciled').length,
		pending: transactions.filter((t) => !t.reconciliation_status || t.reconciliation_status === 'pending').length,
		disputed: transactions.filter((t) => t.reconciliation_status === 'disputed').length,
	};
});

const budgetComparison = computed(() => {
	const transactions = monthlyReconciliation.value?.allTransactions || [];
	const categories = budgetCategories.value || [];

	return categories.map((category) => {
		const categoryTransactions = transactions.filter(
			(t) => t.category_id === category.id && t.transaction_type === 'withdrawal'
		);
		const actual = categoryTransactions.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
		const budget = parseFloat(category.monthly_budget || 0);
		const variance = actual - budget;
		const percentVariance = budget > 0 ? (actual / budget) * 100 : 0;

		return {
			...category,
			actual,
			budget,
			variance,
			percentVariance,
		};
	});
});

// Methods
const getMonthName = (monthValue) => {
	const monthNames = {
		'01': 'January', '02': 'February', '03': 'March', '04': 'April',
		'05': 'May', '06': 'June', '07': 'July', '08': 'August',
		'09': 'September', '10': 'October', '11': 'November', '12': 'December',
	};
	return monthNames[monthValue] || monthValue;
};

const formatDate = (dateStr) => {
	if (!dateStr) return '';
	return new Date(dateStr).toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	});
};

const getAmountClass = (transaction) => {
	if (transaction.transaction_type === 'deposit' || transaction.transaction_type === 'transfer_in') {
		return 'text-green-600 dark:text-green-400';
	}
	return 'text-red-600 dark:text-red-400';
};

const getAmountDisplay = (transaction) => {
	const prefix = transaction.transaction_type === 'deposit' || transaction.transaction_type === 'transfer_in' ? '+' : '-';
	return `${prefix}${formatCurrency(transaction.amount)}`;
};

const getReconciliationStatusColor = (status) => {
	switch (status) {
		case 'reconciled': return 'green';
		case 'disputed': return 'red';
		default: return 'yellow';
	}
};

const getReportStatusColor = (status) => {
	switch (status) {
		case 'reconciled': return 'green';
		case 'discrepancy': return 'red';
		case 'in_progress': return 'yellow';
		default: return 'gray';
	}
};

const getNoteTypeColor = (type) => {
	switch (type) {
		case 'reconciliation': return 'green';
		case 'discrepancy': return 'red';
		case 'approval': return 'yellow';
		case 'inquiry': return 'blue';
		default: return 'gray';
	}
};

const getBudgetItemName = (budgetItemId) => {
	// This would need to fetch from budget items
	return budgetItemId ? `Item #${budgetItemId}` : 'Unassigned';
};

const getAccountNameById = (accountId) => {
	const account = accounts.value.find((a) => a.id === accountId);
	return account ? account.account_name : 'Unknown Account';
};

const hasNotes = (transactionId) => {
	return transactionNotesMap.value[transactionId]?.length > 0;
};

const openNotesPanel = async (transaction) => {
	selectedTransaction.value = transaction;
	showNotesPanel.value = true;
	await fetchTransactionNotes(transaction.id);
};

const addNote = async () => {
	if (!selectedTransaction.value || !newNoteContent.value.trim()) return;

	savingNote.value = true;
	try {
		await createNote(selectedTransaction.value.id, {
			note: newNoteContent.value,
			note_type: newNoteType.value,
		});
		newNoteContent.value = '';
		newNoteType.value = 'general';
	} catch (e) {
		console.error('Error adding note:', e);
	} finally {
		savingNote.value = false;
	}
};

const resolveNoteHandler = async (noteId) => {
	try {
		await resolveNote(noteId);
		if (selectedTransaction.value) {
			await fetchTransactionNotes(selectedTransaction.value.id);
		}
	} catch (e) {
		console.error('Error resolving note:', e);
	}
};

const toggleTransaction = (transactionId) => {
	const index = selectedTransactions.value.indexOf(transactionId);
	if (index > -1) {
		selectedTransactions.value.splice(index, 1);
	} else {
		selectedTransactions.value.push(transactionId);
	}
};

const toggleSelectAll = () => {
	if (selectAll.value) {
		selectedTransactions.value = (monthlyReconciliation.value?.allTransactions || []).map((t) => t.id);
	} else {
		selectedTransactions.value = [];
	}
};

const bulkReconcile = async (status) => {
	if (selectedTransactions.value.length === 0) return;

	try {
		await bulkReconcileTransactions(selectedTransactions.value, status);
		selectedTransactions.value = [];
		selectAll.value = false;
		await fetchData();
	} catch (e) {
		console.error('Error bulk reconciling:', e);
	}
};

const getTransactionActions = (transaction) => {
	return [
		[
			{
				label: 'Mark Reconciled',
				icon: 'i-heroicons-check',
				click: () => updateTransactionReconciliation(transaction.id, 'reconciled'),
			},
			{
				label: 'Mark Disputed',
				icon: 'i-heroicons-exclamation-triangle',
				click: () => updateTransactionReconciliation(transaction.id, 'disputed'),
			},
			{
				label: 'Mark Pending',
				icon: 'i-heroicons-clock',
				click: () => updateTransactionReconciliation(transaction.id, 'pending'),
			},
		],
	];
};

// ========================
// RECONCILE CURRENT MONTH
// ========================
const reconcileCurrentMonth = async () => {
	reconcilingMonth.value = true;

	try {
		const txs = monthlyReconciliation.value?.allTransactions || [];
		const stmt = monthlyReconciliation.value?.statement;

		if (currentMonthReport.value) {
			// Report exists - certify and close it
			await completeReconciliationReport(currentMonthReport.value.id);
		} else {
			// Generate report then immediately certify it
			const reportData = await generateMonthlyReport(
				selectedYear.value,
				selectedAccount.value,
				selectedMonth.value,
				txs,
				stmt
			);

			const report = await createReconciliationReport(reportData);

			// If balances match, mark as reconciled immediately
			if (report && monthlyReconciliation.value?.isReconciled) {
				await completeReconciliationReport(report.id);
			}
		}

		// Also bulk-reconcile all pending transactions for this month
		const pendingTxIds = txs
			.filter((t) => !t.reconciliation_status || t.reconciliation_status === 'pending')
			.map((t) => t.id);

		if (pendingTxIds.length > 0) {
			await bulkReconcileTransactions(pendingTxIds, 'reconciled');
		}

		await loadReports();
		await fetchData();
	} catch (err) {
		console.error('Error reconciling month:', err);
	} finally {
		reconcilingMonth.value = false;
	}
};

// ========================
// AUTO-LINK TRANSFERS
// ========================
const runAutoLinkTransfers = async () => {
	autoLinking.value = true;
	autoLinkResults.value = null;

	try {
		const result = await $fetch('/api/admin/auto-link-transfers', {
			method: 'POST',
			body: {
				fiscal_year: selectedYear.value,
			},
		});
		autoLinkResults.value = result;
		// Refresh data to reflect linked transfers
		await fetchData();
	} catch (err) {
		console.error('Auto-link transfers error:', err);
		autoLinkResults.value = {
			linked: 0,
			categorized: 0,
			skipped: 0,
			results: [],
			errors: [err.message || 'Auto-link failed'],
		};
	} finally {
		autoLinking.value = false;
	}
};

// ========================
// CLAUDE ASSISTANT
// ========================
const runReconciliationAssistant = async () => {
	assistantLoading.value = true;
	assistantAnalysis.value = null;
	assistantApplied.value = {};

	try {
		const result = await $fetch('/api/admin/reconciliation-assistant', {
			method: 'POST',
			body: {
				fiscal_year: selectedYear.value,
				account_id: selectedAccount.value,
				month: selectedMonth.value,
			},
		});
		assistantAnalysis.value = result;
	} catch (err) {
		console.error('Reconciliation assistant error:', err);
		assistantAnalysis.value = {
			analysis: {
				summary: `Error: ${err.message || 'Analysis failed'}`,
				items: [],
				reconciliation_assessment: {
					status: 'issues_found',
					issues: [err.message || 'Analysis failed'],
					recommendations: ['Check that ANTHROPIC_API_KEY is configured'],
				},
			},
		};
	} finally {
		assistantLoading.value = false;
	}
};

const applyAssistantItem = async (item, idx) => {
	applyingItem.value = idx;

	try {
		if (item.action === 'categorize' && item.category_name) {
			// Look up the category by name
			const categories = await budgetCategoriesCollection.list({
				filter: {
					_or: [
						{ fiscal_year: { year: { _eq: selectedYear.value } } },
						{ fiscal_year: { _null: true } },
					],
				},
				fields: ['id', 'category_name'],
				limit: -1,
			});
			const cat = categories.find((c) =>
				c.category_name.toLowerCase() === item.category_name.toLowerCase()
			);

			if (cat) {
				await transactionsCollection.update(item.transaction_id, {
					category_id: cat.id,
					auto_categorized: true,
				});
			}
		} else if (item.action === 'add_note' || item.action === 'flag_review') {
			await createNote(item.transaction_id, {
				note: item.note_text || item.suggestion,
				note_type: item.action === 'flag_review' ? 'inquiry' : 'general',
			});
		}

		assistantApplied.value[item.transaction_id + '_' + idx] = true;
	} catch (err) {
		console.error('Error applying assistant item:', err);
	} finally {
		applyingItem.value = null;
	}
};

const dismissAssistantItem = (item, idx) => {
	assistantApplied.value[item.transaction_id + '_' + idx] = true;
};

const bulkApplyHighConfidence = async () => {
	if (!assistantAnalysis.value?.analysis?.items) return;

	bulkApplying.value = true;
	try {
		for (let idx = 0; idx < assistantAnalysis.value.analysis.items.length; idx++) {
			const item = assistantAnalysis.value.analysis.items[idx];
			if (item.confidence === 'high' && !assistantApplied.value[item.transaction_id + '_' + idx]) {
				await applyAssistantItem(item, idx);
			}
		}
		// Refresh transaction data
		await fetchData();
	} catch (err) {
		console.error('Bulk apply error:', err);
	} finally {
		bulkApplying.value = false;
	}
};

const generateReport = async () => {
	generatingReport.value = true;
	try {
		const transactions = monthlyReconciliation.value?.allTransactions || [];
		const statement = monthlyReconciliation.value?.statement;

		const reportData = await generateMonthlyReport(
			selectedYear.value,
			selectedAccount.value,
			selectedMonth.value,
			transactions,
			statement
		);

		reportData.notes = reportNotes.value;

		await createReconciliationReport(reportData);
		showGenerateReportModal.value = false;
		reportNotes.value = '';

		await loadReports();
	} catch (e) {
		console.error('Error generating report:', e);
	} finally {
		generatingReport.value = false;
	}
};

const loadReports = async () => {
	savedReports.value = await fetchReconciliationReports(selectedYear.value, selectedAccount.value);
};

// Initialize
onMounted(async () => {
	await initializeNotes();
	await fetchData();
	await fetchBudgetData();
	await loadReports();
});

// Watch for changes
watch([selectedYear, selectedAccount, selectedMonth], async () => {
	await loadReports();
	// Reset assistant state when filters change
	assistantAnalysis.value = null;
	assistantApplied.value = {};
	autoLinkResults.value = null;
});
</script>
