<template>
	<div class="max-w-7xl mx-auto p-6 space-y-8">
		<!-- Header -->
		<div class="bg-white rounded-lg shadow-sm border p-6">
			<h1 class="text-3xl font-bold text-gray-900 mb-2">Multi-Account CSV Import</h1>
			<p class="text-gray-600">
				Import bank statements for multiple accounts and automatically link inter-account transfers
			</p>
		</div>

		<!-- Step 1: File Upload -->
		<div class="bg-white rounded-lg shadow-sm border">
			<div class="border-b px-6 py-4">
				<h2 class="text-xl font-semibold text-gray-900">Step 1: Upload CSV Files</h2>
				<p class="text-sm text-gray-600 mt-1">Upload statements for all accounts from the same month</p>
			</div>
			<div class="p-6 space-y-4">
				<!-- Operating Account -->
				<div
					:class="[
						'border-2 border-dashed rounded-lg p-4 transition-colors',
						uploadedFiles.operating ? 'border-green-500 bg-green-50' : 'border-gray-300',
					]"
					@dragover.prevent="handleDragOver('operating')"
					@dragleave.prevent="handleDragLeave('operating')"
					@drop.prevent="handleDrop('operating', $event)">
					<div class="flex items-center justify-between">
						<div class="flex-1">
							<h3 class="font-semibold text-gray-900">Operating Account (5129)</h3>
							<p class="text-sm text-gray-500 mt-1">
								{{ uploadedFiles.operating ? uploadedFiles.operating.name : 'No file selected' }}
							</p>
							<p v-if="uploadedFiles.operating" class="text-xs text-green-600 mt-1">
								{{ parsedFiles.operating.length }} transactions parsed
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
						accept=".csv"
						class="hidden"
						@change="handleFileSelect('operating', $event)" />
				</div>

				<!-- Special Assessment Account -->
				<div
					:class="[
						'border-2 border-dashed rounded-lg p-4 transition-colors',
						uploadedFiles.special ? 'border-green-500 bg-green-50' : 'border-gray-300',
					]"
					@dragover.prevent="handleDragOver('special')"
					@dragleave.prevent="handleDragLeave('special')"
					@drop.prevent="handleDrop('special', $event)">
					<div class="flex items-center justify-between">
						<div class="flex-1">
							<h3 class="font-semibold text-gray-900">Special Assessment (5872)</h3>
							<p class="text-sm text-gray-500 mt-1">
								{{ uploadedFiles.special ? uploadedFiles.special.name : 'No file selected' }}
							</p>
							<p v-if="uploadedFiles.special" class="text-xs text-green-600 mt-1">
								{{ parsedFiles.special.length }} transactions parsed
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
						accept=".csv"
						class="hidden"
						@change="handleFileSelect('special', $event)" />
				</div>

				<!-- Reserves Account -->
				<div
					:class="[
						'border-2 border-dashed rounded-lg p-4 transition-colors',
						uploadedFiles.reserves ? 'border-green-500 bg-green-50' : 'border-gray-300',
					]"
					@dragover.prevent="handleDragOver('reserves')"
					@dragleave.prevent="handleDragLeave('reserves')"
					@drop.prevent="handleDrop('reserves', $event)">
					<div class="flex items-center justify-between">
						<div class="flex-1">
							<h3 class="font-semibold text-gray-900">Reserves (7011)</h3>
							<p class="text-sm text-gray-500 mt-1">
								{{ uploadedFiles.reserves ? uploadedFiles.reserves.name : 'No file selected' }}
							</p>
							<p v-if="uploadedFiles.reserves" class="text-xs text-green-600 mt-1">
								{{ parsedFiles.reserves.length }} transactions parsed
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
						accept=".csv"
						class="hidden"
						@change="handleFileSelect('reserves', $event)" />
				</div>

				<!-- Parse Button -->
				<div class="flex items-center justify-between pt-4">
					<p class="text-sm text-gray-600">
						{{ uploadedFileCount }} of 3 accounts uploaded
						<span v-if="uploadedFileCount >= 2" class="text-green-600 ml-2">✓ Ready to parse</span>
					</p>
					<button
						@click="parseAllFiles"
						:disabled="uploadedFileCount < 2 || isParsing"
						class="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
						<span v-if="isParsing" class="flex items-center">
							<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								<path
									class="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
							Parsing CSV Files...
						</span>
						<span v-else>Parse Files & Match Transfers</span>
					</button>
				</div>
			</div>
		</div>

		<!-- Step 2: Transfer Matching Results -->
		<div v-if="matchingComplete" class="bg-white rounded-lg shadow-sm border">
			<div class="border-b px-6 py-4">
				<h2 class="text-xl font-semibold text-gray-900">Step 2: Transfer Matching Results</h2>
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
						<p class="text-sm text-purple-600">Regular Transactions</p>
						<p class="text-2xl font-bold text-purple-900">{{ regularTransactions }}</p>
					</div>
				</div>

				<!-- Matched Transfers -->
				<div v-if="transferMatches.matches.length > 0" class="mb-6">
					<h3 class="text-lg font-semibold text-gray-900 mb-3 flex items-center">
						<svg class="w-6 h-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
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
										<span class="text-sm font-bold text-green-700">${{ match.outTransfer.amount.toFixed(2) }}</span>
									</div>
									<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div class="bg-white p-3 rounded border border-green-200">
											<p class="text-xs text-gray-500 mb-1">Transfer Out</p>
											<p class="font-medium text-sm text-gray-900">
												{{ accountNames[match.outTransfer.accountType] }}
											</p>
											<p class="text-xs text-gray-600 mt-1 truncate" :title="match.outTransfer.description">
												{{ match.outTransfer.description }}
											</p>
										</div>
										<div class="bg-white p-3 rounded border border-green-200">
											<p class="text-xs text-gray-500 mb-1">Transfer In</p>
											<p class="font-medium text-sm text-gray-900">
												{{ accountNames[match.inTransfer.accountType] }}
											</p>
											<p class="text-xs text-gray-600 mt-1 truncate" :title="match.inTransfer.description">
												{{ match.inTransfer.description }}
											</p>
										</div>
									</div>
								</div>
								<div class="ml-4">
									<svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M13 10V3L4 14h7v7l9-11h-7z"></path>
									</svg>
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Unmatched Transfers -->
				<div v-if="transferMatches.unmatched.length > 0" class="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
					<h3 class="text-yellow-800 font-semibold mb-2 flex items-center">
						<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
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
										{{ transfer.date }} | {{ accountNames[transfer.accountType] }}
										{{ transfer.direction === 'out' ? '→' : '←' }} Account {{ transfer.targetAccount }}
									</p>
									<p class="text-xs text-gray-600 mt-1">{{ transfer.description }}</p>
								</div>
								<p class="text-sm font-bold text-yellow-700 ml-4">${{ transfer.amount.toFixed(2) }}</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Step 3: Import Configuration -->
		<div v-if="matchingComplete" class="bg-white rounded-lg shadow-sm border">
			<div class="border-b px-6 py-4">
				<h2 class="text-xl font-semibold text-gray-900">Step 3: Configure Import</h2>
			</div>
			<div class="p-6">
				<div class="grid grid-cols-2 gap-4 mb-6">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">Fiscal Year</label>
						<select v-model="selectedFiscalYear" class="w-full border rounded-lg px-3 py-2">
							<option value="2025">2025</option>
							<option value="2024">2024</option>
							<option value="2026">2026</option>
						</select>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">Statement Month</label>
						<select v-model="selectedMonth" class="w-full border rounded-lg px-3 py-2">
							<option value="01">January</option>
							<option value="02">February</option>
							<option value="03">March</option>
							<option value="04">April</option>
							<option value="05">May</option>
							<option value="06">June</option>
							<option value="07">July</option>
							<option value="08">August</option>
							<option value="09">September</option>
							<option value="10">October</option>
							<option value="11">November</option>
							<option value="12">December</option>
						</select>
					</div>
				</div>

				<!-- Import Summary -->
				<div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
					<h3 class="font-semibold text-blue-900 mb-3">Import Summary</h3>
					<ul class="text-sm text-blue-800 space-y-2">
						<li class="flex items-start">
							<svg class="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
							</svg>
							<span>
								<strong>{{ totalTransactions }}</strong>
								total transactions will be imported across all accounts
							</span>
						</li>
						<li class="flex items-start">
							<svg
								class="w-5 h-5 mr-2 mt-0.5 flex-shrink-0 text-green-600"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M13 10V3L4 14h7v7l9-11h-7z"></path>
							</svg>
							<span>
								<strong>{{ transferMatches.matches.length }}</strong>
								transfer pairs will be automatically linked
							</span>
						</li>
						<li v-if="transferMatches.unmatched.length > 0" class="flex items-start">
							<svg
								class="w-5 h-5 mr-2 mt-0.5 flex-shrink-0 text-yellow-600"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
							</svg>
							<span>
								<strong>{{ transferMatches.unmatched.length }}</strong>
								unmatched transfers will be flagged for manual review
							</span>
						</li>
					</ul>
				</div>

				<!-- Import Button -->
				<button
					@click="importAllData"
					:disabled="isImporting || !selectedFiscalYear || !selectedMonth"
					class="w-full px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold">
					<span v-if="isImporting" class="flex items-center justify-center">
						<svg class="animate-spin -ml-1 mr-3 h-6 w-6 text-white" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path
								class="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
						Importing... ({{ importProgress.current }} / {{ importProgress.total }})
					</span>
					<span v-else>Import All Transactions to Directus</span>
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
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
						</svg>
						Import Successful!
					</h3>
					<ul class="text-green-700 text-sm mt-3 space-y-1">
						<li>• {{ importResults.imported }} transactions imported successfully</li>
						<li>• {{ importResults.linked }} transfer pairs automatically linked</li>
						<li v-if="importResults.unmatched > 0">
							• {{ importResults.unmatched }} unmatched transfers flagged for review
						</li>
					</ul>
				</div>

				<div v-if="importResults.errors.length > 0" class="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
					<h3 class="text-red-800 font-semibold">⚠️ Issues Encountered</h3>
					<ul class="text-red-700 text-sm mt-2 space-y-1">
						<li v-for="(error, idx) in importResults.errors" :key="idx">• {{ error }}</li>
					</ul>
				</div>

				<!-- Action Buttons -->
				<div class="flex flex-wrap gap-4 mt-6">
					<NuxtLink
						to="/financials"
						class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
						<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
						</svg>
						View Dashboard
					</NuxtLink>
					<button
						@click="resetImport"
						class="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
						<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
						</svg>
						Import Another Month
					</button>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
// Remove this line:
// import Papa from 'papaparse';

definePageMeta({
	layout: 'default',
});

// Directus configuration
const config = useRuntimeConfig();
const directusUrl = ref(config.public.directusUrl || 'https://admin.1033lenox.com');
const directusToken = ref('');
const tokenLoading = ref(true);
const tokenError = ref('');

// Fetch admin token on mount
onMounted(async () => {
	try {
		const response = await $fetch('/api/admin/token');
		directusToken.value = response.token;
		if (response.directusUrl) {
			directusUrl.value = response.directusUrl;
		}
	} catch (error) {
		console.error('Failed to get admin token:', error);
		tokenError.value = 'Failed to authenticate. Admin access required.';
	} finally {
		tokenLoading.value = false;
	}
});

// Authentication headers
const getAuthHeaders = () => ({
	'Content-Type': 'application/json',
	...(directusToken.value && {Authorization: `Bearer ${directusToken.value}`}),
});

// Native CSV parser - no external dependencies
const parseCSV = (csvText) => {
	const lines = csvText.split('\n').filter((line) => line.trim());
	if (lines.length === 0) return {data: [], meta: {fields: []}};

	const parseLine = (line) => {
		const result = [];
		let current = '';
		let inQuotes = false;

		for (let i = 0; i < line.length; i++) {
			const char = line[i];
			const nextChar = line[i + 1];

			if (char === '"') {
				if (inQuotes && nextChar === '"') {
					current += '"';
					i++;
				} else {
					inQuotes = !inQuotes;
				}
			} else if (char === ',' && !inQuotes) {
				result.push(current.trim());
				current = '';
			} else {
				current += char;
			}
		}
		result.push(current.trim());
		return result;
	};

	const headers = parseLine(lines[0]);
	const data = [];

	for (let i = 1; i < lines.length; i++) {
		const values = parseLine(lines[i]);
		if (values.length >= headers.length) {
			const row = {};
			headers.forEach((header, index) => {
				let value = values[index];

				// Dynamic typing
				if (value && !isNaN(value) && value !== '') {
					const num = parseFloat(value);
					if (!isNaN(num)) {
						value = num;
					}
				}

				row[header] = value;
			});
			data.push(row);
		}
	}

	return {data, meta: {fields: headers}};
};

// Reactive state
const uploadedFiles = ref({
	operating: null,
	special: null,
	reserves: null,
});

const parsedFiles = ref({
	operating: [],
	special: [],
	reserves: [],
});

const transferMatches = ref({
	matches: [],
	unmatched: [],
});

const accounts = {
	operating: {id: 1, number: '5129', name: 'Operating Account'},
	special: {id: 3, number: '5872', name: 'Special Assessment'},
	reserves: {id: 2, number: '7011', name: 'Reserves'},
};

const accountNames = {
	operating: 'Operating (5129)',
	special: 'Special Assessment (5872)',
	reserves: 'Reserves (7011)',
};

const isParsing = ref(false);
const matchingComplete = ref(false);
const isImporting = ref(false);
const selectedFiscalYear = ref(2025);
const selectedMonth = ref('01');
const importProgress = ref({current: 0, total: 0});
const importResults = ref(null);

// Template refs
const operatingInput = ref(null);
const specialInput = ref(null);
const reservesInput = ref(null);

// Computed
const uploadedFileCount = computed(() => {
	return Object.values(uploadedFiles.value).filter((f) => f !== null).length;
});

const totalTransactions = computed(() => {
	return Object.values(parsedFiles.value).reduce((sum, data) => sum + data.length, 0);
});

const regularTransactions = computed(() => {
	const allTransfers = [
		...transferMatches.value.matches.flatMap((m) => [m.outTransfer, m.inTransfer]),
		...transferMatches.value.unmatched,
	];
	return totalTransactions.value - allTransfers.length;
});

// Helper functions
const extractAccountNumber = (description) => {
	if (!description) return null;
	const patterns = [/\.{3}(\d{4})/, /Chk ?(\d{4})/, /Mma \.{3}(\d{4})/, /Account (\d{4})/, /(\d{4})$/];

	for (const pattern of patterns) {
		const match = description.match(pattern);
		if (match) return match[1];
	}
	return null;
};

const isTransfer = (description) => {
	if (!description) return false;
	const desc = description.toLowerCase();
	return desc.includes('online transfer') || desc.includes('transfer from') || desc.includes('transfer to');
};

const extractTransfers = (data, sourceAccount, accountType) => {
	return data
		.filter((row) => row.Date && isTransfer(row.Description))
		.map((row, index) => ({
			csvIndex: index,
			date: row.Date,
			type: row.Type,
			description: row.Description,
			amount: Math.abs(parseFloat(row.Amount || 0)),
			targetAccount: extractAccountNumber(row.Description),
			direction: row.Type === 'WITHDRAWAL' ? 'out' : 'in',
			sourceAccount,
			accountType,
			originalRow: row,
		}));
};

const matchTransfers = (allTransfers) => {
	const matches = [];
	const used = new Set();

	for (let i = 0; i < allTransfers.length; i++) {
		if (used.has(i)) continue;

		const transfer1 = allTransfers[i];

		for (let j = i + 1; j < allTransfers.length; j++) {
			if (used.has(j)) continue;

			const transfer2 = allTransfers[j];

			const oppositeDirection =
				(transfer1.direction === 'out' && transfer2.direction === 'in') ||
				(transfer1.direction === 'in' && transfer2.direction === 'out');

			if (!oppositeDirection) continue;

			const amountMatch = Math.abs(transfer1.amount - transfer2.amount) < 0.01;
			if (!amountMatch) continue;

			const dateMatch = transfer1.date === transfer2.date;
			if (!dateMatch) continue;

			const accountsMatch =
				transfer1.targetAccount === transfer2.sourceAccount && transfer2.targetAccount === transfer1.sourceAccount;

			if (accountsMatch) {
				const outTransfer = transfer1.direction === 'out' ? transfer1 : transfer2;
				const inTransfer = transfer1.direction === 'in' ? transfer1 : transfer2;

				matches.push({
					outTransfer,
					inTransfer,
					matchQuality: 'perfect',
				});
				used.add(i);
				used.add(j);
				break;
			}
		}
	}

	const unmatched = allTransfers.filter((_, idx) => !used.has(idx));

	return {matches, unmatched};
};

const formatDate = (dateStr, year) => {
	const parts = dateStr.split('/');
	if (parts.length === 2) {
		const month = parts[0].padStart(2, '0');
		const day = parts[1].padStart(2, '0');
		return `${year}-${month}-${day}`;
	}
	return dateStr;
};

// File handling
const handleDragOver = (accountType) => {
	// Visual feedback for drag over
};

const handleDragLeave = (accountType) => {
	// Visual feedback for drag leave
};

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

// Parse all files
const parseAllFiles = async () => {
	if (uploadedFileCount.value < 2) return;

	isParsing.value = true;
	matchingComplete.value = false;

	try {
		for (const [accountType, file] of Object.entries(uploadedFiles.value)) {
			if (!file) continue;

			const text = await file.text();
			const parsed = parseCSV(text);

			parsedFiles.value[accountType] = parsed.data.filter(
				(row) => row.Type && ['DEPOSIT', 'WITHDRAWAL', 'FEE'].includes(row.Type)
			);
		}

		const allTransfers = [];
		for (const [accountType, data] of Object.entries(parsedFiles.value)) {
			if (data.length === 0) continue;
			const accountNumber = accounts[accountType].number;
			const transfers = extractTransfers(data, accountNumber, accountType);
			allTransfers.push(...transfers);
		}

		transferMatches.value = matchTransfers(allTransfers);
		matchingComplete.value = true;
	} catch (error) {
		console.error('Parse error:', error);
		alert('Error parsing CSV files: ' + error.message);
	} finally {
		isParsing.value = false;
	}
};

// Import all data
const importAllData = async () => {
	if (!selectedFiscalYear.value || !selectedMonth.value) return;

	isImporting.value = true;
	importProgress.value = {current: 0, total: totalTransactions.value};

	const results = {
		imported: 0,
		linked: 0,
		unmatched: transferMatches.value.unmatched.length,
		errors: [],
	};

	try {
		const transactionIdMap = new Map();

		for (const [accountType, data] of Object.entries(parsedFiles.value)) {
			if (data.length === 0) continue;

			const account = accounts[accountType];

			for (let i = 0; i < data.length; i++) {
				const row = data[i];
				const key = `${account.number}-${i}`;

				try {
					const isTransferTx = isTransfer(row.Description);

					const transactionData = {
						fiscal_year: selectedFiscalYear.value,
						account_id: account.id,
						transaction_date: formatDate(row.Date, selectedFiscalYear.value),
						description: row.Description || '',
						vendor: row.Vendor || null,
						amount: Math.abs(parseFloat(row.Amount || 0)),
						transaction_type: isTransferTx
							? row.Type === 'WITHDRAWAL'
								? 'transfer_out'
								: 'transfer_in'
							: row.Type.toLowerCase(),
						statement_month: selectedMonth.value,
						status: 'published',
					};

					const response = await fetch(`${directusUrl.value}/items/transactions`, {
						method: 'POST',
						headers: getAuthHeaders(),
						body: JSON.stringify(transactionData),
					});

					if (!response.ok) {
						throw new Error(`HTTP ${response.status}`);
					}

					const responseData = await response.json();
					const newId = responseData.data.id;

					transactionIdMap.set(key, newId);
					results.imported++;
					importProgress.value.current++;
				} catch (error) {
					console.error('Error importing transaction:', error);
					results.errors.push(`${accountNames[accountType]} transaction import failed`);
				}
			}
		}

		for (const match of transferMatches.value.matches) {
			try {
				const outKey = `${match.outTransfer.sourceAccount}-${match.outTransfer.csvIndex}`;
				const inKey = `${match.inTransfer.sourceAccount}-${match.inTransfer.csvIndex}`;

				const outId = transactionIdMap.get(outKey);
				const inId = transactionIdMap.get(inKey);

				if (outId && inId) {
					await Promise.all([
						fetch(`${directusUrl.value}/items/transactions/${outId}`, {
							method: 'PATCH',
							headers: getAuthHeaders(),
							body: JSON.stringify({linked_transfer_id: inId}),
						}),
						fetch(`${directusUrl.value}/items/transactions/${inId}`, {
							method: 'PATCH',
							headers: getAuthHeaders(),
							body: JSON.stringify({linked_transfer_id: outId}),
						}),
					]);

					results.linked++;
				}
			} catch (error) {
				console.error('Error linking transfers:', error);
				results.errors.push('Transfer linking failed for one pair');
			}
		}

		importResults.value = results;
	} catch (error) {
		console.error('Import error:', error);
		alert('Import failed: ' + error.message);
	} finally {
		isImporting.value = false;
	}
};

// Reset for new import
const resetImport = () => {
	uploadedFiles.value = {
		operating: null,
		special: null,
		reserves: null,
	};
	parsedFiles.value = {
		operating: [],
		special: [],
		reserves: [],
	};
	transferMatches.value = {
		matches: [],
		unmatched: [],
	};
	matchingComplete.value = false;
	importResults.value = null;
};
</script>
