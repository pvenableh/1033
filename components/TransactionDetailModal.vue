<script setup lang="ts">
import type { Transaction, TransactionFile } from '~/types/directus';

const props = defineProps<{
	modelValue: boolean;
	transaction: Transaction | null;
	canEdit: boolean;
}>();

const emit = defineEmits<{
	'update:modelValue': [value: boolean];
	'saved': [];
}>();

const {
	loading: filesLoading,
	saving,
	fetchTransactionFiles,
	uploadTransactionFile,
	removeTransactionFile,
	updateTransactionReview,
	getFileUrl,
	getThumbnailUrl,
	getDownloadUrl,
	getFileTypeLabel,
	getFileTypeColor,
	getReviewStatusColor,
	getReviewStatusLabel,
	fileTypeOptions,
	paymentMethodOptions,
} = useTransactionFiles();

const { formatFileSize } = useDirectusFiles();

const {
	canCreateNotes,
	canDeleteNotes,
	transactionNotes,
	fetchTransactionNotes,
	createNote,
	resolveNote,
	deleteNote,
	noteTypeOptions,
} = useReconciliationNotes();

const { user } = useDirectusAuth();

const { budgetCategories, budgetItems, fetchBudgetData } = useBudgetManagement();

// Local state
const transactionFiles = ref<TransactionFile[]>([]);
const description = ref('');
const paymentMethod = ref<string>('');
const checkNumber = ref('');
const invoiceNumber = ref('');
const reviewNotes = ref('');
const boardNotes = ref('');
const vendorName = ref('');
const reviewStatus = ref<string>('pending');
const selectedCategoryId = ref<number | null>(null);

// File upload state
const fileInput = ref<HTMLInputElement | null>(null);
const uploadFileType = ref('receipt');
const uploadDescription = ref('');
const isUploading = ref(false);

// Notes state
const newNoteContent = ref('');
const newNoteType = ref('general');
const savingNote = ref(false);

// Computed
const isOpen = computed({
	get: () => props.modelValue,
	set: (val) => emit('update:modelValue', val),
});

const amountDisplay = computed(() => {
	if (!props.transaction) return '$0.00';
	const t = props.transaction;
	const prefix = t.transaction_type === 'deposit' || t.transaction_type === 'transfer_in' ? '+' : '-';
	return `${prefix}$${Number(t.amount).toFixed(2)}`;
});

const amountClass = computed(() => {
	if (!props.transaction) return '';
	const t = props.transaction;
	if (t.transaction_type === 'deposit' || t.transaction_type === 'transfer_in') {
		return 'text-green-600 dark:text-green-400';
	}
	return 'text-red-600 dark:text-red-400';
});

// Category options for dropdown
const categoryOptions = computed(() => {
	return (budgetCategories.value || []).map((cat: any) => ({
		label: cat.category_name,
		value: cat.id,
	}));
});

// Load data when transaction changes
watch(() => props.transaction, async (txn) => {
	if (txn) {
		// Populate local form from transaction
		description.value = txn.description || '';
		paymentMethod.value = txn.payment_method || '';
		checkNumber.value = txn.check_number || '';
		invoiceNumber.value = txn.invoice_number || '';
		reviewNotes.value = txn.review_notes || '';
		boardNotes.value = txn.board_notes || '';
		vendorName.value = txn.vendor || '';
		reviewStatus.value = txn.review_status || 'pending';
		selectedCategoryId.value = typeof txn.category_id === 'object' ? txn.category_id?.id : txn.category_id;

		// Fetch files, notes, and budget categories
		transactionFiles.value = await fetchTransactionFiles(txn.id);
		await fetchTransactionNotes(txn.id);
		if (budgetCategories.value.length === 0) {
			await fetchBudgetData();
		}
	}
}, { immediate: true });

// Methods
const handleUpload = async (event: Event) => {
	const input = event.target as HTMLInputElement;
	const file = input.files?.[0];
	if (!file || !props.transaction) return;

	isUploading.value = true;
	try {
		const result = await uploadTransactionFile(
			props.transaction.id,
			file,
			uploadFileType.value as TransactionFile['file_type'],
			uploadDescription.value || undefined,
		);
		if (result) {
			transactionFiles.value = await fetchTransactionFiles(props.transaction.id);
			uploadDescription.value = '';
		}
	} finally {
		isUploading.value = false;
		if (input) input.value = '';
	}
};

const handleRemoveFile = async (fileId: number) => {
	const success = await removeTransactionFile(fileId);
	if (success && props.transaction) {
		transactionFiles.value = await fetchTransactionFiles(props.transaction.id);
	}
};

const setReviewStatus = async (status: string) => {
	if (!props.transaction) return;
	await updateTransactionReview(props.transaction.id, {
		review_status: status as Transaction['review_status'],
	});
	reviewStatus.value = status;
	emit('saved');
};

const saveDetails = async () => {
	if (!props.transaction) return;
	await updateTransactionReview(props.transaction.id, {
		description: description.value || undefined,
		payment_method: (paymentMethod.value || null) as Transaction['payment_method'],
		check_number: checkNumber.value || undefined,
		invoice_number: invoiceNumber.value || undefined,
		review_notes: reviewNotes.value || undefined,
		board_notes: boardNotes.value || undefined,
		vendor: vendorName.value || undefined,
		category_id: selectedCategoryId.value || undefined,
	});
	emit('saved');
};

const addNote = async () => {
	if (!props.transaction || !newNoteContent.value.trim()) return;
	savingNote.value = true;
	try {
		await createNote(props.transaction.id, {
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

const resolveNoteHandler = async (noteId: number) => {
	await resolveNote(noteId);
	if (props.transaction) {
		await fetchTransactionNotes(props.transaction.id);
	}
};

const deleteNoteHandler = async (noteId: number) => {
	await deleteNote(noteId);
	if (props.transaction) {
		await fetchTransactionNotes(props.transaction.id);
	}
};

const getFileIcon = (type: string | undefined): string => {
	if (!type) return 'i-lucide-file';
	if (type.startsWith('image/')) return 'i-lucide-image';
	if (type.includes('pdf')) return 'i-lucide-file-text';
	if (type.includes('word') || type.includes('document')) return 'i-lucide-file-text';
	if (type.includes('excel') || type.includes('spreadsheet')) return 'i-lucide-file-spreadsheet';
	return 'i-lucide-file';
};

const formatDate = (dateStr: string | null | undefined): string => {
	if (!dateStr) return '';
	return new Date(dateStr).toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	});
};

const getNoteTypeColor = (type: string) => {
	switch (type) {
		case 'reconciliation': return 'green';
		case 'discrepancy': return 'red';
		case 'approval': return 'yellow';
		case 'inquiry': return 'blue';
		default: return 'gray';
	}
};
</script>

<template>
	<UModal v-model="isOpen" :ui="{ width: 'sm:max-w-3xl' }" :close-button="false">
		<UCard v-if="transaction" class="max-h-[90vh] flex flex-col" :ui="{ header: { padding: 'px-6 py-4' } }">
			<!-- Header -->
			<template #header>
				<div class="flex items-start justify-between">
					<div>
						<div class="flex items-center gap-3">
							<h3 class="text-lg font-semibold dark:text-white">Transaction Detail</h3>
							<UBadge :color="getReviewStatusColor(reviewStatus)" variant="soft" size="sm">
								{{ getReviewStatusLabel(reviewStatus) }}
							</UBadge>
						</div>
						<p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
							{{ formatDate(transaction.transaction_date) }} &middot; {{ transaction.description }}
						</p>
					</div>
					<div class="flex items-center gap-2">
						<span class="text-xl font-bold" :class="amountClass">{{ amountDisplay }}</span>
						<UButton color="gray" variant="ghost" icon="i-heroicons-x-mark" size="sm" @click="isOpen = false" />
					</div>
				</div>
			</template>

			<!-- Body -->
			<div class="space-y-6 overflow-y-auto flex-1 pr-1">
				<!-- Section 1: Details -->
				<div>
					<h4 class="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">Details</h4>
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div class="sm:col-span-2">
							<label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Description</label>
							<UInput
								v-if="canEdit"
								v-model="description"
								placeholder="Transaction description"
								size="sm"
							/>
							<p v-else class="text-sm font-medium dark:text-white">{{ transaction.description || 'N/A' }}</p>
						</div>
						<div>
							<label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Vendor</label>
							<UInput
								v-if="canEdit"
								v-model="vendorName"
								placeholder="Enter vendor name"
								size="sm"
							/>
							<p v-else class="text-sm font-medium dark:text-white">{{ transaction.vendor || 'N/A' }}</p>
						</div>
						<div>
							<label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Budget Category</label>
							<select
								v-if="canEdit"
								v-model="selectedCategoryId"
								class="w-full h-9 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 text-sm dark:text-white"
							>
								<option :value="null">Unassigned</option>
								<option v-for="opt in categoryOptions" :key="opt.value" :value="opt.value">
									{{ opt.label }}
								</option>
							</select>
							<p v-else class="text-sm font-medium dark:text-white">
								{{ categoryOptions.find(c => c.value === selectedCategoryId)?.label || 'Unassigned' }}
							</p>
						</div>
						<div>
							<label class="text-xs text-gray-500 dark:text-gray-400">Transaction Type</label>
							<p class="text-sm font-medium dark:text-white capitalize">{{ transaction.transaction_type?.replace('_', ' ') || 'N/A' }}</p>
						</div>
						<div>
							<label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Payment Method</label>
							<select
								v-model="paymentMethod"
								:disabled="!canEdit"
								class="w-full h-9 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 text-sm dark:text-white"
							>
								<option value="">Select...</option>
								<option v-for="opt in paymentMethodOptions" :key="opt.value" :value="opt.value">
									{{ opt.label }}
								</option>
							</select>
						</div>
						<div v-if="paymentMethod === 'check'">
							<label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Check Number</label>
							<UInput v-model="checkNumber" :disabled="!canEdit" placeholder="Enter check #" size="sm" />
						</div>
						<div>
							<label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Invoice Number</label>
							<UInput v-model="invoiceNumber" :disabled="!canEdit" placeholder="Enter invoice #" size="sm" />
						</div>
					</div>
				</div>

				<!-- Section 2: Review Status -->
				<div>
					<h4 class="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">Review Status</h4>
					<div v-if="canEdit" class="flex flex-wrap gap-2 mb-3">
						<UButton
							size="sm"
							:color="reviewStatus === 'reviewed' ? 'blue' : 'gray'"
							:variant="reviewStatus === 'reviewed' ? 'solid' : 'soft'"
							icon="i-heroicons-eye"
							@click="setReviewStatus('reviewed')"
						>
							Mark Reviewed
						</UButton>
						<UButton
							size="sm"
							:color="reviewStatus === 'approved' ? 'green' : 'gray'"
							:variant="reviewStatus === 'approved' ? 'solid' : 'soft'"
							icon="i-heroicons-check-badge"
							@click="setReviewStatus('approved')"
						>
							Approve
						</UButton>
						<UButton
							size="sm"
							:color="reviewStatus === 'flagged' ? 'red' : 'gray'"
							:variant="reviewStatus === 'flagged' ? 'solid' : 'soft'"
							icon="i-heroicons-flag"
							@click="setReviewStatus('flagged')"
						>
							Flag for Review
						</UButton>
					</div>
					<div v-if="transaction.reviewed_by" class="text-xs text-gray-500 dark:text-gray-400 mb-3">
						Reviewed {{ formatDate(transaction.reviewed_date) }}
					</div>
					<div>
						<label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Review Notes</label>
						<UTextarea
							v-model="reviewNotes"
							:disabled="!canEdit"
							placeholder="Add review notes..."
							:rows="2"
							size="sm"
						/>
					</div>
					<div class="mt-3">
						<label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Board Notes</label>
						<UTextarea
							v-model="boardNotes"
							:disabled="!canEdit"
							placeholder="Notes for the board (e.g., why this transaction was recategorized, context for unusual charges)..."
							:rows="3"
							size="sm"
						/>
					</div>
				</div>

				<!-- Section 3: Attached Files -->
				<div>
					<h4 class="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
						Attached Files ({{ transactionFiles.length }})
					</h4>

					<!-- Existing files list -->
					<div v-if="transactionFiles.length > 0" class="space-y-2 mb-4">
						<div
							v-for="tf in transactionFiles"
							:key="tf.id"
							class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border dark:border-gray-700"
						>
							<div class="flex items-center gap-3 min-w-0">
								<div class="w-10 h-10 rounded flex items-center justify-center bg-gray-100 dark:bg-gray-700 shrink-0">
									<template v-if="typeof tf.directus_files_id === 'object' && tf.directus_files_id?.type?.startsWith('image/')">
										<img
											:src="getThumbnailUrl(tf.directus_files_id.id, 80)"
											class="w-10 h-10 rounded object-cover"
											:alt="tf.directus_files_id.filename_download || 'file'"
										/>
									</template>
									<UIcon
										v-else
										:name="getFileIcon(typeof tf.directus_files_id === 'object' ? tf.directus_files_id?.type : undefined)"
										class="w-5 h-5 text-gray-400"
									/>
								</div>
								<div class="min-w-0">
									<div class="text-sm font-medium dark:text-white truncate">
										{{ typeof tf.directus_files_id === 'object' ? (tf.directus_files_id?.filename_download || 'File') : 'File' }}
									</div>
									<div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
										<UBadge :color="getFileTypeColor(tf.file_type)" variant="soft" size="xs">
											{{ getFileTypeLabel(tf.file_type) }}
										</UBadge>
										<span v-if="typeof tf.directus_files_id === 'object' && tf.directus_files_id?.filesize">
											{{ formatFileSize(tf.directus_files_id.filesize) }}
										</span>
										<span v-if="tf.description">{{ tf.description }}</span>
									</div>
								</div>
							</div>
							<div class="flex items-center gap-1 shrink-0 ml-2">
								<a
									v-if="typeof tf.directus_files_id === 'object' && tf.directus_files_id?.id"
									:href="getDownloadUrl(tf.directus_files_id.id)"
									target="_blank"
									rel="noopener noreferrer"
								>
									<UButton color="gray" variant="ghost" size="xs" icon="i-heroicons-arrow-down-tray" />
								</a>
								<UButton
									v-if="canEdit"
									color="red"
									variant="ghost"
									size="xs"
									icon="i-heroicons-trash"
									@click="handleRemoveFile(tf.id)"
								/>
							</div>
						</div>
					</div>
					<p v-else class="text-sm text-gray-500 dark:text-gray-400 text-center py-3 mb-4">
						No files attached
					</p>

					<!-- Upload area -->
					<div v-if="canEdit" class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
						<div class="flex flex-wrap items-end gap-3">
							<div class="flex-1 min-w-[120px]">
								<label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">File Type</label>
								<select
									v-model="uploadFileType"
									class="w-full h-9 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 text-sm dark:text-white"
								>
									<option v-for="opt in fileTypeOptions" :key="opt.value" :value="opt.value">
										{{ opt.label }}
									</option>
								</select>
							</div>
							<div class="flex-1 min-w-[120px]">
								<label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Description (optional)</label>
								<UInput v-model="uploadDescription" placeholder="Brief description" size="sm" />
							</div>
							<UButton
								size="sm"
								:loading="isUploading"
								icon="i-heroicons-arrow-up-tray"
								@click="fileInput?.click()"
							>
								Upload
							</UButton>
							<input
								ref="fileInput"
								type="file"
								class="hidden"
								@change="handleUpload"
							/>
						</div>
					</div>
				</div>

				<!-- Section 4: Reconciliation Notes -->
				<div>
					<h4 class="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
						Reconciliation Notes ({{ transactionNotes?.length || 0 }})
					</h4>

					<!-- Add note form (moved to top for visibility) -->
					<div v-if="canCreateNotes" class="mb-5 p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700">
						<UTextarea
							v-model="newNoteContent"
							placeholder="Add a note..."
							:rows="2"
							class="mb-3"
							size="sm"
						/>
						<div class="flex items-center gap-2">
							<select
								v-model="newNoteType"
								class="h-8 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 text-xs dark:text-white"
							>
								<option value="general">General</option>
								<option value="reconciliation">Reconciliation</option>
								<option value="discrepancy">Discrepancy</option>
								<option value="approval">Approval</option>
								<option value="inquiry">Inquiry</option>
							</select>
							<UButton
								size="xs"
								:loading="savingNote"
								:disabled="!newNoteContent.trim()"
								@click="addNote"
							>
								Add Note
							</UButton>
						</div>
					</div>

					<div v-if="transactionNotes && transactionNotes.length > 0" class="space-y-3">
						<TransitionGroup name="note-list">
							<div
								v-for="note in transactionNotes"
								:key="note.id"
								class="p-4 rounded-xl border transition-all duration-300"
								:class="note.is_resolved
									? 'bg-gray-50 dark:bg-gray-800/30 border-gray-100 dark:border-gray-800 opacity-60'
									: 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm'"
							>
								<p class="text-sm text-gray-900 dark:text-gray-100 leading-relaxed mb-3">{{ note.note }}</p>
								<div class="flex items-center justify-between">
									<div class="flex items-center gap-2 flex-wrap">
										<UBadge :color="getNoteTypeColor(note.note_type)" variant="soft" size="xs">
											{{ note.note_type }}
										</UBadge>
										<span class="text-[11px] text-gray-400 dark:text-gray-500">
											{{ formatDate(note.date_created) }}
										</span>
										<span v-if="note.user_created?.first_name" class="text-[11px] text-gray-400 dark:text-gray-500">
											by {{ note.user_created.first_name }}
										</span>
										<UBadge v-if="note.is_resolved" color="green" variant="soft" size="xs">Resolved</UBadge>
									</div>
									<div class="flex items-center gap-1">
										<UButton
											v-if="canEdit && !note.is_resolved"
											size="xs"
											color="green"
											variant="ghost"
											icon="i-heroicons-check"
											@click="resolveNoteHandler(note.id)"
										/>
										<UButton
											v-if="canDeleteNotes && note.user_created?.id === user?.id"
											size="xs"
											color="red"
											variant="ghost"
											icon="i-heroicons-trash"
											@click="deleteNoteHandler(note.id)"
										/>
									</div>
								</div>
							</div>
						</TransitionGroup>
					</div>
					<div v-else class="text-center py-6">
						<UIcon name="i-heroicons-chat-bubble-bottom-center-text" class="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
						<p class="text-sm text-gray-400 dark:text-gray-500">No notes yet</p>
					</div>
				</div>
			</div>

			<!-- Footer -->
			<template #footer>
				<div class="flex items-center justify-between">
					<UButton variant="ghost" @click="isOpen = false">Close</UButton>
					<UButton v-if="canEdit" :loading="saving" @click="saveDetails">
						Save Changes
					</UButton>
				</div>
			</template>
		</UCard>
	</UModal>
</template>

<style scoped>
.note-list-enter-active {
	transition: all 0.3s ease-out;
}
.note-list-leave-active {
	transition: all 0.2s ease-in;
}
.note-list-enter-from {
	opacity: 0;
	transform: translateY(-8px);
}
.note-list-leave-to {
	opacity: 0;
	transform: translateX(16px);
}
.note-list-move {
	transition: transform 0.3s ease;
}
</style>
