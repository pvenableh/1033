// composables/useIntegratedFinancialData.js
import { ref, computed } from 'vue';
import { useReconciliationData } from '~/composables/useReconciliationData';

/**
 * Integrated financial data composable that combines budget data from CSV assets
 * with actual transaction data from reconciliation
 */
export const useIntegratedFinancialData = () => {
	// Use both existing composables
	const reconciliationData = useReconciliationData();
	const budgetData = useBudgetData();

	// Destructure the loadOperatingBudget function from budgetData
	const { loadOperatingBudget } = budgetData;

	const currentMonth = ref('June 2025');

	/**
	 * Find matching transactions for a budget category
	 */
	const findMatchingTransactions = (transactions, categoryName) => {
		if (!transactions || !Array.isArray(transactions)) return [];

		// Simple matching logic - can be enhanced based on your needs
		const matchingKeywords = categoryName.toLowerCase().split(' ');

		return transactions.filter((transaction) => {
			const description = (transaction.description || transaction.vendor || '').toLowerCase();
			return matchingKeywords.some((keyword) => description.includes(keyword));
		});
	};

	/**
	 * Generate integrated alerts combining budget and reconciliation data
	 */
	const generateIntegratedAlerts = (operatingData, budgetSummary, violations) => {
		const alerts = [];

		// Budget utilization alerts
		if (budgetSummary.percentSpent > 85) {
			alerts.push({
				type: 'budget',
				severity: 'critical',
				title: 'High Budget Utilization',
				message: `${budgetSummary.percentSpent.toFixed(1)}% of annual budget spent YTD`,
				action: 'Review spending patterns and implement controls',
			});
		}

		// Cash flow alerts
		if (operatingData?.endingBalance < 25000) {
			alerts.push({
				type: 'cashflow',
				severity: 'critical',
				title: 'Critical Cash Flow',
				message: `Operating balance at $${operatingData.endingBalance.toLocaleString()}`,
				action: 'Emergency cash flow planning required',
			});
		}

		// Violation alerts
		if (violations > 0) {
			alerts.push({
				type: 'compliance',
				severity: 'critical',
				title: 'Fund Segregation Violations',
				message: `${violations} violations detected this month`,
				action: 'Implement proper fund segregation procedures',
			});
		}

		// Over-budget items
		const overBudgetCount = budgetData.overBudgetItems.value.length;
		if (overBudgetCount > 0) {
			alerts.push({
				type: 'budget',
				severity: 'high',
				title: 'Items Over Budget',
				message: `${overBudgetCount} budget items exceeded allocated amounts`,
				action: 'Review and address over-budget items',
			});
		}

		return alerts.sort((a, b) => {
			const severityOrder = { critical: 3, high: 2, medium: 1, low: 0 };
			return severityOrder[b.severity] - severityOrder[a.severity];
		});
	};

	/**
	 * Get comprehensive financial overview
	 */
	const getComprehensiveOverview = (month = currentMonth.value) => {
		const operatingData = reconciliationData.getOperatingData(month);
		const reserveData = reconciliationData.getReserveData(month);
		const violations = reconciliationData.getViolationCount(month);

		return {
			operating: operatingData,
			reserve: reserveData,
			budget: {
				summary: budgetData.budgetSummary.value,
				items: budgetData.budgetItems.value,
				categories: budgetData.categorizedBudget.value,
			},
			violations,
			alerts: generateIntegratedAlerts(operatingData, budgetData.budgetSummary.value, violations),
		};
	};

	/**
	 * Map budget categories to actual transactions
	 */
	const mapBudgetToActual = (month = currentMonth.value) => {
		const operatingData = reconciliationData.getOperatingData(month);
		const categories = budgetData.categorizedBudget.value;

		if (!operatingData || !categories) return [];

		return Object.values(categories).map((category) => {
			// Find matching transactions for this category
			const matchingTransactions = findMatchingTransactions(operatingData.withdrawals || [], category.name);

			const actualSpentThisMonth = matchingTransactions.reduce((sum, txn) => sum + txn.amount, 0);
			const monthlyBudget = category.totalYearly / 12;
			const variance = monthlyBudget - actualSpentThisMonth;

			return {
				...category,
				monthlyData: {
					budget: monthlyBudget,
					actual: actualSpentThisMonth,
					variance,
					variancePercent: monthlyBudget ? (variance / monthlyBudget) * 100 : 0,
				},
				transactions: matchingTransactions,
			};
		});
	};

	/**
	 * Calculate financial health score
	 */
	const getFinancialHealthScore = (month = currentMonth.value) => {
		const operatingData = reconciliationData.getOperatingData(month);
		const budgetSummary = budgetData.budgetSummary.value;
		const violations = reconciliationData.getViolationCount(month);

		let score = 100;

		// Operating balance health (30 points)
		if (operatingData?.endingBalance < 25000) score -= 30;
		else if (operatingData?.endingBalance < 40000) score -= 15;

		// Budget compliance (25 points)
		if (budgetSummary.percentSpent > 100) score -= 25;
		else if (budgetSummary.percentSpent > 85) score -= 15;
		else if (budgetSummary.percentSpent > 75) score -= 5;

		// Violations (25 points)
		score -= Math.min(violations * 5, 25);

		// Over-budget items (20 points)
		const overBudgetCount = budgetData.overBudgetItems.value.length;
		score -= Math.min(overBudgetCount * 2, 20);

		return {
			score: Math.max(score, 0),
			grade: getGradeFromScore(score),
			factors: {
				operatingBalance: operatingData?.endingBalance || 0,
				budgetUtilization: budgetSummary.percentSpent,
				violations,
				overBudgetItems: overBudgetCount,
			},
		};
	};

	/**
	 * Get grade from numeric score
	 */
	const getGradeFromScore = (score) => {
		if (score >= 90) return { letter: 'A', color: 'green', status: 'Excellent' };
		if (score >= 80) return { letter: 'B', color: 'blue', status: 'Good' };
		if (score >= 70) return { letter: 'C', color: 'yellow', status: 'Fair' };
		if (score >= 60) return { letter: 'D', color: 'orange', status: 'Poor' };
		return { letter: 'F', color: 'red', status: 'Critical' };
	};

	/**
	 * Get spending velocity (rate of spending vs budget)
	 */
	const getSpendingVelocity = () => {
		const summary = budgetData.budgetSummary.value;
		const monthsElapsed = 6; // Assuming June = 6 months
		const expectedSpentPercent = (monthsElapsed / 12) * 100;
		const actualSpentPercent = summary.percentSpent;

		return {
			expected: expectedSpentPercent,
			actual: actualSpentPercent,
			velocity: actualSpentPercent / expectedSpentPercent,
			status:
				actualSpentPercent > expectedSpentPercent * 1.1
					? 'fast'
					: actualSpentPercent < expectedSpentPercent * 0.9
						? 'slow'
						: 'normal',
		};
	};

	/**
	 * Get cash runway (months of operation remaining)
	 */
	const getCashRunway = (month = currentMonth.value) => {
		const operatingData = reconciliationData.getOperatingData(month);
		const monthlyExpenses = budgetData.budgetSummary.value.actual / 6; // Average monthly

		if (!operatingData || monthlyExpenses === 0) return null;

		return {
			months: operatingData.endingBalance / monthlyExpenses,
			monthlyBurn: monthlyExpenses,
			currentBalance: operatingData.endingBalance,
			status:
				operatingData.endingBalance / monthlyExpenses < 6
					? 'critical'
					: operatingData.endingBalance / monthlyExpenses < 12
						? 'warning'
						: 'healthy',
		};
	};

	/**
	 * Generate month-over-month comparison
	 */
	const getMonthOverMonthComparison = (currentMonth, previousMonth) => {
		const current = reconciliationData.getOperatingData(currentMonth);
		const previous = reconciliationData.getOperatingData(previousMonth);

		if (!current || !previous) return null;

		const currentTotals = reconciliationData.calculateTotals(current);
		const previousTotals = reconciliationData.calculateTotals(previous);

		return {
			balance: {
				current: current.endingBalance,
				previous: previous.endingBalance,
				change: current.endingBalance - previous.endingBalance,
				changePercent: ((current.endingBalance - previous.endingBalance) / previous.endingBalance) * 100,
			},
			deposits: {
				current: currentTotals.totalDeposits,
				previous: previousTotals.totalDeposits,
				change: currentTotals.totalDeposits - previousTotals.totalDeposits,
			},
			withdrawals: {
				current: currentTotals.totalWithdrawals,
				previous: previousTotals.totalWithdrawals,
				change: currentTotals.totalWithdrawals - previousTotals.totalWithdrawals,
			},
		};
	};

	/**
	 * Load all data sources
	 */
	const loadAllData = async () => {
		try {
			// Call the loadOperatingBudget function directly (not as budgetData.loadOperatingBudget)
			await loadOperatingBudget();
			return true;
		} catch (error) {
			console.error('Error loading integrated financial data:', error);
			return false;
		}
	};

	return {
		// State
		currentMonth,

		// Combined data access
		getComprehensiveOverview,
		mapBudgetToActual,
		getFinancialHealthScore,
		getSpendingVelocity,
		getCashRunway,
		getMonthOverMonthComparison,

		// Utility functions
		findMatchingTransactions,
		generateIntegratedAlerts,
		loadAllData,

		// Re-export from sub-composables for convenience
		...reconciliationData,
		...budgetData,
	};
};
