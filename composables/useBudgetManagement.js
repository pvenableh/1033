// composables/useBudgetManagement.js
// Dynamic budget management with year support for HOA financial reporting

export const useBudgetManagement = () => {
	const budgetCategoriesCollection = useDirectusItems('budget_categories');
	const budgetItemsCollection = useDirectusItems('budget_items');
	const fiscalYearBudgetsCollection = useDirectusItems('fiscal_year_budgets');
	const budgetAmendmentsCollection = useDirectusItems('budget_amendments');

	// Reactive state
	const selectedYear = ref(new Date().getFullYear());
	const loading = ref(false);
	const error = ref(null);
	const saving = ref(false);

	// Data stores
	const availableYears = ref([]);
	const fiscalYearBudget = ref(null);
	const budgetCategories = ref([]);
	const budgetItems = ref([]);
	const budgetAmendments = ref([]);

	// Default budget template (based on 2025 budget)
	const defaultBudgetTemplate = {
		categories: [
			{
				category_name: 'Insurance',
				color: '#3B82F6',
				description: 'Building and flood insurance premiums',
			},
			{
				category_name: 'Professional',
				color: '#8B5CF6',
				description: 'Management, legal, CPA, and professional services',
			},
			{
				category_name: 'Utilities',
				color: '#10B981',
				description: 'Water, electric, gas, internet services',
			},
			{
				category_name: 'Maintenance',
				color: '#F59E0B',
				description: 'Janitorial, landscaping, repairs, elevator service',
			},
			{
				category_name: 'Regulatory',
				color: '#EF4444',
				description: 'Permits, licenses, certifications',
			},
			{
				category_name: 'Banking',
				color: '#6B7280',
				description: 'Bank fees and charges',
			},
			{
				category_name: 'Other',
				color: '#9CA3AF',
				description: 'Miscellaneous expenses',
			},
		],
	};

	// Helper function to safely parse numbers
	const safeParseFloat = (value) => {
		if (value === null || value === undefined || value === '') return 0;
		const parsed = parseFloat(value);
		return isNaN(parsed) ? 0 : parsed;
	};

	// Fetch available fiscal years
	const fetchAvailableYears = async () => {
		try {
			// Get years from fiscal_year_budgets collection
			const budgets = await fiscalYearBudgetsCollection.list({
				fields: ['fiscal_year'],
				sort: ['-fiscal_year'],
			});

			// Also get years from budget_categories as fallback
			const categories = await budgetCategoriesCollection.list({
				fields: ['fiscal_year'],
				sort: ['-fiscal_year'],
			});

			const yearsSet = new Set();

			// Add years from budgets
			if (budgets && Array.isArray(budgets)) {
				budgets.forEach((b) => {
					if (b.fiscal_year) yearsSet.add(b.fiscal_year);
				});
			}

			// Add years from categories
			if (categories && Array.isArray(categories)) {
				categories.forEach((c) => {
					if (c.fiscal_year) yearsSet.add(c.fiscal_year);
				});
			}

			// Ensure current year and next year are available
			const currentYear = new Date().getFullYear();
			yearsSet.add(currentYear);
			yearsSet.add(currentYear + 1);

			availableYears.value = Array.from(yearsSet).sort((a, b) => b - a);
		} catch (e) {
			console.error('Error fetching available years:', e);
			const currentYear = new Date().getFullYear();
			availableYears.value = [currentYear + 1, currentYear, currentYear - 1];
		}
	};

	// Fetch fiscal year budget configuration
	const fetchFiscalYearBudget = async () => {
		try {
			const year = unref(selectedYear);
			const data = await fiscalYearBudgetsCollection.list({
				filter: {
					fiscal_year: { _eq: year },
				},
				fields: ['*'],
				limit: 1,
			});

			fiscalYearBudget.value = data && data.length > 0 ? data[0] : null;
		} catch (e) {
			console.error('Error fetching fiscal year budget:', e);
			fiscalYearBudget.value = null;
		}
	};

	// Fetch budget categories for selected year
	const fetchBudgetCategories = async () => {
		try {
			const year = unref(selectedYear);
			const data = await budgetCategoriesCollection.list({
				filter: {
					fiscal_year: { _eq: year },
				},
				sort: ['sort', 'category_name'],
				fields: ['*'],
			});

			budgetCategories.value = data || [];
		} catch (e) {
			console.error('Error fetching budget categories:', e);
			budgetCategories.value = [];
		}
	};

	// Fetch budget items for selected year
	const fetchBudgetItems = async () => {
		try {
			const year = unref(selectedYear);
			const data = await budgetItemsCollection.list({
				filter: {
					fiscal_year: { _eq: year },
				},
				sort: ['category_id', 'sort', 'description'],
				fields: ['*', 'category_id.*'],
			});

			budgetItems.value = data || [];
		} catch (e) {
			console.error('Error fetching budget items:', e);
			budgetItems.value = [];
		}
	};

	// Fetch all budget data for the selected year
	const fetchBudgetData = async () => {
		loading.value = true;
		error.value = null;

		try {
			await Promise.all([
				fetchAvailableYears(),
				fetchFiscalYearBudget(),
				fetchBudgetCategories(),
				fetchBudgetItems(),
			]);
			// Fetch amendments after fiscal year budget is loaded (needs the ID)
			await fetchBudgetAmendments();
		} catch (e) {
			error.value = e.message || 'Error fetching budget data';
			console.error('Error fetching budget data:', e);
		} finally {
			loading.value = false;
		}
	};

	// Create a new fiscal year budget
	const createFiscalYearBudget = async (budgetData) => {
		saving.value = true;
		error.value = null;

		try {
			const result = await fiscalYearBudgetsCollection.create({
				fiscal_year: budgetData.fiscal_year,
				name: budgetData.name || `${budgetData.fiscal_year} Operating Budget`,
				is_active: budgetData.is_active ?? true,
				total_revenue: budgetData.total_revenue || 0,
				total_expenses: budgetData.total_expenses || 0,
				net_operating: budgetData.net_operating || 0,
				unit_count: budgetData.unit_count || 28,
				monthly_assessment: budgetData.monthly_assessment || 0,
				status: 'published',
			});

			await fetchBudgetData();
			return result;
		} catch (e) {
			error.value = e.message || 'Error creating fiscal year budget';
			console.error('Error creating fiscal year budget:', e);
			throw e;
		} finally {
			saving.value = false;
		}
	};

	// Update fiscal year budget
	const updateFiscalYearBudget = async (id, updates) => {
		saving.value = true;
		error.value = null;

		try {
			const result = await fiscalYearBudgetsCollection.update(id, updates);
			await fetchFiscalYearBudget();
			return result;
		} catch (e) {
			error.value = e.message || 'Error updating fiscal year budget';
			console.error('Error updating fiscal year budget:', e);
			throw e;
		} finally {
			saving.value = false;
		}
	};

	// Create a budget category
	const createBudgetCategory = async (categoryData) => {
		saving.value = true;
		error.value = null;

		try {
			const year = categoryData.fiscal_year || unref(selectedYear);
			const result = await budgetCategoriesCollection.create({
				fiscal_year: year,
				fiscal_year_budget_id: fiscalYearBudget.value?.id || null,
				category_name: categoryData.category_name,
				monthly_budget: categoryData.monthly_budget || 0,
				yearly_budget: categoryData.yearly_budget || 0,
				color: categoryData.color || '#6B7280',
				description: categoryData.description || '',
				status: 'published',
			});

			await fetchBudgetCategories();
			return result;
		} catch (e) {
			error.value = e.message || 'Error creating budget category';
			console.error('Error creating budget category:', e);
			throw e;
		} finally {
			saving.value = false;
		}
	};

	// Update a budget category
	const updateBudgetCategory = async (id, updates) => {
		saving.value = true;
		error.value = null;

		try {
			const result = await budgetCategoriesCollection.update(id, updates);
			await fetchBudgetCategories();
			return result;
		} catch (e) {
			error.value = e.message || 'Error updating budget category';
			console.error('Error updating budget category:', e);
			throw e;
		} finally {
			saving.value = false;
		}
	};

	// Delete a budget category
	const deleteBudgetCategory = async (id) => {
		saving.value = true;
		error.value = null;

		try {
			await budgetCategoriesCollection.remove(id);
			await fetchBudgetCategories();
		} catch (e) {
			error.value = e.message || 'Error deleting budget category';
			console.error('Error deleting budget category:', e);
			throw e;
		} finally {
			saving.value = false;
		}
	};

	// Create a budget item
	const createBudgetItem = async (itemData) => {
		saving.value = true;
		error.value = null;

		try {
			const year = itemData.fiscal_year || unref(selectedYear);
			const result = await budgetItemsCollection.create({
				fiscal_year: year,
				fiscal_year_budget_id: fiscalYearBudget.value?.id || null,
				item_code: itemData.item_code,
				description: itemData.description,
				category_id: itemData.category_id,
				monthly_budget: itemData.monthly_budget || 0,
				yearly_budget: itemData.yearly_budget || 0,
				vendor_patterns: itemData.vendor_patterns || [],
				keywords: itemData.keywords || [],
				status: 'published',
			});

			await fetchBudgetItems();
			return result;
		} catch (e) {
			error.value = e.message || 'Error creating budget item';
			console.error('Error creating budget item:', e);
			throw e;
		} finally {
			saving.value = false;
		}
	};

	// Update a budget item
	const updateBudgetItem = async (id, updates) => {
		saving.value = true;
		error.value = null;

		try {
			const result = await budgetItemsCollection.update(id, updates);
			await fetchBudgetItems();
			return result;
		} catch (e) {
			error.value = e.message || 'Error updating budget item';
			console.error('Error updating budget item:', e);
			throw e;
		} finally {
			saving.value = false;
		}
	};

	// Delete a budget item
	const deleteBudgetItem = async (id) => {
		saving.value = true;
		error.value = null;

		try {
			await budgetItemsCollection.remove(id);
			await fetchBudgetItems();
		} catch (e) {
			error.value = e.message || 'Error deleting budget item';
			console.error('Error deleting budget item:', e);
			throw e;
		} finally {
			saving.value = false;
		}
	};

	// Copy budget from one year to another
	const copyBudgetToYear = async (sourceYear, targetYear) => {
		saving.value = true;
		error.value = null;

		try {
			// Fetch source budget data
			const sourceCategories = await budgetCategoriesCollection.list({
				filter: { fiscal_year: { _eq: sourceYear } },
				fields: ['*'],
			});

			const sourceItems = await budgetItemsCollection.list({
				filter: { fiscal_year: { _eq: sourceYear } },
				fields: ['*'],
			});

			const sourceBudget = await fiscalYearBudgetsCollection.list({
				filter: { fiscal_year: { _eq: sourceYear } },
				fields: ['*'],
				limit: 1,
			});

			// Create target fiscal year budget
			let newBudgetId = null;
			if (sourceBudget && sourceBudget.length > 0) {
				const newBudget = await fiscalYearBudgetsCollection.create({
					...sourceBudget[0],
					id: undefined,
					fiscal_year: targetYear,
					name: `${targetYear} Operating Budget`,
					is_active: false,
					approved_date: null,
					approved_by: null,
				});
				newBudgetId = newBudget?.id || null;
			}

			// Create category mapping (old ID -> new ID)
			const categoryMapping = {};

			// Copy categories
			for (const category of sourceCategories || []) {
				const newCategory = await budgetCategoriesCollection.create({
					fiscal_year: targetYear,
					fiscal_year_budget_id: newBudgetId,
					category_name: category.category_name,
					monthly_budget: category.monthly_budget,
					yearly_budget: category.yearly_budget,
					color: category.color,
					description: category.description,
					status: 'published',
				});
				categoryMapping[category.id] = newCategory.id;
			}

			// Copy items with updated category references
			for (const item of sourceItems || []) {
				await budgetItemsCollection.create({
					fiscal_year: targetYear,
					fiscal_year_budget_id: newBudgetId,
					item_code: item.item_code,
					description: item.description,
					category_id: categoryMapping[item.category_id] || null,
					monthly_budget: item.monthly_budget,
					yearly_budget: item.yearly_budget,
					vendor_patterns: item.vendor_patterns,
					keywords: item.keywords,
					status: 'published',
				});
			}

			// Refresh data
			await fetchAvailableYears();
			selectedYear.value = targetYear;
			await fetchBudgetData();

			return { success: true, message: `Budget copied from ${sourceYear} to ${targetYear}` };
		} catch (e) {
			error.value = e.message || 'Error copying budget';
			console.error('Error copying budget:', e);
			throw e;
		} finally {
			saving.value = false;
		}
	};

	// Create budget from template
	const createBudgetFromTemplate = async (year) => {
		saving.value = true;
		error.value = null;

		try {
			// Create fiscal year budget
			const newBudget = await fiscalYearBudgetsCollection.create({
				fiscal_year: year,
				name: `${year} Operating Budget`,
				is_active: false,
				total_revenue: 0,
				total_expenses: 0,
				net_operating: 0,
				unit_count: 28,
				monthly_assessment: 0,
				status: 'published',
			});
			const newBudgetId = newBudget?.id || null;

			// Create default categories
			for (const category of defaultBudgetTemplate.categories) {
				await budgetCategoriesCollection.create({
					fiscal_year: year,
					fiscal_year_budget_id: newBudgetId,
					category_name: category.category_name,
					monthly_budget: 0,
					yearly_budget: 0,
					color: category.color,
					description: category.description,
					status: 'published',
				});
			}

			// Refresh data
			await fetchAvailableYears();
			selectedYear.value = year;
			await fetchBudgetData();

			return { success: true, message: `Budget template created for ${year}` };
		} catch (e) {
			error.value = e.message || 'Error creating budget from template';
			console.error('Error creating budget from template:', e);
			throw e;
		} finally {
			saving.value = false;
		}
	};

	// Fetch budget amendments for selected year
	const fetchBudgetAmendments = async () => {
		try {
			if (!fiscalYearBudget.value?.id) {
				budgetAmendments.value = [];
				return;
			}

			const data = await budgetAmendmentsCollection.list({
				filter: {
					fiscal_year_budget_id: { _eq: fiscalYearBudget.value.id },
				},
				sort: ['-effective_date'],
				fields: ['*', 'budget_item_id.*', 'approved_by.first_name', 'approved_by.last_name'],
			});

			budgetAmendments.value = data || [];
		} catch (e) {
			console.error('Error fetching budget amendments:', e);
			budgetAmendments.value = [];
		}
	};

	// Create a budget amendment (e.g., insurance rate change mid-year)
	const createBudgetAmendment = async (amendmentData) => {
		saving.value = true;
		error.value = null;

		try {
			if (!fiscalYearBudget.value?.id) {
				throw new Error('No fiscal year budget found for the selected year');
			}

			// Find the budget item to get original amounts
			const budgetItem = budgetItems.value.find(
				(item) => item.id === amendmentData.budget_item_id
			);

			if (!budgetItem) {
				throw new Error('Budget item not found');
			}

			const result = await budgetAmendmentsCollection.create({
				fiscal_year_budget_id: fiscalYearBudget.value.id,
				budget_item_id: amendmentData.budget_item_id,
				effective_date: amendmentData.effective_date,
				original_annual_amount: safeParseFloat(budgetItem.yearly_budget),
				amended_annual_amount: safeParseFloat(amendmentData.amended_annual_amount),
				original_monthly_amount: safeParseFloat(budgetItem.monthly_budget),
				amended_monthly_amount: safeParseFloat(amendmentData.amended_monthly_amount),
				reason: amendmentData.reason,
				amendment_type: amendmentData.amendment_type || 'rate_change',
				supporting_document: amendmentData.supporting_document || null,
				board_meeting_reference: amendmentData.board_meeting_reference || null,
				is_approved: false,
				status: 'published',
			});

			await fetchBudgetAmendments();
			return result;
		} catch (e) {
			error.value = e.message || 'Error creating budget amendment';
			console.error('Error creating budget amendment:', e);
			throw e;
		} finally {
			saving.value = false;
		}
	};

	// Approve a budget amendment and update the budget item amounts
	const approveBudgetAmendment = async (amendmentId, approvedBy) => {
		saving.value = true;
		error.value = null;

		try {
			const amendment = budgetAmendments.value.find((a) => a.id === amendmentId);
			if (!amendment) {
				throw new Error('Amendment not found');
			}

			// Approve the amendment
			await budgetAmendmentsCollection.update(amendmentId, {
				is_approved: true,
				approved_by: approvedBy,
				approved_date: new Date().toISOString(),
			});

			// Update the budget item with the amended amounts
			const itemId =
				typeof amendment.budget_item_id === 'object'
					? amendment.budget_item_id.id
					: amendment.budget_item_id;

			await budgetItemsCollection.update(itemId, {
				yearly_budget: amendment.amended_annual_amount,
				monthly_budget: amendment.amended_monthly_amount || amendment.amended_annual_amount / 12,
			});

			// Recalculate category totals
			await recalculateCategoryTotals();

			await Promise.all([fetchBudgetItems(), fetchBudgetAmendments()]);
			return { success: true };
		} catch (e) {
			error.value = e.message || 'Error approving amendment';
			console.error('Error approving amendment:', e);
			throw e;
		} finally {
			saving.value = false;
		}
	};

	// Recalculate category budget totals from their items
	const recalculateCategoryTotals = async () => {
		for (const category of budgetCategories.value) {
			const categoryItems = budgetItems.value.filter((item) => {
				const catId = typeof item.category_id === 'object' ? item.category_id?.id : item.category_id;
				return catId === category.id;
			});

			const totalMonthly = categoryItems.reduce((sum, item) => sum + safeParseFloat(item.monthly_budget), 0);
			const totalYearly = categoryItems.reduce((sum, item) => sum + safeParseFloat(item.yearly_budget), 0);

			await budgetCategoriesCollection.update(category.id, {
				monthly_budget: totalMonthly,
				yearly_budget: totalYearly,
			});
		}
	};

	// Get the effective budget amount for a budget item at a given date
	// Accounts for amendments that have been approved before that date
	const getEffectiveBudgetAmount = (budgetItemId, asOfDate = new Date()) => {
		const item = budgetItems.value.find((i) => i.id === budgetItemId);
		if (!item) return { monthly: 0, yearly: 0 };

		// Find approved amendments for this item, sorted by effective date
		const itemAmendments = budgetAmendments.value
			.filter((a) => {
				const aItemId = typeof a.budget_item_id === 'object' ? a.budget_item_id.id : a.budget_item_id;
				return aItemId === budgetItemId && a.is_approved;
			})
			.sort((a, b) => new Date(a.effective_date) - new Date(b.effective_date));

		// Find the most recent amendment effective on or before asOfDate
		const applicableAmendment = itemAmendments
			.filter((a) => new Date(a.effective_date) <= new Date(asOfDate))
			.pop();

		if (applicableAmendment) {
			return {
				monthly: safeParseFloat(applicableAmendment.amended_monthly_amount),
				yearly: safeParseFloat(applicableAmendment.amended_annual_amount),
				amendedOn: applicableAmendment.effective_date,
				reason: applicableAmendment.reason,
			};
		}

		return {
			monthly: safeParseFloat(item.monthly_budget),
			yearly: safeParseFloat(item.yearly_budget),
		};
	};

	// Get amendment history for a specific budget item
	const getAmendmentHistory = (budgetItemId) => {
		return budgetAmendments.value
			.filter((a) => {
				const aItemId = typeof a.budget_item_id === 'object' ? a.budget_item_id.id : a.budget_item_id;
				return aItemId === budgetItemId;
			})
			.sort((a, b) => new Date(a.effective_date) - new Date(b.effective_date));
	};

	// Computed: Items with pending amendments
	const itemsWithPendingAmendments = computed(() => {
		const pendingIds = new Set();
		budgetAmendments.value
			.filter((a) => !a.is_approved)
			.forEach((a) => {
				const itemId = typeof a.budget_item_id === 'object' ? a.budget_item_id.id : a.budget_item_id;
				pendingIds.add(itemId);
			});
		return budgetItems.value.filter((item) => pendingIds.has(item.id));
	});

	// Computed: Get budget items grouped by category
	const itemsByCategory = computed(() => {
		const grouped = {};

		for (const category of budgetCategories.value) {
			grouped[category.id] = {
				...category,
				items: budgetItems.value.filter((item) => {
					const categoryId =
						typeof item.category_id === 'object' ? item.category_id?.id : item.category_id;
					return categoryId === category.id;
				}),
			};
		}

		return grouped;
	});

	// Computed: Calculate budget totals
	const budgetTotals = computed(() => {
		const totalMonthlyExpenses = budgetCategories.value.reduce(
			(sum, cat) => sum + safeParseFloat(cat.monthly_budget),
			0
		);
		const totalYearlyExpenses = budgetCategories.value.reduce(
			(sum, cat) => sum + safeParseFloat(cat.yearly_budget),
			0
		);

		const fiscalBudget = fiscalYearBudget.value || {};

		return {
			monthlyExpenses: totalMonthlyExpenses,
			yearlyExpenses: totalYearlyExpenses,
			monthlyRevenue: safeParseFloat(fiscalBudget.total_revenue) / 12,
			yearlyRevenue: safeParseFloat(fiscalBudget.total_revenue),
			monthlyNet: safeParseFloat(fiscalBudget.total_revenue) / 12 - totalMonthlyExpenses,
			yearlyNet: safeParseFloat(fiscalBudget.total_revenue) - totalYearlyExpenses,
			unitCount: safeParseFloat(fiscalBudget.unit_count) || 28,
			monthlyAssessment: safeParseFloat(fiscalBudget.monthly_assessment),
		};
	});

	// Computed: Year options for dropdown
	const yearOptions = computed(() => {
		return availableYears.value.map((year) => ({
			label: year.toString(),
			value: year,
		}));
	});

	// Format currency helper
	const formatCurrency = (amount) => {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
		}).format(safeParseFloat(amount));
	};

	// Watch for year changes
	watch(selectedYear, async () => {
		await fetchBudgetData();
	});

	return {
		// State
		selectedYear,
		loading,
		error,
		saving,

		// Data
		availableYears: readonly(availableYears),
		fiscalYearBudget: readonly(fiscalYearBudget),
		budgetCategories: readonly(budgetCategories),
		budgetItems: readonly(budgetItems),
		budgetAmendments: readonly(budgetAmendments),

		// Computed
		itemsByCategory,
		budgetTotals,
		yearOptions,
		itemsWithPendingAmendments,

		// Methods - Fetch
		fetchBudgetData,
		fetchAvailableYears,

		// Methods - Fiscal Year Budget
		createFiscalYearBudget,
		updateFiscalYearBudget,

		// Methods - Categories
		createBudgetCategory,
		updateBudgetCategory,
		deleteBudgetCategory,

		// Methods - Items
		createBudgetItem,
		updateBudgetItem,
		deleteBudgetItem,

		// Methods - Amendments
		createBudgetAmendment,
		approveBudgetAmendment,
		getEffectiveBudgetAmount,
		getAmendmentHistory,

		// Methods - Copy/Template
		copyBudgetToYear,
		createBudgetFromTemplate,

		// Helpers
		formatCurrency,
		safeParseFloat,
		defaultBudgetTemplate,
	};
};
