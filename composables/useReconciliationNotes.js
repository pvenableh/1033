// composables/useReconciliationNotes.js
// Reconciliation notes management with permission-based access for HOA transactions

export const useReconciliationNotes = () => {
	const reconciliationNotesCollection = useDirectusItems('reconciliation_notes');
	const transactionsCollection = useDirectusItems('transactions');
	const monthlyReconciliationReportsCollection = useDirectusItems('monthly_reconciliation_reports');
	const userPermissionsCollection = useDirectusItems('user_permissions');

	// Get current user (from Directus auth)
	const { user } = useDirectusAuth();

	// Reactive state
	const loading = ref(false);
	const saving = ref(false);
	const error = ref(null);

	// Data stores
	const userPermissions = ref(null);
	const transactionNotes = ref([]);
	const reconciliationReports = ref([]);

	// Permission check helper
	const checkFinancialsPermission = (action) => {
		const permissions = userPermissions.value;
		if (!permissions) return false;

		switch (action) {
			case 'create':
				return permissions.financials_create === true;
			case 'read':
				return permissions.financials_read === true;
			case 'update':
				return permissions.financials_update === true;
			case 'delete':
				return permissions.financials_delete === true;
			default:
				return false;
		}
	};

	// Computed permissions
	const canReadFinancials = computed(() => checkFinancialsPermission('read'));
	const canCreateNotes = computed(() => checkFinancialsPermission('create'));
	const canUpdateNotes = computed(() => checkFinancialsPermission('update'));
	const canDeleteNotes = computed(() => checkFinancialsPermission('delete'));
	const canReconcile = computed(() => checkFinancialsPermission('update'));

	// Fetch user permissions
	const fetchUserPermissions = async () => {
		try {
			if (!user.value?.id) {
				userPermissions.value = null;
				return;
			}

			// Get person_id linked to user, then get permissions
			const permissions = await userPermissionsCollection.list({
				filter: {
					_or: [
						{ person_id: { user: { _eq: user.value.id } } },
						{ user_created: { _eq: user.value.id } },
					],
				},
				fields: ['*'],
				limit: 1,
			});

			userPermissions.value = permissions && permissions.length > 0 ? permissions[0] : null;
		} catch (e) {
			console.error('Error fetching user permissions:', e);
			userPermissions.value = null;
		}
	};

	// Fetch notes for a specific transaction
	const fetchTransactionNotes = async (transactionId) => {
		loading.value = true;
		error.value = null;

		try {
			const data = await reconciliationNotesCollection.list({
				filter: {
					transaction_id: { _eq: transactionId },
				},
				sort: ['-date_created'],
				fields: ['*', 'user_created.*', 'resolved_by.*'],
			});

			transactionNotes.value = data || [];
			return transactionNotes.value;
		} catch (e) {
			error.value = e.message || 'Error fetching transaction notes';
			console.error('Error fetching transaction notes:', e);
			return [];
		} finally {
			loading.value = false;
		}
	};

	// Fetch all notes for a set of transactions
	const fetchNotesForTransactions = async (transactionIds) => {
		if (!transactionIds || transactionIds.length === 0) return [];

		loading.value = true;
		error.value = null;

		try {
			const data = await reconciliationNotesCollection.list({
				filter: {
					transaction_id: { _in: transactionIds },
				},
				sort: ['-date_created'],
				fields: ['*', 'user_created.*', 'resolved_by.*'],
			});

			return data || [];
		} catch (e) {
			error.value = e.message || 'Error fetching notes';
			console.error('Error fetching notes for transactions:', e);
			return [];
		} finally {
			loading.value = false;
		}
	};

	// Create a new note
	const createNote = async (transactionId, noteData) => {
		if (!canCreateNotes.value) {
			throw new Error('You do not have permission to create notes');
		}

		saving.value = true;
		error.value = null;

		try {
			const result = await reconciliationNotesCollection.create({
				transaction_id: transactionId,
				note: noteData.note,
				note_type: noteData.note_type || 'general',
				is_resolved: false,
				status: 'published',
			});

			// Refresh notes for this transaction
			await fetchTransactionNotes(transactionId);

			return result;
		} catch (e) {
			error.value = e.message || 'Error creating note';
			console.error('Error creating note:', e);
			throw e;
		} finally {
			saving.value = false;
		}
	};

	// Update a note
	const updateNote = async (noteId, updates) => {
		if (!canUpdateNotes.value) {
			throw new Error('You do not have permission to update notes');
		}

		saving.value = true;
		error.value = null;

		try {
			const result = await reconciliationNotesCollection.update(noteId, updates);
			return result;
		} catch (e) {
			error.value = e.message || 'Error updating note';
			console.error('Error updating note:', e);
			throw e;
		} finally {
			saving.value = false;
		}
	};

	// Resolve a note
	const resolveNote = async (noteId) => {
		if (!canUpdateNotes.value) {
			throw new Error('You do not have permission to resolve notes');
		}

		saving.value = true;
		error.value = null;

		try {
			const result = await reconciliationNotesCollection.update(noteId, {
				is_resolved: true,
				resolved_date: new Date().toISOString(),
				resolved_by: user.value?.id,
			});

			return result;
		} catch (e) {
			error.value = e.message || 'Error resolving note';
			console.error('Error resolving note:', e);
			throw e;
		} finally {
			saving.value = false;
		}
	};

	// Delete a note
	const deleteNote = async (noteId) => {
		if (!canDeleteNotes.value) {
			throw new Error('You do not have permission to delete notes');
		}

		saving.value = true;
		error.value = null;

		try {
			await reconciliationNotesCollection.remove(noteId);
		} catch (e) {
			error.value = e.message || 'Error deleting note';
			console.error('Error deleting note:', e);
			throw e;
		} finally {
			saving.value = false;
		}
	};

	// Update transaction reconciliation status
	const updateTransactionReconciliation = async (transactionId, status) => {
		if (!canReconcile.value) {
			throw new Error('You do not have permission to reconcile transactions');
		}

		saving.value = true;
		error.value = null;

		try {
			const updates = {
				reconciliation_status: status,
			};

			if (status === 'reconciled') {
				updates.reconciled_date = new Date().toISOString();
				updates.reconciled_by = user.value?.id;
			}

			const result = await transactionsCollection.update(transactionId, updates);
			return result;
		} catch (e) {
			error.value = e.message || 'Error updating transaction reconciliation';
			console.error('Error updating transaction reconciliation:', e);
			throw e;
		} finally {
			saving.value = false;
		}
	};

	// Bulk reconcile transactions
	const bulkReconcileTransactions = async (transactionIds, status = 'reconciled') => {
		if (!canReconcile.value) {
			throw new Error('You do not have permission to reconcile transactions');
		}

		saving.value = true;
		error.value = null;

		try {
			const updates = {
				reconciliation_status: status,
			};

			if (status === 'reconciled') {
				updates.reconciled_date = new Date().toISOString();
				updates.reconciled_by = user.value?.id;
			}

			// Update each transaction
			const promises = transactionIds.map((id) => transactionsCollection.update(id, updates));
			await Promise.all(promises);

			return { success: true, count: transactionIds.length };
		} catch (e) {
			error.value = e.message || 'Error bulk reconciling transactions';
			console.error('Error bulk reconciling transactions:', e);
			throw e;
		} finally {
			saving.value = false;
		}
	};

	// Create monthly reconciliation report
	const createReconciliationReport = async (reportData) => {
		if (!canCreateNotes.value) {
			throw new Error('You do not have permission to create reconciliation reports');
		}

		saving.value = true;
		error.value = null;

		try {
			const result = await monthlyReconciliationReportsCollection.create({
				fiscal_year: reportData.fiscal_year,
				account_id: reportData.account_id,
				report_month: reportData.report_month,
				statement_beginning_balance: reportData.statement_beginning_balance,
				statement_ending_balance: reportData.statement_ending_balance,
				calculated_beginning_balance: reportData.calculated_beginning_balance,
				calculated_ending_balance: reportData.calculated_ending_balance,
				reconciliation_difference: reportData.reconciliation_difference,
				reconciliation_status: reportData.reconciliation_status || 'pending',
				total_deposits: reportData.total_deposits,
				total_withdrawals: reportData.total_withdrawals,
				total_transfer_in: reportData.total_transfer_in,
				total_transfers_out: reportData.total_transfers_out,
				total_fees: reportData.total_fees,
				transactions_reconciled: reportData.transactions_reconciled,
				transactions_pending: reportData.transactions_pending,
				transactions_disputed: reportData.transactions_disputed,
				notes: reportData.notes,
				status: 'published',
			});

			return result;
		} catch (e) {
			error.value = e.message || 'Error creating reconciliation report';
			console.error('Error creating reconciliation report:', e);
			throw e;
		} finally {
			saving.value = false;
		}
	};

	// Fetch reconciliation reports
	const fetchReconciliationReports = async (fiscalYear, accountId = null) => {
		loading.value = true;
		error.value = null;

		try {
			const filter = {
				fiscal_year: { year: { _eq: fiscalYear } },
			};

			if (accountId) {
				filter.account_id = { _eq: accountId };
			}

			const data = await monthlyReconciliationReportsCollection.list({
				filter,
				sort: ['-report_month'],
				fields: ['*', 'account_id.*', 'completed_by.*'],
			});

			reconciliationReports.value = data || [];
			return reconciliationReports.value;
		} catch (e) {
			error.value = e.message || 'Error fetching reconciliation reports';
			console.error('Error fetching reconciliation reports:', e);
			return [];
		} finally {
			loading.value = false;
		}
	};

	// Complete a reconciliation report
	const completeReconciliationReport = async (reportId, notes = null) => {
		if (!canReconcile.value) {
			throw new Error('You do not have permission to complete reconciliation reports');
		}

		saving.value = true;
		error.value = null;

		try {
			const updates = {
				reconciliation_status: 'reconciled',
				completed_date: new Date().toISOString(),
				completed_by: user.value?.id,
			};

			if (notes) {
				updates.notes = notes;
			}

			const result = await monthlyReconciliationReportsCollection.update(reportId, updates);
			return result;
		} catch (e) {
			error.value = e.message || 'Error completing reconciliation report';
			console.error('Error completing reconciliation report:', e);
			throw e;
		} finally {
			saving.value = false;
		}
	};

	// Derive month from statement_month or fallback to transaction_date
	const getTransactionMonth = (transaction) => {
		if (transaction.statement_month) return transaction.statement_month;
		if (transaction.transaction_date) {
			const datePart = String(transaction.transaction_date).slice(0, 10);
			const month = datePart.split('-')[1];
			if (month && month.length === 2) return month;
		}
		return null;
	};

	// Generate monthly reconciliation report from transaction data
	const generateMonthlyReport = async (fiscalYear, accountId, month, transactions, statement) => {
		const monthTransactions = transactions.filter(
			(t) => getTransactionMonth(t) === month && t.account_id === accountId
		);

		// Calculate totals by transaction type
		const totalDeposits = monthTransactions
			.filter((t) => t.transaction_type === 'deposit' && !isTransfer(t))
			.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

		const totalWithdrawals = monthTransactions
			.filter((t) => t.transaction_type === 'withdrawal' && !isTransfer(t))
			.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

		const totalTransfersIn = monthTransactions
			.filter((t) => t.transaction_type === 'transfer_in')
			.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

		const totalTransfersOut = monthTransactions
			.filter((t) => t.transaction_type === 'transfer_out')
			.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

		const totalFees = monthTransactions
			.filter((t) => t.transaction_type === 'fee')
			.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

		// Calculate reconciliation
		const beginningBalance = parseFloat(statement?.beginning_balance || 0);
		const endingBalance = parseFloat(statement?.ending_balance || 0);
		const calculatedEnding =
			beginningBalance + totalDeposits + totalTransfersIn - totalWithdrawals - totalTransfersOut - totalFees;
		const difference = Math.abs(endingBalance - calculatedEnding);

		// Count transaction statuses
		const reconciled = monthTransactions.filter((t) => t.reconciliation_status === 'reconciled').length;
		const pending = monthTransactions.filter(
			(t) => !t.reconciliation_status || t.reconciliation_status === 'pending'
		).length;
		const disputed = monthTransactions.filter((t) => t.reconciliation_status === 'disputed').length;

		return {
			fiscal_year: fiscalYear,
			account_id: accountId,
			report_month: month,
			statement_beginning_balance: beginningBalance,
			statement_ending_balance: endingBalance,
			calculated_beginning_balance: beginningBalance,
			calculated_ending_balance: calculatedEnding,
			reconciliation_difference: difference,
			reconciliation_status: difference < 0.01 ? 'reconciled' : 'discrepency',
			total_deposits: totalDeposits,
			total_withdrawals: totalWithdrawals,
			total_transfer_in: totalTransfersIn,
			total_transfers_out: totalTransfersOut,
			total_fees: totalFees,
			transactions_reconciled: reconciled,
			transactions_pending: pending,
			transactions_disputed: disputed,
		};
	};

	// Helper to check if transaction is a transfer
	const isTransfer = (transaction) => {
		return (
			transaction.transaction_type === 'transfer_in' || transaction.transaction_type === 'transfer_out'
		);
	};

	// Note type options
	const noteTypeOptions = [
		{ label: 'General Note', value: 'general' },
		{ label: 'Reconciliation Note', value: 'reconciliation' },
		{ label: 'Discrepancy', value: 'discrepency' },
		{ label: 'Approval Required', value: 'approval' },
		{ label: 'Inquiry', value: 'inquiry' },
	];

	// Reconciliation status options
	const reconciliationStatusOptions = [
		{ label: 'Pending', value: 'pending' },
		{ label: 'Reconciled', value: 'reconciled' },
		{ label: 'Disputed', value: 'disputed' },
	];

	// Initialize - fetch user permissions
	const initialize = async () => {
		await fetchUserPermissions();
	};

	// Watch for user changes
	watch(user, async () => {
		await fetchUserPermissions();
	});

	return {
		// State
		loading,
		saving,
		error,

		// Data
		userPermissions: readonly(userPermissions),
		transactionNotes: readonly(transactionNotes),
		reconciliationReports: readonly(reconciliationReports),

		// Computed permissions
		canReadFinancials,
		canCreateNotes,
		canUpdateNotes,
		canDeleteNotes,
		canReconcile,

		// Methods - Notes
		fetchTransactionNotes,
		fetchNotesForTransactions,
		createNote,
		updateNote,
		resolveNote,
		deleteNote,

		// Methods - Transaction Reconciliation
		updateTransactionReconciliation,
		bulkReconcileTransactions,

		// Methods - Reconciliation Reports
		createReconciliationReport,
		fetchReconciliationReports,
		completeReconciliationReport,
		generateMonthlyReport,

		// Methods - Permissions
		fetchUserPermissions,
		checkFinancialsPermission,

		// Options
		noteTypeOptions,
		reconciliationStatusOptions,

		// Initialize
		initialize,
	};
};
