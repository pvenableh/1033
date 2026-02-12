// composables/useHOAFinancialsEnhanced.ts - Account-Specific Views with Category/Vendor Filtering
export const useHOAFinancialsEnhanced = () => {
	const accountsCollection = useDirectusItems('accounts');
	const budgetCategoriesCollection = useDirectusItems('budget_categories');
	const transactionsCollection = useDirectusItems('transactions');
	const monthlyStatementsCollection = useDirectusItems('monthly_statements');

	// Reactive state
	const selectedYear = ref(new Date().getFullYear());
	const selectedAccount = ref(1); // Default to Operating Account
	const selectedCategory = ref('all');
	const selectedVendor = ref('all');
	const selectedStartMonth = ref('01'); // 'all' for YTD, or '01' for January, etc.
	const selectedEndMonth = ref('12'); // 'all' for YTD, or '12' for December, etc.
	const searchQuery = ref('');
	const loading = ref(false);
	const error = ref(null);

	// Raw data stores
	const accounts = ref([]);
	const budgetCategories = ref([]);
	const transactions = ref([]);
	const monthlyStatements = ref([]);

	// Helper function to safely parse numbers
	const safeParseFloat = (value) => {
		if (value === null || value === undefined || value === '') return 0;
		const parsed = parseFloat(value);
		return isNaN(parsed) ? 0 : parsed;
	};

	// Check if transaction is a transfer
	const isTransferTransaction = (transaction) => {
		// Check explicit transfer types (for data with explicit types)
		if (transaction.transaction_type === 'transfer_in' || transaction.transaction_type === 'transfer_out') {
			return true;
		}

		// Check description keywords (for description-based detection)
		const desc = (transaction.description || '').toLowerCase();
		const vendor = (transaction.vendor || '').toLowerCase();

		// EXCLUDE Wash Multifamily from transfer detection
		if (desc.includes('wash multifamily') || vendor.includes('wash multifamily')) {
			return false;
		}

		const transferKeywords = [
			'online transfer',
			'transfer to',
			'transfer from',
			'account 5872',
			'account 7011',
			'account 5129',
			'chk 5129', // Keep specific check account references
			'mma account',
			'mma ...',
		];

		return (
			transferKeywords.some((keyword) => desc.includes(keyword) || vendor.includes(keyword)) ||
			transaction.violation_type === 'fund_mixing'
		);
	};

	// Get all transfer transactions for current account
	const accountTransferTransactions = computed(() => {
		try {
			const transactions = allAccountTransactions.value || [];
			return transactions
				.filter((t) => t && isTransferTransaction(t))
				.sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date));
		} catch (error) {
			console.error('Error in accountTransferTransactions:', error);
			return [];
		}
	});

	// Transfer activity metrics with linked/unlinked tracking
	const transferActivity = computed(() => {
		try {
			const transactions = allAccountTransactions.value || [];

			// Get all transfers
			const allTransfers = transactions.filter((t) => t && isTransferTransaction(t));

			const transfersOut = allTransfers
				.filter((t) => t.transaction_type === 'withdrawal')
				.reduce((sum, t) => sum + safeParseFloat(t.amount), 0);

			const transfersIn = allTransfers
				.filter((t) => t.transaction_type === 'deposit')
				.reduce((sum, t) => sum + safeParseFloat(t.amount), 0);

			// Count linked and unlinked transfers
			const linkedTransfers = allTransfers.filter((t) => t.linked_transfer_id !== null);
			const unmatchedTransfers = allTransfers.filter((t) => t.linked_transfer_id === null);

			return {
				transfersOut,
				transfersIn,
				netTransferActivity: transfersIn - transfersOut,
				linkedCount: linkedTransfers.length,
				unmatchedCount: unmatchedTransfers.length,
				totalTransfers: allTransfers.length,
				linkedTransfers,
				unmatchedTransfers,
			};
		} catch (error) {
			console.error('Error in transferActivity:', error);
			return {
				transfersOut: 0,
				transfersIn: 0,
				netTransferActivity: 0,
				linkedCount: 0,
				unmatchedCount: 0,
				totalTransfers: 0,
				linkedTransfers: [],
				unmatchedTransfers: [],
			};
		}
	});

	// Get transfer pairs (grouped by linked_transfer_id)
	const transferPairs = computed(() => {
		try {
			const allTransactionsAcrossAccounts = transactions.value || [];
			const pairs = [];
			const processed = new Set();

			// Only look at transactions that have a linked_transfer_id
			const linkedTransfers = allTransactionsAcrossAccounts.filter(
				(t) => t && isTransferTransaction(t) && t.linked_transfer_id !== null
			);

			linkedTransfers.forEach((transfer) => {
				// Skip if already processed
				if (processed.has(transfer.id)) return;

				// Find the linked transaction
				const linkedTransaction = allTransactionsAcrossAccounts.find((t) => t && t.id === transfer.linked_transfer_id);

				if (linkedTransaction) {
					// Determine which is out and which is in
					const outTransfer = transfer.transaction_type === 'withdrawal' ? transfer : linkedTransaction;
					const inTransfer = transfer.transaction_type === 'deposit' ? transfer : linkedTransaction;

					pairs.push({
						id: `${transfer.id}-${linkedTransaction.id}`,
						outTransfer,
						inTransfer,
						amount: safeParseFloat(outTransfer.amount),
						date: outTransfer.transaction_date,
						fromAccount: getAccountById(outTransfer.account_id),
						toAccount: getAccountById(inTransfer.account_id),
					});

					// Mark both as processed
					processed.add(transfer.id);
					processed.add(linkedTransaction.id);
				}
			});

			return pairs.sort((a, b) => new Date(b.date) - new Date(a.date));
		} catch (error) {
			console.error('Error in transferPairs:', error);
			return [];
		}
	});

	const isClumpedPayment = (transaction) => {
		const desc = (transaction.description || '').toLowerCase();
		const vendor = (transaction.vendor || '').toLowerCase();

		// Patterns that indicate clumped payments
		const clumpedPaymentIndicators = ['google pay', 'google wave', 'zelle', 'venmo'];

		// Check if it's a deposit with these payment methods
		if (transaction.transaction_type !== 'deposit') return false;

		return clumpedPaymentIndicators.some((indicator) => desc.includes(indicator) || vendor.includes(indicator));
	};

	const clumpedPayments = computed(() => {
		try {
			const transactions = allAccountTransactions.value || [];

			return transactions
				.filter((t) => isClumpedPayment(t))
				.sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date));
		} catch (error) {
			console.error('Error in clumpedPayments:', error);
			return [];
		}
	});

	const clumpedPaymentTotal = computed(() => {
		return clumpedPayments.value.reduce((sum, t) => sum + safeParseFloat(t.amount), 0);
	});

	// Unmatched transfers - only for current account
	const unmatchedTransfers = computed(() => {
		try {
			const transactions = allAccountTransactions.value || [];

			return transactions
				.filter((t) => t && isTransferTransaction(t) && t.linked_transfer_id === null)
				.sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date));
		} catch (error) {
			console.error('Error in unmatchedTransfers:', error);
			return [];
		}
	});

	// Resolve the effective month for a transaction.
	// Uses statement_month if set, otherwise derives from transaction_date.
	const getTransactionMonth = (transaction) => {
		if (transaction.statement_month) return transaction.statement_month;
		if (transaction.transaction_date) {
			// transaction_date is ISO format "2025-01-15" — extract month
			const datePart = String(transaction.transaction_date).slice(0, 10);
			const month = datePart.split('-')[1]; // "01", "02", etc.
			if (month && month.length === 2) return month;
		}
		return null;
	};

	// Helper function to check if a month is in the selected range
	const isMonthInRange = (transactionMonth) => {
		try {
			const startMonth = unref(selectedStartMonth);
			const endMonth = unref(selectedEndMonth);

			// If both are 'all', show all months (YTD)
			if (startMonth === 'all' && endMonth === 'all') return true;
			if (!transactionMonth) return false;

			// Normalize month to 2-digit string
			const normalizeMonth = (month) => String(month).padStart(2, '0');
			const txMonth = normalizeMonth(transactionMonth);

			// If only start is specified, show from start month to end of year
			if (startMonth !== 'all' && endMonth === 'all') {
				return txMonth >= normalizeMonth(startMonth);
			}

			// If only end is specified, show from beginning of year to end month
			if (startMonth === 'all' && endMonth !== 'all') {
				return txMonth <= normalizeMonth(endMonth);
			}

			// Both specified, show range
			if (startMonth !== 'all' && endMonth !== 'all') {
				const start = normalizeMonth(startMonth);
				const end = normalizeMonth(endMonth);
				return txMonth >= start && txMonth <= end;
			}

			return false;
		} catch (error) {
			console.error('Error in isMonthInRange:', error);
			return true; // Default to showing all transactions on error
		}
	};

	// Normalize category_id to integer (handles expanded objects from Directus)
	const normalizeCategoryId = (categoryId) => {
		if (!categoryId) return null;
		if (typeof categoryId === 'object' && categoryId !== null) return categoryId.id;
		// Coerce to number to prevent string/number mismatch in lookups
		const num = Number(categoryId);
		return isNaN(num) ? categoryId : num;
	};

	// Helper functions
	const getCategoryName = (categoryId) => {
		try {
			if (categoryId === 'uncategorized' || !categoryId) return 'Uncategorized';
			// Handle expanded object (category_id returned as {id, category_name, ...})
			if (typeof categoryId === 'object' && categoryId !== null) {
				return categoryId.category_name || 'Unknown Category';
			}
			if (!budgetCategories.value || !Array.isArray(budgetCategories.value)) return 'Unknown Category';
			const normalizedId = normalizeCategoryId(categoryId);
			const category = budgetCategories.value.find((c) => c && normalizeCategoryId(c.id) === normalizedId);
			return category ? category.category_name : 'Unknown Category';
		} catch (error) {
			console.error('Error in getCategoryName:', error);
			return 'Unknown Category';
		}
	};

	const getCategoryColor = (categoryId) => {
		try {
			if (categoryId === 'uncategorized' || !categoryId) return '#6B7280';
			// Handle expanded object (category_id returned as {id, category_name, color, ...})
			if (typeof categoryId === 'object' && categoryId !== null) {
				return categoryId.color || '#6B7280';
			}
			if (!budgetCategories.value || !Array.isArray(budgetCategories.value)) return '#6B7280';
			const normalizedId = normalizeCategoryId(categoryId);
			const category = budgetCategories.value.find((c) => c && normalizeCategoryId(c.id) === normalizedId);
			return category ? category.color || '#6B7280' : '#6B7280';
		} catch (error) {
			console.error('Error in getCategoryColor:', error);
			return '#6B7280';
		}
	};

	// Add after the existing transfer functions

	// Detect suspicious transfer patterns
	const suspiciousTransfers = computed(() => {
		try {
			const allTransfers = accountTransferTransactions.value || [];
			const suspicious = [];

			allTransfers.forEach((transfer) => {
				const issues = [];

				// FLAG 1: Transfer FROM Special Assessment (Account 3) TO Operating (Account 1)
				if (transfer.account_id === 1 && transfer.transaction_type === 'deposit') {
					// This is a deposit into operating - check if it's from special assessment
					const linkedTransfer = transactions.value.find((t) => t.id === transfer.linked_transfer_id);
					if (linkedTransfer && linkedTransfer.account_id === 3) {
						issues.push({
							severity: 'critical',
							type: 'restricted_fund_misuse',
							message: 'Transfer FROM Special Assessment TO Operating - possible misappropriation of restricted funds',
						});
					}
				}

				// FLAG 2: Large unmatched transfers (> $5,000)
				if (!transfer.linked_transfer_id && safeParseFloat(transfer.amount) > 5000) {
					issues.push({
						severity: 'high',
						type: 'large_unmatched',
						message: `Large unmatched transfer of ${formatCurrency(transfer.amount)} - missing counterpart transaction`,
					});
				}

				// FLAG 3: Unmatched transfers (any size)
				if (!transfer.linked_transfer_id) {
					issues.push({
						severity: 'medium',
						type: 'unmatched',
						message: 'Transfer not linked to counterpart - possible data entry error or fund mixing',
					});
				}

				// FLAG 4: Round number transfers (often indicate manual adjustments)
				const amount = safeParseFloat(transfer.amount);
				if (amount % 1000 === 0 && amount >= 5000) {
					issues.push({
						severity: 'low',
						type: 'round_number',
						message: 'Round-number transfer may indicate cash flow manipulation',
					});
				}

				if (issues.length > 0) {
					suspicious.push({
						...transfer,
						issues,
						highestSeverity: issues[0].severity, // First issue is usually highest priority
					});
				}
			});

			return suspicious.sort((a, b) => {
				const severityOrder = {critical: 0, high: 1, medium: 2, low: 3};
				return severityOrder[a.highestSeverity] - severityOrder[b.highestSeverity];
			});
		} catch (error) {
			console.error('Error detecting suspicious transfers:', error);
			return [];
		}
	});

	// Transfer direction analysis - identify problematic flows
	const transferFlowAnalysis = computed(() => {
		try {
			const pairs = transferPairs.value || [];

			const flows = {
				operatingToSpecial: [], // Account 1 → 3 (usually OK)
				specialToOperating: [], // Account 3 → 1 (RED FLAG)
				operatingToReserve: [], // Account 1 → 2 (usually OK)
				reserveToOperating: [], // Account 2 → 1 (needs documentation)
				specialToReserve: [], // Account 3 → 2 (rare)
				reserveToSpecial: [], // Account 2 → 3 (rare)
			};

			pairs.forEach((pair) => {
				const from = pair.fromAccount?.id;
				const to = pair.toAccount?.id;

				if (from === 1 && to === 3) flows.operatingToSpecial.push(pair);
				if (from === 3 && to === 1) flows.specialToOperating.push(pair);
				if (from === 1 && to === 2) flows.operatingToReserve.push(pair);
				if (from === 2 && to === 1) flows.reserveToOperating.push(pair);
				if (from === 3 && to === 2) flows.specialToReserve.push(pair);
				if (from === 2 && to === 3) flows.reserveToSpecial.push(pair);
			});

			return {
				flows,
				criticalIssues: flows.specialToOperating.length > 0,
				warningCount: flows.reserveToOperating.length,
				totalCriticalAmount: flows.specialToOperating.reduce((sum, p) => sum + safeParseFloat(p.amount), 0),
			};
		} catch (error) {
			console.error('Error analyzing transfer flows:', error);
			return {flows: {}, criticalIssues: false, warningCount: 0, totalCriticalAmount: 0};
		}
	});

	const getBudgetForCategory = (categoryId) => {
		try {
			if (categoryId === 'uncategorized' || !categoryId) return 0;
			if (!budgetCategories.value || !Array.isArray(budgetCategories.value)) return 0;
			const normalizedId = normalizeCategoryId(categoryId);
			const category = budgetCategories.value.find((c) => c && normalizeCategoryId(c.id) === normalizedId);
			return category ? safeParseFloat(category.yearly_budget) : 0;
		} catch (error) {
			console.error('Error in getBudgetForCategory:', error);
			return 0;
		}
	};

	const getAccountById = (accountId) => {
		try {
			if (!accounts.value || !Array.isArray(accounts.value)) return null;
			return accounts.value.find((a) => a && a.id === accountId);
		} catch (error) {
			console.error('Error in getAccountById:', error);
			return null;
		}
	};

	// Fetch functions
	const fetchAccounts = async () => {
		try {
			const data = await accountsCollection.list({
				sort: ['account_number'],
				fields: ['*'],
			});
			accounts.value = data || [];
		} catch (e) {
			console.error('Error fetching accounts:', e);
			throw e;
		}
	};

	const fetchBudgetCategories = async () => {
		try {
			const data = await budgetCategoriesCollection.list({
				filter: {
					_or: [
						{ fiscal_year: { year: { _eq: unref(selectedYear) } } },
						{ fiscal_year: { _null: true } },
					],
				},
				sort: ['category_name'],
				fields: ['*', 'fiscal_year.*'],
			});
			budgetCategories.value = data || [];
		} catch (e) {
			console.error('Error fetching budget categories:', e);
			throw e;
		}
	};

	const fetchTransactions = async () => {
		try {
			const data = await transactionsCollection.list({
				filter: {
					fiscal_year: { year: { _eq: unref(selectedYear) } },
				},
				sort: ['-transaction_date'],
				fields: ['*'],
				limit: -1,
			});
			transactions.value = data || [];
		} catch (e) {
			console.error('Error fetching transactions:', e);
			throw e;
		}
	};

	const fetchMonthlyStatements = async () => {
		try {
			const data = await monthlyStatementsCollection.list({
				filter: {
					fiscal_year: { year: { _eq: unref(selectedYear) } },
				},
				sort: ['statement_month'],
				fields: ['*'],
			});
			monthlyStatements.value = data || [];
		} catch (e) {
			console.error('Error fetching monthly statements:', e);
			throw e;
		}
	};

	// Get account-specific transactions (filtered by current selections)
	const accountTransactions = computed(() => {
		try {
			if (!transactions.value || !Array.isArray(transactions.value)) {
				return [];
			}

			const currentAccount = unref(selectedAccount);
			const currentCategory = unref(selectedCategory);
			const currentVendor = unref(selectedVendor);

			let filtered = transactions.value.filter((t) => {
				return (
					t &&
					t.account_id === currentAccount &&
					isMonthInRange(getTransactionMonth(t))
				);
			});

			// Apply category filter
			if (currentCategory !== 'all') {
				filtered = filtered.filter((t) => {
					if (currentCategory === 'uncategorized') {
						return !t.category_id;
					}
					return normalizeCategoryId(t.category_id) === parseInt(currentCategory);
				});
			}

			// Apply vendor filter
			if (currentVendor !== 'all') {
				if (currentVendor === 'no_vendor') {
					filtered = filtered.filter((t) => !t.vendor || t.vendor.trim() === '');
				} else {
					filtered = filtered.filter((t) => (t.vendor || '').toLowerCase().includes(currentVendor.toLowerCase()));
				}
			}

			return filtered;
		} catch (error) {
			console.error('Error in accountTransactions computed:', error);
			return [];
		}
	});

	// Get all transactions for current account (no category/vendor filter - for YTD calculations)
	const allAccountTransactions = computed(() => {
		try {
			if (!transactions.value || !Array.isArray(transactions.value)) {
				return [];
			}

			const currentAccount = unref(selectedAccount);
			return transactions.value.filter((t) => {
				return (
					t &&
					t.account_id === currentAccount &&
					isMonthInRange(getTransactionMonth(t))
				);
			});
		} catch (error) {
			console.error('Error in allAccountTransactions computed:', error);
			return [];
		}
	});

	// Account-specific metrics (YTD or filtered by month range)
	const accountMetrics = computed(() => {
		try {
			const transactions = allAccountTransactions.value || [];
			const startMonth = unref(selectedStartMonth);
			const endMonth = unref(selectedEndMonth);
			const isYTD = startMonth === 'all' && endMonth === 'all';

			if (transactions.length === 0) {
				return {revenue: 0, expenses: 0, violations: 0, monthsCount: 0, transfersIn: 0, transfersOut: 0, isYTD};
			}

			// REVENUE: Deposits that are NOT transfers and NOT violations
			const revenueTransactions = transactions.filter((t) => {
				return t && t.transaction_type === 'deposit' && !t.is_violation && !isTransferTransaction(t);
			});

			const revenue = revenueTransactions.reduce((sum, t) => sum + safeParseFloat(t.amount), 0);

			// EXPENSES: Withdrawals that are NOT transfers and NOT violations
			const expenseTransactions = transactions.filter((t) => {
				return t && t.transaction_type === 'withdrawal' && !t.is_violation && !isTransferTransaction(t);
			});

			const expenses = expenseTransactions.reduce((sum, t) => sum + safeParseFloat(t.amount), 0);

			// TRANSFERS
			const transfersIn = transactions
				.filter((t) => t && t.transaction_type === 'deposit' && isTransferTransaction(t))
				.reduce((sum, t) => sum + safeParseFloat(t.amount), 0);

			const transfersOut = transactions
				.filter((t) => t && t.transaction_type === 'withdrawal' && isTransferTransaction(t))
				.reduce((sum, t) => sum + safeParseFloat(t.amount), 0);

			// Count violations
			const violationTransactions = transactions.filter((t) => t && t.is_violation === true);

			// Calculate months with data
			const monthsWithData = new Set(
				transactions
					.filter((t) => t && !isTransferTransaction(t))
					.map((t) => getTransactionMonth(t))
					.filter((month) => month && month !== '')
			).size;

			return {
				revenue,
				expenses,
				transfersIn,
				transfersOut,
				netCashFlow: revenue - expenses,
				violations: violationTransactions.length,
				monthsCount: monthsWithData,
				isYTD,
			};
		} catch (error) {
			console.error('Error in accountMetrics computed:', error);
			return {revenue: 0, expenses: 0, violations: 0, monthsCount: 0, transfersIn: 0, transfersOut: 0, isYTD: true};
		}
	});

	// Keep backward compatibility
	const accountYTDMetrics = computed(() => accountMetrics.value);

	// Category breakdown for current account
	const categoryBreakdown = computed(() => {
		try {
			const transactions = allAccountTransactions.value || [];

			if (transactions.length === 0) {
				return [];
			}

			// Group by category
			const categoryTotals = {};

			transactions.forEach((t) => {
				if (!t || isTransferTransaction(t) || t.is_violation) return;

				const categoryId = normalizeCategoryId(t.category_id) || 'uncategorized';
				const categoryName = getCategoryName(t.category_id);
				const isRevenue = t.transaction_type === 'deposit';
				const amount = safeParseFloat(t.amount);

				if (!categoryTotals[categoryId]) {
					categoryTotals[categoryId] = {
						id: categoryId,
						name: categoryName,
						revenue: 0,
						expenses: 0,
						net: 0,
						transactionCount: 0,
						budget: getBudgetForCategory(categoryId),
						color: getCategoryColor(categoryId),
					};
				}

				if (isRevenue) {
					categoryTotals[categoryId].revenue += amount;
				} else {
					categoryTotals[categoryId].expenses += amount;
				}
				categoryTotals[categoryId].net = categoryTotals[categoryId].revenue - categoryTotals[categoryId].expenses;
				categoryTotals[categoryId].transactionCount++;
			});

			// Convert to array and sort by total activity (expenses + revenue)
			return Object.values(categoryTotals)
				.filter((cat) => cat.transactionCount > 0)
				.sort((a, b) => b.expenses + b.revenue - (a.expenses + a.revenue));
		} catch (error) {
			console.error('Error in categoryBreakdown computed:', error);
			return [];
		}
	});

	// Grouped vendor transactions with totals for detailed view
	const groupedVendorTransactions = computed(() => {
		try {
			const transactions = allAccountTransactions.value || [];

			if (transactions.length === 0) {
				return [];
			}

			// Group transactions by vendor
			const vendorGroups = {};

			transactions.forEach((t) => {
				if (!t || isTransferTransaction(t) || t.is_violation || t.transaction_type === 'deposit') return;

				const vendor = t.vendor || 'No Vendor Listed';

				if (!vendorGroups[vendor]) {
					vendorGroups[vendor] = {
						vendor,
						transactions: [],
						totalAmount: 0,
						transactionCount: 0,
						categories: new Set(),
						monthSpread: new Set(),
					};
				}

				vendorGroups[vendor].transactions.push(t);
				vendorGroups[vendor].totalAmount += safeParseFloat(t.amount);
				vendorGroups[vendor].transactionCount++;

				if (t.category_id) {
					vendorGroups[vendor].categories.add(getCategoryName(t.category_id));
				}

				const txMonth = getTransactionMonth(t);
				if (txMonth) {
					vendorGroups[vendor].monthSpread.add(txMonth);
				}
			});

			// Convert to array and sort by total amount
			return Object.values(vendorGroups)
				.map((group) => ({
					...group,
					categories: Array.from(group.categories),
					monthSpread: Array.from(group.monthSpread).sort(),
					transactions: group.transactions.sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date)),
				}))
				.sort((a, b) => b.totalAmount - a.totalAmount);
		} catch (error) {
			console.error('Error in groupedVendorTransactions computed:', error);
			return [];
		}
	});

	// Keep backward compatibility - simple vendor breakdown
	const vendorBreakdown = computed(() => {
		try {
			return groupedVendorTransactions.value.map((group) => ({
				vendor: group.vendor,
				totalAmount: group.totalAmount,
				transactionCount: group.transactionCount,
				categories: group.categories,
				lastTransaction: group.transactions[0]?.transaction_date,
			}));
		} catch (error) {
			console.error('Error in vendorBreakdown computed:', error);
			return [];
		}
	});

	// Monthly trend for current account (with balance fallback)
	const accountMonthlyTrend = computed(() => {
		try {
			const transactions = allAccountTransactions.value || [];

			if (transactions.length === 0) {
				return [];
			}

			const monthsInData = [...new Set(transactions.map((t) => getTransactionMonth(t)).filter((m) => m))].sort();

			const result = monthsInData.map((month) => {
				const monthTransactions = transactions.filter((t) => getTransactionMonth(t) === month);

				const revenue = monthTransactions
					.filter((t) => t.transaction_type === 'deposit' && !t.is_violation && !isTransferTransaction(t))
					.reduce((sum, t) => sum + safeParseFloat(t.amount), 0);

				const expenses = monthTransactions
					.filter((t) => t.transaction_type === 'withdrawal' && !t.is_violation && !isTransferTransaction(t))
					.reduce((sum, t) => sum + safeParseFloat(t.amount), 0);

				const transfersIn = monthTransactions
					.filter((t) => t.transaction_type === 'deposit' && isTransferTransaction(t))
					.reduce((sum, t) => sum + safeParseFloat(t.amount), 0);

				const transfersOut = monthTransactions
					.filter((t) => t.transaction_type === 'withdrawal' && isTransferTransaction(t))
					.reduce((sum, t) => sum + safeParseFloat(t.amount), 0);

				// Get statement balance for this month
				const statement = monthlyStatements.value.find(
					(s) => s.account_id === unref(selectedAccount) && s.statement_month === month && s.ending_balance
				);

				const monthNames = {
					'01': 'Jan',
					'02': 'Feb',
					'03': 'Mar',
					'04': 'Apr',
					'05': 'May',
					'06': 'Jun',
					'07': 'Jul',
					'08': 'Aug',
					'09': 'Sep',
					10: 'Oct',
					11: 'Nov',
					12: 'Dec',
				};

				return {
					month: monthNames[month] || month,
					monthValue: month,
					revenue,
					expenses,
					transfersIn,
					transfersOut,
					netCashFlow: revenue - expenses,
					statementBalance: statement ? safeParseFloat(statement.ending_balance) : null,
				};
			});

			// If any month has a statement balance, use those directly
			const hasStatementBalances = result.some((m) => m.statementBalance !== null);

			if (hasStatementBalances) {
				return result.map((m) => ({
					...m,
					balance: m.statementBalance || 0,
				}));
			}

			// Fallback: compute running balance from transactions
			let runningBalance = 0;
			return result.map((m) => {
				const monthTx = transactions.filter((t) => getTransactionMonth(t) === m.monthValue);

				const totalIn = monthTx
					.filter((t) => t.transaction_type === 'deposit' || t.transaction_type === 'transfer_in')
					.reduce((sum, t) => sum + safeParseFloat(t.amount), 0);

				const totalOut = monthTx
					.filter((t) => t.transaction_type === 'withdrawal' || t.transaction_type === 'fee' || t.transaction_type === 'transfer_out')
					.reduce((sum, t) => sum + safeParseFloat(t.amount), 0);

				runningBalance += totalIn - totalOut;

				return {
					...m,
					balance: runningBalance,
				};
			});
		} catch (error) {
			console.error('Error in accountMonthlyTrend computed:', error);
			return [];
		}
	});

	// Current account balance (with transaction-based fallback)
	const currentAccountBalance = computed(() => {
		try {
			const currentAccount = unref(selectedAccount);
			const account = accounts.value.find((a) => a && a.id === currentAccount);

			// Get latest statement
			const accountStatements = monthlyStatements.value
				.filter((s) => s.account_id === currentAccount && s.ending_balance)
				.sort((a, b) => (a.statement_month || '').localeCompare(b.statement_month || ''));

			const latestStatement = accountStatements[accountStatements.length - 1];

			if (latestStatement) {
				return {
					account,
					current: safeParseFloat(latestStatement.ending_balance),
					previous: safeParseFloat(latestStatement.beginning_balance),
					statementMonth: latestStatement.statement_month,
				};
			}

			// Fallback: calculate balance from transactions
			const txs = allAccountTransactions.value || [];
			if (txs.length === 0) {
				return { account, current: 0, previous: 0, statementMonth: null };
			}

			const totalDeposits = txs
				.filter((t) => t.transaction_type === 'deposit' || t.transaction_type === 'transfer_in')
				.reduce((sum, t) => sum + safeParseFloat(t.amount), 0);

			const totalWithdrawals = txs
				.filter((t) => t.transaction_type === 'withdrawal' || t.transaction_type === 'fee' || t.transaction_type === 'transfer_out')
				.reduce((sum, t) => sum + safeParseFloat(t.amount), 0);

			const netBalance = totalDeposits - totalWithdrawals;

			// Get the latest month for context
			const months = [...new Set(txs.map((t) => getTransactionMonth(t)).filter((m) => m))].sort();
			const latestMonth = months[months.length - 1] || null;

			return {
				account,
				current: netBalance,
				previous: 0,
				statementMonth: latestMonth,
			};
		} catch (error) {
			console.error('Error in currentAccountBalance computed:', error);
			return {
				account: null,
				current: 0,
				previous: 0,
				statementMonth: null,
			};
		}
	});

	// Budget comparison for current account (expenses only)
	const accountBudgetComparison = computed(() => {
		try {
			const transactions = allAccountTransactions.value || [];
			const monthsInRange = getMonthsInRange();
			const selectedMonthCount = monthsInRange.length;

			const expenseCategories = (budgetCategories.value || []).filter((cat) => {
				const name = (cat.category_name || '').toLowerCase();
				return !name.includes('revenue') && !name.includes('special assessment');
			});

			return expenseCategories.map((category) => {
				const categoryTransactions = transactions.filter((t) => {
					return (
						normalizeCategoryId(t.category_id) === category.id &&
						t.transaction_type === 'withdrawal' &&
						!t.is_violation &&
						!isTransferTransaction(t)
					);
				});

				const actualAmount = categoryTransactions.reduce((sum, t) => sum + safeParseFloat(t.amount), 0);
				const annualBudgetAmount = safeParseFloat(category.yearly_budget) || 0;

				// Calculate pro-rated budget for selected period
				const monthlyBudgetAmount = annualBudgetAmount / 12;
				const proRatedBudgetAmount = monthlyBudgetAmount * selectedMonthCount;

				const variance = actualAmount - proRatedBudgetAmount;
				const percentVariance = proRatedBudgetAmount > 0 ? (variance / proRatedBudgetAmount) * 100 : 0;

				return {
					...category,
					actual: actualAmount,
					budget: proRatedBudgetAmount, // Use pro-rated budget instead of annual
					annualBudget: annualBudgetAmount, // Keep annual for reference if needed
					monthlyBudget: monthlyBudgetAmount,
					monthsInPeriod: selectedMonthCount,
					variance,
					percentVariance: Math.round(percentVariance * 10) / 10,
					status: variance > 0 ? 'Over Budget' : 'On Track',
					statusColor: variance > 0 ? 'red' : 'green',
				};
			});
		} catch (error) {
			console.error('Error in accountBudgetComparison computed:', error);
			return [];
		}
	});

	// Available filter options
	const currentYear = new Date().getFullYear();
	const yearOptions = computed(() => {
		const years = [];
		for (let y = 2023; y <= currentYear + 1; y++) {
			years.push({ label: `${y}`, value: y });
		}
		return years;
	});

	const monthOptions = computed(() => {
		return [
			{label: 'All Months', value: 'all'},
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
	});

	const categoryOptions = computed(() => {
		try {
			if (!budgetCategories.value || !Array.isArray(budgetCategories.value)) {
				return [
					{label: 'All Categories', value: 'all'},
					{label: 'Uncategorized', value: 'uncategorized'},
				];
			}

			return [
				{label: 'All Categories', value: 'all'},
				{label: 'Uncategorized', value: 'uncategorized'},
				...budgetCategories.value.map((cat) => ({
					label: cat.category_name || 'Unknown Category',
					value: cat.id ? cat.id.toString() : 'unknown',
				})),
			];
		} catch (error) {
			console.error('Error in categoryOptions computed:', error);
			return [
				{label: 'All Categories', value: 'all'},
				{label: 'Uncategorized', value: 'uncategorized'},
			];
		}
	});

	const vendorOptions = computed(() => {
		try {
			if (!allAccountTransactions.value || !Array.isArray(allAccountTransactions.value)) {
				return [
					{label: 'All Vendors', value: 'all'},
					{label: 'No Vendor Listed', value: 'no_vendor'},
				];
			}

			const vendors = new Set();
			allAccountTransactions.value.forEach((t) => {
				if (t && t.vendor && t.vendor.trim() !== '') {
					vendors.add(t.vendor);
				}
			});

			return [
				{label: 'All Vendors', value: 'all'},
				{label: 'No Vendor Listed', value: 'no_vendor'},
				...[...vendors].sort().map((vendor) => ({
					label: vendor,
					value: vendor,
				})),
			];
		} catch (error) {
			console.error('Error in vendorOptions computed:', error);
			return [
				{label: 'All Vendors', value: 'all'},
				{label: 'No Vendor Listed', value: 'no_vendor'},
			];
		}
	});

	// Helper to get range description
	const getRangeDescription = () => {
		const startMonth = unref(selectedStartMonth);
		const endMonth = unref(selectedEndMonth);

		const monthNames = {
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

		if (startMonth === 'all' && endMonth === 'all') {
			return 'Year-to-Date';
		}

		if (startMonth !== 'all' && endMonth === 'all') {
			return `${monthNames[startMonth]} - December`;
		}

		if (startMonth === 'all' && endMonth !== 'all') {
			return `January - ${monthNames[endMonth]}`;
		}

		if (startMonth === endMonth) {
			return monthNames[startMonth];
		}

		return `${monthNames[startMonth]} - ${monthNames[endMonth]}`;
	};

	const formatCurrency = (amount) => {
		const safeAmount = safeParseFloat(amount);
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
		}).format(safeAmount);
	};

	const getMonthName = (monthValue) => {
		const monthNames = {
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
		return monthNames[monthValue] || monthValue;
	};

	// Refresh all data
	const refreshAll = async () => {
		loading.value = true;
		error.value = null;

		try {
			await Promise.all([fetchAccounts(), fetchBudgetCategories(), fetchTransactions(), fetchMonthlyStatements()]);
			nextTick(() => {
				initializeEndMonth();
			});
		} catch (e) {
			error.value = e.message || 'Error refreshing financial data';
			console.error('Error refreshing financial data:', e);
		} finally {
			loading.value = false;
		}
	};

	const budget2025 = {
		categories: {
			Insurance: {
				monthly: 7131.59, // Building + Flood Insurance
				yearly: 85579.08,
			},
			Professional: {
				monthly: 1703.67, // Management + CPA + Legal + Taxes + BOIR
				yearly: 20444.0,
			},
			Utilities: {
				monthly: 2586.0, // Water + Electric + Gas + Internet
				yearly: 31032.0,
			},
			Maintenance: {
				monthly: 2770.0, // Cleaning + Maintenance + Pool + Landscaping
				yearly: 33240.0,
			},
			Regulatory: {
				monthly: 416.67, // Regulatory expenses
				yearly: 5000.0,
			},
			Banking: {
				monthly: 171.17, // Banking fees
				yearly: 2054.0,
			},
			Other: {
				monthly: 500.0, // Miscellaneous
				yearly: 6000.0,
			},
		},
		totals: {
			monthly: 15278.93, // Total monthly budget
			yearly: 183347.08,
		},
	};

	// Map your database categories to budget categories
	const categoryMapping = {
		Insurance: 'Insurance',
		'Building Insurance': 'Insurance',
		'Flood Insurance': 'Insurance',

		// Professional services
		Professional: 'Professional',
		Management: 'Professional', // This is important - Management maps to Professional
		Administrative: 'Professional', // Admin costs: management fees, tax prep, legal, misc admin
		Legal: 'Professional',
		CPA: 'Professional',
		Accounting: 'Professional',
		Attorney: 'Professional',

		// Contract Services — split across Maintenance and Professional based on vendor type
		// Most contract services are maintenance-related (cleaning, elevator, waste, fire, laundry)
		'Contract Services': 'Maintenance',

		// Utilities
		Utilities: 'Utilities',
		Water: 'Utilities',
		Electric: 'Utilities',
		Electricity: 'Utilities',
		Gas: 'Utilities',
		Internet: 'Utilities',
		Cable: 'Utilities',
		Laundry: 'Utilities',
		'Wash Multifamily': 'Utilities',

		// Maintenance
		Maintenance: 'Maintenance',
		Cleaning: 'Maintenance',
		Pool: 'Maintenance',
		Landscaping: 'Maintenance',
		Repairs: 'Maintenance',
		Elevator: 'Maintenance',

		// Regulatory/Other
		Regulatory: 'Regulatory',
		Banking: 'Banking',
		Bank: 'Banking',
		Fees: 'Banking',

		// Default
		Other: 'Other',
	};

	// Helper function to get months in selected range
	const getMonthsInRange = () => {
		try {
			const startMonth = unref(selectedStartMonth);
			const endMonth = unref(selectedEndMonth);

			// If both are 'all', return all months 1-12
			if (startMonth === 'all' && endMonth === 'all') {
				return ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
			}

			let months = [];
			let start = startMonth === 'all' ? '01' : startMonth;
			let end = endMonth === 'all' ? '12' : endMonth;

			// Convert to numbers for easier comparison
			let startNum = parseInt(start);
			let endNum = parseInt(end);

			for (let i = startNum; i <= endNum; i++) {
				months.push(String(i).padStart(2, '0'));
			}

			return months;
		} catch (error) {
			console.error('Error in getMonthsInRange:', error);
			return ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
		}
	};

	// Calculate pro-rated budget based on selected months
	const calculateProRatedBudget = (monthlyAmount) => {
		const monthsInRange = getMonthsInRange();
		const selectedMonthCount = monthsInRange.length;

		// Pro-rate the annual budget based on selected months
		return monthlyAmount * selectedMonthCount;
	};

	// Vendor-level overrides for categories that span multiple budget buckets
	// (e.g., "Contract Services" contains both maintenance and professional vendors)
	const vendorBudgetOverrides = {
		'vte consulting': 'Professional', // Property management company
	};

	// Detect Zelle reimbursements to board members / owners at units 201-214, 301-314
	const isBoardMemberReimbursement = (description) => {
		if (!description) return false;
		const desc = description.toLowerCase();
		if (!desc.includes('zelle')) return false;
		return /\b(2(?:0[1-9]|1[0-4])|3(?:0[1-9]|1[0-4]))\b/.test(desc);
	};

	// Map transaction category to budget category
	const mapToBudgetCategory = (transactionCategory, vendorName, description) => {
		if (!transactionCategory) return 'Other';

		// Board member reimbursements are maintenance regardless of stored category
		if (isBoardMemberReimbursement(description)) {
			return 'Maintenance';
		}

		// Check vendor-level override first
		if (vendorName) {
			const vendor = vendorName.toLowerCase().trim();
			for (const [key, value] of Object.entries(vendorBudgetOverrides)) {
				if (vendor.includes(key)) {
					return value;
				}
			}
		}

		const category = transactionCategory.toLowerCase().trim();

		// Direct mapping - check exact matches first
		for (const [key, value] of Object.entries(categoryMapping)) {
			if (key.toLowerCase() === category) {
				return value;
			}
		}

		// Partial matching - check if category contains any of the keys
		for (const [key, value] of Object.entries(categoryMapping)) {
			if (category.includes(key.toLowerCase())) {
				return value;
			}
		}

		return 'Other';
	};

	// Whether budget data exists for the selected fiscal year
	const hasBudgetData = computed(() => {
		const cats = budgetCategories.value || [];
		// Only count categories that have a fiscal_year matching selectedYear
		return cats.some((cat) => {
			if (!cat.fiscal_year) return false;
			const catYear = typeof cat.fiscal_year === 'object' ? cat.fiscal_year.year : cat.fiscal_year;
			return catYear === unref(selectedYear);
		});
	});

	// Dynamic budget totals from Directus categories (replaces hardcoded budget2025.totals)
	const dynamicBudgetTotals = computed(() => {
		const cats = budgetCategories.value || [];
		const expenseCats = cats.filter((cat) => {
			const name = (cat.category_name || '').toLowerCase();
			return !name.includes('revenue') && !name.includes('special assessment');
		});
		const yearly = expenseCats.reduce((sum, cat) => sum + safeParseFloat(cat.yearly_budget), 0);
		const monthly = yearly > 0 ? yearly / 12 : 0;
		return { monthly, yearly };
	});

	// Budget comparison analysis (dynamic - uses Directus budget_categories for selected year)
	const budgetComparison = computed(() => {
		try {
			const transactions = allAccountTransactions.value || [];
			const monthsInRange = getMonthsInRange();
			const selectedMonthCount = monthsInRange.length;

			// Use dynamic budget categories from Directus (already filtered by selectedYear)
			const expenseCategories = (budgetCategories.value || []).filter((cat) => {
				const name = (cat.category_name || '').toLowerCase();
				return !name.includes('revenue') && !name.includes('special assessment');
			});

			if (expenseCategories.length === 0) {
				return [];
			}

			return expenseCategories
				.map((category) => {
					const categoryTransactions = transactions.filter((t) => {
						return (
							normalizeCategoryId(t.category_id) === category.id &&
							t.transaction_type === 'withdrawal' &&
							!t.is_violation &&
							!isTransferTransaction(t)
						);
					});

					const actualAmount = categoryTransactions.reduce((sum, t) => sum + safeParseFloat(t.amount), 0);
					const annualBudgetAmount = safeParseFloat(category.yearly_budget) || 0;
					const monthlyBudget = annualBudgetAmount / 12;
					const proRatedBudget = monthlyBudget * selectedMonthCount;
					const variance = actualAmount - proRatedBudget;
					const percentVariance = proRatedBudget > 0 ? Math.round((variance / proRatedBudget) * 100) : 0;

					// Determine status
					let status = 'On Track';
					let statusColor = 'green';
					if (variance > 0) {
						if (percentVariance > 20) {
							status = 'Significantly Over Budget';
							statusColor = 'red';
						} else if (percentVariance > 10) {
							status = 'Over Budget';
							statusColor = 'orange';
						} else {
							status = 'Slightly Over Budget';
							statusColor = 'yellow';
						}
					} else {
						if (percentVariance < -20) {
							status = 'Significantly Under Budget';
							statusColor = 'blue';
						} else {
							status = 'On Track';
							statusColor = 'green';
						}
					}

					return {
						category: category.category_name,
						categoryId: category.id,
						monthlyBudget,
						proRatedBudget,
						actualAmount,
						variance,
						percentVariance,
						status,
						statusColor,
						transactionCount: categoryTransactions.length,
						monthsSelected: selectedMonthCount,
					};
				})
				.filter((cat) => cat.actualAmount > 0 || cat.proRatedBudget > 0)
				.sort((a, b) => b.variance - a.variance);
		} catch (error) {
			console.error('Error in budgetComparison:', error);
			return [];
		}
	});

	// Overall budget summary (dynamic - uses Directus budget_categories for selected year)
	const budgetSummary = computed(() => {
		try {
			const transactions = allAccountTransactions.value || [];
			const monthsInRange = getMonthsInRange();
			const selectedMonthCount = monthsInRange.length;

			// Total budgeted amount for selected period (from dynamic categories)
			const monthlyBudgetRate = dynamicBudgetTotals.value.monthly;
			const totalBudgeted = monthlyBudgetRate * selectedMonthCount;

			// Total actual expenses (excluding transfers and violations)
			const totalActual = transactions
				.filter((t) => t && t.transaction_type === 'withdrawal' && !t.is_violation && !isTransferTransaction(t))
				.reduce((sum, t) => sum + safeParseFloat(t.amount), 0);

			const totalVariance = totalActual - totalBudgeted;
			const percentVariance = totalBudgeted > 0 ? Math.round((totalVariance / totalBudgeted) * 100) : 0;

			// Determine overall status
			let overallStatus = 'On Track';
			let statusColor = 'green';

			if (totalVariance > 0) {
				if (percentVariance > 15) {
					overallStatus = 'Significantly Over Budget';
					statusColor = 'red';
				} else if (percentVariance > 5) {
					overallStatus = 'Over Budget';
					statusColor = 'orange';
				} else {
					overallStatus = 'Slightly Over Budget';
					statusColor = 'yellow';
				}
			} else if (percentVariance < -15) {
				overallStatus = 'Significantly Under Budget';
				statusColor = 'blue';
			}

			return {
				totalBudgeted,
				totalActual,
				totalVariance,
				percentVariance,
				overallStatus,
				statusColor,
				monthsSelected: selectedMonthCount,
				monthlyBudgetRate,
				isYearToDate: selectedMonthCount === 12,
				averageMonthlyActual: selectedMonthCount > 0 ? totalActual / selectedMonthCount : 0,
			};
		} catch (error) {
			console.error('Error in budgetSummary:', error);
			return {
				totalBudgeted: 0,
				totalActual: 0,
				totalVariance: 0,
				percentVariance: 0,
				overallStatus: 'Unknown',
				statusColor: 'gray',
				monthsSelected: 0,
				monthlyBudgetRate: 0,
				isYearToDate: false,
				averageMonthlyActual: 0,
			};
		}
	});

	// Budget projection - estimate year-end spending based on current trends
	const budgetProjection = computed(() => {
		try {
			const summary = budgetSummary.value;
			const monthsInRange = getMonthsInRange();
			const selectedMonthCount = monthsInRange.length;
			const yearlyBudget = dynamicBudgetTotals.value.yearly;

			if (selectedMonthCount === 0 || summary.averageMonthlyActual === 0 || yearlyBudget === 0) {
				return {
					projectedYearEnd: 0,
					projectedVariance: 0,
					projectedPercentVariance: 0,
					recommendation: 'Insufficient data for projection',
				};
			}

			// Project full year spending based on average monthly actual
			const projectedYearEnd = summary.averageMonthlyActual * 12;
			const projectedVariance = projectedYearEnd - yearlyBudget;
			const projectedPercentVariance = Math.round((projectedVariance / yearlyBudget) * 100);

			let recommendation = '';
			if (projectedVariance > 10000) {
				recommendation = 'Consider budget revision or expense reduction measures';
			} else if (projectedVariance > 5000) {
				recommendation = 'Monitor spending closely and consider cost controls';
			} else if (projectedVariance < -10000) {
				recommendation = 'Consider allocating surplus to reserves or improvements';
			} else {
				recommendation = 'Spending is tracking well against budget';
			}

			return {
				projectedYearEnd,
				projectedVariance,
				projectedPercentVariance,
				recommendation,
			};
		} catch (error) {
			console.error('Error in budgetProjection:', error);
			return {
				projectedYearEnd: 0,
				projectedVariance: 0,
				projectedPercentVariance: 0,
				recommendation: 'Error calculating projection',
			};
		}
	});

	// Get transactions for a budget category by category ID
	const getCategoryTransactions = (categoryId) => {
		try {
			const transactions = allAccountTransactions.value || [];

			const filteredTransactions = transactions.filter((transaction) => {
				if (
					!transaction ||
					transaction.transaction_type !== 'withdrawal' ||
					transaction.is_violation ||
					isTransferTransaction(transaction)
				) {
					return false;
				}

				return normalizeCategoryId(transaction.category_id) === categoryId;
			});

			return filteredTransactions.sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date));
		} catch (error) {
			console.error('Error getting category transactions:', error);
			return [];
		}
	};

	const getLargestTransaction = (categoryId) => {
		try {
			const transactions = getCategoryTransactions(categoryId);
			if (transactions.length === 0) return 0;

			return Math.max(...transactions.map((t) => safeParseFloat(t.amount)));
		} catch (error) {
			console.error('Error getting largest transaction:', error);
			return 0;
		}
	};

	const getCategoryMonthSpread = (categoryId) => {
		try {
			const transactions = getCategoryTransactions(categoryId);
			const months = new Set(transactions.map((t) => getTransactionMonth(t)).filter((m) => m));

			if (months.size === 0) return 'No data';
			if (months.size === 1) return `${months.size} month`;

			const sortedMonths = Array.from(months).sort();
			if (sortedMonths.length <= 3) {
				return sortedMonths.join(', ');
			} else {
				return `${sortedMonths[0]} - ${sortedMonths[sortedMonths.length - 1]} (${months.size} months)`;
			}
		} catch (error) {
			console.error('Error getting category month spread:', error);
			return 'Error';
		}
	};

	// Add to your composable
	const latestMonthWithData = computed(() => {
		try {
			// Get latest month from transactions (already filtered by fiscal year on server)
			const transactionMonths = transactions.value
				.map((t) => getTransactionMonth(t))
				.filter((month) => month);

			// Get latest month from statements (already filtered by fiscal year on server)
			const statementMonths = monthlyStatements.value
				.filter((s) => s && s.statement_month)
				.map((s) => s.statement_month)
				.filter((month) => month);

			// Combine and find the latest
			const allMonths = [...transactionMonths, ...statementMonths];

			if (allMonths.length === 0) return '08'; // Default to August if no data

			// Sort and get the latest month
			const sortedMonths = allMonths.sort((a, b) => {
				return parseInt(a) - parseInt(b);
			});

			const latestMonth = sortedMonths[sortedMonths.length - 1];

			return latestMonth;
		} catch (error) {
			console.error('Error finding latest month with data:', error);
			return '01'; // Default to August
		}
	});

	const initializeEndMonth = () => {
		const latest = latestMonthWithData.value;
		if (latest && latest !== selectedEndMonth.value) {
			selectedEndMonth.value = latest;
		}
	};

	const monthsWithData = computed(() => {
		try {
			// Get months from transactions (already filtered by fiscal year on server)
			const transactionMonths = transactions.value
				.map((t) => getTransactionMonth(t))
				.filter((m) => m);

			// Get months from statements (already filtered by fiscal year on server)
			const statementMonths = monthlyStatements.value
				.filter((s) => s && s.statement_month)
				.map((s) => s.statement_month);

			// Combine and get unique months
			const allMonths = [...new Set([...transactionMonths, ...statementMonths])];

			// Sort months
			return allMonths.sort((a, b) => parseInt(a) - parseInt(b));
		} catch (error) {
			console.error('Error getting months with data:', error);
			return [];
		}
	});

	// Add this computed property in your composable
	const searchFilteredTransactions = computed(() => {
		try {
			const query = unref(searchQuery).toLowerCase().trim();

			// If no search query, return all account transactions
			if (!query) {
				return allAccountTransactions.value || [];
			}

			return (allAccountTransactions.value || []).filter((transaction) => {
				if (!transaction) return false;

				// Search across multiple fields
				const searchableText = [
					transaction.description || '',
					transaction.vendor || '',
					transaction.amount?.toString() || '',
					getCategoryName(transaction.category_id) || '',
					transaction.transaction_type || '',
				]
					.join(' ')
					.toLowerCase();

				return searchableText.includes(query);
			});
		} catch (error) {
			console.error('Error in searchFilteredTransactions:', error);
			return [];
		}
	});

	// Watch for filter changes
	watch([selectedYear], async () => {
		await refreshAll();
	});

	return {
		// State
		selectedYear,
		selectedAccount,
		selectedCategory,
		selectedVendor,
		selectedStartMonth,
		selectedEndMonth,
		searchQuery,
		searchFilteredTransactions,
		loading,
		error,

		// Raw data
		accounts: readonly(accounts),
		budgetCategories: readonly(budgetCategories),
		transactions: readonly(transactions),
		monthlyStatements: readonly(monthlyStatements),

		// Account-specific computed data
		accountTransactions,
		allAccountTransactions,
		accountMetrics,
		accountYTDMetrics, // backward compatibility
		categoryBreakdown,
		vendorBreakdown,
		groupedVendorTransactions,
		accountMonthlyTrend,
		currentAccountBalance,
		accountBudgetComparison,

		// Filter options
		yearOptions,
		monthOptions,
		categoryOptions,
		vendorOptions,
		latestMonthWithData,
		initializeEndMonth,

		// Budget analysis
		budgetComparison,
		budgetSummary,
		budgetProjection,
		hasBudgetData,
		dynamicBudgetTotals,
		budget2025,
		getMonthsInRange,
		calculateProRatedBudget,
		mapToBudgetCategory,

		// Transaction analysis helpers
		getCategoryTransactions,
		getLargestTransaction,
		getCategoryMonthSpread,
		getCategoryName,
		getCategoryColor,

		// Transfer-specific
		accountTransferTransactions,
		transferActivity,
		transferPairs,
		unmatchedTransfers,
		isTransferTransaction,
		isClumpedPayment,
		clumpedPayments,
		clumpedPaymentTotal,
		suspiciousTransfers,
		transferFlowAnalysis,

		// Methods
		refreshAll,
		formatCurrency,
		getMonthName,
		getAccountById,

		safeParseFloat,
		getRangeDescription,
	};
};
