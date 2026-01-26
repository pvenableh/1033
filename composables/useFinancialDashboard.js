// composables/useFinancialDashboard.js
// Financial dashboard with variance analysis, cash flow forecasting, and multi-year comparison

export const useFinancialDashboard = () => {
	const transactionsCollection = useDirectusItems('transactions');
	const budgetCategoriesCollection = useDirectusItems('budget_categories');
	const accountsCollection = useDirectusItems('accounts');
	const monthlyStatementsCollection = useDirectusItems('monthly_statements');
	const cashFlowProjectionsCollection = useDirectusItems('cash_flow_projections');
	const fiscalYearBudgetsCollection = useDirectusItems('fiscal_year_budgets');

	// State
	const loading = ref(false);
	const error = ref(null);
	const transactions = ref([]);
	const budgetCategories = ref([]);
	const accounts = ref([]);
	const monthlyStatements = ref([]);
	const cashFlowProjections = ref([]);
	const fiscalYearBudgets = ref([]);

	// Selected filters
	const selectedYear = ref(new Date().getFullYear());
	const selectedAccount = ref(1); // Default to Operating

	// Fetch all data for dashboard
	const fetchDashboardData = async () => {
		loading.value = true;
		error.value = null;

		try {
			const year = unref(selectedYear);

			const [txData, catData, accData, stmtData, projData, budgetData] = await Promise.all([
				transactionsCollection.list({
					filter: { fiscal_year: { _eq: year } },
					sort: ['-transaction_date'],
					fields: ['*'],
					limit: -1,
				}),
				budgetCategoriesCollection.list({
					filter: { fiscal_year: { _eq: year } },
					fields: ['*'],
				}),
				accountsCollection.list({ fields: ['*'] }),
				monthlyStatementsCollection.list({
					filter: { fiscal_year: { _eq: year } },
					sort: ['account_id', 'statement_month'],
					fields: ['*'],
				}),
				cashFlowProjectionsCollection.list({
					filter: { fiscal_year: { _eq: year } },
					sort: ['account_id', 'month'],
					fields: ['*'],
				}),
				fiscalYearBudgetsCollection.list({
					filter: { fiscal_year: { _in: [year - 2, year - 1, year, year + 1] } },
					fields: ['*'],
				}),
			]);

			transactions.value = txData || [];
			budgetCategories.value = catData || [];
			accounts.value = accData || [];
			monthlyStatements.value = stmtData || [];
			cashFlowProjections.value = projData || [];
			fiscalYearBudgets.value = budgetData || [];
		} catch (e) {
			error.value = e.message || 'Error fetching dashboard data';
			console.error('Error fetching dashboard data:', e);
		} finally {
			loading.value = false;
		}
	};

	// Helper: Safe parse float
	const safeParseFloat = (value) => {
		if (value === null || value === undefined || value === '') return 0;
		const parsed = parseFloat(value);
		return isNaN(parsed) ? 0 : parsed;
	};

	// Helper: Format currency
	const formatCurrency = (amount) => {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
		}).format(safeParseFloat(amount));
	};

	// ============================================
	// VARIANCE ANALYSIS
	// ============================================

	// Calculate variance for a category
	const calculateCategoryVariance = (category, accountTransactions, monthCount = 12) => {
		const categoryTransactions = accountTransactions.filter(
			(t) => t.category_id === category.id && t.transaction_type === 'withdrawal'
		);

		const actual = categoryTransactions.reduce((sum, t) => sum + safeParseFloat(t.amount), 0);
		const monthlyBudget = safeParseFloat(category.monthly_budget);
		const budget = monthlyBudget * monthCount;
		const variance = actual - budget;
		const percentVariance = budget > 0 ? (variance / budget) * 100 : 0;

		return {
			category: category.category_name,
			categoryId: category.id,
			color: category.color,
			actual,
			budget,
			monthlyBudget,
			variance,
			percentVariance: Math.round(percentVariance * 10) / 10,
			status: variance > 0 ? 'over' : variance < 0 ? 'under' : 'on_target',
			transactionCount: categoryTransactions.length,
		};
	};

	// Variance analysis by category
	const varianceAnalysis = computed(() => {
		const accountId = unref(selectedAccount);
		const accountTransactions = transactions.value.filter((t) => t.account_id === accountId);

		// Determine months with data
		const monthsWithData = new Set(
			accountTransactions.map((t) => t.statement_month).filter((m) => m)
		);
		const monthCount = monthsWithData.size || 1;

		return budgetCategories.value
			.map((cat) => calculateCategoryVariance(cat, accountTransactions, monthCount))
			.sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance));
	});

	// Variance summary
	const varianceSummary = computed(() => {
		const analysis = varianceAnalysis.value;

		const totalBudget = analysis.reduce((sum, a) => sum + a.budget, 0);
		const totalActual = analysis.reduce((sum, a) => sum + a.actual, 0);
		const totalVariance = totalActual - totalBudget;

		const overBudgetItems = analysis.filter((a) => a.variance > 0);
		const underBudgetItems = analysis.filter((a) => a.variance < 0);

		return {
			totalBudget,
			totalActual,
			totalVariance,
			percentVariance: totalBudget > 0 ? Math.round((totalVariance / totalBudget) * 1000) / 10 : 0,
			overBudgetCount: overBudgetItems.length,
			overBudgetAmount: overBudgetItems.reduce((sum, a) => sum + a.variance, 0),
			underBudgetCount: underBudgetItems.length,
			underBudgetSavings: Math.abs(underBudgetItems.reduce((sum, a) => sum + a.variance, 0)),
			status: totalVariance > totalBudget * 0.1 ? 'critical' : totalVariance > 0 ? 'warning' : 'good',
		};
	});

	// ============================================
	// CASH FLOW FORECASTING
	// ============================================

	// Generate cash flow projections
	const generateCashFlowProjections = (accountId, months = 12) => {
		const accountTransactions = transactions.value.filter((t) => t.account_id === accountId);
		const accountStatements = monthlyStatements.value.filter((s) => s.account_id === accountId);

		// Calculate average monthly income and expenses
		const monthlyData = {};

		for (const t of accountTransactions) {
			const month = t.statement_month;
			if (!month) continue;

			if (!monthlyData[month]) {
				monthlyData[month] = { income: 0, expenses: 0 };
			}

			if (t.transaction_type === 'deposit' || t.transaction_type === 'transfer_in') {
				monthlyData[month].income += safeParseFloat(t.amount);
			} else if (t.transaction_type === 'withdrawal' || t.transaction_type === 'transfer_out' || t.transaction_type === 'fee') {
				monthlyData[month].expenses += safeParseFloat(t.amount);
			}
		}

		const monthValues = Object.values(monthlyData);
		const avgIncome = monthValues.length > 0
			? monthValues.reduce((sum, m) => sum + m.income, 0) / monthValues.length
			: 0;
		const avgExpenses = monthValues.length > 0
			? monthValues.reduce((sum, m) => sum + m.expenses, 0) / monthValues.length
			: 0;

		// Get latest balance
		const sortedStatements = [...accountStatements].sort((a, b) =>
			(b.statement_month || '').localeCompare(a.statement_month || '')
		);
		const latestStatement = sortedStatements[0];
		let runningBalance = safeParseFloat(latestStatement?.ending_balance) || 0;

		// Generate projections
		const projections = [];
		const currentMonth = parseInt(latestStatement?.statement_month || '01');
		const currentYear = unref(selectedYear);

		for (let i = 1; i <= months; i++) {
			let month = currentMonth + i;
			let year = currentYear;

			if (month > 12) {
				month = month - 12;
				year = year + 1;
			}

			const monthStr = String(month).padStart(2, '0');
			const beginningBalance = runningBalance;
			const projectedIncome = avgIncome;
			const projectedExpenses = avgExpenses;
			const endingBalance = beginningBalance + projectedIncome - projectedExpenses;

			projections.push({
				year,
				month: monthStr,
				monthLabel: getMonthName(monthStr),
				beginningBalance,
				projectedIncome,
				projectedExpenses,
				netCashFlow: projectedIncome - projectedExpenses,
				endingBalance,
				isProjected: true,
			});

			runningBalance = endingBalance;
		}

		return projections;
	};

	// Cash flow summary
	const cashFlowSummary = computed(() => {
		const accountId = unref(selectedAccount);
		const projections = generateCashFlowProjections(accountId, 6);

		if (projections.length === 0) {
			return {
				currentBalance: 0,
				projectedBalance6Mo: 0,
				avgMonthlyIncome: 0,
				avgMonthlyExpenses: 0,
				avgNetCashFlow: 0,
				monthsUntilNegative: null,
			};
		}

		const currentBalance = projections[0]?.beginningBalance || 0;
		const projectedBalance6Mo = projections[projections.length - 1]?.endingBalance || 0;
		const avgIncome = projections.reduce((sum, p) => sum + p.projectedIncome, 0) / projections.length;
		const avgExpenses = projections.reduce((sum, p) => sum + p.projectedExpenses, 0) / projections.length;
		const avgNet = avgIncome - avgExpenses;

		// Find when balance goes negative
		let monthsUntilNegative = null;
		if (avgNet < 0) {
			for (let i = 0; i < projections.length; i++) {
				if (projections[i].endingBalance < 0) {
					monthsUntilNegative = i + 1;
					break;
				}
			}
		}

		return {
			currentBalance,
			projectedBalance6Mo,
			avgMonthlyIncome: avgIncome,
			avgMonthlyExpenses: avgExpenses,
			avgNetCashFlow: avgNet,
			monthsUntilNegative,
			trend: avgNet > 0 ? 'positive' : avgNet < 0 ? 'negative' : 'stable',
		};
	});

	// ============================================
	// MULTI-YEAR BUDGET COMPARISON
	// ============================================

	// Fetch multi-year budget data
	const fetchMultiYearBudgets = async (years) => {
		try {
			const [budgets, categories] = await Promise.all([
				fiscalYearBudgetsCollection.list({
					filter: { fiscal_year: { _in: years } },
					fields: ['*'],
				}),
				budgetCategoriesCollection.list({
					filter: { fiscal_year: { _in: years } },
					fields: ['*'],
				}),
			]);

			return { budgets: budgets || [], categories: categories || [] };
		} catch (e) {
			console.error('Error fetching multi-year budgets:', e);
			return { budgets: [], categories: [] };
		}
	};

	// Multi-year comparison
	const multiYearComparison = computed(() => {
		const currentYear = unref(selectedYear);
		const years = [currentYear - 2, currentYear - 1, currentYear];

		// Group categories by year
		const categoryByYear = {};
		for (const cat of budgetCategories.value) {
			if (!categoryByYear[cat.fiscal_year]) {
				categoryByYear[cat.fiscal_year] = [];
			}
			categoryByYear[cat.fiscal_year].push(cat);
		}

		// Find all unique category names
		const allCategoryNames = new Set();
		Object.values(categoryByYear).forEach((cats) => {
			cats.forEach((c) => allCategoryNames.add(c.category_name));
		});

		// Build comparison data
		const comparison = [];
		for (const categoryName of allCategoryNames) {
			const row = { category: categoryName };

			for (const year of years) {
				const yearCats = categoryByYear[year] || [];
				const cat = yearCats.find((c) => c.category_name === categoryName);
				row[`year_${year}`] = cat ? safeParseFloat(cat.yearly_budget) : 0;
			}

			// Calculate year-over-year change
			const prevYear = row[`year_${years[1]}`] || 0;
			const currYear = row[`year_${years[2]}`] || 0;
			row.yoyChange = currYear - prevYear;
			row.yoyPercent = prevYear > 0 ? Math.round(((currYear - prevYear) / prevYear) * 1000) / 10 : 0;

			comparison.push(row);
		}

		// Add totals row
		const totals = { category: 'TOTAL' };
		for (const year of years) {
			totals[`year_${year}`] = comparison.reduce((sum, r) => sum + (r[`year_${year}`] || 0), 0);
		}
		totals.yoyChange = (totals[`year_${years[2]}`] || 0) - (totals[`year_${years[1]}`] || 0);
		totals.yoyPercent = totals[`year_${years[1]}`] > 0
			? Math.round((totals.yoyChange / totals[`year_${years[1]}`]) * 1000) / 10
			: 0;

		return {
			years,
			categories: comparison.sort((a, b) => (b[`year_${years[2]}`] || 0) - (a[`year_${years[2]}`] || 0)),
			totals,
		};
	});

	// Budget trend analysis
	const budgetTrendAnalysis = computed(() => {
		const comparison = multiYearComparison.value;

		const increasingCategories = comparison.categories.filter((c) => c.yoyPercent > 5);
		const decreasingCategories = comparison.categories.filter((c) => c.yoyPercent < -5);
		const stableCategories = comparison.categories.filter(
			(c) => c.yoyPercent >= -5 && c.yoyPercent <= 5
		);

		return {
			increasing: increasingCategories,
			decreasing: decreasingCategories,
			stable: stableCategories,
			overallTrend: comparison.totals.yoyPercent > 5 ? 'increasing' :
				comparison.totals.yoyPercent < -5 ? 'decreasing' : 'stable',
			totalChange: comparison.totals.yoyChange,
			totalChangePercent: comparison.totals.yoyPercent,
		};
	});

	// ============================================
	// ACCOUNT METRICS
	// ============================================

	// Account balances and metrics
	const accountMetrics = computed(() => {
		return accounts.value.map((account) => {
			const accountStatements = monthlyStatements.value.filter((s) => s.account_id === account.id);
			const sortedStatements = [...accountStatements].sort((a, b) =>
				(b.statement_month || '').localeCompare(a.statement_month || '')
			);

			const latestStatement = sortedStatements[0];
			const previousStatement = sortedStatements[1];

			const currentBalance = safeParseFloat(latestStatement?.ending_balance);
			const previousBalance = safeParseFloat(previousStatement?.ending_balance);
			const change = currentBalance - previousBalance;
			const changePercent = previousBalance !== 0 ? (change / previousBalance) * 100 : 0;

			const accountTransactions = transactions.value.filter((t) => t.account_id === account.id);
			const ytdDeposits = accountTransactions
				.filter((t) => t.transaction_type === 'deposit')
				.reduce((sum, t) => sum + safeParseFloat(t.amount), 0);
			const ytdWithdrawals = accountTransactions
				.filter((t) => t.transaction_type === 'withdrawal')
				.reduce((sum, t) => sum + safeParseFloat(t.amount), 0);

			return {
				...account,
				currentBalance,
				previousBalance,
				change,
				changePercent: Math.round(changePercent * 10) / 10,
				ytdDeposits,
				ytdWithdrawals,
				ytdNet: ytdDeposits - ytdWithdrawals,
				latestMonth: latestStatement?.statement_month,
			};
		});
	});

	// Overall financial health score
	const financialHealthScore = computed(() => {
		const variance = varianceSummary.value;
		const cashFlow = cashFlowSummary.value;
		const metrics = accountMetrics.value;

		let score = 100;
		const issues = [];

		// Budget variance impact (up to -30 points)
		if (variance.percentVariance > 20) {
			score -= 30;
			issues.push('Significant budget overage');
		} else if (variance.percentVariance > 10) {
			score -= 15;
			issues.push('Budget overage warning');
		} else if (variance.percentVariance > 0) {
			score -= 5;
		}

		// Cash flow impact (up to -30 points)
		if (cashFlow.monthsUntilNegative && cashFlow.monthsUntilNegative <= 3) {
			score -= 30;
			issues.push('Critical: Account may go negative within 3 months');
		} else if (cashFlow.avgNetCashFlow < 0) {
			score -= 15;
			issues.push('Negative monthly cash flow');
		}

		// Reserve fund impact (up to -20 points)
		const reserveAccount = metrics.find((a) => a.id === 2);
		if (reserveAccount) {
			if (reserveAccount.currentBalance < 10000) {
				score -= 20;
				issues.push('Reserve fund critically low');
			} else if (reserveAccount.currentBalance < 50000) {
				score -= 10;
				issues.push('Reserve fund below recommended level');
			}
		}

		// Trend impact (up to -20 points)
		const trend = budgetTrendAnalysis.value;
		if (trend.totalChangePercent > 15) {
			score -= 10;
			issues.push('Budget increasing significantly year-over-year');
		}

		return {
			score: Math.max(0, score),
			grade: score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F',
			status: score >= 80 ? 'healthy' : score >= 60 ? 'caution' : 'critical',
			issues,
		};
	});

	// Helper: Get month name
	const getMonthName = (monthValue) => {
		const monthNames = {
			'01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr',
			'05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Aug',
			'09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec',
		};
		return monthNames[monthValue] || monthValue;
	};

	// Watch for filter changes
	watch([selectedYear, selectedAccount], () => {
		fetchDashboardData();
	});

	return {
		// State
		loading,
		error,
		selectedYear,
		selectedAccount,

		// Data
		transactions: readonly(transactions),
		budgetCategories: readonly(budgetCategories),
		accounts: readonly(accounts),
		monthlyStatements: readonly(monthlyStatements),

		// Fetch
		fetchDashboardData,
		fetchMultiYearBudgets,

		// Variance Analysis
		varianceAnalysis,
		varianceSummary,

		// Cash Flow
		generateCashFlowProjections,
		cashFlowSummary,

		// Multi-Year Comparison
		multiYearComparison,
		budgetTrendAnalysis,

		// Metrics
		accountMetrics,
		financialHealthScore,

		// Helpers
		formatCurrency,
		getMonthName,
		safeParseFloat,
	};
};
