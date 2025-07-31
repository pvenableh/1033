import { ref, computed } from 'vue';

/**
 * Composable for managing operating budget data
 * Handles CSV parsing, data processing, and budget analysis
 */
export const useBudgetData = () => {
	// Reactive state
	const budgetItems = ref([]);
	const loading = ref(false);
	const error = ref(null);
	const lastUpdated = ref(null);

	/**
	 * Parse currency string to number
	 */
	const parseCurrency = (value) => {
		if (!value || value === '$0.00' || value === '$0') return 0;
		return parseFloat(value.toString().replace(/[$,]/g, '')) || 0;
	};

	/**
	 * Parse CSV budget data
	 */
	const parseBudgetCSV = async (csvContent) => {
		try {
			loading.value = true;
			error.value = null;

			// Parse CSV using Papa Parse (import in component)
			const Papa = await import('papaparse');

			// Skip first line which contains title
			const lines = csvContent.split('\n');
			const cleanData = Papa.default.parse(lines.slice(1).join('\n'), {
				header: true,
				dynamicTyping: false,
				skipEmptyLines: true,
			});

			// Process and clean the data
			const processedItems = cleanData.data
				.filter((row) => row.Description && row.Description !== 'Description' && row.Description.trim() !== '')
				.map((row) => ({
					id: `${row.Description}-${row.Classification}`.replace(/[^\w-]/g, ''),
					description: row.Description,
					category: row.Classification || 'Other',
					paymentSchedule: row['Payment Schedule'],
					monthly: parseCurrency(row.MONTHLY),
					quarterly: parseCurrency(row.QUARTERLY),
					yearly: parseCurrency(row.YEARLY),
					actualCost: parseCurrency(row['ACTUAL Cost so far']),
					remaining: parseCurrency(row['Left in the Budget']),
					previousYear: parseCurrency(row['2024 amount']),
					variance: parseCurrency(row['2025 Actual Cost vs 2024']),
					comment: row.Comment,
					percentSpent: 0,
					status: 'unknown',
				}))
				.filter((item) => item.yearly > 0) // Only include items with budget
				.map((item) => ({
					...item,
					percentSpent: (item.actualCost / item.yearly) * 100,
					status: getItemStatus(item),
				}));

			budgetItems.value = processedItems;
			lastUpdated.value = new Date();
			loading.value = false;

			return processedItems;
		} catch (err) {
			error.value = err.message;
			loading.value = false;
			throw err;
		}
	};

	/**
	 * Determine item status based on spending
	 */
	const getItemStatus = (item) => {
		const percentage = (item.actualCost / item.yearly) * 100;
		if (percentage > 100) return 'over-budget';
		if (percentage > 90) return 'critical';
		if (percentage > 80) return 'at-risk';
		if (percentage < 25) return 'under-utilized';
		return 'on-track';
	};

	/**
	 * Group budget items by category
	 */
	const categorizedBudget = computed(() => {
		const categories = {};

		budgetItems.value.forEach((item) => {
			const category = item.category || 'Other';

			if (!categories[category]) {
				categories[category] = {
					name: category,
					items: [],
					totalYearly: 0,
					totalActual: 0,
					totalRemaining: 0,
					count: 0,
					percentSpent: 0,
				};
			}

			categories[category].items.push(item);
			categories[category].totalYearly += item.yearly;
			categories[category].totalActual += item.actualCost;
			categories[category].totalRemaining += item.remaining;
			categories[category].count++;
		});

		// Calculate percentages and sort items
		Object.values(categories).forEach((category) => {
			category.percentSpent = (category.totalActual / category.totalYearly) * 100;
			category.items.sort((a, b) => b.yearly - a.yearly);
			category.status = getCategoryStatus(category);
		});

		return categories;
	});

	/**
	 * Get category status
	 */
	const getCategoryStatus = (category) => {
		if (category.percentSpent > 100) return 'over-budget';
		if (category.percentSpent > 90) return 'critical';
		if (category.percentSpent > 80) return 'at-risk';
		if (category.percentSpent < 50) return 'under-utilized';
		return 'on-track';
	};

	/**
	 * Budget summary statistics
	 */
	const budgetSummary = computed(() => {
		const total = budgetItems.value.reduce(
			(acc, item) => ({
				budget: acc.budget + item.yearly,
				actual: acc.actual + item.actualCost,
				remaining: acc.remaining + item.remaining,
			}),
			{ budget: 0, actual: 0, remaining: 0 },
		);

		return {
			...total,
			percentSpent: (total.actual / total.budget) * 100,
			itemCount: budgetItems.value.length,
			categoryCount: Object.keys(categorizedBudget.value).length,
		};
	});

	/**
	 * Critical items needing attention
	 */
	const criticalItems = computed(() => {
		return budgetItems.value
			.filter((item) => item.status === 'over-budget' || item.status === 'critical')
			.sort((a, b) => b.percentSpent - a.percentSpent);
	});

	/**
	 * Over budget items
	 */
	const overBudgetItems = computed(() => {
		return budgetItems.value
			.filter((item) => item.actualCost > item.yearly)
			.map((item) => ({
				...item,
				overAmount: item.actualCost - item.yearly,
				percentOver: ((item.actualCost - item.yearly) / item.yearly) * 100,
			}))
			.sort((a, b) => b.percentOver - a.percentOver);
	});

	/**
	 * At-risk items (80-100% spent)
	 */
	const atRiskItems = computed(() => {
		return budgetItems.value
			.filter((item) => item.percentSpent > 80 && item.percentSpent <= 100)
			.sort((a, b) => b.percentSpent - a.percentSpent);
	});

	/**
	 * Under-utilized items (less than 25% spent)
	 */
	const underUtilizedItems = computed(() => {
		return budgetItems.value.filter((item) => item.percentSpent < 25).sort((a, b) => a.percentSpent - b.percentSpent);
	});

	/**
	 * Generate year-end projections
	 */
	const generateProjections = (currentMonth = 6) => {
		const remainingMonths = 12 - currentMonth;

		return budgetItems.value.map((item) => {
			// Simple linear projection based on current spending
			const monthlyBurn = item.actualCost / currentMonth;
			const projectedTotal = item.actualCost + monthlyBurn * remainingMonths;

			return {
				...item,
				projectedTotal,
				projectedVariance: item.yearly - projectedTotal,
				projectedPercentSpent: (projectedTotal / item.yearly) * 100,
			};
		});
	};

	/**
	 * Get budget alerts
	 */
	const budgetAlerts = computed(() => {
		const alerts = [];

		// Over budget alerts
		overBudgetItems.value.slice(0, 5).forEach((item) => {
			alerts.push({
				type: 'over-budget',
				severity: 'critical',
				title: `${item.description} Over Budget`,
				message: `${item.percentOver.toFixed(1)}% over budget ($${item.overAmount.toLocaleString()} excess)`,
				item: item,
			});
		});

		// Critical spending alerts
		atRiskItems.value.slice(0, 3).forEach((item) => {
			alerts.push({
				type: 'at-risk',
				severity: 'warning',
				title: `${item.description} At Risk`,
				message: `${item.percentSpent.toFixed(1)}% of budget spent`,
				item: item,
			});
		});

		// Category-level alerts
		Object.values(categorizedBudget.value).forEach((category) => {
			if (category.percentSpent > 100) {
				alerts.push({
					type: 'category-over',
					severity: 'critical',
					title: `${category.name} Category Over Budget`,
					message: `${category.percentSpent.toFixed(1)}% of category budget spent`,
					category: category,
				});
			}
		});

		return alerts.sort((a, b) => {
			const severityOrder = { critical: 3, warning: 2, info: 1 };
			return severityOrder[b.severity] - severityOrder[a.severity];
		});
	});

	/**
	 * Search budget items
	 */
	const searchItems = (query) => {
		if (!query) return budgetItems.value;

		const searchTerm = query.toLowerCase();
		return budgetItems.value.filter(
			(item) =>
				item.description.toLowerCase().includes(searchTerm) ||
				item.category.toLowerCase().includes(searchTerm) ||
				(item.comment && item.comment.toLowerCase().includes(searchTerm)),
		);
	};

	/**
	 * Filter items by status
	 */
	const filterByStatus = (status) => {
		return budgetItems.value.filter((item) => item.status === status);
	};

	/**
	 * Get items by category
	 */
	const getItemsByCategory = (categoryName) => {
		return budgetItems.value.filter((item) => item.category === categoryName);
	};

	/**
	 * Export budget data
	 */
	const exportBudgetData = (format = 'json') => {
		const data = {
			summary: budgetSummary.value,
			categories: categorizedBudget.value,
			items: budgetItems.value,
			alerts: budgetAlerts.value,
			generated: new Date().toISOString(),
		};

		if (format === 'json') {
			return JSON.stringify(data, null, 2);
		}

		if (format === 'csv') {
			// Convert to CSV format
			const headers = [
				'Description',
				'Category',
				'Budget',
				'Actual',
				'Remaining',
				'Percent Spent',
				'Status',
				'Comments',
			];

			const rows = budgetItems.value.map((item) => [
				item.description,
				item.category,
				item.yearly,
				item.actualCost,
				item.remaining,
				item.percentSpent.toFixed(1) + '%',
				item.status,
				item.comment || '',
			]);

			return [headers, ...rows].map((row) => row.join(',')).join('\n');
		}

		return data;
	};

	/**
	 * Load budget data from file
	 */
	const loadBudgetFromFile = async (file) => {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();

			reader.onload = async (event) => {
				try {
					const csvContent = event.target.result;
					const data = await parseBudgetCSV(csvContent);
					resolve(data);
				} catch (error) {
					reject(error);
				}
			};

			reader.onerror = () => reject(new Error('Failed to read file'));
			reader.readAsText(file);
		});
	};

	/**
	 * Initialize with sample data (for development)
	 */
	const initializeSampleData = () => {
		// This would be replaced with actual CSV loading in production
		const sampleData = `Description,Classification,Payment Schedule,MONTHLY,QUARTERLY,YEARLY,ACTUAL Cost so far,Left in the Budget,2024 amount,2025 Actual Cost vs 2024,Comment
Legal Fees,Administrative,As Needed,$500.00,$1,500.00,$6,000.00,$17,600.00,$-11,600.00,$5,000.00,$12,600.00,Critical overage - immediate review required
Building Insurance,Insurance,Annual,$6,354.17,$19,062.50,$76,250.00,$58,083.90,$18,166.10,$72,000.00,$-13,916.10,Major annual expense
Management Fees - VTE,Contract Services,Monthly,$700.00,$2,100.00,$8,400.00,$5,600.00,$2,800.00,$8,400.00,$-2,800.00,Monthly management fees`;

		parseBudgetCSV(sampleData);
	};

	return {
		// State
		budgetItems,
		loading,
		error,
		lastUpdated,

		// Computed
		categorizedBudget,
		budgetSummary,
		criticalItems,
		overBudgetItems,
		atRiskItems,
		underUtilizedItems,
		budgetAlerts,

		// Methods
		parseBudgetCSV,
		generateProjections,
		searchItems,
		filterByStatus,
		getItemsByCategory,
		exportBudgetData,
		loadBudgetFromFile,
		initializeSampleData,

		// Utilities
		parseCurrency,
		getItemStatus,
		getCategoryStatus,
	};
};
