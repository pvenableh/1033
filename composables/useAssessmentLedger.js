// composables/useAssessmentLedger.js
// Assessment delinquency tracking and aging reports for HOA units

export const useAssessmentLedger = () => {
	const assessmentLedgerCollection = useDirectusItems('assessment_ledger');
	const unitsCollection = useDirectusItems('units');
	const transactionsCollection = useDirectusItems('transactions');
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
	const ledgerEntries = ref([]);
	const units = ref([]);

	// Configuration
	const config = {
		lateFeePercent: 0.10, // 10% late fee
		lateFeeFlat: 25, // Or flat $25 late fee
		gracePeriodDays: 15,
		delinquentDays: 30,
		lienThresholdDays: 90,
		collectionsThresholdDays: 180,
	};

	// Fetch all units
	const fetchUnits = async () => {
		try {
			const data = await unitsCollection.list({
				filter: { status: { _eq: 'published' } },
				sort: ['number'],
				fields: ['*', 'people.*'],
			});
			units.value = data || [];
		} catch (e) {
			console.error('Error fetching units:', e);
			units.value = [];
		}
	};

	// Fetch ledger entries for a fiscal year
	const fetchLedgerEntries = async (fiscalYear, unitId = null) => {
		loading.value = true;
		error.value = null;

		try {
			const filter = { fiscal_year: { year: { _eq: fiscalYear } } };

			if (unitId) {
				filter.unit_id = { _eq: unitId };
			}

			const data = await assessmentLedgerCollection.list({
				filter,
				sort: ['unit_id', 'month'],
				fields: ['*', 'unit_id.*', 'transaction_id.*'],
			});

			ledgerEntries.value = data || [];
		} catch (e) {
			error.value = e.message || 'Error fetching ledger entries';
			console.error('Error fetching ledger entries:', e);
			ledgerEntries.value = [];
		} finally {
			loading.value = false;
		}
	};

	// Create a ledger entry
	const createLedgerEntry = async (entryData) => {
		saving.value = true;
		error.value = null;

		try {
			const fiscalYearId = await resolveFiscalYearId(entryData.fiscal_year);
			if (!fiscalYearId) {
				throw new Error(`No fiscal year record found for ${entryData.fiscal_year}. Create it in Directus first.`);
			}

			const result = await assessmentLedgerCollection.create({
				unit_id: entryData.unit_id,
				fiscal_year: fiscalYearId,
				month: entryData.month,
				amount_due: entryData.amount_due,
				amount_paid: entryData.amount_paid || 0,
				payment_date: entryData.payment_date,
				due_date: entryData.due_date,
				late_fee: entryData.late_fee || 0,
				payment_status: entryData.payment_status || 'current',
				days_past_due: entryData.days_past_due || 0,
				transaction_id: entryData.transaction_id,
				notes: entryData.notes,
				status: 'published',
			});

			return result;
		} catch (e) {
			error.value = e.message || 'Error creating ledger entry';
			throw e;
		} finally {
			saving.value = false;
		}
	};

	// Update a ledger entry
	const updateLedgerEntry = async (entryId, updates) => {
		saving.value = true;
		error.value = null;

		try {
			const result = await assessmentLedgerCollection.update(entryId, updates);
			return result;
		} catch (e) {
			error.value = e.message || 'Error updating ledger entry';
			throw e;
		} finally {
			saving.value = false;
		}
	};

	// Record a payment
	const recordPayment = async (entryId, paymentData) => {
		const entry = ledgerEntries.value.find((e) => e.id === entryId);
		if (!entry) throw new Error('Ledger entry not found');

		const amountDue = parseFloat(entry.amount_due) || 0;
		const lateFee = parseFloat(entry.late_fee) || 0;
		const totalDue = amountDue + lateFee;
		const amountPaid = parseFloat(paymentData.amount_paid) || 0;

		let paymentStatus = 'current';
		if (amountPaid < totalDue) {
			paymentStatus = 'late'; // Partial payment
		}

		return updateLedgerEntry(entryId, {
			amount_paid: amountPaid,
			payment_date: paymentData.payment_date || new Date().toISOString(),
			payment_status: paymentStatus,
			days_past_due: 0,
			transaction_id: paymentData.transaction_id,
			notes: paymentData.notes,
		});
	};

	// Calculate days past due
	const calculateDaysPastDue = (dueDate) => {
		if (!dueDate) return 0;
		const due = new Date(dueDate);
		const today = new Date();
		const diffTime = today - due;
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		return Math.max(0, diffDays);
	};

	// Determine payment status based on days past due
	const determinePaymentStatus = (daysPastDue, amountPaid, amountDue) => {
		if (amountPaid >= amountDue) return 'current';
		if (daysPastDue <= 0) return 'current';
		if (daysPastDue <= config.delinquentDays) return 'late';
		if (daysPastDue <= config.lienThresholdDays) return 'deliquent';
		if (daysPastDue <= config.collectionsThresholdDays) return 'lien';
		return 'collections';
	};

	// Calculate late fee
	const calculateLateFee = (amountDue, daysPastDue) => {
		if (daysPastDue <= config.gracePeriodDays) return 0;

		// Use percentage or flat fee (whichever is greater, or configure as needed)
		const percentFee = amountDue * config.lateFeePercent;
		return Math.max(percentFee, config.lateFeeFlat);
	};

	// Update all ledger entries with current status
	const updateAllStatuses = async (fiscalYear) => {
		saving.value = true;
		const updates = [];

		for (const entry of ledgerEntries.value) {
			const amountDue = parseFloat(entry.amount_due) || 0;
			const amountPaid = parseFloat(entry.amount_paid) || 0;

			if (amountPaid >= amountDue) continue; // Already paid

			const daysPastDue = calculateDaysPastDue(entry.due_date);
			const newStatus = determinePaymentStatus(daysPastDue, amountPaid, amountDue);
			const lateFee = calculateLateFee(amountDue - amountPaid, daysPastDue);

			if (entry.payment_status !== newStatus || entry.days_past_due !== daysPastDue) {
				updates.push(
					updateLedgerEntry(entry.id, {
						payment_status: newStatus,
						days_past_due: daysPastDue,
						late_fee: lateFee,
					})
				);
			}
		}

		await Promise.all(updates);
		await fetchLedgerEntries(fiscalYear);
		saving.value = false;
	};

	// Generate monthly assessments for all units
	const generateMonthlyAssessments = async (fiscalYear, month, assessmentAmount, dueDate) => {
		saving.value = true;
		error.value = null;

		try {
			const createdEntries = [];

			for (const unit of units.value) {
				// Check if entry already exists
				// Entries are already filtered by fiscal year, just check unit and month
				const existing = ledgerEntries.value.find(
					(e) => {
						const unitId = typeof e.unit_id === 'object' ? e.unit_id?.id : e.unit_id;
						return unitId === unit.id && e.month === month;
					}
				);

				if (!existing) {
					const entry = await createLedgerEntry({
						unit_id: unit.id,
						fiscal_year: fiscalYear,
						month,
						amount_due: assessmentAmount,
						amount_paid: 0,
						due_date: dueDate,
						payment_status: 'current',
						days_past_due: 0,
					});
					createdEntries.push(entry);
				}
			}

			await fetchLedgerEntries(fiscalYear);
			return createdEntries;
		} catch (e) {
			error.value = e.message || 'Error generating assessments';
			throw e;
		} finally {
			saving.value = false;
		}
	};

	// Get delinquent accounts
	const delinquentAccounts = computed(() => {
		return ledgerEntries.value.filter(
			(e) => e.payment_status === 'deliquent' ||
				e.payment_status === 'lien' ||
				e.payment_status === 'collections'
		);
	});

	// Get aging report
	const agingReport = computed(() => {
		const report = {
			current: { count: 0, amount: 0, entries: [] },
			'1-30': { count: 0, amount: 0, entries: [] },
			'31-60': { count: 0, amount: 0, entries: [] },
			'61-90': { count: 0, amount: 0, entries: [] },
			'90+': { count: 0, amount: 0, entries: [] },
		};

		for (const entry of ledgerEntries.value) {
			const amountDue = parseFloat(entry.amount_due) || 0;
			const amountPaid = parseFloat(entry.amount_paid) || 0;
			const lateFee = parseFloat(entry.late_fee) || 0;
			const balance = amountDue + lateFee - amountPaid;

			if (balance <= 0) continue;

			const daysPastDue = entry.days_past_due || 0;
			let bucket;

			if (daysPastDue <= 0) {
				bucket = 'current';
			} else if (daysPastDue <= 30) {
				bucket = '1-30';
			} else if (daysPastDue <= 60) {
				bucket = '31-60';
			} else if (daysPastDue <= 90) {
				bucket = '61-90';
			} else {
				bucket = '90+';
			}

			report[bucket].count++;
			report[bucket].amount += balance;
			report[bucket].entries.push({ ...entry, balance });
		}

		return report;
	});

	// Get unit ledger summary
	const getUnitSummary = (unitId) => {
		const unitEntries = ledgerEntries.value.filter(
			(e) => (typeof e.unit_id === 'object' ? e.unit_id?.id : e.unit_id) === unitId
		);

		const totalDue = unitEntries.reduce(
			(sum, e) => sum + (parseFloat(e.amount_due) || 0) + (parseFloat(e.late_fee) || 0),
			0
		);
		const totalPaid = unitEntries.reduce(
			(sum, e) => sum + (parseFloat(e.amount_paid) || 0),
			0
		);
		const balance = totalDue - totalPaid;

		const delinquentMonths = unitEntries.filter(
			(e) => e.payment_status !== 'current' && (parseFloat(e.amount_paid) || 0) < (parseFloat(e.amount_due) || 0)
		).length;

		return {
			unitId,
			totalDue,
			totalPaid,
			balance,
			delinquentMonths,
			entries: unitEntries,
			isDelinquent: balance > 0 && delinquentMonths > 0,
		};
	};

	// Get all units with balances
	const unitsWithBalances = computed(() => {
		return units.value.map((unit) => ({
			...unit,
			...getUnitSummary(unit.id),
		}));
	});

	// Get total outstanding balance
	const totalOutstandingBalance = computed(() => {
		return Object.values(agingReport.value).reduce(
			(sum, bucket) => sum + bucket.amount,
			0
		);
	});

	// Payment status options
	const paymentStatusOptions = [
		{ label: 'Current', value: 'current', color: 'green' },
		{ label: 'Late (1-30 days)', value: 'late', color: 'yellow' },
		{ label: 'Delinquent (31-90 days)', value: 'deliquent', color: 'orange' },
		{ label: 'Lien Filed', value: 'lien', color: 'red' },
		{ label: 'Collections', value: 'collections', color: 'purple' },
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
		ledgerEntries: readonly(ledgerEntries),
		units: readonly(units),
		config,

		// Fetch
		fetchUnits,
		fetchLedgerEntries,

		// CRUD
		createLedgerEntry,
		updateLedgerEntry,
		recordPayment,

		// Batch operations
		updateAllStatuses,
		generateMonthlyAssessments,

		// Calculations
		calculateDaysPastDue,
		determinePaymentStatus,
		calculateLateFee,
		getUnitSummary,

		// Computed
		delinquentAccounts,
		agingReport,
		unitsWithBalances,
		totalOutstandingBalance,

		// Options
		paymentStatusOptions,

		// Helpers
		formatCurrency,
	};
};
