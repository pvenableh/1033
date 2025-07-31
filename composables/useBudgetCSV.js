// composables/useBudgetCSV.js
import { ref } from 'vue';
import Papa from 'papaparse';

export const useBudgetCSV = () => {
	const budgetData = ref([]);
	const loading = ref(false);
	const error = ref(null);

	/**
	 * Load and parse CSV file from public directory
	 */
	const loadBudgetCSV = async (filename = '2025-operating-budget.csv') => {
		try {
			loading.value = true;
			error.value = null;

			// Fetch CSV from public/data directory
			const response = await fetch(`/data/${filename}`);

			if (!response.ok) {
				throw new Error(`Failed to load ${filename}: ${response.statusText}`);
			}

			const csvContent = await response.text();

			// Parse CSV content
			const result = await parseCSVContent(csvContent);
			budgetData.value = result;

			return result;
		} catch (err) {
			error.value = err.message;
			console.error('Error loading CSV:', err);
			throw err;
		} finally {
			loading.value = false;
		}
	};

	/**
	 * Parse CSV content and clean data
	 */
	const parseCSVContent = async (csvContent) => {
		// Skip first line if it contains title
		const lines = csvContent.split('\n');
		const hasTitle = lines[0].includes('Payments & Expenses Projection');
		const dataContent = hasTitle ? lines.slice(1).join('\n') : csvContent;

		return new Promise((resolve, reject) => {
			Papa.parse(dataContent, {
				header: true,
				dynamicTyping: false,
				skipEmptyLines: true,
				complete: (results) => {
					try {
						const cleanedData = processBudgetData(results.data);
						resolve(cleanedData);
					} catch (err) {
						reject(err);
					}
				},
				error: (error) => {
					reject(new Error(`CSV parsing error: ${error.message}`));
				},
			});
		});
	};

	/**
	 * Process and clean budget data
	 */
	const processBudgetData = (rawData) => {
		const parseCurrency = (value) => {
			if (!value || value === '$0.00' || value === '$0') return 0;
			return parseFloat(value.toString().replace(/[$,]/g, '')) || 0;
		};

		return rawData
			.filter((row) => row.Description && row.Description !== 'Description' && row.Description.trim() !== '')
			.map((row) => ({
				id: `${row.Description}-${row.Classification || 'other'}`.replace(/[^\w-]/g, ''),
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
				comment: row.Comment || '',
				percentSpent: 0,
				status: 'unknown',
			}))
			.filter((item) => item.yearly > 0) // Only items with budget
			.map((item) => ({
				...item,
				percentSpent: (item.actualCost / item.yearly) * 100,
				status: getItemStatus(item),
			}));
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
	 * Watch for file changes and reload (development feature)
	 */
	const watchForChanges = (filename, intervalMs = 30000) => {
		if (process.client && process.dev) {
			const interval = setInterval(() => {
				loadBudgetCSV(filename).catch(console.error);
			}, intervalMs);

			// Cleanup function
			return () => clearInterval(interval);
		}
		return () => {};
	};

	return {
		budgetData,
		loading,
		error,
		loadBudgetCSV,
		parseCSVContent,
		watchForChanges,
	};
};
