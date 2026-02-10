/**
 * composables/useBatchPdfImport.js
 *
 * Batch PDF Import composable for processing multiple PDF bank statements
 * at once through the existing pdf-to-csv Claude API endpoint.
 *
 * Features:
 * - Multi-file upload (drag & drop or file picker)
 * - Sequential processing with progress tracking
 * - Auto-detection of month from filename (e.g., 202206checking.pdf → June)
 * - Per-file results with review capability
 * - Batch import all or individual month import
 * - PDF saved to Directus statements folder per month
 *
 * Usage in import-center.vue:
 *   const { batchFiles, addFiles, processAll, ... } = useBatchPdfImport()
 */

import {ref, computed} from 'vue';

export const useBatchPdfImport = () => {
	// ---- State ----
	const batchFiles = ref([]); // Array of { file, status, result, month, error }
	const processing = ref(false);
	const currentIndex = ref(-1);

	// ---- Computed ----
	const totalFiles = computed(() => batchFiles.value.length);
	const completedFiles = computed(() => batchFiles.value.filter((f) => f.status === 'done').length);
	const failedFiles = computed(() => batchFiles.value.filter((f) => f.status === 'error').length);
	const pendingFiles = computed(() => batchFiles.value.filter((f) => f.status === 'pending').length);
	const progress = computed(() => {
		if (totalFiles.value === 0) return 0;
		return Math.round(((completedFiles.value + failedFiles.value) / totalFiles.value) * 100);
	});

	const totalTransactions = computed(() =>
		batchFiles.value.reduce((sum, f) => sum + (f.result?.transactions?.length || 0), 0)
	);

	const allDone = computed(
		() => batchFiles.value.length > 0 && batchFiles.value.every((f) => f.status === 'done' || f.status === 'error')
	);

	// ---- Month detection from filename ----
	const MONTH_NAMES = [
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December',
	];

	function detectMonthFromFilename(filename) {
		// Pattern: 202206checking.pdf → month 06
		const match = filename.match(/(\d{4})(\d{2})/);
		if (match) {
			const monthNum = parseInt(match[2], 10);
			if (monthNum >= 1 && monthNum <= 12) {
				return {
					month: String(monthNum).padStart(2, '0'),
					monthName: MONTH_NAMES[monthNum - 1],
					year: parseInt(match[1], 10),
				};
			}
		}

		// Try month names in filename
		const lowerName = filename.toLowerCase();
		for (let i = 0; i < MONTH_NAMES.length; i++) {
			if (lowerName.includes(MONTH_NAMES[i].toLowerCase())) {
				return {
					month: String(i + 1).padStart(2, '0'),
					monthName: MONTH_NAMES[i],
					year: null,
				};
			}
		}

		return {month: '', monthName: '', year: null};
	}

	function detectAccountFromFilename(filename) {
		const lower = filename.toLowerCase();
		if (lower.includes('checking') || lower.includes('5129')) return 'checking';
		if (lower.includes('savings') || lower.includes('reserve') || lower.includes('7011')) return 'savings';
		if (lower.includes('special') || lower.includes('5872')) return 'special';
		return '';
	}

	// ---- Methods ----

	function addFiles(fileList) {
		const newFiles = Array.from(fileList)
			.filter((f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'))
			.map((file) => {
				const detected = detectMonthFromFilename(file.name);
				const accountType = detectAccountFromFilename(file.name);
				return {
					file,
					id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
					status: 'pending', // pending | processing | done | error | imported
					result: null,
					error: null,
					month: detected.month,
					monthName: detected.monthName,
					detectedYear: detected.year,
					accountType,
					importResult: null,
				};
			});

		// Sort by month for nice ordering
		batchFiles.value.push(...newFiles);
		batchFiles.value.sort((a, b) => {
			if (a.month && b.month) return a.month.localeCompare(b.month);
			return a.file.name.localeCompare(b.file.name);
		});
	}

	function removeFile(id) {
		batchFiles.value = batchFiles.value.filter((f) => f.id !== id);
	}

	function clearAll() {
		batchFiles.value = [];
		currentIndex.value = -1;
		processing.value = false;
	}

	async function processOne(batchFile) {
		batchFile.status = 'processing';
		batchFile.error = null;

		const MAX_RETRIES = 3;
		for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
			try {
				const formData = new FormData();
				formData.append('file', batchFile.file);

				const result = await $fetch('/api/admin/pdf-to-csv', {
					method: 'POST',
					body: formData,
					timeout: 150000, // 150s client timeout (server max is 120s)
				});

				if (result.success) {
					batchFile.result = result;
					batchFile.status = 'done';

					// Auto-detect month from result if not detected from filename
					if (!batchFile.month && result.statement_period) {
						const periodLower = result.statement_period.toLowerCase();
						for (let i = 0; i < MONTH_NAMES.length; i++) {
							if (periodLower.includes(MONTH_NAMES[i].toLowerCase())) {
								batchFile.month = String(i + 1).padStart(2, '0');
								batchFile.monthName = MONTH_NAMES[i];
								break;
							}
						}
					}

					// Auto-detect year from result
					if (!batchFile.detectedYear && result.transactions?.length > 0) {
						const dates = result.transactions.map((t) => t.date).filter(Boolean);
						for (const d of dates) {
							const yearMatch = d.match(/(\d{4})/);
							if (yearMatch) {
								batchFile.detectedYear = parseInt(yearMatch[1], 10);
								break;
							}
						}
					}
					return; // success — exit retry loop
				} else {
					batchFile.error = result.error || 'Claude could not extract transactions.';
					batchFile.status = 'error';
					return; // non-retryable application-level error
				}
			} catch (err) {
				const statusCode = err?.statusCode || err?.data?.statusCode || err?.status;
				const isTimeout = statusCode === 504 || statusCode === 408 || err?.name === 'AbortError';
				const isRateLimited = statusCode === 429;
				const isRetryable = isTimeout || isRateLimited;

				if (isRetryable && attempt < MAX_RETRIES) {
					// For 429, respect Retry-After header if present, otherwise use longer backoff
					let delay;
					if (isRateLimited) {
						const retryAfter = err?.data?.headers?.['retry-after'] || err?.response?.headers?.get?.('retry-after');
						delay = retryAfter ? parseInt(retryAfter, 10) * 1000 : 30000 * (attempt + 1); // 30s, 60s, 90s
					} else {
						delay = 5000 * Math.pow(2, attempt); // 5s, 10s, 20s for timeouts
					}
					const reason = isRateLimited ? 'rate limited (429)' : 'timed out';
					console.warn(
						`PDF extraction attempt ${attempt + 1} ${reason} for ${batchFile.file.name}, retrying in ${Math.round(delay / 1000)}s...`
					);
					await new Promise((r) => setTimeout(r, delay));
					continue;
				}

				if (isRateLimited) {
					batchFile.error = `API rate limit exceeded after ${attempt + 1} attempts. Please wait a minute and retry.`;
				} else if (isTimeout) {
					batchFile.error = `Request timed out after ${attempt + 1} attempts. The PDF may be too large or complex.`;
				} else {
					batchFile.error = err.data?.message || err.message || 'API request failed.';
				}
				batchFile.status = 'error';
			}
		}
	}

	async function processAll() {
		processing.value = true;

		for (let i = 0; i < batchFiles.value.length; i++) {
			const bf = batchFiles.value[i];
			if (bf.status !== 'pending') continue;

			currentIndex.value = i;
			await processOne(bf);

			// Delay between requests to avoid rate limiting on the AI API
			if (i < batchFiles.value.length - 1) {
				const prev = batchFiles.value[i];
				// Longer cooldown after a rate-limit error to let the API recover
				const delay = prev.status === 'error' && prev.error?.includes('rate limit') ? 60000 : 5000;
				await new Promise((r) => setTimeout(r, delay));
			}
		}

		currentIndex.value = -1;
		processing.value = false;
	}

	async function retryFile(id) {
		const bf = batchFiles.value.find((f) => f.id === id);
		if (!bf) return;
		bf.status = 'pending';
		bf.error = null;
		bf.result = null;
		await processOne(bf);
	}

	function getDownloadCsv(id) {
		const bf = batchFiles.value.find((f) => f.id === id);
		if (!bf?.result?.csv_text) return null;

		const blob = new Blob([bf.result.csv_text], {type: 'text/csv'});
		return URL.createObjectURL(blob);
	}

	return {
		// State
		batchFiles,
		processing,
		currentIndex,

		// Computed
		totalFiles,
		completedFiles,
		failedFiles,
		pendingFiles,
		progress,
		totalTransactions,
		allDone,

		// Methods
		addFiles,
		removeFile,
		clearAll,
		processOne,
		processAll,
		retryFile,
		getDownloadCsv,

		// Helpers
		MONTH_NAMES,
		detectMonthFromFilename,
		detectAccountFromFilename,
	};
};
