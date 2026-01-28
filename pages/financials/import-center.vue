<template>
	<div class="max-w-7xl mx-auto p-6 space-y-6">
		<!-- Permission Denied -->
		<div v-if="!canReadFinancials" class="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
			<Icon name="i-heroicons-lock-closed" class="w-12 h-12 text-red-400 mx-auto mb-4" />
			<h2 class="text-xl font-semibold text-red-800 mb-2">Access Denied</h2>
			<p class="text-red-600">You do not have permission to access financial import tools.</p>
		</div>

		<template v-if="canReadFinancials">
		<!-- Header -->
		<div class="bg-white rounded-lg shadow-sm border p-6">
			<h1 class="text-3xl font-bold text-gray-900 mb-2 uppercase tracking-wider">Financial Import Center</h1>
			<p class="text-gray-600">
				Import budgets, bank statements, and transactions. Manage bank accounts and fiscal year assignments.
			</p>
		</div>

		<!-- Tab Navigation -->
		<div class="border-b border-gray-200">
			<nav class="-mb-px flex space-x-1">
				<button
					v-for="tab in visibleTabs"
					:key="tab.id"
					@click="activeTab = tab.id"
					:class="[
						'py-3 px-6 text-sm font-medium border-b-2 transition-all duration-200 uppercase tracking-wide',
						activeTab === tab.id
							? 'border-blue-500 text-blue-600 bg-blue-50'
							: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
					]">
					<div class="flex items-center gap-2">
						<Icon :name="tab.icon" class="w-5 h-5" />
						{{ tab.label }}
					</div>
				</button>
			</nav>
		</div>

		<!-- ==================== -->
		<!-- TAB: Bank Accounts   -->
		<!-- ==================== -->
		<div v-if="activeTab === 'accounts'" class="space-y-6">
			<!-- Create Account Form -->
			<div class="bg-white rounded-lg shadow-sm border">
				<div class="border-b px-6 py-4 flex items-center justify-between">
					<h2 class="text-xl font-semibold text-gray-900">Bank Accounts</h2>
					<button
						v-if="canCreateFinancials"
						@click="showCreateAccount = !showCreateAccount"
						class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm">
						{{ showCreateAccount ? 'Cancel' : '+ Create Account' }}
					</button>
				</div>

				<!-- Create Form -->
				<div v-if="showCreateAccount" class="p-6 bg-blue-50 border-b">
					<h3 class="text-lg font-medium text-gray-900 mb-4">New Bank Account</h3>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
							<input
								v-model="newAccount.account_name"
								type="text"
								placeholder="e.g., Operating Account"
								class="w-full border rounded-lg px-3 py-2 text-sm" />
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
							<input
								v-model="newAccount.account_number"
								type="text"
								placeholder="e.g., 5129"
								class="w-full border rounded-lg px-3 py-2 text-sm" />
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
							<select v-model="newAccount.account_type" class="w-full border rounded-lg px-3 py-2 text-sm">
								<option value="operating">Operating</option>
								<option value="reserve">Reserve</option>
								<option value="special">Special Assessment</option>
							</select>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">Color</label>
							<input v-model="newAccount.color" type="color" class="w-16 h-10 rounded border" />
						</div>
						<div class="md:col-span-2">
							<label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
							<input
								v-model="newAccount.description"
								type="text"
								placeholder="Account description"
								class="w-full border rounded-lg px-3 py-2 text-sm" />
						</div>
					</div>
					<div class="mt-4">
						<button
							@click="createAccount"
							:disabled="!newAccount.account_name || !newAccount.account_number || accountSaving"
							class="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 text-sm">
							{{ accountSaving ? 'Creating...' : 'Create Account' }}
						</button>
					</div>
				</div>

				<!-- Accounts List -->
				<div class="p-6">
					<div v-if="accountsLoading" class="text-center py-8">
						<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
						<p class="text-gray-500 text-sm">Loading accounts...</p>
					</div>
					<div v-else-if="accounts.length === 0" class="text-center py-8 text-gray-500">
						No accounts found. Create one above.
					</div>
					<div v-else class="space-y-3">
						<div
							v-for="account in accounts"
							:key="account.id"
							class="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
							<div class="flex items-center gap-4">
								<div class="w-4 h-4 rounded-full" :style="{ backgroundColor: account.color || '#6B7280' }"></div>
								<div>
									<p class="font-medium text-gray-900">{{ account.account_name }}</p>
									<p class="text-sm text-gray-500">#{{ account.account_number }} &middot; {{ account.account_type }}</p>
								</div>
							</div>
							<span class="text-xs text-gray-400 uppercase">{{ account.description || '' }}</span>
						</div>
					</div>
				</div>
			</div>

			<!-- Fiscal Years Management -->
			<div class="bg-white rounded-lg shadow-sm border">
				<div class="border-b px-6 py-4 flex items-center justify-between">
					<div>
						<h2 class="text-xl font-semibold text-gray-900">Fiscal Years</h2>
						<p class="text-sm text-gray-500 mt-1">
							Fiscal years are required before importing budgets or transactions. Each financial record references a fiscal year via M2O relationship.
						</p>
					</div>
					<button
						v-if="canCreateFinancials"
						@click="showCreateFiscalYear = !showCreateFiscalYear"
						class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm whitespace-nowrap">
						{{ showCreateFiscalYear ? 'Cancel' : '+ Add Fiscal Year' }}
					</button>
				</div>

				<!-- Create Fiscal Year Form -->
				<div v-if="showCreateFiscalYear" class="p-6 bg-blue-50 border-b">
					<h3 class="text-lg font-medium text-gray-900 mb-4">New Fiscal Year</h3>
					<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">Year</label>
							<input
								v-model.number="newFiscalYear.year"
								type="number"
								min="2020"
								max="2050"
								placeholder="e.g., 2026"
								class="w-full border rounded-lg px-3 py-2 text-sm" />
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
							<input
								v-model="newFiscalYear.start_date"
								type="date"
								class="w-full border rounded-lg px-3 py-2 text-sm" />
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
							<select v-model="newFiscalYear.status" class="w-full border rounded-lg px-3 py-2 text-sm">
								<option value="published">Published (Active)</option>
								<option value="draft">Draft</option>
								<option value="archived">Archived</option>
							</select>
						</div>
					</div>
					<div v-if="newFiscalYear.year && fiscalYearExists(newFiscalYear.year)" class="mt-3 text-sm text-yellow-700 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
						A fiscal year record for {{ newFiscalYear.year }} already exists.
					</div>
					<div class="mt-4">
						<button
							@click="createFiscalYear"
							:disabled="!newFiscalYear.year || !newFiscalYear.start_date || fiscalYearSaving || fiscalYearExists(newFiscalYear.year)"
							class="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 text-sm">
							{{ fiscalYearSaving ? 'Creating...' : 'Create Fiscal Year' }}
						</button>
					</div>
				</div>

				<!-- Fiscal Years List -->
				<div class="p-6">
					<div v-if="fiscalYearsLoading" class="text-center py-8">
						<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
						<p class="text-gray-500 text-sm">Loading fiscal years...</p>
					</div>
					<div v-else-if="allFiscalYears.length === 0" class="text-center py-8 text-gray-500">
						No fiscal years found. Create one to start importing financial data.
					</div>
					<div v-else class="space-y-3">
						<div
							v-for="fy in allFiscalYears"
							:key="fy.id"
							class="flex items-center justify-between p-4 rounded-lg border"
							:class="fy.status === 'published' ? 'bg-green-50 border-green-200' : fy.status === 'archived' ? 'bg-gray-100 border-gray-300' : 'bg-yellow-50 border-yellow-200'">
							<div class="flex items-center gap-4">
								<div class="text-2xl font-bold" :class="fy.status === 'published' ? 'text-green-700' : fy.status === 'archived' ? 'text-gray-500' : 'text-yellow-700'">
									{{ fy.year }}
								</div>
								<div>
									<p class="text-sm text-gray-600">
										Start: {{ fy.start_date || 'Not set' }}
									</p>
									<p class="text-xs text-gray-400">
										Record ID: {{ fy.id }}
									</p>
								</div>
							</div>
							<div class="flex items-center gap-3">
								<span
									class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium"
									:class="{
										'bg-green-100 text-green-800': fy.status === 'published',
										'bg-yellow-100 text-yellow-800': fy.status === 'draft',
										'bg-gray-200 text-gray-600': fy.status === 'archived',
									}">
									{{ fy.status }}
								</span>
								<!-- Status toggle for admins -->
								<select
									v-if="canUpdateFinancials"
									:value="fy.status"
									@change="updateFiscalYearStatus(fy.id, ($event.target as HTMLSelectElement).value)"
									class="border rounded px-2 py-1 text-xs">
									<option value="published">Published</option>
									<option value="draft">Draft</option>
									<option value="archived">Archived</option>
								</select>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- ==================== -->
		<!-- TAB: Budget Import   -->
		<!-- ==================== -->
		<div v-if="activeTab === 'budgets'" class="space-y-6">
			<div class="bg-white rounded-lg shadow-sm border">
				<div class="border-b px-6 py-4">
					<h2 class="text-xl font-semibold text-gray-900">Import Budget from CSV</h2>
					<p class="text-sm text-gray-500 mt-1">
						Upload a budget CSV file to create or update budget categories and line items.
					</p>
				</div>
				<div class="p-6 space-y-6">
					<!-- Fiscal Year Selection -->
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">Fiscal Year</label>
							<select v-model="budgetFiscalYear" class="w-full border rounded-lg px-3 py-2 text-sm">
								<option v-for="fy in availableFiscalYears" :key="fy.id" :value="fy.year">
									{{ fy.year }}{{ fy.is_current ? ' (Current)' : '' }}
								</option>
							</select>
							<p class="text-xs text-gray-400 mt-1">
								Budget items will be linked to this fiscal year record in Directus.
							</p>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">Target Account</label>
							<select v-model="budgetAccountId" class="w-full border rounded-lg px-3 py-2 text-sm">
								<option value="">All Accounts (Operating Budget)</option>
								<option v-for="account in accounts" :key="account.id" :value="account.id">
									{{ account.account_name }} ({{ account.account_number }})
								</option>
							</select>
						</div>
					</div>

					<!-- File Upload -->
					<div
						class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors"
						:class="{ 'border-blue-500 bg-blue-50': budgetDragging }"
						@dragover.prevent="budgetDragging = true"
						@dragleave.prevent="budgetDragging = false"
						@drop.prevent="handleBudgetDrop">
						<input ref="budgetFileInput" type="file" accept=".csv" @change="handleBudgetFileSelect" class="hidden" />

						<div v-if="!budgetFile">
							<Icon name="i-heroicons-document-arrow-up" class="w-12 h-12 text-gray-400 mx-auto mb-4" />
							<p class="text-lg text-gray-600 mb-2">Drop your budget CSV file here</p>
							<p class="text-sm text-gray-500 mb-4">
								CSV format matching public/data/2025 Operating Budget.csv
							</p>
							<button
								@click="$refs.budgetFileInput.click()"
								class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
								Choose File
							</button>
						</div>
						<div v-else class="text-green-600">
							<Icon name="i-heroicons-check-circle" class="w-12 h-12 mx-auto mb-4" />
							<p class="text-lg font-semibold">{{ budgetFile.name }}</p>
							<p class="text-sm text-gray-500">{{ (budgetFile.size / 1024).toFixed(1) }} KB</p>
							<button @click="clearBudgetFile" class="mt-2 text-red-600 hover:text-red-800 text-sm">
								Remove file
							</button>
						</div>
					</div>

					<!-- Parse & Preview -->
					<div v-if="budgetFile" class="text-center">
						<button
							@click="parseBudgetCSV"
							:disabled="budgetParsing"
							class="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50">
							{{ budgetParsing ? 'Parsing...' : 'Parse Budget CSV' }}
						</button>
					</div>

					<!-- Budget Preview -->
					<div v-if="budgetPreview.length > 0" class="space-y-4">
						<div class="bg-green-50 p-4 rounded-lg border border-green-200">
							<h3 class="font-semibold text-green-800">
								Parsed {{ budgetPreview.length }} budget line items
							</h3>
							<p class="text-sm text-green-600">
								Fiscal Year: {{ budgetFiscalYear }} (Directus record ID: {{ resolvedBudgetFiscalYearId || 'resolving...' }})
							</p>
						</div>

						<div class="overflow-x-auto">
							<table class="min-w-full divide-y divide-gray-200 text-sm">
								<thead class="bg-gray-50">
									<tr>
										<th class="px-4 py-2 text-left font-medium text-gray-500 uppercase text-xs">Category</th>
										<th class="px-4 py-2 text-left font-medium text-gray-500 uppercase text-xs">Description</th>
										<th class="px-4 py-2 text-right font-medium text-gray-500 uppercase text-xs">Monthly</th>
										<th class="px-4 py-2 text-right font-medium text-gray-500 uppercase text-xs">Yearly</th>
									</tr>
								</thead>
								<tbody class="divide-y divide-gray-200">
									<tr v-for="(item, idx) in budgetPreview.slice(0, 25)" :key="idx">
										<td class="px-4 py-2 text-gray-600">{{ item.category }}</td>
										<td class="px-4 py-2 text-gray-900">{{ item.description }}</td>
										<td class="px-4 py-2 text-right font-mono">${{ item.monthly_budget?.toLocaleString() || '0' }}</td>
										<td class="px-4 py-2 text-right font-mono">${{ item.yearly_budget?.toLocaleString() || '0' }}</td>
									</tr>
								</tbody>
							</table>
							<p v-if="budgetPreview.length > 25" class="text-sm text-gray-500 text-center mt-2">
								Showing 25 of {{ budgetPreview.length }} items
							</p>
						</div>

						<div class="text-center">
							<button
								v-if="canCreateFinancials"
								@click="importBudget"
								:disabled="budgetImporting || !resolvedBudgetFiscalYearId"
								class="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
								{{ budgetImporting ? `Importing... (${budgetImportProgress}/${budgetPreview.length})` : 'Import Budget Data' }}
							</button>
							<p v-else class="text-sm text-red-600">You need financials create permission to import budgets.</p>
						</div>
					</div>

					<!-- Budget Import Results -->
					<div v-if="budgetImportResults" class="p-4 rounded-lg border" :class="budgetImportResults.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'">
						<h3 :class="budgetImportResults.success ? 'text-green-800' : 'text-red-800'" class="font-semibold">
							{{ budgetImportResults.success ? 'Budget Import Complete' : 'Import Failed' }}
						</h3>
						<p class="text-sm mt-1" :class="budgetImportResults.success ? 'text-green-600' : 'text-red-600'">
							{{ budgetImportResults.message }}
						</p>
					</div>
				</div>
			</div>
		</div>

		<!-- ======================== -->
		<!-- TAB: Statement Import    -->
		<!-- ======================== -->
		<div v-if="activeTab === 'statements'" class="space-y-6">
			<div class="bg-white rounded-lg shadow-sm border">
				<div class="border-b px-6 py-4">
					<h2 class="text-xl font-semibold text-gray-900">Import Bank Statement</h2>
					<p class="text-sm text-gray-500 mt-1">
						Upload a PDF bank statement, a JSON transaction file, or a CSV statement export.
					</p>
				</div>
				<div class="p-6 space-y-6">
					<!-- Configuration Row -->
					<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">Account</label>
							<select v-model="stmtAccountId" class="w-full border rounded-lg px-3 py-2 text-sm">
								<option value="">Select Account</option>
								<option v-for="account in accounts" :key="account.id" :value="account.id">
									{{ account.account_name }} ({{ account.account_number }})
								</option>
							</select>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">
								Fiscal Year
								<span v-if="stmtDetectedYear" class="text-green-600 text-xs ml-1">(auto-detected: {{ stmtDetectedYear }})</span>
							</label>
							<select v-model="stmtFiscalYear" class="w-full border rounded-lg px-3 py-2 text-sm">
								<option v-for="fy in availableFiscalYears" :key="fy.id" :value="fy.year">
									{{ fy.year }}{{ fy.is_current ? ' (Current)' : '' }}
								</option>
							</select>
							<p class="text-xs text-gray-400 mt-1">
								{{ stmtDetectedYear ? 'Detected from transaction dates. You can override.' : 'Select or let auto-detect from file.' }}
							</p>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">
								Statement Month
								<span v-if="stmtDetectedMonth" class="text-green-600 text-xs ml-1">(auto-detected)</span>
							</label>
							<select v-model="stmtMonth" class="w-full border rounded-lg px-3 py-2 text-sm">
								<option value="">Auto-detect from file</option>
								<option v-for="month in monthOptions" :key="month.value" :value="month.value">
									{{ month.label }}
								</option>
							</select>
						</div>
					</div>

					<!-- File Type Selector -->
					<div class="flex gap-4">
						<button
							v-for="ft in fileTypes"
							:key="ft.id"
							@click="stmtFileType = ft.id"
							:class="[
								'flex-1 p-4 rounded-lg border-2 transition-all text-center',
								stmtFileType === ft.id
									? 'border-blue-500 bg-blue-50'
									: 'border-gray-200 hover:border-gray-300',
							]">
							<Icon :name="ft.icon" class="w-8 h-8 mx-auto mb-2" :class="stmtFileType === ft.id ? 'text-blue-600' : 'text-gray-400'" />
							<p class="font-medium text-sm" :class="stmtFileType === ft.id ? 'text-blue-700' : 'text-gray-700'">{{ ft.label }}</p>
							<p class="text-xs text-gray-500 mt-1">{{ ft.description }}</p>
						</button>
					</div>

					<!-- PDF Upload -->
					<div v-if="stmtFileType === 'pdf'" class="space-y-4">
						<div
							class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors"
							:class="{ 'border-blue-500 bg-blue-50': stmtDragging }"
							@dragover.prevent="stmtDragging = true"
							@dragleave.prevent="stmtDragging = false"
							@drop.prevent="handleStmtDrop">
							<input ref="stmtFileInput" type="file" accept=".pdf" @change="handleStmtFileSelect" class="hidden" />

							<div v-if="!stmtFile">
								<Icon name="i-heroicons-document" class="w-12 h-12 text-gray-400 mx-auto mb-4" />
								<p class="text-lg text-gray-600 mb-2">Drop your PDF bank statement here</p>
								<p class="text-sm text-gray-500 mb-4">
									The PDF will be uploaded and stored. You'll then need to provide a JSON version of the transactions.
								</p>
								<button
									@click="$refs.stmtFileInput.click()"
									class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
									Choose PDF
								</button>
							</div>
							<div v-else class="text-green-600">
								<Icon name="i-heroicons-check-circle" class="w-12 h-12 mx-auto mb-4" />
								<p class="text-lg font-semibold">{{ stmtFile.name }}</p>
								<p class="text-sm text-gray-500">{{ (stmtFile.size / 1024).toFixed(1) }} KB</p>
								<button @click="clearStmtFile" class="mt-2 text-red-600 hover:text-red-800 text-sm">
									Remove file
								</button>
							</div>
						</div>

						<div v-if="stmtFile" class="text-center">
							<button
								@click="uploadPdf"
								:disabled="stmtUploading"
								class="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50">
								{{ stmtUploading ? 'Uploading...' : 'Upload PDF Statement' }}
							</button>
						</div>

						<!-- PDF Upload Result -->
						<div v-if="pdfUploadResult" class="p-4 bg-blue-50 rounded-lg border border-blue-200">
							<h3 class="font-semibold text-blue-800">PDF Uploaded Successfully</h3>
							<p class="text-sm text-blue-600 mt-1">{{ pdfUploadResult.message }}</p>
							<p class="text-sm text-blue-600 mt-2">
								Now upload a JSON file with the extracted transactions, or paste JSON below.
							</p>
							<div class="mt-4">
								<label class="block text-sm font-medium text-gray-700 mb-1">Paste Transaction JSON</label>
								<textarea
									v-model="pastedJson"
									rows="8"
									placeholder='[{"date":"01/02","description":"Remote Deposit","amount":2300,"type":"deposit","vendor":"Multiple Units"}]'
									class="w-full border rounded-lg px-3 py-2 text-sm font-mono"></textarea>
								<button
									@click="parseJsonFromPaste"
									:disabled="!pastedJson.trim()"
									class="mt-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm">
									Parse Pasted JSON
								</button>
							</div>
						</div>
					</div>

					<!-- JSON Upload -->
					<div v-if="stmtFileType === 'json'" class="space-y-4">
						<div
							class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors"
							:class="{ 'border-blue-500 bg-blue-50': stmtDragging }"
							@dragover.prevent="stmtDragging = true"
							@dragleave.prevent="stmtDragging = false"
							@drop.prevent="handleStmtDrop">
							<input ref="stmtFileInput" type="file" accept=".json" @change="handleStmtFileSelect" class="hidden" />

							<div v-if="!stmtFile">
								<Icon name="i-heroicons-code-bracket" class="w-12 h-12 text-gray-400 mx-auto mb-4" />
								<p class="text-lg text-gray-600 mb-2">Drop your JSON transaction file here</p>
								<p class="text-sm text-gray-500 mb-4">
									JSON array of transactions or object with "transactions" array
								</p>
								<button
									@click="$refs.stmtFileInput.click()"
									class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
									Choose JSON File
								</button>
							</div>
							<div v-else class="text-green-600">
								<Icon name="i-heroicons-check-circle" class="w-12 h-12 mx-auto mb-4" />
								<p class="text-lg font-semibold">{{ stmtFile.name }}</p>
								<p class="text-sm text-gray-500">{{ (stmtFile.size / 1024).toFixed(1) }} KB</p>
								<button @click="clearStmtFile" class="mt-2 text-red-600 hover:text-red-800 text-sm">
									Remove file
								</button>
							</div>
						</div>

						<div v-if="stmtFile" class="text-center">
							<button
								@click="parseStmtFile"
								:disabled="stmtParsing"
								class="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50">
								{{ stmtParsing ? 'Parsing...' : 'Parse JSON File' }}
							</button>
						</div>

						<!-- Or paste JSON -->
						<div class="text-center text-gray-400 text-sm">- or paste JSON directly -</div>
						<div>
							<textarea
								v-model="pastedJson"
								rows="6"
								placeholder='{"beginning_balance":46086.55,"ending_balance":64114.11,"statement_period":"January 2025","transactions":[{"date":"01/02","description":"Remote Deposit","amount":2300,"type":"deposit"}]}'
								class="w-full border rounded-lg px-3 py-2 text-sm font-mono"></textarea>
							<button
								@click="parseJsonFromPaste"
								:disabled="!pastedJson.trim()"
								class="mt-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm">
								Parse Pasted JSON
							</button>
						</div>
					</div>

					<!-- CSV Upload -->
					<div v-if="stmtFileType === 'csv'" class="space-y-4">
						<div
							class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors"
							:class="{ 'border-blue-500 bg-blue-50': stmtDragging }"
							@dragover.prevent="stmtDragging = true"
							@dragleave.prevent="stmtDragging = false"
							@drop.prevent="handleStmtDrop">
							<input ref="stmtFileInput" type="file" accept=".csv" @change="handleStmtFileSelect" class="hidden" />

							<div v-if="!stmtFile">
								<Icon name="i-heroicons-table-cells" class="w-12 h-12 text-gray-400 mx-auto mb-4" />
								<p class="text-lg text-gray-600 mb-2">Drop your CSV bank statement here</p>
								<p class="text-sm text-gray-500 mb-4">
									Same format as public/data/reconciliation CSVs
								</p>
								<button
									@click="$refs.stmtFileInput.click()"
									class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
									Choose CSV File
								</button>
							</div>
							<div v-else class="text-green-600">
								<Icon name="i-heroicons-check-circle" class="w-12 h-12 mx-auto mb-4" />
								<p class="text-lg font-semibold">{{ stmtFile.name }}</p>
								<p class="text-sm text-gray-500">{{ (stmtFile.size / 1024).toFixed(1) }} KB</p>
								<button @click="clearStmtFile" class="mt-2 text-red-600 hover:text-red-800 text-sm">
									Remove file
								</button>
							</div>
						</div>

						<div v-if="stmtFile" class="text-center">
							<button
								@click="parseStmtFile"
								:disabled="stmtParsing"
								class="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50">
								{{ stmtParsing ? 'Parsing...' : 'Parse CSV File' }}
							</button>
						</div>
					</div>

					<!-- ======================== -->
					<!-- Transaction Preview      -->
					<!-- ======================== -->
					<div v-if="stmtTransactions.length > 0" class="space-y-4">
						<!-- Summary -->
						<div class="grid grid-cols-2 md:grid-cols-5 gap-4">
							<div class="bg-gray-50 p-4 rounded-lg text-center">
								<p class="text-xs text-gray-500 uppercase">Transactions</p>
								<p class="text-2xl font-bold text-gray-900">{{ stmtTransactions.length }}</p>
							</div>
							<div class="bg-green-50 p-4 rounded-lg text-center">
								<p class="text-xs text-green-600 uppercase">Deposits</p>
								<p class="text-2xl font-bold text-green-700">
									${{ stmtTotalDeposits.toLocaleString(undefined, { minimumFractionDigits: 2 }) }}
								</p>
							</div>
							<div class="bg-red-50 p-4 rounded-lg text-center">
								<p class="text-xs text-red-600 uppercase">Withdrawals</p>
								<p class="text-2xl font-bold text-red-700">
									${{ stmtTotalWithdrawals.toLocaleString(undefined, { minimumFractionDigits: 2 }) }}
								</p>
							</div>
							<div class="bg-blue-50 p-4 rounded-lg text-center">
								<p class="text-xs text-blue-600 uppercase">Fiscal Year</p>
								<p class="text-2xl font-bold text-blue-700">{{ stmtFiscalYear }}</p>
								<p class="text-xs text-blue-400">ID: {{ resolvedStmtFiscalYearId || '...' }}</p>
							</div>
							<div class="bg-purple-50 p-4 rounded-lg text-center">
								<p class="text-xs text-purple-600 uppercase">Balance</p>
								<p class="text-sm font-bold text-purple-700" v-if="stmtBeginningBalance != null">
									Begin: ${{ stmtBeginningBalance.toLocaleString(undefined, { minimumFractionDigits: 2 }) }}
								</p>
								<p class="text-sm font-bold text-purple-700" v-if="stmtEndingBalance != null">
									End: ${{ stmtEndingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 }) }}
								</p>
							</div>
						</div>

						<!-- Preview Table -->
						<div class="overflow-x-auto">
							<table class="min-w-full divide-y divide-gray-200 text-sm">
								<thead class="bg-gray-50">
									<tr>
										<th class="px-4 py-2 text-left font-medium text-gray-500 uppercase text-xs">Date</th>
										<th class="px-4 py-2 text-left font-medium text-gray-500 uppercase text-xs">Type</th>
										<th class="px-4 py-2 text-left font-medium text-gray-500 uppercase text-xs">Description</th>
										<th class="px-4 py-2 text-left font-medium text-gray-500 uppercase text-xs">Vendor</th>
										<th class="px-4 py-2 text-right font-medium text-gray-500 uppercase text-xs">Amount</th>
										<th class="px-4 py-2 text-left font-medium text-gray-500 uppercase text-xs">Category</th>
									</tr>
								</thead>
								<tbody class="divide-y divide-gray-200">
									<tr v-for="(tx, idx) in stmtTransactions.slice(0, 30)" :key="idx">
										<td class="px-4 py-2 text-gray-900 whitespace-nowrap">{{ formatTransactionDate(tx.date) }}</td>
										<td class="px-4 py-2 whitespace-nowrap">
											<span
												class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium"
												:class="getTypeClass(tx.type)">
												{{ tx.type }}
											</span>
										</td>
										<td class="px-4 py-2 text-gray-900 max-w-xs truncate" :title="tx.description">
											{{ tx.description }}
										</td>
										<td class="px-4 py-2 text-gray-600 whitespace-nowrap">{{ tx.vendor || '-' }}</td>
										<td
											class="px-4 py-2 text-right font-mono whitespace-nowrap"
											:class="tx.type === 'deposit' ? 'text-green-600' : 'text-red-600'">
											${{ tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 }) }}
										</td>
										<td class="px-4 py-2 text-gray-600 whitespace-nowrap">{{ tx.category || '-' }}</td>
									</tr>
								</tbody>
							</table>
							<p v-if="stmtTransactions.length > 30" class="text-sm text-gray-500 text-center mt-2">
								Showing 30 of {{ stmtTransactions.length }} transactions
							</p>
						</div>

						<!-- Import Button -->
						<div class="text-center space-y-3">
							<div v-if="!stmtAccountId" class="text-sm text-yellow-600 bg-yellow-50 p-3 rounded-lg">
								Please select a target account above before importing.
							</div>
							<div v-if="!canCreateFinancials" class="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
								You need financials create permission to import transactions.
							</div>
							<button
								v-if="canCreateFinancials"
								@click="importTransactions"
								:disabled="stmtImporting || !stmtAccountId || !resolvedStmtFiscalYearId"
								class="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
								<span v-if="stmtImporting">
									Importing... ({{ stmtImportProgress }}/{{ stmtTransactions.length }})
								</span>
								<span v-else>
									Import {{ stmtTransactions.length }} Transactions to {{ selectedAccountName }}
								</span>
							</button>
						</div>
					</div>

					<!-- Statement Import Results -->
					<div v-if="stmtImportResults" class="p-4 rounded-lg border" :class="stmtImportResults.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'">
						<h3 :class="stmtImportResults.success ? 'text-green-800' : 'text-red-800'" class="font-semibold">
							{{ stmtImportResults.success ? 'Transaction Import Complete' : 'Import Failed' }}
						</h3>
						<ul class="text-sm mt-2 space-y-1" :class="stmtImportResults.success ? 'text-green-600' : 'text-red-600'">
							<li v-if="stmtImportResults.created">{{ stmtImportResults.created }} transactions created</li>
							<li v-if="stmtImportResults.skipped">{{ stmtImportResults.skipped }} duplicates skipped</li>
							<li v-if="stmtImportResults.errors?.length">{{ stmtImportResults.errors.length }} errors</li>
						</ul>
						<div v-if="stmtImportResults.success" class="mt-4">
							<NuxtLink
								to="/financials"
								class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
								View Financial Dashboard
							</NuxtLink>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- ======================== -->
		<!-- TAB: Data Maintenance    -->
		<!-- ======================== -->
		<div v-if="activeTab === 'maintenance'" class="space-y-6">
			<div class="bg-white rounded-lg shadow-sm border">
				<div class="border-b px-6 py-4">
					<h2 class="text-xl font-semibold text-gray-900">Fiscal Year Data Repair</h2>
					<p class="text-sm text-gray-500 mt-1">
						Fix transactions that have raw year numbers instead of proper fiscal_years M2O record IDs.
						This repairs data from older imports that stored the year number (e.g., 2025) instead of the
						Directus fiscal_years record ID.
					</p>
				</div>
				<div class="p-6 space-y-6">
					<!-- Scan -->
					<div class="flex items-center gap-4">
						<button
							@click="scanFiscalYearIssues"
							:disabled="repairScanning"
							class="bg-yellow-600 text-white px-6 py-2 rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 text-sm">
							{{ repairScanning ? 'Scanning...' : 'Scan for Issues' }}
						</button>
						<p class="text-sm text-gray-500">
							Checks all transactions to identify records with incorrect fiscal_year values.
						</p>
					</div>

					<!-- Scan Results -->
					<div v-if="repairScanResults" class="space-y-4">
						<div class="p-4 rounded-lg border" :class="repairScanResults.issueCount > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'">
							<h3 :class="repairScanResults.issueCount > 0 ? 'text-yellow-800' : 'text-green-800'" class="font-semibold">
								{{ repairScanResults.issueCount > 0 ? `Found ${repairScanResults.issueCount} transactions to repair` : 'All transactions have correct fiscal year references' }}
							</h3>
							<ul class="text-sm mt-2 space-y-1" :class="repairScanResults.issueCount > 0 ? 'text-yellow-700' : 'text-green-700'">
								<li>Total transactions scanned: {{ repairScanResults.totalScanned }}</li>
								<li>Correct M2O references: {{ repairScanResults.correctCount }}</li>
								<li>Raw year numbers needing repair: {{ repairScanResults.issueCount }}</li>
								<li v-if="repairScanResults.yearBreakdown">
									Breakdown: {{ Object.entries(repairScanResults.yearBreakdown).map(([y, c]) => `${y}: ${c} transactions`).join(', ') }}
								</li>
							</ul>
						</div>

						<!-- Repair Button -->
						<div v-if="repairScanResults.issueCount > 0" class="flex items-center gap-4">
							<button
								v-if="canUpdateFinancials"
								@click="repairFiscalYears"
								:disabled="repairRunning"
								class="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 text-sm">
								{{ repairRunning ? `Repairing... (${repairProgress}/${repairScanResults.issueCount})` : `Repair ${repairScanResults.issueCount} Transactions` }}
							</button>
							<p v-if="!canUpdateFinancials" class="text-sm text-red-600">
								You need financials update permission to run repairs.
							</p>
						</div>

						<!-- Repair Results -->
						<div v-if="repairResults" class="p-4 rounded-lg border" :class="repairResults.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'">
							<h3 :class="repairResults.success ? 'text-green-800' : 'text-red-800'" class="font-semibold">
								{{ repairResults.success ? 'Repair Complete' : 'Repair Failed' }}
							</h3>
							<p class="text-sm mt-1" :class="repairResults.success ? 'text-green-600' : 'text-red-600'">
								{{ repairResults.message }}
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
		</template>
	</div>
</template>

<script setup>
definePageMeta({
	layout: 'default',
	middleware: ['auth'],
});

// ======================
// COMPOSABLES & STATE
// ======================
const transactionsCollection = useDirectusItems('transactions');
const accountsCollection = useDirectusItems('accounts');
const fiscalYearsCollection = useDirectusItems('fiscal_years');
const budgetCategoriesCollection = useDirectusItems('budget_categories');
const budgetItemsCollection = useDirectusItems('budget_items');
const fiscalYearBudgetsCollection = useDirectusItems('fiscal_year_budgets');

// Permission checks
const { canCreate, canRead, canUpdate, canDelete, hasFullAccess } = useUserPermissions();
const canReadFinancials = computed(() => canRead('financials'));
const canCreateFinancials = computed(() => canCreate('financials'));
const canUpdateFinancials = computed(() => canUpdate('financials'));
const canDeleteFinancials = computed(() => canDelete('financials'));

// Tab state - maintenance tab only visible to users with update permission
const allTabs = [
	{ id: 'accounts', label: 'Bank Accounts', icon: 'i-heroicons-building-library', requiresCreate: false },
	{ id: 'budgets', label: 'Budget Import', icon: 'i-heroicons-calculator', requiresCreate: true },
	{ id: 'statements', label: 'Statement Import', icon: 'i-heroicons-document-arrow-up', requiresCreate: true },
	{ id: 'maintenance', label: 'Data Maintenance', icon: 'i-heroicons-wrench-screwdriver', requiresUpdate: true },
];
const visibleTabs = computed(() =>
	allTabs.filter((tab) => {
		if (tab.requiresCreate && !canCreateFinancials.value) return false;
		if (tab.requiresUpdate && !canUpdateFinancials.value) return false;
		return true;
	})
);
const activeTab = ref('statements');

// ======================
// SHARED DATA
// ======================
const accounts = ref([]);
const accountsLoading = ref(true);
const availableFiscalYears = ref([]);
const fiscalYearIdCache = {};

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
];

const fileTypes = [
	{ id: 'pdf', label: 'PDF Statement', icon: 'i-heroicons-document', description: 'Upload PDF, then provide JSON' },
	{ id: 'json', label: 'JSON Transactions', icon: 'i-heroicons-code-bracket', description: 'Structured transaction data' },
	{ id: 'csv', label: 'CSV Statement', icon: 'i-heroicons-table-cells', description: 'Reconciliation CSV format' },
];

// ======================
// FISCAL YEAR RESOLUTION
// ======================
async function resolveFiscalYearId(yearNumber) {
	if (!yearNumber) return null;
	if (fiscalYearIdCache[yearNumber]) return fiscalYearIdCache[yearNumber];

	try {
		const data = await fiscalYearsCollection.list({
			filter: { year: { _eq: yearNumber } },
			fields: ['id'],
			limit: 1,
		});
		const id = data && data.length > 0 ? data[0].id : null;
		if (id) fiscalYearIdCache[yearNumber] = id;
		return id;
	} catch (err) {
		console.error('Failed to resolve fiscal year ID:', err);
		return null;
	}
}

/**
 * Detect fiscal year from an array of transaction dates.
 * Looks at MM/DD or YYYY-MM-DD formats and picks the most common year.
 */
function detectFiscalYearFromDates(transactions) {
	const yearCounts = {};

	for (const tx of transactions) {
		const dateStr = tx.date || tx.Date || '';
		let year = null;

		// Try YYYY-MM-DD
		const isoMatch = dateStr.match(/^(\d{4})-/);
		if (isoMatch) {
			year = parseInt(isoMatch[1]);
		}

		// Try MM/DD/YYYY
		const usMatch = dateStr.match(/\d{1,2}\/\d{1,2}\/(\d{4})/);
		if (!year && usMatch) {
			year = parseInt(usMatch[1]);
		}

		if (year && year > 2000 && year < 2100) {
			yearCounts[year] = (yearCounts[year] || 0) + 1;
		}
	}

	// Return most common year
	const entries = Object.entries(yearCounts);
	if (entries.length === 0) return null;
	entries.sort((a, b) => b[1] - a[1]);
	return parseInt(entries[0][0]);
}

/**
 * Detect month from transactions (MM/DD format or Period field).
 */
function detectMonthFromTransactions(transactions) {
	if (!transactions.length) return '';

	// Check for Period field
	const period = transactions[0]?.Period || transactions[0]?.period;
	if (period) {
		const monthNum = new Date(`${period} 1, 2025`).getMonth() + 1;
		if (!isNaN(monthNum)) return monthNum.toString().padStart(2, '0');
	}

	// Check date field
	const dateStr = transactions[0]?.date || transactions[0]?.Date || '';
	const parts = dateStr.split('/');
	if (parts.length >= 2) {
		const month = parseInt(parts[0]);
		if (month >= 1 && month <= 12) return month.toString().padStart(2, '0');
	}

	return '';
}

// ======================
// ACCOUNTS TAB
// ======================
const showCreateAccount = ref(false);
const accountSaving = ref(false);
const newAccount = ref({
	account_name: '',
	account_number: '',
	account_type: 'operating',
	color: '#3B82F6',
	description: '',
});

async function loadAccounts() {
	accountsLoading.value = true;
	try {
		accounts.value = await accountsCollection.list({
			filter: { status: { _eq: 'published' } },
			sort: ['account_number'],
			fields: ['id', 'account_name', 'account_number', 'account_type', 'color', 'description'],
		});
	} catch (err) {
		console.error('Failed to load accounts:', err);
		accounts.value = [];
	} finally {
		accountsLoading.value = false;
	}
}

async function createAccount() {
	accountSaving.value = true;
	try {
		const created = await accountsCollection.create({
			...newAccount.value,
			status: 'published',
		});
		accounts.value.push(created);
		showCreateAccount.value = false;
		newAccount.value = {
			account_name: '',
			account_number: '',
			account_type: 'operating',
			color: '#3B82F6',
			description: '',
		};
	} catch (err) {
		console.error('Failed to create account:', err);
		alert('Failed to create account: ' + (err.message || 'Unknown error'));
	} finally {
		accountSaving.value = false;
	}
}

// ======================
// FISCAL YEARS MANAGEMENT
// ======================
const showCreateFiscalYear = ref(false);
const fiscalYearSaving = ref(false);
const fiscalYearsLoading = ref(true);
const allFiscalYears = ref([]);
const newFiscalYear = ref({
	year: new Date().getFullYear() + 1,
	start_date: `${new Date().getFullYear() + 1}-01-01`,
	status: 'published',
});

function fiscalYearExists(year) {
	return allFiscalYears.value.some((fy) => fy.year === year);
}

async function loadAllFiscalYears() {
	fiscalYearsLoading.value = true;
	try {
		allFiscalYears.value = await fiscalYearsCollection.list({
			sort: ['-year'],
			fields: ['id', 'year', 'start_date', 'status'],
			limit: -1,
		});
	} catch (err) {
		console.error('Failed to load fiscal years:', err);
		allFiscalYears.value = [];
	} finally {
		fiscalYearsLoading.value = false;
	}
}

async function createFiscalYear() {
	if (!newFiscalYear.value.year || !newFiscalYear.value.start_date) return;
	if (fiscalYearExists(newFiscalYear.value.year)) return;

	fiscalYearSaving.value = true;
	try {
		const created = await fiscalYearsCollection.create({
			year: newFiscalYear.value.year,
			start_date: newFiscalYear.value.start_date,
			status: newFiscalYear.value.status,
		});
		allFiscalYears.value.unshift(created);
		allFiscalYears.value.sort((a, b) => b.year - a.year);

		// Update the available fiscal years for other tabs
		const currentYear = new Date().getFullYear();
		availableFiscalYears.value = allFiscalYears.value
			.filter((fy) => fy.status === 'published')
			.map((fy) => ({ ...fy, is_current: fy.year === currentYear }));

		// Update cache
		fiscalYearIdCache[created.year] = created.id;

		showCreateFiscalYear.value = false;
		newFiscalYear.value = {
			year: new Date().getFullYear() + 1,
			start_date: `${new Date().getFullYear() + 1}-01-01`,
			status: 'published',
		};
	} catch (err) {
		console.error('Failed to create fiscal year:', err);
		alert('Failed to create fiscal year: ' + (err.message || 'Unknown error'));
	} finally {
		fiscalYearSaving.value = false;
	}
}

async function updateFiscalYearStatus(id, newStatus) {
	try {
		await fiscalYearsCollection.update(id, { status: newStatus });

		// Update local state
		const fy = allFiscalYears.value.find((f) => f.id === id);
		if (fy) fy.status = newStatus;

		// Refresh available years for other tabs (only published years)
		const currentYear = new Date().getFullYear();
		availableFiscalYears.value = allFiscalYears.value
			.filter((f) => f.status === 'published')
			.map((f) => ({ ...f, is_current: f.year === currentYear }));
	} catch (err) {
		console.error('Failed to update fiscal year:', err);
		alert('Failed to update status: ' + (err.message || 'Unknown error'));
	}
}

// ======================
// BUDGET IMPORT TAB
// ======================
const budgetFiscalYear = ref(new Date().getFullYear());
const budgetAccountId = ref('');
const budgetFile = ref(null);
const budgetDragging = ref(false);
const budgetParsing = ref(false);
const budgetImporting = ref(false);
const budgetImportProgress = ref(0);
const budgetPreview = ref([]);
const budgetImportResults = ref(null);
const resolvedBudgetFiscalYearId = ref(null);

// Resolve fiscal year ID when year changes
watch(budgetFiscalYear, async (year) => {
	resolvedBudgetFiscalYearId.value = await resolveFiscalYearId(year);
}, { immediate: true });

function handleBudgetDrop(event) {
	budgetDragging.value = false;
	const files = event.dataTransfer.files;
	if (files.length > 0 && files[0].name.endsWith('.csv')) {
		budgetFile.value = files[0];
	}
}

function handleBudgetFileSelect(event) {
	const files = event.target.files;
	if (files.length > 0) budgetFile.value = files[0];
}

function clearBudgetFile() {
	budgetFile.value = null;
	budgetPreview.value = [];
	budgetImportResults.value = null;
}

async function parseBudgetCSV() {
	if (!budgetFile.value) return;
	budgetParsing.value = true;

	try {
		const text = await budgetFile.value.text();
		const lines = text.split('\n').filter((l) => l.trim());
		if (lines.length < 2) {
			alert('CSV file appears empty.');
			return;
		}

		const headers = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''));

		const items = [];
		for (let i = 1; i < lines.length; i++) {
			const values = lines[i].split(',').map((v) => v.trim().replace(/"/g, ''));
			if (values.length < headers.length) continue;

			const row = {};
			headers.forEach((h, idx) => (row[h] = values[idx]));

			// Try to extract budget info from different column naming conventions
			const category = row.Category || row.category || row.Department || '';
			const description = row.Description || row.description || row.Item || row.item || row['Budget Item'] || '';
			const monthly =
				parseFloat(row.Monthly || row.monthly || row['Monthly Budget'] || row['Monthly Amount'] || '0') || 0;
			const yearly =
				parseFloat(row.Yearly || row.yearly || row['Yearly Budget'] || row['Annual Amount'] || row.Annual || '0') ||
				monthly * 12;

			if (description || category) {
				items.push({
					category,
					description,
					monthly_budget: monthly,
					yearly_budget: yearly,
					item_code: (description || category).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
				});
			}
		}

		budgetPreview.value = items;
	} catch (err) {
		console.error('Budget CSV parse error:', err);
		alert('Failed to parse budget CSV: ' + err.message);
	} finally {
		budgetParsing.value = false;
	}
}

async function importBudget() {
	if (!resolvedBudgetFiscalYearId.value || budgetPreview.value.length === 0) return;

	budgetImporting.value = true;
	budgetImportProgress.value = 0;

	const results = { success: true, message: '', categoriesCreated: 0, itemsCreated: 0 };

	try {
		const fyId = resolvedBudgetFiscalYearId.value;

		// Group by category
		const categoryGroups = {};
		for (const item of budgetPreview.value) {
			const cat = item.category || 'Uncategorized';
			if (!categoryGroups[cat]) categoryGroups[cat] = [];
			categoryGroups[cat].push(item);
		}

		// Load existing categories for this fiscal year
		const existingCategories = await budgetCategoriesCollection.list({
			filter: { fiscal_year: { _eq: fyId } },
			fields: ['id', 'category_name'],
			limit: -1,
		});
		const categoryMap = {};
		existingCategories.forEach((c) => (categoryMap[c.category_name] = c.id));

		// Create categories + items
		for (const [catName, items] of Object.entries(categoryGroups)) {
			let categoryId = categoryMap[catName];

			if (!categoryId) {
				const totalMonthly = items.reduce((sum, it) => sum + (it.monthly_budget || 0), 0);
				const totalYearly = items.reduce((sum, it) => sum + (it.yearly_budget || 0), 0);

				const created = await budgetCategoriesCollection.create({
					fiscal_year: fyId,
					category_name: catName,
					monthly_budget: totalMonthly,
					yearly_budget: totalYearly,
					status: 'published',
				});
				categoryId = created.id;
				results.categoriesCreated++;
			}

			for (const item of items) {
				await budgetItemsCollection.create({
					fiscal_year: fyId,
					category_id: categoryId,
					item_code: item.item_code,
					description: item.description || catName,
					monthly_budget: item.monthly_budget || 0,
					yearly_budget: item.yearly_budget || 0,
					status: 'published',
				});
				results.itemsCreated++;
				budgetImportProgress.value++;
			}
		}

		results.message = `Created ${results.categoriesCreated} categories and ${results.itemsCreated} budget items for fiscal year ${budgetFiscalYear.value}.`;
	} catch (err) {
		results.success = false;
		results.message = 'Budget import failed: ' + (err.message || 'Unknown error');
		console.error('Budget import error:', err);
	} finally {
		budgetImporting.value = false;
		budgetImportResults.value = results;
	}
}

// ======================
// STATEMENT IMPORT TAB
// ======================
const stmtFileType = ref('csv');
const stmtAccountId = ref('');
const stmtFiscalYear = ref(new Date().getFullYear());
const stmtDetectedYear = ref(null);
const stmtDetectedMonth = ref('');
const stmtMonth = ref('');
const stmtFile = ref(null);
const stmtDragging = ref(false);
const stmtParsing = ref(false);
const stmtUploading = ref(false);
const stmtImporting = ref(false);
const stmtImportProgress = ref(0);
const stmtTransactions = ref([]);
const stmtBeginningBalance = ref(null);
const stmtEndingBalance = ref(null);
const stmtImportResults = ref(null);
const pastedJson = ref('');
const pdfUploadResult = ref(null);
const resolvedStmtFiscalYearId = ref(null);

const selectedAccountName = computed(() => {
	const acct = accounts.value.find((a) => a.id === stmtAccountId.value);
	return acct ? acct.account_name : 'Selected Account';
});

const stmtTotalDeposits = computed(() =>
	stmtTransactions.value
		.filter((tx) => tx.type === 'deposit' || tx.type === 'transfer_in')
		.reduce((sum, tx) => sum + Math.abs(tx.amount), 0)
);

const stmtTotalWithdrawals = computed(() =>
	stmtTransactions.value
		.filter((tx) => ['withdrawal', 'fee', 'transfer_out'].includes(tx.type))
		.reduce((sum, tx) => sum + Math.abs(tx.amount), 0)
);

// Resolve fiscal year ID when year changes
watch(stmtFiscalYear, async (year) => {
	resolvedStmtFiscalYearId.value = await resolveFiscalYearId(year);
}, { immediate: true });

function handleStmtDrop(event) {
	stmtDragging.value = false;
	const files = event.dataTransfer.files;
	if (files.length > 0) stmtFile.value = files[0];
}

function handleStmtFileSelect(event) {
	const files = event.target.files;
	if (files.length > 0) stmtFile.value = files[0];
}

function clearStmtFile() {
	stmtFile.value = null;
	stmtTransactions.value = [];
	stmtBeginningBalance.value = null;
	stmtEndingBalance.value = null;
	stmtImportResults.value = null;
	pdfUploadResult.value = null;
	stmtDetectedYear.value = null;
	stmtDetectedMonth.value = '';
}

async function uploadPdf() {
	if (!stmtFile.value) return;
	stmtUploading.value = true;

	try {
		const formData = new FormData();
		formData.append('file', stmtFile.value);
		if (stmtAccountId.value) formData.append('account_id', stmtAccountId.value);
		if (stmtFiscalYear.value) formData.append('fiscal_year', stmtFiscalYear.value.toString());

		const result = await $fetch('/api/admin/parse-statement', {
			method: 'POST',
			body: formData,
		});

		pdfUploadResult.value = result;
	} catch (err) {
		console.error('PDF upload error:', err);
		alert('Failed to upload PDF: ' + (err.data?.message || err.message || 'Unknown error'));
	} finally {
		stmtUploading.value = false;
	}
}

async function parseStmtFile() {
	if (!stmtFile.value) return;
	stmtParsing.value = true;

	try {
		const formData = new FormData();
		formData.append('file', stmtFile.value);

		const result = await $fetch('/api/admin/parse-statement', {
			method: 'POST',
			body: formData,
		});

		if (result.success && result.transactions) {
			applyParsedTransactions(result);
		} else {
			alert(result.error || 'Failed to parse file.');
		}
	} catch (err) {
		console.error('Parse error:', err);
		alert('Failed to parse file: ' + (err.data?.message || err.message || 'Unknown error'));
	} finally {
		stmtParsing.value = false;
	}
}

function parseJsonFromPaste() {
	try {
		const parsed = JSON.parse(pastedJson.value);
		let transactions = [];
		let beginBalance = null;
		let endBalance = null;

		if (Array.isArray(parsed)) {
			transactions = parsed;
		} else if (parsed.transactions) {
			transactions = parsed.transactions;
			beginBalance = parsed.beginning_balance;
			endBalance = parsed.ending_balance;
		}

		const normalized = transactions.map((tx) => ({
			date: tx.date || tx.Date || '',
			description: tx.description || tx.Description || '',
			amount: parseFloat(tx.amount || tx.Amount || 0),
			type: normalizeType(tx.type || tx.Type || ''),
			vendor: tx.vendor || tx.Vendor || '',
			category: tx.category || tx.Category || '',
		}));

		applyParsedTransactions({
			success: true,
			transactions: normalized,
			beginning_balance: beginBalance,
			ending_balance: endBalance,
			statement_period: parsed.statement_period || null,
		});
	} catch (err) {
		alert('Invalid JSON: ' + err.message);
	}
}

function applyParsedTransactions(result) {
	stmtTransactions.value = result.transactions || [];
	stmtBeginningBalance.value = result.beginning_balance ?? null;
	stmtEndingBalance.value = result.ending_balance ?? null;

	// Auto-detect fiscal year from transaction dates
	const detectedYear = detectFiscalYearFromDates(stmtTransactions.value);
	if (detectedYear) {
		stmtDetectedYear.value = detectedYear;
		// Only auto-set if user hasn't manually changed it from the default
		const currentYear = new Date().getFullYear();
		if (stmtFiscalYear.value === currentYear && detectedYear !== currentYear) {
			stmtFiscalYear.value = detectedYear;
		} else if (!stmtFiscalYear.value) {
			stmtFiscalYear.value = detectedYear;
		}
	}

	// Auto-detect month
	const detectedMonth = detectMonthFromTransactions(stmtTransactions.value);
	if (detectedMonth && !stmtMonth.value) {
		stmtMonth.value = detectedMonth;
		stmtDetectedMonth.value = detectedMonth;
	}
}

async function importTransactions() {
	if (!stmtAccountId.value || !resolvedStmtFiscalYearId.value || stmtTransactions.value.length === 0) return;

	stmtImporting.value = true;
	stmtImportProgress.value = 0;

	const results = {
		success: true,
		created: 0,
		skipped: 0,
		errors: [],
	};

	try {
		const fyId = resolvedStmtFiscalYearId.value;
		const batchId = `import_${stmtFiscalYear.value}_${stmtMonth.value || 'all'}_${Date.now()}`;

		// Load existing transactions for duplicate detection
		const existingFilter = {
			account_id: { _eq: stmtAccountId.value },
			fiscal_year: { _eq: fyId },
		};
		if (stmtMonth.value) {
			existingFilter.statement_month = { _eq: stmtMonth.value };
		}

		let existingTransactions = [];
		try {
			existingTransactions = await transactionsCollection.list({
				filter: existingFilter,
				fields: ['id', 'transaction_date', 'amount', 'description'],
				limit: -1,
			});
		} catch {
			// Continue without duplicate detection
		}

		// Import each transaction
		for (let i = 0; i < stmtTransactions.value.length; i++) {
			const tx = stmtTransactions.value[i];

			try {
				const txDate = formatTransactionDate(tx.date);

				// Duplicate check
				const isDuplicate = existingTransactions.some((existing) => {
					const existingDate = existing.transaction_date?.substring(0, 10);
					return (
						existingDate === txDate &&
						Math.abs(existing.amount - tx.amount) < 0.01 &&
						existing.description?.substring(0, 30) === (tx.description || '').substring(0, 30)
					);
				});

				if (isDuplicate) {
					results.skipped++;
					stmtImportProgress.value++;
					continue;
				}

				await transactionsCollection.create({
					fiscal_year: fyId,
					account_id: stmtAccountId.value,
					transaction_date: txDate,
					description: tx.description || '',
					vendor: tx.vendor || null,
					amount: Math.abs(tx.amount),
					transaction_type: tx.type || 'withdrawal',
					auto_categorized: false,
					statement_month: stmtMonth.value || null,
					import_batch_id: batchId,
					status: 'published',
				});

				results.created++;
			} catch (err) {
				results.errors.push(`Row ${i + 1}: ${err.message}`);
			}

			stmtImportProgress.value++;
		}

		if (results.errors.length > 0 && results.created === 0) {
			results.success = false;
		}
	} catch (err) {
		results.success = false;
		results.errors.push('Import failed: ' + (err.message || 'Unknown error'));
		console.error('Transaction import error:', err);
	} finally {
		stmtImporting.value = false;
		stmtImportResults.value = results;
	}
}

// ======================
// HELPERS
// ======================
function normalizeType(type) {
	const t = (type || '').toLowerCase().trim();
	if (t === 'deposit' || t === 'credit') return 'deposit';
	if (t === 'withdrawal' || t === 'debit' || t === 'check') return 'withdrawal';
	if (t === 'fee' || t === 'charge') return 'fee';
	if (t === 'transfer_in' || t === 'transfer in') return 'transfer_in';
	if (t === 'transfer_out' || t === 'transfer out') return 'transfer_out';
	return 'withdrawal';
}

function formatTransactionDate(dateStr) {
	if (!dateStr) return '';

	// Already ISO format
	if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) return dateStr.substring(0, 10);

	// MM/DD format (no year)
	const parts = dateStr.split('/');
	if (parts.length === 2) {
		const year = stmtFiscalYear.value || new Date().getFullYear();
		return `${year}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
	}

	// MM/DD/YYYY format
	if (parts.length === 3) {
		return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
	}

	return dateStr;
}

function getTypeClass(type) {
	const classes = {
		deposit: 'bg-green-100 text-green-800',
		withdrawal: 'bg-red-100 text-red-800',
		fee: 'bg-yellow-100 text-yellow-800',
		transfer_in: 'bg-blue-100 text-blue-800',
		transfer_out: 'bg-orange-100 text-orange-800',
	};
	return classes[type] || 'bg-gray-100 text-gray-800';
}

// ======================
// INITIALIZATION
// ======================
async function loadFiscalYears() {
	try {
		const years = await fiscalYearsCollection.list({
			sort: ['-year'],
			fields: ['id', 'year', 'start_date', 'status'],
			filter: { status: { _eq: 'published' } },
			limit: -1,
		});

		const currentYear = new Date().getFullYear();
		availableFiscalYears.value = years.map((fy) => ({
			...fy,
			is_current: fy.year === currentYear,
		}));

		// Cache all IDs
		years.forEach((fy) => {
			fiscalYearIdCache[fy.year] = fy.id;
		});

		// Pre-resolve current selections
		resolvedBudgetFiscalYearId.value = fiscalYearIdCache[budgetFiscalYear.value] || null;
		resolvedStmtFiscalYearId.value = fiscalYearIdCache[stmtFiscalYear.value] || null;
	} catch (err) {
		console.error('Failed to load fiscal years:', err);
		// Fallback
		const currentYear = new Date().getFullYear();
		availableFiscalYears.value = [
			{ id: null, year: currentYear - 1, is_current: false },
			{ id: null, year: currentYear, is_current: true },
			{ id: null, year: currentYear + 1, is_current: false },
		];
	}
}

// ======================
// DATA MAINTENANCE TAB
// ======================
const repairScanning = ref(false);
const repairRunning = ref(false);
const repairProgress = ref(0);
const repairScanResults = ref(null);
const repairResults = ref(null);

/**
 * Scan transactions to find ones with raw year numbers instead of M2O record IDs.
 * fiscal_years records typically have auto-increment IDs (1, 2, 3, etc.)
 * while raw year values would be 2024, 2025, etc.
 * We compare each transaction's fiscal_year value against known fiscal_year record IDs.
 */
async function scanFiscalYearIssues() {
	repairScanning.value = true;
	repairScanResults.value = null;
	repairResults.value = null;

	try {
		// Get all fiscal_years records to know valid IDs
		const fiscalYears = await fiscalYearsCollection.list({
			fields: ['id', 'year'],
			limit: -1,
		});

		const validIds = new Set(fiscalYears.map((fy) => fy.id));
		const yearToIdMap = {};
		fiscalYears.forEach((fy) => {
			yearToIdMap[fy.year] = fy.id;
		});

		// Get all transactions with their fiscal_year field
		const transactions = await transactionsCollection.list({
			fields: ['id', 'fiscal_year'],
			limit: -1,
		});

		let correctCount = 0;
		let issueCount = 0;
		const yearBreakdown = {};
		const transactionsToFix = [];

		for (const tx of transactions) {
			const fyValue = tx.fiscal_year;

			if (!fyValue) {
				issueCount++;
				continue;
			}

			// If the value is a valid fiscal_years record ID, it's correct
			// fiscal_year could be returned as an object (M2O expanded) or as an ID
			const fyId = typeof fyValue === 'object' ? fyValue.id : fyValue;

			if (validIds.has(fyId)) {
				correctCount++;
			} else {
				// It's likely a raw year number (e.g., 2025)
				issueCount++;
				const yearNum = typeof fyValue === 'object' ? fyValue.year : fyValue;
				yearBreakdown[yearNum] = (yearBreakdown[yearNum] || 0) + 1;
				transactionsToFix.push({
					id: tx.id,
					currentValue: fyValue,
					yearNumber: yearNum,
					correctId: yearToIdMap[yearNum] || null,
				});
			}
		}

		repairScanResults.value = {
			totalScanned: transactions.length,
			correctCount,
			issueCount,
			yearBreakdown: Object.keys(yearBreakdown).length > 0 ? yearBreakdown : null,
			transactionsToFix,
			yearToIdMap,
		};
	} catch (err) {
		console.error('Scan error:', err);
		repairScanResults.value = {
			totalScanned: 0,
			correctCount: 0,
			issueCount: 0,
			error: err.message,
		};
	} finally {
		repairScanning.value = false;
	}
}

/**
 * Repair transactions by updating their fiscal_year to the correct M2O record ID.
 */
async function repairFiscalYears() {
	if (!repairScanResults.value?.transactionsToFix?.length) return;

	repairRunning.value = true;
	repairProgress.value = 0;

	const toFix = repairScanResults.value.transactionsToFix;
	let fixed = 0;
	let skipped = 0;
	const errors = [];

	try {
		for (const tx of toFix) {
			if (!tx.correctId) {
				skipped++;
				errors.push(`Transaction ${tx.id}: No fiscal_years record found for year ${tx.yearNumber}`);
				repairProgress.value++;
				continue;
			}

			try {
				await transactionsCollection.update(tx.id, {
					fiscal_year: tx.correctId,
				});
				fixed++;
			} catch (err) {
				errors.push(`Transaction ${tx.id}: ${err.message}`);
			}

			repairProgress.value++;
		}

		repairResults.value = {
			success: fixed > 0,
			message: `Repaired ${fixed} transactions. ${skipped > 0 ? `Skipped ${skipped} (no matching fiscal year record).` : ''} ${errors.length > 0 ? `${errors.length} errors.` : ''}`,
		};
	} catch (err) {
		repairResults.value = {
			success: false,
			message: 'Repair failed: ' + (err.message || 'Unknown error'),
		};
	} finally {
		repairRunning.value = false;
	}
}

// ======================
// INITIALIZATION
// ======================
onMounted(async () => {
	await Promise.all([loadAccounts(), loadFiscalYears(), loadAllFiscalYears()]);
});
</script>
