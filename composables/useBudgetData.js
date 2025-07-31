import { ref, computed } from 'vue';

// Direct imports of CSV files from assets
import operatingBudgetCsv from '~/assets/data/2025-Operating-Budget.csv?raw';
import proposedBudgetCsv from '~/assets/data/2025-Proposed-Budget.csv?raw';

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
	 * Load operating budget from imported CSV files
	 * Uses the CSV content imported at build time
	 */
	const loadOperatingBudget = async () => {
		try {
			loading.value = true;
			error.value = null;

			// Use the imported CSV content - prioritize operating budget over proposed
			let csvContent = operatingBudgetCsv;

			// If operating budget is empty or not available, use proposed budget
			if (!csvContent || csvContent.trim().length === 0) {
				csvContent = proposedBudgetCsv;
			}

			if (!csvContent || csvContent.trim().length === 0) {
				throw new Error('No budget CSV content found. Please check that your CSV files in assets/data are not empty.');
			}

			// Parse the CSV content
			await parseBudgetCSV(csvContent);

			console.log(`Successfully loaded ${budgetItems.value.length} budget items from imported CSV`);
			return true;
		} catch (err) {
			error.value = err.message;
			console.error('Error loading operating budget:', err);
			throw err;
		} finally {
			loading.value = false;
		}
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
				transformHeader: (header, index) => {
					// Clean up headers and handle duplicates/empty ones
					const cleanHeader = header.trim();
					if (!cleanHeader || cleanHeader === '') {
						return `empty_${index}`; // Give empty headers unique names
					}
					return cleanHeader;
				},
				transform: (value, header) => {
					// Only process the columns we actually need
					const relevantColumns = [
						'Description',
						'Classification',
						'Payment Schedule',
						'MONTHLY',
						'QUARTERLY',
						'YEARLY',
						'ACTUAL Cost so far',
						'Left in the Budget',
						'2024 amount',
						'2025 Actual Cost vs 2024',
						'Comment',
					];

					// Return null for irrelevant columns to exclude them
					if (!relevantColumns.includes(header)) {
						return null;
					}

					return value;
				},
			});

			// Process and clean the data - only use the columns we need
			const processedItems = cleanData.data
				.filter((row) => {
					// Filter out rows that don't have a description or are header rows
					return (
						row.Description &&
						row.Description !== 'Description' &&
						row.Description.trim() !== '' &&
						row.Description.trim().length > 2
					); // Avoid single character entries
				})
				.map((row) => {
					// Create clean object with only the fields we need
					const cleanRow = {
						id: `${row.Description}-${row.Classification || 'unknown'}`.replace(/[^\w-]/g, ''),
						description: row.Description?.trim() || '',
						category: row.Classification?.trim() || 'Other',
						paymentSchedule: row['Payment Schedule']?.trim() || '',
						monthly: parseCurrency(row.MONTHLY),
						quarterly: parseCurrency(row.QUARTERLY),
						yearly: parseCurrency(row.YEARLY),
						actualCost: parseCurrency(row['ACTUAL Cost so far']),
						remaining: parseCurrency(row['Left in the Budget']),
						previousYear: parseCurrency(row['2024 amount']),
						variance: parseCurrency(row['2025 Actual Cost vs 2024']),
						comment: row.Comment?.trim() || '',
						percentSpent: 0,
						status: 'unknown',
					};

					// Calculate percent spent
					cleanRow.percentSpent = cleanRow.yearly > 0 ? (cleanRow.actualCost / cleanRow.yearly) * 100 : 0;
					cleanRow.status = getItemStatus(cleanRow);

					return cleanRow;
				})
				.filter((item) => item.yearly > 0); // Only include items with budget

			budgetItems.value = processedItems;
			lastUpdated.value = new Date();
			loading.value = false;

			console.log(`Processed ${processedItems.length} budget items successfully`);
			return processedItems;
		} catch (err) {
			error.value = err.message;
			loading.value = false;
			console.error('CSV parsing error:', err);
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
			percentSpent: total.budget ? (total.actual / total.budget) * 100 : 0,
		};
	});

	/**
	 * Get critical items (over 90% spent or over budget)
	 */
	const criticalItems = computed(() => {
		return budgetItems.value.filter((item) => item.status === 'critical' || item.status === 'over-budget');
	});

	/**
	 * Get over-budget items
	 */
	const overBudgetItems = computed(() => {
		return budgetItems.value.filter((item) => item.status === 'over-budget');
	});

	/**
	 * Get at-risk items (80-90% spent)
	 */
	const atRiskItems = computed(() => {
		return budgetItems.value.filter((item) => item.status === 'at-risk');
	});

	/**
	 * Get under-utilized items (less than 25% spent)
	 */
	const underUtilizedItems = computed(() => {
		return budgetItems.value.filter((item) => item.status === 'under-utilized');
	});

	/**
	 * Generate budget alerts
	 */
	const budgetAlerts = computed(() => {
		const alerts = [];

		// Over-budget alerts
		overBudgetItems.value.forEach((item) => {
			alerts.push({
				type: 'over-budget',
				severity: 'critical',
				title: `${item.description} Over Budget`,
				message: `Spent $${item.actualCost.toLocaleString()} of $${item.yearly.toLocaleString()} budget (${item.percentSpent.toFixed(
					1,
				)}%)`,
				item: item.id,
			});
		});

		// Critical spending alerts
		atRiskItems.value.forEach((item) => {
			alerts.push({
				type: 'at-risk',
				severity: 'high',
				title: `${item.description} Nearing Budget Limit`,
				message: `${item.percentSpent.toFixed(1)}% of budget used with $${item.remaining.toLocaleString()} remaining`,
				item: item.id,
			});
		});

		return alerts.sort((a, b) => {
			const severityOrder = { critical: 3, high: 2, medium: 1, low: 0 };
			return severityOrder[b.severity] - severityOrder[a.severity];
		});
	});

	/**
	 * Generate budget projections
	 */
	const generateProjections = (monthsElapsed = 6) => {
		return budgetItems.value.map((item) => {
			const monthlySpendRate = item.actualCost / monthsElapsed;
			const projectedYearEnd = monthlySpendRate * 12;
			const projectedOverage = Math.max(0, projectedYearEnd - item.yearly);

			return {
				...item,
				monthlySpendRate,
				projectedYearEnd,
				projectedOverage,
				projectedStatus: projectedYearEnd > item.yearly ? 'over-budget' : 'on-track',
			};
		});
	};

	/**
	 * Search items by description or category
	 */
	const searchItems = (query) => {
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
	const getItemsByCategory = (category) => {
		return budgetItems.value.filter((item) => item.category === category);
	};

	/**
	 * Export budget data
	 */
	const exportBudgetData = (format = 'json') => {
		const data = budgetItems.value;

		if (format === 'csv') {
			const headers = [
				'Description',
				'Category',
				'Annual Budget',
				'Actual Cost',
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
		loadOperatingBudget, // This is the missing function that was causing the error!
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
