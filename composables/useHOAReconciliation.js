// composables/useHOAReconciliation.ts
export const useHOAReconciliation = () => {
	const {readItems} = useDirectusItems();

	// State
	const selectedYear = ref(2025);
	const selectedAccount = ref(1);
	const selectedMonth = ref('08');
	const loading = ref(false);
	const error = ref(null);

	// Data stores
	const accounts = ref([]);
	const transactions = ref([]);
	const monthlyStatements = ref([]);

	// Helper
	const safeParseFloat = (value) => {
		if (value === null || value === undefined || value === '') return 0;
		const parsed = parseFloat(value);
		return isNaN(parsed) ? 0 : parsed;
	};

	// Fetch data
	const fetchData = async () => {
		loading.value = true;
		error.value = null;

		try {
			const [accountsData, transactionsData, statementsData] = await Promise.all([
				readItems('accounts', {
					sort: ['account_number'],
					fields: ['*'],
				}),
				readItems('transactions', {
					filter: {
						fiscal_year: {_eq: unref(selectedYear)},
					},
					sort: ['transaction_date'],
					fields: ['*', 'linked_transfer_id.*'],
					limit: -1,
				}),
				readItems('monthly_statements', {
					filter: {
						fiscal_year: {_eq: unref(selectedYear)},
					},
					sort: ['statement_month'],
					fields: ['*'],
				}),
			]);

			accounts.value = accountsData || [];
			transactions.value = transactionsData || [];
			monthlyStatements.value = statementsData || [];
		} catch (e) {
			console.error('Error fetching data:', e);
			error.value = e.message;
		} finally {
			loading.value = false;
		}
	};

	// Account reconciliation for a specific month
	const monthlyReconciliation = computed(() => {
		try {
			const accountId = unref(selectedAccount);
			const month = unref(selectedMonth);
			const year = unref(selectedYear);

			// Get statement for this month
			const statement = monthlyStatements.value.find(
				(s) => s.account_id === accountId && s.statement_month === month && s.fiscal_year === year
			);

			// Get all transactions for this month
			const monthTransactions = transactions.value.filter(
				(t) => t.account_id === accountId && t.statement_month === month && t.fiscal_year === year
			);

			// Separate transaction types
			const deposits = monthTransactions.filter((t) => t.transaction_type === 'deposit' && !t.linked_transfer_id);

			const withdrawals = monthTransactions.filter((t) => t.transaction_type === 'withdrawal' && !t.linked_transfer_id);

			const transfersIn = monthTransactions.filter((t) => t.transaction_type === 'transfer_in');

			const transfersOut = monthTransactions.filter((t) => t.transaction_type === 'transfer_out');

			const fees = monthTransactions.filter((t) => t.transaction_type === 'fee');

			// Calculate totals
			const totalDeposits = deposits.reduce((sum, t) => sum + safeParseFloat(t.amount), 0);
			const totalWithdrawals = withdrawals.reduce((sum, t) => sum + safeParseFloat(t.amount), 0);
			const totalTransfersIn = transfersIn.reduce((sum, t) => sum + safeParseFloat(t.amount), 0);
			const totalTransfersOut = transfersOut.reduce((sum, t) => sum + safeParseFloat(t.amount), 0);
			const totalFees = fees.reduce((sum, t) => sum + safeParseFloat(t.amount), 0);

			// Reconciliation calculation
			const beginningBalance = statement ? safeParseFloat(statement.beginning_balance) : 0;
			const endingBalance = statement ? safeParseFloat(statement.ending_balance) : 0;

			// Calculated ending = Beginning + Deposits + Transfers In - Withdrawals - Transfers Out - Fees
			const calculatedEnding =
				beginningBalance + totalDeposits + totalTransfersIn - totalWithdrawals - totalTransfersOut - totalFees;

			const difference = endingBalance - calculatedEnding;
			const isReconciled = Math.abs(difference) < 0.01;

			return {
				accountId,
				month,
				year,
				statement,

				// Balances
				beginningBalance,
				endingBalance,
				calculatedEnding,
				difference,
				isReconciled,

				// Transaction categories
				deposits: {
					transactions: deposits,
					total: totalDeposits,
					count: deposits.length,
				},
				withdrawals: {
					transactions: withdrawals,
					total: totalWithdrawals,
					count: withdrawals.length,
				},
				transfersIn: {
					transactions: transfersIn,
					total: totalTransfersIn,
					count: transfersIn.length,
				},
				transfersOut: {
					transactions: transfersOut,
					total: totalTransfersOut,
					count: transfersOut.length,
				},
				fees: {
					transactions: fees,
					total: totalFees,
					count: fees.length,
				},

				// All transactions
				allTransactions: monthTransactions,

				// Net change
				netChange: endingBalance - beginningBalance,
				operatingNetChange: totalDeposits - totalWithdrawals - totalFees,
				transferNetChange: totalTransfersIn - totalTransfersOut,
			};
		} catch (error) {
			console.error('Error in monthlyReconciliation:', error);
			return null;
		}
	});

	// Year-to-date reconciliation
	const ytdReconciliation = computed(() => {
		try {
			const accountId = unref(selectedAccount);
			const year = unref(selectedYear);
			const month = unref(selectedMonth);

			// Get all transactions up to and including selected month
			const ytdTransactions = transactions.value.filter((t) => {
				if (t.account_id !== accountId || t.fiscal_year !== year) return false;
				return t.statement_month <= month;
			});

			// Get first and last statements
			const accountStatements = monthlyStatements.value
				.filter((s) => s.account_id === accountId && s.fiscal_year === year && s.statement_month <= month)
				.sort((a, b) => a.statement_month.localeCompare(b.statement_month));

			const firstStatement = accountStatements[0];
			const lastStatement = accountStatements[accountStatements.length - 1];

			// Separate transaction types
			const deposits = ytdTransactions.filter((t) => t.transaction_type === 'deposit' && !t.linked_transfer_id);

			const withdrawals = ytdTransactions.filter((t) => t.transaction_type === 'withdrawal' && !t.linked_transfer_id);

			const transfersIn = ytdTransactions.filter((t) => t.transaction_type === 'transfer_in');

			const transfersOut = ytdTransactions.filter((t) => t.transaction_type === 'transfer_out');

			const fees = ytdTransactions.filter((t) => t.transaction_type === 'fee');

			// Calculate totals
			const totalDeposits = deposits.reduce((sum, t) => sum + safeParseFloat(t.amount), 0);
			const totalWithdrawals = withdrawals.reduce((sum, t) => sum + safeParseFloat(t.amount), 0);
			const totalTransfersIn = transfersIn.reduce((sum, t) => sum + safeParseFloat(t.amount), 0);
			const totalTransfersOut = transfersOut.reduce((sum, t) => sum + safeParseFloat(t.amount), 0);
			const totalFees = fees.reduce((sum, t) => sum + safeParseFloat(t.amount), 0);

			const beginningBalance = firstStatement ? safeParseFloat(firstStatement.beginning_balance) : 0;
			const endingBalance = lastStatement ? safeParseFloat(lastStatement.ending_balance) : 0;

			return {
				accountId,
				year,
				throughMonth: month,

				// Balances
				beginningBalance,
				endingBalance,
				netChange: endingBalance - beginningBalance,

				// Operating activity (true revenue/expenses)
				operatingRevenue: totalDeposits,
				operatingExpenses: totalWithdrawals + totalFees,
				operatingNetChange: totalDeposits - totalWithdrawals - totalFees,

				// Transfer activity (fund movements)
				transfersIn: {
					total: totalTransfersIn,
					count: transfersIn.length,
					transactions: transfersIn,
				},
				transfersOut: {
					total: totalTransfersOut,
					count: transfersOut.length,
					transactions: transfersOut,
				},
				transferNetChange: totalTransfersIn - totalTransfersOut,

				// All activity
				deposits: {
					transactions: deposits,
					total: totalDeposits,
					count: deposits.length,
				},
				withdrawals: {
					transactions: withdrawals,
					total: totalWithdrawals,
					count: withdrawals.length,
				},
				fees: {
					transactions: fees,
					total: totalFees,
					count: fees.length,
				},

				// Reconciliation check
				calculatedEnding:
					beginningBalance + totalDeposits + totalTransfersIn - totalWithdrawals - totalTransfersOut - totalFees,
				difference:
					endingBalance -
					(beginningBalance + totalDeposits + totalTransfersIn - totalWithdrawals - totalTransfersOut - totalFees),
				isReconciled:
					Math.abs(
						endingBalance -
							(beginningBalance + totalDeposits + totalTransfersIn - totalWithdrawals - totalTransfersOut - totalFees)
					) < 0.01,
			};
		} catch (error) {
			console.error('Error in ytdReconciliation:', error);
			return null;
		}
	});

	// Transfer audit - find issues
	const transferAudit = computed(() => {
		try {
			const year = unref(selectedYear);
			const allTransfers = transactions.value.filter(
				(t) => t.fiscal_year === year && (t.transaction_type === 'transfer_in' || t.transaction_type === 'transfer_out')
			);

			// Find unmatched transfers
			const unmatched = allTransfers.filter((t) => !t.linked_transfer_id);

			// Find broken links (points to non-existent transaction)
			const broken = allTransfers.filter((t) => {
				if (!t.linked_transfer_id) return false;
				const linkedExists = transactions.value.some((other) => other.id === t.linked_transfer_id);
				return !linkedExists;
			});

			// Find amount mismatches
			const mismatches = [];
			allTransfers.forEach((t) => {
				if (!t.linked_transfer_id) return;
				const linked = transactions.value.find((other) => other.id === t.linked_transfer_id);
				if (!linked) return;

				if (Math.abs(safeParseFloat(t.amount) - safeParseFloat(linked.amount)) > 0.01) {
					mismatches.push({transfer: t, linked, difference: safeParseFloat(t.amount) - safeParseFloat(linked.amount)});
				}
			});

			return {
				totalTransfers: allTransfers.length,
				matched: allTransfers.filter((t) => t.linked_transfer_id).length,
				unmatched: {
					count: unmatched.length,
					transactions: unmatched,
				},
				broken: {
					count: broken.length,
					transactions: broken,
				},
				mismatches: {
					count: mismatches.length,
					items: mismatches,
				},
				hasIssues: unmatched.length > 0 || broken.length > 0 || mismatches.length > 0,
			};
		} catch (error) {
			console.error('Error in transferAudit:', error);
			return null;
		}
	});

	// Format currency
	const formatCurrency = (amount) => {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
		}).format(safeParseFloat(amount));
	};

	// Get account name
	const getAccountName = (accountId) => {
		const account = accounts.value.find((a) => a.id === accountId);
		return account ? account.account_name : 'Unknown Account';
	};

	// Month options
	const monthOptions = computed(() => [
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
	]);

	// Watch for changes
	watch([selectedYear, selectedAccount, selectedMonth], () => {
		fetchData();
	});

	return {
		// State
		selectedYear,
		selectedAccount,
		selectedMonth,
		loading,
		error,

		// Data
		accounts: readonly(accounts),
		transactions: readonly(transactions),
		monthlyStatements: readonly(monthlyStatements),

		// Computed
		monthlyReconciliation,
		ytdReconciliation,
		transferAudit,

		// Options
		monthOptions,

		// Methods
		fetchData,
		formatCurrency,
		getAccountName,
	};
};
