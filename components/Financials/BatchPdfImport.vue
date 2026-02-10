<template>
	<div class="space-y-6">
		<!-- Header -->
		<div class="bg-white rounded-lg shadow-sm border">
			<div class="border-b px-6 py-4">
				<div class="flex items-center justify-between">
					<div>
						<h2 class="text-xl font-semibold text-gray-900">Batch PDF Import</h2>
						<p class="text-sm text-gray-500 mt-1">
							Upload multiple PDF bank statements at once. Claude will extract transactions from each one.
						</p>
					</div>
					<span class="bg-amber-100 text-amber-800 text-xs font-medium px-3 py-1 rounded-full">Uses Claude API</span>
				</div>
			</div>

			<div class="p-6 space-y-6">
				<!-- Configuration Row -->
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Account</label>
						<select v-model="selectedAccountId" class="w-full border rounded-lg px-3 py-2 text-sm">
							<option value="">Select Account</option>
							<option v-for="account in accounts" :key="account.id" :value="account.id">
								{{ account.account_name }} ({{ account.account_number }})
							</option>
						</select>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Fiscal Year</label>
						<select v-model="selectedFiscalYear" class="w-full border rounded-lg px-3 py-2 text-sm">
							<option v-for="fy in availableFiscalYears" :key="fy.id" :value="fy.year">
								{{ fy.year }}{{ fy.is_current ? ' (Current)' : '' }}
							</option>
						</select>
					</div>
				</div>

				<!-- Drop Zone -->
				<div
					class="border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer"
					:class="dragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'"
					@dragover.prevent="dragging = true"
					@dragleave.prevent="dragging = false"
					@drop.prevent="handleDrop"
					@click="$refs.batchFileInput.click()">
					<input ref="batchFileInput" type="file" accept=".pdf" multiple class="hidden" @change="handleFileSelect" />

					<svg class="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
					</svg>
					<p class="text-lg text-gray-600 mb-1">Drop multiple PDF statements here</p>
					<p class="text-sm text-gray-500">
						or click to browse. Files named like
						<code class="bg-gray-100 px-1 rounded">202206checking.pdf</code>
						will auto-detect month.
					</p>
				</div>

				<!-- File Queue -->
				<div v-if="batchFiles.length > 0" class="space-y-4">
					<!-- Progress Bar -->
					<div v-if="processing || allDone" class="space-y-2">
						<div class="flex justify-between text-sm text-gray-600">
							<span>
								{{ processing ? 'Processing...' : 'Complete' }}
								{{ completedFiles }} of {{ totalFiles }} files
								<span v-if="failedFiles > 0" class="text-red-600">({{ failedFiles }} failed)</span>
							</span>
							<span>{{ progress }}%</span>
						</div>
						<div class="w-full bg-gray-200 rounded-full h-2">
							<div
								class="h-2 rounded-full transition-all duration-500"
								:class="failedFiles > 0 ? 'bg-amber-500' : 'bg-green-500'"
								:style="{width: progress + '%'}"></div>
						</div>
					</div>

					<!-- Summary Stats -->
					<div v-if="allDone" class="grid grid-cols-3 gap-3">
						<div class="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
							<p class="text-2xl font-bold text-green-700">{{ completedFiles }}</p>
							<p class="text-xs text-green-600">Extracted</p>
						</div>
						<div class="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
							<p class="text-2xl font-bold text-blue-700">{{ totalTransactions }}</p>
							<p class="text-xs text-blue-600">Transactions</p>
						</div>
						<div v-if="failedFiles > 0" class="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
							<p class="text-2xl font-bold text-red-700">{{ failedFiles }}</p>
							<p class="text-xs text-red-600">Failed</p>
						</div>
						<div v-else class="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
							<p class="text-2xl font-bold text-gray-700">{{ totalFiles }}</p>
							<p class="text-xs text-gray-600">Total Files</p>
						</div>
					</div>

					<!-- File List -->
					<div class="divide-y border rounded-lg">
						<div
							v-for="bf in batchFiles"
							:key="bf.id"
							class="p-4 flex items-center gap-4 transition-colors"
							:class="{
								'bg-blue-50': bf.status === 'processing',
								'bg-green-50': bf.status === 'done',
								'bg-red-50': bf.status === 'error',
								'bg-indigo-50': bf.status === 'imported',
							}">
							<!-- Status Icon -->
							<div class="flex-shrink-0">
								<svg
									v-if="bf.status === 'pending'"
									class="w-6 h-6 text-gray-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
								<svg
									v-else-if="bf.status === 'processing'"
									class="w-6 h-6 text-blue-500 animate-spin"
									fill="none"
									viewBox="0 0 24 24">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
								</svg>
								<svg
									v-else-if="bf.status === 'done'"
									class="w-6 h-6 text-green-500"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
								<svg
									v-else-if="bf.status === 'imported'"
									class="w-6 h-6 text-indigo-500"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
								</svg>
								<svg v-else class="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
							</div>

							<!-- File Info -->
							<div class="flex-1 min-w-0">
								<p class="text-sm font-medium text-gray-900 truncate">{{ bf.file.name }}</p>
								<div class="flex items-center gap-2 mt-1">
									<span v-if="bf.monthName" class="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
										{{ bf.monthName }}{{ bf.detectedYear ? ' ' + bf.detectedYear : '' }}
									</span>
									<span v-if="bf.accountType" class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
										{{ bf.accountType }}
									</span>
									<span class="text-xs text-gray-500">{{ (bf.file.size / 1024).toFixed(0) }} KB</span>
								</div>
								<p v-if="bf.error" class="text-xs text-red-600 mt-1">{{ bf.error }}</p>
								<div v-if="bf.result" class="flex items-center gap-3 mt-1 text-xs text-gray-500">
									<span>{{ bf.result.transactions?.length || 0 }} transactions</span>
									<span v-if="bf.result.beginning_balance != null">
										Begin: ${{ bf.result.beginning_balance?.toLocaleString(undefined, {minimumFractionDigits: 2}) }}
									</span>
									<span v-if="bf.result.ending_balance != null">
										End: ${{ bf.result.ending_balance?.toLocaleString(undefined, {minimumFractionDigits: 2}) }}
									</span>
								</div>
								<p v-if="bf.status === 'imported'" class="text-xs text-indigo-600 mt-1">
									✓ {{ bf.importResult?.created || 0 }} imported, {{ bf.importResult?.skipped || 0 }} skipped
								</p>
							</div>

							<!-- Actions -->
							<div class="flex-shrink-0 flex items-center gap-2">
								<!-- Load into single-file import for review -->
								<button
									v-if="bf.status === 'done'"
									@click="$emit('load-result', bf)"
									class="text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 transition-colors"
									title="Load into import preview for review">
									Review & Import
								</button>
								<!-- Download CSV -->
								<button
									v-if="bf.status === 'done' && bf.result?.csv_text"
									@click="downloadCsv(bf)"
									class="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded hover:bg-gray-200 transition-colors"
									title="Download extracted CSV">
									CSV
								</button>
								<!-- Retry -->
								<button
									v-if="bf.status === 'error'"
									@click="retryFile(bf.id)"
									class="text-xs bg-amber-100 text-amber-700 px-3 py-1.5 rounded hover:bg-amber-200 transition-colors">
									Retry
								</button>
								<!-- Remove -->
								<button
									v-if="bf.status === 'pending' || bf.status === 'error'"
									@click="removeFile(bf.id)"
									class="text-xs text-gray-400 hover:text-red-600 transition-colors p-1"
									title="Remove">
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
									</svg>
								</button>
							</div>
						</div>
					</div>

					<!-- Action Buttons -->
					<div class="flex items-center gap-3">
						<button
							v-if="pendingFiles > 0"
							@click="processAll"
							:disabled="processing || !selectedAccountId"
							class="bg-green-600 text-white px-6 py-2.5 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 inline-flex items-center gap-2">
							<svg v-if="processing" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
							</svg>
							{{
								processing
									? `Processing ${currentIndex + 1} of ${totalFiles}...`
									: `Extract All (${pendingFiles} files)`
							}}
						</button>

						<button
							v-if="batchFiles.length > 0 && !processing"
							@click="$refs.batchFileInput.click()"
							class="bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-200 transition-colors text-sm">
							+ Add More PDFs
						</button>

						<button
							v-if="batchFiles.length > 0 && !processing"
							@click="clearAll"
							class="text-gray-500 hover:text-red-600 px-4 py-2.5 text-sm transition-colors">
							Clear All
						</button>

						<p v-if="!selectedAccountId && pendingFiles > 0" class="text-sm text-amber-600 ml-auto">
							← Select an account to start processing
						</p>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
import {ref} from 'vue';
import {useBatchPdfImport} from '~/composables/useBatchImport';

const props = defineProps({
	accounts: {type: Array, default: () => []},
	availableFiscalYears: {type: Array, default: () => []},
});

const emit = defineEmits(['load-result']);

const selectedAccountId = defineModel('accountId', {type: [String, Number], default: ''});
const selectedFiscalYear = defineModel('fiscalYear', {type: Number, default: new Date().getFullYear()});

const dragging = ref(false);

const {
	batchFiles,
	processing,
	currentIndex,
	totalFiles,
	completedFiles,
	failedFiles,
	pendingFiles,
	progress,
	totalTransactions,
	allDone,
	addFiles,
	removeFile,
	clearAll,
	processAll,
	retryFile,
} = useBatchPdfImport();

function handleDrop(event) {
	dragging.value = false;
	if (event.dataTransfer?.files?.length > 0) {
		addFiles(event.dataTransfer.files);
	}
}

function handleFileSelect(event) {
	if (event.target?.files?.length > 0) {
		addFiles(event.target.files);
		event.target.value = ''; // Reset so same file(s) can be re-selected
	}
}

function downloadCsv(bf) {
	if (!bf.result?.csv_text) return;
	const blob = new Blob([bf.result.csv_text], {type: 'text/csv'});
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	const period = bf.result.statement_period || bf.file.name.replace('.pdf', '');
	link.download = `${period.toLowerCase().replace(/\s+/g, '-')}-transactions.csv`;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}
</script>
