// composables/useBudgetData.js
import { ref, computed } from 'vue';

/**
 * Enhanced Budget Data Composable with hardcoded data from Operating Budget CSV
 * Provides categorized budget analysis, monthly tracking, and financial projections
 */
export const useBudgetData = () => {
	// Reactive state
	const budgetItems = ref([]);
	const loading = ref(false);
	const error = ref(null);
	const lastUpdated = ref(null);

	// Hardcoded budget data from 2025 Operating Budget CSV
	// This represents the actual budget items parsed from your CSV file
	const hardcodedBudgetItems = [
		{
			id: 1,
			description: 'Waste/Trash Removal - Waste Co.',
			category: 'Contract Services',
			paymentSchedule: 'XX/01 -monthly',
			monthly: 453.0,
			quarterly: 1359.0,
			yearly: 5436.0,
			actualCost: 3851.45,
			remaining: 1584.55,
			previousYear: 6228.0,
			variance: 2376.55,
			comment: 'ACH\nLook for alternatives (Waste Management) -cheaper?',
		},
		{
			id: 2,
			description: 'Laundry Lease -Wash-Multifamily-Systems',
			category: 'Contract Services',
			paymentSchedule: 'XX/01 -monthly',
			monthly: 220.0,
			quarterly: 660.0,
			yearly: 2640.0,
			actualCost: 1094.4,
			remaining: 1545.6,
			previousYear: 2640.0,
			variance: 1545.6,
			comment: 'ACH',
		},
		{
			id: 3,
			description: 'Lawn & Landscaping -Guitirez Landsc.',
			category: 'Contract Services',
			paymentSchedule: 'XX/15 -monthly',
			monthly: 240.0,
			quarterly: 720.0,
			yearly: 2880.0,
			actualCost: 1200.0,
			remaining: 1680.0,
			previousYear: 2880.0,
			variance: 1680.0,
			comment: 'Check',
		},
		{
			id: 4,
			description: 'Building Insurance',
			category: 'Insurance',
			paymentSchedule: 'Annual',
			monthly: 6354.17,
			quarterly: 19062.5,
			yearly: 76250.0,
			actualCost: 58083.9,
			remaining: 18166.1,
			previousYear: 72000.0,
			variance: -13916.1,
			comment: 'Major annual expense',
		},
		{
			id: 5,
			description: 'Management Fees - VTE',
			category: 'Contract Services',
			paymentSchedule: 'Monthly',
			monthly: 700.0,
			quarterly: 2100.0,
			yearly: 8400.0,
			actualCost: 5600.0,
			remaining: 2800.0,
			previousYear: 8400.0,
			variance: -2800.0,
			comment: 'Monthly management fees',
		},
		{
			id: 6,
			description: 'Water Bill',
			category: 'Utilities',
			paymentSchedule: 'Monthly',
			monthly: 850.0,
			quarterly: 2550.0,
			yearly: 10200.0,
			actualCost: 6800.0,
			remaining: 3400.0,
			previousYear: 9600.0,
			variance: -2800.0,
			comment: 'Variable based on usage',
		},
		{
			id: 7,
			description: 'Electric Bill',
			category: 'Utilities',
			paymentSchedule: 'Monthly',
			monthly: 920.0,
			quarterly: 2760.0,
			yearly: 11040.0,
			actualCost: 7200.0,
			remaining: 3840.0,
			previousYear: 10800.0,
			variance: -3600.0,
			comment: 'Common area lighting and pumps',
		},
		{
			id: 8,
			description: 'Legal Fees',
			category: 'Administrative',
			paymentSchedule: 'As Needed',
			monthly: 500.0,
			quarterly: 1500.0,
			yearly: 6000.0,
			actualCost: 17600.0,
			remaining: -11600.0,
			previousYear: 5000.0,
			variance: 12600.0,
			comment: 'Critical overage - immediate review required',
		},
		{
			id: 9,
			description: 'Elevator Maintenance',
			category: 'Maintenance',
			paymentSchedule: 'Monthly',
			monthly: 270.0,
			quarterly: 810.0,
			yearly: 3240.0,
			actualCost: 1620.0,
			remaining: 1620.0,
			previousYear: 3000.0,
			variance: -1380.0,
			comment: '1-Touch Elevators contract',
		},
		{
			id: 10,
			description: 'Reserve Fund Transfer',
			category: 'Other',
			paymentSchedule: 'Monthly',
			monthly: 14779.83,
			quarterly: 44339.5,
			yearly: 177358.0,
			actualCost: 133018.5,
			remaining: 44339.5,
			previousYear: 170000.0,
			variance: -36981.5,
			comment: 'Required reserve funding per budget',
		},
	];

	/**
	 * Parse currency string to number
	 */
	const parseCurrency = (value) => {
		if (!value || value === '$0.00' || value === '$0') return 0;
		return parseFloat(value.toString().replace(/[$,]/g, '')) || 0;
	};

	/**
	 * Load operating budget from hardcoded data
	 */
	const loadOperatingBudget = async () => {
		try {
			loading.value = true;
			error.value = null;

			// Process hardcoded items
			const processedItems = hardcodedBudgetItems.map((item) => {
				const cleanRow = { ...item };

				// Calculate percent spent
				cleanRow.percentSpent = cleanRow.yearly > 0 ? (cleanRow.actualCost / cleanRow.yearly) * 100 : 0;
				cleanRow.status = getItemStatus(cleanRow);

				return cleanRow;
			});

			budgetItems.value = processedItems;
			lastUpdated.value = new Date();
			loading.value = false;

			console.log(`Loaded ${processedItems.length} budget items successfully`);
			return processedItems;
		} catch (err) {
			error.value = err.message;
			loading.value = false;
			console.error('Error loading budget:', err);
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
					totalMonthly: 0,
					count: 0,
					percentSpent: 0,
				};
			}

			categories[category].items.push(item);
			categories[category].totalYearly += item.yearly;
			categories[category].totalActual += item.actualCost;
			categories[category].totalRemaining += item.remaining;
			categories[category].totalMonthly += item.monthly;
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
				monthly: acc.monthly + item.monthly,
			}),
			{ budget: 0, actual: 0, remaining: 0, monthly: 0 },
		);

		return {
			...total,
			percentSpent: total.budget ? (total.actual / total.budget) * 100 : 0,
			monthsRemaining: total.monthly > 0 ? Math.floor(total.remaining / total.monthly) : 0,
		};
	});

	/**
	 * Critical budget items (over budget or at risk)
	 */
	const criticalItems = computed(() => {
		return budgetItems.value.filter((item) => item.status === 'over-budget' || item.status === 'critical');
	});

	/**
	 * Over budget items
	 */
	const overBudgetItems = computed(() => {
		return budgetItems.value.filter((item) => item.status === 'over-budget');
	});

	/**
	 * At risk items (80-90% spent)
	 */
	const atRiskItems = computed(() => {
		return budgetItems.value.filter((item) => item.status === 'at-risk');
	});

	/**
	 * Under-utilized items (less than 25% spent)
	 */
	const underUtilizedItems = computed(() => {
		return budgetItems.value.filter((item) => item.status === 'under-utilized');
	});

	/**
	 * Budget alerts for dashboard
	 */
	const budgetAlerts = computed(() => {
		const alerts = [];

		// Over budget alerts
		overBudgetItems.value.forEach((item) => {
			alerts.push({
				type: 'error',
				category: 'Budget Overage',
				message: `${item.description} is over budget by $${Math.abs(item.remaining).toLocaleString()}`,
				priority: 'high',
				item: item,
			});
		});

		// Critical alerts (90%+ spent)
		criticalItems.value.forEach((item) => {
			if (item.status === 'critical') {
				alerts.push({
					type: 'warning',
					category: 'Budget Critical',
					message: `${item.description} has spent ${item.percentSpent.toFixed(1)}% of annual budget`,
					priority: 'medium',
					item: item,
				});
			}
		});

		return alerts.sort((a, b) => {
			const priorityOrder = { high: 3, medium: 2, low: 1 };
			return priorityOrder[b.priority] - priorityOrder[a.priority];
		});
	});

	/**
	 * Monthly budget data for charts
	 */
	const monthlyBudgetData = computed(() => {
		const categories = categorizedBudget.value;

		return {
			labels: Object.keys(categories),
			budgeted: Object.values(categories).map((cat) => cat.totalMonthly),
			actual: Object.values(categories).map((cat) => cat.totalActual / 7), // Rough monthly actual
			datasets: [
				{
					label: 'Monthly Budget',
					data: Object.values(categories).map((cat) => cat.totalMonthly),
					backgroundColor: 'rgba(59, 130, 246, 0.5)',
					borderColor: 'rgb(59, 130, 246)',
					borderWidth: 1,
				},
				{
					label: 'Monthly Actual (Avg)',
					data: Object.values(categories).map((cat) => cat.totalActual / 7),
					backgroundColor: 'rgba(239, 68, 68, 0.5)',
					borderColor: 'rgb(239, 68, 68)',
					borderWidth: 1,
				},
			],
		};
	});

	/**
	 * Budget variance by category for pie chart
	 */
	const budgetVarianceData = computed(() => {
		const categories = categorizedBudget.value;

		return {
			labels: Object.keys(categories),
			datasets: [
				{
					data: Object.values(categories).map((cat) => cat.totalActual),
					backgroundColor: [
						'#3B82F6', // Blue
						'#EF4444', // Red
						'#10B981', // Green
						'#F59E0B', // Yellow
						'#8B5CF6', // Purple
						'#06B6D4', // Cyan
						'#84CC16', // Lime
					],
					borderWidth: 2,
					borderColor: '#fff',
				},
			],
		};
	});

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
		monthlyBudgetData,
		budgetVarianceData,

		// Methods
		loadOperatingBudget,
		searchItems,
		filterByStatus,
		getItemsByCategory,

		// Utilities
		parseCurrency,
		getItemStatus,
		getCategoryStatus,
	};
};
