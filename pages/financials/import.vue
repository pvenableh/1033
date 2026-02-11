<template>
	<div class="max-w-7xl mx-auto p-6 space-y-8">
		<!-- Header -->
		<div class="bg-white rounded-lg shadow-sm border p-6">
			<h1 class="text-3xl font-bold text-gray-900 mb-2">Chase CSV Batch Import</h1>
			<p class="text-gray-600">
				Upload Chase bank CSV exports for all accounts. Transactions are grouped by month with exact balances
				from Chase's running balance column.
			</p>
		</div>

		<!-- Step 1: File Upload + Fiscal Year -->
		<div class="bg-white rounded-lg shadow-sm border">
			<div class="border-b px-6 py-4">
				<h2 class="text-xl font-semibold text-gray-900">Step 1: Upload Chase CSV Files</h2>
				<p class="text-sm text-gray-600 mt-1">
					Upload the full-year (or partial) CSV export from Chase for each account
				</p>
			</div>
			<div class="p-6 space-y-4">
				<!-- Fiscal Year Selector -->
				<div class="flex items-center gap-4 mb-4">
					<label class="text-sm font-medium text-gray-700">Fiscal Year</label>
					<select
						v-model="selectedFiscalYear"
						class="border rounded-lg px-3 py-2 text-sm"
						:disabled="isParsing || isImporting">
						<option v-for="fy in fiscalYears" :key="fy.id" :value="fy.year">
							{{ fy.year }}
						</option>
					</select>
				</div>

				<!-- Operating Account -->
				<div
					:class="[
						'border-2 border-dashed rounded-lg p-4 transition-colors',
						uploadedFiles.operating ? 'border-green-500 bg-green-50' : 'border-gray-300',
					]"
					@dragover.prevent
					@drop.prevent="handleDrop('operating', $event)">
					<div class="flex items-center justify-between">
						<div class="flex-1">
							<h3 class="font-semibold text-gray-900">Operating Account (5129)</h3>
							<p class="text-sm text-gray-500 mt-1">
								{{ uploadedFiles.operating ? uploadedFiles.operating.name : 'No file selected' }}
							</p>
							<p v-if="accountData.operating" class="text-xs text-green-600 mt-1">
								{{ accountData.operating.totalTransactions }} transactions across
								{{ accountData.operating.monthCount }} months
							</p>
						</div>
						<button
							@click="() => $refs.operatingInput.click()"
							class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
							{{ uploadedFiles.operating ? 'Change File' : 'Choose File' }}
						</button>
					</div>
					<input
						ref="operatingInput"
						type="file"
						accept=".csv,.tsv"
						class="hidden"
						@change="handleFileSelect('operating', $event)" />
				</div>

				<!-- Special Assessment Account -->
				<div
					:class="[
						'border-2 border-dashed rounded-lg p-4 transition-colors',
						uploadedFiles.special ? 'border-green-500 bg-green-50' : 'border-gray-300',
					]"
					@dragover.prevent
					@drop.prevent="handleDrop('special', $event)">
					<div class="flex items-center justify-between">
						<div class="flex-1">
							<h3 class="font-semibold text-gray-900">Special Assessment (5872)</h3>
							<p class="text-sm text-gray-500 mt-1">
								{{ uploadedFiles.special ? uploadedFiles.special.name : 'No file selected' }}
							</p>
							<p v-if="accountData.special" class="text-xs text-green-600 mt-1">
								{{ accountData.special.totalTransactions }} transactions across
								{{ accountData.special.monthCount }} months
							</p>
						</div>
						<button
							@click="() => $refs.specialInput.click()"
							class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
							{{ uploadedFiles.special ? 'Change File' : 'Choose File' }}
						</button>
					</div>
					<input
						ref="specialInput"
						type="file"
						accept=".csv,.tsv"
						class="hidden"
						@change="handleFileSelect('special', $event)" />
				</div>

				<!-- Reserves Account -->
				<div
					:class="[
						'border-2 border-dashed rounded-lg p-4 transition-colors',
						uploadedFiles.reserves ? 'border-green-500 bg-green-50' : 'border-gray-300',
					]"
					@dragover.prevent
					@drop.prevent="handleDrop('reserves', $event)">
					<div class="flex items-center justify-between">
						<div class="flex-1">
							<h3 class="font-semibold text-gray-900">Reserves (7011)</h3>
							<p class="text-sm text-gray-500 mt-1">
								{{ uploadedFiles.reserves ? uploadedFiles.reserves.name : 'No file selected' }}
							</p>
							<p v-if="accountData.reserves" class="text-xs text-green-600 mt-1">
								{{ accountData.reserves.totalTransactions }} transactions across
								{{ accountData.reserves.monthCount }} months
							</p>
						</div>
						<button
							@click="() => $refs.reservesInput.click()"
							class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
							{{ uploadedFiles.reserves ? 'Change File' : 'Choose File' }}
						</button>
					</div>
					<input
						ref="reservesInput"
						type="file"
						accept=".csv,.tsv"
						class="hidden"
						@change="handleFileSelect('reserves', $event)" />
				</div>

				<!-- Parse Button -->
				<div class="flex items-center justify-between pt-4">
					<p class="text-sm text-gray-600">
						{{ uploadedFileCount }} of 3 accounts uploaded
						<span v-if="uploadedFileCount >= 1" class="text-green-600 ml-2">Ready to parse</span>
					</p>
					<button
						@click="parseAllFiles"
						:disabled="uploadedFileCount < 1 || isParsing"
						class="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
						<span v-if="isParsing" class="flex items-center">
							<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
							</svg>
							Parsing CSV Files...
						</span>
						<span v-else>Parse Files &amp; Match Transfers</span>
					</button>
				</div>
			</div>
		</div>

		<!-- Step 2: Monthly Breakdown -->
		<div v-if="matchingComplete" class="bg-white rounded-lg shadow-sm border">
			<div class="border-b px-6 py-4">
				<h2 class="text-xl font-semibold text-gray-900">Step 2: Monthly Breakdown</h2>
				<p class="text-sm text-gray-600 mt-1">
					Balances extracted directly from Chase's running balance column
				</p>
			</div>
			<div class="p-6">
				<!-- Per-account monthly tables -->
				<div v-for="acctKey in ['operating', 'special', 'reserves']" :key="acctKey" class="mb-8">
					<template v-if="accountData[acctKey]">
						<h3 class="text-lg font-semibold text-gray-900 mb-3">
							{{ accountLabels[acctKey] }}
						</h3>
						<div class="overflow-x-auto">
							<table class="w-full text-sm border-collapse">
								<thead>
									<tr class="bg-gray-50 border-b">
										<th class="text-left px-4 py-2 font-medium text-gray-600">Month</th>
										<th class="text-right px-4 py-2 font-medium text-gray-600">Txns</th>
										<th class="text-right px-4 py-2 font-medium text-gray-600">Beginning Balance</th>
										<th class="text-right px-4 py-2 font-medium text-gray-600">Deposits</th>
										<th class="text-right px-4 py-2 font-medium text-gray-600">Withdrawals</th>
										<th class="text-right px-4 py-2 font-medium text-gray-600">Transfers In</th>
										<th class="text-right px-4 py-2 font-medium text-gray-600">Transfers Out</th>
										<th class="text-right px-4 py-2 font-medium text-gray-600">Ending Balance</th>
									</tr>
								</thead>
								<tbody>
									<tr
										v-for="mData in accountData[acctKey].months"
										:key="mData.month"
										class="border-b hover:bg-gray-50">
										<td class="px-4 py-2 font-medium">{{ mData.monthName }}</td>
										<td class="px-4 py-2 text-right">{{ mData.transactions.length }}</td>
										<td class="px-4 py-2 text-right font-mono">${{ fmtNum(mData.beginningBalance) }}</td>
										<td class="px-4 py-2 text-right font-mono text-green-700">
											{{ mData.totalDeposits > 0 ? '+$' + fmtNum(mData.totalDeposits) : '-' }}
										</td>
										<td class="px-4 py-2 text-right font-mono text-red-700">
											{{ mData.totalWithdrawals > 0 ? '-$' + fmtNum(mData.totalWithdrawals) : '-' }}
										</td>
										<td class="px-4 py-2 text-right font-mono text-blue-700">
											{{ mData.totalTransfersIn > 0 ? '+$' + fmtNum(mData.totalTransfersIn) : '-' }}
										</td>
										<td class="px-4 py-2 text-right font-mono text-orange-700">
											{{ mData.totalTransfersOut > 0 ? '-$' + fmtNum(mData.totalTransfersOut) : '-' }}
										</td>
										<td class="px-4 py-2 text-right font-mono font-semibold">${{ fmtNum(mData.endingBalance) }}</td>
									</tr>
								</tbody>
							</table>
						</div>
					</template>
				</div>
			</div>
		</div>

		<!-- Step 3: Transfer Matching Results -->
		<div v-if="matchingComplete" class="bg-white rounded-lg shadow-sm border">
			<div class="border-b px-6 py-4">
				<h2 class="text-xl font-semibold text-gray-900">Step 3: Transfer Matching</h2>
			</div>
			<div class="p-6">
				<!-- Stats -->
				<div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
					<div class="bg-blue-50 p-4 rounded-lg">
						<p class="text-sm text-blue-600">Total Transactions</p>
						<p class="text-2xl font-bold text-blue-900">{{ totalTransactions }}</p>
					</div>
					<div class="bg-green-50 p-4 rounded-lg">
						<p class="text-sm text-green-600">Matched Transfer Pairs</p>
						<p class="text-2xl font-bold text-green-900">{{ transferMatches.matches.length }}</p>
					</div>
					<div class="bg-yellow-50 p-4 rounded-lg">
						<p class="text-sm text-yellow-600">Unmatched Transfers</p>
						<p class="text-2xl font-bold text-yellow-900">{{ transferMatches.unmatched.length }}</p>
					</div>
					<div class="bg-purple-50 p-4 rounded-lg">
						<p class="text-sm text-purple-600">Monthly Statements</p>
						<p class="text-2xl font-bold text-purple-900">{{ totalMonthlyStatements }}</p>
					</div>
				</div>

				<!-- Matched Transfers -->
				<div v-if="transferMatches.matches.length > 0" class="mb-6">
					<h3 class="text-lg font-semibold text-gray-900 mb-3 flex items-center">
						<svg class="w-6 h-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						Matched Transfer Pairs ({{ transferMatches.matches.length }})
					</h3>
					<div class="space-y-3 max-h-96 overflow-y-auto">
						<div
							v-for="(match, idx) in transferMatches.matches"
							:key="idx"
							class="border border-green-200 bg-green-50 rounded-lg p-4">
							<div class="flex items-start justify-between">
								<div class="flex-1">
									<div class="flex items-center space-x-3 mb-3">
										<span class="px-2 py-1 bg-green-600 text-white text-xs rounded font-medium">
											Pair #{{ idx + 1 }}
										</span>
										<span class="text-sm font-medium text-gray-900">{{ match.outTransfer.date }}</span>
										<span class="text-sm font-bold text-green-700">${{ fmtNum(match.outTransfer.amount) }}</span>
									</div>
									<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div class="bg-white p-3 rounded border border-green-200">
											<p class="text-xs text-gray-500 mb-1">Transfer Out</p>
											<p class="font-medium text-sm text-gray-900">
												{{ accountLabels[match.outTransfer.accountType] }}
											</p>
											<p class="text-xs text-gray-600 mt-1 truncate" :title="match.outTransfer.description">
												{{ match.outTransfer.description }}
											</p>
										</div>
										<div class="bg-white p-3 rounded border border-green-200">
											<p class="text-xs text-gray-500 mb-1">Transfer In</p>
											<p class="font-medium text-sm text-gray-900">
												{{ accountLabels[match.inTransfer.accountType] }}
											</p>
											<p class="text-xs text-gray-600 mt-1 truncate" :title="match.inTransfer.description">
												{{ match.inTransfer.description }}
											</p>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Unmatched Transfers -->
				<div v-if="transferMatches.unmatched.length > 0" class="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
					<h3 class="text-yellow-800 font-semibold mb-2 flex items-center">
						<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
						</svg>
						Unmatched Transfers ({{ transferMatches.unmatched.length }})
					</h3>
					<p class="text-yellow-700 text-sm mb-3">
						These transfers don't have matching counterparts and will be flagged for manual review.
					</p>
					<div class="space-y-2 max-h-60 overflow-y-auto">
						<div
							v-for="(transfer, idx) in transferMatches.unmatched"
							:key="idx"
							class="bg-white p-3 rounded border border-yellow-200">
							<div class="flex items-center justify-between">
								<div class="flex-1">
									<p class="text-sm font-medium text-gray-900">
										{{ transfer.date }} | {{ accountLabels[transfer.accountType] }}
										{{ transfer.transaction_type === 'transfer_out' ? '&rarr;' : '&larr;' }}
										Account {{ transfer.targetAccount }}
									</p>
									<p class="text-xs text-gray-600 mt-1">{{ transfer.description }}</p>
								</div>
								<p class="text-sm font-bold text-yellow-700 ml-4">${{ fmtNum(transfer.amount) }}</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Step 4: Import -->
		<div v-if="matchingComplete && !importResults" class="bg-white rounded-lg shadow-sm border">
			<div class="border-b px-6 py-4">
				<h2 class="text-xl font-semibold text-gray-900">Step 4: Import to Directus</h2>
			</div>
			<div class="p-6">
				<!-- Import Summary -->
				<div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
					<h3 class="font-semibold text-blue-900 mb-3">Import Summary</h3>
					<ul class="text-sm text-blue-800 space-y-2">
						<li class="flex items-start">
							<span class="mr-2 mt-0.5 flex-shrink-0">&#8226;</span>
							<span>
								<strong>{{ totalTransactions }}</strong>
								transactions across
								<strong>{{ Object.values(accountData).filter(a => a).length }}</strong>
								accounts
							</span>
						</li>
						<li class="flex items-start">
							<span class="mr-2 mt-0.5 flex-shrink-0">&#8226;</span>
							<span>
								<strong>{{ totalMonthlyStatements }}</strong>
								monthly statements will be created with exact bank balances
							</span>
						</li>
						<li class="flex items-start">
							<span class="mr-2 mt-0.5 flex-shrink-0">&#8226;</span>
							<span>
								<strong>{{ transferMatches.matches.length }}</strong>
								transfer pairs will be automatically linked
							</span>
						</li>
						<li class="flex items-start">
							<span class="mr-2 mt-0.5 flex-shrink-0">&#8226;</span>
							<span>Fiscal year: <strong>{{ selectedFiscalYear }}</strong></span>
						</li>
					</ul>
				</div>

				<!-- Import Button -->
				<button
					@click="importAllData"
					:disabled="isImporting || !selectedFiscalYear"
					class="w-full px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold">
					<span v-if="isImporting" class="flex items-center justify-center">
						<svg class="animate-spin -ml-1 mr-3 h-6 w-6 text-white" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
						</svg>
						Importing... {{ importProgress.current }} / {{ importProgress.total }}
						<span v-if="importProgress.phase" class="ml-2 text-blue-200">({{ importProgress.phase }})</span>
					</span>
					<span v-else>Import All Transactions &amp; Create Monthly Statements</span>
				</button>
			</div>
		</div>

		<!-- Import Results -->
		<div v-if="importResults" class="bg-white rounded-lg shadow-sm border">
			<div class="border-b px-6 py-4">
				<h2 class="text-xl font-semibold text-gray-900">Import Complete</h2>
			</div>
			<div class="p-6">
				<div class="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
					<h3 class="text-green-800 font-semibold flex items-center">
						<svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						Import Successful!
					</h3>
					<ul class="text-green-700 text-sm mt-3 space-y-1">
						<li>{{ importResults.transactionsImported }} transactions imported</li>
						<li>{{ importResults.statementsCreated }} monthly statements created with exact balances</li>
						<li>{{ importResults.transfersLinked }} transfer pairs linked</li>
						<li v-if="importResults.unmatchedTransfers > 0">
							{{ importResults.unmatchedTransfers }} unmatched transfers flagged for review
						</li>
					</ul>
				</div>

				<div v-if="importResults.errors.length > 0" class="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
					<h3 class="text-red-800 font-semibold">Issues Encountered</h3>
					<ul class="text-red-700 text-sm mt-2 space-y-1 max-h-40 overflow-y-auto">
						<li v-for="(error, idx) in importResults.errors" :key="idx">{{ error }}</li>
					</ul>
				</div>

				<!-- Action Buttons -->
				<div class="flex flex-wrap gap-4 mt-6">
					<NuxtLink
						to="/financials"
						class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
						View Dashboard
					</NuxtLink>
					<button
						@click="resetImport"
						class="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
						Import Another Batch
					</button>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
import { parseChaseCSV, groupByMonth, matchTransfers as matchTransfersFn } from '~/composables/useChaseCSV';

definePageMeta({
	layout: 'default',
});

useSeoMeta({
	title: 'Chase CSV Batch Import',
});

// ── Directus config ──
const config = useRuntimeConfig();
const directusUrl = ref(config.public.directusUrl || 'https://admin.1033lenox.com');
const directusToken = ref('');

// ── Account config ──
const accounts = {
	operating: { id: 1, number: '5129', name: 'Operating Account' },
	special: { id: 3, number: '5872', name: 'Special Assessment' },
	reserves: { id: 2, number: '7011', name: 'Reserves' },
};

const accountLabels = {
	operating: 'Operating (5129)',
	special: 'Special Assessment (5872)',
	reserves: 'Reserves (7011)',
};

// ── Reactive state ──
const fiscalYears = ref([]);
const selectedFiscalYear = ref(2025);
const uploadedFiles = ref({ operating: null, special: null, reserves: null });
const accountData = ref({ operating: null, special: null, reserves: null });
const transferMatches = ref({ matches: [], unmatched: [] });
const isParsing = ref(false);
const matchingComplete = ref(false);
const isImporting = ref(false);
const importProgress = ref({ current: 0, total: 0, phase: '' });
const importResults = ref(null);

// Template refs
const operatingInput = ref(null);
const specialInput = ref(null);
const reservesInput = ref(null);

// ── Auth ──
const getAuthHeaders = () => ({
	'Content-Type': 'application/json',
	...(directusToken.value && { Authorization: `Bearer ${directusToken.value}` }),
});

onMounted(async () => {
	try {
		const response = await $fetch('/api/admin/token');
		directusToken.value = response.token;
		if (response.directusUrl) {
			directusUrl.value = response.directusUrl;
		}
	} catch (error) {
		console.error('Failed to get admin token:', error);
	}

	// Fetch fiscal years
	try {
		const res = await $fetch(`${directusUrl.value}/items/fiscal_years?sort=-year&limit=10`, {
			headers: getAuthHeaders(),
		});
		fiscalYears.value = res.data || [];
		if (fiscalYears.value.length > 0) {
			selectedFiscalYear.value = fiscalYears.value[0].year;
		}
	} catch (error) {
		console.error('Failed to fetch fiscal years:', error);
		fiscalYears.value = [{ id: 1, year: 2025 }];
	}
});

// ── Computed ──
const uploadedFileCount = computed(() =>
	Object.values(uploadedFiles.value).filter(f => f !== null).length
);

const totalTransactions = computed(() =>
	Object.values(accountData.value)
		.filter(a => a)
		.reduce((sum, a) => sum + a.totalTransactions, 0)
);

const totalMonthlyStatements = computed(() =>
	Object.values(accountData.value)
		.filter(a => a)
		.reduce((sum, a) => sum + a.monthCount, 0)
);

// ── Helpers ──
const fmtNum = (num) => {
	if (num === null || num === undefined) return '0.00';
	return Number(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// ── File handling ──
const handleDrop = (accountType, event) => {
	const files = event.dataTransfer.files;
	if (files.length > 0) {
		uploadedFiles.value[accountType] = files[0];
	}
};

const handleFileSelect = (accountType, event) => {
	const files = event.target.files;
	if (files.length > 0) {
		uploadedFiles.value[accountType] = files[0];
	}
};

// ── Parse all files ──
const parseAllFiles = async () => {
	if (uploadedFileCount.value < 1) return;
	isParsing.value = true;
	matchingComplete.value = false;

	try {
		const allTransfers = [];

		for (const [acctKey, file] of Object.entries(uploadedFiles.value)) {
			if (!file) {
				accountData.value[acctKey] = null;
				continue;
			}

			const text = await file.text();
			const { transactions } = parseChaseCSV(text);
			const monthGroups = groupByMonth(transactions);

			// Sort months
			const sortedMonths = [...monthGroups.values()].sort((a, b) => a.month.localeCompare(b.month));

			accountData.value[acctKey] = {
				transactions,
				months: sortedMonths,
				monthCount: sortedMonths.length,
				totalTransactions: transactions.length,
			};

			// Collect transfers for cross-account matching
			const accountNumber = accounts[acctKey].number;
			for (const tx of transactions) {
				if (tx.isTransfer) {
					allTransfers.push({
						...tx,
						sourceAccountNumber: accountNumber,
						accountType: acctKey,
					});
				}
			}
		}

		// Match transfers across accounts
		transferMatches.value = matchTransfersFn(allTransfers);
		matchingComplete.value = true;
	} catch (error) {
		console.error('Parse error:', error);
		alert('Error parsing CSV files: ' + error.message);
	} finally {
		isParsing.value = false;
	}
};

// ── Import all data ──
const importAllData = async () => {
	if (!selectedFiscalYear.value) return;
	isImporting.value = true;

	const results = {
		transactionsImported: 0,
		statementsCreated: 0,
		transfersLinked: 0,
		unmatchedTransfers: transferMatches.value.unmatched.length,
		errors: [],
	};

	// Count total work items
	let totalWork = 0;
	for (const acctKey of ['operating', 'special', 'reserves']) {
		const data = accountData.value[acctKey];
		if (!data) continue;
		totalWork += data.totalTransactions; // transactions
		totalWork += data.monthCount; // monthly statements
	}
	totalWork += transferMatches.value.matches.length; // transfer linking
	importProgress.value = { current: 0, total: totalWork, phase: 'Resolving fiscal year' };

	try {
		// Resolve fiscal year ID
		const fyRes = await $fetch(
			`${directusUrl.value}/items/fiscal_years?filter[year][_eq]=${selectedFiscalYear.value}&limit=1`,
			{ headers: getAuthHeaders() }
		);
		const fiscalYearId = fyRes.data?.[0]?.id;
		if (!fiscalYearId) {
			throw new Error(`No fiscal_years record found for year ${selectedFiscalYear.value}`);
		}

		// Generate a unique batch ID for this import
		const batchId = `chase-csv-${selectedFiscalYear.value}-${Date.now()}`;

		// Track transaction IDs for transfer linking
		// Key: "accountType-csvIndex" → Directus transaction ID
		const transactionIdMap = new Map();

		// ── Phase 1: Import transactions per account ──
		for (const acctKey of ['operating', 'special', 'reserves']) {
			const data = accountData.value[acctKey];
			if (!data) continue;

			const account = accounts[acctKey];
			importProgress.value.phase = `Importing ${accountLabels[acctKey]}`;

			for (const tx of data.transactions) {
				try {
					const transactionData = {
						fiscal_year: fiscalYearId,
						account_id: account.id,
						transaction_date: tx.date,
						description: tx.description || '',
						vendor: tx.vendor || null,
						amount: tx.amount,
						transaction_type: tx.transaction_type,
						statement_month: tx.statement_month,
						status: 'published',
						import_batch_id: batchId,
						csv_source_line: tx.csvIndex,
						original_csv_data: {
							chase_details: tx.chase_details,
							chase_type: tx.chase_type,
							balance: tx.balance,
							check_number: tx.check_number,
							signed_amount: tx.signedAmount,
						},
					};

					if (tx.check_number) {
						transactionData.check_number = tx.check_number;
					}

					const response = await fetch(`${directusUrl.value}/items/transactions`, {
						method: 'POST',
						headers: getAuthHeaders(),
						body: JSON.stringify(transactionData),
					});

					if (!response.ok) {
						const errBody = await response.text();
						throw new Error(`HTTP ${response.status}: ${errBody.slice(0, 200)}`);
					}

					const responseData = await response.json();
					const newId = responseData.data.id;

					// Store mapping for transfer linking
					transactionIdMap.set(`${acctKey}-${tx.csvIndex}`, newId);
					results.transactionsImported++;
				} catch (error) {
					results.errors.push(`${accountLabels[acctKey]}: ${error.message}`);
				}

				importProgress.value.current++;
			}
		}

		// ── Phase 2: Create monthly statements with exact balances ──
		importProgress.value.phase = 'Creating monthly statements';

		for (const acctKey of ['operating', 'special', 'reserves']) {
			const data = accountData.value[acctKey];
			if (!data) continue;

			const account = accounts[acctKey];

			for (const monthData of data.months) {
				try {
					const statementData = {
						account_id: account.id,
						fiscal_year: fiscalYearId,
						statement_month: monthData.month,
						beginning_balance: monthData.beginningBalance,
						ending_balance: monthData.endingBalance,
						status: 'published',
					};

					const response = await fetch(`${directusUrl.value}/items/monthly_statements`, {
						method: 'POST',
						headers: getAuthHeaders(),
						body: JSON.stringify(statementData),
					});

					if (!response.ok) {
						// May already exist — try PATCH instead
						const existingRes = await fetch(
							`${directusUrl.value}/items/monthly_statements?filter[account_id][_eq]=${account.id}&filter[fiscal_year][_eq]=${fiscalYearId}&filter[statement_month][_eq]=${monthData.month}&limit=1`,
							{ headers: getAuthHeaders() }
						);
						const existingData = await existingRes.json();

						if (existingData.data?.[0]) {
							await fetch(`${directusUrl.value}/items/monthly_statements/${existingData.data[0].id}`, {
								method: 'PATCH',
								headers: getAuthHeaders(),
								body: JSON.stringify({
									beginning_balance: monthData.beginningBalance,
									ending_balance: monthData.endingBalance,
								}),
							});
							results.statementsCreated++;
						} else {
							results.errors.push(
								`Statement ${accountLabels[acctKey]} ${monthData.monthName}: creation failed`
							);
						}
					} else {
						results.statementsCreated++;
					}
				} catch (error) {
					results.errors.push(`Statement ${accountLabels[acctKey]} ${monthData.monthName}: ${error.message}`);
				}

				importProgress.value.current++;
			}
		}

		// ── Phase 3: Link transfers ──
		importProgress.value.phase = 'Linking transfers';

		for (const match of transferMatches.value.matches) {
			try {
				const outKey = `${match.outTransfer.accountType}-${match.outTransfer.csvIndex}`;
				const inKey = `${match.inTransfer.accountType}-${match.inTransfer.csvIndex}`;
				const outId = transactionIdMap.get(outKey);
				const inId = transactionIdMap.get(inKey);

				if (outId && inId) {
					await Promise.all([
						fetch(`${directusUrl.value}/items/transactions/${outId}`, {
							method: 'PATCH',
							headers: getAuthHeaders(),
							body: JSON.stringify({ linked_transfer_id: inId }),
						}),
						fetch(`${directusUrl.value}/items/transactions/${inId}`, {
							method: 'PATCH',
							headers: getAuthHeaders(),
							body: JSON.stringify({ linked_transfer_id: outId }),
						}),
					]);
					results.transfersLinked++;
				}
			} catch (error) {
				results.errors.push(`Transfer linking: ${error.message}`);
			}

			importProgress.value.current++;
		}

		importResults.value = results;
	} catch (error) {
		console.error('Import error:', error);
		alert('Import failed: ' + error.message);
	} finally {
		isImporting.value = false;
	}
};

// ── Reset ──
const resetImport = () => {
	uploadedFiles.value = { operating: null, special: null, reserves: null };
	accountData.value = { operating: null, special: null, reserves: null };
	transferMatches.value = { matches: [], unmatched: [] };
	matchingComplete.value = false;
	importResults.value = null;
	importProgress.value = { current: 0, total: 0, phase: '' };
};
</script>
