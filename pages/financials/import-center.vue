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
			<div class="bg-card rounded-lg shadow-sm border p-6">
				<h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2 uppercase tracking-wider">Financial Import Center</h1>
				<p class="text-gray-600 dark:text-gray-400">
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
									<div class="w-4 h-4 rounded-full" :style="{backgroundColor: account.color || '#6B7280'}"></div>
									<div>
										<p class="font-medium text-gray-900">{{ account.account_name }}</p>
										<p class="text-sm text-gray-500">
											#{{ account.account_number }} &middot; {{ account.account_type }}
										</p>
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
								Fiscal years are required before importing budgets or transactions. Each financial record references a
								fiscal year via M2O relationship.
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
						<div
							v-if="newFiscalYear.year && fiscalYearExists(newFiscalYear.year)"
							class="mt-3 text-sm text-yellow-700 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
							A fiscal year record for {{ newFiscalYear.year }} already exists.
						</div>
						<div class="mt-4">
							<button
								@click="createFiscalYear"
								:disabled="
									!newFiscalYear.year ||
									!newFiscalYear.start_date ||
									fiscalYearSaving ||
									fiscalYearExists(newFiscalYear.year)
								"
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
								:class="
									fy.status === 'published'
										? 'bg-green-50 border-green-200'
										: fy.status === 'archived'
											? 'bg-gray-100 border-gray-300'
											: 'bg-yellow-50 border-yellow-200'
								">
								<div class="flex items-center gap-4">
									<div
										class="text-2xl font-bold"
										:class="
											fy.status === 'published'
												? 'text-green-700'
												: fy.status === 'archived'
													? 'text-gray-500'
													: 'text-yellow-700'
										">
										{{ fy.year }}
									</div>
									<div>
										<p class="text-sm text-gray-600">Start: {{ fy.start_date || 'Not set' }}</p>
										<p class="text-xs text-gray-400">Record ID: {{ fy.id }}</p>
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
										@change="updateFiscalYearStatus(fy.id, $event.target.value)"
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
							:class="{'border-blue-500 bg-blue-50': budgetDragging}"
							@dragover.prevent="budgetDragging = true"
							@dragleave.prevent="budgetDragging = false"
							@drop.prevent="handleBudgetDrop">
							<input ref="budgetFileInput" type="file" accept=".csv" @change="handleBudgetFileSelect" class="hidden" />

							<div v-if="!budgetFile">
								<Icon name="i-heroicons-document-arrow-up" class="w-12 h-12 text-gray-400 mx-auto mb-4" />
								<p class="text-lg text-gray-600 mb-2">Drop your budget CSV file here</p>
								<p class="text-sm text-gray-500 mb-4">CSV format matching public/data/2025 Operating Budget.csv</p>
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
								<h3 class="font-semibold text-green-800">Parsed {{ budgetPreview.length }} budget line items</h3>
								<p class="text-sm text-green-600">
									Fiscal Year: {{ budgetFiscalYear }} (Directus record ID:
									{{ resolvedBudgetFiscalYearId || 'resolving...' }})
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
											<td class="px-4 py-2 text-right font-mono">
												${{ item.monthly_budget?.toLocaleString() || '0' }}
											</td>
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
									{{
										budgetImporting
											? `Importing... (${budgetImportProgress}/${budgetPreview.length})`
											: 'Import Budget Data'
									}}
								</button>
								<p v-else class="text-sm text-red-600">You need financials create permission to import budgets.</p>
							</div>
						</div>

						<!-- Budget Import Results -->
						<div
							v-if="budgetImportResults"
							class="p-4 rounded-lg border"
							:class="budgetImportResults.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'">
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
									<span v-if="stmtDetectedYear" class="text-green-600 text-xs ml-1">
										(auto-detected: {{ stmtDetectedYear }})
									</span>
								</label>
								<select v-model="stmtFiscalYear" class="w-full border rounded-lg px-3 py-2 text-sm">
									<option v-for="fy in availableFiscalYears" :key="fy.id" :value="fy.year">
										{{ fy.year }}{{ fy.is_current ? ' (Current)' : '' }}
									</option>
								</select>
								<p class="text-xs text-gray-400 mt-1">
									{{
										stmtDetectedYear
											? 'Detected from transaction dates. You can override.'
											: 'Select or let auto-detect from file.'
									}}
								</p>
							</div>
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-1">
									Statement Month
									<span v-if="stmtDetectedMonth" class="text-green-600 text-xs ml-1">(auto-detected)</span>
								</label>
								<select v-model="stmtMonth" class="w-full border rounded-lg px-3 py-2 text-sm">
									<option value="">Per-transaction (multi-month)</option>
									<option v-for="month in monthOptions" :key="month.value" :value="month.value">
										{{ month.label }}
									</option>
								</select>
								<p class="text-xs text-gray-400 mt-1">
									Leave as "Per-transaction" for CSVs spanning multiple months. Each transaction's month will be derived from its date.
								</p>
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
									stmtFileType === ft.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300',
								]">
								<Icon
									:name="ft.icon"
									class="w-8 h-8 mx-auto mb-2"
									:class="stmtFileType === ft.id ? 'text-blue-600' : 'text-gray-400'" />
								<p class="font-medium text-sm" :class="stmtFileType === ft.id ? 'text-blue-700' : 'text-gray-700'">
									{{ ft.label }}
								</p>
								<p class="text-xs text-gray-500 mt-1">{{ ft.description }}</p>
							</button>
						</div>

						<!-- PDF Upload -->
						<div v-if="stmtFileType === 'pdf'" class="space-y-4">
							<div
								class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors"
								:class="{'border-blue-500 bg-blue-50': stmtDragging}"
								@dragover.prevent="stmtDragging = true"
								@dragleave.prevent="stmtDragging = false"
								@drop.prevent="handleStmtDrop">
								<input ref="stmtFileInput" type="file" accept=".pdf" @change="handleStmtFileSelect" class="hidden" />

								<div v-if="!stmtFile">
									<Icon name="i-heroicons-document" class="w-12 h-12 text-gray-400 mx-auto mb-4" />
									<p class="text-lg text-gray-600 mb-2">Drop your PDF bank statement here</p>
									<p class="text-sm text-gray-500 mb-4">
										Claude AI will extract transactions automatically, or you can provide JSON manually.
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

							<!-- PDF Action Buttons -->
							<div v-if="stmtFile" class="flex flex-col sm:flex-row gap-3 justify-center">
								<button
									@click="extractPdfToCsv"
									:disabled="claudeExtracting || pdfToCsvExtracting"
									class="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2">
									<Icon v-if="pdfToCsvExtracting" name="i-heroicons-arrow-path" class="w-5 h-5 animate-spin" />
									<Icon v-else name="i-heroicons-table-cells" class="w-5 h-5" />
									{{ pdfToCsvExtracting ? 'Claude is extracting CSV...' : 'PDF → CSV (Recommended)' }}
								</button>
								<button
									@click="extractPdfWithClaude"
									:disabled="claudeExtracting || pdfToCsvExtracting"
									class="bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2">
									<Icon v-if="claudeExtracting" name="i-heroicons-arrow-path" class="w-5 h-5 animate-spin" />
									<Icon v-else name="i-heroicons-sparkles" class="w-5 h-5" />
									{{ claudeExtracting ? 'Claude is reading PDF...' : 'Extract Raw (No Categories)' }}
								</button>
								<button
									@click="uploadPdf"
									:disabled="stmtUploading"
									class="bg-gray-600 text-white px-8 py-3 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 text-sm">
									{{ stmtUploading ? 'Uploading...' : 'Upload PDF Only (provide JSON later)' }}
								</button>
							</div>

							<!-- PDF → CSV Success Banner -->
							<div
								v-if="pdfToCsvResult && pdfToCsvResult.success"
								class="p-4 bg-green-50 rounded-lg border border-green-200 space-y-3">
								<div class="flex items-center gap-2">
									<Icon name="i-heroicons-check-circle" class="w-5 h-5 text-green-600" />
									<h3 class="font-semibold text-green-800">PDF Extracted with Categories</h3>
								</div>
								<p class="text-sm text-green-600">{{ pdfToCsvResult.message }}</p>
								<div class="flex flex-wrap gap-3 text-sm">
									<span class="bg-green-100 text-green-800 px-3 py-1 rounded-full">
										{{ pdfToCsvResult.transactions?.length || 0 }} transactions
									</span>
									<span
										v-if="pdfToCsvResult.beginning_balance != null"
										class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
										Begin: ${{
											pdfToCsvResult.beginning_balance?.toLocaleString(undefined, {minimumFractionDigits: 2})
										}}
									</span>
									<span
										v-if="pdfToCsvResult.ending_balance != null"
										class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
										End: ${{ pdfToCsvResult.ending_balance?.toLocaleString(undefined, {minimumFractionDigits: 2}) }}
									</span>
									<span
										v-if="pdfToCsvResult.statement_period"
										class="bg-purple-100 text-purple-800 px-3 py-1 rounded-full">
										{{ pdfToCsvResult.statement_period }}
									</span>
									<span v-if="pdfToCsvResult.pdf_file_id" class="bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
										PDF saved to Directus
									</span>
								</div>
								<div class="flex gap-3">
									<button
										@click="downloadCsvFromPdf"
										class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm inline-flex items-center gap-2">
										<Icon name="i-heroicons-arrow-down-tray" class="w-4 h-4" />
										Download CSV File
									</button>
									<button
										@click="loadPdfCsvIntoPreview"
										class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm inline-flex items-center gap-2">
										<Icon name="i-heroicons-arrow-right" class="w-4 h-4" />
										Load into Import Preview
									</button>
								</div>
							</div>

							<!-- Claude Extraction Error -->
							<div v-if="claudeExtractionError" class="p-4 bg-red-50 rounded-lg border border-red-200">
								<h3 class="font-semibold text-red-800">Extraction Failed</h3>
								<p class="text-sm text-red-600 mt-1">{{ claudeExtractionError }}</p>
								<p class="text-sm text-gray-600 mt-2">You can try again, or paste JSON manually below.</p>
							</div>

							<!-- Claude Token Usage -->
							<div v-if="claudeTokenUsage" class="text-xs text-gray-400 text-center">
								Claude API usage: {{ claudeTokenUsage.input.toLocaleString() }} input +
								{{ claudeTokenUsage.output.toLocaleString() }} output tokens
							</div>

							<!-- PDF Upload Result (store-only fallback) -->
							<div
								v-if="pdfUploadResult && !stmtTransactions.length"
								class="p-4 bg-blue-50 rounded-lg border border-blue-200">
								<h3 class="font-semibold text-blue-800">PDF Uploaded Successfully</h3>
								<p class="text-sm text-blue-600 mt-1">{{ pdfUploadResult.message }}</p>
								<p class="text-sm text-blue-600 mt-2">Paste the transaction JSON below to continue.</p>
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
								:class="{'border-blue-500 bg-blue-50': stmtDragging}"
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
								:class="{'border-blue-500 bg-blue-50': stmtDragging}"
								@dragover.prevent="stmtDragging = true"
								@dragleave.prevent="stmtDragging = false"
								@drop.prevent="handleStmtDrop">
								<input ref="stmtFileInput" type="file" accept=".csv" @change="handleStmtFileSelect" class="hidden" />

								<div v-if="!stmtFile">
									<Icon name="i-heroicons-table-cells" class="w-12 h-12 text-gray-400 mx-auto mb-4" />
									<p class="text-lg text-gray-600 mb-2">Drop your CSV bank statement here</p>
									<p class="text-sm text-gray-500 mb-4">Same format as public/data/reconciliation CSVs</p>
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

						<!-- Batch PDF Import -->
						<div v-if="stmtFileType === 'batch'">
							<FinancialsBatchPdfImport
								v-model:account-id="stmtAccountId"
								v-model:fiscal-year="stmtFiscalYear"
								:accounts="accounts"
								:available-fiscal-years="availableFiscalYears"
								@load-result="handleBatchLoadResult" />
						</div>

						<!-- ======================== -->
						<!-- Transaction Preview      -->
						<!-- ======================== -->
						<div v-if="stmtTransactions.length > 0" class="space-y-4">
							<!-- Multi-Month Warning & Month Selector -->
							<div v-if="isMultiMonthChase" class="p-4 bg-amber-50 rounded-lg border border-amber-200 space-y-3">
								<div class="flex items-start gap-2">
									<Icon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
									<div>
										<h3 class="font-semibold text-amber-800">Multi-Month CSV Detected</h3>
										<p class="text-sm text-amber-700 mt-1">
											This CSV spans {{ chaseAvailableMonths.length }} months ({{ stmtTransactions.length }} total transactions).
											Import one month at a time to ensure balances match your bank statements.
										</p>
									</div>
								</div>
								<div class="flex flex-wrap gap-2">
									<button
										v-for="m in chaseAvailableMonths"
										:key="m.value"
										@click="chaseSelectedMonth = m.value"
										:class="[
											'px-4 py-2 rounded-lg text-sm font-medium border transition-all',
											chaseSelectedMonth === m.value
												? 'bg-blue-600 text-white border-blue-600'
												: 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50',
										]">
										{{ m.label }}
										<span class="ml-1 text-xs opacity-75">({{ m.transaction_count }})</span>
									</button>
								</div>
							</div>

							<!-- Summary -->
							<div class="grid grid-cols-2 md:grid-cols-5 gap-4">
								<div class="bg-gray-50 p-4 rounded-lg text-center">
									<p class="text-xs text-gray-500 uppercase">Transactions</p>
									<p class="text-2xl font-bold text-gray-900">{{ displayedTransactions.length }}</p>
									<p v-if="isMultiMonthChase && chaseSelectedMonth" class="text-xs text-gray-400">
										of {{ stmtTransactions.length }} total
									</p>
								</div>
								<div class="bg-green-50 p-4 rounded-lg text-center">
									<p class="text-xs text-green-600 uppercase">Deposits</p>
									<p class="text-2xl font-bold text-green-700">
										${{ stmtTotalDeposits.toLocaleString(undefined, {minimumFractionDigits: 2}) }}
									</p>
								</div>
								<div class="bg-red-50 p-4 rounded-lg text-center">
									<p class="text-xs text-red-600 uppercase">Withdrawals</p>
									<p class="text-2xl font-bold text-red-700">
										${{ stmtTotalWithdrawals.toLocaleString(undefined, {minimumFractionDigits: 2}) }}
									</p>
								</div>
								<div class="bg-blue-50 p-4 rounded-lg text-center">
									<p class="text-xs text-blue-600 uppercase">Fiscal Year</p>
									<p class="text-2xl font-bold text-blue-700">{{ stmtFiscalYear }}</p>
									<p class="text-xs text-blue-400">ID: {{ resolvedStmtFiscalYearId || '...' }}</p>
								</div>
								<div class="bg-purple-50 p-4 rounded-lg text-center">
									<p class="text-xs text-purple-600 uppercase">Balance</p>
									<p class="text-sm font-bold text-purple-700" v-if="displayedBeginningBalance != null">
										Begin: ${{ displayedBeginningBalance.toLocaleString(undefined, {minimumFractionDigits: 2}) }}
									</p>
									<p class="text-sm font-bold text-purple-700" v-if="displayedEndingBalance != null">
										End: ${{ displayedEndingBalance.toLocaleString(undefined, {minimumFractionDigits: 2}) }}
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
										<tr v-for="(tx, idx) in displayedTransactions.slice(0, 30)" :key="idx">
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
												${{ tx.amount.toLocaleString(undefined, {minimumFractionDigits: 2}) }}
											</td>
											<td class="px-4 py-2 text-gray-600 whitespace-nowrap">{{ tx.category || '-' }}</td>
										</tr>
									</tbody>
								</table>
								<p v-if="displayedTransactions.length > 30" class="text-sm text-gray-500 text-center mt-2">
									Showing 30 of {{ displayedTransactions.length }} transactions
								</p>
							</div>

							<!-- Import Button -->
							<div class="text-center space-y-3">
								<div v-if="isMultiMonthChase && !chaseSelectedMonth" class="text-sm text-yellow-600 bg-yellow-50 p-3 rounded-lg">
									Please select a month above to import.
								</div>
								<div v-if="!stmtAccountId" class="text-sm text-yellow-600 bg-yellow-50 p-3 rounded-lg">
									Please select a target account above before importing.
								</div>
								<div v-if="!canCreateFinancials" class="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
									You need financials create permission to import transactions.
								</div>
								<button
									v-if="canCreateFinancials"
									@click="importTransactions"
									:disabled="stmtImporting || !stmtAccountId || !resolvedStmtFiscalYearId || (isMultiMonthChase && !chaseSelectedMonth)"
									class="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
									<span v-if="stmtImporting">
										Importing... ({{ stmtImportProgress }}/{{ displayedTransactions.length }})
									</span>
									<span v-else>Import {{ displayedTransactions.length }} Transactions to {{ selectedAccountName }}</span>
								</button>
							</div>
						</div>

						<!-- Statement Import Results -->
						<div
							v-if="stmtImportResults"
							class="p-4 rounded-lg border"
							:class="stmtImportResults.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'">
							<h3 :class="stmtImportResults.success ? 'text-green-800' : 'text-red-800'" class="font-semibold">
								{{ stmtImportResults.success ? 'Transaction Import Complete' : 'Import Failed' }}
							</h3>
							<ul class="text-sm mt-2 space-y-1" :class="stmtImportResults.success ? 'text-green-600' : 'text-red-600'">
								<li v-if="stmtImportResults.created">{{ stmtImportResults.created }} transactions created</li>
								<li v-if="stmtImportResults.skipped">{{ stmtImportResults.skipped }} duplicates skipped</li>
								<li v-if="stmtImportResults.errors?.length">{{ stmtImportResults.errors.length }} errors</li>
							</ul>
							<!-- Auto-categorization results -->
							<div v-if="autoCategorizing" class="mt-3 flex items-center gap-2 text-sm text-blue-600">
								<Icon name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
								Auto-categorizing transactions...
							</div>
							<div
								v-if="autoCategorizeResults"
								class="mt-3 p-3 rounded border"
								:class="
									autoCategorizeResults.categorized > 0 ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
								">
								<p
									class="text-sm font-medium"
									:class="autoCategorizeResults.categorized > 0 ? 'text-blue-800' : 'text-gray-700'">
									Auto-Categorization: {{ autoCategorizeResults.categorized }} of
									{{ autoCategorizeResults.total_uncategorized }} transactions matched to budget categories
								</p>
								<p v-if="autoCategorizeResults.skipped > 0" class="text-xs text-gray-500 mt-1">
									{{ autoCategorizeResults.skipped }} transactions could not be matched (no matching keywords found)
								</p>
							</div>

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
				<!-- Auto-Categorize Transactions -->
				<div class="bg-white rounded-lg shadow-sm border">
					<div class="border-b px-6 py-4">
						<h2 class="text-xl font-semibold text-gray-900">Auto-Categorize Transactions</h2>
						<p class="text-sm text-gray-500 mt-1">
							Scan uncategorized transactions and automatically match them to budget categories using vendor patterns,
							keywords, and description matching.
						</p>
					</div>
					<div class="p-6 space-y-6">
						<div class="flex items-center gap-4">
							<div class="flex items-center gap-3">
								<label class="text-sm font-medium text-gray-700">Fiscal Year:</label>
								<select v-model="autoCatFiscalYear" class="border border-gray-300 rounded-lg px-3 py-2 text-sm">
									<option v-for="fy in availableFiscalYears" :key="fy.id" :value="fy.year">{{ fy.year }}</option>
								</select>
							</div>
							<button
								v-if="canCreateFinancials"
								@click="runAutoCategorize(autoCatFiscalYear)"
								:disabled="autoCategorizing || !autoCatFiscalYear"
								class="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 text-sm">
								<span v-if="autoCategorizing" class="flex items-center gap-2">
									<Icon name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
									Categorizing...
								</span>
								<span v-else>Run Auto-Categorize</span>
							</button>
						</div>

						<!-- Results -->
						<div
							v-if="autoCategorizeResults"
							class="p-4 rounded-lg border"
							:class="
								autoCategorizeResults.categorized > 0 ? 'bg-purple-50 border-purple-200' : 'bg-gray-50 border-gray-200'
							">
							<h3
								class="font-semibold"
								:class="autoCategorizeResults.categorized > 0 ? 'text-purple-800' : 'text-gray-700'">
								Auto-Categorization Results
							</h3>
							<ul
								class="text-sm mt-2 space-y-1"
								:class="autoCategorizeResults.categorized > 0 ? 'text-purple-700' : 'text-gray-600'">
								<li>Total uncategorized: {{ autoCategorizeResults.total_uncategorized }}</li>
								<li>Successfully categorized: {{ autoCategorizeResults.categorized }}</li>
								<li v-if="autoCategorizeResults.skipped > 0">
									Skipped (low confidence): {{ autoCategorizeResults.skipped }}
								</li>
								<li v-if="autoCategorizeResults.failed > 0" class="text-red-600">
									Failed: {{ autoCategorizeResults.failed }}
								</li>
							</ul>
							<!-- Detailed matches -->
							<div
								v-if="autoCategorizeResults.results?.length > 0 && autoCategorizeResults.categorized > 0"
								class="mt-4">
								<details class="text-sm">
									<summary class="cursor-pointer text-purple-700 font-medium">View matched transactions</summary>
									<div class="mt-2 max-h-64 overflow-y-auto">
										<table class="w-full text-xs">
											<thead class="bg-purple-100 sticky top-0">
												<tr>
													<th class="text-left px-2 py-1">Description</th>
													<th class="text-left px-2 py-1">Category</th>
													<th class="text-left px-2 py-1">Budget Item</th>
													<th class="text-left px-2 py-1">Matched By</th>
													<th class="text-right px-2 py-1">Confidence</th>
												</tr>
											</thead>
											<tbody>
												<tr
													v-for="r in autoCategorizeResults.results.filter((r) => r.confidence >= 25)"
													:key="r.transaction_id"
													class="border-t border-purple-100">
													<td class="px-2 py-1 truncate max-w-[200px]">{{ r.description }}</td>
													<td class="px-2 py-1">{{ r.matched_category || '-' }}</td>
													<td class="px-2 py-1 truncate max-w-[150px]">{{ r.matched_budget_item || '-' }}</td>
													<td class="px-2 py-1">{{ r.matched_by }}</td>
													<td class="px-2 py-1 text-right">{{ r.confidence }}%</td>
												</tr>
											</tbody>
										</table>
									</div>
								</details>
							</div>
							<div v-if="autoCategorizeResults.errors?.length > 0" class="mt-3">
								<details class="text-sm text-red-600">
									<summary class="cursor-pointer font-medium">
										View errors ({{ autoCategorizeResults.errors.length }})
									</summary>
									<ul class="mt-1 space-y-1 text-xs">
										<li v-for="(err, i) in autoCategorizeResults.errors" :key="i">{{ err }}</li>
									</ul>
								</details>
							</div>
						</div>
					</div>
				</div>

				<!-- Monthly Statements Backfill & PDF Upload -->
				<div class="bg-white rounded-lg shadow-sm border">
					<div class="border-b px-6 py-4">
						<h2 class="text-xl font-semibold text-gray-900">Monthly Statements Manager</h2>
						<p class="text-sm text-gray-500 mt-1">
							Create monthly_statement records from existing transactions and attach PDF bank statements. Statements are
							used for reconciliation and balance tracking.
						</p>
					</div>
					<div class="p-6 space-y-6">
						<!-- Backfill Controls -->
						<div class="flex items-center gap-4">
							<div class="flex items-center gap-3">
								<label class="text-sm font-medium text-gray-700">Fiscal Year:</label>
								<select v-model="stmtMgrFiscalYear" class="border border-gray-300 rounded-lg px-3 py-2 text-sm">
									<option v-for="fy in availableFiscalYears" :key="fy.id" :value="fy.year">{{ fy.year }}</option>
								</select>
							</div>
							<div class="flex items-center gap-3">
								<label class="text-sm font-medium text-gray-700">Account:</label>
								<select v-model="stmtMgrAccountId" class="border border-gray-300 rounded-lg px-3 py-2 text-sm">
									<option :value="null">All Accounts</option>
									<option v-for="acct in accounts" :key="acct.id" :value="acct.id">
										{{ acct.account_name }} ({{ acct.account_number }})
									</option>
								</select>
							</div>
							<label class="flex items-center gap-2 text-sm text-gray-700">
								<input type="checkbox" v-model="stmtMgrForceRecalc" class="rounded border-gray-300" />
								Force recalculate existing
							</label>
							<button
								v-if="canCreateFinancials"
								@click="runBackfillStatements"
								:disabled="stmtMgrBackfilling"
								class="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 text-sm">
								<span v-if="stmtMgrBackfilling" class="flex items-center gap-2">
									<Icon name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
									Creating Statements...
								</span>
								<span v-else>Create Monthly Statements</span>
							</button>
							<button
								v-if="stmtMgrStatements.length > 0"
								@click="loadExistingStatements"
								class="text-indigo-600 hover:text-indigo-800 text-sm underline">
								Refresh List
							</button>
						</div>

						<!-- Starting Balances -->
						<div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
							<h4 class="text-sm font-medium text-gray-700 mb-2">
								Starting Balances (Jan 1 opening balance from bank)
							</h4>
							<p class="text-xs text-gray-500 mb-3">
								Enter the beginning balance from each account's January statement so running balances are accurate.
							</p>
							<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
								<div v-for="acct in accounts" :key="'bal-' + acct.id" class="flex items-center gap-2">
									<label class="text-xs text-gray-600 whitespace-nowrap">{{ acct.account_name }}:</label>
									<input
										type="number"
										step="0.01"
										v-model.number="startingBalances[acct.id]"
										placeholder="$0.00"
										class="border border-gray-300 rounded px-2 py-1 text-sm w-32 font-mono" />
								</div>
							</div>
						</div>

						<!-- Backfill Results -->
						<div
							v-if="stmtMgrBackfillResults"
							class="p-4 rounded-lg border"
							:class="
								stmtMgrBackfillResults.created > 0 ? 'bg-indigo-50 border-indigo-200' : 'bg-gray-50 border-gray-200'
							">
							<h3
								class="font-semibold"
								:class="stmtMgrBackfillResults.created > 0 ? 'text-indigo-800' : 'text-gray-700'">
								Backfill Results
							</h3>
							<ul class="text-sm mt-2 space-y-1">
								<li>Created: {{ stmtMgrBackfillResults.created }}</li>
								<li v-if="stmtMgrBackfillResults.updated > 0">Updated: {{ stmtMgrBackfillResults.updated }}</li>
								<li v-if="stmtMgrBackfillResults.skipped > 0">Already existed: {{ stmtMgrBackfillResults.skipped }}</li>
							</ul>
						</div>

						<!-- Existing Statements with PDF Upload -->
						<div v-if="stmtMgrStatements.length > 0">
							<h3 class="font-semibold text-gray-800 mb-3">Monthly Statements</h3>
							<div class="overflow-x-auto">
								<table class="w-full text-sm">
									<thead class="bg-gray-50">
										<tr>
											<th class="text-left px-3 py-2">Account</th>
											<th class="text-left px-3 py-2">Month</th>
											<th class="text-right px-3 py-2">Beginning Balance</th>
											<th class="text-right px-3 py-2">Ending Balance</th>
											<th class="text-center px-3 py-2">Reconciled</th>
											<th class="text-center px-3 py-2">PDF Statement</th>
										</tr>
									</thead>
									<tbody>
										<tr v-for="stmt in stmtMgrStatements" :key="stmt.id" class="border-t">
											<td class="px-3 py-2">{{ getAccountNameById(stmt.account_id) }}</td>
											<td class="px-3 py-2">{{ monthLabel(stmt.statement_month) }}</td>
											<td class="px-3 py-2 text-right font-mono">{{ formatMoney(stmt.beginning_balance) }}</td>
											<td class="px-3 py-2 text-right font-mono">{{ formatMoney(stmt.ending_balance) }}</td>
											<td class="px-3 py-2 text-center">
												<span v-if="stmt.reconciled" class="text-green-600 text-xs font-medium">Reconciled</span>
												<span v-else class="text-gray-400 text-xs">Pending</span>
											</td>
											<td class="px-3 py-2 text-center">
												<span v-if="stmt.pdf_statement" class="inline-flex items-center gap-1 text-green-600 text-xs">
													<Icon name="i-heroicons-document-check" class="w-4 h-4" />
													Attached
												</span>
												<label
													v-else
													class="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 cursor-pointer text-xs">
													<Icon name="i-heroicons-arrow-up-tray" class="w-4 h-4" />
													Upload PDF
													<input
														type="file"
														accept=".pdf"
														class="hidden"
														@change="(e) => uploadStatementPdf(stmt.id, e)" />
												</label>
											</td>
										</tr>
									</tbody>
								</table>
							</div>
							<p class="text-xs text-gray-500 mt-3">
								To reconcile monthly statements, go to
								<NuxtLink to="/financials/reconciliation" class="text-indigo-600 hover:underline">
									Financials &rarr; Reconciliation
								</NuxtLink>
							</p>
						</div>
					</div>
				</div>

				<div class="bg-white rounded-lg shadow-sm border">
					<div class="border-b px-6 py-4">
						<h2 class="text-xl font-semibold text-gray-900">Fiscal Year Data Repair</h2>
						<p class="text-sm text-gray-500 mt-1">
							Fix transactions that have raw year numbers instead of proper fiscal_years M2O record IDs. This repairs
							data from older imports that stored the year number (e.g., 2025) instead of the Directus fiscal_years
							record ID.
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
							<div
								class="p-4 rounded-lg border"
								:class="
									repairScanResults.issueCount > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'
								">
								<h3
									:class="repairScanResults.issueCount > 0 ? 'text-yellow-800' : 'text-green-800'"
									class="font-semibold">
									{{
										repairScanResults.issueCount > 0
											? `Found ${repairScanResults.issueCount} transactions to repair`
											: 'All transactions have correct fiscal year references'
									}}
								</h3>
								<ul
									class="text-sm mt-2 space-y-1"
									:class="repairScanResults.issueCount > 0 ? 'text-yellow-700' : 'text-green-700'">
									<li>Total transactions scanned: {{ repairScanResults.totalScanned }}</li>
									<li>Correct M2O references: {{ repairScanResults.correctCount }}</li>
									<li>Raw year numbers needing repair: {{ repairScanResults.issueCount }}</li>
									<li v-if="repairScanResults.yearBreakdown">
										Breakdown:
										{{
											Object.entries(repairScanResults.yearBreakdown)
												.map(([y, c]) => `${y}: ${c} transactions`)
												.join(', ')
										}}
									</li>
								</ul>
							</div>

							<!-- Missing fiscal years warning -->
							<div
								v-if="repairScanResults.issueCount > 0 && repairScanResults.missingYears?.length > 0"
								class="p-4 bg-red-50 border border-red-200 rounded-lg">
								<h3 class="font-semibold text-red-800">Missing Fiscal Year Records</h3>
								<p class="text-sm text-red-700 mt-1">
									The following year(s) were found in transactions but have no matching
									<code class="bg-red-100 px-1 rounded">fiscal_years</code>
									record in Directus:
								</p>
								<div class="flex flex-wrap gap-2 mt-3">
									<span
										v-for="year in repairScanResults.missingYears"
										:key="year"
										class="inline-flex items-center px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
										{{ year }}
										<span class="ml-1 text-red-500 text-xs">
											({{ repairScanResults.yearBreakdown[year] }} transactions)
										</span>
									</span>
								</div>
								<p class="text-sm text-red-700 mt-3">
									You must create these fiscal years before the repair can run. Go to the
									<button @click="activeTab = 'accounts'" class="underline font-medium hover:text-red-900">
										Bank Accounts tab
									</button>
									and use "+ Add Fiscal Year" to create them, then scan again.
								</p>
							</div>

							<!-- Repair Button -->
							<div v-if="repairScanResults.issueCount > 0" class="flex items-center gap-4">
								<button
									v-if="canUpdateFinancials"
									@click="repairFiscalYears"
									:disabled="repairRunning || repairScanResults.repairableCount === 0"
									class="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 text-sm">
									<span v-if="repairRunning">
										Repairing... ({{ repairProgress }}/{{ repairScanResults.repairableCount }})
									</span>
									<span v-else-if="repairScanResults.repairableCount === 0">
										No Repairable Transactions (create fiscal years first)
									</span>
									<span v-else>Repair {{ repairScanResults.repairableCount }} Transactions</span>
								</button>
								<p v-if="!canUpdateFinancials" class="text-sm text-red-600">
									You need financials update permission to run repairs.
								</p>
							</div>

							<!-- Repair Results -->
							<div
								v-if="repairResults"
								class="p-4 rounded-lg border"
								:class="repairResults.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'">
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

useSeoMeta({
	title: 'Import Center',
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
const monthlyStatementsCollection = useDirectusItems('monthly_statements');

// Permission checks
const {canCreate, canRead, canUpdate, canDelete, hasFullAccess} = useUserPermissions();
const canReadFinancials = computed(() => canRead('financials'));
const canCreateFinancials = computed(() => canCreate('financials'));
const canUpdateFinancials = computed(() => canUpdate('financials'));
const canDeleteFinancials = computed(() => canDelete('financials'));

// Tab state - maintenance tab only visible to users with update permission
const allTabs = [
	{id: 'accounts', label: 'Bank Accounts', icon: 'i-heroicons-building-library', requiresCreate: false},
	{id: 'budgets', label: 'Budget Import', icon: 'i-heroicons-calculator', requiresCreate: true},
	{id: 'statements', label: 'Statement Import', icon: 'i-heroicons-document-arrow-up', requiresCreate: true},
	{id: 'maintenance', label: 'Data Maintenance', icon: 'i-heroicons-wrench-screwdriver', requiresUpdate: true},
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
const autoCatFiscalYear = ref(new Date().getFullYear());

// Monthly Statements Manager state
const stmtMgrFiscalYear = ref(new Date().getFullYear());
const stmtMgrAccountId = ref(null);
const stmtMgrBackfilling = ref(false);
const stmtMgrBackfillResults = ref(null);
const stmtMgrStatements = ref([]);
const startingBalances = reactive({});
const stmtMgrForceRecalc = ref(false);

const fiscalYearIdCache = {};

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

const fileTypes = [
	{
		id: 'pdf',
		label: 'PDF Statement',
		icon: 'i-heroicons-document',
		description: 'Upload PDF — Claude extracts CSV with categories',
	},
	{
		id: 'json',
		label: 'JSON Transactions',
		icon: 'i-heroicons-code-bracket',
		description: 'Structured transaction data',
	},
	{id: 'csv', label: 'CSV Statement', icon: 'i-heroicons-table-cells', description: 'Reconciliation CSV format'},
	{id: 'batch', label: 'Batch PDF Import', icon: 'i-heroicons-document-duplicate', description: 'Upload multiple PDFs at once'},
];

// ======================
// FISCAL YEAR RESOLUTION
// ======================
async function resolveFiscalYearId(yearNumber) {
	if (!yearNumber) return null;
	if (fiscalYearIdCache[yearNumber]) return fiscalYearIdCache[yearNumber];

	try {
		const data = await fiscalYearsCollection.list({
			filter: {year: {_eq: yearNumber}},
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
 * If transactions span multiple months, returns '' so per-transaction derivation is used.
 */
function detectMonthFromTransactions(transactions) {
	if (!transactions.length) return '';

	// Check for Period field (only if consistent across transactions)
	const period = transactions[0]?.Period || transactions[0]?.period;
	if (period) {
		const monthNum = new Date(`${period} 1, 2025`).getMonth() + 1;
		if (!isNaN(monthNum)) return monthNum.toString().padStart(2, '0');
	}

	// Collect all unique months from transaction dates
	const months = new Set();
	for (const tx of transactions) {
		const dateStr = tx.date || tx.Date || '';
		let month = null;

		// ISO format: "2025-01-15"
		if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
			month = dateStr.substring(5, 7);
		} else {
			// US format: "01/15/2025" or "01/15"
			const parts = dateStr.split('/');
			if (parts.length >= 2) {
				const m = parseInt(parts[0]);
				if (m >= 1 && m <= 12) month = m.toString().padStart(2, '0');
			}
		}
		if (month) months.add(month);
	}

	// If all transactions are in the same month, return it
	if (months.size === 1) return [...months][0];

	// Multiple months detected — leave empty so per-transaction month derivation is used
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
			filter: {status: {_eq: 'published'}},
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
			.map((fy) => ({...fy, is_current: fy.year === currentYear}));

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
		await fiscalYearsCollection.update(id, {status: newStatus});

		// Update local state
		const fy = allFiscalYears.value.find((f) => f.id === id);
		if (fy) fy.status = newStatus;

		// Refresh available years for other tabs (only published years)
		const currentYear = new Date().getFullYear();
		availableFiscalYears.value = allFiscalYears.value
			.filter((f) => f.status === 'published')
			.map((f) => ({...f, is_current: f.year === currentYear}));
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
watch(
	budgetFiscalYear,
	async (year) => {
		resolvedBudgetFiscalYearId.value = await resolveFiscalYearId(year);
	},
	{immediate: true}
);

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
					item_code: (description || category)
						.toLowerCase()
						.replace(/\s+/g, '-')
						.replace(/[^a-z0-9-]/g, ''),
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

	const results = {success: true, message: '', categoriesCreated: 0, itemsCreated: 0, itemsSkipped: 0};

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
			filter: {fiscal_year: {_eq: fyId}},
			fields: ['id', 'category_name'],
			limit: -1,
		});
		const categoryMap = {};
		existingCategories.forEach((c) => (categoryMap[c.category_name] = c.id));

		// Load existing budget items for duplicate detection
		const existingItems = await budgetItemsCollection.list({
			filter: {fiscal_year: {_eq: fyId}},
			fields: ['id', 'item_code', 'category_id', 'description'],
			limit: -1,
		});
		// Build a set of existing item keys: "categoryId::itemCode"
		const existingItemKeys = new Set(
			existingItems.map((it) => {
				const catId = typeof it.category_id === 'object' ? it.category_id?.id : it.category_id;
				return `${catId}::${it.item_code}`;
			})
		);

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
				categoryMap[catName] = categoryId;
				results.categoriesCreated++;
			}

			for (const item of items) {
				// Duplicate check: skip if same item_code already exists under this category
				const itemKey = `${categoryId}::${item.item_code}`;
				if (existingItemKeys.has(itemKey)) {
					results.itemsSkipped++;
					budgetImportProgress.value++;
					continue;
				}

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
				existingItemKeys.add(itemKey);
				budgetImportProgress.value++;
			}
		}

		const parts = [];
		if (results.categoriesCreated) parts.push(`${results.categoriesCreated} categories created`);
		if (results.itemsCreated) parts.push(`${results.itemsCreated} budget items created`);
		if (results.itemsSkipped) parts.push(`${results.itemsSkipped} duplicate items skipped`);
		results.message =
			parts.length > 0
				? `${parts.join(', ')} for fiscal year ${budgetFiscalYear.value}.`
				: `No new items to import for fiscal year ${budgetFiscalYear.value} (all duplicates).`;
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
const autoCategorizing = ref(false);
const autoCategorizeResults = ref(null);
const pastedJson = ref('');
const pdfUploadResult = ref(null);
const extractedPdfFileId = ref(null);
const claudeExtracting = ref(false);
const claudeExtractionError = ref('');
const claudeTokenUsage = ref(null);
const pdfToCsvExtracting = ref(false);
const pdfToCsvResult = ref(null);
const resolvedStmtFiscalYearId = ref(null);

// Chase CSV multi-month support: per-month balances from Chase Balance column
const chaseMonthBalances = ref(null); // Record<string, { beginning_balance, ending_balance, transaction_count }>
const chaseSelectedMonth = ref(''); // '' = all months, 'MM' = specific month

const selectedAccountName = computed(() => {
	const acct = accounts.value.find((a) => a.id === stmtAccountId.value);
	return acct ? acct.account_name : 'Selected Account';
});

// Multi-month Chase CSV support
const isMultiMonthChase = computed(() => {
	const mb = chaseMonthBalances.value;
	return mb && Object.keys(mb).length > 1;
});

const chaseAvailableMonths = computed(() => {
	const mb = chaseMonthBalances.value;
	if (!mb) return [];
	const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
		'July', 'August', 'September', 'October', 'November', 'December'];
	return Object.keys(mb).sort().map(mm => ({
		value: mm,
		label: MONTH_NAMES[parseInt(mm, 10) - 1] || mm,
		...mb[mm],
	}));
});

// Derive month from a transaction's date (handles MM/DD/YYYY and YYYY-MM-DD)
function txMonth(tx) {
	const d = tx.date || '';
	if (/^\d{4}-\d{2}/.test(d)) return d.substring(5, 7);
	const parts = d.split('/');
	if (parts.length >= 2) return parts[0].padStart(2, '0');
	return '';
}

// When a month is selected in a multi-month Chase CSV, filter transactions
const displayedTransactions = computed(() => {
	if (!isMultiMonthChase.value || !chaseSelectedMonth.value) return stmtTransactions.value;
	return stmtTransactions.value.filter(tx => txMonth(tx) === chaseSelectedMonth.value);
});

// Effective balances: use Chase per-month data when a specific month is selected
const displayedBeginningBalance = computed(() => {
	if (isMultiMonthChase.value && chaseSelectedMonth.value) {
		return chaseMonthBalances.value?.[chaseSelectedMonth.value]?.beginning_balance ?? null;
	}
	return stmtBeginningBalance.value;
});

const displayedEndingBalance = computed(() => {
	if (isMultiMonthChase.value && chaseSelectedMonth.value) {
		return chaseMonthBalances.value?.[chaseSelectedMonth.value]?.ending_balance ?? null;
	}
	return stmtEndingBalance.value;
});

const stmtTotalDeposits = computed(() =>
	displayedTransactions.value
		.filter((tx) => tx.type === 'deposit' || tx.type === 'transfer_in')
		.reduce((sum, tx) => sum + Math.abs(tx.amount), 0)
);

const stmtTotalWithdrawals = computed(() =>
	displayedTransactions.value
		.filter((tx) => ['withdrawal', 'fee', 'transfer_out'].includes(tx.type))
		.reduce((sum, tx) => sum + Math.abs(tx.amount), 0)
);

// Resolve fiscal year ID when year changes
watch(
	stmtFiscalYear,
	async (year) => {
		resolvedStmtFiscalYearId.value = await resolveFiscalYearId(year);
	},
	{immediate: true}
);

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
	autoCategorizeResults.value = null;
	pdfUploadResult.value = null;
	extractedPdfFileId.value = null;
	stmtDetectedYear.value = null;
	stmtDetectedMonth.value = '';
	claudeExtractionError.value = '';
	claudeTokenUsage.value = null;
	pdfToCsvResult.value = null;
	chaseMonthBalances.value = null;
	chaseSelectedMonth.value = '';
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

async function extractPdfWithClaude() {
	if (!stmtFile.value) return;
	claudeExtracting.value = true;
	claudeExtractionError.value = '';
	claudeTokenUsage.value = null;

	try {
		const formData = new FormData();
		formData.append('file', stmtFile.value);

		const result = await $fetch('/api/admin/extract-pdf-transactions', {
			method: 'POST',
			body: formData,
		});

		if (result.token_usage) {
			claudeTokenUsage.value = result.token_usage;
		}

		if (result.success && result.transactions) {
			// Save PDF file ID if uploaded to Directus
			if (result.pdf_file_id) {
				extractedPdfFileId.value = result.pdf_file_id;
			}

			applyParsedTransactions({
				success: true,
				transactions: result.transactions,
				beginning_balance: result.beginning_balance,
				ending_balance: result.ending_balance,
				statement_period: result.statement_period,
			});

			// If Claude detected a statement period, try to auto-detect month from it
			if (result.statement_period && !stmtMonth.value) {
				const periodLower = result.statement_period.toLowerCase();
				const monthNames = [
					'january',
					'february',
					'march',
					'april',
					'may',
					'june',
					'july',
					'august',
					'september',
					'october',
					'november',
					'december',
				];
				const matchedIdx = monthNames.findIndex((m) => periodLower.includes(m));
				if (matchedIdx >= 0) {
					stmtMonth.value = String(matchedIdx + 1).padStart(2, '0');
				}
			}
		} else {
			claudeExtractionError.value = result.error || 'Claude could not extract transactions from this PDF.';
		}
	} catch (err) {
		console.error('Claude extraction error:', err);
		claudeExtractionError.value = err.data?.message || err.message || 'Failed to connect to Claude API.';
	} finally {
		claudeExtracting.value = false;
	}
}

async function extractPdfToCsv() {
	if (!stmtFile.value) return;
	pdfToCsvExtracting.value = true;
	pdfToCsvResult.value = null;
	claudeExtractionError.value = '';
	claudeTokenUsage.value = null;

	try {
		const formData = new FormData();
		formData.append('file', stmtFile.value);

		const result = await $fetch('/api/admin/pdf-to-csv', {
			method: 'POST',
			body: formData,
		});

		if (result.token_usage) {
			claudeTokenUsage.value = result.token_usage;
		}

		if (result.success) {
			pdfToCsvResult.value = result;

			// Save PDF file ID if uploaded to Directus
			if (result.pdf_file_id) {
				extractedPdfFileId.value = result.pdf_file_id;
			}

			// Auto-detect statement period for month selection
			if (result.statement_period && !stmtMonth.value) {
				const periodLower = result.statement_period.toLowerCase();
				const monthNames = [
					'january',
					'february',
					'march',
					'april',
					'may',
					'june',
					'july',
					'august',
					'september',
					'october',
					'november',
					'december',
				];
				const matchedIdx = monthNames.findIndex((m) => periodLower.includes(m));
				if (matchedIdx >= 0) {
					stmtMonth.value = String(matchedIdx + 1).padStart(2, '0');
					stmtDetectedMonth.value = stmtMonth.value;
				}
			}

			// Auto-detect fiscal year from transaction dates
			if (result.transactions && result.transactions.length > 0) {
				const detectedYear = detectFiscalYearFromDates(result.transactions);
				if (detectedYear) {
					stmtDetectedYear.value = detectedYear;
					const currentYear = new Date().getFullYear();
					if (stmtFiscalYear.value === currentYear && detectedYear !== currentYear) {
						stmtFiscalYear.value = detectedYear;
					}
				}
			}
		} else {
			claudeExtractionError.value = result.error || 'Claude could not extract transactions from this PDF.';
		}
	} catch (err) {
		console.error('PDF-to-CSV extraction error:', err);
		claudeExtractionError.value = err.data?.message || err.message || 'Failed to connect to Claude API.';
	} finally {
		pdfToCsvExtracting.value = false;
	}
}

function downloadCsvFromPdf() {
	if (!pdfToCsvResult.value?.csv_text) return;

	const blob = new Blob([pdfToCsvResult.value.csv_text], {type: 'text/csv'});
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	const period = pdfToCsvResult.value.statement_period || 'statement';
	link.download = `${period.toLowerCase().replace(/\s+/g, '-')}-transactions.csv`;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}

function loadPdfCsvIntoPreview() {
	if (!pdfToCsvResult.value?.transactions) return;

	const txs = pdfToCsvResult.value.transactions.map((tx, index) => ({
		date: tx.date || '',
		description: tx.description || '',
		amount: Math.abs(parseFloat(tx.amount) || 0),
		type: normalizeType(tx.type || ''),
		vendor: tx.vendor || '',
		category: tx.category || '',
		period: tx.period || '',
		_raw: {...tx, Category: tx.category, Period: tx.period},
		_source_line: index + 1,
	}));

	applyParsedTransactions({
		success: true,
		transactions: txs,
		beginning_balance: pdfToCsvResult.value.beginning_balance ?? null,
		ending_balance: pdfToCsvResult.value.ending_balance ?? null,
		statement_period: pdfToCsvResult.value.statement_period || null,
	});
}

function handleBatchLoadResult(batchFile) {
	if (!batchFile?.result) return;
	const r = batchFile.result;
	const txs = (r.transactions || []).map((tx, index) => ({
		date: tx.date || '',
		description: tx.description || '',
		amount: Math.abs(parseFloat(tx.amount) || 0),
		type: normalizeType(tx.type || ''),
		vendor: tx.vendor || '',
		category: tx.category || '',
		period: tx.period || '',
		_raw: {...tx, Category: tx.category, Period: tx.period},
		_source_line: index + 1,
	}));
	applyParsedTransactions({
		success: true,
		transactions: txs,
		beginning_balance: r.beginning_balance ?? null,
		ending_balance: r.ending_balance ?? null,
		statement_period: r.statement_period || null,
	});
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

		const normalized = transactions.map((tx, index) => ({
			date: tx.date || tx.Date || '',
			description: tx.description || tx.Description || '',
			amount: parseFloat(tx.amount || tx.Amount || 0),
			type: normalizeType(tx.type || tx.Type || ''),
			vendor: tx.vendor || tx.Vendor || '',
			category: tx.category || tx.Category || '',
			_raw: tx,
			_source_line: index + 1,
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

	// Store per-month balances from Chase CSV if present
	chaseMonthBalances.value = result.month_balances || null;

	// If multi-month Chase CSV, auto-select first month
	if (result.month_balances && Object.keys(result.month_balances).length > 1) {
		const firstMonth = Object.keys(result.month_balances).sort()[0];
		chaseSelectedMonth.value = firstMonth;
	} else {
		chaseSelectedMonth.value = '';
	}

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
	const txToImport = displayedTransactions.value;
	if (!stmtAccountId.value || !resolvedStmtFiscalYearId.value || txToImport.length === 0) return;

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
		const importMonth = chaseSelectedMonth.value || stmtMonth.value || 'all';
		const batchId = `import_${stmtFiscalYear.value}_${importMonth}_${Date.now()}`;

		// Load budget categories for mapping CSV Category names to category_ids
		let categoryNameMap = {};
		try {
			const categories = await budgetCategoriesCollection.list({
				filter: {
					_or: [{fiscal_year: {_eq: fyId}}, {fiscal_year: {_null: true}}],
				},
				fields: ['id', 'category_name'],
				limit: -1,
			});
			for (const cat of categories) {
				if (cat.category_name) {
					categoryNameMap[cat.category_name.toLowerCase().trim()] = cat.id;
				}
			}
		} catch (err) {
			console.warn('Could not load budget categories for mapping:', err.message);
		}

		// Load existing transactions for duplicate detection
		const existingFilter = {
			account_id: {_eq: stmtAccountId.value},
			fiscal_year: {_eq: fyId},
		};

		let existingTransactions = [];
		try {
			existingTransactions = await transactionsCollection.list({
				filter: existingFilter,
				fields: ['id', 'transaction_date', 'amount', 'description', 'transaction_type'],
				limit: -1,
			});
		} catch (err) {
			console.warn('Could not load existing transactions for duplicate check:', err.message);
			results.errors.push('Warning: duplicate detection unavailable — existing transactions could not be loaded.');
		}

		// Build a fingerprint set from existing transactions for O(1) lookups
		function txFingerprint(date, amount, description, type) {
			const d = (date || '').substring(0, 10);
			const a = Math.abs(parseFloat(amount) || 0).toFixed(2);
			const desc = (description || '').trim().toLowerCase();
			const t = (type || 'withdrawal').toLowerCase();
			return `${d}|${a}|${desc}|${t}`;
		}

		const existingFingerprints = new Set(
			existingTransactions.map((et) =>
				txFingerprint(et.transaction_date, et.amount, et.description, et.transaction_type)
			)
		);

		// Import each transaction (only the displayed/filtered set)
		for (let i = 0; i < txToImport.length; i++) {
			const tx = txToImport[i];

			try {
				const txDate = formatTransactionDate(tx.date);
				let txType = normalizeType(tx.type);
				const txDesc = (tx.description || '').trim();
				const txAmount = Math.abs(tx.amount);
				const csvCategory = (tx.category || tx._raw?.Category || '').trim();

				// Detect transfers: if CSV Category is "Transfer", set proper transaction_type
				if (csvCategory.toLowerCase() === 'transfer') {
					txType = txType === 'deposit' ? 'transfer_in' : 'transfer_out';
				}

				// Resolve CSV category name to a budget category ID
				let categoryId = null;
				if (csvCategory && csvCategory.toLowerCase() !== 'transfer') {
					// Look up by exact name (case-insensitive)
					categoryId = categoryNameMap[csvCategory.toLowerCase().trim()] || null;
				}

				// Duplicate check against existing DB records + already-imported in this batch
				const fp = txFingerprint(txDate, txAmount, txDesc, txType);
				if (existingFingerprints.has(fp)) {
					results.skipped++;
					stmtImportProgress.value++;
					continue;
				}

				// Derive statement_month strictly from the transaction's own date.
				// Never fall back to a global month — that causes boundary transactions
				// (first/last day of month) to land in the wrong month.
				const txStatementMonth = deriveStatementMonth(txDate, tx.date);
				if (!txStatementMonth) {
					console.warn(`Row ${i + 1}: Could not derive month from date "${tx.date}" (formatted: "${txDate}"). Skipping.`);
					results.errors.push(`Row ${i + 1}: Could not determine month from date "${tx.date}"`);
					stmtImportProgress.value++;
					continue;
				}

				const txRecord = {
					fiscal_year: fyId,
					account_id: stmtAccountId.value,
					transaction_date: txDate,
					description: txDesc,
					vendor: tx.vendor || null,
					amount: txAmount,
					transaction_type: txType,
					auto_categorized: false,
					statement_month: txStatementMonth,
					import_batch_id: batchId,
					csv_source_line: tx._source_line || i + 1,
					original_csv_data: tx._raw || {
						date: tx.date,
						description: tx.description,
						amount: tx.amount,
						type: tx.type,
						vendor: tx.vendor,
						category: csvCategory,
					},
					status: 'published',
				};

				// Set category_id if resolved from CSV Category column
				if (categoryId) {
					txRecord.category_id = categoryId;
					txRecord.auto_categorized = true;
				}

				await transactionsCollection.create(txRecord);

				// Add to fingerprint set so later rows in this batch are also deduplicated
				existingFingerprints.add(fp);
				results.created++;
			} catch (err) {
				results.errors.push(`Row ${i + 1}: ${err.message}`);
			}

			stmtImportProgress.value++;
		}

		if (results.errors.length > 0 && results.created === 0) {
			results.success = false;
		}

		// Create/update the monthly_statement with Chase balance data if available
		if (results.success && results.created > 0 && stmtAccountId.value) {
			const selectedMM = chaseSelectedMonth.value;
			const monthBal = selectedMM && chaseMonthBalances.value?.[selectedMM];

			if (monthBal) {
				// Save the monthly_statement with actual Chase bank balances
				await saveMonthlyStatementWithBalances(selectedMM, monthBal.beginning_balance, monthBal.ending_balance);
			} else {
				// Non-Chase or single-month: use the overall balances or backfill
				const beginBal = displayedBeginningBalance.value;
				const endBal = displayedEndingBalance.value;
				const month = chaseSelectedMonth.value || stmtMonth.value;

				if (month && (beginBal != null || endBal != null)) {
					await saveMonthlyStatementWithBalances(month, beginBal, endBal);
				} else {
					await saveAllMonthlyStatements();
				}
			}
		}

		// Auto-categorize after successful import
		if (results.success && results.created > 0) {
			await runAutoCategorize(stmtFiscalYear.value, stmtAccountId.value);
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

async function runAutoCategorize(fiscalYear = null, accountId = null) {
	autoCategorizing.value = true;
	autoCategorizeResults.value = null;

	try {
		const body = {
			fiscal_year: fiscalYear || stmtFiscalYear.value,
		};

		if (accountId) {
			body.account_id = accountId;
		}

		const result = await $fetch('/api/admin/auto-categorize-transactions', {
			method: 'POST',
			body,
		});

		autoCategorizeResults.value = result;
	} catch (err) {
		console.error('Auto-categorize error:', err);
		autoCategorizeResults.value = {
			success: false,
			categorized: 0,
			skipped: 0,
			total_uncategorized: 0,
			errors: [err.message || 'Auto-categorization failed'],
		};
	} finally {
		autoCategorizing.value = false;
	}
}

// ======================
// MONTHLY STATEMENTS MANAGER
// ======================
async function runBackfillStatements() {
	stmtMgrBackfilling.value = true;
	stmtMgrBackfillResults.value = null;

	try {
		const body = {fiscal_year: stmtMgrFiscalYear.value};
		if (stmtMgrAccountId.value) {
			body.account_id = stmtMgrAccountId.value;
		}
		if (stmtMgrForceRecalc.value) {
			body.force = true;
		}

		// Include starting balances if any are set
		const balances = {};
		for (const [id, val] of Object.entries(startingBalances)) {
			if (val !== undefined && val !== null && val !== '') balances[id] = Number(val);
		}
		if (Object.keys(balances).length > 0) {
			body.starting_balances = balances;
		}

		const result = await $fetch('/api/admin/backfill-monthly-statements', {
			method: 'POST',
			body,
		});

		stmtMgrBackfillResults.value = result;

		// Reload the statements list
		await loadExistingStatements();
	} catch (err) {
		console.error('Backfill error:', err);
		stmtMgrBackfillResults.value = {
			success: false,
			created: 0,
			updated: 0,
			skipped: 0,
			errors: [err.message || 'Backfill failed'],
		};
	} finally {
		stmtMgrBackfilling.value = false;
	}
}

async function loadExistingStatements() {
	try {
		const data = await monthlyStatementsCollection.list({
			filter: {
				fiscal_year: {year: {_eq: stmtMgrFiscalYear.value}},
				...(stmtMgrAccountId.value ? {account_id: {_eq: stmtMgrAccountId.value}} : {}),
			},
			fields: [
				'id',
				'account_id',
				'statement_month',
				'beginning_balance',
				'ending_balance',
				'reconciled',
				'pdf_statement',
			],
			sort: ['account_id', 'statement_month'],
			limit: -1,
		});
		stmtMgrStatements.value = data || [];
	} catch (err) {
		console.error('Failed to load statements:', err);
	}
}

async function uploadStatementPdf(statementId, event) {
	const file = event.target?.files?.[0];
	if (!file) return;

	try {
		const formData = new FormData();
		formData.append('file', file);
		formData.append('statement_id', String(statementId));

		await $fetch('/api/admin/attach-statement-pdf', {
			method: 'POST',
			body: formData,
		});

		// Refresh list to show updated PDF status
		await loadExistingStatements();
	} catch (err) {
		console.error('PDF upload error:', err);
		alert('Failed to upload PDF: ' + (err.message || 'Unknown error'));
	}
}

function getAccountNameById(accountId) {
	const acct = accounts.value.find((a) => a.id === accountId);
	return acct ? acct.account_name : `Account ${accountId}`;
}

function monthLabel(monthValue) {
	const labels = {
		'01': 'January',
		'02': 'February',
		'03': 'March',
		'04': 'April',
		'05': 'May',
		'06': 'June',
		'07': 'July',
		'08': 'August',
		'09': 'September',
		10: 'October',
		11: 'November',
		12: 'December',
	};
	return labels[monthValue] || monthValue;
}

function formatMoney(value) {
	const num = parseFloat(value);
	if (isNaN(num)) return '$0.00';
	return new Intl.NumberFormat('en-US', {style: 'currency', currency: 'USD'}).format(num);
}

async function saveStatementBalances() {
	const beginBal = stmtBeginningBalance.value;
	const endBal = stmtEndingBalance.value;

	if (beginBal == null && endBal == null && !extractedPdfFileId.value) return;

	try {
		const fyId = resolvedStmtFiscalYearId.value;
		const month = stmtMonth.value;
		const accountId = stmtAccountId.value;

		// Check if a monthly_statements record already exists for this account/month
		const existing = await monthlyStatementsCollection.list({
			filter: {
				account_id: {_eq: accountId},
				statement_month: {_eq: month},
				fiscal_year: {_eq: fyId},
			},
			fields: ['id', 'beginning_balance', 'ending_balance', 'pdf_statement'],
			limit: 1,
		});

		const updates = {status: 'published'};
		if (beginBal != null) updates.beginning_balance = beginBal;
		if (endBal != null) updates.ending_balance = endBal;
		if (extractedPdfFileId.value) updates.pdf_statement = extractedPdfFileId.value;

		if (existing && existing.length > 0) {
			// Update existing record (overwrite if values were missing or PDF needs attaching)
			const record = existing[0];
			const needsUpdate =
				(beginBal != null && !record.beginning_balance) ||
				(endBal != null && !record.ending_balance) ||
				(extractedPdfFileId.value && !record.pdf_statement);

			if (needsUpdate) {
				await monthlyStatementsCollection.update(record.id, updates);
			}
		} else {
			// Create new monthly_statements record
			await monthlyStatementsCollection.create({
				account_id: accountId,
				statement_month: month,
				fiscal_year: fyId,
				...updates,
			});
		}
	} catch (err) {
		console.warn('Could not save statement balances:', err.message);
	}
}

// ======================
// HELPERS
// ======================
/**
 * Derive the statement month (MM) from a transaction date.
 * Handles ISO (YYYY-MM-DD), US (MM/DD/YYYY), and short (MM/DD) formats.
 * Returns null only if the date cannot be parsed at all.
 */
function deriveStatementMonth(isoDate, rawDate) {
	// Try ISO format first: "2025-01-15" or "2025-01-15T00:00:00..."
	if (isoDate && /^\d{4}-\d{2}-\d{2}/.test(isoDate)) {
		return isoDate.substring(5, 7);
	}
	// Try US format: "01/15/2025", "1/15/2025", or "01/15"
	if (rawDate) {
		const parts = rawDate.split('/');
		if (parts.length >= 2) {
			const month = parseInt(parts[0]);
			if (month >= 1 && month <= 12) return month.toString().padStart(2, '0');
		}
	}
	// Try ISO from rawDate as well (in case only rawDate was provided)
	if (rawDate && /^\d{4}-\d{2}-\d{2}/.test(rawDate)) {
		return rawDate.substring(5, 7);
	}
	return null;
}

/**
 * Save a monthly_statement with specific beginning/ending balances (from Chase Balance column).
 * Creates or updates the record for the given month.
 */
async function saveMonthlyStatementWithBalances(month, beginBal, endBal) {
	if (!month || !stmtAccountId.value || !resolvedStmtFiscalYearId.value) return;

	try {
		const fyId = resolvedStmtFiscalYearId.value;
		const accountId = stmtAccountId.value;

		// Check if a monthly_statements record already exists
		const existing = await monthlyStatementsCollection.list({
			filter: {
				account_id: {_eq: accountId},
				statement_month: {_eq: month},
				fiscal_year: {_eq: fyId},
			},
			fields: ['id', 'beginning_balance', 'ending_balance'],
			limit: 1,
		});

		const updates = {status: 'published'};
		if (beginBal != null) updates.beginning_balance = beginBal;
		if (endBal != null) updates.ending_balance = endBal;

		if (existing && existing.length > 0) {
			// Always update with Chase bank balances (they're the source of truth)
			await monthlyStatementsCollection.update(existing[0].id, updates);
			console.log(`Monthly statement ${month}: updated with Chase balances (begin: ${beginBal}, end: ${endBal})`);
		} else {
			await monthlyStatementsCollection.create({
				account_id: accountId,
				statement_month: month,
				fiscal_year: fyId,
				...updates,
			});
			console.log(`Monthly statement ${month}: created with Chase balances (begin: ${beginBal}, end: ${endBal})`);
		}
	} catch (err) {
		console.warn(`Could not save monthly statement for ${month}:`, err.message);
	}
}

/**
 * After importing a multi-month CSV, create/update monthly_statements
 * for every month that has imported transactions (not just one month).
 * Uses the backfill API to calculate balances correctly.
 */
async function saveAllMonthlyStatements() {
	try {
		const result = await $fetch('/api/admin/backfill-monthly-statements', {
			method: 'POST',
			body: {
				fiscal_year: stmtFiscalYear.value,
				account_id: stmtAccountId.value,
			},
		});
		if (result.created > 0 || result.updated > 0) {
			console.log(`Monthly statements: ${result.created} created, ${result.updated} updated, ${result.skipped} skipped`);
		}
	} catch (err) {
		console.warn('Could not backfill monthly statements:', err.message);
	}
}

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
			filter: {status: {_eq: 'published'}},
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
			{id: null, year: currentYear - 1, is_current: false},
			{id: null, year: currentYear, is_current: true},
			{id: null, year: currentYear + 1, is_current: false},
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
		// Map year numbers to fiscal_year record IDs (coerce keys to numbers for reliable lookup)
		const yearToIdMap = {};
		fiscalYears.forEach((fy) => {
			yearToIdMap[Number(fy.year)] = fy.id;
		});

		console.log('Fiscal year records found:', fiscalYears.length, 'yearToIdMap:', JSON.stringify(yearToIdMap));

		// Get all transactions with their fiscal_year field
		// Request the raw FK value — Directus may return null if it tries to resolve
		// an M2O to a non-existent record. So we query in two passes:
		// 1. Transactions where fiscal_year is a valid M2O (already correct)
		// 2. Transactions where fiscal_year is null or not in validIds (needs repair)

		let correctCount = 0;
		let issueCount = 0;
		const yearBreakdown = {};
		const transactionsToFix = [];

		// Pass 1: count transactions that already have correct M2O references
		for (const fyId of validIds) {
			try {
				const batch = await transactionsCollection.list({
					filter: {fiscal_year: {_eq: fyId}},
					fields: ['id'],
					limit: -1,
				});
				correctCount += batch.length;
			} catch {
				// skip
			}
		}

		// Pass 2: find transactions that DON'T match any valid fiscal year record
		// These are the ones with raw year numbers (e.g., 2025 stored as FK)
		// Directus returns null for unresolvable M2O values, so query for null fiscal_year
		const nullFyTransactions = await transactionsCollection.list({
			filter: {fiscal_year: {_null: true}},
			fields: ['id'],
			limit: -1,
		});

		// For null-value transactions, we need to figure out what year they belong to.
		// Use the transaction_date to infer the year since the raw FK value is lost when
		// Directus returns null for unresolvable M2O references.
		if (nullFyTransactions.length > 0) {
			const nullTxDetails = await transactionsCollection.list({
				filter: {fiscal_year: {_null: true}},
				fields: ['id', 'transaction_date', 'fiscal_year'],
				limit: -1,
			});

			for (const tx of nullTxDetails) {
				issueCount++;
				// Infer year from transaction_date
				let yearNum = null;
				if (tx.transaction_date) {
					yearNum = new Date(tx.transaction_date).getFullYear();
				}
				if (yearNum) {
					yearBreakdown[yearNum] = (yearBreakdown[yearNum] || 0) + 1;
					transactionsToFix.push({
						id: tx.id,
						currentValue: null,
						yearNumber: yearNum,
						correctId: yearToIdMap[yearNum] || null,
					});
				} else {
					// No date to infer from — still count as issue but can't auto-repair
					transactionsToFix.push({
						id: tx.id,
						currentValue: null,
						yearNumber: null,
						correctId: null,
					});
				}
			}
		}

		// Also check for transactions with non-null fiscal_year that aren't valid M2O IDs
		// (in case Directus returns the raw value instead of null for some configurations)
		const allTransactions = await transactionsCollection.list({
			fields: ['id', 'fiscal_year', 'transaction_date'],
			limit: -1,
		});
		const alreadyCounted = new Set([...transactionsToFix.map((t) => t.id)]);
		for (const tx of allTransactions) {
			if (alreadyCounted.has(tx.id)) continue;
			const fyValue = tx.fiscal_year;
			if (!fyValue) continue; // already handled above
			const fyId = typeof fyValue === 'object' ? fyValue.id : fyValue;
			if (validIds.has(fyId)) continue; // already counted as correct

			// Raw year number that Directus didn't nullify
			issueCount++;
			const yearNum = Number(typeof fyValue === 'object' ? fyValue.year : fyValue);
			yearBreakdown[yearNum] = (yearBreakdown[yearNum] || 0) + 1;
			transactionsToFix.push({
				id: tx.id,
				currentValue: fyValue,
				yearNumber: yearNum,
				correctId: yearToIdMap[yearNum] || null,
			});
		}

		// Identify which years have no fiscal_years record
		const missingYears = Object.keys(yearBreakdown)
			.map(Number)
			.filter((y) => !yearToIdMap[y])
			.sort();

		// Count how many transactions can actually be repaired (have a matching fiscal year)
		const repairableCount = transactionsToFix.filter((tx) => tx.correctId !== null).length;

		console.log('Scan results:', {correctCount, issueCount, repairableCount, missingYears, yearBreakdown, yearToIdMap});

		const totalScanned = correctCount + issueCount;
		repairScanResults.value = {
			totalScanned,
			correctCount,
			issueCount,
			yearBreakdown: Object.keys(yearBreakdown).length > 0 ? yearBreakdown : null,
			transactionsToFix,
			yearToIdMap,
			missingYears,
			repairableCount,
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
