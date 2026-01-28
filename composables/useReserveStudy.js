// composables/useReserveStudy.js
// Reserve study tracking and funding projections for HOA

export const useReserveStudy = () => {
	const reserveStudiesCollection = useDirectusItems('reserve_studies');
	const reserveComponentsCollection = useDirectusItems('reserve_components');
	const accountsCollection = useDirectusItems('accounts');
	const monthlyStatementsCollection = useDirectusItems('monthly_statements');
	const fiscalYearsCollection = useDirectusItems('fiscal_years');

	// Cache: year number → fiscal_years record ID
	const fiscalYearIdCache = {};

	// Helper: resolve year number to fiscal_years record ID
	const resolveFiscalYearId = async (yearNumber) => {
		if (fiscalYearIdCache[yearNumber]) return fiscalYearIdCache[yearNumber];
		const data = await fiscalYearsCollection.list({
			filter: { year: { _eq: yearNumber } },
			fields: ['id'],
			limit: 1,
		});
		const id = data && data.length > 0 ? data[0].id : null;
		if (id) fiscalYearIdCache[yearNumber] = id;
		return id;
	};

	// State
	const loading = ref(false);
	const saving = ref(false);
	const error = ref(null);
	const currentStudy = ref(null);
	const components = ref([]);
	const reserveAccountBalance = ref(0);

	// Constants
	const RESERVE_ACCOUNT_ID = 2; // Account 7011 - Reserve Account

	// Fetch current reserve study
	const fetchCurrentStudy = async (fiscalYear) => {
		loading.value = true;
		error.value = null;

		try {
			const data = await reserveStudiesCollection.list({
				filter: { fiscal_year: { year: { _eq: fiscalYear } } },
				fields: ['*'],
				limit: 1,
			});

			currentStudy.value = data && data.length > 0 ? data[0] : null;

			if (currentStudy.value) {
				await fetchComponents(currentStudy.value.id);
			}
		} catch (e) {
			error.value = e.message || 'Error fetching reserve study';
			console.error('Error fetching reserve study:', e);
		} finally {
			loading.value = false;
		}
	};

	// Fetch components for a study
	const fetchComponents = async (studyId) => {
		try {
			const data = await reserveComponentsCollection.list({
				filter: { reserve_study_id: { _eq: studyId } },
				sort: ['replacement_year', 'name'],
				fields: ['*'],
			});

			components.value = data || [];
		} catch (e) {
			console.error('Error fetching components:', e);
			components.value = [];
		}
	};

	// Fetch current reserve account balance
	const fetchReserveBalance = async (fiscalYear) => {
		try {
			const statements = await monthlyStatementsCollection.list({
				filter: {
					fiscal_year: { year: { _eq: fiscalYear } },
					account_id: { _eq: RESERVE_ACCOUNT_ID },
				},
				sort: ['-statement_month'],
				fields: ['ending_balance', 'statement_month'],
				limit: 1,
			});

			reserveAccountBalance.value = statements && statements.length > 0
				? parseFloat(statements[0].ending_balance) || 0
				: 0;
		} catch (e) {
			console.error('Error fetching reserve balance:', e);
			reserveAccountBalance.value = 0;
		}
	};

	// Create a new reserve study
	const createStudy = async (studyData) => {
		saving.value = true;
		error.value = null;

		try {
			const fiscalYearId = await resolveFiscalYearId(studyData.fiscal_year);
			if (!fiscalYearId) {
				throw new Error(`No fiscal year record found for ${studyData.fiscal_year}. Create it in Directus first.`);
			}

			const result = await reserveStudiesCollection.create({
				fiscal_year: fiscalYearId,
				study_date: studyData.study_date || new Date().toISOString().split('T')[0],
				current_balance: studyData.current_balance || 0,
				recommended_balance: studyData.recommended_balance || 0,
				percent_funded: studyData.percent_funded || 0,
				annual_contribution: studyData.annual_contribution || 0,
				monthly_contribution_per_unit: studyData.monthly_contribution_per_unit || 0,
				notes: studyData.notes,
				status: 'published',
			});

			currentStudy.value = result;
			return result;
		} catch (e) {
			error.value = e.message || 'Error creating reserve study';
			throw e;
		} finally {
			saving.value = false;
		}
	};

	// Update reserve study
	const updateStudy = async (studyId, updates) => {
		saving.value = true;
		error.value = null;

		try {
			const result = await reserveStudiesCollection.update(studyId, updates);
			currentStudy.value = result;
			return result;
		} catch (e) {
			error.value = e.message || 'Error updating reserve study';
			throw e;
		} finally {
			saving.value = false;
		}
	};

	// Create a reserve component
	const createComponent = async (componentData) => {
		saving.value = true;
		error.value = null;

		try {
			const result = await reserveComponentsCollection.create({
				reserve_study_id: componentData.reserve_study_id || currentStudy.value?.id,
				name: componentData.name,
				category: componentData.category,
				useful_life_years: componentData.useful_life_years,
				remaining_life_years: componentData.remaining_life_years,
				placed_in_service_year: componentData.placed_in_service_year,
				replacement_year: componentData.replacement_year,
				replacement_cost: componentData.replacement_cost,
				condition: componentData.condition,
				last_inspection_date: componentData.last_inspection_date,
				notes: componentData.notes,
				status: 'published',
			});

			await fetchComponents(currentStudy.value?.id);
			return result;
		} catch (e) {
			error.value = e.message || 'Error creating component';
			throw e;
		} finally {
			saving.value = false;
		}
	};

	// Update a component
	const updateComponent = async (componentId, updates) => {
		saving.value = true;
		error.value = null;

		try {
			const result = await reserveComponentsCollection.update(componentId, updates);
			await fetchComponents(currentStudy.value?.id);
			return result;
		} catch (e) {
			error.value = e.message || 'Error updating component';
			throw e;
		} finally {
			saving.value = false;
		}
	};

	// Delete a component
	const deleteComponent = async (componentId) => {
		saving.value = true;
		error.value = null;

		try {
			await reserveComponentsCollection.remove(componentId);
			await fetchComponents(currentStudy.value?.id);
		} catch (e) {
			error.value = e.message || 'Error deleting component';
			throw e;
		} finally {
			saving.value = false;
		}
	};

	// Calculate funding projections
	const calculateFundingProjections = (years = 30) => {
		const currentYear = new Date().getFullYear();
		const projections = [];

		let runningBalance = reserveAccountBalance.value;
		const annualContribution = parseFloat(currentStudy.value?.annual_contribution) || 0;

		for (let i = 0; i < years; i++) {
			const year = currentYear + i;

			// Get components due for replacement this year
			const replacementsDue = components.value.filter(
				(c) => parseInt(c.replacement_year) === year
			);

			const replacementCosts = replacementsDue.reduce(
				(sum, c) => sum + (parseFloat(c.replacement_cost) || 0),
				0
			);

			// Calculate year-end balance
			const beginningBalance = runningBalance;
			const contributions = annualContribution;
			const expenditures = replacementCosts;
			const endingBalance = beginningBalance + contributions - expenditures;

			projections.push({
				year,
				beginningBalance,
				contributions,
				expenditures,
				endingBalance,
				replacementsDue: replacementsDue.map((c) => ({
					name: c.name,
					cost: c.replacement_cost,
				})),
				isDeficit: endingBalance < 0,
			});

			runningBalance = endingBalance;
		}

		return projections;
	};

	// Get components by category
	const componentsByCategory = computed(() => {
		const grouped = {};

		for (const component of components.value) {
			const category = component.category || 'other';
			if (!grouped[category]) {
				grouped[category] = [];
			}
			grouped[category].push(component);
		}

		return grouped;
	});

	// Get components due within N years
	const getUpcomingReplacements = (years = 5) => {
		const currentYear = new Date().getFullYear();
		const cutoffYear = currentYear + years;

		return components.value
			.filter((c) => {
				const replacementYear = parseInt(c.replacement_year);
				return replacementYear >= currentYear && replacementYear <= cutoffYear;
			})
			.sort((a, b) => parseInt(a.replacement_year) - parseInt(b.replacement_year));
	};

	// Get critical components (poor/critical condition or due soon)
	const criticalComponents = computed(() => {
		const currentYear = new Date().getFullYear();

		return components.value.filter((c) => {
			const condition = c.condition;
			const replacementYear = parseInt(c.replacement_year);

			return (
				condition === 'poor' ||
				condition === 'critical' ||
				(replacementYear && replacementYear <= currentYear + 2)
			);
		});
	});

	// Calculate total replacement costs
	const totalReplacementCosts = computed(() => {
		return components.value.reduce(
			(sum, c) => sum + (parseFloat(c.replacement_cost) || 0),
			0
		);
	});

	// Calculate percent funded
	const percentFunded = computed(() => {
		const recommended = parseFloat(currentStudy.value?.recommended_balance) || 0;
		if (recommended <= 0) return 0;
		return Math.round((reserveAccountBalance.value / recommended) * 100);
	});

	// Get funding status
	const fundingStatus = computed(() => {
		const percent = percentFunded.value;

		if (percent >= 70) {
			return { status: 'healthy', label: 'Well Funded', color: 'green' };
		} else if (percent >= 50) {
			return { status: 'adequate', label: 'Adequately Funded', color: 'yellow' };
		} else if (percent >= 30) {
			return { status: 'underfunded', label: 'Underfunded', color: 'orange' };
		} else {
			return { status: 'critical', label: 'Critically Underfunded', color: 'red' };
		}
	});

	// Component category options
	const categoryOptions = [
		{ label: 'Building Structure', value: 'building' },
		{ label: 'Mechanical Systems', value: 'mechanical' },
		{ label: 'Electrical Systems', value: 'electrical' },
		{ label: 'Plumbing Systems', value: 'plumbing' },
		{ label: 'Exterior/Facade', value: 'exterior' },
		{ label: 'Common Areas', value: 'common_area' },
		{ label: 'Safety/Fire', value: 'safety' },
		{ label: 'Other', value: 'other' },
	];

	// Condition options
	const conditionOptions = [
		{ label: 'Excellent', value: 'excellent', color: 'green' },
		{ label: 'Good', value: 'good', color: 'blue' },
		{ label: 'Fair', value: 'fair', color: 'yellow' },
		{ label: 'Poor', value: 'poor', color: 'orange' },
		{ label: 'Critical', value: 'critical', color: 'red' },
	];

	// Format currency
	const formatCurrency = (amount) => {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
		}).format(parseFloat(amount) || 0);
	};

	return {
		// State
		loading,
		saving,
		error,
		currentStudy: readonly(currentStudy),
		components: readonly(components),
		reserveAccountBalance: readonly(reserveAccountBalance),

		// Fetch
		fetchCurrentStudy,
		fetchComponents,
		fetchReserveBalance,

		// CRUD - Study
		createStudy,
		updateStudy,

		// CRUD - Components
		createComponent,
		updateComponent,
		deleteComponent,

		// Calculations
		calculateFundingProjections,
		getUpcomingReplacements,

		// Computed
		componentsByCategory,
		criticalComponents,
		totalReplacementCosts,
		percentFunded,
		fundingStatus,

		// Options
		categoryOptions,
		conditionOptions,

		// Helpers
		formatCurrency,
	};
};
