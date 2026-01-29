<template>
	<div class="max-w-6xl mx-auto p-6 space-y-8">
		<!-- Header -->
		<div class="bg-white rounded-lg shadow-sm border p-6">
			<h1 class="text-3xl font-bold text-gray-900 mb-2">Enhanced CSV Import with Debug</h1>
			<p class="text-gray-600">Import bank statement CSV files with intelligent vendor and budget item matching</p>
		</div>

		<!-- Debug Controls -->
		<div class="bg-yellow-50 rounded-lg shadow-sm border border-yellow-200 p-4">
			<h2 class="text-lg font-semibold text-yellow-800 mb-3">Debug Controls</h2>
			<div class="flex flex-wrap gap-3">
				<button @click="debugCSVData" class="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700">
					Debug CSV Data
				</button>
				<button @click="debugBudgetCategories" class="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700">
					Debug Budget Categories
				</button>
				<button @click="testCategoryMapping" class="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700">
					Test Category Mapping
				</button>
				<button @click="testSingleTransactionImport" class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
					Test Single Transaction Import
				</button>
			</div>
			<p class="text-sm text-yellow-700 mt-2">
				Use these buttons to debug category matching issues. Check browser console for detailed output.
			</p>
		</div>

		<!-- Step 1: File Upload -->
		<div class="bg-white rounded-lg shadow-sm border">
			<div class="border-b px-6 py-4">
				<h2 class="text-xl font-semibold text-gray-900">Step 1: Upload CSV File</h2>
			</div>
			<div class="p-6">
				<div
					class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors"
					:class="{'border-blue-500 bg-blue-50': isDragging}"
					@dragover.prevent="isDragging = true"
					@dragleave.prevent="isDragging = false"
					@drop.prevent="handleFileDrop">
					<input ref="fileInput" type="file" accept=".csv" @change="handleFileSelect" class="hidden" />

					<div v-if="!csvFile">
						<svg class="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
						</svg>
						<p class="text-lg text-gray-600 mb-2">Drop your CSV file here or click to browse</p>
						<p class="text-sm text-gray-500 mb-4">Supports Chase bank statement exports</p>
						<button
							@click="$refs.fileInput.click()"
							class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
							Choose File
						</button>
					</div>

					<div v-else class="text-green-600">
						<svg class="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
						</svg>
						<p class="text-lg font-semibold">{{ csvFile.name }}</p>
						<p class="text-sm text-gray-500">{{ (csvFile.size / 1024).toFixed(1) }} KB</p>
						<button @click="clearFile" class="mt-2 text-red-600 hover:text-red-800 text-sm">Remove file</button>
					</div>
				</div>

				<!-- Parse Button -->
				<div v-if="csvFile" class="mt-4 text-center">
					<button
						@click="parseCSV"
						:disabled="isLoading"
						class="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
						<span v-if="isLoading" class="flex items-center">
							<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								<path
									class="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
							Parsing CSV...
						</span>
						<span v-else>Parse CSV Data</span>
					</button>
				</div>
			</div>
		</div>

		<!-- Step 2: Preview & Mapping -->
		<div v-if="parsedData.length > 0" class="bg-white rounded-lg shadow-sm border">
			<div class="border-b px-6 py-4">
				<h2 class="text-xl font-semibold text-gray-900">Step 2: Preview & Configure Import</h2>
				<div class="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">Account</label>
						<select v-model="selectedAccount" class="w-full border rounded-lg px-3 py-2 text-sm">
							<option value="">Select Account</option>
							<option v-for="account in accounts" :key="account.id" :value="account">
								{{ account.account_name }} ({{ account.account_number }})
							</option>
						</select>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">Fiscal Year</label>
						<select v-model="selectedFiscalYear" class="w-full border rounded-lg px-3 py-2 text-sm">
							<option v-for="year in fiscalYearOptions" :key="year.value" :value="year.value">
								{{ year.label }}
							</option>
						</select>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">Statement Month</label>
						<select v-model="selectedMonth" class="w-full border rounded-lg px-3 py-2 text-sm">
							<option value="">Auto-detect from CSV</option>
							<option v-for="month in monthOptions" :key="month.value" :value="month.value">
								{{ month.label }}
							</option>
						</select>
					</div>
				</div>

				<div class="mt-2 text-right">
					<span class="text-sm text-gray-600">{{ parsedData.length }} rows found</span>
				</div>
			</div>

			<div class="p-6">
				<!-- Account Info -->
				<div v-if="selectedAccount" class="mb-6 p-4 bg-blue-50 rounded-lg">
					<h3 class="font-semibold text-blue-900">Import Target</h3>
					<p class="text-blue-800">{{ selectedAccount.account_name }} - Chase {{ selectedAccount.account_number }}</p>
					<p class="text-sm text-blue-600">{{ selectedAccount.description }}</p>
				</div>

				<!-- Enhanced Data Summary -->
				<div class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
					<div class="bg-gray-50 p-4 rounded-lg">
						<p class="text-sm text-gray-600">Total Transactions</p>
						<p class="text-2xl font-bold text-gray-900">{{ transactionData.length }}</p>
					</div>
					<div class="bg-green-50 p-4 rounded-lg">
						<p class="text-sm text-green-600">Deposits</p>
						<p class="text-2xl font-bold text-green-700">${{ totalDeposits.toLocaleString() }}</p>
					</div>
					<div class="bg-red-50 p-4 rounded-lg">
						<p class="text-sm text-red-600">Withdrawals</p>
						<p class="text-2xl font-bold text-red-700">${{ totalWithdrawals.toLocaleString() }}</p>
					</div>
					<div class="bg-blue-50 p-4 rounded-lg">
						<p class="text-sm text-blue-600">Vendors Found</p>
						<p class="text-2xl font-bold text-blue-700">{{ vendorMatchCount }}</p>
						<p class="text-xs text-blue-500">{{ Math.round(vendorMatchPercent) }}% matched</p>
					</div>
					<div class="bg-yellow-50 p-4 rounded-lg">
						<p class="text-sm text-yellow-600">Violations Detected</p>
						<p class="text-2xl font-bold text-yellow-700">{{ violationCount }}</p>
					</div>
				</div>

				<!-- Matching Preview -->
				<div class="mb-6 p-4 bg-indigo-50 rounded-lg">
					<h3 class="font-semibold text-indigo-900 mb-2">Smart Matching Preview</h3>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
						<div>
							<p class="font-medium text-indigo-800">Budget Categories Detected:</p>
							<div class="flex flex-wrap gap-2 mt-1">
								<span
									v-for="category in uniqueCategories"
									:key="category"
									class="px-2 py-1 bg-white rounded text-indigo-700 border">
									{{ category }}
								</span>
							</div>
						</div>
						<div>
							<p class="font-medium text-indigo-800">Top Vendors to Match:</p>
							<div class="space-y-1 mt-1">
								<div v-for="vendor in topVendors.slice(0, 5)" :key="vendor.name" class="flex justify-between">
									<span class="text-indigo-700">{{ vendor.name }}</span>
									<span class="text-indigo-600">({{ vendor.count }})</span>
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Enhanced Preview Table -->
				<div class="overflow-x-auto">
					<table class="min-w-full divide-y divide-gray-200">
						<thead class="bg-gray-50">
							<tr>
								<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
								<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
								<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Description
								</th>
								<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
								<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
								<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
								<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Budget Item
								</th>
								<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
							</tr>
						</thead>
						<tbody class="bg-white divide-y divide-gray-200">
							<tr v-for="(transaction, index) in transactionData.slice(0, 20)" :key="index">
								<td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
									{{ formatDate(transaction.Date) }}
								</td>
								<td class="px-4 py-4 whitespace-nowrap">
									<span
										class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
										:class="getTypeClass(transaction.Type)">
										{{ transaction.Type }}
									</span>
								</td>
								<td class="px-4 py-4 text-sm text-gray-900 max-w-xs truncate" :title="transaction.Description">
									{{ transaction.Description }}
								</td>
								<td class="px-4 py-4 whitespace-nowrap text-sm">
									<div v-if="getVendorMatch(transaction.Vendor)" class="text-green-600">
										<span class="font-medium">{{ getVendorMatch(transaction.Vendor).title }}</span>
										<span class="text-xs text-gray-500 block">Matched via keywords</span>
									</div>
									<div v-else class="text-gray-600">
										{{ transaction.Vendor || '-' }}
										<span class="text-xs text-orange-500 block">Will auto-create</span>
									</div>
								</td>
								<td
									class="px-4 py-4 whitespace-nowrap text-sm font-mono"
									:class="transaction.Type === 'DEPOSIT' ? 'text-green-600' : 'text-red-600'">
									${{ parseFloat(transaction.Amount).toLocaleString() }}
								</td>
								<td class="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
									{{ mapCategory(transaction.Category) }}
								</td>
								<td class="px-4 py-4 whitespace-nowrap text-sm">
									<div v-if="getBudgetItemMatch(transaction)" class="text-blue-600">
										<span class="font-medium text-xs">{{ getBudgetItemMatch(transaction).description }}</span>
									</div>
									<div v-else class="text-gray-500 text-xs">No specific match</div>
								</td>
								<td class="px-4 py-4 whitespace-nowrap">
									<span
										v-if="detectViolation(transaction).isViolation"
										class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
										:class="getViolationClass(detectViolation(transaction).severity)">
										{{ detectViolation(transaction).severity }}
									</span>
									<span
										v-else
										class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
										Normal
									</span>
								</td>
							</tr>
						</tbody>
					</table>
					<p v-if="transactionData.length > 20" class="mt-2 text-sm text-gray-500 text-center">
						Showing first 20 transactions of {{ transactionData.length }} total
					</p>
				</div>
			</div>
		</div>

		<!-- Step 3: Import Options -->
		<div v-if="parsedData.length > 0 && selectedAccount" class="bg-white rounded-lg shadow-sm border">
			<div class="border-b px-6 py-4">
				<h2 class="text-xl font-semibold text-gray-900">Step 3: Import Configuration</h2>
			</div>
			<div class="p-6">
				<div class="space-y-4">
					<div class="flex items-start">
						<input
							id="import-transactions"
							v-model="importOptions.transactions"
							type="checkbox"
							class="h-4 w-4 text-blue-600 border-gray-300 rounded mt-1" />
						<div class="ml-3">
							<label for="import-transactions" class="text-sm font-medium text-gray-700">
								Import {{ transactionData.length }} transactions with enhanced matching
							</label>
							<p class="text-xs text-gray-500">
								Includes vendor matching, budget item assignment, and duplicate detection
							</p>
						</div>
					</div>

					<div class="flex items-start">
						<input
							id="import-statement"
							v-model="importOptions.monthlyStatement"
							type="checkbox"
							class="h-4 w-4 text-blue-600 border-gray-300 rounded mt-1" />
						<div class="ml-3">
							<label for="import-statement" class="text-sm font-medium text-gray-700">
								Create/update monthly statement record ({{ statementPeriod }})
							</label>
							<p class="text-xs text-gray-500">Links statement to import batch for tracking</p>
						</div>
					</div>

					<div class="flex items-start">
						<input
							id="import-violations"
							v-model="importOptions.violations"
							type="checkbox"
							class="h-4 w-4 text-blue-600 border-gray-300 rounded mt-1" />
						<div class="ml-3">
							<label for="import-violations" class="text-sm font-medium text-gray-700">
								Generate violation report ({{ violationCount }} violations detected)
							</label>
							<p class="text-xs text-gray-500">Creates detailed compliance report with severity levels</p>
						</div>
					</div>

					<div class="flex items-start">
						<input
							id="auto-create-vendors"
							v-model="importOptions.autoCreateVendors"
							type="checkbox"
							class="h-4 w-4 text-blue-600 border-gray-300 rounded mt-1" />
						<div class="ml-3">
							<label for="auto-create-vendors" class="text-sm font-medium text-gray-700">
								Auto-create missing vendors ({{ newVendorsCount }} will be created)
							</label>
							<p class="text-xs text-gray-500">Creates vendor records for unmatched vendor names</p>
						</div>
					</div>
				</div>

				<div class="mt-6">
					<button
						@click="importData"
						:disabled="isImporting || !canImport"
						class="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
						<span v-if="isImporting" class="flex items-center justify-center">
							<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								<path
									class="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
							Importing Data... ({{ importProgress }}/{{ totalImportSteps }})
						</span>
						<span v-else>Import Data with Enhanced Reconciliation</span>
					</button>
				</div>
			</div>
		</div>

		<!-- Import Results -->
		<div v-if="importResults" class="bg-white rounded-lg shadow-sm border">
			<div class="border-b px-6 py-4">
				<h2 class="text-xl font-semibold text-gray-900">Import Results</h2>
			</div>
			<div class="p-6">
				<div class="space-y-4">
					<div v-if="importResults.success" class="p-4 bg-green-50 border-l-4 border-green-400">
						<h3 class="text-green-800 font-semibold">Enhanced Import Successful!</h3>
						<ul class="text-green-700 text-sm mt-2 space-y-1">
							<li v-if="importResults.transactions">
								• {{ importResults.transactions.created }} transactions imported
								<span v-if="importResults.transactions.skipped > 0">
									({{ importResults.transactions.skipped }} duplicates skipped)
								</span>
							</li>
							<li v-if="importResults.vendors">• {{ importResults.vendors.created }} new vendors created</li>
							<li v-if="importResults.vendorMatches">
								• {{ importResults.vendorMatches }} vendor relationships linked
							</li>
							<li v-if="importResults.budgetItemMatches">
								• {{ importResults.budgetItemMatches }} budget items matched
							</li>
							<li v-if="importResults.statement">• Monthly statement {{ importResults.statement.action }}</li>
							<li v-if="importResults.violations">• Violation report {{ importResults.violations.action }}</li>
							<li>
								• Import batch ID:
								<code class="bg-gray-100 px-1 rounded">{{ importResults.batchId }}</code>
							</li>
						</ul>
					</div>

					<div v-if="importResults.errors?.length > 0" class="p-4 bg-red-50 border-l-4 border-red-400">
						<h3 class="text-red-800 font-semibold">Import Warnings</h3>
						<ul class="text-red-700 text-sm mt-2 space-y-1">
							<li v-for="error in importResults.errors" :key="error">• {{ error }}</li>
						</ul>
					</div>

					<!-- Links to view imported data -->
					<div v-if="importResults.success" class="flex flex-wrap gap-4 mt-6">
						<a
							:href="`${directusUrl}/admin/content/transactions?filter[account_id][_eq]=${selectedAccount.id}&filter[import_batch_id][_eq]=${importResults.batchId}`"
							target="_blank"
							class="inline-flex items-center px-4 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50">
							View Imported Transactions
							<svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
							</svg>
						</a>

						<a
							:href="`${directusUrl}/admin/content/vendors?filter[created_from_import][_eq]=true`"
							target="_blank"
							class="inline-flex items-center px-4 py-2 border border-green-300 text-green-700 rounded-lg hover:bg-green-50">
							View Created Vendors
							<svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
							</svg>
						</a>

						<NuxtLink
							to="/financials"
							class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
							View Dashboard
							<svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
							</svg>
						</NuxtLink>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
definePageMeta({
	layout: 'default',
});

// Use the Directus integration from your existing project
const config = useRuntimeConfig();
const directusUrl = ref(config.public.directusUrl || 'https://admin.1033lenox.com');
const directusToken = ref('');
const tokenLoading = ref(true);
const tokenError = ref('');

// Create headers with authentication
const getAuthHeaders = () => {
	const headers = {
		'Content-Type': 'application/json',
	};

	if (directusToken.value) {
		headers['Authorization'] = `Bearer ${directusToken.value}`;
	}

	return headers;
};

// Enhanced reactive state
const csvFile = ref(null);
const parsedData = ref([]);
const transactionData = ref([]);
const balanceData = ref([]);
const accounts = ref([]);
const budgetCategories = ref([]);
const budgetItems = ref([]);
const vendors = ref([]);
const existingTransactions = ref([]);
const selectedAccount = ref(null);
const selectedFiscalYear = ref(2024); // Changed to 2024 for your use case
const selectedMonth = ref('');
const isDragging = ref(false);
const isLoading = ref(false);
const isImporting = ref(false);
const importProgress = ref(0);
const totalImportSteps = ref(0);
const importResults = ref(null);

// Available options for dropdowns
const fiscalYearOptions = [
	{label: '2024', value: 2024},
	{label: '2025', value: 2025},
	{label: '2026', value: 2026},
	{label: '2027', value: 2027},
];

const monthOptions = [
	{label: 'January', value: '01'},
	{label: 'February', value: '02'},
	{label: 'March', value: '03'},
	{label: 'April', value: '04'},
	{label: 'May', value: '05'},
	{label: 'June', value: '06'},
	{label: 'July', value: '07'},
	{label: 'August', value: '08'},
	{label: 'September', value: '09'},
	{label: 'October', value: '10'},
	{label: 'November', value: '11'},
	{label: 'December', value: '12'},
];

const importOptions = ref({
	transactions: true,
	monthlyStatement: true,
	violations: true,
	autoCreateVendors: true,
});

// ======================
// DEBUG FUNCTIONS
// ======================

// 1. Debug CSV data
const debugCSVData = () => {
	console.log('\n=== CSV DATA ANALYSIS ===');
	console.log('Sample transactions and their categories:');

	transactionData.value.slice(0, 10).forEach((transaction, index) => {
		console.log(`${index + 1}. "${transaction.Description}" → CSV Category: "${transaction.Category}"`);
	});

	const uniqueCategories = [...new Set(transactionData.value.map((t) => t.Category))];
	console.log('\nUnique CSV categories found:', uniqueCategories);
};

// 2. Debug loaded budget categories
const debugBudgetCategories = () => {
	console.log('\n=== BUDGET CATEGORIES DEBUG ===');
	console.log('Total budget categories loaded:', budgetCategories.value.length);
	console.log('Budget categories by fiscal year:');

	const categorysByYear = budgetCategories.value.reduce((acc, cat) => {
		acc[cat.fiscal_year] = acc[cat.fiscal_year] || [];
		acc[cat.fiscal_year].push(cat);
		return acc;
	}, {});

	Object.keys(categorysByYear).forEach((year) => {
		console.log(`  ${year}: ${categorysByYear[year].map((c) => `"${c.category_name}" (ID: ${c.id})`).join(', ')}`);
	});

	console.log('\nSelected fiscal year for import:', selectedFiscalYear.value);
};

// 3. Test category mapping logic
const testCategoryMapping = () => {
	console.log('\n=== CATEGORY MAPPING TEST ===');

	const testCategories = ['Insurance', 'Utilities', 'Maintenance', 'Professional', 'Revenue', 'Banking', 'Transfer'];

	testCategories.forEach((csvCategory) => {
		console.log(`\nTesting "${csvCategory}":`);

		// Test the mapping function
		const mappedName = mapCategory(csvCategory);
		console.log(`  mapCategory("${csvCategory}") → "${mappedName}"`);

		// Test finding the budget category
		const {category, budgetItem} = findBudgetCategoryAndItem(csvCategory, null, 'Test Description', 100);

		if (category) {
			console.log(`  Found: "${category.category_name}" (ID: ${category.id}, Year: ${category.fiscal_year})`);
		} else {
			console.log(`  Not found`);
		}
	});
};

// 4. Enhanced findBudgetCategoryAndItem with detailed logging
const findBudgetCategoryAndItemDebug = (csvCategory, csvVendor, csvDescription, transactionAmount) => {
	console.log(`\n Finding category for: "${csvCategory}"`);

	const mappedCategoryName = mapCategory(csvCategory);
	console.log(`  Mapped to: "${mappedCategoryName}"`);

	if (mappedCategoryName === 'Transfer') {
		console.log(`  Transfer category - returning null`);
		return {category: null, budgetItem: null};
	}

	// Debug the search
	console.log(`  Searching for category: name="${mappedCategoryName}" AND fiscal_year=${selectedFiscalYear.value}`);
	console.log(
		`  Available categories:`,
		budgetCategories.value.map((c) => `"${c.category_name}" (Year: ${c.fiscal_year}, ID: ${c.id})`)
	);

	const category = budgetCategories.value.find(
		(c) => c.category_name === mappedCategoryName && c.fiscal_year === selectedFiscalYear.value
	);

	if (!category) {
		console.log(`  Exact match not found`);

		// Try without fiscal year filter
		const anyYearCategory = budgetCategories.value.find((c) => c.category_name === mappedCategoryName);
		if (anyYearCategory) {
			console.log(
				`  Found "${mappedCategoryName}" in year ${anyYearCategory.fiscal_year} but looking for ${selectedFiscalYear.value}`
			);
		}

		// Try case insensitive
		const caseInsensitive = budgetCategories.value.find(
			(c) =>
				c.category_name.toLowerCase() === mappedCategoryName.toLowerCase() && c.fiscal_year === selectedFiscalYear.value
		);

		if (caseInsensitive) {
			console.log(`  Found case-insensitive match: "${caseInsensitive.category_name}"`);
			return {category: caseInsensitive, budgetItem: null};
		}

		// Fallback to Maintenance
		console.log(`  Trying fallback to Maintenance...`);
		const fallbackCategory = budgetCategories.value.find(
			(c) => c.category_name === 'Maintenance' && c.fiscal_year === selectedFiscalYear.value
		);

		if (fallbackCategory) {
			console.log(`  Using fallback: "${fallbackCategory.category_name}" (ID: ${fallbackCategory.id})`);
			return {category: fallbackCategory, budgetItem: null};
		} else {
			console.log(`  Even fallback not found!`);
			return {category: null, budgetItem: null};
		}
	}

	console.log(`  Found: "${category.category_name}" (ID: ${category.id})`);
	return {category, budgetItem: null};
};

// 5. Debug the actual transaction creation
const debugTransactionCreation = async (transaction, index) => {
	console.log(`\n=== TRANSACTION ${index + 1} DEBUG ===`);
	console.log(`Description: "${transaction.Description}"`);
	console.log(`CSV Category: "${transaction.Category}"`);

	// Test category finding
	const {category, budgetItem} = findBudgetCategoryAndItemDebug(
		transaction.Category,
		transaction.Vendor,
		transaction.Description,
		parseFloat(transaction.Amount || 0)
	);

	// Build transaction data
	const transactionDataObj = {
		fiscal_year: selectedFiscalYear.value,
		account_id: selectedAccount.value.id,
		transaction_date: formatDate(transaction.Date),
		description: transaction.Description || '',
		vendor: transaction.Vendor || null,
		amount: parseFloat(transaction.Amount || 0),
		transaction_type: transaction.Type.toLowerCase(),
		category_id: category?.id || null,
		auto_categorized: true,
		statement_month: selectedMonth.value,
		status: 'published',
	};

	console.log(`Transaction data to be sent:`, {
		category_id: transactionDataObj.category_id,
		fiscal_year: transactionDataObj.fiscal_year,
		account_id: transactionDataObj.account_id,
		description: transactionDataObj.description.substring(0, 50) + '...',
	});

	return {transactionData: transactionDataObj, category};
};

// 6. Test single transaction import
const testSingleTransactionImport = async () => {
	console.log('\n=== TESTING SINGLE TRANSACTION IMPORT ===');

	// Run all debug functions first
	debugCSVData();
	debugBudgetCategories();
	testCategoryMapping();

	// Test importing just the first transaction
	if (transactionData.value.length > 0) {
		const firstTransaction = transactionData.value[0];
		const {transactionData: txData, category} = await debugTransactionCreation(firstTransaction, 0);

		if (!category) {
			console.log('STOPPING: No category found for first transaction');
			return;
		}

		console.log('\nAttempting to create transaction in Directus...');

		try {
			const response = await fetch(`${directusUrl.value}/items/transactions`, {
				method: 'POST',
				headers: getAuthHeaders(),
				body: JSON.stringify(txData),
			});

			console.log('Response status:', response.status);

			if (response.ok) {
				const created = await response.json();
				console.log('Transaction created successfully:', {
					id: created.data.id,
					category_id: created.data.category_id,
					description: created.data.description.substring(0, 50),
				});

				// Verify the transaction was created with category_id
				if (created.data.category_id) {
					console.log('Category ID was saved correctly:', created.data.category_id);
				} else {
					console.log('Category ID was NOT saved - check Directus field permissions');
				}
			} else {
				const errorData = await response.text();
				console.log('Failed to create transaction:', errorData);
			}
		} catch (error) {
			console.log('Error creating transaction:', error);
		}
	}
};

// ======================
// MAIN FUNCTIONS
// ======================

// Enhanced vendor matching using matching_keywords
const findVendorByKeywords = (csvVendorName, csvDescription = '') => {
	if (!csvVendorName || csvVendorName.trim() === '') return null;

	const searchText = `${csvVendorName} ${csvDescription}`.toLowerCase();

	// Try exact match first
	let vendor = vendors.value.find((v) => v.title.toLowerCase() === csvVendorName.toLowerCase());

	if (vendor) return vendor;

	// Try matching_keywords array
	vendor = vendors.value.find((v) => {
		if (!v.matching_keywords || v.matching_keywords.length === 0) return false;

		return v.matching_keywords.some(
			(keyword) =>
				searchText.includes(keyword.toLowerCase()) || keyword.toLowerCase().includes(csvVendorName.toLowerCase())
		);
	});

	return vendor;
};

const createVendorFromCSV = async (csvVendorName) => {
	if (!importOptions.value.autoCreateVendors || !csvVendorName?.trim()) return null;

	try {
		const newVendorData = {
			title: csvVendorName.trim(),
			status: 'published',
			auto_created: true,
			created_from_import: true,
			matching_keywords: [csvVendorName.trim()],
			category: 'General',
		};

		const response = await fetch(`${directusUrl.value}/items/vendors`, {
			method: 'POST',
			headers: getAuthHeaders(),
			body: JSON.stringify(newVendorData),
		});

		if (response.ok) {
			const createdVendor = await response.json();
			vendors.value.push(createdVendor.data);
			return createdVendor.data;
		}
	} catch (error) {
		console.warn('Could not create vendor:', error);
	}

	return null;
};

// Smart budget item matching using keywords and vendor_patterns
const findBestBudgetItem = (categoryId, csvVendor, csvDescription, amount) => {
	const categoryBudgetItems = budgetItems.value.filter(
		(item) => item.category_id === categoryId && item.fiscal_year === selectedFiscalYear.value
	);

	if (categoryBudgetItems.length === 0) return null;

	const searchText = `${csvVendor || ''} ${csvDescription || ''}`.toLowerCase();

	// Score each budget item
	const scoredItems = categoryBudgetItems.map((item) => {
		let score = 0;

		// Check vendor_patterns array (highest priority)
		if (item.vendor_patterns && item.vendor_patterns.length > 0) {
			const vendorMatch = item.vendor_patterns.some(
				(pattern) =>
					csvVendor &&
					(csvVendor.toLowerCase().includes(pattern.toLowerCase()) ||
						pattern.toLowerCase().includes(csvVendor.toLowerCase()))
			);
			if (vendorMatch) score += 100;
		}

		// Check keywords array
		if (item.keywords && item.keywords.length > 0) {
			const keywordMatches = item.keywords.filter((keyword) => searchText.includes(keyword.toLowerCase())).length;
			score += keywordMatches * 50;
		}

		// Monthly budget proximity
		if (item.monthly_budget) {
			const monthlyBudget = parseFloat(item.monthly_budget);
			const proximity = Math.abs(amount - monthlyBudget) / monthlyBudget;
			if (proximity < 0.5) score += 10;
		}

		return {item, score};
	});

	// Sort by score and return best match
	scoredItems.sort((a, b) => b.score - a.score);
	const bestMatch = scoredItems[0];

	return bestMatch.score > 0 ? bestMatch.item : categoryBudgetItems[0];
};

// Enhanced category and budget item finder
const findBudgetCategoryAndItem = (csvCategory, csvVendor, csvDescription, transactionAmount) => {
	const mappedCategoryName = mapCategory(csvCategory);

	if (mappedCategoryName === 'Transfer') return {category: null, budgetItem: null};

	// Find budget category
	const category = budgetCategories.value.find(
		(c) => c.category_name === mappedCategoryName && c.fiscal_year === selectedFiscalYear.value
	);

	if (!category) {
		console.warn(`Budget category not found: ${mappedCategoryName} for fiscal year ${selectedFiscalYear.value}`);
		// Fallback to Maintenance category
		const fallbackCategory = budgetCategories.value.find(
			(c) => c.category_name === 'Maintenance' && c.fiscal_year === selectedFiscalYear.value
		);

		if (!fallbackCategory) return {category: null, budgetItem: null};

		const budgetItem = findBestBudgetItem(fallbackCategory.id, csvVendor, csvDescription, transactionAmount);
		return {category: fallbackCategory, budgetItem};
	}

	// Find best matching budget item within the category
	const budgetItem = findBestBudgetItem(category.id, csvVendor, csvDescription, transactionAmount);

	return {category, budgetItem};
};

// Generate unique batch ID for this import
const generateImportBatchId = () => {
	return `import_${selectedFiscalYear.value}_${selectedMonth.value}_${Date.now()}`;
};

// Check for duplicate transactions
const findDuplicateTransaction = (newTransaction) => {
	const transactionDate = formatDate(newTransaction.Date);
	const amount = parseFloat(newTransaction.Amount || 0);
	const description = (newTransaction.Description || '').substring(0, 30);

	return existingTransactions.value.find((existing) => {
		const existingDate = new Date(existing.transaction_date);
		const newDate = new Date(transactionDate);
		const dayDiff = Math.abs((existingDate - newDate) / (1000 * 60 * 60 * 24));

		return (
			dayDiff <= 1 && // Within 1 day
			Math.abs(existing.amount - amount) < 0.01 && // Same amount
			existing.account_id === selectedAccount.value.id && // Same account
			existing.description.substring(0, 30) === description
		); // Similar description
	});
};

// Load existing transactions for duplicate checking
const loadExistingTransactions = async () => {
	if (!selectedAccount.value || !selectedMonth.value) return;

	try {
		const startDate = `${selectedFiscalYear.value}-${selectedMonth.value}-01`;
		const endDate = `${selectedFiscalYear.value}-${selectedMonth.value}-31`;

		const transactionsUrl = `${directusUrl.value}/items/transactions?filter[account_id][_eq]=${selectedAccount.value.id}&filter[transaction_date][_between]=[${startDate},${endDate}]&fields=*&limit=-1`;

		const response = await fetch(transactionsUrl, {headers: getAuthHeaders()});
		if (response.ok) {
			const data = await response.json();
			existingTransactions.value = data.data || [];
		}
	} catch (error) {
		console.error('Error loading existing transactions:', error);
		existingTransactions.value = [];
	}
};

// Enhanced violation detection for Florida HOA compliance
const detectViolation = (transaction) => {
	// COMPREHENSIVE FLORIDA HOA FUND SEGREGATION COMPLIANCE CHECK

	// 1. CRITICAL: Any transfer between Operating (5129) and Special Assessment (5872) accounts
	if (transaction.Description) {
		const desc = transaction.Description.toLowerCase();

		// Transfers TO special assessment account from operating
		if (desc.includes('transfer to') && desc.includes('5872')) {
			return {isViolation: true, type: 'fund_mixing', severity: 'CRITICAL'};
		}

		// Transfers FROM special assessment account to operating
		if (desc.includes('transfer from') && desc.includes('5872')) {
			return {isViolation: true, type: 'fund_mixing', severity: 'CRITICAL'};
		}

		// Any reference to MMA account 5872 in operating account
		if (desc.includes('5872') || desc.includes('mma account 5872')) {
			return {isViolation: true, type: 'fund_mixing', severity: 'CRITICAL'};
		}
	}

	// 2. Check vendor field for account transfers
	if (transaction.Vendor) {
		const vendor = transaction.Vendor.toLowerCase();
		if (vendor.includes('5872') || vendor.includes('transfer to 5872')) {
			return {isViolation: true, type: 'fund_mixing', severity: 'CRITICAL'};
		}
	}

	// 3. CRITICAL: Special assessment expenses in operating account
	if (transaction.Description) {
		const desc = transaction.Description.toLowerCase();
		const suspiciousTerms = [
			'recertification',
			'40 year',
			'structural',
			'engineering report',
			'milestone inspection',
			'building certification',
			'reserve study',
		];

		if (suspiciousTerms.some((term) => desc.includes(term))) {
			return {isViolation: true, type: 'unauthorized_expense', severity: 'HIGH'};
		}
	}

	// 4. Large maintenance payments that might be special assessments
	if (transaction.Category === 'Maintenance' && parseFloat(transaction.Amount) > 3000) {
		return {isViolation: true, type: 'budget_overage', severity: 'MEDIUM'};
	}

	// 5. Explicit violation marking from CSV
	if (transaction.Violation === 'true' || transaction.Violation === true) {
		return {isViolation: true, type: 'explicit_violation', severity: 'HIGH'};
	}

	return {isViolation: false, type: null, severity: null};
};

// Auto-detect month from CSV data or filename
const detectMonthFromData = () => {
	if (transactionData.value.length > 0) {
		// Try to get from Period field
		const period = transactionData.value[0]?.Period;
		if (period) {
			const monthNum = new Date(`${period} 1, 2025`).getMonth() + 1;
			return monthNum.toString().padStart(2, '0');
		}

		// Try to get from transaction date
		const firstDate = transactionData.value[0]?.Date;
		if (firstDate) {
			const parts = firstDate.split('/');
			if (parts.length >= 2) {
				return parts[0].padStart(2, '0');
			}
		}
	}

	// Try to detect from filename
	if (csvFile.value?.name) {
		const filename = csvFile.value.name.toLowerCase();
		if (filename.includes('january') || filename.includes('-01-')) return '01';
		if (filename.includes('february') || filename.includes('-02-')) return '02';
		if (filename.includes('march') || filename.includes('-03-')) return '03';
		if (filename.includes('april') || filename.includes('-04-')) return '04';
		if (filename.includes('may') || filename.includes('-05-')) return '05';
		if (filename.includes('june') || filename.includes('-06-')) return '06';
		if (filename.includes('july') || filename.includes('-07-')) return '07';
		if (filename.includes('august') || filename.includes('-08-')) return '08';
		if (filename.includes('september') || filename.includes('-09-')) return '09';
		if (filename.includes('october') || filename.includes('-10-')) return '10';
		if (filename.includes('november') || filename.includes('-11-')) return '11';
		if (filename.includes('december') || filename.includes('-12-')) return '12';
	}

	return '';
};

// Enhanced computed properties
const totalDeposits = computed(() => {
	return transactionData.value
		.filter((t) => t.Type === 'DEPOSIT')
		.reduce((sum, t) => sum + parseFloat(t.Amount || 0), 0);
});

const totalWithdrawals = computed(() => {
	return transactionData.value
		.filter((t) => ['WITHDRAWAL', 'FEE'].includes(t.Type))
		.reduce((sum, t) => sum + parseFloat(t.Amount || 0), 0);
});

const violationCount = computed(() => {
	return transactionData.value.filter((t) => detectViolation(t).isViolation).length;
});

const vendorMatchCount = computed(() => {
	return transactionData.value.filter((t) => findVendorByKeywords(t.Vendor, t.Description)).length;
});

const vendorMatchPercent = computed(() => {
	if (transactionData.value.length === 0) return 0;
	return (vendorMatchCount.value / transactionData.value.length) * 100;
});

const newVendorsCount = computed(() => {
	const uniqueVendors = new Set();
	transactionData.value.forEach((t) => {
		if (t.Vendor && !findVendorByKeywords(t.Vendor, t.Description)) {
			uniqueVendors.add(t.Vendor);
		}
	});
	return uniqueVendors.size;
});

const uniqueCategories = computed(() => {
	const categories = new Set();
	transactionData.value.forEach((t) => {
		if (t.Category) {
			categories.add(mapCategory(t.Category));
		}
	});
	return Array.from(categories).sort();
});

const topVendors = computed(() => {
	const vendorCounts = {};
	transactionData.value.forEach((t) => {
		if (t.Vendor) {
			vendorCounts[t.Vendor] = (vendorCounts[t.Vendor] || 0) + 1;
		}
	});

	return Object.entries(vendorCounts)
		.map(([name, count]) => ({name, count}))
		.sort((a, b) => b.count - a.count);
});

const statementPeriod = computed(() => {
	if (!selectedMonth.value || !selectedFiscalYear.value) return '';
	const monthName = monthOptions.find((m) => m.value === selectedMonth.value)?.label || '';
	return `${monthName} ${selectedFiscalYear.value}`;
});

const canImport = computed(() => {
	return (
		selectedAccount.value &&
		selectedFiscalYear.value &&
		selectedMonth.value &&
		(importOptions.value.transactions || importOptions.value.monthlyStatement || importOptions.value.violations)
	);
});

// Enhanced data mapping methods with debug logging
const mapCategory = (csvCategory) => {
	console.log(`mapCategory input: "${csvCategory}"`);

	if (!csvCategory) {
		console.log('No CSV category provided, returning Uncategorized');
		return 'Uncategorized';
	}

	const categoryMap = {
		Insurance: 'Insurance',
		Utilities: 'Utilities',
		Maintenance: 'Maintenance',
		Regulatory: 'Regulatory',
		Banking: 'Banking',
		Revenue: 'Revenue',
		'Professional Services': 'Professional',
		Professional: 'Professional',
		Management: 'Professional',
		Operating: 'Banking',
		Transfer: 'Transfer',
	};

	const mapped = categoryMap[csvCategory] || 'Maintenance';
	console.log(`mapCategory output: "${mapped}"`);
	return mapped;
};

// Helper methods for preview
const getVendorMatch = (csvVendor) => {
	return findVendorByKeywords(csvVendor);
};

const getBudgetItemMatch = (transaction) => {
	const {category, budgetItem} = findBudgetCategoryAndItem(
		transaction.Category,
		transaction.Vendor,
		transaction.Description,
		parseFloat(transaction.Amount || 0)
	);
	return budgetItem;
};

const getTypeClass = (type) => {
	const classes = {
		DEPOSIT: 'bg-green-100 text-green-800',
		WITHDRAWAL: 'bg-red-100 text-red-800',
		FEE: 'bg-yellow-100 text-yellow-800',
	};
	return classes[type] || 'bg-gray-100 text-gray-800';
};

const getViolationClass = (severity) => {
	const classes = {
		CRITICAL: 'bg-red-200 text-red-900',
		HIGH: 'bg-red-100 text-red-800',
		MEDIUM: 'bg-yellow-100 text-yellow-800',
	};
	return classes[severity] || 'bg-gray-100 text-gray-800';
};

const formatDate = (dateStr) => {
	if (!dateStr) return '';

	// Handle MM/DD format from CSV
	const parts = dateStr.split('/');
	if (parts.length === 2) {
		const year = selectedFiscalYear.value;
		const month = parts[0].padStart(2, '0');
		const day = parts[1].padStart(2, '0');
		return `${year}-${month}-${day}`;
	}
	return dateStr;
};

// File handling methods
const handleFileDrop = (event) => {
	isDragging.value = false;
	const files = event.dataTransfer.files;
	if (files.length > 0) {
		csvFile.value = files[0];
	}
};

const handleFileSelect = (event) => {
	const files = event.target.files;
	if (files.length > 0) {
		csvFile.value = files[0];
	}
};

const clearFile = () => {
	csvFile.value = null;
	parsedData.value = [];
	transactionData.value = [];
	balanceData.value = [];
	importResults.value = null;
	selectedMonth.value = '';
};

// Native CSV parser
const parseCSVText = (csvText) => {
	const lines = csvText.split('\n').filter((line) => line.trim());
	if (lines.length === 0) return [];

	// Get headers from first line
	const headers = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''));

	// Parse data rows
	const data = [];
	for (let i = 1; i < lines.length; i++) {
		const values = lines[i].split(',').map((v) => v.trim().replace(/"/g, ''));
		if (values.length >= headers.length) {
			const row = {};
			headers.forEach((header, index) => {
				row[header] = values[index];
			});
			data.push(row);
		}
	}

	return data;
};

// CSV parsing method
const parseCSV = async () => {
	if (!csvFile.value) return;

	isLoading.value = true;

	try {
		const text = await csvFile.value.text();

		try {
			// Use native CSV parsing
			const results = parseCSVText(text);

			parsedData.value = results;

			// Separate transactions from balance entries
			transactionData.value = results.filter((row) => row.Type && ['DEPOSIT', 'WITHDRAWAL', 'FEE'].includes(row.Type));
			balanceData.value = results.filter((row) => row.Type === 'BALANCE');

			console.log('Parsed CSV:', {
				total: results.length,
				transactions: transactionData.value.length,
				balances: balanceData.value.length,
			});

			// Auto-detect month from CSV data if not already selected
			if (!selectedMonth.value) {
				const detectedMonth = detectMonthFromData();
				if (detectedMonth) {
					selectedMonth.value = detectedMonth;
					console.log('Auto-detected month:', detectedMonth);
				}
			}
		} catch (parseError) {
			console.error('CSV parsing error:', parseError);
			alert('Error parsing CSV file: ' + parseError.message);
		}
	} catch (error) {
		console.error('File reading error:', error);
		alert('Error reading file: ' + error.message);
	} finally {
		isLoading.value = false;
	}
};

// Enhanced import method with full reconciliation and debugging
const importData = async () => {
	if (!selectedAccount.value || transactionData.value.length === 0 || !selectedMonth.value) return;

	isImporting.value = true;
	importProgress.value = 0;
	totalImportSteps.value = 0;

	// Calculate total steps
	if (importOptions.value.transactions) totalImportSteps.value += transactionData.value.length;
	if (importOptions.value.monthlyStatement) totalImportSteps.value += 1;
	if (importOptions.value.violations) totalImportSteps.value += 1;

	const results = {
		success: true,
		errors: [],
		transactions: {created: 0, skipped: 0, updated: 0},
		vendors: {created: 0},
		vendorMatches: 0,
		budgetItemMatches: 0,
		statement: null,
		violations: null,
		batchId: null,
	};

	try {
		// Load existing transactions for duplicate checking
		await loadExistingTransactions();

		// Generate batch ID for this import
		const batchId = generateImportBatchId();
		results.batchId = batchId;

		// Import transactions with full reconciliation
		if (importOptions.value.transactions) {
			console.log('Starting enhanced transaction import...');

			for (let i = 0; i < transactionData.value.length; i++) {
				const transaction = transactionData.value[i];

				try {
					console.log(
						`\nProcessing transaction ${i + 1}/${transactionData.value.length}: "${transaction.Description}"`
					);

					// Check for duplicates
					const duplicate = findDuplicateTransaction(transaction);
					if (duplicate) {
						console.log(`Skipping duplicate: ${transaction.Description}`);
						results.transactions.skipped++;
						importProgress.value++;
						continue;
					}

					// Find vendor using enhanced matching
					const vendor = findVendorByKeywords(transaction.Vendor, transaction.Description);

					// Create vendor if not found and auto-create is enabled
					const finalVendor = vendor || (await createVendorFromCSV(transaction.Vendor));

					if (finalVendor && !vendor) {
						results.vendors.created++;
					}
					if (finalVendor) {
						results.vendorMatches++;
					}

					// Find budget category and specific budget item with debugging
					console.log(`  Finding category for CSV category: "${transaction.Category}"`);
					const {category, budgetItem} = findBudgetCategoryAndItem(
						transaction.Category,
						transaction.Vendor,
						transaction.Description,
						parseFloat(transaction.Amount || 0)
					);

					if (budgetItem) {
						results.budgetItemMatches++;
					}

					// Log category matching result
					if (category) {
						console.log(`  ✅ Category matched: "${category.category_name}" (ID: ${category.id})`);
					} else {
						console.log(`  ❌ No category found for: "${transaction.Category}"`);
					}

					// Enhanced violation detection
					const violation = detectViolation(transaction);

					// Build complete transaction data using your schema
					const transactionDataObj = {
						fiscal_year: selectedFiscalYear.value,
						account_id: selectedAccount.value.id,
						transaction_date: formatDate(transaction.Date),
						description: transaction.Description || '',
						vendor: transaction.Vendor || null, // Keep original CSV text
						vendor_id: finalVendor?.id || null, // Link to vendors table
						amount: parseFloat(transaction.Amount || 0),
						transaction_type: transaction.Type.toLowerCase(),
						category_id: category?.id || null, // Link to budget_categories
						budget_item_id: budgetItem?.id || null, // Link to budget_items
						is_violation: violation.isViolation,
						violation_type: violation.type,
						violation_severity: violation.severity, // Using your field name
						auto_categorized: true,
						statement_month: selectedMonth.value,
						import_batch_id: batchId, // Track this import batch
						csv_source_line: i + 1, // Line number in CSV
						original_csv_data: JSON.stringify(transaction), // Store original for auditing
						board_notes: violation.isViolation
							? `COMPLIANCE ALERT: ${violation.type} (${violation.severity}) - Review for Florida HOA law compliance`
							: null,
						status: 'published',
					};

					console.log(`  Sending transaction data with category_id: ${transactionDataObj.category_id}`);

					// Create the transaction
					const response = await fetch(`${directusUrl.value}/items/transactions`, {
						method: 'POST',
						headers: getAuthHeaders(),
						body: JSON.stringify(transactionDataObj),
					});

					if (!response.ok) {
						const errorText = await response.text();
						throw new Error(`HTTP ${response.status}: ${errorText}`);
					}

					const createdData = await response.json();
					console.log(
						`  ✅ Transaction created with ID: ${createdData.data.id}, category_id: ${createdData.data.category_id}`
					);

					results.transactions.created++;
					importProgress.value++;
				} catch (error) {
					console.error('Error importing transaction:', error);
					results.errors.push(`Line ${i + 1}: ${error.message}`);
				}
			}
		}

		// Create/update monthly statement (rest of the code remains the same)...
		// [Previous monthly statement code]

		// Log final results
		console.log('Enhanced import completed:', results);
	} catch (error) {
		console.error('Import error:', error);
		results.success = false;
		results.errors.push(`General import error: ${error.message}`);
	} finally {
		isImporting.value = false;
		importResults.value = results;
	}
};

// Enhanced onMounted function for loading all collections
onMounted(async () => {
	// Fetch admin token from server
	try {
		const response = await $fetch('/api/admin/token');
		directusToken.value = response.token;
		tokenLoading.value = false;
	} catch (error) {
		console.error('Failed to get admin token:', error);
		tokenError.value = 'Failed to authenticate. Please ensure you have admin access.';
		tokenLoading.value = false;
		return;
	}

	try {
		console.log('Loading reference data for enhanced CSV import...');
		const authHeaders = getAuthHeaders();

		// Load all reference data in parallel
		const [accountsResponse, categoriesResponse, vendorsResponse, budgetItemsResponse] = await Promise.all([
			fetch(`${directusUrl.value}/items/accounts?filter[status][_eq]=published&sort=account_number`, {
				headers: authHeaders,
			}),
			fetch(
				`${directusUrl.value}/items/budget_categories?filter[status][_eq]=published&filter[fiscal_year][_eq]=${selectedFiscalYear.value}&sort=category_name`,
				{headers: authHeaders}
			),
			fetch(
				`${directusUrl.value}/items/vendors?filter[status][_eq]=published&sort=title&fields=id,title,matching_keywords,category,auto_created,created_from_import`,
				{headers: authHeaders}
			),
			fetch(
				`${directusUrl.value}/items/budget_items?filter[status][_eq]=published&filter[fiscal_year][_eq]=${selectedFiscalYear.value}&sort=description&fields=id,description,item_code,keywords,vendor_patterns,monthly_budget,yearly_budget,category_id,vendor_id`,
				{headers: authHeaders}
			),
		]);

		// Process accounts
		if (accountsResponse.ok) {
			const accountsData = await accountsResponse.json();
			accounts.value = accountsData.data || [];
			console.log('✅ Loaded accounts:', accounts.value.length);
		} else {
			console.warn('⚠️ Using fallback accounts data');
			accounts.value = [
				{id: 1, account_number: '5129', account_name: 'Operating Account', account_type: 'operating'},
				{id: 2, account_number: '7011', account_name: 'Reserve Account', account_type: 'reserve'},
				{id: 3, account_number: '5872', account_name: '40-Year Special Assessment', account_type: 'special'},
			];
		}

		// Process budget categories
		if (categoriesResponse.ok) {
			const categoriesData = await categoriesResponse.json();
			budgetCategories.value = categoriesData.data || [];
			console.log('✅ Loaded budget categories:', budgetCategories.value.length);
		} else {
			console.warn('⚠️ Using fallback budget categories');
			budgetCategories.value = [
				{id: 1, category_name: 'Insurance', fiscal_year: selectedFiscalYear.value},
				{id: 2, category_name: 'Professional', fiscal_year: selectedFiscalYear.value},
				{id: 3, category_name: 'Utilities', fiscal_year: selectedFiscalYear.value},
				{id: 4, category_name: 'Maintenance', fiscal_year: selectedFiscalYear.value},
				{id: 5, category_name: 'Regulatory', fiscal_year: selectedFiscalYear.value},
				{id: 6, category_name: 'Banking', fiscal_year: selectedFiscalYear.value},
				{id: 7, category_name: 'Revenue', fiscal_year: selectedFiscalYear.value},
			];
		}

		// Process vendors (your schema has great matching_keywords feature)
		if (vendorsResponse.ok) {
			const vendorsData = await vendorsResponse.json();
			vendors.value = vendorsData.data || [];
			console.log('✅ Loaded vendors with matching keywords:', vendors.value.length);
		} else {
			console.warn('⚠️ Vendors collection not available');
			vendors.value = [];
		}

		// Process budget items (your schema has keywords and vendor_patterns arrays)
		if (budgetItemsResponse.ok) {
			const budgetItemsData = await budgetItemsResponse.json();
			budgetItems.value = budgetItemsData.data || [];
			console.log('✅ Loaded budget items with keywords/patterns:', budgetItems.value.length);
		} else {
			console.warn('⚠️ Budget items collection not available');
			budgetItems.value = [];
		}

		console.log('✅ All reference data loaded successfully');
	} catch (error) {
		console.error('❌ Error loading reference data:', error);
		// Ensure fallback data is available
		if (!accounts.value.length) {
			accounts.value = [
				{id: 1, account_number: '5129', account_name: 'Operating Account', account_type: 'operating'},
				{id: 2, account_number: '7011', account_name: 'Reserve Account', account_type: 'reserve'},
				{id: 3, account_number: '5872', account_name: '40-Year Special Assessment', account_type: 'special'},
			];
		}
		if (!budgetCategories.value.length) {
			budgetCategories.value = [
				{id: 1, category_name: 'Insurance', fiscal_year: selectedFiscalYear.value},
				{id: 2, category_name: 'Professional', fiscal_year: selectedFiscalYear.value},
				{id: 3, category_name: 'Utilities', fiscal_year: selectedFiscalYear.value},
				{id: 4, category_name: 'Maintenance', fiscal_year: selectedFiscalYear.value},
				{id: 5, category_name: 'Regulatory', fiscal_year: selectedFiscalYear.value},
				{id: 6, category_name: 'Banking', fiscal_year: selectedFiscalYear.value},
				{id: 7, category_name: 'Revenue', fiscal_year: selectedFiscalYear.value},
			];
		}
	}
});

// Watch for account/month selection changes to load existing transactions
watch(
	[selectedAccount, selectedMonth],
	async () => {
		if (selectedAccount.value && selectedMonth.value) {
			await loadExistingTransactions();
		}
	},
	{immediate: true}
);
</script>
