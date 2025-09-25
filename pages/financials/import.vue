<template>
	<div class="max-w-6xl mx-auto p-6 space-y-8">
		<!-- Header -->
		<div class="bg-white rounded-lg shadow-sm border p-6">
			<h1 class="text-3xl font-bold text-gray-900 mb-2">CSV Import</h1>
			<p class="text-gray-600">Import bank statement CSV files into your HOA financial system</p>
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

				<!-- Data Summary -->
				<div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
					<div class="bg-yellow-50 p-4 rounded-lg">
						<p class="text-sm text-yellow-600">Violations Detected</p>
						<p class="text-2xl font-bold text-yellow-700">{{ violationCount }}</p>
					</div>
				</div>

				<!-- Violations Alert -->
				<div v-if="violationCount > 0" class="mb-6 p-4 bg-red-50 border-l-4 border-red-400">
					<h3 class="text-red-800 font-semibold">⚠️ Compliance Violations Detected</h3>
					<p class="text-red-700 text-sm">
						{{ violationCount }} transactions flagged as potential violations will be marked accordingly.
					</p>
				</div>

				<!-- Preview Table -->
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
								<td class="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
									{{ transaction.Vendor || '-' }}
								</td>
								<td
									class="px-4 py-4 whitespace-nowrap text-sm font-mono"
									:class="transaction.Type === 'DEPOSIT' ? 'text-green-600' : 'text-red-600'">
									${{ parseFloat(transaction.Amount).toLocaleString() }}
								</td>
								<td class="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
									{{ mapCategory(transaction.Category) }}
								</td>
								<td class="px-4 py-4 whitespace-nowrap">
									<span
										v-if="detectViolation(transaction).isViolation"
										class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
										:class="
											detectViolation(transaction).severity === 'CRITICAL'
												? 'bg-red-200 text-red-900'
												: detectViolation(transaction).severity === 'HIGH'
													? 'bg-red-100 text-red-800'
													: 'bg-yellow-100 text-yellow-800'
										">
										{{ detectViolation(transaction).severity }} VIOLATION
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

		<!-- Step 3: Import -->
		<div v-if="parsedData.length > 0 && selectedAccount" class="bg-white rounded-lg shadow-sm border">
			<div class="border-b px-6 py-4">
				<h2 class="text-xl font-semibold text-gray-900">Step 3: Import to Directus</h2>
			</div>
			<div class="p-6">
				<div class="space-y-4">
					<div class="flex items-center">
						<input
							id="import-transactions"
							v-model="importOptions.transactions"
							type="checkbox"
							class="h-4 w-4 text-blue-600 border-gray-300 rounded" />
						<label for="import-transactions" class="ml-2 text-sm text-gray-700">
							Import {{ transactionData.length }} transactions
						</label>
					</div>

					<div class="flex items-center">
						<input
							id="import-statement"
							v-model="importOptions.monthlyStatement"
							type="checkbox"
							class="h-4 w-4 text-blue-600 border-gray-300 rounded" />
						<label for="import-statement" class="ml-2 text-sm text-gray-700">
							Create/update monthly statement record ({{ statementPeriod }})
						</label>
					</div>

					<div class="flex items-center">
						<input
							id="import-violations"
							v-model="importOptions.violations"
							type="checkbox"
							class="h-4 w-4 text-blue-600 border-gray-300 rounded" />
						<label for="import-violations" class="ml-2 text-sm text-gray-700">
							Generate violation report ({{ violationCount }} violations detected)
						</label>
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
						<span v-else>Import Data to Directus</span>
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
						<h3 class="text-green-800 font-semibold">✅ Import Successful!</h3>
						<ul class="text-green-700 text-sm mt-2 space-y-1">
							<li v-if="importResults.transactions">
								• {{ importResults.transactions.created }} transactions imported
							</li>
							<li v-if="importResults.statement">• Monthly statement {{ importResults.statement.action }}</li>
							<li v-if="importResults.violations">• Violation report {{ importResults.violations.action }}</li>
						</ul>
					</div>

					<div v-if="importResults.errors?.length > 0" class="p-4 bg-red-50 border-l-4 border-red-400">
						<h3 class="text-red-800 font-semibold">⚠️ Import Warnings</h3>
						<ul class="text-red-700 text-sm mt-2 space-y-1">
							<li v-for="error in importResults.errors" :key="error">• {{ error }}</li>
						</ul>
					</div>

					<!-- Links to view imported data -->
					<div v-if="importResults.success" class="flex flex-wrap gap-4 mt-6">
						<a
							:href="`${directusUrl}/admin/content/transactions?filter[account_id][_eq]=${selectedAccount.id}`"
							target="_blank"
							class="inline-flex items-center px-4 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50">
							View Transactions
							<svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
							</svg>
						</a>

						<a
							:href="`${directusUrl}/admin/content/monthly_statements?filter[account_id][_eq]=${selectedAccount.id}`"
							target="_blank"
							class="inline-flex items-center px-4 py-2 border border-green-300 text-green-700 rounded-lg hover:bg-green-50">
							View Statements
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
import Papa from 'papaparse';

definePageMeta({
	layout: 'default',
});

// Use the Directus integration from your existing project
const config = useRuntimeConfig();
const directusUrl = config.public.directusUrl || 'https://admin.1033lenox.com';
const directusToken = config.public.staticToken || process.env.DIRECTUS_TOKEN;

// Create headers with authentication
const getAuthHeaders = () => {
	const headers = {
		'Content-Type': 'application/json',
	};

	if (directusToken) {
		headers['Authorization'] = `Bearer ${directusToken}`;
	}

	return headers;
};

// Reactive state
const csvFile = ref(null);
const parsedData = ref([]);
const transactionData = ref([]);
const balanceData = ref([]);
const accounts = ref([]);
const budgetCategories = ref([]);
const selectedAccount = ref(null);
const selectedFiscalYear = ref(2025);
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
});

// Enhanced violation detection for Florida HOA compliance
const detectViolation = (transaction) => {
	// COMPREHENSIVE FLORIDA HOA FUND SEGREGATION COMPLIANCE CHECK

	// 1. CRITICAL: Any transfer between Operating (5129) and Special Assessment (5872) accounts
	// Florida Statutes 718.111(11)(f) - Special assessment funds must be segregated
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

// Computed properties
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
	return transactionData.value.filter((t) => {
		const violation = detectViolation(t);
		return violation.isViolation;
	}).length;
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

// Data mapping methods
const mapCategory = (csvCategory) => {
	if (!csvCategory) return 'Uncategorized';

	// Updated mapping for your specific CSV format → Directus budget_categories
	const categoryMap = {
		// Direct matches to your Directus categories
		Insurance: 'Insurance',
		Utilities: 'Utilities',
		Maintenance: 'Maintenance',
		Regulatory: 'Regulatory',
		Banking: 'Banking',
		Revenue: 'Revenue',

		// Professional services (multiple CSV names → Professional)
		'Professional Services': 'Professional',
		Professional: 'Professional',
		Management: 'Professional',

		// Operating expenses map to Banking (bank fees, office supplies)
		Operating: 'Banking',

		// Special handling
		Transfer: 'Transfer', // Keep transfers as-is for violation detection
	};

	return categoryMap[csvCategory] || 'Maintenance'; // Default to Maintenance for uncategorized
};

const findBudgetCategory = (csvCategory) => {
	const mappedCategoryName = mapCategory(csvCategory);

	// Skip category lookup for transfers
	if (mappedCategoryName === 'Transfer') return null;

	// Find matching Directus budget category using selected fiscal year
	const category = budgetCategories.value.find(
		(c) => c.category_name === mappedCategoryName && c.fiscal_year === selectedFiscalYear.value
	);

	if (!category) {
		console.warn(
			`Budget category not found: ${mappedCategoryName} (from CSV: ${csvCategory}) for fiscal year ${selectedFiscalYear.value}`
		);
		// Fallback to Maintenance category
		return budgetCategories.value.find(
			(c) => c.category_name === 'Maintenance' && c.fiscal_year === selectedFiscalYear.value
		);
	}

	return category;
};

const getTypeClass = (type) => {
	const classes = {
		DEPOSIT: 'bg-green-100 text-green-800',
		WITHDRAWAL: 'bg-red-100 text-red-800',
		FEE: 'bg-yellow-100 text-yellow-800',
	};
	return classes[type] || 'bg-gray-100 text-gray-800';
};

const formatDate = (dateStr) => {
	if (!dateStr) return '';

	// Handle MM/DD format from CSV
	const parts = dateStr.split('/');
	if (parts.length === 2) {
		const year = selectedFiscalYear.value; // Use selected fiscal year
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

// CSV parsing method
const parseCSV = async () => {
	if (!csvFile.value) return;

	isLoading.value = true;

	try {
		const text = await csvFile.value.text();

		Papa.parse(text, {
			header: true,
			skipEmptyLines: true,
			complete: (results) => {
				parsedData.value = results.data;

				// Separate transactions from balance entries
				transactionData.value = results.data.filter(
					(row) => row.Type && ['DEPOSIT', 'WITHDRAWAL', 'FEE'].includes(row.Type)
				);

				balanceData.value = results.data.filter((row) => row.Type === 'BALANCE');

				console.log('Parsed CSV:', {
					total: results.data.length,
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
			},
			error: (error) => {
				console.error('CSV parsing error:', error);
				alert('Error parsing CSV file: ' + error.message);
			},
		});
	} catch (error) {
		console.error('File reading error:', error);
		alert('Error reading file: ' + error.message);
	} finally {
		isLoading.value = false;
	}
};

// Import method
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
		transactions: null,
		statement: null,
		violations: null,
	};

	try {
		// Import transactions
		if (importOptions.value.transactions) {
			console.log('Starting transaction import...');

			let created = 0;
			for (const transaction of transactionData.value) {
				try {
					// Find matching budget category using dynamic lookup
					const budgetCategory = findBudgetCategory(transaction.Category);

					// Enhanced violation detection
					const violation = detectViolation(transaction);

					// Convert date
					const transactionDate = formatDate(transaction.Date);

					const transactionData = {
						fiscal_year: selectedFiscalYear.value,
						account_id: selectedAccount.value.id,
						transaction_date: transactionDate,
						description: transaction.Description || '',
						vendor: transaction.Vendor || null,
						amount: parseFloat(transaction.Amount || 0),
						transaction_type: transaction.Type.toLowerCase(),
						category_id: budgetCategory?.id || null,
						is_violation: violation.isViolation,
						violation_type: violation.type,
						auto_categorized: true,
						statement_month: selectedMonth.value,
						board_notes: violation.isViolation
							? `COMPLIANCE ALERT: ${violation.type} (${violation.severity}) - Review for Florida HOA law compliance`
							: null,
						status: 'published',
					};

					// Use direct API call with authentication
					const response = await fetch(`${directusUrl}/items/transactions`, {
						method: 'POST',
						headers: getAuthHeaders(),
						body: JSON.stringify(transactionData),
					});

					if (!response.ok) {
						throw new Error(`HTTP ${response.status}: ${response.statusText}`);
					}

					created++;
					importProgress.value++;
				} catch (error) {
					console.error('Error importing transaction:', error);
					results.errors.push(`Transaction import error: ${error.message}`);
				}
			}

			results.transactions = {created};
		}

		// Create/update monthly statement
		if (importOptions.value.monthlyStatement) {
			try {
				const beginningBalance = balanceData.value.find((b) => b.SubType === 'Beginning')?.Amount || 0;
				const endingBalance = balanceData.value.find((b) => b.SubType === 'Ending')?.Amount || 0;

				const statementData = {
					fiscal_year: selectedFiscalYear.value,
					account_id: selectedAccount.value.id,
					statement_month: selectedMonth.value,
					beginning_balance: parseFloat(beginningBalance),
					ending_balance: parseFloat(endingBalance),
					reconciled: false,
					status: 'published',
				};

				// Try to find existing statement
				const checkUrl = `${directusUrl}/items/monthly_statements?filter[fiscal_year][_eq]=${selectedFiscalYear.value}&filter[account_id][_eq]=${selectedAccount.value.id}&filter[statement_month][_eq]=${selectedMonth.value}`;
				const checkResponse = await fetch(checkUrl, {headers: getAuthHeaders()});

				if (checkResponse.ok) {
					const checkData = await checkResponse.json();
					const existingStatements = checkData.data || [];

					if (existingStatements.length > 0) {
						// Update existing
						const updateResponse = await fetch(`${directusUrl}/items/monthly_statements/${existingStatements[0].id}`, {
							method: 'PATCH',
							headers: getAuthHeaders(),
							body: JSON.stringify(statementData),
						});
						if (updateResponse.ok) {
							results.statement = {action: 'updated'};
						}
					} else {
						// Create new
						const createResponse = await fetch(`${directusUrl}/items/monthly_statements`, {
							method: 'POST',
							headers: getAuthHeaders(),
							body: JSON.stringify(statementData),
						});
						if (createResponse.ok) {
							results.statement = {action: 'created'};
						}
					}
				}

				importProgress.value++;
			} catch (error) {
				console.error('Error with monthly statement:', error);
				results.errors.push(`Statement error: ${error.message}`);
			}
		}

		// Generate violation report
		if (importOptions.value.violations && violationCount.value > 0) {
			try {
				const totalViolationAmount = transactionData.value
					.filter((t) => detectViolation(t).isViolation)
					.reduce((sum, t) => sum + parseFloat(t.Amount || 0), 0);

				const reportData = {
					fiscal_year: selectedFiscalYear.value,
					report_month: selectedMonth.value,
					violation_count: violationCount.value,
					total_violation_amount: totalViolationAmount,
					compliance_status: violationCount.value > 5 ? 'critical_violations' : 'minor_issues',
					board_actions_required: `${violationCount.value} fund segregation violations detected from CSV import. Review transfers between accounts.`,
					status: 'published',
				};

				// Try to find existing report
				const checkUrl = `${directusUrl}/items/violation_reports?filter[fiscal_year][_eq]=${selectedFiscalYear.value}&filter[report_month][_eq]=${selectedMonth.value}`;
				const checkResponse = await fetch(checkUrl, {headers: getAuthHeaders()});

				if (checkResponse.ok) {
					const checkData = await checkResponse.json();
					const existingReports = checkData.data || [];

					if (existingReports.length > 0) {
						// Update existing
						const updateResponse = await fetch(`${directusUrl}/items/violation_reports/${existingReports[0].id}`, {
							method: 'PATCH',
							headers: getAuthHeaders(),
							body: JSON.stringify(reportData),
						});
						if (updateResponse.ok) {
							results.violations = {action: 'updated'};
						}
					} else {
						// Create new
						const createResponse = await fetch(`${directusUrl}/items/violation_reports`, {
							method: 'POST',
							headers: getAuthHeaders(),
							body: JSON.stringify(reportData),
						});
						if (createResponse.ok) {
							results.violations = {action: 'created'};
						}
					}
				}

				importProgress.value++;
			} catch (error) {
				console.error('Error with violation report:', error);
				results.errors.push(`Violation report error: ${error.message}`);
			}
		}
	} catch (error) {
		console.error('Import error:', error);
		results.success = false;
		results.errors.push(`General import error: ${error.message}`);
	} finally {
		isImporting.value = false;
		importResults.value = results;
	}
};

// Load reference data on mount
onMounted(async () => {
	try {
		// Load accounts using fetch API with authentication
		console.log('Loading accounts and budget categories...');

		const authHeaders = getAuthHeaders();

		// Try direct API calls to your Directus instance with auth
		const accountsUrl = `${directusUrl}/items/accounts?filter[status][_eq]=published&sort=account_number`;
		const categoriesUrl = `${directusUrl}/items/budget_categories?filter[status][_eq]=published&filter[fiscal_year][_eq]=2025&sort=category_name`;

		const [accountsResponse, categoriesResponse] = await Promise.all([
			fetch(accountsUrl, {headers: authHeaders}),
			fetch(categoriesUrl, {headers: authHeaders}),
		]);

		if (accountsResponse.ok) {
			const accountsData = await accountsResponse.json();
			accounts.value = accountsData.data || [];
			console.log('Loaded accounts:', accounts.value.length);
		} else {
			console.error('Failed to load accounts:', accountsResponse.status, accountsResponse.statusText);
			// Fallback with hardcoded accounts based on your Directus data
			accounts.value = [
				{
					id: 1,
					account_number: '5129',
					account_name: 'Operating Account',
					account_type: 'operating',
					description: 'Chase Business Complete Checking - Day-to-day operational expenses',
				},
				{
					id: 2,
					account_number: '7011',
					account_name: 'Reserve Account',
					account_type: 'reserve',
					description: 'Chase Business Total Savings - General reserves',
				},
				{
					id: 3,
					account_number: '5872',
					account_name: '40-Year Special Assessment',
					account_type: 'special',
					description: 'Chase Business Total Savings - 40-year recertification project only',
				},
			];
		}

		if (categoriesResponse.ok) {
			const categoriesData = await categoriesResponse.json();
			budgetCategories.value = categoriesData.data || [];
			console.log('Loaded budget categories:', budgetCategories.value.length);
		} else {
			console.error('Failed to load budget categories:', categoriesResponse.status, categoriesResponse.statusText);
			// Fallback with hardcoded categories based on your Directus data
			budgetCategories.value = [
				{id: 1, category_name: 'Insurance', fiscal_year: 2025},
				{id: 2, category_name: 'Professional', fiscal_year: 2025},
				{id: 3, category_name: 'Utilities', fiscal_year: 2025},
				{id: 4, category_name: 'Maintenance', fiscal_year: 2025},
				{id: 5, category_name: 'Regulatory', fiscal_year: 2025},
				{id: 6, category_name: 'Banking', fiscal_year: 2025},
				{id: 7, category_name: 'Revenue', fiscal_year: 2025},
			];
		}
	} catch (error) {
		console.error('Error loading reference data:', error);
		// Use fallback data so the import can still work
		accounts.value = [
			{
				id: 1,
				account_number: '5129',
				account_name: 'Operating Account',
				account_type: 'operating',
				description: 'Chase Business Complete Checking - Day-to-day operational expenses',
			},
			{
				id: 2,
				account_number: '7011',
				account_name: 'Reserve Account',
				account_type: 'reserve',
				description: 'Chase Business Total Savings - General reserves',
			},
			{
				id: 3,
				account_number: '5872',
				account_name: '40-Year Special Assessment',
				account_type: 'special',
				description: 'Chase Business Total Savings - 40-year recertification project only',
			},
		];

		budgetCategories.value = [
			{id: 1, category_name: 'Insurance', fiscal_year: 2025},
			{id: 2, category_name: 'Professional', fiscal_year: 2025},
			{id: 3, category_name: 'Utilities', fiscal_year: 2025},
			{id: 4, category_name: 'Maintenance', fiscal_year: 2025},
			{id: 5, category_name: 'Regulatory', fiscal_year: 2025},
			{id: 6, category_name: 'Banking', fiscal_year: 2025},
			{id: 7, category_name: 'Revenue', fiscal_year: 2025},
		];
	}
});
</script>
