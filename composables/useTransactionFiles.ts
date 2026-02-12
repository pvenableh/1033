// composables/useTransactionFiles.ts
// Transaction file attachment management and review workflow

import type { TransactionFile, Transaction } from '~/types/directus';

const TRANSACTION_UPLOADS_FOLDER = 'fd1b8d5c-d7bc-402a-b8ed-d8c4d37e711a';

export const useTransactionFiles = () => {
	const transactionFilesCollection = useDirectusItems<TransactionFile>('transaction_files');
	const transactionsCollection = useDirectusItems<Transaction>('transactions');
	const filesComposable = useDirectusFiles();
	const { user } = useDirectusAuth();

	// Reactive state
	const loading = ref(false);
	const saving = ref(false);
	const error = ref<string | null>(null);

	// ==================== FILE OPERATIONS ====================

	/**
	 * Fetch all files for a transaction
	 */
	const fetchTransactionFiles = async (transactionId: number): Promise<TransactionFile[]> => {
		loading.value = true;
		error.value = null;
		try {
			const result = await transactionFilesCollection.list({
				filter: {
					transaction_id: { _eq: transactionId },
				},
				fields: [
					'id',
					'sort',
					'file_type',
					'description',
					'uploaded_by',
					'date_created',
					'directus_files_id.id',
					'directus_files_id.filename_download',
					'directus_files_id.title',
					'directus_files_id.type',
					'directus_files_id.filesize',
				],
				sort: ['sort', '-date_created'],
				limit: -1,
			});
			return result || [];
		} catch (err: any) {
			error.value = err.message || 'Failed to fetch transaction files';
			console.error('Failed to fetch transaction files:', err);
			return [];
		} finally {
			loading.value = false;
		}
	};

	/**
	 * Upload a file and create a transaction_files junction record
	 */
	const uploadTransactionFile = async (
		transactionId: number,
		file: File,
		fileType: TransactionFile['file_type'],
		description?: string
	): Promise<TransactionFile | null> => {
		saving.value = true;
		error.value = null;
		try {
			// Upload the file to Directus
			const formData = new FormData();
			formData.append('file', file);
			formData.append('folder', TRANSACTION_UPLOADS_FOLDER);

			const uploaded = await filesComposable.uploadFiles(formData);
			const uploadedFile = Array.isArray(uploaded) ? uploaded[0] : uploaded;

			if (!uploadedFile?.id) {
				throw new Error('File upload failed');
			}

			// Create the junction record
			const junctionRecord = await transactionFilesCollection.create({
				transaction_id: transactionId,
				directus_files_id: uploadedFile.id,
				file_type: fileType,
				description: description || null,
			} as any);

			return junctionRecord;
		} catch (err: any) {
			error.value = err.message || 'Failed to upload file';
			console.error('Failed to upload transaction file:', err);
			return null;
		} finally {
			saving.value = false;
		}
	};

	/**
	 * Remove a transaction file junction record
	 */
	const removeTransactionFile = async (fileId: number): Promise<boolean> => {
		saving.value = true;
		error.value = null;
		try {
			await transactionFilesCollection.remove(fileId);
			return true;
		} catch (err: any) {
			error.value = err.message || 'Failed to remove file';
			console.error('Failed to remove transaction file:', err);
			return false;
		} finally {
			saving.value = false;
		}
	};

	// ==================== REVIEW OPERATIONS ====================

	/**
	 * Update the review status and related fields on a transaction
	 */
	const updateTransactionReview = async (
		transactionId: number,
		data: {
			review_status?: Transaction['review_status'];
			review_notes?: string;
			board_notes?: string;
			vendor?: string;
			payment_method?: Transaction['payment_method'];
			check_number?: string;
			invoice_number?: string;
		}
	): Promise<Transaction | null> => {
		saving.value = true;
		error.value = null;
		try {
			const updateData: Record<string, any> = { ...data };

			// Auto-set reviewer and date when changing review_status
			if (data.review_status) {
				updateData.reviewed_by = user.value?.id || null;
				updateData.reviewed_date = new Date().toISOString();
			}

			const result = await transactionsCollection.update(transactionId, updateData);
			return result;
		} catch (err: any) {
			error.value = err.message || 'Failed to update review';
			console.error('Failed to update transaction review:', err);
			return null;
		} finally {
			saving.value = false;
		}
	};

	/**
	 * Bulk update review status for multiple transactions
	 */
	const bulkUpdateReviewStatus = async (
		transactionIds: number[],
		status: Transaction['review_status']
	): Promise<void> => {
		saving.value = true;
		error.value = null;
		try {
			await Promise.all(
				transactionIds.map((id) =>
					transactionsCollection.update(id, {
						review_status: status,
						reviewed_by: user.value?.id || null,
						reviewed_date: new Date().toISOString(),
					})
				)
			);
		} catch (err: any) {
			error.value = err.message || 'Failed to bulk update review status';
			console.error('Failed to bulk update review status:', err);
		} finally {
			saving.value = false;
		}
	};

	// ==================== URL HELPERS ====================

	const getFileUrl = (fileId: string): string => {
		return filesComposable.getUrl(fileId);
	};

	const getThumbnailUrl = (fileId: string, size: number = 200): string => {
		return filesComposable.getThumbnailUrl(fileId, size);
	};

	const getDownloadUrl = (fileId: string): string => {
		return filesComposable.getDownloadUrl(fileId);
	};

	// ==================== UTILITY ====================

	const getFileTypeLabel = (fileType: string | null | undefined): string => {
		const labels: Record<string, string> = {
			invoice: 'Invoice',
			receipt: 'Receipt',
			contract: 'Contract',
			approval: 'Approval',
			quote: 'Quote',
			photo: 'Photo',
			other: 'Other',
		};
		return labels[fileType || ''] || 'Other';
	};

	const getFileTypeColor = (fileType: string | null | undefined): string => {
		const colors: Record<string, string> = {
			invoice: 'blue',
			receipt: 'green',
			contract: 'purple',
			approval: 'yellow',
			quote: 'orange',
			photo: 'cyan',
			other: 'gray',
		};
		return colors[fileType || ''] || 'gray';
	};

	const getReviewStatusColor = (status: string | null | undefined): string => {
		switch (status) {
			case 'reviewed': return 'blue';
			case 'approved': return 'green';
			case 'flagged': return 'red';
			default: return 'gray';
		}
	};

	const getReviewStatusLabel = (status: string | null | undefined): string => {
		switch (status) {
			case 'reviewed': return 'Reviewed';
			case 'approved': return 'Approved';
			case 'flagged': return 'Flagged';
			default: return 'Pending';
		}
	};

	const fileTypeOptions = [
		{ label: 'Invoice', value: 'invoice' },
		{ label: 'Receipt', value: 'receipt' },
		{ label: 'Contract', value: 'contract' },
		{ label: 'Approval', value: 'approval' },
		{ label: 'Quote', value: 'quote' },
		{ label: 'Photo', value: 'photo' },
		{ label: 'Other', value: 'other' },
	];

	const paymentMethodOptions = [
		{ label: 'ACH', value: 'ach' },
		{ label: 'Check', value: 'check' },
		{ label: 'Zelle', value: 'zelle' },
		{ label: 'Wire', value: 'wire' },
		{ label: 'Cash', value: 'cash' },
		{ label: 'Card', value: 'card' },
		{ label: 'Online', value: 'online' },
		{ label: 'Other', value: 'other' },
	];

	return {
		// State
		loading: readonly(loading),
		saving: readonly(saving),
		error: readonly(error),

		// File operations
		fetchTransactionFiles,
		uploadTransactionFile,
		removeTransactionFile,

		// Review operations
		updateTransactionReview,
		bulkUpdateReviewStatus,

		// URL helpers
		getFileUrl,
		getThumbnailUrl,
		getDownloadUrl,

		// Utilities
		getFileTypeLabel,
		getFileTypeColor,
		getReviewStatusColor,
		getReviewStatusLabel,
		fileTypeOptions,
		paymentMethodOptions,

		// Constants
		TRANSACTION_UPLOADS_FOLDER,
	};
};
