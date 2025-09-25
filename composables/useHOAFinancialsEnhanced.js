// composables/useHOAFinancialsEnhanced.ts - Account-Specific Views with Category/Vendor Filtering
export const useHOAFinancialsEnhanced = () => {
	const {readItems} = useDirectusItems();

	// Reactive state
	const selectedYear = ref(2025);
	const selectedAccount = ref(1); // Default to Operating Account
	const selectedCategory = ref('all');
	const selectedVendor = ref('all');
	const selectedStartMonth = ref('01'); // 'all' for YTD, or '01' for January, etc.
	const selectedEndMonth = ref('08'); // 'all' for YTD, or '12' for December, etc.
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
		const desc = (transaction.description || '').toLowerCase();
		const vendor = (transaction.vendor || '').toLowerCase();

		const transferKeywords = [
			'online transfer',
			'transfer to',
			'transfer from',
			'account 5872',
			'account 7011',
			'account 5129',
			'chk 5129',
			'mma account',
		];

		return (
			transferKeywords.some((keyword) => desc.includes(keyword) || vendor.includes(keyword)) ||
			transaction.violation_type === 'fund_mixing'
		);
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

	// Helper functions
	const getCategoryName = (categoryId) => {
		try {
			if (categoryId === 'uncategorized' || !categoryId) return 'Uncategorized';
			if (!budgetCategories.value || !Array.isArray(budgetCategories.value)) return 'Unknown Category';
			const category = budgetCategories.value.find((c) => c && c.id === categoryId);
			return category ? category.category_name : 'Unknown Category';
		} catch (error) {
			console.error('Error in getCategoryName:', error);
			return 'Unknown Category';
		}
	};

	const getCategoryColor = (categoryId) => {
		try {
			if (categoryId === 'uncategorized' || !categoryId) return '#6B7280';
			if (!budgetCategories.value || !Array.isArray(budgetCategories.value)) return '#6B7280';
			const category = budgetCategories.value.find((c) => c && c.id === categoryId);
			return category ? category.color || '#6B7280' : '#6B7280';
		} catch (error) {
			console.error('Error in getCategoryColor:', error);
			return '#6B7280';
		}
	};

	const getBudgetForCategory = (categoryId) => {
		try {
			if (categoryId === 'uncategorized' || !categoryId) return 0;
			if (!budgetCategories.value || !Array.isArray(budgetCategories.value)) return 0;
			const category = budgetCategories.value.find((c) => c && c.id === categoryId);
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
			const data = await readItems('accounts', {
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
			const data = await readItems('budget_categories', {
				filter: {
					fiscal_year: {_eq: unref(selectedYear)},
				},
				sort: ['category_name'],
				fields: ['*'],
			});
			budgetCategories.value = data || [];
		} catch (e) {
			console.error('Error fetching budget categories:', e);
			throw e;
		}
	};

	const fetchTransactions = async () => {
		try {
			const data = await readItems('transactions', {
				filter: {
					fiscal_year: {_eq: unref(selectedYear)},
				},
				sort: ['-transaction_date'],
				fields: ['*'],
				limit: -1,
			});
			transactions.value = data || [];
			console.log('✅ Fetched transactions:', transactions.value.length);
		} catch (e) {
			console.error('Error fetching transactions:', e);
			throw e;
		}
	};

	const fetchMonthlyStatements = async () => {
		try {
			const data = await readItems('monthly_statements', {
				filter: {
					fiscal_year: {_eq: unref(selectedYear)},
				},
				sort: ['statement_month'],
				fields: ['*'],
			});
			monthlyStatements.value = data || [];
			console.log('✅ Fetched statements:', monthlyStatements.value.length);
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
					t.fiscal_year === unref(selectedYear) &&
					isMonthInRange(t.statement_month)
				);
			});

			// Apply category filter
			if (currentCategory !== 'all') {
				filtered = filtered.filter((t) => {
					if (currentCategory === 'uncategorized') {
						return !t.category_id;
					}
					return t.category_id === parseInt(currentCategory);
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
					t.fiscal_year === unref(selectedYear) &&
					isMonthInRange(t.statement_month)
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
					.map((t) => t.statement_month)
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

				const categoryId = t.category_id || 'uncategorized';
				const categoryName = getCategoryName(categoryId);
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

				if (t.statement_month) {
					vendorGroups[vendor].monthSpread.add(t.statement_month);
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

	// Monthly trend for current account
	const accountMonthlyTrend = computed(() => {
		try {
			const transactions = allAccountTransactions.value || [];

			if (transactions.length === 0) {
				return [];
			}

			const monthsInData = [...new Set(transactions.map((t) => t.statement_month).filter((m) => m))].sort();

			return monthsInData.map((month) => {
				const monthTransactions = transactions.filter((t) => t.statement_month === month);

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
					balance: statement ? safeParseFloat(statement.ending_balance) : 0,
				};
			});
		} catch (error) {
			console.error('Error in accountMonthlyTrend computed:', error);
			return [];
		}
	});

	// Current account balance
	const currentAccountBalance = computed(() => {
		try {
			const currentAccount = unref(selectedAccount);
			const account = accounts.value.find((a) => a && a.id === currentAccount);

			// Get latest statement
			const accountStatements = monthlyStatements.value
				.filter((s) => s.account_id === currentAccount && s.ending_balance)
				.sort((a, b) => (a.statement_month || '').localeCompare(b.statement_month || ''));

			const latestStatement = accountStatements[accountStatements.length - 1];

			return {
				account,
				current: latestStatement ? safeParseFloat(latestStatement.ending_balance) : 0,
				previous: latestStatement ? safeParseFloat(latestStatement.beginning_balance) : 0,
				statementMonth: latestStatement ? latestStatement.statement_month : null,
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
						t.category_id === category.id &&
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
	const yearOptions = computed(() => [
		{label: '2023', value: 2023},
		{label: '2024', value: 2024},
		{label: '2025', value: 2025},
		{label: '2026', value: 2026},
		{label: '2027', value: 2027},
	]);

	const monthOptions = computed(() => {
		const latestMonth = latestMonthWithData.value;
		const monthsWithDataSet = new Set(monthsWithData.value);

		const baseOptions = [
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

		const enhancedOptions = baseOptions.map((option) => {
			const monthNum = parseInt(option.value);
			const latestMonthNum = parseInt(latestMonth || '12');
			const hasData = monthsWithDataSet.has(option.value);

			// Disable if:
			// 1. Month is after the latest month with data, OR
			// 2. Month has no data (except for future months which are already covered by rule 1)
			const isDisabled = monthNum > latestMonthNum || (!hasData && monthNum <= latestMonthNum);

			return {
				...option,
				disabled: isDisabled,
				// Add visual indicator for months with no data
				label: hasData
					? option.label
					: monthNum <= latestMonthNum
						? `${option.label} (No Data)`
						: `${option.label} (Future)`,
			};
		});

		// Always allow "All Months" option
		return [{label: 'All Months', value: 'all', disabled: false}, ...enhancedOptions];
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
		Legal: 'Professional',
		CPA: 'Professional',
		Accounting: 'Professional',
		Attorney: 'Professional',

		// Utilities
		Utilities: 'Utilities',
		Water: 'Utilities',
		Electric: 'Utilities',
		Electricity: 'Utilities',
		Gas: 'Utilities',
		Internet: 'Utilities',
		Cable: 'Utilities',

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

	// Map transaction category to budget category
	// Update mapToBudgetCategory function in your composable
	const mapToBudgetCategory = (transactionCategory) => {
		if (!transactionCategory) return 'Other';

		const category = transactionCategory.toLowerCase().trim();
		console.log(`Debug: Mapping category "${transactionCategory}" (lowercase: "${category}")`);

		// Direct mapping - check exact matches first
		for (const [key, value] of Object.entries(categoryMapping)) {
			if (key.toLowerCase() === category) {
				console.log(`Debug: Exact match: "${key}" -> "${value}"`);
				return value;
			}
		}

		// Partial matching - check if category contains any of the keys
		for (const [key, value] of Object.entries(categoryMapping)) {
			if (category.includes(key.toLowerCase())) {
				console.log(`Debug: Partial match: "${category}" contains "${key.toLowerCase()}" -> "${value}"`);
				return value;
			}
		}

		console.log(`Debug: No match found for "${category}", defaulting to "Other"`);
		return 'Other';
	};

	// Budget comparison analysis
	const budgetComparison = computed(() => {
		try {
			const transactions = allAccountTransactions.value || [];
			const monthsInRange = getMonthsInRange();
			const selectedMonthCount = monthsInRange.length;
			const isYearToDate = unref(selectedStartMonth) === 'all' && unref(selectedEndMonth) === 'all';

			// Initialize budget and actual totals
			const comparison = {};

			// Set up each budget category
			Object.keys(budget2025.categories).forEach((budgetCat) => {
				const monthlyBudget = budget2025.categories[budgetCat].monthly;
				const proRatedBudget = calculateProRatedBudget(monthlyBudget);

				comparison[budgetCat] = {
					category: budgetCat,
					monthlyBudget: monthlyBudget,
					proRatedBudget: proRatedBudget,
					actualAmount: 0,
					variance: 0,
					percentVariance: 0,
					status: 'On Track',
					transactionCount: 0,
					monthsSelected: selectedMonthCount,
				};
			});

			// Calculate actual expenses by category
			transactions.forEach((transaction) => {
				if (
					!transaction ||
					transaction.transaction_type !== 'withdrawal' ||
					transaction.is_violation ||
					isTransferTransaction(transaction)
				) {
					return;
				}

				const amount = safeParseFloat(transaction.amount);
				const transactionCategory = transaction.category_id ? getCategoryName(transaction.category_id) : 'Other';
				const budgetCategory = mapToBudgetCategory(transactionCategory);

				if (comparison[budgetCategory]) {
					comparison[budgetCategory].actualAmount += amount;
					comparison[budgetCategory].transactionCount++;
				}
			});

			// Calculate variances
			Object.keys(comparison).forEach((budgetCat) => {
				const data = comparison[budgetCat];
				data.variance = data.actualAmount - data.proRatedBudget;

				if (data.proRatedBudget > 0) {
					data.percentVariance = Math.round((data.variance / data.proRatedBudget) * 100);
				}

				// Determine status
				if (data.variance > 0) {
					if (data.percentVariance > 20) {
						data.status = 'Significantly Over Budget';
						data.statusColor = 'red';
					} else if (data.percentVariance > 10) {
						data.status = 'Over Budget';
						data.statusColor = 'orange';
					} else {
						data.status = 'Slightly Over Budget';
						data.statusColor = 'yellow';
					}
				} else {
					if (data.percentVariance < -20) {
						data.status = 'Significantly Under Budget';
						data.statusColor = 'blue';
					} else {
						data.status = 'On Track';
						data.statusColor = 'green';
					}
				}
			});

			// Convert to array and sort by variance (most over budget first)
			return Object.values(comparison)
				.filter((cat) => cat.actualAmount > 0 || cat.proRatedBudget > 0)
				.sort((a, b) => b.variance - a.variance);
		} catch (error) {
			console.error('Error in budgetComparison:', error);
			return [];
		}
	});

	// Overall budget summary
	const budgetSummary = computed(() => {
		try {
			const transactions = allAccountTransactions.value || [];
			const monthsInRange = getMonthsInRange();
			const selectedMonthCount = monthsInRange.length;

			// Total budgeted amount for selected period
			const totalBudgeted = budget2025.totals.monthly * selectedMonthCount;

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
				monthlyBudgetRate: budget2025.totals.monthly,
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

			if (selectedMonthCount === 0 || summary.averageMonthlyActual === 0) {
				return {
					projectedYearEnd: 0,
					projectedVariance: 0,
					projectedPercentVariance: 0,
					recommendation: 'Insufficient data for projection',
				};
			}

			// Project full year spending based on average monthly actual
			const projectedYearEnd = summary.averageMonthlyActual * 12;
			const projectedVariance = projectedYearEnd - budget2025.totals.yearly;
			const projectedPercentVariance = Math.round((projectedVariance / budget2025.totals.yearly) * 100);

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

	// In your composable - add this debugging version
	const getCategoryTransactions = (budgetCategory) => {
		try {
			const transactions = allAccountTransactions.value || [];
			console.log(`Debug: Looking for transactions in budget category: ${budgetCategory}`);
			console.log(`Debug: Total account transactions: ${transactions.length}`);

			// Debug: Log all unique database categories
			const allCategories = new Set();
			transactions.forEach((t) => {
				if (t && t.category_id) {
					const dbCategoryName = getCategoryName(t.category_id);
					allCategories.add(dbCategoryName);
				}
			});
			console.log(`Debug: All database categories found:`, Array.from(allCategories));

			// Filter transactions that belong to this budget category
			const filteredTransactions = transactions.filter((transaction) => {
				if (
					!transaction ||
					transaction.transaction_type !== 'withdrawal' ||
					transaction.is_violation ||
					isTransferTransaction(transaction)
				) {
					return false;
				}

				const transactionCategory = transaction.category_id ? getCategoryName(transaction.category_id) : 'Other';
				const mappedCategory = mapToBudgetCategory(transactionCategory);

				// Debug logging
				console.log(
					`Debug: Transaction ${transaction.id}: DB category="${transactionCategory}", mapped to="${mappedCategory}", looking for="${budgetCategory}"`
				);

				return mappedCategory === budgetCategory;
			});

			console.log(`Debug: Found ${filteredTransactions.length} transactions for budget category ${budgetCategory}`);

			return filteredTransactions.sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date));
		} catch (error) {
			console.error('Error getting category transactions:', error);
			return [];
		}
	};

	const getLargestTransaction = (budgetCategory) => {
		try {
			const transactions = getCategoryTransactions(budgetCategory);
			if (transactions.length === 0) return 0;

			return Math.max(...transactions.map((t) => safeParseFloat(t.amount)));
		} catch (error) {
			console.error('Error getting largest transaction:', error);
			return 0;
		}
	};

	const getCategoryMonthSpread = (budgetCategory) => {
		try {
			const transactions = getCategoryTransactions(budgetCategory);
			const months = new Set(transactions.map((t) => t.statement_month).filter((m) => m));

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
			const currentYear = unref(selectedYear);

			// Get latest month from transactions
			const transactionMonths = transactions.value
				.filter((t) => t && t.fiscal_year === currentYear && t.statement_month)
				.map((t) => t.statement_month)
				.filter((month) => month);

			// Get latest month from statements
			const statementMonths = monthlyStatements.value
				.filter((s) => s && s.fiscal_year === currentYear && s.statement_month)
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
			console.log(`Latest month with data: ${latestMonth}`);

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
			console.log(`Auto-initialized end month to: ${latest}`);
		}
	};

	const monthsWithData = computed(() => {
		try {
			const currentYear = unref(selectedYear);

			// Get months from transactions
			const transactionMonths = transactions.value
				.filter((t) => t && t.fiscal_year === currentYear && t.statement_month)
				.map((t) => t.statement_month);

			// Get months from statements
			const statementMonths = monthlyStatements.value
				.filter((s) => s && s.fiscal_year === currentYear && s.statement_month)
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
		mapToBudgetCategory,

		// Methods
		refreshAll,
		formatCurrency,
		getMonthName,
		getAccountById,
		isTransferTransaction,
		safeParseFloat,
		getRangeDescription,
	};
};
